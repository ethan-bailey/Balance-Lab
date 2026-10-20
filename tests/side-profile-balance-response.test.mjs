import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {createSideProfileGesture} from '../src/animation/side-profile-gesture.mjs';
import {RIG} from '../rig-config.mjs';

/** Deterministic benchmark: whole-body balance corrections must improve on
 * the stepping-only controller, while preserving natural falls at large loads.
 */
function trial({facing,gesture,shove,reflex}){
 const w=createActiveRigWorld(createFacingRig(RIG,facing));w.enableRecoverySteps();
 if(reflex)w.enableBalanceReflex({ankleGain:1.4,hipGain:.8,smoothingSeconds:.01});
 w.setPoseClip(createSideProfileGesture(gesture,{facing}),{fadeSeconds:.35});
 let fallen=0,kneePeak=0,minTorsoY=Infinity;
 for(let tick=0;tick<720;tick++){
  if(tick===120)w.impulse('torso',{x:shove*facing,y:0});
  w.step();if(['fallen','tumbling'].includes(w.getState().mode))fallen++;
  minTorsoY=Math.min(minTorsoY,w.rig.parts.get('torso').body.getPosition().y);
  for(const side of ['L','R'])kneePeak=Math.max(kneePeak,Math.abs(w.rig.links.find(l=>l.def.id==='knee'+side).joint.getJointAngle()));
 }
 const out={fallen,kneePeak,minTorsoY,mode:w.getState().mode};w.dispose();return out;
}
test('experimental ankle/hip reflex improves aggregate six-second shove survival without hiding failures',()=>{
 let baselineFalls=0,assistedFalls=0,assistedKneePeak=0;
 const failures=[];
 for(const facing of [1,-1])for(const gesture of ['rest','brace','reach','guard'])for(const shove of [-8,8]){
  const args={facing,gesture,shove};
  const base=trial({...args,reflex:false}),assist=trial({...args,reflex:true});
  if(base.fallen>0)baselineFalls++;
  if(assist.fallen>0){assistedFalls++;failures.push(args);}
  assistedKneePeak=Math.max(assistedKneePeak,assist.kneePeak);
  assert.ok(Number.isFinite(assist.minTorsoY),JSON.stringify({args,assist}));
 }
 console.log(JSON.stringify({baselineFalls,assistedFalls,assistedKneePeak,failures}));
 assert.ok(assistedFalls<baselineFalls,`experimental assist must outperform baseline: ${assistedFalls}/${baselineFalls}`);
});
test('whole-body correction improves a baseline reproducible fall without pinning the body',()=>{
 const args={facing:1,gesture:'rest',shove:-8};
 const old=trial({...args,reflex:false}),improved=trial({...args,reflex:true});
 assert.ok(old.fallen>0,JSON.stringify(old));
 assert.equal(improved.fallen,0,JSON.stringify(improved));
 assert.ok(improved.kneePeak<old.kneePeak);
});
test('experimental assist still permits a real fall under overwhelming force',()=>{
 for(const facing of [1,-1]){
  const result=trial({facing,gesture:'rest',shove:25,reflex:true});
  assert.ok(result.fallen>0,JSON.stringify({facing,result}));
  assert.ok(result.minTorsoY<.8,JSON.stringify({facing,result}));
 }
});
