# Project consolidation — 2026-10-20

**User directive:** reuse existing useful code, remove material that could cause an agent to believe the work is a different project.

## Result

- **Single product identity:** side-profile Planck character, animated and physics-driven, experimental ML balance, mobile controls, future weapons/equipment/combat. See `docs/PROJECT_CHARTER.md` and `README.md`.
- **One current integration:** `adapters/active-planck-v6.mjs` on `adapters/planck.mjs`; no runtime physics code replaced. All v2–v5 historical active adapters and original pre-v2 adapter moved into `adapters/legacy/`, and importing historical regression tests updated. Historical adapters are not removed because their tests are useful.
- **No misleading entry point:** root `README.txt` now redirects to the authoritative `README.md`; `AGENTS.md`, roadmap, integration workflow and browser README explicitly agree on project identity.
- **Historical documents:** nine dated engineering reports moved into `docs/history/`; internal references updated where they referred to root docs. `docs/history/README.md` explains that history is evidence, not current development instructions. Worklog, deferred tests, integration evidence and technical roadmap remain live.
- **ML remains an opt-in experiment:** no trained weights accepted, no gameplay combat implemented and no claim that existing visible knee-buckling issue is solved.
- **Untracked workspace artifacts untouched:** pre-existing browser node_modules symlink, diagnostic scripts, scratch evidence and local QA output were not staged or removed.

## Verification

- `node scripts/check-project-identity.mjs`: PASS (charter, active source, historical adapters and stale-import check).
- `node --test tests/*.test.mjs`: **112/112 PASS** after relocating old adapters.
- Strict A2 canonical and mirrored gates: PASS (both exit 0).
- `node tests/rig-gate.mjs 800`: PASS (800 passing stress cases).
- `cd browser && node build.mjs`: PASS (no code changes required).
- Active A2 Node/Chromium parity: **8/8 PASS**; playable mobile Chromium smoke: **PASS**; no physical device claim.
- Physical iPhone 16 Safari: **PENDING**; no public deployment created.

## What was deliberately *not* deleted

Working physics/animation/input/ML code, tests, original M2 rollback implementation, browser candidate, archived historical reports and failure evidence. Deleting these would discard reusable engineering work or damage rollback/regression coverage. This cleanup changes **source navigation and authority**, not character behavior.
