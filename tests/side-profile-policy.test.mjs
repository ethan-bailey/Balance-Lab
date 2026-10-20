import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {RIG} from '../rig-config.mjs';
import {createCharacterIntent,DEFAULT_INTENT,POLICY_JOINTS,
 POLICY_OBSERVATION_SIZE,observeSideProfile,motorResidualTargets,createSideProfileMLP} from '../src/ml/side-profile-policy.mjs';
const zeroPolicy={predict:o=>{assert.equal(o.length,POLICY_OBSERVATION_SIZE);return POLICY_JOINTS.map(()=>0);}};
const pose=[{time:0,pose:{hipL:0.15,kneeL:-.18,shoulderL:.2}},
 {time:2,pose:{hipL:0.15,kneeL:-.18,shoulderL:.2}}];

test('side-profile intents are immutable, explicit and reject invalid combat commands',()=>{
 const intent=createCharacterIntent({activity:'aim',handUse:'both',load:.4,aim:.8,stance:'crouch'});
 assert.equal(intent.activity,'aim');assert.equal(intent.handUse,'both');
 assert.ok(Object.isFrozen(intent));
 for(const options of [{activity:'fly'},{handUse:'third'},{move:2},{load:-1},{aim:NaN},{stance:'floating'}])
  assert.throws(()=>createCharacterIntent(options),/Invalid/);
});

test('MLP is deterministic, finite, shape-validated and returns zero for zero weights',()=>{
 const h=8,input=POLICY_OBSERVATION_SIZE,output=POLICY_JOINTS.length;
 const policy=createSideProfileMLP({hiddenSize:h,w1:new Array(h*input).fill(0),b1:new Array(h).fill(0),
  w2:new Array(h*output).fill(0),b2:new Array(output).fill(0)});
 assert.deepEqual(policy.predict(new Array(input).fill(0)),new Array(output).fill(0));
 assert.throws(()=>policy.predict([0]),/observation/);
 assert.throws(()=>createSideProfileMLP({hiddenSize:h,w1:[0],b1:[],w2:[],b2:[]}),/weights/);
});

test('learned zero-action policy leaves authoritative physical snapshots bit-identical',()=>{
 for(const facing of [1,-1]){
  const a=createActiveRigWorld(createFacingRig(RIG,facing));
  const b=createActiveRigWorld(createFacingRig(RIG,facing));
  a.enableRecoverySteps();b.enableRecoverySteps();
  a.setPoseClip(pose);b.setPoseClip(pose);
  b.setLearnedMotorPolicy(zeroPolicy);
  for(let t=0;t<250;t++){
   if(t===120){a.impulse('torso',{x:8*facing,y:0});b.impulse('torso',{x:8*facing,y:0});}
   a.step(1);b.step(1);
   assert.deepEqual(b.snapshot(),a.snapshot(),`zero policy diverged at ${facing}/${t}`);
  }
  assert.equal(b.getLearnedDiagnostics().policyTicks,250);
  b.setLearnedMotorPolicy(null);assert.equal(b.getLearnedDiagnostics().enabled,false);
  a.dispose();b.dispose();
 }
});

test('policy observations and actions use facing-local signs with fixed schema',()=>{
 for(const facing of [1,-1]){
  const w=createActiveRigWorld(createFacingRig(RIG,facing));w.step(120);
  const observation=observeSideProfile({rig:w.rig,support:w.getSupport(),facing,intent:DEFAULT_INTENT});
  assert.equal(observation.length,POLICY_OBSERVATION_SIZE);
  assert.ok(observation.every(Number.isFinite));
  const output=POLICY_JOINTS.map(id=>id.startsWith('hip')?2:0);
  const actions=motorResidualTargets({outputs:output,rig:w.rig,facing});
  assert.equal(Object.keys(actions).length,2);
  for(const id of ['hipL','hipR']){
   const link=w.rig.links.find(l=>l.def.id===id);
   assert.ok(Math.abs(actions[id]-link.joint.getJointAngle())<=.181);
  }
  w.dispose();
 }
});

test('weapon grip reserves arm joints; recovery stepping reserves physical joints',()=>{
 const w=createActiveRigWorld();w.step(120);
 const outputs=POLICY_JOINTS.map(()=>1);
 const intent=createCharacterIntent({activity:'fire',handUse:'both',load:.7,guard:1});
 const targets=motorResidualTargets({outputs,rig:w.rig,intent,protectedTargets:{hipL:.25}});
 assert.equal(targets.hipL,undefined);
 for(const id of POLICY_JOINTS.filter(x=>/shoulder|elbow|wrist/.test(x)))assert.equal(targets[id],undefined);
 assert.ok(Number.isFinite(targets.hipR));
 assert.throws(()=>motorResidualTargets({outputs:[NaN,...outputs.slice(1)],rig:w.rig}),/Invalid/);
 assert.throws(()=>motorResidualTargets({outputs,rig:w.rig,maxResidual:10}),/Invalid/);
 w.dispose();
});

test('finite learned correction remains overpowerable by severe physical forces',()=>{
 const w=createActiveRigWorld();w.enableRecoverySteps();
 w.setLearnedMotorPolicy({predict:()=>POLICY_JOINTS.map(id=>id.startsWith('knee')?-.15:.1)});
 w.step(120);w.impulse('torso',{x:35,y:5});w.step(360);
 assert.equal(w.snapshot().metrics.nonfinite,0);
 assert.equal(w.getState().mode,'fallen');
 assert.ok(w.snapshot().bodies.torso.y<.6);
 w.dispose();
});
