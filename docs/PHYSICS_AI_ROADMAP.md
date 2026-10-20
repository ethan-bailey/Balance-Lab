# BALANCE LAB — Side-Profile Physics-Driven Character & Reactive AI Roadmap
Version 1.1 · 2026-10-20 · Side-profile character and gameplay execution guide
Status: APPROVED DIRECTION FROM USER; technical gates remain evidence-driven.

**Current project identity:** `docs/PROJECT_CHARTER.md`. This is the development plan for a **single 2D side-profile physically simulated character** with animation, balance, player control, equipment and future combat. Earlier A0–A8 experiments are reusable engineering milestones, not a separate toy or a different product. ML0–ML4 is an opt-in research track within this same character, not a new engine.

## 0. North star and scope
Build an original, responsive 2D articulated character that *tries* to act human under physical forces: maintain balance, walk, resist touch, brace, fall, get up, and express intention through animation while conserving authentic mass, contacts, momentum and vulnerability. Euphoria is a behavioral quality reference, not a proprietary technology dependency or a claim of equivalence.

**Invariant:** behavior intent -> animation/skill reference poses + reflex/balance corrections -> bounded per-joint muscle/motor commands -> Planck 1.5.1 solver -> sensors -> behavior. The simulated body is the ONLY authoritative pose. No root teleport, feet magnet, direct animation body transforms, infinite-force drag, cosmetic-only recovery, or fabricated sensor outcome. Prefer physical failure over hidden correction.

### Relation to original MASTER_PLAN.md (do not silently replace)
- Original M0–M2 baseline, solver and approved art gates remain intact. M2 physical Safari and user art approval remain PENDING.
- Original M3 drag/flick = A1 prerequisites, M4 COM/balance = A2 prerequisites, M5 active muscles = A1/A3/A4, M6 character polish = A5/A6, M7 mobile = A7, M8 biomechanical research = A8.
- Original M6 called for “animation-free personality behaviors”; NEW project direction supersedes **that clause only**: original, license-safe authored motion references blended into physical muscles are now required. Record this amendment instead of quietly treating old and new goals as simultaneously authoritative.
- Existing stable preview and accepted rollback stay untouched until a fully checked release gate. Keep legacy passive adapter unchanged as comparison baseline; v6 active adapter is a prototype, not production acceptance.
- Separate canonical rig numerical stability from no-creep, and separate Node tests from browser/iPhone acceptance.

## 1. Workstream milestones (A0 through A8)
Each task has a stable ID. Do not begin dependent merge work until its listed gate passes. Parallel research and isolated experiments are permissible. Every task requires source commit + unit/integration evidence, limitations, and rollback location.

### A0 — Baseline, control interfaces and reproducibility
Dependencies: none. Objective: ensure one shared definition of pose, sensors, and acceptance.
- A0.1 Inventory current rig joints, joint order, collision groups, motor limits, mass/inertia and existing passive/active adapter versions; preserve untracked work.
- A0.2 Record canonical signed coordinate conventions, neutral reference pose, joint-local angle offsets, world/body transforms, units (radians, N·m, seconds), fixed 1/120 s step.
- A0.3 Define versioned contracts: SensorFrame (COM, velocity, contacts/normals, torso and head state, joint pos/velocity, joint limits); PoseFrame (per-joint desired angles and velocities); MuscleFrame (stiffness, damping, max force/torque and blend weights); BehaviorIntent; EventFrame.
- A0.4 Add reusable deterministic stepping/replay harness with input event timestamps, seed and physics engine version; no dependency on DOM for controller unit tests.
- A0.5 Implement observability traces for motor saturation, injected work, contact impulses, support margin, recovery phase, score/status transitions, step CPU time and nonfinite states.
- **Gate A0:** every joint/coordinate contract has executable tests; replay same recorded 120Hz input gives identical state and event sequence; no changed browser output or regressions; existing outstanding gates explicitly retained.

