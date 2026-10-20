# Balance Lab — authoritative project charter

**Status:** current product identity and engineering constraints. This charter supersedes *descriptions* in old milestone reports when they imply a different product. It does not erase tests, evidence, past results or acceptance gates.

## What we are building

A **side-on, 2D physically simulated humanlike character** intended to become a controllable actor in an interactive game. The character must remain believable when walking, stopping, leaning, being grabbed or shoved, balancing, stumbling, falling, recovering, reaching, holding objects, equipping weapons, aiming and eventually engaging in combat. Its movements should look purposeful, with plausible weight shifts and humanlike reactions, rather than like an upright spring or a purely passive ragdoll.

**This is one Balance Lab project.** The existing physics playground, the playable character preview, deterministic balance reflexes, animation sampler, experimental ML controller and eventual combat/equipment gameplay are **subsystems and stages of the same side-profile character**. No agent may redefine the work as a standalone ragdoll toy, unrelated game, pure AI research benchmark, a 3D port, or a recreation of another company's proprietary engine.

## Non-negotiable architecture

1. Planck 2D is the single authoritative physics simulation. No invisible pins, teleporting, kinematic pose replacement, or infinite-force tricks to claim balance success.
2. Animation describes *desired* motion; physical motors pursue it with bounded torque; actual contacts and forces may overpower it. Animation cannot dictate final body transforms.
3. The character's **task intent** (player or AI) includes movement, stance, aiming, firing, reloading, melee, climbing, falling and recovery. ML, reflexes and animation must coordinate rather than fight these intentions.
4. Hands, equipment, weapon attachments, recoil, hitboxes and damage must ultimately attach to the **same physical rig**. Combat ownership takes priority over incidental arm-swing balance corrections. Do not build a competing gameplay skeleton.
5. Learned balance is **opt-in and experimental** until independently validated. Preserve deterministic baseline and a reversible A/B comparison. Do not confuse a working training script with a learned controller that improves behavior.
6. Side-profile means 2D planar motion; do not promise out-of-plane 3D movement. Both left- and right-facing orientations must work. Two arms and legs remain independent for gripping, posing and contacts.
7. Mobile-first: target iPhone 16 Safari, 60 FPS and usable touch controls. Preserve fixed 120 Hz simulation until an evidence-based change is approved. Physical-device acceptance is mandatory.
8. Use original/authorized artwork and code. Reuse existing verified modules; do not copy Rockstar/Euphoria, Clumsy Ninja, or other proprietary source/assets.

## Priority order

**First:** fix the actual visible knee collapse and improve whole-body reactive behavior without regression. **Second:** establish ML training cases where existing deterministic balance is measurably insufficient. **Third:** develop task-conditioned motion imitation and player locomotion. **Fourth:** introduce physically attached equipment, weapon handling and combat on the same rig. **Throughout:** keep stable preview and mobile QA, preserve tests and historical evidence, and follow dependency gates in `docs/PHYSICS_AI_ROADMAP.md`.

## Definition of progress

A feature is complete only if it is integrated into the intended active rig, tested against physical overpower/fall cases, documented with reproducible evidence, and—where visual interaction is the acceptance criterion—tested in the playable browser and on the target device. An isolated prototype, regression-only adapter or untrained policy interface is not gameplay completion.

## Source precedence

1. **Current user direction** and this charter define product identity and non-negotiable constraints.
2. `AGENTS.md`, `docs/PHYSICS_AI_ROADMAP.md` and `docs/INTEGRATION_WORKFLOW.md` define execution and gate requirements.
3. Current Git source, verified tests and `docs/INTEGRATION_GATE_EVIDENCE_2026-10-20.md` define observed implementation status.
4. `docs/history/`, previous versioned adapters and `evidence/` are retained for historical facts, regression and research; they are **not current architecture or release instructions**.
5. Original M0–M8 acceptance requirements remain evidence obligations where applicable; older milestone terminology does not redefine the project as a different product.
