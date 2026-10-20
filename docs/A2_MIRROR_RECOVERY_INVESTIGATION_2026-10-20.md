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
