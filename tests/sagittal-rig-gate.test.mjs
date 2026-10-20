import test from 'node:test';
import assert from 'node:assert/strict';
import {RIG} from '../rig-config.mjs';
import {createSagittalRig,SAGITTAL_RIG_ID} from '../src/config/sagittal-rig.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
const sagittal=createSagittalRig();
test('opt-in physical sagittal geometry preserves the untouched baseline and 13 independently simulated segments',()=>{
 assert.equal(sagittal.rigId,SAGITTAL_RIG_ID);
 assert.equal(sagittal.segments.length,13);assert.equal(sagittal.joints.length,12);
 assert.equal(RIG.segments.find(s=>s.id==='thighL').x,-.13);
 assert.equal(RIG.segments.find(s=>s.id==='upperArmL').x,-.265);
 for(const side of ['L','R']){
  const sign=side==='L'?-1:1;
  for(const id of ['thigh','shin','foot'])assert.equal(sagittal.segments.find(s=>s.id===id+side).x,sign*.1);
  for(const id of ['upperArm','forearm','hand'])assert.equal(sagittal.segments.find(s=>s.id===id+side).x,sign*.09);
  for(const id of ['hip','knee','ankle'])assert.equal(sagittal.joints.find(j=>j.id===id+side).x,sign*.1);
  for(const id of ['shoulder','elbow','wrist'])assert.equal(sagittal.joints.find(j=>j.id===id+side).x,sign*.09);
 }
});
test('invalid anatomical parameters are rejected',()=>{
 for(const opts of [{hipHalfSeparation:0},{hipHalfSeparation:.15},{shoulderHalfSeparation:NaN},{footLength:Infinity},{footLength:.35}])assert.throws(()=>createSagittalRig(RIG,opts));
});
test('sagittal prototype stands ten seconds both facing directions under finite Planck motors',()=>{
 for(const facing of [1,-1]){
  const w=createActiveRigWorld(createFacingRig(sagittal,facing));w.enableRecoverySteps();w.enableBalanceReflex({ankleGain:1.8,hipGain:.6,smoothingSeconds:.01});
  let fallenTicks=0,minY=10;
  for(let t=0;t<1200;t++){
   w.step();if(['fallen','tumbling'].includes(w.getState().mode))fallenTicks++;
   minY=Math.min(minY,w.rig.parts.get('torso').body.getPosition().y);
  }
  assert.equal(fallenTicks,0,`facing ${facing} fallen`);assert.ok(minY>1.15,`facing ${facing} torso sank to ${minY}`);
  const metrics=w.rig.metrics;assert.equal(metrics.nonfinite,0);assert.ok(metrics.maxMotorTorqueNm<=60);w.dispose();
 }
});
test('both sagittal facings recover from ±12 N·s shoves in standing rest',()=>{
 for(const facing of [1,-1])for(const force of [-12,12]){
  const w=createActiveRigWorld(createFacingRig(sagittal,facing));w.enableRecoverySteps();w.enableBalanceReflex({ankleGain:1.8,hipGain:.6,smoothingSeconds:.01});
  let fallen=0;
  for(let t=0;t<1200;t++){if(t===180)w.impulse('torso',{x:force*facing,y:0});w.step();if(['fallen','tumbling'].includes(w.getState().mode))fallen++;}
  assert.equal(fallen,0,JSON.stringify({facing,force,fallen}));w.dispose();
 }
});
test('sagittal physical body remains overpowerable by 35 N·s shove',()=>{
 for(const facing of [1,-1]){
  const w=createActiveRigWorld(createFacingRig(sagittal,facing));w.enableRecoverySteps();w.enableBalanceReflex({ankleGain:1.8,hipGain:.6,smoothingSeconds:.01});
  let fallen=0;for(let t=0;t<1200;t++){if(t===180)w.impulse('torso',{x:35*facing,y:0});w.step();if(['fallen','tumbling'].includes(w.getState().mode))fallen++;}
  assert.ok(fallen>0,`facing ${facing} should fall`);w.dispose();
 }
});
