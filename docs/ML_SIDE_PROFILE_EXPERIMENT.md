# Balance Lab — side-profile animation/ML motor-control experiment

Status: **EXPERIMENTAL FOUNDATION; no trained policy accepted or deployed**.

## Decision: preserve a side-view character, including future combat

The rig remains an articulated **2D sagittal-plane side profile** with two physically separate legs and arms. The view is not a blocker for learning whole-body balance. It constrains the available motion space: forward/back stepping, crouching, falling, arm reach, aiming and recoil in the screen plane are representable; yaw, depth movement, shoulder twisting out of plane and depth-direction weapon strikes are **not**. Do not imply this 2D experiment reproduces full 3D Euphoria-style behavior.

Treat the character as a **gameplay actor**, not an uprightness-maximizing puppet. Locomotion, crouching, prone, aiming, firing, reloading, melee, climbing, falling and getting up must remain legal intents. Physics decides the realized motion. A balance policy must not fight an intentional crouch, aim or fall. The ML controller should learn *how to execute the active intent under disturbance*, not overwrite the intent.

## Architecture and authority

1. **Gameplay/AI/player** selects `createCharacterIntent({activity,move,aim,stance,handUse,load,guard})` and reference animation. Weapon and equipment state will later determine hand ownership, mass, attachment and recoil; those are **not implemented** by this experiment.
2. **Animation** supplies desired joint targets; recovery and contact-aware reflexes retain higher priority for protected joints.
3. **Learned controller** reads measured torso orientation and angular velocity, COM velocity and capture displacement, true foot contacts, all joint angles and speeds, animation target poses, and explicit task/hand-use signals. Features use character-facing local coordinates, so mirroring does not change policy semantics.
4. **Policy output** is 12 bounded, dimensionless joint-target *residuals* (hips, knees, ankles, shoulders, elbows, wrists). These are converted to no more than 0.18 rad residuals (wrists ≤0.08 rad), clipped inside joint limits. A zero output is physically inert and creates no new motor ownership. A physical step's protected joints cannot be overridden by the policy.
5. **Actuator/Planck** applies existing finite-torque motors, collisions and gravity. The ML policy never changes body transforms, impulses, contact state or joint forces directly. The existing fixed 120 Hz physics simulation remains authoritative. Training is separate and never implicitly installs an experimental policy into the playable character.

### Combat-ready joint ownership

- `handUse:'left'|'right'|'both'` reserves the corresponding shoulder/elbow/wrist targets for animation, weapon IK and grip mechanics; learned balance may still stabilize hips, knees and ankles. Future priority ordering: **physical contacts and joint limits > explicit equipment constraints and IK > safety/recovery stepping > learned residuals > idle animation**. Contacts cannot be fabricated by any layer.
- Combat-specific action objectives must be conditioned on the task: standing during aim, bracing against recoil, tolerating intentional crouch/prone, moving the center of mass during melee, and not forcibly returning to neutral during knockdown. A weapon's recoil will be a physically bounded force applied through its actual attachment, **not** an artificial pose kick.
- Render limbs in consistent near/far depth layers for visual readability while maintaining two distinct collision and grip chains. Later weapon sprites, attachment frames, muzzle direction, aim limits and hitboxes must match the physical hands. No weapons or combat mechanics are claimed to exist yet.
- Do not add a second controller that writes physical transforms or a separate player/AI skeleton. The existing Planck rig is the only authority.

## Initial executable experiment (ML0)

- `src/ml/side-profile-policy.mjs`: immutable task intent, stable observation/action schema, finite small MLP inference, arm-ownership and step-priority arbitration.
- `src/ml/linear-policy.mjs`: low-compute trainable tanh-linear policy, explicit feature indices and weight validation. This is an *experiment*, not a humanlike balance model.
- `adapters/active-planck-v6.mjs`: `setLearnedMotorPolicy(policy|null)`, `setCharacterIntent(intent)`, `getLearnedDiagnostics()`; default remains unchanged.
- `scripts/train-side-profile-es.mjs`: reproducible seeded evolutionary-strategy search in actual headless Planck with train and held-out perturbations. Output is a JSON experiment report; no auto-activation or deploy. This is not PPO and does not yet learn from motion clips. The objective is deliberately provisional.
- `tests/side-profile-policy.test.mjs`: input validation, zero-output snapshot parity, action bounds, hand ownership, stepping priority and severe-force overpowerability.

## Required next research gates

**ML1 — diagnose support and establish valid physical objectives.** Quantify knee-buckling episodes (joint angles, commanded motor torque, foot contact, center-of-mass, solver iterations) on both facings, in idle and after tiny shoves. Verify animation commands and solver constraints are not causing collapse before training. Build reward terms for stable posture, realistic bending, contact continuity, low motor work, non-jitter and intentional task completion. Avoid reward shortcuts such as a permanently stiff squat.

**ML2 — train a balance policy.** Use parallel randomized scenarios and a proper continuous-control algorithm (PPO candidate), actual Planck joint motors, reproducible seeds, held-out shoves, randomized masses/friction and two facing orientations. Compare learned against unchanged deterministic baseline. Reject models that fail idle stance, severe-force fall, grip interruption or physical realism gates.

**ML3 — learn animation tracking with disturbance.** Introduce reference clips for idle, locomotion, crouch, aim, fire/recoil and reaching; train a task-conditioned policy to follow them while allowing external forces to overpower the body. Include explicit hands-occupied constraints and actual physical attachments. No claim of learned animation quality until measured and visually reviewed.

**ML4 — mobile and gameplay integration.** Export a compact versioned model with schema hash, deterministic inference and zero-allocation target. Compare combined inference+physics+render cost against the 60 FPS iPhone 16 target on physical Safari. Opt-in A/B switch, baseline preserved; no automatic public deployment. User visual/art approval required.

## Go/no-go

Do not replace the rule-based controller until the learned policy improves *held-out* recovery or whole-body behavior, maintains all current physical acceptance gates, handles intentional crouch/aim without fighting animation, and passes physical iPhone Safari performance and interaction QA. Document failed training runs as failures rather than silently shipping the latest weights.

## ML0 first run — 2026-10-20

Executed `node scripts/train-side-profile-es.mjs --generations=6 --population=12 --ticks=300 --seed=12020 --out=/tmp/bl-ml-6x12.json` against actual Planck, with four training and four held-out disturbance scenarios. **No candidate improved the baseline**: train score 11.05281265 vs 11.05281265, holdout score 10.97984899 vs 10.97984899, zero falls in both. The search retained its zero-weight baseline. This is a reproducible **training-pipeline smoke test**, not a learned balance success. The objective and scenarios are too easy for the current deterministic controller; ML1 must supply informative failure cases and a realistic task-conditioned reward before scaling training.

`node scripts/diagnose-knee-buckling.mjs` ran ten seconds per scenario across both facings, with no shove and ±1/±3 N·s torso impulses. The measured maximum absolute knee joint angle was approximately 0.10 rad (canonical) and below 0.06 rad (mirrored), torso height remained near 1.36 m, and no unnecessary steps were recorded. **The reported visible knee buckling was not reproduced in this headless active-rig configuration.** This does not invalidate the user's observation: the browser rendering, pointer drag state, animation target changes, or other conditions may be different. Capture the exact browser/runtime reproduction before attributing it to ML or changing physics.

The first ML gate is therefore **ML0 PROTOTYPE COMPLETE / ML1 PENDING**, with no trained weights accepted, no default behavior change, and no deployment. Realistic combat-ready control remains a design requirement, not a completed combat implementation.
