import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createPoseClip} from '../src/animation/pose-sampler.mjs';
import {estimateSupport} from '../src/physics/support-estimator.mjs';

test('A2 opt-in standing remains supported for 60 seconds without spontaneous steps',()=>{
 const r=createActiveRigWorld();r.enableRecoverySteps();
 r.step(7200);const s=r.snapshot(),d=r.getStepDiagnostics();
 assert.equal(s.metrics.nonfinite,0);assert.ok(Math.abs(s.bodies.torso.x)<.1);assert.ok(s.bodies.torso.y>1.15);
 assert.equal(d.attempts,0);assert.equal(r.getState().mode,'standing');
 r.dispose();
});

test('A2 leftward shove can trigger contact-verified foot lift, replant and stand with animation active',()=>{
 const r=createActiveRigWorld();r.enableRecoverySteps();
 r.setPoseClip(createPoseClip([
  {time:0,pose:{shoulderL:.2,shoulderR:-.2}},
  {time:3,pose:{shoulderL:.2,shoulderR:-.2}}
 ]));
 r.step(120);
 const initial=Object.fromEntries(['footL','footR'].map(id=>[id,r.snapshot().bodies[id].x]));
 const seenLift=new Set(),seenTouchdown=new Set();
 let previous=new Set(estimateSupport(r.rig.world,r.rig.ground,r.rig.parts).feet);
 r.impulse('torso',{x:-8,y:0});
 for(let i=0;i<480;i++){
  r.step(1);
  const current=new Set(estimateSupport(r.rig.world,r.rig.ground,r.rig.parts).feet);
  const s=r.snapshot();
  for(const id of ['footL','footR']){
   if(previous.has(id)&&!current.has(id))seenLift.add(id);
   if(seenLift.has(id)&&!previous.has(id)&&current.has(id)&&Math.abs(s.bodies[id].x-initial[id])>.06)seenTouchdown.add(id);
  }
  previous=current;
 }
 const s=r.snapshot(),d=r.getStepDiagnostics();
 assert.ok(d.lifts>0,'controller must observe physical liftoff');
 assert.ok(d.landings>0,'controller must observe contact-confirmed replant');
 assert.ok(seenTouchdown.size>0,'independent collision observer must confirm foot touchdown');
 assert.ok(s.bodies.torso.y>1.15,'torso remains upright after shove');
 assert.equal(r.getState().mode,'standing');
 assert.equal(s.metrics.nonfinite,0);
 r.dispose();
});

test('A2 severe shove remains physically capable of knocking the body down',()=>{
 const r=createActiveRigWorld();r.enableRecoverySteps();r.step(120);
 r.impulse('torso',{x:-35,y:5});r.step(360);
 const s=r.snapshot();
 assert.equal(s.metrics.nonfinite,0);
 assert.ok(s.bodies.torso.y<.9,'reactive controller may not teleport torso upright');
 r.dispose();
});

test('A2 safe rightward shoves complete contact-confirmed steps and remain standing',()=>{
 const clip=createPoseClip([{time:0,pose:{shoulderL:.2,shoulderR:-.2}},{time:3,pose:{shoulderL:.2,shoulderR:-.2}}]);
 for(const force of [8,10]){
  const r=createActiveRigWorld();r.enableRecoverySteps();r.setPoseClip(clip);
  r.step(120);r.impulse('torso',{x:force,y:0});r.step(480);
  const s=r.snapshot(),d=r.getStepDiagnostics();
  assert.equal(d.attempts,1,'rightward response must use a single physically commanded step');
  assert.ok(d.lifts>=1&&d.landings>=1&&d.completed>=1,'rightward physical step must replant');
  assert.ok(s.bodies.torso.y>1.15,'preserve previously stable standing response');
  assert.equal(r.getState().mode,'standing');
  r.dispose();
 }
});

test('A2 reactive step replay is deterministic with animation and contact sensing',()=>{
 const clip=createPoseClip([{time:0,pose:{shoulderL:.2,shoulderR:-.2}},{time:3,pose:{shoulderL:.2,shoulderR:-.2}}]);
 const a=createActiveRigWorld(),b=createActiveRigWorld();
 for(const r of [a,b]){r.enableRecoverySteps();r.setPoseClip(clip);r.step(120);r.impulse('torso',{x:-8,y:0});r.step(480);}
 assert.deepEqual(a.snapshot(),b.snapshot());
 assert.deepEqual(a.getStepDiagnostics(),b.getStepDiagnostics());
 assert.ok(a.getStepDiagnostics().landings>=1);
 a.dispose();b.dispose();
});
