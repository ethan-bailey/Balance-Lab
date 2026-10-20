# Balance Lab — Recovered browser and integrated physics gate evidence

**Candidate branch:** `integration/balance-lab-20261020`. **Remote source commit before this record:** `b87dbcb70e7a8128fb781c26f6875afc6d342913`. **Status: FAIL (do not deploy).**

## Recovery and source
- Original M2 release archive recovered from `/vercel/m2/release-source.tar.gz`, SHA-256 `a4b00c404b4b3aaabf6d219ee4dd8cbfdba862ba6a331ed7bef49bf92409d82a`.
- Extracted to `browser/`; `browser/build.mjs` builds without the original archive by copying the checked-in browser sources and Planck 1.5.1.
- A1 telemetry original source and test hashes `d88c96c1ecf876c09804637f2f0e999bfbfb258677ffebe4344f84f358458f90`, `0ee4edb72ef6d62a5fea2930c778488d0d159b3f095fec66e4240e24cc02682b`. All ten original MT tests pass in the recovered full rig.
- PR #1 merged locally into integration candidate with zero conflicts (`de73146`); preserved A5 `e6c1bcb` changes applied (`6d421ab`), GitHub comparison confirms original PR head zero files ahead of candidate.

## Reproducible test evidence (Node 24, Planck 1.5.1)
- `node --test tests/*.test.mjs`: **96/96 PASS**, ~36 seconds.
- `node tests/rig-gate.mjs 800`: **800/800 PASS**, max anchor 0.011421842798 m; max joint limit 0.070176394 rad.
- `node --test tests/motor-telemetry.test.mjs`: **10/10 PASS**.
- `node --test tests/a5-pointer-lifecycle.test.mjs tests/canvas-pointer.test.mjs tests/rig-grip-cancel.test.mjs`: PASS.
- `cd browser && node build.mjs`: PASS; checked generated `dist/lab/lab.mjs`.
- Headless Chromium, 393×793 touch viewport: browser rig QA 250 steps with hand grab/move/release, finite bodies, zero JS console/page errors: PASS.
- Full browser 800-case deterministic drag stress, original 8 substeps: **798/800 FAIL**. Violations: seed 1923979547 case 82 forearmL, limit 0.1350353 rad; seed 2557891634 case 17 forearmR, limit 0.3177864 rad. Required <= 0.12 rad; no threshold relaxation.
- Browser 5/5 parity scenarios (idle, wristDrag, ankleFlip, lightDrop, extremeImpulse): PASS on original eight-substep build. Touch/resize/reload: PASS, no browser errors.
- 12-substep experiment: **798/800 FAIL**; max violation 0.143865 rad; some baseline parity changed. 16-substep experiment: **794/800 FAIL**, max violation 0.232892 rad. **Both experiments reverted.** A third experiment increased the joint-limit guard from 0.55 to 0.75 rad at eight grab-substeps; it regressed to **793/800 FAIL** and altered baseline idle/drag parity. The guard experiment was also reverted.

## Release-blocking integration facts
1. Browser `lab/lab.mjs` is a separate M2 Planck implementation and does **not** yet consume the tested `adapters/planck.mjs`, `src/physics/motor-telemetry.mjs`, or the A5 pointer lifecycle. Passing Node tests is not end-to-end integrated gameplay.
2. Full browser stress fails 2/800 cases under large forearm drag. Fix physical limit overshoot without snapping bodies, raising force caps arbitrarily, or hiding failures; then rerun full 800-case browser stress and Node suite.
3. A2 mirrored-facing real physical recovery remains failing (3/4 strict cases historically). M2 iPhone 16 Safari and user art approval remain pending.
4. No new Vercel deployment is authorized until a reproducible, integrated, passing browser candidate exists. Preserve M2 deployment `dpl_3oueY2oD6hpYRJ2oZ94BzEuZ7L2G` and M1 rollback `dpl_58fwXoovv622MdoHPRa3ykNyzFEt`.

## Next executable gate
Instrument actual joint IDs and relative velocities for the two failing forearm-drag seeds in the browser QA harness. Apply bounded contact-aware joint-limit correction through the solver, verify the 800-case suite at original mobile performance budget, then wire A5 input and A1 telemetry to the authoritative browser solver. Do not count the integration as accepted until that passes.

