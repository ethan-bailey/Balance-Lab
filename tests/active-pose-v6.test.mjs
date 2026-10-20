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
test('activation and clip switching preserve simulated pose and deterministic replay',()=>{
 const a=createActiveRigWorld(),b=createActiveRigWorld();
 const reach=createPoseClip([{time:0,pose:{shoulderL:-.5}},{time:.7,pose:{shoulderL:.5}}]);
 for(const r of [a,b])r.step(120);
 const old=a.snapshot();
 a.setPoseClip(clip,{fadeSeconds:.3});
 assert.deepEqual(a.snapshot(),old,'changing target cannot teleport any physical body');
 b.setPoseClip(clip,{fadeSeconds:.3});
 for(const r of [a,b])r.step(40);
 const before=a.snapshot();
 a.setPoseClip(reach,{fadeSeconds:.2});b.setPoseClip(reach,{fadeSeconds:.2});
 assert.deepEqual(a.snapshot(),before,'crossfade cannot directly modify body positions');
 for(const r of [a,b]){r.step(180);r.setPoseClip(null);r.step(40);}
 assert.deepEqual(a.snapshot(),b.snapshot(),'pose sampling and switching replay deterministically');
 assert.equal(a.snapshot().metrics.nonfinite,0);
 a.dispose();b.dispose();
});
test('pose fades validate duration and do not disable the default controller on error',()=>{
 const r=createActiveRigWorld();
 assert.throws(()=>r.setPoseClip(clip,{fadeSeconds:Infinity}),/Invalid pose fade/);
 assert.throws(()=>r.setPoseClip(clip,{fadeSeconds:-1}),/Invalid pose fade/);
 r.step(30);
 assert.equal(r.snapshot().metrics.nonfinite,0);
 r.dispose();
});
