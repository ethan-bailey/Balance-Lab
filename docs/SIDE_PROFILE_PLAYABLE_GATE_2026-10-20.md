# Side-profile physical animation — playable candidate gate

**Candidate status:** PASS for local Chromium; physical iPhone 16 Safari remains PENDING.

## Delivered

- The existing v6 Planck physical character is now playable with four opt-in upper-body animation targets: Rest, Brace, Reach and Guard.
- The targets are authored in `src/animation/side-profile-gesture.mjs` and fed into `setPoseClip`; they do not set body transforms. The same bounded motor/physics and contact solver determine actual motion.
- The character can still be grabbed, released, pushed, dropped and reset; both facing directions work. `browser/lab/active.html` has touch-friendly pose buttons. No trained ML model or weapon combat is represented as complete.
- The M2 stable visual preview is unchanged. The new candidate remains at `/lab/active.html` and is not promoted to the stable production alias.

## Verified gates

- `node --test tests/*.test.mjs`: 114/114 PASS.
- `node tests/a2-acceptance-gate.mjs` and `--facing=-1`: both PASS.
- `node tests/rig-gate.mjs 800`: 800/800 PASS.
- `node scripts/check-project-identity.mjs`: PASS.
- `cd browser && node build.mjs`: PASS.
- `browser/tests/active-a2-browser-gate.mjs`: 8/8 PASS (Node/Chromium parity).
- `browser/tests/active-preview-smoke.mjs`: PASS (idle, light shove, drag/release, cancellation, resize, reload, mirrored recovery).
- `browser/tests/side-profile-gesture-browser.mjs`: PASS (four poses, mirrored control, zero errors, 3 N·s shove, finite bodies and standing result).
- **Limit:** 8 N·s shove after a long multi-gesture sequence caused falling in both facings; this is an observed limitation, not a passing recovery test. 3 N·s shove after the same sequence passed. ML balance remains untrained and visible knee collapse is not resolved.
- **Physical device:** iPhone 16 Safari QA and 60 FPS performance not yet verified.

## Deployment policy

Only create an isolated preview from the exact tested commit, with no production alias changes and no automatic redeploys. Verify the deployed route returns 200 and modules load; record deployment ID and link. This is a test link, not a release.