## Follow-up: shared motor controller and branch consolidation
- Unified the bounded motor command calculation in `src/physics/joint-motor.mjs`, imported by both `adapters/planck.mjs` and the built browser `browser/lab/lab.mjs`. The browser build copies this exact source into `dist/lab/joint-motor.mjs`. A focused regression found that the pose override must be applied *before* limit correction; that ordering was fixed and the A2 recovery tests returned to 5/5.
- Full Node regression after shared-controller fix: **96/96 PASS**; canonical 800-case Node stress rerun separately. Shared-controller browser test remained **798/800 FAIL**, same two forearm-drag seeds, with 5/5 baseline scenarios and touch/resize/reload passing.
- Recalculating browser motors on *every* substep improved stress to **799/800**, but changed idle parity by **4.15 m** and therefore cannot be accepted. Increasing limit guard to 0.58 still failed **799/800**, max overshoot 0.2026 rad and idle divergence 9.86 m. Recalculating on each substep only during grabs regressed to **795/800**; restricting to forearm grabs gave **798/800**. These experimental cadence/guard changes were reverted; baseline cadence and torque caps retained.
- Browser uses the same **joint motor controller source**, but not yet the complete headless rig adapter, A1 motor telemetry or A5 DOM pointer module. The full end-to-end integration remains incomplete. Do not call this a pass or deploy.
- Cherry-picked the two unique `automation/20261020-mobile-fixed-step-runtime` commits into the **same** integration branch as `205cdba` and `d53bf23`; they are retained as reusable runtime modules, not yet enabled in the M2 browser.
- See `docs/BRANCH_POLICY.md`: no additional active development branches; historical branches retained read-only pending safe cleanup.

### Final verification of current shared-controller source
- **97/97** full Node tests PASS after adding shared motor contract test (including A2 recovery tests).
- **800/800** canonical Planck 1.5.1 Node stress PASS, max anchor 0.011421842798 m, max limit 0.070176393982 rad.
- Browser build PASS with checked `dist/lab/joint-motor.mjs` and Planck vendor module.
- Browser full acceptance **798/800 FAIL** with shared controller and baseline motor cadence; same two forearm drag cases, so **no deployment**. The tested unsuccessful motor-substep experiments are not in the source branch.
- Physical iPhone 16 performance and integrated A1 telemetry/A5 input remain release gates.

## 2026-10-20 A2 continuation — composable balance reflex (release still blocked)

- Focused production correction: zero-gain/zero-error capture reflex no longer sends inert joint targets that silently change motor ownership/torque. See `src/behavior/balance-reflex.mjs` and `tests/balance-reflex-noop.integration.test.mjs`.
- Full Node suite: **101/101 PASS**. Rig 800-case stress: **800/800 PASS**, max anchor 0.011421842798 m, max limit 0.070176393982 rad.
- A2 physical recovery: canonical **4/4 PASS**, mirrored **1/4 PASS**; **FAIL** for mirrored acceptance.
- Browser build: **PASS**. Full 800-case browser stress: **800/800 PASS**, max anchor 0.016987045319 m, max limit 0.111110962083 rad; five parity checks **PASS**, touch and resize/reload **PASS**, zero browser console/page errors.
- An independent passive capture reflex (without physical stepping) survived 8/8 facing/impulse scenarios, but the coupled active step + reflex still does not meet A2/T06. This is a diagnostic, not release acceptance.
- No deployment. No branch created. Device QA and active mirrored stepping remain **PENDING/FAIL**, respectively.

## A2 bilateral stepping gate passed in Node (browser-active parity pending)

- Production corrections: reflected joint solver traversal (`src/config/facing-rig.mjs`), symmetric outward planting hip brace (`src/behavior/recovery-step.mjs`), uniform 0.225 m/s COM trigger noise floor and opt-in confirmation window.
- Strict original A2 T06 acceptance **4/4 facing +1 PASS** and **4/4 facing −1 PASS**. No threshold weakening or scripted contacts.
- T01 no-input 600-second stance: **2/2 PASS**, 72,000 physical steps per orientation, zero unwanted steps. Light-catch ±3/±5 N·s: **8/8 PASS**, zero unwanted steps. T07 severe ±35 N·s: **4/4 PASS**, actual falls.
- Full Node unit/integration suite **104/104 PASS**; canonical rig 800/800 stress PASS. Browser M2 full stress **800/800 PASS**, five parity cases PASS, touch/resize/reload PASS, zero browser errors.
- Explicit limitation: browser M2 test is a separate engine path and does **not** yet validate A2 active controller. Full A2 and new deployment remain **BLOCKED** on active-source browser parity and physical iPhone QA. No release/deployment was made.

## A2 active physics browser parity verified

