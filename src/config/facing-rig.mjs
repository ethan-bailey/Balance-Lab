import {RIG} from '../../rig-config.mjs';

/** A physical 2D facing reflection, not a cosmetic sprite flip.
 * Reflects each dynamic segment, revolute anchor, and signed joint limits.
 * Retains body mass, fixture friction and the same Planck solver.
 */
export function createFacingRig(base=RIG,facing=1){
 if(facing!==1&&facing!==-1)throw Error('Invalid facing orientation');
 if(!base?.segments||!base?.joints)throw Error('Invalid facing rig');
 if(facing===1)return {...base,facing:1};
 const reflectedJoints=base.joints.map(def=>({...def,x:-def.x,lower:-def.upper,upper:-def.lower}));
 // Planck's iterative constraint solver is order-sensitive: after reflection,
 // process the leg/arm chains on the *physical* left side first (anatomical R).
 // Keep each chain's original proximal-to-distal order. Reversing coordinates
 // and limits without also reflecting solver traversal created asymmetric
 // support impulses and reproducible mirrored recovery falls.
 const physicalSide=def=>def.id.endsWith('R')?0:def.id.endsWith('L')?1:-1;
 return {
  ...base,facing:-1,
  segments:base.segments.map(def=>({...def,x:-def.x})),
  joints:reflectedJoints.sort((a,b)=>physicalSide(a)-physicalSide(b))
 };
}
