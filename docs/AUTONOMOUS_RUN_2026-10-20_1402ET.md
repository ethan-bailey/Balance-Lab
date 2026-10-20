# Balance Lab — autonomous engineering evidence, 2026-10-20 14:02 ET

Integration base: `1b3bf09f159d0c4b405c1302149607b3e7cac1d9`. Live M2 deployment `dpl_3oueY2oD6hpYRJ2oZ94BzEuZ7L2G` remained READY and unchanged. Accepted M1 rollback `dpl_58fwXoovv622MdoHPRa3ykNyzFEt` preserved. No Vercel deployment or GitHub Actions use.

## Prioritized ten testable subgates and actual outcomes

1. Confirm integration source and protect untracked user files: PASS; local branch `integration-reconciled` at base, remote fetch matched, untracked node_modules/browser gate preserved.
2. Reproduce failing 800-case browser gate: PASS as diagnostic; original 798/800, forearmL case 82 seed 1923979547 limit 0.1350353 rad and forearmR case 17 seed 2557891634 limit 0.3177864 rad.
3. Isolate both failures by deterministic PRNG skipping: PASS; forearmL exceeded at shoulderR during post-release, forearmR at wristR during post-release.
4. Test adaptive high-motion substeps: PASS; increasing high-motion 3 to 4 (retaining grab 8, idle 2) reduced both targeted failures below 0.12 rad. A 6-substep variant also passed the two targeted cases but was not selected because 4 is cheaper.
5. Re-run full headless Chromium browser stress: PASS **800/800** with 4-substep high-motion branch. Maximum joint anchor 0.016987045319 m (<0.025), maximum joint-limit violation 0.111110962083 rad (<0.12). All eight seed groups passed.
6. Run five browser physics parity scenarios: PASS (idle, wrist drag, ankle flip, light drop, extreme impulse); existing test's individual stability thresholds passed. Differences from baseline are expected; do not claim frame-by-frame identity.
7. Verify browser touch and rotation gate: PASS; touch accepted and landscape canvas resized, no JS page or console errors.
8. Re-run full pinned Node regression: PASS **97/97**, Node 22 sandbox, 37.7 seconds.
9. Browser build after telemetry counter adjustment: PASS; `node browser/build.mjs` and repeat full browser 800/800 after final source edit.
10. Bilateral A2 strict physical catch: PARTIAL/FAIL; facing +1 exits 0; facing -1 exits 1, 3 of 4 shove cases fail (torso falls). Do not count as passed.

## Implementation

`browser/lab/lab.mjs`: increase adaptive high-motion Planck substeps from 3 to 4, retaining 2 idle / 8 grabbed; update telemetry counter and QA substep label. The extra solver work is activated only when an ungrabbed body has angular speed >12 rad/s or linear speed >2.5 m/s. `src/physics/joint-motor.mjs`: clamp final commanded speed after limit-braking to its configured maximum, preserving bounded-motor invariant. No global position anchors, force teleportation, threshold relaxation, or proprietary assets.

## Release boundary / next work

M2 browser regression now passes, but canonical M2 final acceptance is **not** achieved: user art approval and physical iPhone 16 Safari QA remain pending; A1 telemetry and A5 pointer remain isolated from browser; strict A2 mirrored facing fails; M3–M8 remain open. Continue with telemetry per solver substep, pointer ownership/cancellation integration, mirrored-facing A2 correction, physics regression and real-device performance before deployment. Desktop/headless Chromium tests are not iPhone 16 performance measurements.

Reproduction: serve `browser/dist` on port 9021 and preserved `/vercel/m2/site-baseline` on 9001, run `node browser/tests/full-browser-gate.mjs`; `node --test tests/*.test.mjs`. The full browser gate was executed twice after the physics fix; both 800/800 passed. Source worktree contains untracked generated artifacts, deliberately not included in the change set.
