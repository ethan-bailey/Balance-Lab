# Balance Lab — force-resistance and recovery research, implementation, acceptance

**Status 2026-10-20:** B0/B1 measurable gate completed; **humanlike balance not achieved**. Next mandatory gate B2: anatomically credible sagittal rig and unified support/step controller. The current implementation remains a *prototype* built on M1's front-facing physical anchors.

## Problem and authoritative project constraints

The user observed that Balance Assist improved survival but still reacted at roughly one fifth of the desired quality, visibly jittered, and the physical model looks frontal despite side-view art. The original `MASTER_PLAN.md` requires Planck-authoritative motion, finite torques, COM/contact sensing, hysteresis, credible recovery, no hidden foot pinning and iPhone Safari performance. `docs/PHYSICS_AI_ROADMAP.md` and `docs/SAGITTAL_RIG_LOCOMOTION_GATE_2026-10-20.md` remain governing references.

**Observed code causes:**

- Existing `createBalanceReflex` uses capture-point error to set hip and ankle angles but does not itself select foot placement. Recovery stepping is a separate stateful controller, with incomplete arbitration.
- The original assist immediately raised the **entire** rig's motor torque cap to 42 whenever any small reflex target existed. On standing, this turns minor contact-sensor variation into unnecessarily high joint-motor activity.
- The old rig's hip anchors at ±0.13 m and shoulders at ±0.265 m are front-facing anatomy. Replacing these with sagittal anchors without redesigning the neutral pose caused the rig to collapse. No naive geometry fix is approved.
- The previous 16-scenario test only covered one shove magnitude and missed repeated and stronger perturbations. A wider deterministic test and an independent held-out matrix are now required.

## External research reviewed

1. Kim et al., *A Model Predictive Capture Point Control Framework for Robust Humanoid Balancing Via Ankle, Hip, and Stepping Strategies*, IEEE Transactions on Robotics, 2025: capture-point predictive control, coordinated ankle/hip/step strategies and adaptive momentum damping. https://ieeexplore.ieee.org/document/10989514/ . **Engineering inference:** design one owner for support and swing-leg decisions rather than letting separate controllers fight.
2. Shafiee-Ashtiani et al., *Push Recovery of a Humanoid Robot Based on Model Predictive Control and Capture Point*, 2016/2017: ankle strategy for support-contained capture point, hip/centroidal momentum strategy when contact options are constrained. https://arxiv.org/abs/1612.08034 . **Inference:** adjust reaction intensity and motor authority to predicted risk, not a constant high torque.
3. Pratt et al., *Capture Point: A Step toward Humanoid Push Recovery*, 2006: when capture region escapes base of support, stepping may be necessary. https://doi.org/10.1109/ICHR.2006.321385 . **Inference:** do not use motor strength to fake an unrecoverable stance.
4. Peng et al., *DeepMimic*, ACM TOG, 2018: example-guided RL learns physical motion tracking and perturbation recovery. https://doi.org/10.1145/3197517.3201311 . **Inference:** use learning later for bounded residual motor actions after an anatomical rig, validated task curriculum and repeatable reference clips exist. These publications do **not** establish that the present Planck rig is already humanlike, nor grant access to proprietary Euphoria systems.

## Ordered development and gates

### B0 — instrument baseline (complete)

- `scripts/balance-robustness-benchmark.mjs`: deterministic 120 Hz Planck trials with both facings, four gestures, both push directions, measured torso angular variation, idle variation, physical falls and knee excursion. No browser deployment or CI required.
- Development matrix: **64** six-second trials: 8, 12, 16 N·s single shoves and three repeated 7 N·s shoves, each across both facings, four gestures and both force directions. Push starts at t=1s.
- Held-out matrix: **80** trials with 5, 10, 14, 20 N·s single shoves and three repeated 9 N·s shoves; different shove timings. Evaluate *after* choosing candidates.
- Old Assist baseline: **10/64** falls, mean torso angular-velocity total variation **484.9** and pre-shove variation **74.8**. Held-out: **27/80** falls and total variation **447.3**. These are simulator metrics, not a perceptual jitter score.

### B1 — reduce chatter without sacrificing physical recovery (complete)