### A1 — Animation-to-muscle interface (foundation)
Dependencies: A0.
- A1.1 Implement data-driven, immutable PoseFrame and keyframe sampler for joint-local angle, velocity and optional reference timing, without writing to physics bodies.
- A1.2 Implement independent bounded PD motor per joint (correct relative-joint angle and angular velocity; limit guard; gain clamp; optional max angular speed) integrated with Planck motor APIs.
- A1.3 Apply strength and compliance by physical context, e.g., torso/hips strongly resist mild disturbance; wrists yield; big impacts temporarily weaken groups; no global stiffness spike.
- A1.4 Add cyclic interpolation for angles, time-consistent cross-fade weights, transition interruption and invalid/NaN input rejection.
- A1.5 Implement neutral idle, crouch and reach *reference motions* using original authored values (not copied assets); verify same target can be overpowered under an external force.
- A1.6 Separate the joint control module from solver adapter so browser and Node call the same code. Version gate before retiring prototypes.
- **Gate A1:** crossfade and interrupt create no discontinuous body pose or motor command jump; impulses can physically overpower target; obey torque limits and joint limits; reference sampler deterministic; Node and browser parity; existing T01–T04 do not regress.

### A2 — Whole-body balance and real corrective stepping
Dependencies: A1 plus existing contact sensing.
- A2.1 Extend support estimator from feet-only projected COM to valid-contact weighted support, COM velocity, predicted capture point (only when physically meaningful), torso angular momentum.
- A2.2 Implement ankle/hip reflex controller with bounded torque; separate expected gait motion from unexpected displacement; avoid net-energy injection from integral windup.
- A2.3 Introduce swing/stance leg selection, reachable step targets and step phase; advance *only via actual swing and contact*, not coordinate snapping.
- A2.4 Detect step failure and transition to stumble/fall, including asymmetry and redirected second step when physics requires.
- A2.5 Maintain stable no-input stance for 60 s and 600 s; medium shoves produce observable **real foot displacement** and renewed support; severe shoves can still floor the character.
- **Gate A2:** deterministic bidirectional impulse sweep; light catch and medium shove steps physically, no stepping-by-state-label-only; measure foot lift/contact, joint work and fall rates; T01/T05/T06/T07 pass across both initial facing orientations and browser/Node.

### A3 — Protective and contact-aware reflexes
Dependencies: A1/A2 and real limb contact sensing.
- A3.1 Add contact manifold classification for hands, forearms, knees, feet, torso and head, with ground normal/impulse thresholds.
- A3.2 Predict hazardous descent from head/torso velocity, fall direction and time-to-contact; target reachable bracing hands and protective head posture.
- A3.3 Reduce muscle strength immediately following serious impact, then ramp back according to contact and physiological-free fatigue budget (not health simulation).
- A3.4 Add response priorities: preserve grasp physics, protect head, catch with hand, regain foot support; abort reflex if physically blocked.
- **Gate A3:** face-first/side/back falls show actual arm contacts (not merely pose targets); no arm teleport, impossible strength or contact-dependent jitter; bracing reduces head impact in comparative bounded scenarios, without preventing all falls.

### A4 — Physical get-up and interruption
Dependencies: A3.
- A4.1 Recognize fallen supports and body orientation with hysteresis (torso height, angular velocity, head/hip support and contacts). Do not label low body as standing.
- A4.2 Author reference pose phases: roll/turn, plant hand, push onto knee, shift COM over foot, extend to stand; select viable side from observed contacts.
- A4.3 Advance phases by observed support/torque capability, with progress timeout and retry/failure logic; never schedule success solely by elapsed animation.
- A4.4 Every phase interruptible by a drag, impact, loss of hand support or changed fall orientation; state resumes from sensed pose, not stale keyframe time.
- A4.5 Tune rise speed, joint compliance and energy for natural but responsive motion, including low-strength failed attempts.
- **Gate A4:** deterministic supine/prone/side and interrupted-recovery tests; stable standing for >=3 s after successful recovery; unsupported scenarios must report failure rather than fake upright pose.

