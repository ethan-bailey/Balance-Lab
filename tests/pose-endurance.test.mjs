import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createPoseClip} from '../src/animation/pose-sampler.mjs';
test('A1 60-second cyclic animated arm remains finite, joint-bound and supported',()=>{
 const r=createActiveRigWorld();
 const clip=createPoseClip([
  {time:0,pose:{shoulderL:-.5},velocity:{shoulderL:0}},
  {time:.5,pose:{shoulderL:.5},velocity:{shoulderL:0}}
 ]);
 r.setPoseClip(clip,{loop:true,loopBlendSeconds:.5,velocityFeedforward:true,fadeSeconds:.2});
 r.step(7200);
 const s=r.snapshot();
 assert.equal(s.metrics.nonfinite,0);
 assert.ok(s.metrics.maxAnchorErrorM<.02);
 assert.ok(s.metrics.maxLimitViolationRad<.1);
 assert.ok(Math.abs(s.bodies.torso.x)<.2);
 assert.ok(s.bodies.torso.y>1.1);
 assert.equal(r.getState().mode,'standing');
 r.dispose();
});