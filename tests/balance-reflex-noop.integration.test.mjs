import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {createPoseClip} from '../src/animation/pose-sampler.mjs';

// A no-op balance reflex must not change physics through implicit zero-angle
// motor commands or elevated torque. Compare complete deterministic worlds.
for(const facing of [1,-1])test(`zero-gain reflex is physically inert with active stepping, facing ${facing}`,()=>{
 const clip=createPoseClip([{time:0,pose:{shoulderL:.2*facing,shoulderR:-.2*facing}},
  {time:3,pose:{shoulderL:.2*facing,shoulderR:-.2*facing}}]);
 const worlds=[false,true].map(enable=>{
  const r=createActiveRigWorld(createFacingRig(undefined,facing));
  r.enableRecoverySteps();
  if(enable)r.enableBalanceReflex({ankleGain:0,hipGain:0});
  r.setPoseClip(clip);
  r.step(120);r.impulse('torso',{x:8*facing,y:0});r.step(240);
  const result={snapshot:r.snapshot(),step:r.getStepDiagnostics(),state:r.getState()};
  r.dispose();return result;
 });
 assert.deepEqual(worlds[1],worlds[0]);
});
