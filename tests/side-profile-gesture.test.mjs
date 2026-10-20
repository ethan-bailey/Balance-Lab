import test from 'node:test';
import assert from 'node:assert/strict';
import {createSideProfileGesture,GESTURES} from '../src/animation/side-profile-gesture.mjs';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {RIG} from '../rig-config.mjs';
test('gesture targets are bounded, mirrored and immutable',()=>{
 assert.deepEqual(GESTURES,['rest','brace','reach','guard']);
 for(const name of GESTURES){const a=createSideProfileGesture(name),b=createSideProfileGesture(name,{facing:-1});
  assert.ok(Object.isFrozen(a));assert.deepEqual(Object.keys(a[0].pose),Object.keys(b[0].pose));
  for(const [id,v] of Object.entries(a[0].pose)){assert.equal(v,-b[0].pose[id]);assert.ok(Math.abs(v)<=1.4);}}
 for(const opts of [{facing:0},{amplitude:2},{amplitude:NaN}])assert.throws(()=>createSideProfileGesture('reach',opts));
 assert.throws(()=>createSideProfileGesture('shoot'));
});
test('physically simulated gestures remain finite, movable and recoverable after release',()=>{
 for(const facing of [1,-1]){
  const w=createActiveRigWorld(createFacingRig(RIG,facing));w.enableRecoverySteps();
  w.setPoseClip(createSideProfileGesture('brace',{facing}),{fadeSeconds:.4});
  w.step(240);assert.equal(w.snapshot().metrics.nonfinite,0);
  const torso=w.rig.parts.get('torso').body;
  assert.ok(Number.isFinite(torso.getPosition().y));
  w.setPoseClip(createSideProfileGesture('rest',{facing}),{fadeSeconds:.5});
  w.step(120);assert.equal(w.snapshot().metrics.nonfinite,0);w.dispose();
 }
});