### A5 — Physically correct grabbing and force resistance
Dependencies: A1/A2; can be developed in parallel with A3/A4 after A1.
- A5.1 Bind pointer at exact hit-local body anchor, not center; compliant capped-force joint; preserve body-to-body momentum and all anatomical constraints.
- A5.2 Set grip onset easing, damping and force based on picked segment effective mass; maintain responsive motion without solver blowup at 120Hz.
- A5.3 Integrate active resistance by limb and context: soft pull -> core re-centers; medium pull -> feet shift; strong pull -> dragged/flipped. Resist only if support exists; gripping in air must not create arbitrary force against world.
- A5.4 Use one authoritative pointer and cancellation lifecycle: canceled/interrupted touches detach without fling; release preserves actual simulated velocity without double-impulse unless explicitly enabled and separately validated.
- A5.5 Test yank, slow drag, wrist/foot/head/torso grab, mid-get-up grab, alternating drags, orientation change and offscreen release.
- **Gate A5:** local anchor follows within tuned lag, no impossible extension/foot sticking, no sudden velocity discontinuity on release, and expected fall for large yank; all mobile pointer cancellation regressions pass.

### A6 — Behavior arbitration and animation blending
Dependencies: A1–A5.
- A6.1 Create hierarchical intent selection: idle, locomote, curious/attend, resist, avoid, brace, tumble, recover; priorities and interruption semantics declared in one deterministic controller.
- A6.2 Combine weighted reference motions with additive reaction offsets *before* muscle actuation; blend by joint group and strength envelope.
- A6.3 Add motion phase synchronization at contacts (foot plant, step completion, hand bracing), not pure wall-clock blending.
- A6.4 Add active attention/reaching/anticipation using existing physical constraints; lightweight personality variation parameterized and deterministically seeded.
- A6.5 Prevent policy thrash through dwell/hysteresis, but guarantee urgent safety reactions can interrupt any intent.
- **Gate A6:** fixed multi-action replay (walk -> push -> catch -> grab -> release -> fall -> rise) has continuous physical joints, coherent state transitions and deterministic results; no direct animations writing world transforms.

### A7 — Character, interaction quality and iPhone release
Dependencies: A0–A6. Physical device validation is not waivable.
- A7.1 Use original user-approved character art; match visible limbs with hitboxes, joint anchors and hand reach; silhouettes readable on iPhone 16 portrait.
- A7.2 Profile solver, collision broadphase, contact allocation, pose interpolation and rendering; fixed-step accumulator with bounded catch-up, visual interpolation, pause/resume handling and battery/thermal monitoring.
- A7.3 Validate touch-targeting, portrait/landscape, device rotation, 60Hz render target / 120Hz physics feasibility, memory stability, accessibility and sustained interaction on physical iPhone Safari.
- A7.4 Cross-platform browser vs pinned Node deterministic event parity, regression gate, documented known failures and preview smoke test; user playtest feel feedback (soft/grabby, stable-but-not-sticky, pleasing fall/catch).
- A7.5 Only after all acceptance gates, deploy one verified candidate; retain prior rollback deployment ID and URL.
- **Gate A7:** physical Safari and user art approval explicitly PASS; measured p95 frame duration fits 60fps target or documented negotiated device-specific target; no solver NaNs, leaks or unhandled pointer capture; release checklist signed with evidence.

### A8 — Research and future 3D evolution (post-core, independent)
Dependencies: stable architecture A0/A1; may research in parallel but not block 2D quality.
- A8.1 Evaluate whether the 2D control contracts generalize to 3D inertial, articulated, full-rotation hips, joints and contacts; identify where capture-point assumptions break.
- A8.2 Prototype alternate control policy / offline learned skill from *licensed/original* motion examples, with deterministic fallback and inference-cost budgets.
- A8.3 Compare quality vs complexity, iPhone runtime cost and maintenance of 2D/3D solver; decide via experiment, not Euphoria branding.
- **Gate A8:** documented feasibility report and measured prototype; no promise of Euphoria fidelity or copying proprietary code.

