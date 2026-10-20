# Balance Lab A2 — Physics/Animation Integration and Corrective Stepping Evidence
2026-10-20 · Planck 1.5.1 / Node v24.21.0 · **PROTOTYPE, NOT ACCEPTED FOR RELEASE**

## Implementation
- src/physics/support-estimator.mjs: mass-weighted COM, 2D velocity, physical foot support bounds, capture-point prediction. Perception only.
- src/behavior/recovery-step.mjs: deterministic idle/lift/swing/settle step planner. Outputs joint-local motor targets through Planck. Counts a landing only after measured liftoff, more than 0.06 m displacement, and renewed physical foot contact while torso is supported. Cancels on grab, dangerous tilt and unsupported state. No root teleportation, foot pinning, or infinite torque.
- adapters/active-planck-v6.mjs: enableRecoverySteps() opt-in. Swing targets override only relevant joints, while other animated joint targets continue. Both pass through bounded poseMotorCommand into the original physics solver; default A1 controller is untouched.
- First unassisted rightward step is guarded off because it fails physical recovery; a counter-step may occur in an ongoing recovery. This is a safety fallback, NOT evidence of bilateral stepping.
- src/behavior/balance-reflex.mjs has separate opt-in bounded ankle/hip feedback. A 25-configuration gain sweep found no improvement in bilateral medium-shove outcomes; DO NOT enable by default.
- src/config/mirrored-knee-experiment.mjs changes the left knee's allowed flexion sign. It allows greater rightward foot motion but FAILS 60-second no-creep (torso eventually near y=0.29 m). Do not replace the canonical rig.

## Verification results
| Gate | Status | Observations |
| --- | --- | --- |
| 60-second opt-in idle | PASS | No spontaneous steps, torso supported within 0.10 m |
| 600-second opt-in idle | PASS | 72,000 steps; torso x=-0.076878 m, y=1.359122 m, standing; 0 step attempts, 0 nonfinite values |
| Animated -8 N·s leftward shove | PASS for this case only | Two physical liftoffs, two contact-confirmed landings, standing after 4 seconds; independent contact observer verifies replant; deterministic replay |
| Strong impact can physically floor body | PASS | No scripted root reposition or fake recovery |
| Base active-v6 stress, 800 cases | PASS NUMERIC | 800/800; max anchor=0.002228383 m, joint-limit=0.066658883 rad, pinned Planck 1.5.1 |
| Opt-in step stress, 100 seeded cases | PASS NUMERIC | 100/100 finite/bounded; max anchor=0.001516437 m; limit=0.038041843 rad; 49 foot liftoffs, 9 landings, 70 falls at varying impulses |
| -10 N·s leftward medium shove | FAIL BEHAVIOR | Three step attempts and one landing; torso y=0.272 m, fallen |
| +8 and +10 N·s rightward medium shove | FAIL STEP, PASS STANDING | Holds its balance safely using default; no contact-confirmed corrective step; unsafe unassisted right-step controller deliberately gated off |
| Bilateral corrective stepping | **FAIL** | tests/a2-acceptance-gate.mjs produces nonzero exit by design until all four medium-shove cases pass |
| Mirrored-knee long idle | FAIL | Cannot maintain upright torso at 60 seconds; not accepted |
| Current M2 browser source and iPhone Safari | PENDING | This isolated engineering workspace lacks current production browser source; older /vercel/m2/site must not be deployed |
| User visual approval | PENDING USER | Kite styling unchanged |

