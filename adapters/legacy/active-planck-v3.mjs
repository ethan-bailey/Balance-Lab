/** HISTORICAL adapter: retained for regression only. Active runtime is ../active-planck-v6.mjs. */
import {RIG} from '../../rig-config.mjs';
import {createRigWorld,FIXED_DT} from '../planck.mjs';
import {attachFootImpactSensor} from '../../src/physics/contact-impulses.mjs';
import {estimateSupport} from '../../src/physics/support-estimator.mjs';
import {createBalanceState} from '../../src/behavior/balance-state.mjs';
export function createActiveRigWorld(base=RIG){
 const config={...base,motor:{...base.motor}},rig=createRigWorld(config);
 const sensor=attachFootImpactSensor(rig.world,rig.ground,rig.parts),state=createBalanceState();
 let grabbed=false,priorFeet=new Set(),priorVy={footL:0,footR:0},mode={mode:'airborne',age:0,canActuate:false};
 let impacts=sensor.snapshot(),support=estimateSupport(rig.world,rig.ground,rig.parts);
 const torque={standing:18,catching:24,stepping:20,airborne:18,tumbling:8,fallen:8,grabbed:10};
 const diagnostics={modeCounts:{},landingEvents:0,maxImpactSpeed:0};
// continued
 function step(count=1){
  if(!Number.isInteger(count)||count<0||count>100000)throw Error('Invalid step count');
  for(let i=0;i<count;i++){
   support=estimateSupport(rig.world,rig.ground,rig.parts);
   const feet=new Set(support.feet);let impactSpeed=0;
   for(const id of feet)if(!priorFeet.has(id)){
    impactSpeed=Math.max(impactSpeed,Math.max(0,-priorVy[id]));diagnostics.landingEvents++;
   }
   const torso=rig.parts.get('torso').body;
   mode=state.update({dt:FIXED_DT,contactCount:support.contactCount,margin:support.margin,
    torsoAngle:torso.getAngle(),angularVelocity:torso.getAngularVelocity(),impactSpeed,grabbed});
   diagnostics.modeCounts[mode.mode]=(diagnostics.modeCounts[mode.mode]||0)+1;
   diagnostics.maxImpactSpeed=Math.max(diagnostics.maxImpactSpeed,impactSpeed);
   config.motor.maxTorque=torque[mode.mode];
   priorFeet=feet;
   for(const id of ['footL','footR'])priorVy[id]=rig.parts.get(id).body.getLinearVelocity().y;
   sensor.reset();rig.step();impacts=sensor.snapshot();
  }
  return snapshot();
 }
 function snapshot(){return rig.snapshot();}

 // marker
 function grab(id,target,point){rig.grab(id,target,point);grabbed=true;}
 function release(){rig.release();grabbed=false;}
 function getState(){return {mode:mode.mode,age:mode.age,canActuate:mode.canActuate};}
 function getDiagnostics(){return {landingEvents:diagnostics.landingEvents,maxImpactSpeed:diagnostics.maxImpactSpeed,modeCounts:{...diagnostics.modeCounts}};}
 return {rig,step,snapshot,grab,release,moveGrab:rig.moveGrab,
  impulse:rig.impulse,parts:rig.parts,metrics:rig.metrics,
  getState,getDiagnostics,getSupport(){return support;},
  getImpacts(){return impacts;},dispose(){sensor.detach();}};
}
