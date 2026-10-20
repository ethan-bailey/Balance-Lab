/** Experimental seeded evolutionary-strategy trainer on authoritative Planck.
 * Usage: node scripts/train-side-profile-es.mjs --generations=3 --population=8
 * Candidate weights are NOT installed or used in gameplay automatically.
 */
import {writeFileSync} from 'node:fs';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {RIG} from '../rig-config.mjs';
import {LINEAR_WEIGHT_COUNT,createLinearMotorPolicy} from '../src/ml/linear-policy.mjs';
const args=Object.fromEntries(process.argv.slice(2).map(x=>{
 const m=/^--([a-z-]+)=(.*)$/.exec(x);if(!m)throw Error('Invalid argument '+x);return [m[1],m[2]];}));
const int=(name,defaultValue,min,max)=>{
 const v=args[name]===undefined?defaultValue:Number(args[name]);
 if(!Number.isInteger(v)||v<min||v>max)throw Error('Invalid '+name);return v;
};
const generations=int('generations',3,1,500),population=int('population',8,2,256),
 seed=int('seed',12020,1,2147483647),ticks=int('ticks',300,120,2400);
if(Object.keys(args).some(x=>!['generations','population','seed','ticks','out'].includes(x)))throw Error('Unknown argument');
let rng=seed>>>0;
function random(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return (rng+.5)/4294967296;}
function normal(){return Math.sqrt(-2*Math.log(random()))*Math.cos(2*Math.PI*random());}
const trainCases=[{facing:1,impulse:-5},{facing:-1,impulse:5},{facing:1,impulse:8},{facing:-1,impulse:-8}];
const holdout=[{facing:-1,impulse:-4},{facing:1,impulse:4},{facing:1,impulse:-7},{facing:-1,impulse:7}];
function evaluate(weights,cases){
 const policy=createLinearMotorPolicy(weights);let total=0,falls=0;
 for(const {facing,impulse} of cases){
  const w=createActiveRigWorld(createFacingRig(RIG,facing));w.enableRecoverySteps();
  w.setLearnedMotorPolicy(policy);w.step(120);w.impulse('torso',{x:impulse,y:0});
  let episode=0;
  for(let t=0;t<ticks;t++){
   w.step(1);
   if(t%12===0){const torso=w.rig.parts.get('torso').body,angle=torso.getAngle(),y=torso.getPosition().y;
    const mode=w.getState().mode;
    episode+=Math.max(-1,Math.min(1,(y-1)/.35))*.45-Math.min(1,Math.abs(angle))*.35;
    if(mode==='fallen'){episode-=3;break;}
   }
  }
  const final=w.snapshot();if(final.bodies.torso.y<1.1)falls++;
  // Favor low joint activity to avoid rigid, jittery exploit policies.
  const jointActivity=w.rig.links.reduce((sum,l)=>sum+Math.abs(l.joint.getJointSpeed()),0);
  total+=episode-.003*jointActivity;
  w.dispose();
 }
 return {score:total/cases.length,falls};
}
const zeros=Array(LINEAR_WEIGHT_COUNT).fill(0);
const baseline=evaluate(zeros,trainCases),baselineHoldout=evaluate(zeros,holdout);
let champion=zeros.slice(),best=baseline.score,sigma=.6;
const history=[{generation:0,score:best,falls:baseline.falls}];
for(let g=1;g<=generations;g++){
 let localBest=best,localChampion=champion;
 for(let k=0;k<population;k++){
  const candidate=champion.map(w=>Math.max(-4,Math.min(4,w+normal()*sigma)));
  const result=evaluate(candidate,trainCases);
  if(result.score>localBest){localBest=result.score;localChampion=candidate;}
 }
 champion=localChampion;best=localBest;
 history.push({generation:g,score:best});sigma*=.82;
 console.error(`generation=${g} best=${best.toFixed(5)} baseline=${baseline.score.toFixed(5)}`);
}
const holdoutResult=evaluate(champion,holdout),trainResult=evaluate(champion,trainCases);
const improved=trainResult.score>baseline.score&&holdoutResult.score>baselineHoldout.score&&
 holdoutResult.falls<=baselineHoldout.falls;
const report={schema:'BalanceLab-2D-ES-experiment-v1',seed,generations,population,ticks,
 algorithm:'seeded elitist evolution strategies (proof-of-training, not PPO)',
 baseline:{train:baseline,holdout:baselineHoldout},candidate:{train:trainResult,holdout:holdoutResult},
 improved,history,weights:champion};
if(args.out){writeFileSync(args.out,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({...report,weights:undefined},null,2));
// This is a research result, not a required pass: failed learning is reported honestly.
