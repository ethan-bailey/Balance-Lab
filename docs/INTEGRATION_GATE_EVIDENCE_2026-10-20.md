# Balance Lab — Recovered browser and integrated physics gate evidence

**Candidate branch:** `integration/balance-lab-20261020`. **Remote source commit before this record:** `b87dbcb70e7a8128fb781c26f6875afc6d342913`. **Status: FAIL (do not deploy).**

## Recovery and source
- Original M2 release archive recovered from `/vercel/m2/release-source.tar.gz`, SHA-256 `a4b00c404b4b3aaabf6d219ee4dd8cbfdba862ba6a331ed7bef49bf92409d82a`.
- Extracted to `browser/`; `browser/build.mjs` builds without the original archive by copying the checked-in browser sources and Planck 1.5.1.
- A1 telemetry original source and test hashes `d88c96c1ecf876c09804637f2f0e999bfbfb258677ffebe4344f84f358458f90`, `0ee4edb72ef6d62a5fea2930c778488d0d159b3f095fec66e4240e24cc02682b`. All ten original MT tests pass in the recovered full rig.
- PR #1 merged locally into integration candidate with zero conflicts (`de73146`); preserved A5 `e6c1bcb` changes applied (`6d421ab`), GitHub comparison confirms original PR head zero files ahead of candidate.

## Reproducible test evidence (Node 24, Planck 1.5.1)
- `node --test tests/*.test.mjs`: **96/96 PASS**, ~36 seconds.
- `node tests/rig-gate.mjs 800`: **800/800 PASS**, max anchor 0.011421842798 m; max joint limit 0.070176394 rad.
- `node --test tests/motor-telemetry.test.mjs`: **10/10 PASS**.
- `node --test tests/a5-pointer-lifecycle.test.mjs tests/canvas-pointer.test.mjs tests/rig-grip-cancel.test.mjs`: PASS.
- `cd browser && node build.mjs`: PASS; checked generated `dist/lab/lab.mjs`.
- Headless Chromium, 393×793 touch viewport: browser rig QA 250 steps with hand grab/move/release, finite bodies, zero JS console/page errors: PASS.
- Full browser 800-case deterministic drag stress, original 8 substeps: **798/800 FAIL**. Violations: seed 1923979547 case 82 forearmL, limit 0.1350353 rad; seed 2557891634 case 17 forearmR, limit 0.3177864 rad. Required <= 0.12 rad; no threshold relaxation.
- Browser 5/5 parity scenarios (idle, wristDrag, ankleFlip, lightDrop, extremeImpulse): PASS on original eight-substep build. Touch/resize/reload: PASS, no browser errors.
- 12-substep experiment: **798/800 FAIL**; max violation 0.143865 rad; some baseline parity changed. 16-substep experiment: **794/800 FAIL**, max violation 0.232892 rad. **Both experiments reverted.** A third experiment increased the joint-limit guard from 0.55 to 0.75 rad at eight grab-substeps; it regressed to **793/800 FAIL** and altered baseline idle/drag parity. The guard experiment was also reverted.

## Release-blocking integration facts
1. Browser `lab/lab.mjs` is a separate M2 Planck implementation and does **not** yet consume the tested `adapters/planck.mjs`, `src/physics/motor-telemetry.mjs`, or the A5 pointer lifecycle. Passing Node tests is not end-to-end integrated gameplay.
2. Full browser stress fails 2/800 cases under large forearm drag. Fix physical limit overshoot without snapping bodies, raising force caps arbitrarily, or hiding failures; then rerun full 800-case browser stress and Node suite.
3. A2 mirrored-facing real physical recovery remains failing (3/4 strict cases historically). M2 iPhone 16 Safari and user art approval remain pending.
4. No new Vercel deployment is authorized until a reproducible, integrated, passing browser candidate exists. Preserve M2 deployment `dpl_3oueY2oD6hpYRJ2oZ94BzEuZ7L2G` and M1 rollback `dpl_58fwXoovv622MdoHPRa3ykNyzFEt`.

## Next executable gate
Instrument actual joint IDs and relative velocities for the two failing forearm-drag seeds in the browser QA harness. Apply bounded contact-aware joint-limit correction through the solver, verify the 800-case suite at original mobile performance budget, then wire A5 input and A1 telemetry to the authoritative browser solver. Do not count the integration as accepted until that passes.
