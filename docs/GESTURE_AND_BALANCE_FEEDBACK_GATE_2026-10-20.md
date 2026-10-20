# User feedback gate: Reach, Guard and weak balance

## Report

User tested true side-view preview and reported: **Brace best at keeping the character standing**, poor balance under external force, and Reach/Guard hands placed unnaturally. Treat as observed device feedback, not an assumed renderer bug.

## Reproduction and cause

With existing `src/animation/side-profile-gesture.mjs`, measured physical hand positions (character-forward relative to torso) after 360 steps showed:

- Reach facing +1: left `(0.04, -0.36)` m and right `(0.06, -0.38)` m. Both hands remained below/in front of torso instead of reaching forward.
- Guard facing +1: left `(-0.30, -0.35)` m and right `(-0.25, -0.04)` m, i.e. both behind torso in the character-forward coordinate system.
- Root cause: incorrectly signed/local shoulder and elbow reference targets for a rig whose arms hang vertically at rest. Multiplying arbitrary pose angles by facing does not guarantee anatomically meaningful end-effector positions.

## Implemented corrections

- Reach: one forward arm, other at side. After correction, physical leading hand about **0.88 m forward**, roughly level with torso; verified both facing directions.
- Guard: both arms raised forward, physical hands at approximately **0.33 m and 0.86 m** forward and near torso height, verified both facings. The wide separation reflects the existing front-view-era shoulder anchors; a new anatomical side-view rig is still needed to achieve realistic guard hand proximity.
- Kept Brace and Rest unchanged.
- `tests/gesture-hand-position.test.mjs` verifies physical end-effector positions, not merely animation target numbers.

## Balance experiment: evidence, boundaries

- Existing browser preview runs verified **steps-only** mode by default. It uses original authoritative Planck physics, bounded motors and recovery steps.
- Exposed **Balance: Assist (experimental)** toggle, using the existing opt-in `createBalanceReflex` with ankle gain 1.4 and hip gain 0.8. The reflex commands joint motor targets; it does not pin feet, teleport or inject hidden stabilization forces. The toggle persists across Reset, and can be switched off immediately.
- The baseline failed **10/16** deterministic 6-second trials with a ±8 N·s horizontal torso impulse at t=1s, across both facings and Rest/Brace/Reach/Guard. Experimental Assist failed **1/16** of the same trials, specifically facing +1, Reach, backward impulse. Both results are based on the same physical engine and newly corrected gestures.
- On mobile Chromium, one independent A/B scenario (forward-facing Rest, backward 8 N·s) fell in baseline (torso y=0.262m), but remained standing with Assist (torso y=1.370m). These are scenario-specific results, **not** proof of natural human balance under all forces.
- A strong 25 N·s shove still knocks the assisted character down in both facings; the motor can be overpowered.
- Directly enabling Assist by default caused existing long-duration recovery/browser acceptance gates to regress, including mirrored stepping. **Do not promote Assist to default** until the controller-ownership and recovery sequencing regressions are resolved. This opt-in A/B gate is intentional, not a completed balance system.
- ML controller remains untrained, no physical iPhone 16 Safari frame-rate validation, no combat/IK or true anatomical side-profile joint placement yet.

## Verification

- Node tests **121/121 PASS**.
- Strict A2 both facings PASS; Planck stress 800/800 PASS; identity check PASS; browser build PASS.
- Mobile Chromium browser: active source parity PASS; untouched idle, touch grab/release/cancel, shove, mirrored recovery PASS with steps-only default; pose sequence PASS; side-view render PASS; new Assist toggle and A/B physical response PASS. Zero page errors.
- Preserve stable M2 production alias. Isolated preview deployment only from exact tested commit, with deployment evidence appended after READY/HTTP checks.
