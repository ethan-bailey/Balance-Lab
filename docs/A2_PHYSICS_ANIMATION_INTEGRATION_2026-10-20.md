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
