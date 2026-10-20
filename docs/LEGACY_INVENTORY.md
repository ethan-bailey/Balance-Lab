# Legacy inventory — reusable code vs. obsolete authority

This file prevents older Balance Lab experiments from being mistaken for active implementations. **Retained does not mean active.** Do not delete working regressions or historical evidence simply because they are not part of the runtime.

| Location | Classification | Agent instruction |
|---|---|---|
| `adapters/planck.mjs`, `rig-config.mjs` | Active foundation | Reuse, verify and extend without replacing physics authority |
| `adapters/active-planck-v6.mjs` | Active character control | Primary integration target; avoid creating a parallel character controller |
| `src/animation/`, `src/actuation/`, `src/behavior/`, `src/physics/` | Active reusable subsystems | Maintain deterministic finite-motor and contact behavior |
| `src/input/`, `src/runtime/` | Reusable input/timing infrastructure | Integrate into same playable actor; preserve mobile cancellation and frame rules |
| `src/ml/`, `scripts/train-side-profile-es.mjs` | Experimental ML | Not production; no accepted learned weights; compare against baseline |
| `browser/lab/active.html`, `browser/lab/active-lab.mjs` | Opt-in playable integration candidate | Test on device before promoting |
| `browser/lab/index.html`, `browser/lab/lab.mjs` | Stable M2 rollback/reference | Preserve until new release accepted; do not develop a competing actor here |
| `adapters/legacy/active-planck.mjs`, `adapters/legacy/active-planck-v2.mjs` … `-v5.mjs` | Historical adapters | Keep for tests/reproducibility; **never choose as current architecture** |
| `tests/*-v4*`, `tests/*-v6*`, `tests/active-*.test.mjs` | Regression suites (mixed generations) | Retain; the active adapter is still v6 even if historical tests exist |
| `docs/history/` | Historical reports and investigation notes | Reference as evidence, not active plans |
| `evidence/` | Recorded pass/fail logs and artifacts | Keep as immutable history; new evidence must be dated and reproducible |
| `README.txt` | Compatibility redirect | Read `README.md` instead |

## Safe removal policy

Only delete a legacy file after verifying that no imports, tests, browser build, evidence reproducer or rollback workflow depends on it, and after recording the replacement in the engineering worklog. Moving code without fixing its imports is not cleanup. Avoid mass deletion or repository history rewriting. Historical report relocation is allowed if references are updated.

## Avoid these wrong turns

- Do not resume development on v2–v5 adapters because their test files remain.
- Do not treat the M2 stable visual lab and v6 active character as two different products; they are release stages.
- Do not replace side-view gameplay goals with a generic ragdoll stress-test or an ML-only research project.
- Do not infer that a task intent labeled `fire` means weapon firing or recoil is implemented.
- Do not ship training candidates simply because a trainer completed; demand held-out improvement and natural movement.
