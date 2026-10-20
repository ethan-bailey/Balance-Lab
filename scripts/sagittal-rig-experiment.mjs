/** Sandbox-only parameter search for opt-in anatomical sagittal rig. */
import {RIG} from '../rig-config.mjs';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
const num=(n,d)=>{const a=process.argv.find(x=>x.startsWith('--'+n+'='));return a?Number(a.split('=')[1]):d;};
const leg=num('leg',.055),arm=num('arm',.09),foot=num('foot',.22),hipMotor=num('kp',140),kneeMotor=num('kd',12),torsoY=num('torsoY',1.49),torsoW=num('torsoW',.34),ankle=num('ankle',1.8),hip=num('hip',.6),torque=num('torque',42),floor=num('floor',42);
const segments=RIG.segments.map(def=>{
 const s=def.id.endsWith('L')?-1:1;
 if(def.id==='torso')return {...def,y:torsoY,w:torsoW};
 if(/^(thigh|shin|foot)/.test(def.id))return {...def,x:s*leg,w:def.id.startsWith('foot')?foot:def.w};
 if(/^(upperArm|forearm|hand)/.test(def.id))return {...def,x:s*arm};
 return def;
});
const joints=RIG.joints.map(def=>{
 const s=def.id.endsWith('L')?-1:1;
 if(/^(hip|knee|ankle)/.test(def.id))return {...def,x:s*leg};
 if(/^(shoulder|elbow|wrist)/.test(def.id))return {...def,x:s*arm};
 return def;
});
const config={...RIG,motor:{...RIG.motor,kp:hipMotor,kd:kneeMotor},segments,joints};
const out=[];
for(const facing of [1,-1]){
 const w=createActiveRigWorld(createFacingRig(config,facing));w.enableRecoverySteps();w.enableBalanceReflex({ankleGain:ankle,hipGain:hip,smoothingSeconds:.01,reflexTorque:torque,reflexTorqueFloor:floor});
 let falls=0,minY=10,steps=0,contact=0,drift=0;
 const x0=w.rig.parts.get('torso').body.getPosition().x;
 for(let i=0;i<1200;i++){if(i===180&&num('push',0))w.impulse('torso',{x:num('push',0)*facing,y:0});w.step();const b=w.rig.parts.get('torso').body;minY=Math.min(minY,b.getPosition().y);if(['fallen','tumbling'].includes(w.getState().mode))falls++;steps+=w.getStepDiagnostics().attempts>0?1:0;contact+=w.getSupport().contactCount===2?1:0;}
 drift=Math.abs(w.rig.parts.get('torso').body.getPosition().x-x0);
 out.push({facing,falls,minY,drift,contactRatio:contact/1200,step:w.getStepDiagnostics()});w.dispose();
}
console.log(JSON.stringify({leg,arm,foot,hipMotor,kneeMotor,torsoY,torsoW,ankle,hip,torque,floor,push:num('push',0),out}));
