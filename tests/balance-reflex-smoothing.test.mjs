import test from 'node:test';
import assert from 'node:assert/strict';
import {createBalanceReflex} from '../src/behavior/balance-reflex.mjs';
function trace(smoothingSeconds){
 const reflex=createBalanceReflex({ankleGain:1.4,hipGain:.8,smoothingSeconds});
 const ankle=[];
 for(let tick=0;tick<240;tick++){
  // A sustained capture offset with a high-frequency alternating sensor
  // perturbation; use identical input on both controllers.
  const predicted=.1+.018*(tick%2?1:-1);
  const support={com:{x:predicted,vx:0},captureX:predicted,support:{minX:-.2,maxX:.2},feet:['footL','footR'],contactCount:2};
  ankle.push(reflex.update({support,torsoAngle:0,torsoHeight:1.35,dt:1/120}).ankleL??0);
 }
 const variation=ankle.slice(1).reduce((s,v,i)=>s+Math.abs(v-ankle[i]),0);
 return {variation,final:ankle.at(-1),first:ankle[0]};
}
test('capture-point low-pass reduces rapid joint target reversals without zeroing balance',()=>{
 const raw=trace(0),filtered=trace(.01);
 assert.ok(filtered.variation<raw.variation*.6,JSON.stringify({raw,filtered}));
 assert.ok(Math.abs(filtered.final)>.08,JSON.stringify(filtered));
});
test('reflex smoothing parameters are bounded',()=>{
 for(const value of [-.01,NaN,Infinity,.6])assert.throws(()=>createBalanceReflex({smoothingSeconds:value}));
});
