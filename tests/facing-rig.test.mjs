import test from 'node:test';
import assert from 'node:assert/strict';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {RIG} from '../rig-config.mjs';

test('physical facing reflection preserves mass, dimensions, joint anchors and angle limits',()=>{
 const flipped=createFacingRig(RIG,-1);
 for(let i=0;i<RIG.segments.length;i++){
  const a=RIG.segments[i],b=flipped.segments[i];
  assert.equal(b.x,-a.x);
  assert.equal(b.y,a.y);
  assert.equal(b.mass,a.mass);
  assert.equal(b.w,a.w);assert.equal(b.h,a.h);
 }
 for(let i=0;i<RIG.joints.length;i++){
  const a=RIG.joints[i],b=flipped.joints[i];
  assert.equal(b.x,-a.x);
  assert.equal(b.lower,-a.upper);
  assert.equal(b.upper,-a.lower);
 }
 assert.throws(()=>createFacingRig(RIG,0),/Invalid facing/);
 assert.deepEqual(createFacingRig(RIG,1).segments,RIG.segments);
});
test('fully mirrored 2D rig remains upright 60 seconds with recovery motors opt-in',()=>{
 const r=createActiveRigWorld(createFacingRig(RIG,-1));
 r.enableRecoverySteps();
 r.step(7200);
 const s=r.snapshot();
 assert.equal(s.metrics.nonfinite,0);
 assert.ok(s.bodies.torso.y>1.15&&Math.abs(s.bodies.torso.x)<.1);
 assert.equal(r.getStepDiagnostics().attempts,0);
 assert.equal(r.getState().mode,'standing');
 r.dispose();
});
