# Balance Lab — mandatory contributor instructions
**Primary execution plan:** docs/PHYSICS_AI_ROADMAP.md. Read it before any development, verification, refactor, review, merge or deployment. It extends, and does not erase, the original MASTER_PLAN.md and preserved M0–M8 acceptance gates.

## Architecture lock
Only the physics engine writes simulated transforms. Behavior selects intent; animation yields desired joint poses; balance/reflex layers modify targets; bounded joint motors try to track them; simulated contacts and momentum determine reality. No body teleport, foot pin, infinite force, artificial success, copied Euphoria or other proprietary source/assets. Maintain fixed 120Hz stepping and iPhone 16 performance discipline.

## Contribution gate
Identify roadmap task ID and dependency first. Make focused change, add deterministic tests including negative/overpower scenarios, run affected regression tests, log evidence and limitations, and commit only intentional files. Preserve unrelated untracked or modified work. Don't reset, clean, force push, auto-deploy, or consume GitHub Actions quota for known failures. No claim of release completion without physical Safari testing and user art approval.

## Truthful status
Record PASS, FAIL, PENDING DEVICE/USER and PROTOTYPE separately. An isolated active-controller success does not close a failure in a passive adapter, nor does a state labeled stepping prove that a foot physically stepped. Existing live deployment and accepted rollback remain unchanged until a validated release.

## Team coordination
Every agent or contributor must read docs/PHYSICS_AI_ROADMAP.md, docs/DEFERRED_TESTS.md, the engineering worklog and source status at start; claim a non-overlapping task/file set and document handoff with SHA, tests and next work. Integration owner verifies contracts and all acceptance gates before merges. Local sandbox commits are not proof of remote persistence.
