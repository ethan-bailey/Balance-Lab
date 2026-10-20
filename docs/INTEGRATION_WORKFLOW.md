# Balance Lab — Integration Operating System
Effective 2026-10-20. This document is subordinate to `docs/PHYSICS_AI_ROADMAP.md` and preserves the original M0–M8 acceptance requirements.

## Single source of truth
- GitHub default branch is the durable **accepted baseline**, not an automatic landing zone for unverified work.
- Use one explicitly designated integration-candidate branch per release. Before choosing it, inspect live branch heads, uncommitted changes, and deployment source SHAs. Never infer the candidate from a sandbox.
- `docs/PHYSICS_AI_ROADMAP.md` defines technical dependencies and acceptance. This document defines delivery workflow. Original `MASTER_PLAN.md` and M2 release records may live in the project Library; a 404 at repo root does not supersede them.
- Stable M2 preview `dpl_3oueY2oD6hpYRJ2oZ94BzEuZ7L2G` and accepted M1 rollback `dpl_58fwXoovv622MdoHPRa3ykNyzFEt` remain untouched without verified release authorization.

## Gate ledger — mandatory semantics
Every gate record includes: stable ID; owner; dependency; exact base/head SHA; code paths; reproducible command; expected physical outcome; observed measurements; evidence path; integration branch/commit; status; deferred reason if any.
Allowed statuses:
- `TODO`: not started
- `IN_PROGRESS`: source being modified
- `UNIT_PASS`: focused tests pass, not integrated
- `INTEGRATED_PASS`: tests pass against authoritative candidate and complete character behavior
- `FAIL`: measured acceptance condition fails
- `PENDING_DEVICE`: requires physical Safari
- `PENDING_USER`: requires art or subjective approval
- `BLOCKED_EXTERNAL`: independently demonstrated external dependency, with evidence

**Counting:** A gate counts toward the run's completed engineering gates only with implementation and passing executable evidence; `UNIT_PASS` is not equivalent to milestone acceptance. Documentation-only changes and unpushed sandbox changes are not integrated deliverables.

## Every execution
1. Read roadmap, latest master/release records, deferred tests, gate ledger, git branches/PRs, local worktrees, and latest deployment metadata. If a source is inaccessible, record the lookup and continue independent work.
2. Select 5–10 dependency-ordered, testable gates across the full project; prefer 10 only if feasible. Reserve time for integration, not only isolated modules.
3. Claim disjoint file ownership for parallel workers. No simultaneous edits to shared runtime/adapter without an integration owner.
4. Implement smallest end-to-end physical behavior slice (input -> intent/reference -> bounded motors -> solver -> sensed contacts -> render) and validate in Node then candidate browser.
5. Run focused tests on edits; broader deterministic stress after physics integration. Record failures verbatim and do not change thresholds solely to turn failures green.
6. Merge only when exact candidate SHA, test commands, and rollback are recorded; otherwise preserve branch and mark not integrated.
7. Deploy only at a meaningful QA gate. Never spend GitHub Actions quota on known failures.
8. Update the gate ledger and handoff once at end of run; report counts separately for isolated, integrated, device and user gates.

## Immediate integration queue (not claimed complete)
1. Locate original master/M2 files in Library and verify latest remote branches/SHAs.
2. Recover A1 telemetry archive `balance-lab-a1-telemetry-20261020.tar.gz`, verify hashes, and commit to its intended branch.
3. Recover A5 pointer changes from the preserved snapshot; verify whether `e6c1bcb` exists remotely before any push.
4. Wire A1 telemetry to every actual solver substep, prove opt-in parity and measure overhead.
5. Reproduce and repair A2 reversed-facing T06 (currently 1/4 strict pass); require real foot liftoff/touchdown and canonical + mirrored acceptance.
6. Integrate A5 pointer lifecycle into exact current browser candidate; verify cancellation, release and rotation.
7. Complete browser/Node pinned Planck 1.5.1 parity and canonical rig gate.
8. Profile fixed-step frame budget and bounded catch-up for iPhone 16; label emulation vs physical measurements.
9. Run end-to-end shove -> catch -> grab -> fall -> recover replay with actual contacts and no teleport.
10. Keep physical Safari and art approval pending until user evidence exists.

## Handoff template
```
Base SHA / candidate SHA / remote push verified:
Owned paths and other preserved work:
Selected gates / integrated pass / unit pass / fail / pending:
Commands and measurements (including first failures):
Browser/deployment IDs (if any), rollback:
Exact next independent executable step:
```

## Anti-drift rules
No new parallel prototype if a working tested module is waiting for integration unless a blocker is documented. No duplicate plan documents as substitutes for source changes. No silent relaxation of numerical gates. No claims of deployed behavior based solely on isolated Node tests. Keep immutable test evidence and exact source hashes.
