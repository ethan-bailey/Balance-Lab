/** Opt-in, 13-body sagittal plane physical layout.
 * Narrow hip/shoulder offsets represent sagittal stance, not screen-space art.
 * Derived joint anchors remain aligned with the same Planck physical bodies.
 * The baseline M1 geometry remains unchanged for A/B comparison.
 */
import {RIG} from '../../rig-config.mjs';
export const SAGITTAL_RIG_ID='balance-lab-sagittal-13body-experimental-v1';
export function createSagittalRig(base=RIG,{hipHalfSeparation=.1,shoulderHalfSeparation=.09,footLength=.26}={}){
 if(!base?.segments?.length||!base?.joints?.length||![hipHalfSeparation,shoulderHalfSeparation,footLength].every(Number.isFinite)||
  hipHalfSeparation<.06||hipHalfSeparation>.13||shoulderHalfSeparation<.05||shoulderHalfSeparation>.16||footLength<.2||footLength>.3)throw Error('Invalid sagittal rig geometry');
 const side=id=>id.endsWith('L')?-1:id.endsWith('R')?1:0;
 const segments=base.segments.map(def=>{
  const s=side(def.id);
  if(/^(thigh|shin|foot)/.test(def.id))return {...def,x:s*hipHalfSeparation,...(def.id.startsWith('foot')?{w:footLength}:{})};
  if(/^(upperArm|forearm|hand)/.test(def.id))return {...def,x:s*shoulderHalfSeparation};
  return {...def};
 });
 const joints=base.joints.map(def=>{
  const s=side(def.id);
  if(/^(hip|knee|ankle)/.test(def.id))return {...def,x:s*hipHalfSeparation};
  if(/^(shoulder|elbow|wrist)/.test(def.id))return {...def,x:s*shoulderHalfSeparation};
  return {...def};
 });
 return {...base,rigId:SAGITTAL_RIG_ID,segments,joints};
}
