import {RIG} from '../../rig-config.mjs';
/** Experimental bilateral knee limits: the canonical M2 rig is deliberately unchanged. */
export function createMirroredKneeRig(base=RIG){
 return {...base,joints:base.joints.map(j=>j.id==='kneeL'?{...j,lower:-.15,upper:1.65}:j)};
}
