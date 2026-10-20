import test from 'node:test';
import assert from 'node:assert/strict';
import {createPoseClip,samplePoseFrame,samplePose} from '../src/animation/pose-sampler.mjs';
const close=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t,'Expected '+a+' ~= '+b);
test('A1 immutable frame contract and derivative units',()=>{
 const frames=[{time:0,pose:{a:0},velocity:{a:0}},{time:2,pose:{a:1},velocity:{a:0}}];
 const clip=createPoseClip(frames);frames[1].velocity.a=100;
 assert.ok(Object.isFrozen(clip)&&Object.isFrozen(clip[0].velocity));
 const m=samplePoseFrame(clip,1);
 close(m.pose.a,.5);close(m.velocity.a,.75);
 assert.ok(Object.isFrozen(m)&&Object.isFrozen(m.pose)&&Object.isFrozen(m.velocity));
 close(samplePose(clip,1).a,.5);
});
test('A1 shortest-arc interpolation honors endpoint velocity',()=>{
 const a=Math.PI-.1,b=-Math.PI+.1;
 const clip=createPoseClip([{time:0,pose:{a},velocity:{a:0}},{time:1,pose:{a:b},velocity:{a:0}}]);
 close(samplePoseFrame(clip,0).velocity.a,0);
 close(samplePoseFrame(clip,.5).velocity.a,.3);
 close(samplePoseFrame(clip,1).velocity.a,0);
 close(Math.abs(samplePoseFrame(clip,.5).pose.a),Math.PI);
});
test('A1 optional cyclic seam closes endpoint mismatch',()=>{
 const clip=createPoseClip([{time:0,pose:{a:0}},{time:1,pose:{a:1}}]);
 const opt={loop:true,loopBlendSeconds:.5};
 assert.ok(Math.abs(samplePoseFrame(clip,1.49999,opt).pose.a-samplePoseFrame(clip,1.50001,opt).pose.a)<.001);
 close(samplePoseFrame(clip,1.25,opt).pose.a,.5);
 close(samplePoseFrame(clip,1.25,opt).velocity.a,-2);
});
test('A1 rejects invalid velocity, joint keys and loop time',()=>{
 assert.throws(()=>createPoseClip([{time:0,pose:{a:0},velocity:{a:NaN}}]),/Invalid joint angle/);
 assert.throws(()=>createPoseClip([{time:0,pose:{a:0},velocity:{b:1}}]),/Inconsistent velocity joints/);
 const clip=createPoseClip([{time:0,pose:{a:0}}]);
 assert.throws(()=>samplePoseFrame(clip,0,{loopBlendSeconds:.2}),/Invalid pose sample/);
 assert.throws(()=>samplePoseFrame(clip,Infinity),/Invalid pose sample/);
});
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
const shoulder=r=>r.rig.links.find(x=>x.def.id==='shoulderL').joint;
const motion=createPoseClip([{time:0,pose:{shoulderL:-.55},velocity:{shoulderL:0}},{time:1,pose:{shoulderL:.55},velocity:{shoulderL:0}}]);
test('A1 opt-in velocity reaches physical motors and preserves bounds',()=>{
 const base=createActiveRigWorld(),feed=createActiveRigWorld(),noClip=createActiveRigWorld();
 for(const r of [base,feed,noClip])r.step(120);
 base.setPoseClip(motion,{fadeSeconds:0});
 feed.setPoseClip(motion,{fadeSeconds:0,velocityFeedforward:true});
 base.step(40);feed.step(40);noClip.step(40);
 const x=feed.snapshot().bodies.upperArmL.a,y=base.snapshot().bodies.upperArmL.a;
 assert.ok(Math.abs(x-y)>.0001,'velocity must affect physical trajectory');
 assert.ok(Math.abs(x-noClip.snapshot().bodies.upperArmL.a)>.01);
 assert.ok(Math.abs(shoulder(feed).getMotorSpeed())<=6.001);
 assert.ok(shoulder(feed).getMaxMotorTorque()<=60);
 for(const r of [base,feed,noClip]){assert.equal(r.snapshot().metrics.nonfinite,0);r.dispose();}
});
test('A1 interrupted fades do not teleport and preserve motor-speed continuity',()=>{
 const a=createActiveRigWorld(),b=createActiveRigWorld();
 const next=createPoseClip([{time:0,pose:{shoulderL:1.1},velocity:{shoulderL:0}},{time:1,pose:{shoulderL:-1.1},velocity:{shoulderL:0}}]);
 for(const r of [a,b]){r.step(120);r.setPoseClip(motion,{fadeSeconds:.35,velocityFeedforward:true});r.step(30);}
 const before=a.snapshot();
 a.setPoseClip(next,{fadeSeconds:.35,velocityFeedforward:true});
 assert.deepEqual(a.snapshot(),before);
 a.step(1);b.step(1);
 const delta=Math.abs(shoulder(a).getMotorSpeed()-shoulder(b).getMotorSpeed());
 assert.ok(delta<.3,'motor speed discontinuity '+delta);
 for(const r of [a,b])r.dispose();
});
test('A1 invalid opt-in options are rejected without state mutation',()=>{
 const r=createActiveRigWorld(),before=r.snapshot();
 assert.throws(()=>r.setPoseClip(motion,{velocityFeedforward:2}),/Invalid pose velocity mode/);
 assert.throws(()=>r.setPoseClip(motion,{loopBlendSeconds:1}),/Invalid pose seam/);
 assert.deepEqual(r.snapshot(),before);
 r.dispose();
});
test('A1 animated reference remains physically overpowerable under external impulse',()=>{
 const forced=createActiveRigWorld(),reference=createActiveRigWorld();
 for(const r of [forced,reference]){r.step(120);r.setPoseClip(motion,{velocityFeedforward:true,fadeSeconds:.15});r.step(90);}
 const before=forced.snapshot();
 forced.impulse('upperArmL',{x:8,y:0});
 reference.step(8);forced.step(8);
 const delta=Math.abs(forced.snapshot().bodies.upperArmL.a-reference.snapshot().bodies.upperArmL.a);
 assert.ok(delta>.01,'force did not overpower reference '+delta);
 assert.ok(Math.abs(forced.snapshot().bodies.upperArmL.a-before.bodies.upperArmL.a)<1.5);
 assert.equal(forced.snapshot().metrics.nonfinite,0);
 forced.dispose();reference.dispose();
});
test('A1 deterministic replay with seam, clip interrupt, impulse, disable',()=>{
 const a=createActiveRigWorld(),b=createActiveRigWorld();
 const loop=createPoseClip([{time:0,pose:{shoulderL:-.3}},{time:.3,pose:{shoulderL:.8}}]);
 for(const r of [a,b]){
  r.step(120);
  r.setPoseClip(loop,{loop:true,loopBlendSeconds:.2,velocityFeedforward:true,fadeSeconds:.1});
  r.step(80);
  r.setPoseClip(motion,{velocityFeedforward:true,fadeSeconds:.3});
  r.step(35);r.impulse('upperArmL',{x:2,y:1});r.step(50);
  r.setPoseClip(null);r.step(40);
 }
 assert.deepEqual(a.snapshot(),b.snapshot());
 assert.equal(a.snapshot().metrics.nonfinite,0);
 a.dispose();b.dispose();
});
test('A1 mutable caller clip cannot poison live controller; malformed clip fails early',()=>{
 const r=createActiveRigWorld();
 const input=[{time:0,pose:{shoulderL:0}},{time:1,pose:{shoulderL:.5}}];
 r.setPoseClip(input,{fadeSeconds:0});
 input[0].pose.shoulderL=NaN;
 input[1].pose.shoulderL=Infinity;
 r.step(20);
 assert.equal(r.snapshot().metrics.nonfinite,0);
 assert.throws(()=>r.setPoseClip([{time:0,pose:{shoulderL:NaN}}]),/Invalid joint angle/);
 r.step(20);
 assert.equal(r.snapshot().metrics.nonfinite,0);
 r.dispose();
});