## Reproduction commands
- node --test tests/*.test.mjs — passing focused and Node integration tests; re-run after latest edit.
- node tests/active-rig-gate-v6.mjs 800 — original active rig, controller opt-in disabled.
- node tests/active-recovery-stress.mjs 100 — numerical stress ONLY, not evidence of stepping success.
- node tests/a2-acceptance-gate.mjs — **EXPECTED FAILURE** for bilateral medium-shove requirement. Never suppress the exit code when claiming acceptance.

## Remaining engineering work, in priority order
1. Solve rightward recovery foot placement and stance stability without modifying the verified canonical M2 rig or sacrificing long-idle support. A mirrored knee helps swing, but currently breaks posture; investigate contact-aware stance shifts, asymmetric swing strategy and correct leg constraints.
2. Produce a 3-second sustained upright hold after observed repositioning and touchdown for each of -8,-10,+8,+10 N·s, at both initial orientations; only then pass bilateral T06.
3. Replace fixed hip/knee targets with support-relative contact IK and phase-aware COM capture feedback. Keep torque bounded and physics authoritative, blend reflexes with animation rather than snapping.
4. Add extended 800-case opt-in behavior stress AFTER bilateral failure is corrected; current 800-case pass is numerical for the original active-v6 graph.
5. Obtain exact current M2 browser source, integrate through tested interface and perform independent Safari iPhone 16 device QA. Do not redeploy older site. Retain stable preview and M1 rollback.

FAIL and PENDING are not blockers to independent engineering, but they prevent milestone acceptance.

## Later 2026-10-20 checkpoint: canonical bilateral T06 now PASS (historical failures above retained)

**Scope:** pinned Planck 1.5.1 Node active v6 rig with opt-in controller; not a statement of full A2 / production completion. The previous one-sided tests and parameter failures remain historical evidence; the new velocity-adaptive swing–plant sequence replaces those fixed targets.

Algorithm:
- Determine displacement risk from mass-weighted COM velocity and capture-point margin. Select a left/right swing limb from sensed lateral motion. At higher COM speed, begin moving immediately; otherwise allow ten 120Hz frames of preparation.
- Drive a **12-frame torque-limited hip/knee swing**, then a **60-frame contact-seeking plant** through the existing Planck revolute motors. Preserve independent upper-body animation targets. Require sensor-observed liftoff before entering plant, and record touchdown only when the swing foot recontacts at least 6 cm in the actual displacement direction while torso supported.
- Respect fixed 120Hz timing, checked bounds, grab cancellation, unsafe tilt/fall cancellation, limited work windows, and cooldown. No rigid-body teleport, synthetic foothold, or infinite motor authority. The same original motor adapter still allows stronger force to cause a physical fall.

The stricter acceptance runner `node tests/a2-acceptance-gate.mjs` has **PASS** for all four canonical orientation medium shoves (-10,-8,+8,+10 N·s), each measured using an independent physical-contact observer, minimum post-one-second torso height, and 5 s of disturbance simulation. The full 56/56 Node regression suite passed after implementation.

| World-X impulse (N·s) | Replanted foot | Independent touchdown frame (120Hz) | Furthest directed foot displacement | Minimum torso height from 1s onward | Result |
|---:|---|---:|---:|---:|---|
| -10 | footR | 19 | 0.09943 m | 1.35357 m | PASS; standing |
| -8 | footR | 25 | 0.09126 m | 1.36090 m | PASS; standing |
| +8 | footL | 34 | 0.17499 m | 1.36336 m | PASS; standing |
| +10 | footL | 26 | 0.14999 m | 1.36350 m | PASS; standing |

**Important remaining requirements:**
- A whole-rig facing reflection `src/config/facing-rig.mjs` preserves no-input 60s and 600s upright stance, but current mirrored medium-shove step control has failures, particularly +10 N·s rightward. Mirroring just the left knee (prior experiment) is NOT valid and remains rejected.
- T06 canonical Node subgate is closed. **Full A2 Gate remains PENDING/FAIL** until bidirectional tests in *both* physical facing orientations, torso/angular-momentum and foot-contact metrics, browser/Node parity for the integrated step system, physical iPhone 16 Safari QA, and the specified release gates are verified. See separate mirrored-facing evidence when available.
- Current public M2 browser source is not in this isolated workspace. Do not overwrite the live preview or the accepted rollback with the older `/vercel/m2/site` artifact.

### Opt-in stress and opposite-facing idle evidence
- `node tests/active-recovery-stress.mjs 800`: **800/800 numerical stress PASS** with the revised bilateral motor planner, max joint-anchor error 0.007914 m, max limit violation 0.054252 rad, 2,133 observed foot-contact losses, 508 physically shifted foot touchdowns, and 656 falls under a wide seeded impact sweep (up to 35 N·s); falls are legitimate, not numerical errors. Evidence: `evidence/a2-opt-in-step-stress-800.json`. This is not a 800/800 successful recovery claim.
- `evidence/a2-facing-long-idle-600s.json`: **both physics-facing orientations** hold 600 seconds (72,000 solver ticks) without a spontaneous step or falling. Facing +1: torso x -0.076878, y 1.359122 m; facing -1: torso x +0.081239, y 1.359089 m. This does not establish mirrored medium-shove acceptance.
- `src/config/facing-rig.mjs` represents a full reflection of limb positions, anchors and signed joint limits. It is distinct from the unsafe *single-knee* mirroring experiment. Mirrored disturbance recovery is still being verified separately.

### Independent full facing reflection gate (explicit FAIL)
The new optional `createFacingRig(...,-1)` reflects **all** 2D segment origins and revolute anchors and switches signed joint limits together. Unlike the former single-knee experiment, it passes standing for 60s and 600s at 120Hz with opt-in recovery enabled (x=+0.081239 m at 600s, no unsolicited steps).

The strict runner now accepts `--facing=-1` without relaxing any touchdown or torso-stability criteria. `node tests/a2-acceptance-gate.mjs --facing=-1` exits **1**, with:
- -10 N·s: PASS (contact-verified step, upright)
- -8 N·s: FAIL (eventual fall)
- +8 N·s: FAIL (eventual fall)
- +10 N·s: FAIL (eventual fall)

Evidence: `evidence/a2-reversed-facing-unaccepted.json`. Motor phase and stance-gain sweeps for the harder mirrored +10 case have not yet produced a 5-second upright result, although some recoveries initially contact the ground. This is **still an open controller/stance geometry defect**, not a user-only blocker. The **canonical-facing T06 is passed; complete A2 facing sweep is NOT accepted**. No changes were deployed.