- Added a small configurable deadband to the filtered capture-point error, so near-zero jitter does not command motors unnecessarily.
- Added **separate bounded reflex torque ceiling/floor** and a speed-sensitive torque schedule, with faster attack and slower release. When COM velocity is low, Smooth mode uses less torque; when a shove is detected it ramps up. The existing stepping controller retains the original 42 torque budget. Only joint motor caps and reference angles change; no artificial body forces or positional correction.
- Tested parameter sweeps for torque ceilings/floors, ankle/hip gains, smoothing, deadband, recovery cooldown, and optional hip-angle/velocity damping. Rejected settings that were quieter but fell more often, and rejected adding extra hip angular damping because it regressed recovery. Keep full parameter evidence in this document; no claim of globally optimal parameters.
- **Strong** profile: ankle 1.8, hip 0.6, 10 ms filtering, fixed 42 torque cap. Development **6/64** falls; angular variation **460.2**, pre-shove **63.3**. Held-out **20/80** falls; variation **427.3**. More force-resistant in tested conditions, less quiet than Smooth.
- **Smooth** profile: same gains, 10 ms filtering, deadband 0.005 m, torque floor 28 and peak 42. Development **7/64** falls; angular variation **283.6**, pre-shove **58.3**. Held-out **25/80** falls; variation **277.3**. About **41% lower** development variation and **38% lower** held-out variation than old Assist, but weaker on some stronger/repeated pushes. Do not call this an animation-quality metric.
- Both profiles survived all 16 ±8 N·s single-shove cases across both facings and all four poses. An overwhelming 35 N·s shove still knocks down both in both facings. Invalid torque and deadband values fail closed.
- Browser A/B comparison remains **opt-in**: Steps only, Assist Strong, Assist Smooth. No silent change to the stable M2 or A2 baseline.

### B2 — physically meaningful unified balance (IN PROGRESS, NOT COMPLETE)

1. Use existing foot-contact hysteresis (already implemented) and add measured foot load, stance/swing ownership and slip; `docs/SAGITTAL_RIG_B2_PROTOTYPE_EVIDENCE_2026-10-20.md` records the partial sagittal prototype and failing held-out balance tests.
2. Replace the M1 frontal physical skeleton with an **opt-in anatomical sagittal rig**. Recompute neutral motor angles, support geometry, COM, knee/ankle limits and both facings. No cosmetic-only fix.
3. Implement one state machine with mutually exclusive authority for stance correction, foot swing, plant/load transfer, stumble and fall; protect arm gesture/grip ownership.
4. Implement risk-based capture-point placement using feasible foot reach, available ground contact, and physical touchdown, not just hip-angle presets. Repeated pushes must trigger further steps when physically possible.
5. Add upper-body angular momentum responses with realistic counter-swing and finite joint strength, without overriding user-driven hand poses.
6. Establish test suite with impulses at several heights, alternating shoves, slope/ground friction variation, grip-and-release, gait intent, fall and get-up. Hold out scenarios and demand fewer falls **and** lower jitter **and** no hidden foot pins.

**B2 acceptance:** true sagittal rig stable 10s idle in both facings; measurable real foot lift/contact on every claimed recovery step; at least 25% fewer falls than B1 Strong on a precommitted held-out perturbation suite; idle angular variation no worse than B1 Smooth; strong shove still causes a genuine fall; no motor or physics divergence; iPhone 16 Safari performance within 60 fps target under normal load. If B2 fails, keep B1 as comparison and document the exact failures.

### B3 — data-driven residual policy (conditional, NOT complete)

Only after B2: record motor/COM/contact observations and reference poses; train a **bounded** residual controller in the same authoritative Planck world, using staged curricula (quiet stance, single push, repeat push, gait, grab, recovery). Compare learned policy against B2 on withheld seeds, impulses and pose sequences, with separate jitter, fall, foot-slip and performance metrics. Promote ML only if it improves held-out physics and perceptual quality; otherwise keep the deterministic controller.

## Rollout and operational rules

Test locally in sandbox first, preserve all user work, commit code+tests+evidence, deploy **one isolated preview** only after gates pass. No GitHub Actions or automatic Vercel deploys. Do not promote to production until actual iPhone 16 Safari QA. No claim of natural human-level balance, real locomotion or a trained policy from the B1 gate.

## B1 verified release evidence

- Tested and deployed source commit: `e8b661cd9ac3d7076c1e4f48ae341b53b7f18148`.
- 126/126 Node tests PASS, strict A2 gates both facings PASS, 800/800 Planck stress PASS, identity check PASS, browser build PASS.
- Mobile Chromium (393×793, DPR 2): existing idle/touch/recovery smoke PASS, gesture sequence PASS, profile drawing PASS, balance A/B PASS, new Strong/Smooth selector and both physical response modes PASS, active A2 source parity PASS, zero page errors.
- Isolated Vercel preview `dpl_DJe9KQs9oC6hYiMktFmZzH7qospu`, state READY: `https://sling-lab-play-dy2lb2j1u-ethanbaileymarsh-8332.vercel.app/lab/active.html`.
- Live HTTP 200 for active HTML, active browser module, reflex source, active Planck adapter and pinned Planck vendor; HTML contains the Strong selector and served controller contains the 28-torque Smooth floor.
- **Live deployment Chromium** (not only localhost) executed the profile switch, reset and 8 N·s shove: both Strong and Smooth stayed standing; no browser errors. Physical iPhone Safari testing is still outstanding.
- The stable production alias was **not changed**. The old steps-only baseline remains selectable.
- No trained policy, true anatomical sagittal rig, or directional walking is claimed as complete.
