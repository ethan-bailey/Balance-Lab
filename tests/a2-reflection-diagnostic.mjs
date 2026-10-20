/** A2 reflection/COM diagnostic — observational only, NOT an acceptance gate.
 * Reports the canonical/mirrored physical trajectories in one sign convention.
 * Never changes simulation state beyond the same original opt-in controllers.
 */
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {createPoseClip} from '../src/animation/pose-sampler.mjs';
import {estimateSupport} from '../src/physics/support-estimator.mjs';

const modes=process.argv.includes('--passive')?['passive']:process.argv.includes('--stepping')?['stepping']:['passive','stepping'];
if(process.argv.slice(2).some(a=>!['--passive','--stepping'].includes(a)))throw Error('Invalid A2 diagnostic argument');
const at=new Set([0,20,40,60,90,120,180,240,360,599]);
const results=[];
for(const mode of modes)for(const impulse of [-10,-8,8,10]){
 const trajectories=[];
 for(const facing of [1,-1]){
  const rig=createActiveRigWorld(createFacingRig(undefined,facing));
  try{
   if(mode==='stepping')rig.enableRecoverySteps();
   rig.setPoseClip(createPoseClip([
    {time:0,pose:{shoulderL:.2*facing,shoulderR:-.2*facing}},
    {time:3,pose:{shoulderL:.2*facing,shoulderR:-.2*facing}}
   ]));
   rig.step(120);
   rig.impulse('torso',{x:impulse*facing,y:0});
   const samples=[];
   for(let i=0;i<600;i++){
    rig.step(1);
    if(!at.has(i))continue;
    const snapshot=rig.snapshot(),support=estimateSupport(rig.rig.world,rig.rig.ground,rig.rig.parts);
    samples.push({frame:i,torsoX:snapshot.bodies.torso.x*facing,torsoY:snapshot.bodies.torso.y,
     torsoAngle:snapshot.bodies.torso.a*facing,comX:support.com.x*facing,comVx:support.com.vx*facing,
     captureX:support.captureX===null?null:support.captureX*facing,
     supportMinX:support.support?Math.min(support.support.minX*facing,support.support.maxX*facing):null,
     supportMaxX:support.support?Math.max(support.support.minX*facing,support.support.maxX*facing):null,
     contactFeet:support.feet,footLX:snapshot.bodies.footL.x*facing,footRX:snapshot.bodies.footR.x*facing});
   }
   trajectories.push({facing,samples,step:rig.getStepDiagnostics()});
  }finally{rig.dispose();}
 }
 const paired=trajectories[0].samples.map((c,i)=>({frame:c.frame,
  torsoXDelta:Math.abs(c.torsoX-trajectories[1].samples[i].torsoX),
  torsoYDelta:Math.abs(c.torsoY-trajectories[1].samples[i].torsoY),
  torsoAngleDelta:Math.abs(c.torsoAngle-trajectories[1].samples[i].torsoAngle)}));
 results.push({mode,impulse,trajectories,paired});
}
console.log(JSON.stringify({schema:'A2-physical-reflection-diagnostic-v1',fixedHz:120,engine:'planck@1.5.1',
 acceptance:'OBSERVATION_ONLY',results},null,2));
