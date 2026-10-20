# Balance Lab — autonomous engineering evidence, 2026-10-20

## Provenance and release safety
- The authoritative roadmap is Library `/Balance Lab/MASTER_PLAN.md` (M0–M8, iPhone 16 P0).
- Current stable M2 Kite public preview: `https://sling-lab-play.vercel.app/lab/`, deployment `dpl_3oueY2oD6hpYRJ2oZ94BzEuZ7L2G`, JS SHA-1 `387ce6da48e001fe37f557eeea5fd1e914afca96` supplied in the handoff.
- Accepted M1 rollback deployment: `dpl_58fwXoovv622MdoHPRa3ykNyzFEt`.
- Recovered isolated development environment from Vercel snapshot `snap_W8dFrzJXEX90oCzDapGO4ymTRz2T` into session `sbx_5y76mfokfaLVqOHZ2SLddZDD7cRK`.
- The restored snapshot's `/vercel/m2/site/lab/lab.mjs` SHA-1 is `32a5f29d4162b8c5d47ae624e147e50362bc4b3f`, **older than live**. Never overwrite the live deployment from this snapshot. New code is isolated in `/vercel/balance-engineering`.
- The requested M2 goal/provisional-release/long-run worklog documents were not present in the restored snapshot or current Library search; no contents were fabricated. The handoff supplied their key release state.
- No GitHub Actions were run and no Vercel deployment was created in this session.

## Actual implementation
1. Created `adapters/planck.mjs` against pinned installed `planck@1.5.1` and canonical 13-body/12-joint `rig-config.mjs`. Includes actual mass/inertia, revolute joints, motor torques, adaptive 2/4/12 substeps, ground contact, finite compliant grab, per-body impulse caps, numerical telemetry and deterministic fixed stepping.
2. Corrected the Node motor brake term to match the deployed browser implementation's limit-guard cap of 3 rad/s (the recovered snapshot used 6). Browser-to-Node parity then became near machine precision.
3. Added finite-value validation for grab points, grab targets and impulses. Distal direct impulses now cap delta-v to 12 m/s rather than applying a torso-sized impulse to a 0.24 kg hand. This new distal impulse API is **not yet wired to browser input**.
4. Implemented `src/input/drag-tracker.mjs`: single-pointer ownership, cancellation, bounded history, ordered finite samples and capped release-speed reporting; no physics teleportation. Isolated M3 component, **not yet integrated into public preview**.
5. Implemented `src/physics/contact-impulses.mjs`: reads real Planck post-solve foot normal impulses for future M4 impact sensing without mutating physics during callbacks. Isolated module, **not yet integrated into public preview**.

## Verified evidence
- Node unit tests: adapter 6/6, pointer tracker 3/3, foot contact impulse sensor 1/1, total **10/10 PASS**.
- Independent canonical Node rig stress: **800/800 PASS**, 100 seeded trials each of idle, wrist pull, ankle pull, flick, drop, shove, tumble and extreme impulses. Final run 2026-10-20T09:16:03Z; max joint anchor error 0.011422 m, max limit violation 0.070177 rad, elapsed 34.635 s. Full per-case evidence in `evidence/node-rig-gate-800.json`.
- Initial independent stress runs failed (773/800 and 775/800). Root causes: excessive impulse to low-mass hands and mismatched substep/motor brake policy. Preserved 775/800 evidence in `evidence/node-rig-gate-800-before-impulse-cap.json`; 773/800 failure recorded in session command logs.
- Live Vercel Chromium QA smoke: HTTP 200, no page errors, 13 original physics IDs, Kite trainee ID, 393x793 viewport, DPR2. This is **desktop Chromium mobile emulation, not Safari**.
- Browser/Node physical state parity against the **deployed** QA hook: idle, torso shove, hand grab, release all PASS; maximum position divergence 2.1e-13 m and angle divergence 4.6e-13 rad. Before matching the live motor brake term, parity failed; corrected.
- 60 s unassisted idle: numerical integrity PASS (7200 steps, max anchor 0.000746 m, limit violation 0), but **T01 no-creep FAIL**: torso x drifted to -2.918 m, with vx -0.193 m/s. Do not confuse numerical stability with balance/standing acceptance.

## iPhone 16 Performance
- No physical iPhone 16 Safari measurements this run; median/p95 frame, touch-to-presentation, thermal, memory, rotation and 5–10 minute sustained data remain unknown.
- Browser uses 120 Hz fixed step, capped catch-up and DPR<=2; adaptive 12 substeps under grab may be expensive. Node 34.6 s / 800 stress scenarios is **not** a device frame-time measurement.
- Public M2 preview and M1 rollback were preserved; no new deployment.

## Open acceptance gates
- M2 art: provisional Kite; explicit user approval pending.
- M2 iPhone 16 Safari: physical device frame p95, touch, rotation, thermal and sustained test pending.
- M3: pointer tracker isolated; browser integration and flick/cancel QA pending.
- M4: foot post-solve sensor isolated; landing/catch/step controller pending.
- T01 idle: 60-second no-creep failed (torso -2.918 m).
- M5–M8: active muscles, get-up, polish, mobile release and biomechanics research not accepted.

## Next engineering priorities
1. Preserve isolated source and evidence snapshot without touching live M2 or M1 rollback.
2. Establish dedicated version-controlled canonical Balance Lab source from latest deployed files.
3. Integrate tested pointer tracker and post-solve sensor; rerun QA and deterministic parity.
4. Implement torque-limited contact-aware balance/step controller to fix T01 and T05–T08.
5. Complete M5–M8 and collect actual iPhone 16 Safari QA before any final acceptance.

## Original developer references
Planck revolute motors: https://www.npmjs.com/package/planck
Box2D contacts: https://box2d.org/doc_version_2_4/md__e_1_2github_2box2d__24_2docs_2dynamics.html
Post-solve callbacks record contact impulses; do not mutate physics entities inside callbacks.
