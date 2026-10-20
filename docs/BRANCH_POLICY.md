# Balance Lab — single integration line

- **Only active implementation branch:** `integration/balance-lab-20261020`. Every tested change goes here; do not create per-gate branches by default.
- `main` is the protected release branch. Promote only a proven source commit after full physics, browser, performance, and device gates. Do not deploy from abandoned branch heads.
- Historical `automation/*`, `develop/*`, and `backup/*` branches are **read-only reference points**, not independent development tracks. Preserve them until any unique work is incorporated and verified; do not force-push or delete without checking ahead/behind and snapshot backups.
- As of this audit, `automation/20261020-mobile-fixed-step-runtime` contained two unique commits (`8bb23e1`, `5b595ac`) that were cherry-picked to the integration branch as `205cdba` and `d53bf23`. The source branch still appears ahead by SHA because cherry-picking creates new commits; this is not proof of missing changes.
- All other audited remote branches had zero commits ahead of integration at the time of inspection. Recheck before cleanup; collaborators may have pushed since then.
- Keep a single canonical acceptance record at `docs/INTEGRATION_GATE_EVIDENCE_2026-10-20.md`. Do not mark the release gate complete because a subset of tests passes.
- Do not spend Vercel deployments or GitHub Actions minutes for expected compiler/physics failures. Run locally in the recovered sandbox; deploy only after all gates pass.
