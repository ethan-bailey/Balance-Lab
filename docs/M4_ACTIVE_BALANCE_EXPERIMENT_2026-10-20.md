# Balance Lab M4 — bounded standing torque and recovery window

Date: 2026-10-20 UTC. Status: **isolated Node prototype; NOT browser/iPhone acceptance**.

## Finding and implementation

The pinned canonical Planck adapter is numerically stable but its 60-second uncommanded torso drift is -2.917857 m. The M4 v3 active rig with 18 Nm standing torque holds 60 seconds to +0.0382 m, but drifts +0.3357 m over 5 minutes. Reducing its standing motor limit to 8 Nm (v4) yields -0.1238 m over 10 minutes, yet a 0.08 m light two-foot drop subsequently falls. The threshold-triggered v5 experiment also fell.

`adapters/active-planck-v6.mjs` retains 8 Nm for settled standing and allows 18 Nm for a **two-second post-catch recovery window**. `catching` retains 24 Nm; grabbed/tumbling/fallen modes remain low torque. All actuation goes through Planck revolute motor torque limits. No world-space position pin, pelvis translation, or contact callback mutation was introduced. This is a provisional controller law, not a full COM-based catch-step controller.

## Executed evidence

- v6 idle **600 seconds** / 72,000 steps: torso x=-0.076878 m, y=1.35912 m, standing, 0 nonfinite states, max anchor error 0.0005902 m, 0 joint-limit overrun.
- v6 **20/20 light landings** from 0.04–0.13 m (two repeats each): recovered to standing within five seconds, no nonfinite states. `node tests/light-landing-gate-v6.mjs`.
- v6 **800/800 seeded physics stress**: 100 each idle, wrist, ankle, flick, drop, shove, tumble, extreme; max anchor 0.0022284 m, max limit overrun 0.0666589 rad. `node tests/active-rig-gate-v6.mjs 800`; evidence `evidence/active-rig-gate-v6-800.json`, Node v24.21.0, Planck 1.5.1.
- Baseline v4 800/800 stress and five v4 unit scenarios also passed, but its light landing failed; v6 is the current better candidate.
- **T06 incomplete:** medium 8/12 Ns horizontal torso impulse remains standing without stepping; 16 Ns and above triggers stepping then falls. This is not yet a physical corrective step. M4 is NOT accepted.
- No real iPhone 16 Safari or user art approval. No production deployment or GitHub Actions run.

## Next work

Implement physically constrained foot-placement/catch-step controller with COM prediction, foot swing and ground clearance; validate T06 with measured joint torques and foot displacement. Integrate M3 touch binding and v6 into a separate verified browser preview; preserve existing M2 deployment and M1 rollback. Test real iPhone Safari before mobile release acceptance. Keep the old active-v3 baseline and all failed experiment evidence intact.
