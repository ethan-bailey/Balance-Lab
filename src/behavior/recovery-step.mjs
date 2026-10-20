/**
 * Opt-in contact-recovery gait, governed by measured COM momentum.
 * No body transforms, foot pins, or force injection: the controller emits
 * joint-local angle references for the existing torque-limited Planck motors.
 *
 * An initial step is selected from the COM's signed lateral velocity;
 * a faster capture trajectory requires an immediate rather than prepared
 * swing. After a short knee/hip flexion the swing leg is extended toward a
 * new support point. Physical lift and touchdown are checked independently
 * of the command sequence.
 */
export function createRecoveryStepController({
 triggerVelocity=.20,triggerMargin=.33,quickVelocity=.32,facing=1,
 prepareFrames=10,swingFrames=12,plantFrames=60,liftGraceFrames=24,
 cooldownSeconds=4.5,minimumDisplacement=.06,
}={}){
 const valid=[triggerVelocity,triggerMargin,quickVelocity,cooldownSeconds,minimumDisplacement];
 if((facing!==1&&facing!==-1)||valid.some(v=>!Number.isFinite(v)||v<0)||
    quickVelocity<=triggerVelocity||minimumDisplacement<.02||minimumDisplacement>.3)
   throw Error('Invalid step configuration');
 if(![prepareFrames,swingFrames,plantFrames,liftGraceFrames].every(v=>Number.isInteger(v)&&v>=0&&v<=240)||
    swingFrames<1||plantFrames<1)throw Error('Invalid step frame count');

 let phase='idle',framesLeft=0,cooldownLeft=0,foot=null,direction=0,startX=0;
 let swingTargets=null,plantTargets=null,lastContact=false,liftSeen=false,landed=false;
 let attempts=0,lifts=0,landings=0,completed=0,failures=0;
 const empty={phase:'idle',targets:{}};

 function finish(failed){
  if(failed)failures++;
  else if(landed)completed++;
  else failures++;
  phase='idle';framesLeft=0;cooldownLeft=cooldownSeconds;
  swingTargets=null;plantTargets=null;
 }
 function update({dt,support,parts,grabbed=false,torsoAngle=0,torsoHeight=1.3}){
  if(!Number.isFinite(dt)||dt<=0||dt>.1||!support?.com||!parts||
    !Number.isFinite(torsoAngle)||!Number.isFinite(torsoHeight))throw Error('Invalid step sensor');
  cooldownLeft=Math.max(0,cooldownLeft-dt);
  const contacts=new Set(support.feet);
  if(phase!=='idle'&&(grabbed||Math.abs(torsoAngle)>1.05||torsoHeight<.9)){
   finish(true);return empty;
  }
  if(phase==='idle'){
   const {com,margin,captureMargin}=support;
   if(cooldownLeft>0||grabbed||torsoHeight<1.12||Math.abs(torsoAngle)>.65||
      support.contactCount!==2||!Number.isFinite(com.vx))return empty;
   const riskMargin=Number.isFinite(captureMargin)?Math.min(margin,captureMargin):margin;
   if(!Number.isFinite(riskMargin)||Math.abs(com.vx)<triggerVelocity||riskMargin>=triggerMargin)return empty;
   direction=Math.sign(com.vx);
   const bodyDirection=direction*facing;
   foot=bodyDirection<0?'R':'L';
   const body=parts.get('foot'+foot)?.body;
   if(!body)throw Error('Missing swing foot');
   startX=body.getPosition().x;
   const quick=Math.abs(com.vx)>=quickVelocity;
   // The asymmetry is a property of the currently verified hinged rig.
   // Motion magnitudes are selected from physical COM speed, not a scripted impulse.
   swingTargets=bodyDirection<0
    ?{hipR:-.2*facing,kneeR:-.8*facing,ankleR:0}
    :{hipL:(quick?.5:.7)*facing,kneeL:-.35*facing,ankleL:0};
   plantTargets=bodyDirection<0
    ?{hipR:.2*facing,kneeR:0,ankleR:0}
    :{hipL:0,kneeL:0,ankleL:0};
   lastContact=contacts.has('foot'+foot);
   liftSeen=false;landed=false;
   attempts++;
   if(!quick&&prepareFrames){phase='prepare';framesLeft=prepareFrames;}
   else {phase='swing';framesLeft=swingFrames;}
  }
  const currentFoot=parts.get('foot'+foot)?.body;
  if(!currentFoot)throw Error('Missing swing foot');
  const contact=contacts.has('foot'+foot);
  if(lastContact&&!contact){liftSeen=true;lifts++;}
  if(liftSeen&&!lastContact&&contact&&!landed){
   const shift=direction*(currentFoot.getPosition().x-startX);
   if(shift>minimumDisplacement&&torsoHeight>1.15){landed=true;landings++;}
  }
  lastContact=contact;

  if(phase==='prepare'){
   framesLeft--;
   if(framesLeft===0){phase='swing';framesLeft=swingFrames;}
   return {phase:'prepare',targets:{}};
  }
  if(phase==='swing'){
   framesLeft--;
   // Swing cannot advance into landing unless a real foot-contact loss occurred.
   // Permit a short bounded extension for a slow liftoff, then fail safely.
   if(framesLeft<=0){
    if(liftSeen){phase='plant';framesLeft=plantFrames;}
    else if(framesLeft < -liftGraceFrames){finish(true);return empty;}
   }
   return {phase:'swing',targets:swingTargets};
  }
  if(phase==='plant'){
   framesLeft--;
   const targets=plantTargets;
   if(framesLeft===0)finish(torsoHeight<1.15||!landed);
   return {phase:'plant',targets};
  }
  return empty;
 }
 function diagnostics(){
  return {phase,foot,attempts,lifts,landings,completed,failures};
 }
 return {update,diagnostics};
}
