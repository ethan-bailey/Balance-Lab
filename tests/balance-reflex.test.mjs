import test from 'node:test';
import assert from 'node:assert/strict';
import {createBalanceReflex} from '../src/behavior/balance-reflex.mjs';
const support={com:{x:0,y:1.2,vx:-2},contactCount:2,feet:['footL','footR'],support:{minX:-.3,maxX:.3},captureX:-.5};
test('experimental balance reflex generates bounded joint targets without changing sensors',()=>{
 const before=JSON.stringify(support);
 const controller=createBalanceReflex({ankleGain:10,hipGain:5});
 const result=controller.update({support,torsoAngle:0,torsoHeight:1.3});
 assert.ok(Math.abs(result.ankleL)<=.28&&Math.abs(result.ankleR)<=.28);
 assert.ok(Math.abs(result.hipL)<=.24&&Math.abs(result.hipR)<=.24);
 assert.equal(JSON.stringify(support),before);
});
test('balance reflex does not actuate unsupported or grabbed ragdoll',()=>{
 const c=createBalanceReflex({ankleGain:1});
 assert.deepEqual(c.update({support,torsoAngle:0,torsoHeight:1.3,grabbed:true}),{});
 assert.deepEqual(c.update({support:{...support,contactCount:0},torsoAngle:0,torsoHeight:.6}),{});
 assert.deepEqual(c.update({support,torsoAngle:0,torsoHeight:1.3,swingFoot:'L'}).ankleL,undefined);
});
test('reject invalid balance gains',()=>{
 assert.throws(()=>createBalanceReflex({ankleGain:Infinity}),/Invalid balance gain/);
 assert.throws(()=>createBalanceReflex({maxHip:2}),/Invalid balance gain/);
});

test('zero-gain and zero-capture-error reflexes do not seize joint motor ownership',()=>{
 const neutral=createBalanceReflex({ankleGain:0,hipGain:0});
 assert.deepEqual(neutral.update({support,torsoAngle:0,torsoHeight:1.3}),{});
 const center={...support,com:{...support.com,vx:0},captureX:0};
 const active=createBalanceReflex({ankleGain:2,hipGain:4});
 assert.deepEqual(active.update({support:center,torsoAngle:0,torsoHeight:1.3}),{});
});

test('capture reflex respects physical mirror symmetry for signed errors',()=>{
 const active=createBalanceReflex({ankleGain:2,hipGain:4});
 const mirrored={...support,com:{...support.com,x:-support.com.x,vx:-support.com.vx},
  captureX:-support.captureX,support:{minX:-support.support.maxX,maxX:-support.support.minX}};
 const left=active.update({support,torsoAngle:0,torsoHeight:1.3});
 const right=active.update({support:mirrored,torsoAngle:0,torsoHeight:1.3});
 for(const id of ['hipL','hipR','ankleL','ankleR'])assert.equal(right[id],-left[id]);
});
