# Authoritative recovered M2 browser application

This directory contains the **exact extracted M2 release source** from Vercel deployment `dpl_3oueY2oD6hpYRJ2oZ94BzEuZ7L2G` (archive SHA-256 `a4b00c404b4b3aaabf6d219ee4dd8cbfdba862ba6a331ed7bef49bf92409d82a`). The recovered `lab/lab.mjs` remains at its original eight grab-substeps; unsuccessful twelve- and sixteen-substep experiments were reverted. This application now imports the same bounded joint-motor command implementation as `adapters/planck.mjs`, but does not yet consume the complete headless rig adapter, A1 telemetry, or A5 pointer modules.

From this directory: `npm install` then `npm run build`. Serve `dist/` at port 9021 for candidate QA; serve the immutable original M2 baseline at port 9001; run `npm run test:browser` for the eight-seed 800-case browser stress, five deterministic parity scenarios, mobile touch/resize/reload, and console errors. Both servers must serve their own `dist` root. The test writes `m2-browser-gate.json` to the working directory; retain it as evidence. `playwright` may require browser binaries installed in the test environment.

**Release boundary:** This recovered M2 application is a baseline, not the new A1/A2/A5 integrated browser. No new deployment until all browser cases pass, the authoritative physics controller is wired into the playable app, and a reproducible build from a pinned GitHub commit is verified. Physical iPhone 16 and art approval remain pending.

### A2 authoritative active-physics browser QA

The M2 visual preview remains a separate, stable implementation. The build also
ships an opt-in QA route (`/active-qa.html`) and copies the authoritative active
Planck modules. This route is intentionally not a playable preview.

From the repository root, after installing the browser dependencies:

```sh
cd browser && node build.mjs && cd ..
python3 -m http.server 9021 --directory browser/dist &
node browser/tests/active-a2-browser-gate.mjs
```

This gate executes the *same* `src/qa/a2-physical-gate.mjs` in Node and Chromium,
requiring actual step lift, renewed contact, five-second support, numeric bounds
and close trajectory parity for both facings and ±8/±10 N·s impulses. It does not
replace physical iPhone Safari testing or integrate active physics into the M2 UI.