## 2. Known integration hazards and required mitigations
| Risk | Evidence / mechanism | Mitigation / verification |
|---|---|---|
| Two systems fighting over pose | animation writing transforms versus physics moving bodies | animation outputs joint-local targets only; assert no external transforms; one authoritative solver |
| Old M6 “animation-free” direction conflict | legacy MASTER_PLAN M6 text | explicit amendment above; do not delete original |
| Current v6 is provisional | active standing/landing evidence exists; real catch-step T06 remains unfinished | use isolated branch/candidate, preserve passive baseline; A2 gate requires real contact step |
| Passive T01 fails | ~-2.918m passive drift/60s despite solver stability | mark FAIL; separately qualify active variant; never mark whole milestone passed from a unit test |
| Multiple competing adapters / temporary files | v2–v6 alongside untracked experiments | compare and consolidate only after successful gates; preserve untracked experiments; no clean/reset |
| Motor instability when blending poses | high gains and motor saturation can inject energy | clamp torque/speed, rate limit targets, test work/energy and step size, stress seeds |
| Grip impulse double-count | drag release plus injected flick can over-energize character | inherit simulated velocity; optional capped secondary impulse separately gated |
| Foot contact ≠ step | state can say stepping with foot stationary | test actual stance switch, airborne swing, world displacement and contact events |
| Fall detection blind spots | lower torso can be misclassified as standing | torso height + contact + orientation/velocity hysteresis and failure cases |
| 2D rig ≠ full 3D human fidelity | hips, yaw, depth, ground contacts differ | retain 2D deliverable; separate 3D feasibility track and modular policy |
| iPhone performance and touch lifecycles | 120Hz sim, mobile browser throttling, rotation/cancel | fixed timestep, bounded catch-up, instrumentation, device QA before deployment |
| Art mismatch / licensing | user has not accepted provisional Kite and proprietary assets forbidden | original art only, approval is distinct mandatory release gate |
| No durable remote backup | current worktree in expiring sandbox, branch commits local | arrange accessible Git remote or Library backup, verify retained history; do not assume commits pushed |
| Conflicting parallel agents | source and plan changed without evidence or locks | task owners, file responsibility, change claims, minimal PRs, shared gate ledger, rebase only safely |

## 3. Development protocol for every agent / contributor
1. Before editing read this document, AGENTS.md, original MASTER_PLAN.md (when accessible), docs/DEFERRED_TESTS.md and recent worklog; inspect git branch/status, deployed candidate and rollback.
2. Select one milestone task ID. State its testable hypothesis, exact files to modify, inputs/outputs, and gate. Don't skip prerequisite acceptance or silently expand into adjacent milestones.
3. Preserve user files/untracked experiments and existing stable preview. No reset, clean, force push, CI quota consumption, opportunistic deployment or proprietary assets.
4. Do not mark “PASS” from skipped, emulated, stale, failed or device-only tests. Log numerical results, command, solver version, test duration and source SHA. Test scenarios that should fail are part of acceptance.
5. Prefer one authoritative implementation per subsystem; prototypes named clearly and non-production. Integrate through explicit contracts and tests. Document rollbacks.
6. On task completion update a task status in this roadmap or a linked acceptance register, with commit SHA, blockers, and next dependent task. Review changes against physics invariants before merging.
7. Agents can work in parallel only on nonconflicting owned files or separate branches/PRs, with one integration owner. A planning document alone cannot enforce this; reviewers/integration agents must follow it and repository gate automation should validate it.
8. Definition of BLOCKED: externally missing permission, inaccessible required asset, device-only testing, or sustained unavailable service after reasonable retries. Compilation bugs, algorithm failures, incomplete tests, and poor motion are engineering work, not blockers.

