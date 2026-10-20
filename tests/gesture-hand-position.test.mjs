import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {createSideProfileGesture} from '../src/animation/side-profile-gesture.mjs';
import {RIG} from '../rig-config.mjs';
function sample(gesture,facing){
 const w=createActiveRigWorld(createFacingRig(RIG,facing));w.enableRecoverySteps();
 w.setPoseClip(createSideProfileGesture(gesture,{facing}),{fadeSeconds:.35});w.step(360);
 const torso=w.rig.parts.get('torso').body.getPosition();
 const hands=Object.fromEntries(['L','R'].map(side=>{const p=w.rig.parts.get('hand'+side).body.getPosition();
  return [side,{forward:(p.x-torso.x)*facing,up:p.y-torso.y}];}));
 const mode=w.getState().mode;w.dispose();return {hands,mode};
}
test('reach moves the actual physical leading hand forward, keeps the other hand free',()=>{
 for(const facing of [1,-1]){
  const rest=sample('rest',facing),reach=sample('reach',facing);
  assert.equal(reach.mode,'standing');
  assert.ok(reach.hands.R.forward>.70,JSON.stringify(reach));
  assert.ok(reach.hands.R.up>-.20,JSON.stringify(reach));
  assert.ok(Math.abs(reach.hands.L.forward-rest.hands.L.forward)<.12,JSON.stringify(reach));
 }
});
test('guard moves both physical hands in front of torso, not behind back',()=>{
 for(const facing of [1,-1]){
  const guard=sample('guard',facing);assert.equal(guard.mode,'standing');
  for(const side of ['L','R']){
   assert.ok(guard.hands[side].forward>.15,JSON.stringify(guard));
   assert.ok(guard.hands[side].up>-.15,JSON.stringify(guard));
  }
 }
});
