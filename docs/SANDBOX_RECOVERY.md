# Balance Lab — automatic Vercel sandbox recovery

**Policy:** A Vercel sandbox/session timeout is an expected infrastructure event, not a reason to abandon an in-progress engineering gate. The integration owner must recover the workspace and resume independently, without asking the user to repair the session. Treat a genuinely missing/unrecoverable snapshot, permissions failure, or inability to obtain any executable workspace as an external blocker only after trying the available recovery paths.

## Recovery procedure

1. Use the connected Vercel API to query the **named persistent sandbox** `balance-m2-completion-20261020b` with `projectId=prj_9BCKojEiFJHNPgvDPQtzjXTgACF2`, `teamId=team_EJbd0IQzCg7SLyJbtdlBPk75`, `resume=true`.
2. Always read the **returned** `currentSessionId` / `session.id` and `currentSnapshotId`. Never reuse a session ID from a previous handoff: stopped/expired sessions cannot accept commands, and their logs may return HTTP 410 `sandbox_stream_closed`.
3. If the named sandbox has stopped, `resume=true` restores the latest named-sandbox snapshot to a new session. If the named sandbox or its snapshot is unavailable, inspect the project's session snapshots, restore the latest valid project snapshot into a new named sandbox if authorized, or recover the GitHub integration checkout and source artifacts in a fresh workspace. Do not overwrite an existing sandbox or unrelated files.
4. Verify the restored checkout with `git status --short`, `git branch --show-current`, `git rev-parse HEAD`, `git ls-remote origin refs/heads/integration/balance-lab-20261020`. Preserve all uncommitted changes. The sole active implementation branch is `integration/balance-lab-20261020`; `main` is the protected release branch.
5. Restore runtime dependencies using pinned project manifests and locally cached dependencies where possible. Re-run the interrupted focused gate, then the full relevant Node/browser gates before deployment. Do not infer test success from old logs or a restored snapshot.
6. Commit and push verified, intentional work **before** the session expires. Stop/snapshot the named sandbox at a safe checkpoint to avoid idle compute. If a long-running session expires mid-gate, repeat steps 1–5; do not silently lose results.

## Verified recovery event — 2026-10-20

- Previous session `sbx_C6H8BAe0EDZmLmNoY1XOKk7GPEFY` expired with HTTP 410 `sandbox_stream_closed` while investigating mirrored A2 recovery.
- The named-sandbox lookup with `resume=true` returned a fresh running session `sbx_ugnGARWwb3jZBZTvKBPxUNvq7DAw`, restored from snapshot `snap_9ShE2PqmpT6uSdpOTiZoihOOjWnO`.
- Checkout remained at commit `6103356` on the integration line; existing unrelated untracked browser files remained intact.
- Vercel rejected an attempt to extend the session by an additional hour with `sandbox_timeout_invalid` (maximum execution timeout exceeded). The supported fallback is to restore the named snapshot into a new session, not to depend on an unlimited session extension.

This procedure is an operational runbook, not a promise of continuous background execution. It applies whenever an agent is actively executing a development turn or scheduled task.
