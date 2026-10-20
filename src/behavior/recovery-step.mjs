/** Contact-verified physical step attempt.
 * Plans joint-local motor targets only. Foot/body translations remain solver owned.
 * A step is successful only if the foot lifts, travels and touches down while torso supported.
 */
export function createRecoveryStepController({
 triggerVelocity=.20,triggerMargin=.33,liftTimeout=.42,stepTimeout=1.3,cooldown=.65,mirroredLeftKnee=false,allowUnassistedRightSteps=false,rightHip=.5,rightKnee=-.35,rightLandHip=.1,rightLandKnee=0,swingSeconds=.30,
}={}){
 if([triggerVelocity,triggerMargin,liftTimeout,stepTimeout,cooldown].some(v=>!Number.isFinite(v)||v<0))throw Error('Invalid step configuration');
 if(![rightHip,rightKnee,rightLandHip,rightLandKnee,swingSeconds].every(Number.isFinite)
 ||Math.abs(rightHip)> .85||rightKnee< -1.65||rightKnee>.15||Math.abs(rightLandHip)>.85
 ||rightLandKnee< -1.65||rightLandKnee>.15||swingSeconds<.05||swingSeconds>1)throw Error('Invalid rightward step targets');
 if(typeof mirroredLeftKnee!=='boolean'||typeof allowUnassistedRightSteps!=='boolean')throw Error('Invalid step safety configuration');
 let phase='idle',age=0,foot=null,direction=0,startX=0,liftSeen=false;
 let attempts=0,lifts=0,landings=0,failures=0,cooldownLeft=0,timeSinceAttempt=Infinity;
 function reset(failed){
  if(failed)failures++;
  phase='idle';cooldownLeft=cooldown;age=0;
 }
 function update({dt,support,parts,grabbed=false,torsoAngle=0,torsoHeight=1.3}){
  if(!Number.isFinite(dt)||dt<=0||dt>.1||!support?.com||!parts||!Number.isFinite(torsoHeight))throw Error('Invalid step sensor');
  age+=dt;timeSinceAttempt+=dt;cooldownLeft=Math.max(0,cooldownLeft-dt);
  const feet=new Set(support.feet);
  if(phase!=='idle'&&(grabbed||Math.abs(torsoAngle)>1.05||torsoHeight<.9||support.contactCount===0)){
   reset(true);return {phase,targets:{}};
  }
  if(phase==='idle'){
   const {com,margin}=support;
   const riskMargin=support.captureMargin===null||support.captureMargin===undefined?margin:Math.min(margin,support.captureMargin);
   if(cooldownLeft>0||support.contactCount!==2||Math.abs(com.vx)<triggerVelocity||riskMargin===null||riskMargin>=triggerMargin)return {phase,targets:{}};
   direction=Math.sign(com.vx);
   // The canonical left knee cannot yet perform a stable rightward recovery swing.
   // Suppress the unsafe strategy and its immediate rebound until a validated geometry/controller exists.
   if(direction>0&&!allowUnassistedRightSteps&&timeSinceAttempt>6){cooldownLeft=Math.max(cooldownLeft,2.5);return {phase,targets:{}};}
   // Cross-step: moving the opposite-side swing leg supports motion in the impulse direction.
   foot=direction<0?'R':'L';
   const swing=parts.get('foot'+foot);
   if(!swing)throw Error('Missing swing foot');
   startX=swing.body.getPosition().x;
   phase='lift';age=0;liftSeen=false;attempts++;timeSinceAttempt=0;
  }
  const swingId='foot'+foot,body=parts.get(swingId)?.body;
  if(!body)throw Error('Missing swing foot');
  const footX=body.getPosition().x;
  if(phase==='lift'&&!feet.has(swingId)){phase='swing';age=0;liftSeen=true;lifts++;}
  if(phase==='lift'&&age>liftTimeout){reset(true);return {phase,targets:{}};}
  if(phase==='swing'&&age>swingSeconds){phase='settle';age=0;}
  if(phase==='settle'){
   const landingTargets=foot==='R'?{hipR:-.1,kneeR:0,ankleR:0}:{hipL:rightLandHip,kneeL:rightLandKnee,ankleL:0};
   const displacement=direction*(footX-startX);
   if(liftSeen&&feet.has(swingId)){
    if(displacement>.06&&torsoHeight>1.15){landings++;reset(false);}
    else reset(true);
    return {phase,targets:{}};
   }
   if(age>stepTimeout){reset(true);return {phase,targets:{}};}
   return {phase,targets:landingTargets};
  }
  const hip='hip'+foot,knee='knee'+foot,ankle='ankle'+foot;
  return {phase,targets:foot==='R'
   ?{[hip]:.30,[knee]:-.8,[ankle]:0}
    :{[hip]:mirroredLeftKnee?.1:rightHip,[knee]:mirroredLeftKnee?.8:rightKnee,[ankle]:0}};
 }
 function diagnostics(){return {phase,foot,attempts,lifts,landings,failures};}
 return {update,diagnostics};
}
