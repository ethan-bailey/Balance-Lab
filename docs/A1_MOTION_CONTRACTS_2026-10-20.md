# Balance Lab A1 — Motion reference contract and physically bounded integration
Date: 2026-10-20 UTC. Branch: automation/20261020-a1-motion-contracts.
Base: 24e07c0697c6a24b32ff5b6309f16b735fef603d.
Status: **A1 opt-in motion-contract subgates verified in pinned Node; NOT browser, iPhone or release acceptance.**

## Scope and implementation
- src/animation/pose-sampler.mjs: immutable, validated optional joint-local angular velocity at keyframes (rad/s); samplePoseFrame returns immutable {pose, velocity}. Explicit endpoint velocities use shortest-arc cubic Hermite interpolation, while clips without velocities use shortest-arc linear interpolation. Optional loopBlendSeconds closes a nonmatching cyclic pose over a bounded extra seam interval. The legacy samplePose API is retained for baseline comparison.
- adapters/active-planck-v6.mjs: opt-in velocityFeedforward and loopBlendSeconds; target velocities are passed to bounded poseMotorCommand and Planck revolute motors. Interrupted crossfades begin from the previous *reference target*, rather than snapping the target back to the currently measured angle. Initial clip still fades from measured physical joint angles. Clip input is validated and detached from caller-owned mutable objects.
- All changes remain opt-in. No direct rigid-body transforms, root positioning, foot pins, infinite torque, external assets or live preview modifications. The pinned passive adapter and active v6 default control path remain unchanged.
- Tests: tests/pose-motion-contract.test.mjs and tests/pose-endurance.test.mjs.

## Per-run selected gates and actual outcomes
| Gate | Testable acceptance | Status and observed evidence |
| --- | --- | --- |
| A1-C01 | Immutable pose/velocity frame; rad/s derivative; legacy samplePose preserved | PASS, motion-contract test 1 |
| A1-C02 | Wrapped angles interpolate via shortest arc with exact endpoint velocity | PASS, test 2 |
| A1-C03 | Opt-in cyclic seam has continuous reference pose across wrap | PASS, test 3; seam angular speed is piecewise constant without explicit tangents |
| A1-C04 | Nonfinite/mismatched velocity, invalid seam/time rejected | PASS, test 4 |
| A1-C05 | Opt-in angular velocity changes real Planck body trajectory, with bounded speed/torque | PASS, test 5 |
| A1-C06 | Mid-fade interruption cannot teleport a body; motor-speed difference vs continuing controller <0.3 rad/s | PASS, test 6 |
| A1-C07 | Invalid opt-in options fail before changing live simulation | PASS, test 7 |
| A1-C08 | External impulse overpowers animated arm without teleport | PASS, test 8; +8 N*s horizontal impulse gives measurable divergence |
| A1-C09 | Replay across seam, clip interruption, impulse and disable is bit-for-bit deterministic | PASS, test 9 |
| A1-C10 | Caller mutating input clip after installation cannot poison the controller; invalid raw clips rejected | PASS, test 10 |
| A1-C11 | 60-second animated cyclic endurance, finite state and supported torso | PASS, 7,200 steps; torso x=-0.06337 m, y=1.36044 m, max anchor 0.000798 m, joint limit 0 |

## Executed regressions and historical failure
Before editing, 15/15 focused tests passed. The first new run passed 8/9: the vertical 8 N*s arm impulse produced only 0.00403 rad separation after eight ticks, below the 0.01 threshold. A direction sweep found a horizontal 8 N*s impulse yielded 0.1913 rad separation. The test was corrected and all nine passed. This failure is preserved here, not relabeled as an initial pass.

Final Node regression: 69/69 PASS, about 29.9 seconds. Syntax and diff whitespace checks passed.

Active-v6 800-case numerical stress PASS 800/800, 41.9 seconds, maximum joint anchor error 0.002228383 m and joint-limit overrun 0.066658883 rad. Eight scenario types each passed 100 cases. Evidence was redirected into /tmp in this isolated checkout; other agents' evidence was not changed.

A2 opt-in step stress: 100/100 numerical PASS; maximum anchor 0.004248376 m, joint-limit 0.035674520 rad, 269 observed foot liftoffs, 67 replants and 79 legitimate falls. This is not a 100/100 successful recovery result. Canonical-facing A2 strict medium-shove gate PASS in four cases. Reversed-facing A2 strict gate FAIL (exit 1): -10 N*s PASS, -8/+8/+10 N*s FAIL. The mirrored-reflex idle drift remains unresolved.

## Open gates
Safari device measurements, user art approval, current browser integration, mirrored-facing A2 recovery, and A3-A8 remain pending. No Vercel deployment or GitHub Actions run was triggered.
Next: review concurrent branches, add motor-work telemetry, fix reversed-facing recovery, integrate current browser source, verify browser parity, then perform iPhone QA.
