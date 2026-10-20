# True side-view character — playable preview gate

## Correction to the character brief

User clarified that **side profile means the 2D side-scrolling gameplay presentation of Crisis Response or Happy Wheels**, not merely a physically 2D ragdoll displayed front-on. The active playable preview now uses a human side silhouette: one eye and ear, a protruding nose and jaw, hair, forward-toed boots, torso chest/back profile, and foreground/background limb layering for both facings. This is **new original procedural Canvas art**, not copied game assets. It uses the same Planck body transforms and separate left/right limbs; visual updates never change physical state.

## Code and limits

- `browser/lab/side-view-character.mjs`: pure Canvas profile segment/head renderer; `sideViewDrawingOrder()` switches limb depth with facing. No rig/physics modifications.
- `browser/lab/active-lab.mjs`: renders the new profile rather than the front-facing Kite trainee. Keeps four physical animation targets and A5 drag/release/push/drop controls.
- `browser/build.mjs`: copies new renderer into deployable output; build 404 discovered and fixed during local QA.
- `tests/side-view-character.test.mjs` and `browser/tests/side-view-profile-browser.mjs`: segment identity, both facing directions, finite bodies, physical pose buttons, nonblank artwork and browser errors.
- **Limitation:** underlying M1-era physics rig still has side-by-side left/right offsets. A dedicated side-scrolling anatomical/locomotion rig and combat controls remain future work; this gate corrects the rendered profile, not the full physical anatomy or ML balance.

## Gate evidence

- Node tests **116/116 PASS**; strict A2 both facings PASS; 800-case Planck stress PASS; identity check PASS.
- Browser source parity, touch smoke, gesture smoke and true side-view render test all PASS, zero page errors, both facing directions.
- Browser QA on mobile Chromium is not iPhone Safari device acceptance; 60 FPS remains unverified on the physical device.
- No production alias changes. Isolated preview to be deployed only from the exact tested commit.

## Isolated deployed preview

- Commit: `0e5beda8092cd3b5f937184cade7fa522eb4aa38`.
- Vercel deployment: `dpl_GxNGbQBnUy9X9oaqVUtMxhPBpLWC`, **READY**, target null (no production alias update).
- Playable link: `https://sling-lab-play-ioeqridfa-ethanbaileymarsh-8332.vercel.app/lab/active.html`.
- HTTP 200 confirmed for active HTML, controller, profile renderer, gesture module, v6 Planck adapter, Planck vendor module and stable M2 HTML. Source check confirms active controller imports the new profile renderer.
- Physical iPhone 16 Safari device validation still pending user testing.
