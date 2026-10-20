/** Explicit unmet A2 bilateral gate. Run on purpose, not as part of passing unit suite.
 * A nonzero exit is evidence that the feature must NOT be released as complete.
 */
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createPoseClip} from '../src/animation/pose-sampler.mjs';
const clip=createPoseClip([
 {time:0,pose:{shoulderL:.2,shoulderR:-.2}},
 {time:3,pose:{shoulderL:.2,shoulderR:-.2}}
]);
const cases=[];
for(const impulse of [-10,-8,8,10]){
 const r=createActiveRigWorld();r.enableRecoverySteps();
 r.setPoseClip(clip);r.step(120);r.impulse('torso',{x:impulse,y:0});r.step(480);
 const s=r.snapshot(),d=r.getStepDiagnostics(),standing=s.bodies.torso.y>1.15&&r.getState().mode==='standing';
 // Intentional: mere support without a physically confirmed corrective step does not close T06.
 const pass=standing&&d.landings>=1&&s.metrics.nonfinite===0;
 cases.push({impulse,pass,standing,attempts:d.attempts,lifts:d.lifts,landings:d.landings,torsoY:s.bodies.torso.y,mode:r.getState().mode});
 r.dispose();
}
const pass=cases.every(c=>c.pass);
console.log(JSON.stringify({schema:'A2-bilateral-T06-v1',pass,cases},null,2));
if(!pass)process.exitCode=1;
