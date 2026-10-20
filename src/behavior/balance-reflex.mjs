/** Planck-neutral whole-body target correction: no direct forces or transforms.
 * Muscle controller decides actual torque, physics determines motion.
 */
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function createBalanceReflex({ankleGain=0,hipGain=0,maxAnkle=.28,maxHip=.24}={}){
 if(![ankleGain,hipGain,maxAnkle,maxHip].every(Number.isFinite)||maxAnkle<0||maxHip<0||maxAnkle>1||maxHip>1)throw Error('Invalid balance gain');
 function update({support,torsoAngle,torsoHeight,grabbed=false,swingFoot=null}){
  if(!support?.com||!Number.isFinite(torsoAngle)||!Number.isFinite(torsoHeight))throw Error('Invalid balance sensing');
  if(grabbed||torsoHeight<1||support.contactCount<1||!support.support)return {};
  const {minX,maxX}=support.support,center=(minX+maxX)/2;
  const predicted=support.captureX??support.com.x;
  const error=clamp(center-predicted,-.5,.5);
  const targets={};
  for(const side of ['L','R']){
   if(side===swingFoot||!support.feet.includes('foot'+side))continue;
   targets['ankle'+side]=clamp(ankleGain*error,-maxAnkle,maxAnkle);
   targets['hip'+side]=clamp(hipGain*error,-maxHip,maxHip);
  }
  return targets;
 }
 return {update};
}
