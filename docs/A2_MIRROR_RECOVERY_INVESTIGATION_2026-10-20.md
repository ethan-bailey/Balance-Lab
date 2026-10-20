# A2 mirrored-facing medium-shove investigation — 2026-10-20

**Gate status: FAIL. No production solver changes accepted.** Pinned Planck 1.5.1, 120 Hz, existing strict runner `node tests/a2-acceptance-gate.mjs --facing=-1`.

| Impulse | Gate | First physical lift frame | First displaced touchdown frame | Minimum torso height after 1 s |
|---|---|---:|---:|---:|
| −10 N·s | PASS | 2 | 33 | 1.363 m |
| −8 N·s | FAIL | 12 | 31 | 0.253 m |
| +8 N·s | FAIL | 2 | 20 | 0.347 m |
| +10 N·s | FAIL | 2 | 21 | 0.269 m |

The canonical facing remains 4/4 PASS under the same test. Mirrored cases initiate swing and most achieve a genuine shifted touchdown, but the torso subsequently escapes the support polygon. In +10 N·s, sampled torso x advances from +0.062 m at rest to +0.403 m at frame 120 while the original stance foot remains near +0.158 m; the torso then falls. The controller stops commanding a step after its short plant phase and enforces a 4.5-second cooldown. This is evidence of insufficient capture/stabilization, **not** a numerical instability or missing foot animation.

## Experiments (all reverted)

- Tested mirrored swing and plant hip/knee/ankle targets across bounded ranges; the best isolated combination recovered **3/4** mirrored shoves (−10, −8, +8) but +10 still failed to complete a sufficiently displaced touchdown and subsequently fell. This candidate is **not accepted**: it was not validated against canonical facing, long idle, randomized stress, or browser parity.
- Increasing the plant phase from 60 to 180 ticks exchanged which cases succeeded but did not improve the total acceptance count.
- Increasing standing motor torque from 8 to 12–60 N·m did not close the remaining cases and sometimes regressed already passing shoves.
- Reducing recovery cooldown from 4.5 s to 0–2 s induced repeated steps without achieving 4/4 acceptance.
- Enabling the existing balance reflex unconditionally, even with zero gains, changes standing motor command/torque behavior and invalidates the step acceptance. Do not turn it on as a blanket fix.
- Reversing physical segment/joint construction order changed outcomes, indicating solver/contact-order sensitivity; it did not yield robust bidirectional recovery and must not be used as an acceptance workaround.

## Engineering direction

Build a contact-aware **post-touchdown capture controller** rather than tuning a single hardcoded swing pose: use the measured COM/capture point relative to the actual stance and swing-foot support intervals; apply bounded hip/ankle/knee targets and measured torso angular velocity to stabilize after touchdown; release the correction gradually only when capture is inside support. Never translate bodies, pin feet, bypass motor torque limits, or claim a step based only on a state transition. Add deterministic mirror-paired tests and random perturbations that check sustained torso height, angle, actual foot contact, and full Node/browser parity. Preserve the existing strict 4/4 canonical gate and 800-case stress gate.

The production implementation was left unchanged. The latest deployed preview was not modified.

## Continuation — passive balance vs. active step orchestration

The sandbox was recovered again from a named-sandbox snapshot after the 20-minute session lifetime elapsed. The existing integration checkout and unrelated untracked files were preserved.

A paired reflection diagnostic, **with the step controller disabled**, showed that the mirrored and canonical passive rig diverge under the same signed shove, even before gait target selection. For the −8 N·s impulse, at 120 ticks after shove the canonical torso was at approximately x=−0.141 m, y=1.364 m and the reflected run (expressed in canonical x coordinates) was x=−0.610 m, y=1.183 m. Thus the active step controller is not the sole source of reflection asymmetry. Contact ordering and stance-motor response remain plausible contributing factors; neither is proven as the sole cause.

The existing **opt-in** capture-based balance reflex (`createBalanceReflex`) was independently exercised without recovery steps. With ankle gain 2 and hip gain 4 (output clamped to 0.28 rad ankle and 0.24 rad hip, physical motors still torque-limited), all four shove magnitudes survived on each facing: **8/8 passive stance-survival diagnostics**. This is **not** A2/T06 acceptance: no actual foot step is required or observed in that diagnostic. Combining the same reflex unconditionally with active recovery, or activating it after touchdown, did not pass the strict physical stepping gate. Do not infer that two individually useful controllers can be composed without contact-aware arbitration.

**Verified integration defect fixed:** `createBalanceReflex` previously emitted zero-angle targets for grounded legs even with zero gains or exactly zero capture error. These no-op targets claimed joint motor ownership and triggered elevated torque in `adapters/active-planck-v6.mjs`, materially altering simulated steps. The reflex now emits only non-negligible nonzero targets. Two integration tests assert that enabling a zero-gain reflex produces bit-for-bit identical physical snapshots and recovery diagnostics in both facings. Mirror-equivariant signed-target and no-error tests were also added. This is a safe, narrow composition prerequisite, not a claim of mirrored stepping completion.

**Post-fix gate evidence:** `node --test tests/*.test.mjs` **101/101 PASS**; `node tests/rig-gate.mjs 800` **800/800 PASS**, maximum anchor error 0.011421842798 m, maximum joint-limit violation 0.070176393982 rad; `node tests/a2-acceptance-gate.mjs` **4/4 PASS** canonical; `node tests/a2-acceptance-gate.mjs --facing=-1` **1/4 PASS** mirrored (−10 only). `cd browser && node build.mjs` **PASS**. The full headless Chromium browser regression with separate candidate/baseline local servers **PASS**: 800/800 stress, five parity scenarios, touch/resize/reload checks, zero browser errors; maximum browser joint anchor error 0.016987045319 m, limit overshoot 0.111110962083 rad. The initial browser attempt failed only because the local HTTP servers were not running; a later attempt was interrupted by sandbox expiration and was successfully rerun after snapshot recovery.

**Release gate remains FAIL.** Remaining work: contact-aware arbitration between stance stabilization and genuine step initiation/planting, plus mirrored 4/4 sustained physical contact, browser parity of the active controller, and physical iPhone 16 QA. No Vercel deployment was created.

### Reproducible reflection trace

New observational harness: `node tests/a2-reflection-diagnostic.mjs` (or `--passive` / `--stepping`). It executes identical impulses in both physical facing orientations, reflects output into one canonical x/angle convention, and records measured COM, capture point, support interval, actual foot contacts, foot x positions, torso pose, and step diagnostics at fixed ticks. It never changes physics and explicitly labels its output `OBSERVATION_ONLY`.

At 120 ticks after shove, absolute torso-x discrepancies between paired passive runs were **0.274 m (−10 N·s), 0.469 m (−8), 0.026 m (+8), 0.183 m (+10)**. Under active stepping the corresponding discrepancies were **0.340 m, 0.294 m, 0.124 m, 0.025 m**. The active controller reported one `completed` step on both orientations in all four paired scenarios, even though three mirrored cases later fell. This confirms that `completed` alone is insufficient: the acceptance gate must continue to require sustained support and upright posture.

Future work should use these traces to distinguish solver/contact asymmetry from capture-policy errors before changing gait parameters. Do not tune the mirrored gait against one impulse while regressing the canonical 4/4 gate. The physically correct long-term fix requires stable capture under mirrored contact ordering and genuine contact-aware motor arbitration, not an orientation-specific fudge factor.
