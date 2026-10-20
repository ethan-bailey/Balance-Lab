# Balance Lab

**One project:** a **side-profile, physically simulated humanoid** that can be controlled, interact with its environment, recover balance, blend authored animation with physical motion, and eventually equip weapons and perform combat and other gameplay actions. Inspired by the *behavioral quality* of physics-based character animation systems; no proprietary engine code or assets are reused.

This is **not** a separate ragdoll toy, a general-purpose physics engine, a 3D character game, or the Crisis Response port. The interactive physics sandbox is a **test harness for the eventual side-view gameplay character**. We are building reusable character-control technology within Balance Lab, not abandoning the character or creating a competing project.

## Current reality (read before making changes)

- **Authoritative physics:** Planck 1.5.1, 2D articulated body, real contacts, bounded joint motors, fixed 120 Hz simulation. Physical poses are never written by animation or ML.
- **Active development adapter:** `adapters/active-planck-v6.mjs`; core physics `adapters/planck.mjs`; rig `rig-config.mjs`. Earlier active adapter versions are historical regression references, **not alternatives to integrate**.
- **Playable integration candidate:** `browser/lab/active.html` + `browser/lab/active-lab.mjs` (opt-in). **Stable existing M2 preview:** `browser/lab/index.html` + `browser/lab/lab.mjs`. These are separate release stages, not two products. Do not silently replace the stable preview.
- **Animation and balance:** `src/animation/`, `src/actuation/`, `src/behavior/`, `src/physics/`; player touch/grabbing `src/input/`.
- **ML experiment:** `src/ml/`, `scripts/train-side-profile-es.mjs`, `docs/ML_SIDE_PROFILE_EXPERIMENT.md`. A policy interface and seeded experimental trainer exist; **no learned model has demonstrated an improvement, and none is enabled by default**.
- **Future gameplay:** player locomotion, equipment, weapon grips, aiming, recoil, attacks, damage and other interactions are **design goals, not completed mechanics**. `handUse` and activity intent are interface contracts, not weapon implementations.
- **Known quality issue:** reported visible knee buckling and weak whole-body reactions remain unresolved in the actual interactive experience. Simple headless no-input/light-shove diagnostics did not reproduce the reported collapse.
- **Primary target:** iPhone 16 Safari at 60 FPS, with mobile controls and measured performance. Browser simulation passes are not device acceptance.

## Where an agent starts

1. Read [`AGENTS.md`](AGENTS.md) and [`docs/PROJECT_CHARTER.md`](docs/PROJECT_CHARTER.md) for identity, boundaries and the current source of truth.
2. Read [`docs/PHYSICS_AI_ROADMAP.md`](docs/PHYSICS_AI_ROADMAP.md) for dependency-ordered engineering gates; [`docs/ML_SIDE_PROFILE_EXPERIMENT.md`](docs/ML_SIDE_PROFILE_EXPERIMENT.md) for the experimental learned-controller track.
3. Read [`docs/INTEGRATION_WORKFLOW.md`](docs/INTEGRATION_WORKFLOW.md), [`docs/DEFERRED_TESTS.md`](docs/DEFERRED_TESTS.md) and [`docs/INTEGRATION_GATE_EVIDENCE_2026-10-20.md`](docs/INTEGRATION_GATE_EVIDENCE_2026-10-20.md) for workflow, unresolved gates and evidence.
4. Verify the **live Git branch, worktree, remote, source, tests and preview** before changing anything. Treat historical snapshots and past agent claims as stale until checked.
5. For previous experiments and older adapter versions, consult [`docs/LEGACY_INVENTORY.md`](docs/LEGACY_INVENTORY.md) and [`docs/history/README.md`](docs/history/README.md). Do not start new development from historical code.

## Testing and builds

From the repository root with Node and the pinned dependencies installed:

```sh
node --test tests/*.test.mjs
node tests/a2-acceptance-gate.mjs
node tests/a2-acceptance-gate.mjs --facing=-1
node tests/rig-gate.mjs 800
cd browser && npm run build
```

For browser smoke and local QA setup see [`browser/README.md`](browser/README.md). The historical v2–v5 regression tests are intentionally retained; test names do not indicate current runtime ownership.

## Delivery rules

Work in the authorized Balance Lab GitHub repository. Preserve unrelated changes and historical evidence. No forced resets, silent deletion, auto-deployments, wasteful GitHub Actions runs or unapproved hosted ML spend. Keep the existing stable preview unchanged until new integration gates pass and device testing is complete.
