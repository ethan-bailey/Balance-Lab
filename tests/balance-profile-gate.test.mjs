import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {createSideProfileGesture} from '../src/animation/side-profile-gesture.mjs';
import {createBalanceReflex} from '../src/behavior/balance-reflex.mjs';
import {RIG} from '../rig-config.mjs';
const PROFILES={strong:{ankleGain:1.8,hipGain:.6,smoothingSeconds:.01},smooth:{ankleGain:1.8,hipGain:.6,smoothingSeconds:.01,reflexTorque:42,reflexTorqueFloor:28,deadband:.005}};
function trial(profile,{facing,gesture,force}){
 const w=createActiveRigWorld(createFacingRig(RIG,facing));w.enableRecoverySteps();w.enableBalanceReflex(PROFILES[profile]);
 w.setPoseClip(createSideProfileGesture(gesture,{facing}),{fadeSeconds:.35});
 let falls=0,minimumY=100;
 for(let tick=0;tick<720;tick++){
  if(tick===120)w.impulse('torso',{x:force*facing,y:0});
  w.step();minimumY=Math.min(minimumY,w.rig.parts.get('torso').body.getPosition().y);
  if(['fallen','tumbling'].includes(w.getState().mode))falls++;
 }
 const result={falls,minimumY,mode:w.getState().mode};w.dispose();return result;
}
test('both optimized balance profiles resist eight-newton-second shoves across all poses and facings',()=>{
 for(const profile of Object.keys(PROFILES))for(const facing of [-1,1])for(const gesture of ['rest','brace','reach','guard'])for(const force of [-8,8]){
  const result=trial(profile,{facing,gesture,force});
  assert.equal(result.falls,0,JSON.stringify({profile,facing,gesture,force,result}));
 }
});
test('profiles do not pin or teleport the rig: overwhelming forces still cause physical falls',()=>{
 for(const profile of Object.keys(PROFILES))for(const facing of [-1,1]){
  const result=trial(profile,{facing,gesture:'rest',force:35});
  assert.ok(result.falls>0,JSON.stringify({profile,facing,result}));
 }
});
test('invalid torque caps and deadband values fail closed',()=>{
 for(const opts of [{reflexTorque:Infinity},{reflexTorque:0},{reflexTorque:50},{reflexTorqueFloor:0},{reflexTorqueFloor:50},{reflexTorque:20,reflexTorqueFloor:30}]){
  const w=createActiveRigWorld();assert.throws(()=>w.enableBalanceReflex(opts));w.dispose();
 }
 for(const deadband of [-.1,NaN,Infinity,.16])assert.throws(()=>createBalanceReflex({deadband}));
});
