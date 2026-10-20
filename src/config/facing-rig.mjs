import {RIG} from '../../rig-config.mjs';

/** A physical 2D facing reflection, not a cosmetic sprite flip.
 * Reflects each dynamic segment, revolute anchor, and signed joint limits.
 * Retains body mass, fixture friction and the same Planck solver.
 */
export function createFacingRig(base=RIG,facing=1){
 if(facing!==1&&facing!==-1)throw Error('Invalid facing orientation');
 if(!base?.segments||!base?.joints)throw Error('Invalid facing rig');
 if(facing===1)return {...base,facing:1};
 return {
  ...base,facing:-1,
  segments:base.segments.map(def=>({...def,x:-def.x})),
  joints:base.joints.map(def=>({...def,x:-def.x,lower:-def.upper,upper:-def.lower}))
 };
}
