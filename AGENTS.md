# Balance Lab — mandatory contributor instructions
**Primary execution plan:** docs/PHYSICS_AI_ROADMAP.md. **Mandatory integration and gate bookkeeping:** docs/INTEGRATION_WORKFLOW.md. Read it before any development, verification, refactor, review, merge or deployment. It extends, and does not erase, the original MASTER_PLAN.md and preserved M0–M8 acceptance gates.

## Architecture lock
Only the physics engine writes simulated transforms. Behavior selects intent; animation yields desired joint poses; balance/reflex layers modify targets; bounded joint motors try to track them; simulated contacts and momentum determine reality. No body teleport, foot pin, infinite force, artificial success, copied Euphoria or other proprietary source/assets. Maintain fixed 120Hz stepping and iPhone 16 performance discipline.

## Contribution gate
Identify roadmap task ID and dependency first. Make focused change, add deterministic tests including negative/overpower scenarios, run affected regression tests, log evidence and limitations, and commit only intentional files. Preserve unrelated untracked or modified work. Don't reset, clean, force push, auto-deploy, or consume GitHub Actions quota for known failures. No claim of release completion without physical Safari testing and user art approval.

## Truthful status
Record PASS, FAIL, PENDING DEVICE/USER and PROTOTYPE separately. An isolated active-controller success does not close a failure in a passive adapter, nor does a state labeled stepping prove that a foot physically stepped. Existing live deployment and accepted rollback remain unchanged until a validated release.

## Team coordination
Every agent or contributor must read docs/PHYSICS_AI_ROADMAP.md, docs/DEFERRED_TESTS.md, the engineering worklog and source status at start; claim a non-overlapping task/file set and document handoff with SHA, tests and next work. Integration owner verifies contracts and all acceptance gates before merges. Local sandbox commits are not proof of remote persistence.

## Cost-efficient remote development — REQUIRED
- GitHub is the intended durable source of truth once an authorized Balance Lab repository/remote is connected. Verify that changes have actually been pushed before assuming a sandbox snapshot is a backup. Never push to an unrelated repository or overwrite remote work.
- Use Vercel Sandboxes only for work requiring remote execution (Node physics tests, compilation, browser smoke checks or profiling unavailable elsewhere). Review/edit using the cheapest available authorized workflow first; batch commands into short sandbox sessions.
- Do not keep a sandbox running between engineering sessions, for polling, or while waiting for user feedback. After preserving work and evidence in a verified durable destination, stop it. A local Git commit alone is NOT sufficient when no remote is configured. If durable backup is unavailable, record this risk and preserve the recoverable workspace rather than destroy unsaved work.
- Do not create routine Vercel deployments for intermediate edits. Deploy only for device QA at integration gates or verified release candidates. Maintain stable preview and rollback.
- Prefer focused unit tests during development; run exhaustive stress/performance suites at milestone gates and after relevant physics changes, not every edit. Do not consume exhausted GitHub Actions quota.
- Before expensive work, check runtime size, idle billing, and usage limits when available. Record significant compute evidence and distinguish billing estimates from charges.
- On sandbox resume, recheck session ID, source, git status and any untracked user files. Never reset/clean unrelated changes.
