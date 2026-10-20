# Browser source recovery — 2026-10-20

The READY M2 deployment `dpl_3oueY2oD6hpYRJ2oZ94BzEuZ7L2G` in Vercel project `prj_9BCKojEiFJHNPgvDPQtzjXTgACF2` exposes its build-input file tree through Vercel deployment files API.

Paths: `src/src/build.mjs`, `src/src/package.json`, `src/src/release-source.tar.gz`. The build script extracts `release-source.tar.gz`, creates `dist/lab` and `dist/vendor`, copies `index.html`, `lab/index.html`, `lab/lab.mjs`, `lab/rig-config.mjs`, `lab/rig-topology.mjs`, `lab/support-geometry.mjs`, `lab/m2-visual-rig.mjs`, and `node_modules/planck/dist/planck.mjs`. The package pins Planck 1.5.1 and Node >=24.

**Conclusion:** the current browser application was deployed from a self-contained source tarball uploaded to Vercel, NOT proven to be built from the GitHub repository. The release archive must be retrieved and hash-verified before declaring GitHub authoritative for the playable browser. Do not infer that GitHub root has `lab/` or deploy it as-is.

Current GitHub integration branch: `integration/balance-lab-20261020`; recovered telemetry module at `src/physics/motor-telemetry.mjs`. Its isolated tests passed 7/7 in a local Node environment. Physical Planck MT08–MT10 and complete integrated regression are still pending because the full rig dependency tree was not available locally.

PR #1 is draft and reported non-mergeable. The source branch diverges from main (nine commits ahead, two behind before telemetry recovery). Resolve its base conflicts and remove temporary experimental files only after preserving them, then test the exact candidate before merge.

M2 deployment and accepted M1 rollback must remain unchanged. No new deployment until browser source is reconstructed, integrated, and tested.