- `src/qa/a2-physical-gate.mjs`: shared executable A2 contact acceptance, called without altered thresholds in Node and Chromium.
- `cd browser && node build.mjs`: PASS; pinned Planck 1.5.1 browser ESM, active source copied without gameplay rewrites. Test-only `/active-qa.html` entry does not change playable M2.
- `node browser/tests/active-a2-browser-gate.mjs` (candidate served on 9021): **8/8 PASS**, both facings, actual liftoff/displaced touchdown, sustained posture/support, max Node/Chromium torso-height delta ~2.31e-9 m, max angle delta ~2.69e-12 rad, zero JS errors.
- Existing `node browser/tests/full-browser-gate.mjs` (candidate 9021, baseline 9001): **800/800 PASS**, five parity checks PASS, touch/resize/reload PASS, no JS errors.
- Full Node suite after extraction: **104/104 PASS**. A2 Node physical and active-source Chromium acceptance: **INTEGRATED_PASS for physics QA only**. Active playable renderer/pointer integration: **TODO**; physical iPhone Safari: **PENDING_DEVICE**. Stable preview unchanged; no deployment.

## A2 playable opt-in candidate integrated locally

- New separate route `/lab/active.html`, `browser/lab/active-lab.mjs`: renders the existing Kite art using measured `createActiveRigWorld` Planck body poses, real 120 Hz stepping, actual contacts, A2 recovery motor targets and finite physical grip. No new placeholder physics, direct body transforms, or alternate health/state graphs.
- A5 input integration: `createRigGripBinding` + `attachCanvasPointerInput` handle pointer capture, move, release, blur cancellation, lost capture and zero synthetic flick. Stable M2 `lab.mjs` is untouched.
- `node browser/tests/active-preview-smoke.mjs`: **PASS** on mobile Chromium 393×793 and rotated 793×393; real physical recovery for both facing orientations, pointer release and cancellation, resize/reload, zero browser errors. Separate `?rigqa=1` disables animation frame stepping for deterministic QA only.
- New active playable path is a candidate, **not yet an accepted production preview**. Physical iPhone 16 Safari, sustained on-device performance and user interaction/art QA are **PENDING_DEVICE / PENDING_USER**.

## A2 playable candidate / main consolidation

- Opt-in `/lab/active.html` uses the authoritative `createActiveRigWorld` physics,
  original Kite canvas art, shared A5 drag tracker and pointer-capture lifecycle.
- Mobile Chromium `browser/tests/active-preview-smoke.mjs`: **PASS**; active
  shove/recovery, actual step completion, grip/release, blur cancellation,
  resize, reload, and mirrored recovery, with zero JavaScript errors.
- The previously accepted M2 `/lab/` path remains unchanged and is a rollback.
- The active candidate is a provisional playable preview, not yet physically
  tested on iPhone Safari; no claim of full production acceptance.

## Playable idle fall regression (user device evidence)

A user-provided untouched active preview trace showed torso y=0.265m, angle=1.493rad, 1 failed step, 0 grabs after ~10s. Reproduced exactly with the playable-only `setPoseClip` shoulder target: initial drift begins by 3s, recovery step triggers at 4s, fall follows. The earlier A2 idle harness did not install this clip. Removed the provisional shoulder clip from the playable rig, retaining finite motor balance, real gravity and stepping. No position snapping or artificial floor attachment. Added `tests/a2-playable-idle-gate.mjs` for 10s both facings: PASS, minimum torso height 1.3555m, maximum torso angle 0.02746rad, zero unnecessary step attempts. Mobile Chromium active preview smoke PASS, zero browser errors. Physical Safari retest pending.

## A2 one-time candidate-only Vercel deployment (not production)

- Exact deployed source SHA: **`b2aee5afb042c01b4d61239be4b299379c042bc5`** on `integration/balance-lab-20261020`.
- Vercel project: `sling-lab-play`, project ID `prj_9BCKojEiFJHNPgvDPQtzjXTgACF2`. Candidate deployment ID **`dpl_EKbNf4CrmNxB8bu222PqkczweAmd`**, target `preview` (not production), state **READY**.
- Candidate playable URL: **https://sling-lab-play-6h80lxnx5-ethanbaileymarsh-8332.vercel.app/lab/active.html**; physical reversed-facing option append `?facing=-1`.
- Verified the deployed HTML, active runtime module, shared A2 QA source, and pinned Planck ESM returned HTTP 200. An independent mobile-viewport Chromium test against the actual deployed URL completed one physical shove recovery (landings=1, completed=1), remained standing, had zero nonfinite metrics and zero page errors.
- **Stable alias preserved**: `sling-lab-play.vercel.app` still maps to the prior accepted M2 deployment **`dpl_3oueY2oD6hpYRJ2oZ94BzEuZ7L2G`**. The new candidate has only a branch-specific preview alias. No production promotion, rollback modification, or new auto-deployment Git connection was made.
- Automated evidence preceding deployment: Node 104/104, canonical rig 800/800, bilateral A2 physical 8/8, light 8/8, severe 4/4, no-input 600s x2, active-source Node/Chromium parity 8/8, M2 browser stress 800/800, playable mobile browser smoke PASS. Physical iPhone 16 Safari and user art/feel approval remain **PENDING_DEVICE / PENDING_USER**.

