# Balance Lab — 2026-10-20 acceptance register

| Gate | Status | Evidence / next condition |
|---|---|---|
| Canonical Planck 1.5.1 Node rig stress | PASS | 800/800; max anchor 0.011422 m, max limit 0.070177 rad; JSON evidence |
| Deployed browser ↔ Node physics parity | PASS | 4/4; position delta below 2.1e-13 m |
| Physical iPhone 16 Safari | PENDING DEVICE | Real portrait/landscape, touch, p95, thermal, sustained |
| M2 art approval | PENDING USER | Kite visual provisional |
| T01 60s idle no-creep | FAIL | Torso moved -2.918 m, despite numerically bounded joints |
| M3 pointer integration | PENDING ENGINEERING | Isolated drag tracker tested, browser not wired |
| M4 impact and balance | PENDING ENGINEERING | Post-solve sensor tested; no catch/step controller |
| M5–M8 | NOT ACCEPTED | Follow MASTER_PLAN.md and required test matrix |

Never count a blocked, skipped, or pending test as passed. Preserve all failures and rerun evidence.

### 2026-10-20 M4 isolated rerun (not a release sign-off)

T01 v6 active 600-second Node standing PASS: x=-0.076878 m; canonical passive/motor baseline still FAIL at -2.917857 m/60s. T05 v6 isolated light landings PASS 20/20 (0.04–0.13 m), 800/800 stress PASS. T06 physical corrective step remains PENDING/FAIL: 8–12 Ns shoves show no step, 16+ Ns fall after stepping mode. Browser integration, real iPhone 16 Safari, and M2 art approval remain PENDING. See `M4_ACTIVE_BALANCE_EXPERIMENT_2026-10-20.md`.

### 2026-10-20 A2 contact-verified stepping update
See A2_PHYSICS_ANIMATION_INTEGRATION_2026-10-20.md. One animated -8 N·s leftward shove passes contact-verified lift, replant and standing; 600-second opt-in idle passes. Bilateral medium-shove acceptance remains FAIL: stronger -10 N·s falls, rightward +8/+10 N·s use a safe no-step fallback, mirrored-knee idle fails. Explicit strict acceptance command node tests/a2-acceptance-gate.mjs exits nonzero until all four cases are genuinely satisfied. Browser integration and physical iPhone Safari/art approval remain PENDING.
