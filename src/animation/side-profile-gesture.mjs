/** Opt-in expressive side-profile upper-body reference poses.
 * The same Planck rig remains authoritative; no physical transforms are set.
 * Arm pose is authored as local joint angles and is compatible with future
 * equipment hand-ownership. It is not trained motion or a weapon animation.
 */
import {createPoseClip} from './pose-sampler.mjs';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const GESTURES=Object.freeze(['rest','brace','reach','guard']);
const POSES=Object.freeze({
 rest:Object.freeze({shoulderL:0,elbowL:0,wristL:0,shoulderR:0,elbowR:0,wristR:0}),
 brace:Object.freeze({shoulderL:-.32,elbowL:-.52,wristL:.08,shoulderR:.32,elbowR:-.52,wristR:-.08}),
 // Reach is a single forward-reaching arm; the other remains free at the side.
 // A ~90 degree shoulder rotation moves the hand forward in world space
 // because the physical upper arm hangs vertically in the rest pose.
 reach:Object.freeze({shoulderL:0,elbowL:0,wristL:0,shoulderR:1.6,elbowR:-.2,wristR:0}),
 // Both forearms rise in front of the chest, not backward or down.
 guard:Object.freeze({shoulderL:1.8,elbowL:-.7,wristL:0,shoulderR:1.8,elbowR:-.7,wristR:0})
});
export function createSideProfileGesture(name='rest',{facing=1,amplitude=1}={}){
 if(!GESTURES.includes(name)||![1,-1].includes(facing)||!Number.isFinite(amplitude)||amplitude<0||amplitude>1)
  throw Error('Invalid side-profile gesture');
 const target=Object.fromEntries(Object.entries(POSES[name]).map(([id,v])=>[id,clamp(v*amplitude*facing,-1.4,1.4)]));
 return createPoseClip([{time:0,pose:target},{time:10,pose:target}]);
}
