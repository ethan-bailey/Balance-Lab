/** Balance Lab M1: identical physical geometry and mass properties for both solvers.
 * Coordinates in metres; y-up; angles radians; no positional pelvis anchoring.
 * Articulated standing humanoid with physical hands for engine selection, NOT final character rig.
 */
export const RIG = Object.freeze({
  gravity: -9.81,
  groundFriction: 0.95,
  segmentFriction: 0.85,
  linearDamping: 0.025,
  angularDamping: 0.09,
  handAngularDamping: 2,
  grip: Object.freeze({ stiffness: 950, damping: 75, maxForce: 380, handMaxForce: 160, proximalLoadShare: 0.15 }),
  motor: Object.freeze({kp: 140, kd: 12, maxTorque: 60, wristMaxTorque: 15, maxSpeed: 6, speedGainScale: 1/12, limitGuard: 0.55}),
  impulse: Object.freeze({maxMagnitude: 35}),
  segments: Object.freeze([
    {id:'torso', x:0, y:1.49, w:.34,h:.70,mass:12},
    {id:'thighL',x:-.13,y:.92,w:.16,h:.44,mass:3},
    {id:'shinL', x:-.13,y:.485,w:.13,h:.43,mass:2},
    {id:'footL', x:-.13,y:.205,w:.28,h:.12,mass:.8},
    {id:'thighR',x:.13,y:.92,w:.16,h:.44,mass:3},
    {id:'shinR', x:.13,y:.485,w:.13,h:.43,mass:2},
    {id:'footR', x:.13,y:.205,w:.28,h:.12,mass:.8},
    {id:'upperArmL',x:-.265,y:1.58,w:.12,h:.30,mass:1.2},
    {id:'forearmL', x:-.265,y:1.285,w:.105,h:.29,mass:.8},
    {id:'upperArmR',x:.265,y:1.58,w:.12,h:.30,mass:1.2},
    {id:'forearmR', x:.265,y:1.285,w:.105,h:.29,mass:.8},
    {id:'handL', x:-.265,y:1.057,w:.125,h:.175,mass:.24},
    {id:'handR', x:.265,y:1.057,w:.125,h:.175,mass:.24},
  ]),
  joints: Object.freeze([
    {id:'hipL',a:'torso',b:'thighL',x:-.13,y:1.14,lower:-.85,upper:.85},
    {id:'kneeL',a:'thighL',b:'shinL',x:-.13,y:.70,lower:-1.65,upper:.15},
    {id:'ankleL',a:'shinL',b:'footL',x:-.13,y:.27,lower:-.65,upper:.65},
    {id:'hipR',a:'torso',b:'thighR',x:.13,y:1.14,lower:-.85,upper:.85},
    {id:'kneeR',a:'thighR',b:'shinR',x:.13,y:.70,lower:-1.65,upper:.15},
    {id:'ankleR',a:'shinR',b:'footR',x:.13,y:.27,lower:-.65,upper:.65},
    {id:'shoulderL',a:'torso',b:'upperArmL',x:-.265,y:1.73,lower:-2.4,upper:2.4},
    {id:'elbowL',a:'upperArmL',b:'forearmL',x:-.265,y:1.43,lower:-2.5,upper:.25},
    {id:'shoulderR',a:'torso',b:'upperArmR',x:.265,y:1.73,lower:-2.4,upper:2.4},
    {id:'elbowR',a:'upperArmR',b:'forearmR',x:.265,y:1.43,lower:-2.5,upper:.25},
    {id:'wristL',a:'forearmL',b:'handL',x:-.265,y:1.145,lower:-.85,upper:.85},
    {id:'wristR',a:'forearmR',b:'handR',x:.265,y:1.145,lower:-.85,upper:.85},
  ]),
});
export function validateRig(rig=RIG){
  const ids=new Set();
  for(const s of rig.segments){
    if(ids.has(s.id)||![s.x,s.y,s.w,s.h,s.mass].every(Number.isFinite)||s.w<=0||s.h<=0||s.mass<=0)throw Error('Invalid segment '+s.id);
    ids.add(s.id);
  }
  for(const j of rig.joints){
    if(!ids.has(j.a)||!ids.has(j.b)||j.a===j.b||!Number.isFinite(j.x)||!Number.isFinite(j.y)||j.lower>j.upper)throw Error('Invalid joint '+j.id);
  }
  return true;
}
