# Side-profile physical rig, walking and balance quality gate

## User observations (iPhone)

- Needs walking in both horizontal directions, with a credible step cycle.
- Character looks like a front-facing skeleton dressed as a side-view figure.
- Balance Assist is promising but well below desired performance; motor response looks jittery.

## Verified geometry problem

The existing `rig-config.mjs` is explicitly marked as an M1 selection rig, not final anatomy. It has torso x=0, thigh/hip anchors x=±0.13 m, upper arms/shoulder anchors x=±0.265 m. `browser/lab/side-view-character.mjs` draws one side behind the torso and the other in front, but does not change their actual x positions. The user observation is physically correct.

**Do not fix with sprite flipping or visual offsets.** Build an actual sagittal-plane human rig in a new opt-in config, preserving the current stable 13-segment rig for comparison. The physical head/neck should eventually be separate joints, not a purely attached head illustration. Distinguish depth layering for near/far limbs (visual) from sagittal displacement (physical). Validate joint anchors, COM, foot contacts, collision filtering, knees, and arm reach in both facings.

A naive trial moving the original two leg chains from ±0.13 m to ±0.055 m and arm chains from ±0.265 m to ±0.085 m **failed**: the modified character fell even in idle. This establishes that geometry cannot be collapsed without re-solving neutral joint angles, support polygon, stance and motor configuration. No unsafe variant was merged or deployed.

## Walking experiment and rejection

Tested 120 Hz Planck looped sinusoidal hip/knee/ankle pose clips (amplitudes 0.08–0.7 rad), both facing directions and walk commands. Without the balance controller, large majority of trials fell. With stepping and Assist enabled, many trials stood, but their net displacement was frequently small, in the wrong direction, or the rig fell. This is **not a working walking system**. No animation-only locomotion was integrated into the active browser.

## Required implementation order

1. **Rig G1: true sagittal configuration.** Define anatomically plausible thigh, shin, ankle, foot, hip, shoulder, upper arm, forearm and wrist physical anchors and joint limits; ensure stable idle in both facings for 10 seconds, without artificial pinning. Test both isolated and combined feet, ground contacts and mirrored symmetry. Preserve M1 rig unchanged.
2. **Rig G2: dynamic stance and support ownership.** Explicit near/far stance foot, swing foot, center of mass and capture-point sensor. No simultaneous competing stance/step/gesture ownership. Support can switch on actual contact and load; hands can remain independently controlled.
3. **Walk W1: input intent.** Signed left/right desired horizontal velocity with bounded acceleration, deceleration and release. Provide accessible touch controls, including pointer cancel and release, and keyboard for desktop QA. Camera follows actual world x rather than translating the body.
4. **Walk W2: stance-to-swing transition.** Swing foot lifts by finite hip/knee/ankle motor torques, travels ahead of the predicted COM, contacts ground, accepts load, and becomes stance foot. Target foot placement adapts to measured speed, perturbations and current facing. No position/velocity teleport, forced foot planting or fake root-motion displacement.
5. **Walk W3: whole-body response.** Stance ankle, hip and torso balance coordinate with recovery stepping; transition idle↔walk↔recover↔fall; when falling, stop gait and allow physical tumble. Upper-body gestures retain independent priority and can influence balance naturally.
6. **Walk W4: evidence gate.** From rest, walk at least 2 m left and right under held touch/keyboard intent; each direction shows alternating physical foot lift, placement and load acceptance; release settles to stable standing without slide/teleport. Test both facings, both gestures and impulses, grip release/cancel, stress and mirrored symmetry. Check 60 fps target on iPhone 16 Safari, p95 frame time, touch latency and power cost.
7. **Release gate.** Keep old M2 and current A2 as rollback. Publish new experimental URL only when all relevant browser and native physics gates pass; physical iPhone acceptance before promoting to default.

## Balance Assist refinement

- Existing Assist is opt-in because full browser acceptance failed when enabled globally.
- Added optional `smoothingSeconds` to the existing Planck-neutral `createBalanceReflex`. It exponentially filters the measured capture-point error at 120 Hz, and resets on grab, falling or loss of support. This changes only bounded joint target commands, not physical positions or forces.
- Swept 5, 10, 15, 20, 25, 40 ms. Forty milliseconds regressed to 4/16 falls and failed a strong-force regression. **10 ms** performed best in the evaluated scenarios: **0/16 falls** vs 10/16 for steps-only, and still allowed a 25 N·s shove to knock the character down in both facings. Results are deterministic scenario evidence, not a universal humanlike-balance claim.
- The high-frequency alternating capture-error test confirms the filtered target has lower total variation than unfiltered while retaining a nonzero correction. Full iPhone Safari perceived jitter still needs user validation.

## Non-negotiable constraints

One Balance Lab project; original authoritative Planck 1.5.1 fixed-step rig; reuse existing recovery, support sensing, gesture pose sampler, touch grip and animation motors; no new game, fake translation, foot pinning, Vercel auto-deploy, or production-alias overwrite. All failures and attempted variants must remain documented.

## Verified isolated preview (jitter filter only)

- Source commit `50d295df3ecbf817fc7cac9f4fed1b7fb6b325eb`.
- Vercel preview `dpl_7jMz5UZrAZmPjztMnwzzwDHyY7Gt` READY; URL `https://sling-lab-play-792o2wboy-ethanbaileymarsh-8332.vercel.app/lab/active.html`.
- HTTP 200 for active HTML, active browser JS, balance reflex module, active adapter and Planck vendor; deployed controller includes `smoothingSeconds:.01` and page includes Assist toggle. Stable production alias unchanged.
- Node **123/123** PASS; strict A2 both facings PASS; stress 800/800 PASS; Chromium mobile playable smoke, gestures, side-profile, Assist A/B and source parity all PASS.
- Walking and sagittal rig are **not** present in this preview; user device acceptance for smoothing remains pending.
