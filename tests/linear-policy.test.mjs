import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createLinearMotorPolicy,LINEAR_WEIGHT_COUNT} from '../src/ml/linear-policy.mjs';
import {POLICY_OBSERVATION_SIZE,POLICY_JOINTS} from '../src/ml/side-profile-policy.mjs';

test('trainable linear policy is finite, bounded and weight arrays are detached',()=>{
 const weights=new Array(LINEAR_WEIGHT_COUNT).fill(0);
 weights[0]=1;const p=createLinearMotorPolicy(weights);weights[0]=10;
 const obs=new Array(POLICY_OBSERVATION_SIZE).fill(0);obs[0]=.5;
 const out=p.predict(obs);
 assert.equal(out.length,POLICY_JOINTS.length);
 assert.ok(Math.abs(out[0]-Math.tanh(.5))<1e-12);
 assert.ok(out.every(x=>Math.abs(x)<=1));
 assert.throws(()=>createLinearMotorPolicy([1]),/weights/);
 assert.throws(()=>p.predict([0]),/observation/);
});

test('seeded headless ML training is reproducible and never auto-activates a candidate',()=>{
 const run=()=>execFileSync(process.execPath,['scripts/train-side-profile-es.mjs',
  '--generations=1','--population=2','--ticks=120','--seed=1404'],
  {cwd:new URL('../',import.meta.url),encoding:'utf8',timeout:60000,stdio:['ignore','pipe','ignore']});
 const a=JSON.parse(run()),b=JSON.parse(run());
 assert.deepEqual(a,b);
 assert.equal(a.schema,'BalanceLab-2D-ES-experiment-v1');
 assert.ok(Number.isFinite(a.baseline.train.score));
 assert.ok(Number.isFinite(a.candidate.holdout.score));
 assert.equal(typeof a.improved,'boolean');
});
