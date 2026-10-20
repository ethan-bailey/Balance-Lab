/** Planck-neutral whole-body target correction: no direct forces or transforms.
 * Muscle controller decides actual torque, physics determines motion.
 */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function createBalanceReflex({ankleGain=0,hipGain=0,maxAnkle=.28,maxHip=.24,smoothingSeconds=0}={}){
 if(![ankleGain,hipGain,maxAnkle,maxHip,smoothingSeconds].every(Number.isFinite)||maxAnkle<0||maxHip<0||maxAnkle>1||maxHip>1||smoothingSeconds<0||smoothingSeconds>.5)throw Error('Invalid balance gain');
 let smoothedError=null;
 function update({support,torsoAngle,torsoHeight,grabbed=false,swingFoot=null,dt=1/120}){
  if(!support?.com||!Number.isFinite(torsoAngle)||!Number.isFinite(torsoHeight)||!Number.isFinite(dt)||dt<=0||dt>.1)throw Error('Invalid balance sensing');
  if(grabbed||torsoHeight<1||support.contactCount<1||!support.support){smoothedError=null;return {};}
  const {minX,maxX}=support.support,center=(minX+maxX)/2;
  const predicted=support.captureX??support.com.x;
  const rawError=clamp(center-predicted,-.5,.5);
  // Smooth the capture-point signal, not the measured physical pose. This
  // reduces high-frequency torque-target reversals without adding fake forces.
  const alpha=smoothingSeconds===0?1:1-Math.exp(-dt/smoothingSeconds);
  smoothedError=smoothedError===null?rawError:smoothedError+alpha*(rawError-smoothedError);
  const error=smoothedError;
  const targets={};
  for(const side of ['L','R']){
   if(side===swingFoot||!support.feet.includes('foot'+side))continue;
   const ankle=clamp(ankleGain*error,-maxAnkle,maxAnkle);
   const hip=clamp(hipGain*error,-maxHip,maxHip);
   // A zero-gain/no-error reflex must not claim motor ownership: even a
   // zero-angle target changes torque activation in the active rig.
   if(Math.abs(ankle)>1e-9)targets['ankle'+side]=ankle;
   if(Math.abs(hip)>1e-9)targets['hip'+side]=hip;
  }
  return targets;
 }
 return {update};
}
