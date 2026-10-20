import {createBalanceReflex} from '../src/behavior/balance-reflex.mjs';
import {createRecoveryStepController} from '../src/behavior/recovery-step.mjs';
import {samplePose,blendPose} from '../src/animation/pose-sampler.mjs';
import {poseMotorCommand} from '../src/actuation/pose-motor.mjs';
import {RIG} from '../rig-config.mjs';
import {createRigWorld,FIXED_DT} from './planck.mjs';
import {attachFootImpactSensor} from '../src/physics/contact-impulses.mjs';
import {estimateSupport} from '../src/physics/support-estimator.mjs';
import {createBalanceState} from '../src/behavior/balance-state.mjs';
export function createActiveRigWorld(base=RIG){
 const config={...base,motor:{...base.motor}},rig=createRigWorld(config);
 const sensor=attachFootImpactSensor(rig.world,rig.ground,rig.parts),state=createBalanceState();
 let grabbed=false,priorFeet=new Set(),priorVy={footL:0,footR:0},mode={mode:'airborne',age:0,canActuate:false};
 let poseClip=null,poseTime=0,poseLoop=false,poseFrame=null,stepFrame=null,stepController=null,balanceReflex=null,fadeOrigin=null,fadeAge=0,fadeSeconds=0,recoverySeconds=0,impacts=sensor.snapshot(),support=estimateSupport(rig.world,rig.ground,rig.parts);
 const torque={standing:8,catching:24,stepping:20,airborne:18,tumbling:8,fallen:8,grabbed:10};
 const diagnostics={modeCounts:{},landingEvents:0,maxImpactSpeed:0};
// continued
 /** Opt-in animation target: the solver remains the only authority for body poses.
  * A finite fade begins at the joints' *measured* angles to avoid motor-command jumps.
  * The animation pose is sampled once per 120 Hz simulation step.
  */
 function enableBalanceReflex(options=null){
  if(options!==null&&(!options||typeof options!=='object'))throw Error('Invalid balance options');
  balanceReflex=options===null?null:createBalanceReflex(options);
  installMotorController();
 }
 function enableRecoverySteps(enabled=true,options={}){
  if(typeof enabled!=='boolean')throw Error('Invalid recovery step mode');
  stepController=enabled?createRecoveryStepController({facing:base.facing??1,...options}):null;stepFrame=null;
  installMotorController();
 }
 function installMotorController(){
  rig.setPoseController(!poseClip&&!stepController&&!balanceReflex?null:({id,angle,angularVelocity})=>{
   const target=stepFrame?.[id]??poseFrame?.[id];
   return target===undefined?undefined:poseMotorCommand({angle,angularVelocity,targetAngle:target,
    maxTorque:id.startsWith('wrist')?config.motor.wristMaxTorque:config.motor.maxTorque,
    kp:config.motor.kp,kd:config.motor.kd,maxSpeed:config.motor.maxSpeed,
    speedGainScale:config.motor.speedGainScale});
  });
 }
 function setPoseClip(clip,{loop=false,fadeSeconds:fadeDuration=.18}={}){
  if(clip!==null&&(!Array.isArray(clip)||!clip.length))throw Error('Invalid pose clip');
  if(typeof loop!=='boolean')throw Error('Invalid loop mode');
  if(!Number.isFinite(fadeDuration)||fadeDuration<0||fadeDuration>5)throw Error('Invalid pose fade');
  if(clip!==null){
   const known=new Set(rig.links.map(({def})=>def.id));
   for(const id of Object.keys(clip[0].pose))if(!known.has(id))throw Error('Unknown pose joint '+id);
  }
  poseClip=clip;poseTime=clip?.[0].time??0;poseLoop=loop;
  fadeAge=0;fadeSeconds=fadeDuration;
  fadeOrigin=clip===null?null:Object.freeze(Object.fromEntries(rig.links.filter(
   ({def})=>Object.hasOwn(clip[0].pose,def.id)).map(({def,joint})=>[def.id,joint.getJointAngle()])));
  poseFrame=clip===null?null:fadeOrigin;
  installMotorController();
 }
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
    torsoAngle:torso.getAngle(),angularVelocity:torso.getAngularVelocity(),torsoHeight:torso.getWorldCenter().y,impactSpeed,grabbed});
   diagnostics.modeCounts[mode.mode]=(diagnostics.modeCounts[mode.mode]||0)+1;
   diagnostics.maxImpactSpeed=Math.max(diagnostics.maxImpactSpeed,impactSpeed);
   if(mode.mode==="catching")recoverySeconds=2;else recoverySeconds=Math.max(0,recoverySeconds-FIXED_DT);config.motor.maxTorque=mode.mode==="standing"&&recoverySeconds>0?18:torque[mode.mode];
   priorFeet=feet;
   for(const id of ['footL','footR'])priorVy[id]=rig.parts.get(id).body.getLinearVelocity().y;
   if(poseClip){
    const sampled=samplePose(poseClip,poseTime,{loop:poseLoop});
    poseFrame=fadeSeconds>0&&fadeAge<fadeSeconds
     ?blendPose(fadeOrigin,sampled,Math.min(1,fadeAge/fadeSeconds)):sampled;
   }
   if(stepController){
    const step=stepController.update({dt:FIXED_DT,support,parts:rig.parts,grabbed,torsoAngle:torso.getAngle(),torsoHeight:torso.getWorldCenter().y});
    stepFrame=step.targets;
   }
   if(balanceReflex){
    const side=stepController?.diagnostics()?.phase!=='idle'?stepController?.diagnostics()?.foot:null;
    stepFrame={...balanceReflex.update({support,torsoAngle:torso.getAngle(),
     torsoHeight:torso.getWorldCenter().y,grabbed,swingFoot:side}),...stepFrame};
   }
   if(stepFrame&&Object.keys(stepFrame).some(id=>Object.hasOwn(stepFrame,id)))config.motor.maxTorque=42;
   sensor.reset();rig.step();
   if(poseClip){poseTime+=FIXED_DT;fadeAge+=FIXED_DT;}
   impacts=sensor.snapshot();
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
  getState,getDiagnostics,setPoseClip,enableRecoverySteps,enableBalanceReflex,getStepDiagnostics(){return stepController?.diagnostics()??null;},getSupport(){return support;},
  getImpacts(){return impacts;},dispose(){sensor.detach();}};
}
