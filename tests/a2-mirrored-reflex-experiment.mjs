/** Intentionally failing experimental gate; do not enable this feedback globally.
 * Diagnoses the tradeoff between medium-shove support and long-idle no-creep.
 */
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {createPoseClip} from '../src/animation/pose-sampler.mjs';
const gains={ankleGain:9.5,hipGain:-3};
const clip=createPoseClip([{time:0,pose:{shoulderL:-.2,shoulderR:.2}},{time:3,pose:{shoulderL:-.2,shoulderR:.2}}]);
const shoves=[];
for(const force of [-10,-8,8,10]){
 const r=createActiveRigWorld(createFacingRig(undefined,-1));
 r.enableRecoverySteps();r.enableBalanceReflex(gains);r.setPoseClip(clip);
 r.step(120);r.impulse('torso',{x:force,y:0});r.step(600);
 const s=r.snapshot(),d=r.getStepDiagnostics();
 const pass=s.metrics.nonfinite===0&&s.bodies.torso.y>1.15&&r.getState().mode==='standing'&&d.landings>0&&d.completed>0&&d.failures===0;
 shoves.push({force,pass,landings:d.landings,completed:d.completed,torsoY:s.bodies.torso.y,state:r.getState().mode});
 r.dispose();
}
const idle=createActiveRigWorld(createFacingRig(undefined,-1));
idle.enableRecoverySteps();idle.enableBalanceReflex(gains);idle.step(7200);
const idleSnapshot=idle.snapshot(),idleDiagnostics=idle.getStepDiagnostics();
const idlePass=Math.abs(idleSnapshot.bodies.torso.x)<.1&&idleSnapshot.bodies.torso.y>1.15&&idleDiagnostics.attempts===0&&idle.getState().mode==='standing';
const result={schema:'A2-mirrored-feedback-preload-prototype-v1',engine:'planck@1.5.1',gains,shoves,allShovesPass:shoves.every(s=>s.pass),idle:{pass:idlePass,torsoX:idleSnapshot.bodies.torso.x,torsoY:idleSnapshot.bodies.torso.y,mode:idle.getState().mode,uncommandedSteps:idleDiagnostics.attempts},fullGatePass:idlePass&&shoves.every(s=>s.pass)};
idle.dispose();
console.log(JSON.stringify(result,null,2));
if(!result.fullGatePass)process.exitCode=1;
