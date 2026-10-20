import {jointMotorCommand} from '../src/physics/joint-motor.mjs';
import * as P from 'planck';
import {RIG} from '../rig-config.mjs';
export const FIXED_DT=1/120;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
const upstream={handL:'forearmL',handR:'forearmR',forearmL:'upperArmL',forearmR:'upperArmR',footL:'shinL',footR:'shinR',shinL:'thighL',shinR:'thighR',upperArmL:'torso',upperArmR:'torso',thighL:'torso',thighR:'torso'};
export function createRigWorld(config=RIG){
  if(!config?.segments?.length||!config?.joints?.length)throw Error('Invalid rig config');
  const world=new P.World(P.Vec2(0,config.gravity));
  const ground=world.createBody({position:P.Vec2(0,-.25)});
  ground.createFixture(P.Box(40,.25),{friction:config.groundFriction,filterCategoryBits:1,filterMaskBits:2});
  const parts=new Map(),links=[];
  for(const def of config.segments){
    if(parts.has(def.id)||!Number.isFinite(def.mass)||def.mass<=0||def.w<=0||def.h<=0)throw Error('Invalid segment '+def.id);
    const body=world.createDynamicBody({position:P.Vec2(def.x,def.y),linearDamping:config.linearDamping,angularDamping:def.id.startsWith('hand')?config.handAngularDamping:config.angularDamping});
    body.createFixture(P.Box(def.w/2,def.h/2),{density:def.mass/(def.w*def.h),friction:config.segmentFriction,filterCategoryBits:2,filterMaskBits:1});
    parts.set(def.id,{body,def});
  }
  for(const def of config.joints){
    const A=parts.get(def.a)?.body,B=parts.get(def.b)?.body;
    if(!A||!B||def.lower>def.upper)throw Error('Invalid joint '+def.id);
    const anchor=P.Vec2(def.x,def.y);
    const joint=world.createJoint(P.RevoluteJoint({enableLimit:true,lowerAngle:def.lower,upperAngle:def.upper,collideConnected:false},A,B,anchor));
    links.push({def,joint,A,B,localA:A.getLocalPoint(anchor),localB:B.getLocalPoint(anchor)});
  }
  let grip=null,steps=0,poseController=null;
  const metrics={maxAnchorErrorM:0,maxLimitViolationRad:0,maxMotorTorqueNm:0,nonfinite:0,steps:0,groundedSteps:0,grabSteps:0,clampedImpulses:0};
  function footContact(){
    for(let c=world.getContactList();c;c=c.getNext()){
      if(!c.isTouching())continue;
      const a=c.getFixtureA().getBody(),b=c.getFixtureB().getBody();
      if(a===ground&&(b===parts.get('footL')?.body||b===parts.get('footR')?.body))return true;
      if(b===ground&&(a===parts.get('footL')?.body||a===parts.get('footR')?.body))return true;
    }
    return false;
  }
  function step(count=1){
    if(!Number.isInteger(count)||count<0||count>100000)throw Error('Invalid step count');
    for(let i=0;i<count;i++){
      const grounded=footContact(),activation=grip?.15:grounded?.8:.12;
      if(grounded)metrics.groundedSteps++;
      for(const {def,joint,A,B} of links){
        const rel=joint.getJointAngle(),vel=B.getAngularVelocity()-A.getAngularVelocity();
        const commanded=poseController?.({id:def.id,angle:rel,angularVelocity:vel});
        if(commanded!==undefined&&(!commanded||![commanded.speed,commanded.maxTorque].every(Number.isFinite)||commanded.maxTorque<0))throw Error('Invalid pose motor command');
        const limit=jointMotorCommand({angle:rel,velocity:vel,lower:joint.getLowerLimit(),upper:joint.getUpperLimit(),kp:config.motor.kp,kd:config.motor.kd,speedGainScale:config.motor.speedGainScale,maxSpeed:config.motor.maxSpeed,limitGuard:config.motor.limitGuard,requestedSpeed:commanded?.speed});
        const desired=limit.speed,upper=limit.limitActive,lower=false;
        joint.enableMotor(true);joint.setMotorSpeed(desired);
        const normalLimit=(def.id.startsWith('wrist')?config.motor.wristMaxTorque:config.motor.maxTorque)*(upper||lower?1:activation);
        joint.setMaxMotorTorque(commanded===undefined?normalLimit:Math.min(normalLimit,commanded.maxTorque));
      }
      let highMotion=false;
      for(const {body} of parts.values())if(Math.abs(body.getAngularVelocity())>12||body.getLinearVelocity().length()>2.5){highMotion=true;break;}
      const substeps=grip?12:highMotion?4:2;
      for(let sub=0;sub<substeps;sub++){
        if(grip){
          metrics.grabSteps++;
          const {body}=parts.get(grip.id),p=body.getWorldPoint(grip.local),v=body.getLinearVelocityFromWorldPoint(p);
          let fx=config.grip.stiffness*(grip.target.x-p.x)-config.grip.damping*v.x;
          let fy=config.grip.stiffness*(grip.target.y-p.y)-config.grip.damping*v.y;
          const f=Math.hypot(fx,fy),cap=grip.id.startsWith('hand')?config.grip.handMaxForce:config.grip.maxForce;
          if(f>cap){fx*=cap/f;fy*=cap/f;}
          const parent=upstream[grip.id],share=parent?config.grip.proximalLoadShare:0;
          body.applyForce(P.Vec2(fx*(1-share),fy*(1-share)),p,true);
          if(parent)parts.get(parent).body.applyForceToCenter(P.Vec2(fx*share,fy*share),true);
        }
        world.step(FIXED_DT/substeps,24,12);
      }
      for(const {def,joint,A,B,localA,localB} of links){
        const a=A.getWorldPoint(localA),b=B.getWorldPoint(localB);
        metrics.maxAnchorErrorM=Math.max(metrics.maxAnchorErrorM,Math.hypot(a.x-b.x,a.y-b.y));
        const angle=joint.getJointAngle();
        metrics.maxLimitViolationRad=Math.max(metrics.maxLimitViolationRad,Math.max(0,def.lower-angle,angle-def.upper));
        metrics.maxMotorTorqueNm=Math.max(metrics.maxMotorTorqueNm,Math.abs(joint.getMotorTorque(substeps/FIXED_DT)));
      }
      for(const {body} of parts.values()){
        const p=body.getPosition(),v=body.getLinearVelocity();
        if(![p.x,p.y,body.getAngle(),v.x,v.y,body.getAngularVelocity()].every(Number.isFinite))metrics.nonfinite++;
      }
      steps++;metrics.steps=steps;
    }
    return snapshot();
  }
  function setPoseController(controller){if(controller!==null&&typeof controller!=='function')throw Error('Invalid pose controller');poseController=controller;}
  function snapshot(){
    const bodies={};for(const [id,{body}] of parts){const p=body.getPosition(),v=body.getLinearVelocity();bodies[id]={x:p.x,y:p.y,a:body.getAngle(),vx:v.x,vy:v.y,w:body.getAngularVelocity()};}
    return {bodies,grounded:footContact(),steps,metrics:{...metrics}};
  }
  function grab(id,target,point){
    if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.y))throw Error('Invalid grab target');
    const part=parts.get(id);if(!part)throw Error('Unknown grab body '+id);
    const p=point||part.body.getPosition();
    if(!Number.isFinite(p.x)||!Number.isFinite(p.y))throw Error('Invalid grab point');
    grip={id,local:part.body.getLocalPoint(P.Vec2(p.x,p.y)),target:P.Vec2(target.x,target.y)};
  }
  function moveGrab(target){if(!target||!Number.isFinite(target.x)||!Number.isFinite(target.y))throw Error('Invalid grab target');if(!grip)throw Error('No active grip');grip.target=P.Vec2(target.x,target.y);}
  function release(){grip=null;}
  function impulse(id,vector){
    const part=parts.get(id);if(!part)throw Error('Unknown impulse body '+id);
    if(!vector||!Number.isFinite(vector.x)||!Number.isFinite(vector.y))throw Error('Invalid impulse');
    let x=vector.x,y=vector.y;const m=Math.hypot(x,y),max=Math.min(config.impulse.maxMagnitude,part.def.mass*12);
    if(m>max){x*=max/m;y*=max/m;metrics.clampedImpulses++;}
    part.body.applyLinearImpulse(P.Vec2(x,y),part.body.getWorldCenter(),true);
  }
  return {world,ground,parts,links,step,snapshot,footContact,grab,moveGrab,release,impulse,setPoseController,metrics};
}
