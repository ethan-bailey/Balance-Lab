# Balance Lab remote backup

This repository is the durable backup for the Balance Lab physics-character project. Existing work was developed in an external Vercel Sandbox.

The transfer will preserve the original Git history in a Git bundle at `backups/balance-lab-history.bundle`, in addition to a browsable source snapshot. Restore original commit history with `git clone backups/balance-lab-history.bundle restored-balance-lab` after downloading the bundle. This bootstrap commit was created because the connected GitHub integration cannot directly authenticate a `git push` from the sandbox.

Uncommitted workspace experiments are not part of the archived Git history. Do not assume those experiments have been pushed or merged.