## 4. Immediate engineering sequence (no large refactor first)
- (Now) A0.1–A0.5 document and test versioned SensorFrame/PoseFrame/MuscleFrame contracts, audit torque semantics, measure 120Hz budget.
- (Next) A1.1–A1.4 build pure target sampler and bounded joint controller behind current active adapter (opt-in), tests for physical override and interrupt continuity.
- (Then) A2.1–A2.4 make **actual contact-confirmed corrective step** pass T06; avoid cosmetic stepping-only state changes.
- In parallel after A1: A5 pointer anchor and release-continuity experiments; A3 protective contact observation.
- Only then orchestrate A4 rise, A6 behavior blending, A7 device polish. A8 remains nonblocking research.

## 5. Acceptance register snapshot (not milestone sign-off)
- Canonical pinned Planck 1.5.1 Node stress: reported 800/800 PASS; validate against current exact SHA before citing as current.
- Active v6 600s no-creep and seeded stress: recorded in docs/history/M4_ACTIVE_BALANCE_EXPERIMENT_2026-10-20.md, provisional Node evidence.
- T06 actual corrective step: NOT PASSED.
- Legacy passive T01 idle no-creep: FAIL.
- Physical iPhone 16 Safari: PENDING.
- M2 original character art approval: PENDING USER.
- A0–A8: NEW TRACK, none accepted yet.

## 6. Mandatory cost and durability policy (applies across A0–A8)
The contributor-facing authoritative rule is AGENTS.md, section "Cost-efficient remote development — REQUIRED".
1. Keep code/history in the authorized Balance Lab GitHub repository when connected, and verify pushed SHA; local sandbox commits are not durable remote backup.
2. Use short purposeful Vercel Sandbox runs for tests and compilation; batch execution and avoid idle RAM billing. Stop after verified durable backup and evidence. If no remote exists, report the persistence risk and avoid destroying the sole recoverable workspace.
3. Keep production preview stable; use on-demand candidate deploys only at meaningful QA/acceptance gates.
4. Run focused unit tests during iteration and comprehensive longevity/stress/parity/device suites at their applicable gates. Avoid exhausted GitHub Actions quota.
5. Each handoff records commands, results, source SHA, sandbox state, evidence, remote persistence, and any reason a sandbox cannot yet safely be stopped.

### A2 verification checkpoint — 2026-10-20 (NOT SIGNED OFF)
Read docs/history/A2_PHYSICS_ANIMATION_INTEGRATION_2026-10-20.md. A single -8 N·s leftward physical catch step passes with simultaneous animated upper-body pose; bilateral T06 and stronger disturbances FAIL. Retain tested controller behind opt-in; do not promote A2 to complete until strict bilateral acceptance succeeds.

### A2 incremental gate result — 2026-10-20 (canonical T06 passed; whole A2 still OPEN)
Node opt-in `tests/a2-acceptance-gate.mjs` now passes **four contact-verified medium shoves in the canonical facing** after 5s each, with concurrent upper-body animation, true ground-contact liftoff/touchdown and sustained upright state. See `docs/history/A2_PHYSICS_ANIMATION_INTEGRATION_2026-10-20.md`. Do not sign off A2 until alternate facing orientation and full browser/Node/mobile gates pass.

## Experimental ML0–ML4 — side-profile task-conditioned motor learning (opt-in)

**Design reference:** `docs/ML_SIDE_PROFILE_EXPERIMENT.md`. Preserve 2D side-profile character and future equipment/combat interfaces. This track is experimental and does not supersede A0–A8 or allow A2/A5/A6/A7 gate waivers. ML0 policy contract and seeded headless training prototype are separate from ML1 knee-buckling diagnostics, ML2 trained balance, ML3 animation/combat task tracking and ML4 physical Safari acceptance. No learned weights enter the stable preview without controlled baseline comparison and explicit acceptance.
