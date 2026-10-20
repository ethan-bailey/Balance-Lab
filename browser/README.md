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

### Opt-in A2 playable candidate

`/lab/active.html` is a **separate** playable A2 candidate, not the stable M2
preview. It uses the same `createActiveRigWorld` module verified by the Node and
Chromium physics gates, draws the existing Kite visual rig from actual Planck
body poses, and connects the preserved A5 pointer lifecycle through the bounded
physics grip adapter. Release and cancellation do not inject an unverified flick.
The UI exposes Reset, Drop and Push; append `?facing=-1` to physically reflect
the rig. Append `?rigqa=1` for deterministic test-only stepping (no RAF).

With the candidate server running on port 9021:

```sh
node browser/tests/active-preview-smoke.mjs
```

The smoke gate verifies physical recovery in both facings, actual canvas
rendering, pointer grab/move/release, blur cancellation, resizing, reload, finite
rig bodies and no browser exceptions. The full A2 browser source-parity and M2
baseline regression suites must also pass before any new preview deployment.
Physical iPhone 16 Safari acceptance remains pending.

### Playable active physics candidate

`/lab/active.html` runs the authoritative A2 active Planck rig with the original
Kite canvas art, finite-force grabs, A5 pointer cancellation and physically
simulated recovery. The existing `/lab/` M2 preview is deliberately unchanged.
Run `node browser/tests/active-preview-smoke.mjs` against a local build served on
port 9021. The candidate is provisional until physical iPhone Safari QA.

### One-time A2 QA deployment

Source-pinned preview (not the stable alias):
https://sling-lab-play-6h80lxnx5-ethanbaileymarsh-8332.vercel.app/lab/active.html

Deployment `dpl_EKbNf4CrmNxB8bu222PqkczweAmd` from commit
`b2aee5afb042c01b4d61239be4b299379c042bc5` passed remote HTTP and
mobile Chromium physics smoke tests. Use `?facing=-1` to exercise reversed
facing. No production promotion; physical Safari QA is still required.
