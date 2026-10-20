# B2.1 — measured foot contact and stepping evidence

Status: **PASS for passive contact-observation gate**, NOT the B2 humanlike-balance acceptance gate.

## Implementation

- New `src/physics/foot-contact-observer.mjs`: per-foot contact hysteresis (2 frames to land, 3 frames to lift), independent landing/liftoff counters, frame-stamped last events, grounded/airborne dwell, and raw vs stable support feet. All observations come from Planck fixture contacts. No artificial foot pin, ground impulse, velocity change, or body transform.
- Integrated into `adapters/active-planck-v6.mjs` as passive `getFootContactDiagnostics()`; authoritative raw contacts continue to govern existing physics and step controller, preserving B1 exactly.
- Browser status shows completed/attempted steps and stable foot contact count; browser QA snapshot exposes contact evidence.
- Deterministic tests: contact chatter rejection, genuine lift and landing, invalid inputs, step diagnostics, and **300-frame exact snapshot equivalence** between an observed and unobserved physical rig.

## Empirical observation that motivates B2.2

Under the B1 Strong assist with the existing frontal M1 rig, 720-frame tests of ±8 N·s shoves in both facings resulted in four step attempts, but only **one** reported a completed recovery step. The other three reported failures even when the balance reflex could keep the character standing. The observer separately recorded actual contact loss and regain; the step state machine's attempt counter is not a guarantee of physical foot placement. This exposes why the next work must unify contact/load transfer and step control, not merely increase joint strength.

## Next gate B2.2

- Design and validate opt-in sagittal physical geometry, preserving old rig as comparison. Re-solve neutral pose, joint anchors, COM and mirrored limits.
- Use stable contact observation to identify true support and swing feet; establish contact-verified step transitions with stance/swing authority and touchdown hysteresis.
- Add non-regression acceptance for both facings, idle, poses, force response, grab/release and overwhelming-force falls. Keep current B1 live preview unchanged until a measurable improvement passes.
