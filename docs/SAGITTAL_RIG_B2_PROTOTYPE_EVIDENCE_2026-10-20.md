# B2 sagittal physics prototype — implementation and evidence

**Status:** partial B2 implementation, **NOT B2 acceptance**. The approved baseline remains the default. This document supplements `docs/BALANCE_CONTROL_RESEARCH_AND_EXECUTION_2026-10-20.md` and `docs/SAGITTAL_RIG_LOCOMOTION_GATE_2026-10-20.md`.

## Implementation

- `src/config/sagittal-rig.mjs`: opt-in true physical (not cosmetic) 13-body layout. Moves bilateral thigh/shin/foot x coordinates and physical hip/knee/ankle anchors to ±0.10m, arm/shoulder/elbow/wrist to ±0.09m, and reduces foot length to 0.26m. Baseline `rig-config.mjs` is untouched. Keeps original segment masses, physical motor torque limits and mirrored rig handling. **Important limitation:** 2D Planck requires near/far limb tracks to be slightly separated in x; full 3D depth cannot be represented without a different constraint model. The physical head is still not a separate body.
- `browser/lab/active.html`, `active-lab.mjs`: adds **Rig: Baseline / Sagittal (experimental)** toggle, reset of physics world on switch, with unchanged gesture and balance profile controls. Default remains Baseline and Steps only. Opt-in experimental only.
- Existing `src/physics/foot-contact-observer.mjs` already implements per-foot contact hysteresis and real lift/land evidence; new integration tests use its authoritative `getFootContactDiagnostics()`. A redundant observer trial was removed rather than introducing competing state.

## Measured evidence and failures

- Parameter sweep 24 geometry combinations in quiet stance and 60 shove combinations showed that shrinking hip separation without adjusting support width causes mirrored or directional falls. For example ±0.055m hips with 0.22m feet stood on one facing but fell 910/1200 ticks on the other. Do not claim all geometry variants work.
- Selected **±0.10m hips / ±0.09m shoulders / 0.26m feet**: 10 seconds of idle standing with Strong Assist in both facing directions, no falling; both facings recover from +8, −8, +12 and −12 N·s rest-pose shoves; both fall under 35 N·s. `tests/sagittal-rig-gate.test.mjs` verifies physical geometry, untouched baseline, bounded motors and the above behavior.
- Browser mobile Chromium 393×793 DPR2: opt-in sagittal toggle, 13 independently simulated segments, 1200 physics ticks, standing torso height >1.1m, return to baseline and zero page errors; `browser/tests/sagittal-rig-browser.mjs`.
- **Important failure, not hidden:** 32-scenario gesture development matrix (both facings, four gestures, ±8/±12 N·s) had **7/32 falls** on selected sagittal rig versus **4/32** on B1 baseline. The separate 32-scenario ±10/±16 N·s holdout had **17/32** sagittal falls versus **10/32** baseline. Alternate geometries ±0.115m hips/0.28m feet improved development to 4/32 but held-out still 11/32. This demonstrates **no general balance improvement** from anatomy alone. No B2 promotion, no false claim of humanlike balance or completed gait.
- The existing recovery-step controller sometimes reports an attempted lift but no successful touchdown/placement on the sagittal rig. A test standing still can have attempts=1, lifts>0, landings=0, failures=1. That is a **known locomotion blocker**. B2 requires a unified stance/swing authority and measured actual foot placement, not merely a standing-state test.

## Next gated implementation

1. Unified capture-point risk and step placement state machine; use existing contact hysteresis and physical swing-leg reach, preserve hand/weapon ownership. Test actual displacement and foot liftoff/landing for both facings.
2. Re-tune hip/ankle/knee control against new anatomical mass/support geometry and animated poses, including grip/release and repeated shoves. Require held-out improvement relative to B1 Strong.
3. Replace decorative attached head with separate physical head/neck only after leg balance stabilizes. Add anatomical layering and credible stride/gait without changing solver authority.
4. Perform 10s quiet stance, multiple impulse heights and directions, real step placement, held-out 25% fewer falls than B1 Strong, quiet angular variation no worse than B1 Smooth, real falls under overwhelming force, 60fps iPhone Safari performance. No production deployment until all gates pass.

**No new public deployment is required for this partial gate**. Browser tests run in sandbox; an isolated preview can be deployed after full B2 verification. No GitHub Actions used.
