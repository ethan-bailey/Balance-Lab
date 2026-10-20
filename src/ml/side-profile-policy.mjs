/** Experimental task-conditioned, 2D sagittal-plane motor policy contract.
 * Observations are measured from Planck. Actions are finite joint-target residuals,
 * NEVER transforms, impulses, contact state, or direct world modifications.
 */
export const POLICY_JOINTS=Object.freeze([
 'hipL','kneeL','ankleL','hipR','kneeR','ankleR',
 'shoulderL','elbowL','wristL','shoulderR','elbowR','wristR']);
export const POLICY_ACTIVITIES=Object.freeze([
 'idle','locomote','aim','fire','reload','melee','climb','fall','recover']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,name)=>{if(!Number.isFinite(v))throw Error('Invalid '+name);return v;};
export function createCharacterIntent({activity='idle',move=0,aim=0,stance='stand',
 handUse='none',load=0,guard=0}={}){
 if(!POLICY_ACTIVITIES.includes(activity)||!['stand','crouch','prone'].includes(stance)||
 !['none','left','right','both'].includes(handUse))throw Error('Invalid character intent');
 for(const [name,value,min,max] of [['move',move,-1,1],['aim',aim,-1,1],
 ['load',load,0,1],['guard',guard,0,1]]){
  finite(value,name);if(value<min||value>max)throw Error('Invalid '+name);
 }
 return Object.freeze({activity,move,aim,stance,handUse,load,guard});
}
export const DEFAULT_INTENT=createCharacterIntent();
/** All features are fixed-order, dimensionless and mirrored into character-forward coordinates.
 * No equipment-specific data is assumed; load and hand ownership are explicit inputs.
 */
export function observeSideProfile({rig,support,poseTargets={},facing=1,intent=DEFAULT_INTENT}){
 if(!rig||!support||!rig.parts||!rig.links||![1,-1].includes(facing))throw Error('Invalid policy world');
 const torso=rig.parts.get('torso')?.body;
 if(!torso)throw Error('Missing policy torso');
 const com=support.com;
 if(!com||!Number.isFinite(com.x)||!Number.isFinite(com.vx))throw Error('Invalid support observation');
 const s=Object.freeze([
  clamp(torso.getAngle()*facing/1.5,-2,2),
  clamp(torso.getAngularVelocity()*facing/8,-2,2),
  clamp(com.vx*facing/8,-2,2),clamp(com.y/2,-2,2),
  clamp(((support.captureX??com.x)-com.x)*facing,-2,2),
  clamp(support.margin??0,-2,2),
  support.feet?.includes('footL')?1:0,
  support.feet?.includes('footR')?1:0,
 ]);
 const joints=new Map(rig.links.map(link=>[link.def.id,link.joint]));
 const features=[...s];
 for(const id of POLICY_JOINTS){const joint=joints.get(id);if(!joint)throw Error('Missing policy joint '+id);
  features.push(clamp(joint.getJointAngle()*facing/2.5,-2,2),
   clamp(joint.getJointSpeed()*facing/12,-2,2));}
 for(const id of POLICY_JOINTS)features.push(clamp((poseTargets[id]??0)*facing/2.5,-2,2));
 for(const activity of POLICY_ACTIVITIES)features.push(intent.activity===activity?1:0);
 features.push(intent.move,intent.aim,intent.stance==='crouch'?1:0,
  intent.stance==='prone'?1:0,intent.handUse==='left'||intent.handUse==='both'?1:0,
  intent.handUse==='right'||intent.handUse==='both'?1:0,intent.load,intent.guard);
 if(features.some(v=>!Number.isFinite(v)))throw Error('Nonfinite policy observation');
 return Object.freeze(features);
}
export const POLICY_OBSERVATION_SIZE=8+POLICY_JOINTS.length*3+POLICY_ACTIVITIES.length+8;
/** Small inference-only MLP, independent of any browser ML framework.
 * Weights are row-major [out][in]. Training/export are separate and opt-in.
 */
export function createSideProfileMLP({inputSize=POLICY_OBSERVATION_SIZE,
 hiddenSize=32,outputSize=POLICY_JOINTS.length,w1,b1,w2,b2}={}){
 if(inputSize!==POLICY_OBSERVATION_SIZE||outputSize!==POLICY_JOINTS.length||
 !Number.isInteger(hiddenSize)||hiddenSize<1||hiddenSize>256)throw Error('Invalid policy shape');
 const tensors=[[w1,hiddenSize*inputSize],[b1,hiddenSize],
  [w2,outputSize*hiddenSize],[b2,outputSize]].map(([v,size])=>{
   if(!v||v.length!==size||Array.from(v).some(x=>!Number.isFinite(x)||Math.abs(x)>1e4))
    throw Error('Invalid policy weights');return Float64Array.from(v);
  });
 const [a,b,c,d]=tensors;
 return Object.freeze({predict(observation){
  if(!observation||observation.length!==inputSize||Array.from(observation).some(x=>!Number.isFinite(x)))
   throw Error('Invalid policy observation');
  const hidden=new Float64Array(hiddenSize),out=new Array(outputSize);
  for(let i=0;i<hiddenSize;i++){
   let z=b[i];for(let j=0;j<inputSize;j++)z+=a[i*inputSize+j]*observation[j];
   hidden[i]=Math.tanh(z);
  }
  for(let i=0;i<outputSize;i++){
   let z=d[i];for(let j=0;j<hiddenSize;j++)z+=c[i*hiddenSize+j]*hidden[j];
   out[i]=Math.tanh(z);
  }
  return out;
 }});
}
/** Task-specific hand ownership prevents a balance policy fighting aiming or weapon grips.
 * Recovery-step targets take priority. Residuals are bounded before motor tracking.
 */
export function motorResidualTargets({outputs,rig,poseTargets={},protectedTargets={},
 facing=1,intent=DEFAULT_INTENT,maxResidual=.18}={}){
 if(!outputs||outputs.length!==POLICY_JOINTS.length||![1,-1].includes(facing)||
 !Number.isFinite(maxResidual)||maxResidual<=0||maxResidual>.5)throw Error('Invalid policy action');
 const links=new Map(rig.links.map(link=>[link.def.id,link]));
 const result={};
 for(let i=0;i<POLICY_JOINTS.length;i++){
  const id=POLICY_JOINTS[i],raw=finite(outputs[i],'policy action');
  const limb=id.endsWith('L')?'left':id.endsWith('R')?'right':null;
  if(Math.abs(raw)<1e-8||Object.hasOwn(protectedTargets,id)||
   ((intent.handUse==='both'||intent.handUse===limb)&&
   /^(shoulder|elbow|wrist)/.test(id)))continue;
  const link=links.get(id);if(!link)throw Error('Missing action joint '+id);
  const limit=id.startsWith('wrist')?Math.min(maxResidual,.08):maxResidual;
  const base=poseTargets[id]??link.joint.getJointAngle();
  const desired=base+clamp(raw,-1,1)*limit*facing;
  result[id]=clamp(desired,link.def.lower+.01,link.def.upper-.01);
 }
 return Object.freeze(result);
}
