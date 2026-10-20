# Balance Lab — A5 pointer lifecycle, 2026-10-20

Isolated branch: develop/automation-a5-input-20261020. No deployment or GitHub Actions.

## Ten tested gates
1. Reject secondary-pointer move/up/cancel.
2. Blur cancels and releases capture once.
3. Hidden tab, pointercancel and detach release capture.
4. Invalid pointer IDs and failed grab onset cannot strand drag.
5. Rotated segment is picked by body-local hit point.
6. Default release preserves solver velocity; no extra impulse.
7. Explicit opt-in flick is bounded; cancellation never flicks.
8. Actual Planck v6 hand pull remains finite and cancels cleanly.
9. Pointerup callback exception still releases capture.
10. Cancellation callback exception still releases capture.

Executable tests: tests/a5-pointer-lifecycle.test.mjs (10/10 PASS).

## Verification
- Node v24.21.0 / Planck 1.5.1: 68/68 unit tests PASS (evidence/a5-full-unit-final.log).
- Canonical Planck rig: 800/800 PASS, max anchor 0.011421842798 m, max limit 0.070176393982 rad (evidence/a5-canonical-800.log).
- Active v6 rig: 800/800 PASS, max anchor 0.002228383034 m, max limit 0.066658883377 rad (evidence/a5-active-800.log).
- Light landing: 20/20 PASS (evidence/a5-light-landing.log).
- Browser/canonical Node parity: 4/4 PASS, max position delta 2.0532e-13 m (evidence/a5-parity.log).
- A2 default facing T06: four isolated Node shoves PASS (evidence/a5-a2-strict.log).
- A2 mirrored facing T06: FAIL, 3/4 not sustained standing, exit 1 (evidence/a5-a2-mirrored.log). Do not claim A2 accepted.
- First attempts and fixed regression retained: evidence/a5-pointer-first-run.log and evidence/a5-pointer-exception.log; final corrected 10/10 in evidence/a5-pointer-exception-fixed.log.

## Changes and boundaries
Canvas pointer input now owns only one accepted pointer and releases capture on blur, visibility, cancellation, up, detach and callback exceptions. Drag tracker rejects invalid IDs and recovers from grab-onset exceptions. Rig grip defaults flickGain=0; deliberate opt-in still tested. Legacy tests updated to explicitly request flick behavior.

These are isolated A5/M3 modules, not wired into live browser. iPhone 16 Safari performance, touch and orientation remain PENDING DEVICE; Kite art approval remains PENDING USER. Canonical passive T01 no-creep remains FAIL from earlier evidence. A2 mirrored stepping FAIL. A3/A4/A6–A8 not accepted. Live M2 Vercel deployment dpl_3oueY2oD6hpYRJ2oZ94BzEuZ7L2G was READY when checked; accepted M1 rollback dpl_58fwXoovv622MdoHPRa3ykNyzFEt untouched. No new deployment or GitHub Actions.

Next: recover exact live M2 source before browser integration; test A5 on real Safari; repair A2 mirrored stepping; build A3 physical bracing and A4 interruptible get-up; complete A6–A8 with quantitative gates. W3C Pointer Events: https://www.w3.org/TR/pointerevents3/ ; Planck: https://www.npmjs.com/package/planck .
