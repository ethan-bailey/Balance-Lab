# Balance Lab — research notes: natural recovery, balance and grabbing
Date: 2026-10-20. Design research only: proposals below are not implemented or acceptance-tested.

## Design target
Clumsy-Ninja-like responsive character on iPhone 16 Safari. Physically simulated articulated body; no teleportation, permanent foot pinning, invisible upward puppet force, or proprietary technology/assets. Preserve the proven Planck 1.5.1 solver and stable deployment until a gated preview.

## 1. Balance control — prioritized approach
- Extend existing support estimator (feet, COM, projected COM, support margin) with a *capture point* estimate: cp = com.x + com.vx / sqrt(g / effectiveComHeight), only when grounded, height valid and positive. Use foot contact bounds to decide ankle/hip correction versus physical stepping; do not treat cp as a body-position target.
- Hierarchy: small displacement -> ankle/hip torque; approaching support edge -> protective leg placement; beyond reachable step -> compliant fall, possibly hand brace.
- Avoid a horizontal body-position PID disguised as balance. Use bounded joint torque, rate-limited reference targets and anti-windup. Actuation respects foot contact, grabbed state, and falling.
- Compare with currently implemented projected COM (linear horizon) using deterministic parameterized shove magnitudes. Capture point formula is a conceptual approximation for inverted-pendulum behavior, not necessarily reliable in an articulated tumbling state.
- Clever feel: near-miss catch, single recovery step, occasional delayed second step derived from actual velocity, not random animations. Preserve repeatability for identical inputs.

## 2. Recovery — contact-conditioned task graph
- Physically identify available supports (both feet, knees, elbows, palms) using actual manifold normals and impulses rather than interpreting any collision as stable support.
- Distinct states: impact limp/compliance -> orient toward protective posture -> brace/push to knees -> weight shift into foot support -> stand. Use targets for joint angles and bounded motor strengths; do not teleport root/hips or force the result.
- Recovery hysteresis: torso height + orientation + angular velocity + grounded support; avoid oscillating between fallen and standing. The newly added low-torso threshold prevents false 'standing' when torso remains near the floor, but threshold and transition need real scenario validation.
- Allow abort/restart when user grabs or flips the character, and strength ramp-down during collisions followed by ramp-up. Failure should remain possible on large disturbances or blocked contact.
- Clever feel: a hand catches the floor before the face; recover by whichever side has valid physical contact. Add controlled variation based on collision state, never nondeterministic physics randomness.

## 3. Grab, pull, and release
- Retain local picked attachment point on selected body and resolve its world anchor each step. Use damped spring/motor joint with a capped force; distribute motion via actual limb joints, not pulling the torso directly.
- Tune frequency/damping ratio or equivalent kp/kd scaled to effective mass, rather than unconstrained arbitrary force. Finite targets and bounded pointer velocity are mandatory.
- Staged compliance: soft entry when touching, firm-but-stretchable pull, adaptive limit if near joint extension. Avoid abrupt stiffening or infinite-force dragging.
- On release, remove the constraint; body velocity should be inherited from the physical interaction, not receive a second full flick impulse by default. If a supplementary release impulse is enabled, cap it and measure for double energy injection.
- Pointer cancel, orientation change, backgrounding: always detach without fling. Use pointer capture and one authoritative drag owner.
- Clever feel: grabbing forearm makes shoulder twist, feet shuffle or leave the ground; releasing at the swing apex leads to a clean arc; wrist feels looser than torso.

## 4. Research references (read 2026-10-20)
- Box2D simulation / mouse dragging: https://box2d.org/documentation/md_simulation.html — kinematic cursor target with force-limited motor spring in modern Box2D; conceptual guidance, adapt to installed Planck 1.5.1 APIs.
- Box2D mouse joint API: https://box2d.org/documentation/group__mouse__joint.html — spring frequency, damping ratio, maximum force and tracking behavior.
- ActiveRagdoll, MIT: https://github.com/ashleve/ActiveRagdoll — animation targets with PID motors; contact-dependent strength.
- Unity Humanoid ActiveRagdoll: https://github.com/EggyStudio/Unity.Humanoid.ActiveRagdoll — per-joint PD tracking, collision weakening, ramped recovery; reference not code copied.
- Classical balance measures and recovery research: https://arxiv.org/abs/2603.08619 — capture point, COM/momentum-informed recovery and multi-contact rise. Paper's robot/RL results do not directly establish suitability for a 2D mobile game.
- Engineering note: Clumsy Ninja / proprietary Euphoria is inspiration for emergent reaction only; do not copy unavailable proprietary source or claim equivalent technology.

## 5. Recommended experiments and acceptance metrics
1. Add observability first: COM/capture point, support polygon, foot/knee/hand contacts, torque saturation, energy, recovery state and physical impulses; deterministic fixed 120Hz.
2. Sweep 3 gentle, 3 moderate and 3 severe impulses in both directions. Record: catch success, unnecessary steps, falls, joint-limit violations, anchor drift, no-teleport checks.
3. Test get-up from supine/prone-like and side landing orientations under 10 seeds/scenarios; record stable standing duration and failed recoveries, not just immediate mode changes.
4. Test grabs at hand, forearm, torso, and foot: stretch at max force, peak acceleration, reachable joint limits, no jump on grab, no spurious fling on cancel, conserved-like continuity on release.
5. Run browser/Node parity, long idle, deterministic replays, then 60fps budget and pointer responsiveness on physical iPhone 16. Reduce draw complexity before physics fidelity. A failed physical Safari/art gate remains pending, never implied as verified.

## Current known limitations
Canonical passive adapter long-idle drift not remedied; active adapter passes separate no-creep test. Physical iPhone Safari validation and character design approval remain pending. Do not blend these gates or deploy experimental controller prematurely.
