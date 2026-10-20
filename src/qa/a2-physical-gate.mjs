/** Shared deterministic A2 contact acceptance, identical Node and browser source.
 * The Planck world remains authoritative; contacts are read from the solver.
 */
import {createActiveRigWorld} from '../../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../config/facing-rig.mjs';
import {createPoseClip} from '../animation/pose-sampler.mjs';
import {estimateSupport} from '../physics/support-estimator.mjs';


export function runA2PhysicalGate(facing=1){
 if(facing!==1&&facing!==-1)throw Error('Invalid facing');
const clip=createPoseClip([
 {time:0,pose:{shoulderL:.2*facing,shoulderR:-.2*facing}},
 {time:3,pose:{shoulderL:.2*facing,shoulderR:-.2*facing}}
]);
const cases=[];
for(const impulse of [-10,-8,8,10]){
 const r=createActiveRigWorld(createFacingRig(undefined,facing));
 r.enableRecoverySteps();
 r.setPoseClip(clip);
 r.step(120);
 const footId=impulse*facing<0?'footR':'footL';
 const startX=r.snapshot().bodies[footId].x;
 const initialContact=estimateSupport(r.rig.world,r.rig.ground,r.rig.parts).feet.includes(footId);
 let wasGrounded=initialContact,lifted=false,touchdownFrame=-1,firstLiftFrame=-1,maxDisplacement=0;
 let minTorsoYAfter1Sec=Infinity,maxAngleAfter1Sec=0,minFootSupportAfter1Sec=Infinity;
 r.impulse('torso',{x:impulse,y:0});
 for(let i=0;i<600;i++){
  r.step(1);
  const s=r.snapshot(),physicalSupport=estimateSupport(r.rig.world,r.rig.ground,r.rig.parts);
  const grounded=physicalSupport.feet.includes(footId);
  const shift=Math.sign(impulse)*(s.bodies[footId].x-startX);
  maxDisplacement=Math.max(maxDisplacement,shift);
  if(wasGrounded&&!grounded){lifted=true;if(firstLiftFrame<0)firstLiftFrame=i;}
  if(lifted&&!wasGrounded&&grounded&&shift>.06&&touchdownFrame<0)touchdownFrame=i;
  wasGrounded=grounded;
  if(i>=120){
   minTorsoYAfter1Sec=Math.min(minTorsoYAfter1Sec,s.bodies.torso.y);
   maxAngleAfter1Sec=Math.max(maxAngleAfter1Sec,Math.abs(s.bodies.torso.a));
   minFootSupportAfter1Sec=Math.min(minFootSupportAfter1Sec,physicalSupport.contactCount);
  }
 }
 const snapshot=r.snapshot(),d=r.getStepDiagnostics(),state=r.getState();
 const standing=state.mode==='standing'&&snapshot.bodies.torso.y>1.15;
 const physicalStep=initialContact&&lifted&&touchdownFrame>=0&&
    maxDisplacement>.06&&d.landings>=1&&d.completed>=1;
 const sustained=touchdownFrame>=0&&touchdownFrame<120&&
    minTorsoYAfter1Sec>1.15&&maxAngleAfter1Sec<.35&&minFootSupportAfter1Sec>0;
 const numericallyBounded=snapshot.metrics.nonfinite===0&&
    snapshot.metrics.maxAnchorErrorM<.045&&snapshot.metrics.maxLimitViolationRad<.32;
 const pass=physicalStep&&sustained&&standing&&numericallyBounded&&d.failures===0;
 cases.push({
  impulse,pass,standing,physicalStep,sustained,numericallyBounded,
  swingFoot:footId,firstLiftFrame,touchdownFrame,
  maxDisplacementM:maxDisplacement,minTorsoYAfter1Sec,maxAngleAfter1Sec,
  minFootSupportAfter1Sec,attempts:d.attempts,lifts:d.lifts,
  landings:d.landings,completed:d.completed,failures:d.failures,
  torsoY:snapshot.bodies.torso.y,mode:state.mode,
 });
 r.dispose();
}
const result={schema:'A2-bilateral-contact-T06-v2',engine:'planck@1.5.1',
 fixedHz:120,physicsStepsPerScenario:720,facing,
 browserAndDeviceAcceptance:'PENDING',pass:cases.every(c=>c.pass),cases};
 return result;
}