## A2 candidate idle-regression correction and redeploy requirement

- A separate integration check identified that the first candidate's **playable shoulder pose clip** could destabilize the untouched rig; the headless A2 physics contact sweep alone did not detect this UI-specific idle configuration. The subsequent commit `04383bf` removed the shoulder clip **only from the playable route** and added `tests/a2-playable-idle-gate.mjs`.
- On the reconciled latest branch, `node tests/a2-playable-idle-gate.mjs` **PASS** for both facings (10 seconds, no step attempts, upright). The mobile Chromium playable smoke test was strengthened to simulate **10 seconds untouched before the shove**; it now **PASS** with no unwanted step, sustained standing, a real recovery after a shove, and preserved pointer/cancellation/resize/reload behavior.
- The first deployed preview `dpl_EKbNf4CrmNxB8bu222PqkczweAmd` is **superseded for QA** by this fix. Do not present it as the current candidate. A new preview must be deployed from the updated SHA after final checks. Stable M2 alias remains untouched.

## Experimental ML0: task-conditioned side-profile motor policy

- New opt-in `src/ml/side-profile-policy.mjs`: stable 2D observation schema, immutable player/combat intent, MLP inference, bounded joint residuals and priority protection for recovery steps and occupied weapon hands. `src/ml/linear-policy.mjs` and `scripts/train-side-profile-es.mjs`: deterministic trainable baseline and real Planck evolutionary search. Default gameplay remains unchanged.
- `tests/side-profile-policy.test.mjs`: **6/6 PASS**, including exact physical snapshot equality with zero-action policy on both facings and overpowerability under a severe shove.
- `tests/linear-policy.test.mjs`: **2/2 PASS**, including repeated seeded training output equality.
- Full pre-training Node regression: **110/110 PASS**; canonical and mirrored strict A2 acceptance **4/4 each PASS**; 800-case Planck stress **800/800 PASS**.
- ML experiment (seed 12020, 6 generations × 12 candidates): train 11.05281265 → 11.05281265; holdout 10.97984899 → 10.97984899; **NO IMPROVEMENT**. No trained weights installed or deployed. Ten-second physical knee diagnostic across 10 idle/light-shove conditions did **not** reproduce the visible browser knee buckling; browser-specific reproduction still required.
- Side-profile equipment/combat interfaces are **contract-only**: no weapons, firing, IK, hit detection or recoil mechanics implemented by ML0. See `docs/ML_SIDE_PROFILE_EXPERIMENT.md`.
- Post-ML0 browser candidate build: **PASS**; active A2 browser source-parity **8/8 PASS**; opt-in active playable mobile Chromium smoke **PASS**; unchanged M2 full browser stress **800/800 PASS**, with no JS errors. These are browser simulations, not physical iPhone 16 Safari measurements.

## Side-profile project consolidation (same project, not new game)

Authoritative project identity in `README.md` + `docs/PROJECT_CHARTER.md`; historical adapter versions moved under `adapters/legacy/` and nine prior reports under `docs/history/`, preserving imports and regression evidence. `AGENTS.md`, roadmap and integration workflow now explicitly distinguish one current v6 Planck character from older release stages and experiments. Post-move Node tests **112/112 PASS**, canonical/mirrored strict A2 PASS, 800-case physics stress PASS, browser build PASS, active A2 browser parity 8/8 PASS and playable mobile Chromium smoke PASS. See `docs/PROJECT_CONSOLIDATION_2026-10-20.md`. No deployment or stable-preview changes.

## Side-profile playable animation candidate gate

Added four opt-in upper-body physical reference poses on the v6 active rig with preserved grabbing, pushing and stepping. Node tests 114/114 PASS; 800/800 Planck stress PASS; strict A2 both facings PASS; active browser parity 8/8 PASS; playable mobile Chromium smoke PASS; four-pose browser test both facings PASS with zero JS errors. **3 N·s shove after multi-pose sequence recovered; 8 N·s after the same sequence fell** (open issue). No trained ML or combat and no physical Safari acceptance. See `docs/SIDE_PROFILE_PLAYABLE_GATE_2026-10-20.md`.

- Isolated preview deployed from verified commit `66cb02d9db10392ec2a6ae15bd2cba6a8b29224b`, deployment `dpl_xgv2SxYX4gSw6N4qqyYL55zS4H6Z` READY; URL `https://sling-lab-play-5hflcbeql-ethanbaileymarsh-8332.vercel.app/lab/active.html`. HTTP 200 for playable HTML, animation, active physics and Planck modules. Stable production alias untouched; physical iPhone Safari acceptance PENDING.
