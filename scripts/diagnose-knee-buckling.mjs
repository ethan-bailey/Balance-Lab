/** Observational knee-buckling trace, no policy and no physics modifications. */
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {RIG} from '../rig-config.mjs';
const cases=[];
for(const facing of [1,-1])for(const impulse of [0,-1,1,-3,3]){
 const rig=createActiveRigWorld(createFacingRig(RIG,facing));rig.enableRecoverySteps();rig.step(120);
 if(impulse)rig.impulse('torso',{x:impulse,y:0});
 let minTorsoY=Infinity,maxKneeFlexion=0,maxKneeSpeed=0,maxTorsoAngle=0,footlessFrames=0;
 let peakKneeFrame=null;
 for(let t=0;t<1200;t++){
  rig.step(1);const s=rig.snapshot(),torso=s.bodies.torso,support=rig.getSupport();
  minTorsoY=Math.min(minTorsoY,torso.y);maxTorsoAngle=Math.max(maxTorsoAngle,Math.abs(torso.a));
  if(support.contactCount===0)footlessFrames++;
  for(const id of ['kneeL','kneeR']){
   const j=rig.rig.links.find(l=>l.def.id===id).joint;
   const angle=Math.abs(j.getJointAngle());maxKneeSpeed=Math.max(maxKneeSpeed,Math.abs(j.getJointSpeed()));
   if(angle>maxKneeFlexion){maxKneeFlexion=angle;peakKneeFrame={t,id,angle:j.getJointAngle(),
    torsoY:torso.y,torsoAngle:torso.a,comVx:support.com.vx,contactFeet:support.feet};}
  }
 }
 cases.push({facing,impulse,minTorsoY,maxTorsoAngle,maxKneeFlexion,maxKneeSpeed,
  footlessFrames,stepAttempts:rig.getStepDiagnostics().attempts,peakKneeFrame});rig.dispose();
}
console.log(JSON.stringify({schema:'BalanceLab-knee-physical-diagnostic-v1',seconds:10,cases},null,2));
