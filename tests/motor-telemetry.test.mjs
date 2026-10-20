import test from 'node:test';
import assert from 'node:assert/strict';
import {createMotorTelemetry} from '../src/physics/motor-telemetry.mjs';
import {createRigWorld,FIXED_DT} from '../adapters/planck.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10);
test('MT01 validates unique joint IDs',()=>{
 assert.throws(()=>createMotorTelemetry([]));
 assert.throws(()=>createMotorTelemetry(['a','a']));
 assert.throws(()=>createMotorTelemetry(['']));
});
test('MT02 initial zero accounting is complete',()=>{
 const m=createMotorTelemetry(['hip','knee']);const s=m.snapshot();
 assert.equal(s.total.samples,0);assert.equal(s.substeps,0);
 assert.deepEqual(Object.keys(s.joints),['hip','knee']);
});
test('MT03 signed positive and negative motor work is correct',()=>{
 const m=createMotorTelemetry(['hip']);
 m.sample('hip',5,2,.01,10);m.sample('hip',-4,3,.01,10);
 const s=m.snapshot().total;
 close(s.positiveWorkJ,.1);close(s.negativeWorkJ,-.12);
 close(s.netWorkJ,-.02);close(s.absoluteWorkJ,.22);
});
test('MT04 saturation and peak torque/power are observed',()=>{
 const m=createMotorTelemetry(['a','b']);
 m.sample('a',9.9,2,.01,10);m.sample('b',-3,5,.01,10);
 const s=m.snapshot().total;
 assert.equal(s.saturatedSamples,1);close(s.peakTorqueNm,9.9);
 close(s.peakPowerW,19.8);assert.equal(s.samples,2);
});
test('MT05 invalid numeric samples fail before corrupting accounting',()=>{
 const m=createMotorTelemetry(['a']);
 for(const values of [['a',NaN,1,.01,10],['a',1,Infinity,.01,10],['a',1,1,0,10],['a',1,1,.1,10],['a',1,1,.01,-1],['b',1,1,.01,10]])
  assert.throws(()=>m.sample(...values));
 assert.equal(m.snapshot().total.samples,0);
});
test('MT06 snapshots are detached and reset clears all counters',()=>{
 const m=createMotorTelemetry(['a']);m.nextSubstep();m.sample('a',2,2,.01,10);
 const s=m.snapshot();s.joints.a.samples=999;
 assert.equal(m.snapshot().joints.a.samples,1);
 m.reset();assert.equal(m.snapshot().total.samples,0);
 assert.equal(m.snapshot().substeps,0);
});
test('MT07 deterministic input sequence produces identical telemetry',()=>{
 const run=()=>{const m=createMotorTelemetry(['a','b']);for(let i=0;i<200;i++){m.nextSubstep();m.sample(i%2?'a':'b',Math.sin(i),Math.cos(i),1/240,10);}return m.snapshot();};
 assert.deepEqual(run(),run());
});
test('MT08 real Planck joint torque and angular speed produce finite physical work',()=>{
 const rig=createRigWorld();const meter=createMotorTelemetry(rig.links.map(x=>x.def.id));
 rig.step(120);
 for(const {def,joint,A,B} of rig.links)meter.sample(def.id,joint.getMotorTorque(2/FIXED_DT),B.getAngularVelocity()-A.getAngularVelocity(),FIXED_DT/2,joint.getMaxMotorTorque());
 const s=meter.snapshot();
 assert.equal(s.total.samples,rig.links.length);
 assert.ok(s.total.peakTorqueNm>0);
 assert.ok(s.total.absoluteWorkJ>0);
 assert.ok(Number.isFinite(s.total.netWorkJ));
 assert.equal(rig.snapshot().metrics.nonfinite,0);
});
test('MT09 ten-second physical rig trace has bounded finite motor work',()=>{
 const rig=createRigWorld(),m=createMotorTelemetry(rig.links.map(x=>x.def.id));
 for(let i=0;i<1200;i++){
  rig.step(1);m.nextSubstep();
  for(const {def,joint,A,B} of rig.links)m.sample(def.id,joint.getMotorTorque(2/FIXED_DT),B.getAngularVelocity()-A.getAngularVelocity(),FIXED_DT/2,joint.getMaxMotorTorque());
 }
 const t=m.snapshot().total;
 assert.equal(t.samples,1200*rig.links.length);
 assert.ok(t.absoluteWorkJ>0&&Number.isFinite(t.absoluteWorkJ));
 assert.ok(t.peakTorqueNm<=60.0001);
 assert.equal(rig.snapshot().metrics.nonfinite,0);
});
test('MT10 actual shove changes measured motor work without teleporting bodies',()=>{
 const run=(force)=>{
  const rig=createRigWorld(),m=createMotorTelemetry(rig.links.map(x=>x.def.id));
  rig.step(120);if(force)rig.impulse('torso',{x:force,y:0});
  for(let i=0;i<240;i++){
   rig.step(1);
   for(const {def,joint,A,B} of rig.links)m.sample(def.id,joint.getMotorTorque(2/FIXED_DT),B.getAngularVelocity()-A.getAngularVelocity(),FIXED_DT/2,joint.getMaxMotorTorque());
  }
  return {work:m.snapshot().total.absoluteWorkJ,torso:rig.snapshot().bodies.torso,nonfinite:rig.snapshot().metrics.nonfinite};
 };
 const a=run(0),b=run(8);
 assert.ok(Math.abs(a.work-b.work)>.01);
 assert.ok(Math.abs(a.torso.x-b.torso.x)>.03);
 assert.ok(Math.abs(a.torso.a-b.torso.a)>.02);
 assert.equal(a.nonfinite,0);assert.equal(b.nonfinite,0);
});
