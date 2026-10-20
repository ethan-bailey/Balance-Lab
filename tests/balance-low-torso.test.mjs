import test from 'node:test';
import assert from 'node:assert/strict';
import {createBalanceState} from '../src/behavior/balance-state.mjs';
const sample=(height)=>({dt:1/120,contactCount:2,margin:.10,torsoAngle:0,angularVelocity:0,torsoHeight:height});
test('low torso in foot contact is physically fallen, not standing',()=>{
 const state=createBalanceState();
 assert.equal(state.update(sample(.40)).mode,'fallen');
 assert.equal(state.update(sample(1.4)).mode,'fallen');
 for(let i=0;i<20;i++)state.update(sample(1.4));
 assert.equal(state.update(sample(1.4)).mode,'standing');
});
test('optional height is validated and older callers remain supported',()=>{
 const state=createBalanceState();
 assert.throws(()=>state.update(sample(NaN)),/torso height/);
 assert.equal(state.update({...sample(1.4),torsoHeight:null}).mode,'airborne');
});
