Balance Lab isolated engineering branch, 2026-10-20.
Restored from snapshot snap_W8dFrzJXEX90oCzDapGO4ymTRz2T.
DO NOT DEPLOY /vercel/m2/site: it predates current public M2.
Current stable public: dpl_3oueY2oD6hpYRJ2oZ94BzEuZ7L2G.
Rollback M1: dpl_58fwXoovv622MdoHPRa3ykNyzFEt.
Node 24 + Planck 1.5.1 installed in /vercel/m2/node_modules.
Run from /vercel/balance-engineering:
 node --test tests/adapter.test.mjs tests/drag-tracker.test.mjs tests/contact-impulses.test.mjs
 node tests/rig-gate.mjs 800
 node tests/parity.mjs
 node tests/long-idle.mjs
Latest Node stress 800/800 PASS. Browser parity PASS.
T01 no-creep FAIL: 60s idle torso drift -2.918 m.
M2 art approval and physical iPhone 16 Safari validation pending.
M3 input tracker and M4 contact sensor are isolated and not integrated into live preview.
See docs/ENGINEERING_WORKLOG_2026-10-20.md and docs/DEFERRED_TESTS.md.
