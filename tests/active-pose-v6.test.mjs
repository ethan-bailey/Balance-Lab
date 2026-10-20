import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createPoseClip} from '../src/animation/pose-sampler.mjs';
const clip=createPoseClip([{time:0,pose:{shoulderL:.65}},{time:2,pose:{shoulderL:.65}}]);
test('opt-in pose pulls through physical joint motor; impulse can overcome it',()=>{
 const baseline=createActiveRigWorld(),r=createActiveRigWorld();
 baseline.step(120);r.step(120);
 r.setPoseClip(clip);
 r.step(90);
 // Compare the pose-driven trajectory against unmodified controller.
 baseline.step(90);
 const a=r.snapshot(),b=baseline.snapshot();
 assert.ok(Math.abs(a.bodies.upperArmL.a-b.bodies.upperArmL.a)>.05,'pose has physically affected the arm');
 const comparison=createActiveRigWorld();
 comparison.step(120);comparison.setPoseClip(clip);comparison.step(90);
 const before=a.bodies.upperArmL.a;
 r.impulse('upperArmL',{x:0,y:8});
 r.step(8);comparison.step(8);
 const after=r.snapshot().bodies.upperArmL.a;
 const unforced=comparison.snapshot().bodies.upperArmL.a;
 assert.ok(Math.abs(after-unforced)>.01,'force must overpower pose tracking relative to no-force control');
 assert.ok(Math.abs(after-before)<1.5,'motor tracking must not create a pose teleport');
 comparison.dispose();
 assert.equal(r.snapshot().metrics.nonfinite,0);
 r.setPoseClip(null);r.dispose();baseline.dispose();
});
test('opt-in disabled by default and rejects unknown joints',()=>{
 const r=createActiveRigWorld();
 assert.throws(()=>r.setPoseClip(createPoseClip([{time:0,pose:{unknown:1}}])),/Unknown pose joint/);
 r.setPoseClip(clip);r.step(2);r.setPoseClip(null);r.step(2);
 assert.equal(r.snapshot().metrics.nonfinite,0);r.dispose();
});
