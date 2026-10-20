import test from 'node:test';
import assert from 'node:assert/strict';
import {createFootContactObserver} from '../src/physics/foot-contact-observer.mjs';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
const support=feet=>({feet});
test('contact hysteresis filters one-frame contact dropout and preserves real lift/landing',()=>{
 const o=createFootContactObserver({contactFrames:2,releaseFrames:3});
 o.update(support(['footL','footR']));assert.deepEqual(o.snapshot().stableFeet,[]);
 o.update(support(['footL','footR']));assert.deepEqual(o.snapshot().stableFeet,['footL','footR']);
 o.update(support(['footL']));assert.deepEqual(o.snapshot().stableFeet,['footL','footR']);
 o.update(support(['footL','footR']));assert.equal(o.snapshot().feet.footR.lifts,0);
 for(let i=0;i<3;i++)o.update(support(['footL']));
 assert.deepEqual(o.snapshot().stableFeet,['footL']);assert.equal(o.snapshot().feet.footR.lifts,1);
 o.update(support(['footL','footR']));assert.equal(o.snapshot().feet.footR.landings,1);
 o.update(support(['footL','footR']));assert.equal(o.snapshot().feet.footR.landings,2);
 assert.equal(o.snapshot().feet.footR.lastEvent.type,'land');
});
test('contact observer rejects invalid and duplicate feet, frames and settings',()=>{
 for(const settings of [{contactFrames:0},{releaseFrames:-1},{contactFrames:1.1},{releaseFrames:31}])assert.throws(()=>createFootContactObserver(settings));
 const o=createFootContactObserver();for(const feet of [['footL','footL'],['handL'],null])assert.throws(()=>o.update(support(feet)));
});
test('passive contact sensing does not change any physics or motor state',()=>{
 const a=createActiveRigWorld(),b=createActiveRigWorld();
 for(let t=0;t<300;t++){
  if(t===60){a.impulse('torso',{x:8,y:0});b.impulse('torso',{x:8,y:0});}
  a.step();b.step();a.getFootContactDiagnostics();
  assert.deepEqual(a.snapshot(),b.snapshot());
 }
 const diag=a.getFootContactDiagnostics();assert.equal(diag.frames,300);
 assert.ok(diag.feet.footL.landings>0||diag.feet.footR.landings>0);
 a.dispose();b.dispose();
});
test('step diagnostics remain distinct from actual contact lift and touchdown',()=>{
 const w=createActiveRigWorld();w.enableRecoverySteps();
 for(let t=0;t<720;t++){
  if(t===120)w.impulse('torso',{x:8,y:0});
  w.step();
 }
 const d=w.getFootContactDiagnostics(),s=w.getStepDiagnostics();
 assert.ok(d.feet.footL.landings+d.feet.footR.landings>=1);
 assert.ok(s.attempts>=s.completed);
 assert.ok(s.attempts>=s.failures);
 assert.ok(s.completed<=s.landings);
 w.dispose();
});
