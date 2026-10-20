import {jointMotorCommand} from './joint-motor.mjs';
import * as P from '/vendor/planck.mjs';
import {RIG} from './rig-config.mjs';
import {RIG_TOPOLOGY} from './rig-topology.mjs';
import {supportGeometry} from './support-geometry.mjs';
import {VISUAL_RIG,CHARACTER_ID,drawCharacterSegment,drawCharacterHead,drawingOrder,validateVisualRig} from './m2-visual-rig.mjs';
validateVisualRig();
const DT=1/120, SUBSTEPS=2, MAX_IMPULSE=35, GRAVITY=-9.81, FLOOR=.86, CAP=4;
// Physical definitions are compiled from the same canonical RIG as the Node adapter.
const defs=RIG.segments.map(({id,x,y,w,h,mass})=>[id,x,y,w,h,mass]);
const hinges=RIG.joints.map(({id,a,b,x,y,lower,upper})=>[id,a,b,x,y,lower,upper]);
if(RIG_TOPOLOGY.order.length!==defs.length||RIG_TOPOLOGY.joints.size!==hinges.length)throw Error('Rig topology mismatch');
const canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d',{alpha:false});
const status=document.querySelector('#status'),info=document.querySelector('#info');
let width=1,height=1,dpr=1,scale=1,world,ground,parts={},links=[],grab=null,prev={},curr={};
let steps=0,skips=0,frames=[],last=null,acc=0,stamp=0;
const startedAt=performance.now();
let frameWork=[],physicsWork=[],drawWork=[],physicsCalls=0,rafCount=0,slowFrames=0;
let touchLatency=[],pendingTouchAt=null,firstInteractiveAt=null,acceptedTouches=0,visibilityInterruptions=0;
let minuteStartedAt=performance.now(),minuteIntervals=[],minuteWork=[],minuteSummaries=[];
const recent=(arr,value)=>{if(Number.isFinite(value)){arr.push(value);if(arr.length>360)arr.shift();}};
const percentile=(arr,q)=>{if(!arr.length)return null;const a=[...arr].sort((x,y)=>x-y);return a[Math.floor((a.length-1)*q)];};
function profileSnapshot(){
 return {
  frameMedianMs:percentile(frames,.5),frameP95Ms:percentile(frames,.95),
  frameIntervalBuckets:{under20:frames.filter(x=>x<20).length,from20to40:frames.filter(x=>x>=20&&x<40).length,over40:frames.filter(x=>x>=40).length},
  frameWorkP95Ms:percentile(frameWork,.95),physicsWorkP95Ms:percentile(physicsWork,.95),
  drawWorkP95Ms:percentile(drawWork,.95),touchResponseP95Ms:percentile(touchLatency,.95),
  rafCount,physicsCalls,slowFrames,acceptedTouches,visibilityInterruptions,catchupCaps:skips,minuteSummaries:[...minuteSummaries],uptimeSec:+((performance.now()-startedAt)/1000).toFixed(1),
  bootToInteractiveMs:firstInteractiveAt===null?null:+(firstInteractiveAt-startedAt).toFixed(1),
  quality:{dpr,canvasPixels:canvas.width*canvas.height},
  note:'Frame intervals include browser scheduling; work timings measure JavaScript only, not compositor/GPU. Touch-to-draw is not presentation latency.'
 };
}
let stability={maxJointErrorM:0,maxLimitViolationRad:0,maxMotorTorqueNm:0,clampedImpulses:0,groundedSteps:0,adaptiveThreeSubstepFrames:0,adaptiveFourSubstepFrames:0,handEightSubstepFrames:0,grabEightSubstepFrames:0};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const angleWrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function resize(){
 const r=canvas.getBoundingClientRect();width=r.width;height=r.height;
 dpr=Math.min(window.devicePixelRatio||1,2);
 canvas.width=Math.max(1,Math.round(width*dpr));canvas.height=Math.max(1,Math.round(height*dpr));
 scale=Math.min(width/2.8,height/2.6);
}
new ResizeObserver(resize).observe(canvas);resize();
const worldPoint=(x,y)=>({x:(x-width*.5)/scale,y:(height*FLOOR-y)/scale});
const screenPoint=(x,y)=>({x:width*.5+x*scale,y:height*FLOOR-y*scale});
function reset(){
 world=new P.World(P.Vec2(0,GRAVITY));
 ground=world.createBody({position:P.Vec2(0,-.25)});
 ground.createFixture(P.Box(40,.25),{friction:.95,filterCategoryBits:1,filterMaskBits:2});
 parts={};links=[];grab=null;
 for(const [id,x,y,w,h,mass] of defs){
  const b=world.createDynamicBody({position:P.Vec2(x,y),linearDamping:.025,angularDamping:id.startsWith("hand")?2:.09});
  b.createFixture(P.Box(w/2,h/2),{density:mass/(w*h),friction:.85,filterCategoryBits:2,filterMaskBits:1});
  parts[id]={body:b,w,h};
 }
 for(const [id,a,b,x,y,lo,hi] of hinges){
  const joint=world.createJoint(P.RevoluteJoint({enableLimit:true,lowerAngle:lo,upperAngle:hi,collideConnected:false},parts[a].body,parts[b].body,P.Vec2(x,y)));
  links.push({id,a,b,joint,lo,hi,localA:P.Vec2(x-parts[a].body.getPosition().x,y-parts[a].body.getPosition().y),localB:P.Vec2(x-parts[b].body.getPosition().x,y-parts[b].body.getPosition().y)});
 }
 prev=curr=snapshot();steps=skips=0;last=null;acc=0;frames=[];
 frameWork=[];physicsWork=[];drawWork=[];physicsCalls=rafCount=slowFrames=0;touchLatency=[];pendingTouchAt=null;acceptedTouches=0;
 minuteStartedAt=performance.now();minuteIntervals=[];minuteWork=[];minuteSummaries=[];
 stability={maxJointErrorM:0,maxLimitViolationRad:0,maxMotorTorqueNm:0,clampedImpulses:0,groundedSteps:0,adaptiveThreeSubstepFrames:0,adaptiveFourSubstepFrames:0,handEightSubstepFrames:0,grabEightSubstepFrames:0};
}
function snapshot(){
 const out={};
 for(const [id,{body}] of Object.entries(parts)){
  const p=body.getPosition();out[id]={x:p.x,y:p.y,a:body.getAngle()};
 }
 return out;
}
function footTouch(){
 for(let c=world.getContactList();c;c=c.getNext()){
  if(!c.isTouching())continue;
  const a=c.getFixtureA().getBody(),b=c.getFixtureB().getBody();
  if(a===ground && (b===parts.footL.body||b===parts.footR.body))return true;
  if(b===ground && (a===parts.footL.body||a===parts.footR.body))return true;
 }
 return false;
}
// Joint motors impose a bounded relative velocity through the solver, not huge
// unconstrained torques on very light feet. Forces are re-applied each substep.
function simulate(){
 const grounded=footTouch(),activation=grab?.15:grounded?.8:.12;
 if(grounded)stability.groundedSteps++;
 for(const {id,a,b,joint} of links){
  const A=parts[a].body,B=parts[b].body;
  const rel=joint.getJointAngle(),vel=B.getAngularVelocity()-A.getAngularVelocity();
  const limit=jointMotorCommand({angle:rel,velocity:vel,lower:joint.getLowerLimit(),upper:joint.getUpperLimit(),kp:140,kd:12,speedGainScale:1/12,maxSpeed:6,limitGuard:.55,limitCorrectionSpeed:6});
  const desired=limit.speed,upper=limit.limitActive,lower=false;
  joint.enableMotor(true);joint.setMotorSpeed(desired);
  // Preserve 15 Nm nominal wrist ceiling; a hard joint stop alone may use
  // 45 Nm of opposing torque, below the global 60 Nm safety ceiling.
  joint.setMaxMotorTorque((id.startsWith('wrist')?(upper||lower?45:15):60)*(upper||lower?1:activation));
 }
 let highMotion=false;
 for(const {body} of Object.values(parts)){
  if(Math.abs(body.getAngularVelocity())>12||body.getLinearVelocity().length()>2.5){highMotion=true;break;}
 }
 const substeps=grab?8:highMotion?4:2;
 if(substeps===4)stability.adaptiveFourSubstepFrames++;
 if(substeps===8){stability.grabEightSubstepFrames++;if(grab.id.startsWith('hand'))stability.handEightSubstepFrames++;}
 for(let sub=0;sub<substeps;sub++){
  if(grab){
   const b=parts[grab.id].body;
   const p=b.getWorldPoint(P.Vec2(grab.local.x,grab.local.y));
   const v=b.getLinearVelocityFromWorldPoint(p);
   let fx=950*(grab.target.x-p.x)-75*v.x,fy=950*(grab.target.y-p.y)-75*v.y;
   const f=Math.hypot(fx,fy);
   const cap=grab.id.startsWith('hand')?160:380;
   if(f>cap){fx*=cap/f;fy*=cap/f;}
   const upstream={handL:'forearmL',handR:'forearmR',forearmL:'upperArmL',forearmR:'upperArmR',footL:'shinL',footR:'shinR',shinL:'thighL',shinR:'thighR',upperArmL:'torso',upperArmR:'torso',thighL:'torso',thighR:'torso'}[grab.id];
   // Transfer 15% of the bounded grip force into the parent segment at its COM.
   // This reduces leverage on a tiny distal joint while preserving total pull force.
   const direct=upstream?0.85:1;
   b.applyForce(P.Vec2(fx*direct,fy*direct),p,true);
   if(upstream)parts[upstream].body.applyForceToCenter(P.Vec2(fx*(1-direct),fy*(1-direct)),true);
  }
  world.step(DT/substeps,24,12);
 }
 for(const link of links){
  const A=parts[link.a].body.getWorldPoint(link.localA),B=parts[link.b].body.getWorldPoint(link.localB);
  const anchorError=Math.hypot(A.x-B.x,A.y-B.y);
  if(anchorError>stability.maxJointErrorM){stability.maxJointErrorM=anchorError;stability.worstAnchorJoint=link.id;}
  const angle=link.joint.getJointAngle();
  const over=Math.max(0,link.lo-angle,angle-link.hi);
  if(over>stability.maxLimitViolationRad){stability.maxLimitViolationRad=over;stability.worstLimitJoint=link.id;}
  stability.maxMotorTorqueNm=Math.max(stability.maxMotorTorqueNm,Math.abs(link.joint.getMotorTorque(substeps/DT)));
 }
 steps++;
}
function pick(p){
 let nearest=null,score=Infinity;
 for(const [id,{body,w,h}] of Object.entries(parts)){
  const v=body.getLocalPoint(P.Vec2(p.x,p.y));
  const d=Math.hypot(Math.max(0,Math.abs(v.x)-w*.5),Math.max(0,Math.abs(v.y)-h*.5));
  const rank=d-(id.startsWith('hand')?.015:0);
  if(rank<score){score=rank;nearest=id;}
 }
 return score<=.22?nearest:null;
}
function position(e){const r=canvas.getBoundingClientRect();return worldPoint(e.clientX-r.left,e.clientY-r.top);}
canvas.addEventListener('pointerdown',e=>{
 if(grab)return;
 const p=position(e),id=pick(p);if(!id)return;
 e.preventDefault();canvas.setPointerCapture(e.pointerId);
 const local=parts[id].body.getLocalPoint(P.Vec2(p.x,p.y));
 grab={pointer:e.pointerId,id,local:{x:local.x,y:local.y},target:p};pendingTouchAt=performance.now();acceptedTouches++;
});
canvas.addEventListener('pointermove',e=>{
 if(!grab||grab.pointer!==e.pointerId)return;
 e.preventDefault();grab.target=position(e);pendingTouchAt=performance.now();
});
function release(e){if(grab&&grab.pointer===e.pointerId)grab=null;}
for(const t of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(t,release);
function roundRect(x,y,w,h,r){
 r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);
 ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
 ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
 ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
 ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();
}
function interpolate(id,alpha){
 const a=prev[id]||curr[id],b=curr[id];
 const da=angleWrap(b.a-a.a);
 return {x:a.x+(b.x-a.x)*alpha,y:a.y+(b.y-a.y)*alpha,a:a.a+da*alpha};
}
function draw(alpha){
 ctx.setTransform(dpr,0,0,dpr,0,0);
 ctx.fillStyle='#0c1622';ctx.fillRect(0,0,width,height);
 const y=height*FLOOR;
 ctx.fillStyle='#233745';ctx.fillRect(0,y,width,height-y);
 ctx.strokeStyle='#496477';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke();
 // Pure visual pass: render original Kite art in the rigid body's local frame.
 // Visual elements do not mutate physics or change the user's grab hitboxes.
 for(const id of drawingOrder()){
  const {w,h}=parts[id],q=interpolate(id,alpha),p=screenPoint(q.x,q.y);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-q.a);
  drawCharacterSegment(ctx,id,w,h,scale);
  ctx.restore();
 }
 const torso=interpolate('torso',alpha),neck=screenPoint(torso.x,torso.y);
 ctx.save();ctx.translate(neck.x,neck.y);ctx.rotate(-torso.a);
 drawCharacterHead(ctx,scale,{blink:false});ctx.restore();
 if(grab){
  const p=screenPoint(grab.target.x,grab.target.y);
  ctx.strokeStyle='#f5d893';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,14,0,Math.PI*2);ctx.stroke();
 }
}
function frame(now){
 const workStart=performance.now();
 if(last===null)last=now;
 const ms=now-last;last=now;
 if(ms>0&&ms<250){recent(frames,ms);minuteIntervals.push(ms);if(ms>25)slowFrames++;}
 acc+=Math.min(.1,Math.max(0,ms/1000));
 let n=0;const simStart=performance.now();
 while(acc>=DT&&n<CAP){prev=curr;simulate();curr=snapshot();acc-=DT;n++;physicsCalls++;}
 if(acc>=DT){skips++;acc%=DT;}
 recent(physicsWork,performance.now()-simStart);
 const drawStart=performance.now();
 draw(acc/DT);
 recent(drawWork,performance.now()-drawStart);
 if(pendingTouchAt!==null){
  recent(touchLatency,performance.now()-pendingTouchAt);pendingTouchAt=null;
 }
 if(firstInteractiveAt===null)firstInteractiveAt=performance.now();
 if(now-stamp>550){
  stamp=now;
  const p95=percentile(frames,.95)||0;
  const cpu=percentile(frameWork,.95)||0;
  status.textContent='Kite · Planck 1.5.1 · p95 '+p95.toFixed(1)+' ms · work '+cpu.toFixed(1)+' ms';
  info.textContent=(grab?'GRABBED':'RAGDOLL')+' · joints '+(stability.maxJointErrorM*100).toFixed(1)+' cm · limit '+stability.maxLimitViolationRad.toFixed(2)+' rad';
 }
 recent(frameWork,performance.now()-workStart);
 rafCount++;
 requestAnimationFrame(frame);
}
document.querySelector('#reset').onclick=reset;
document.querySelector('#drop').onclick=()=>{
 grab=null;
 for(const {body} of Object.values(parts)){const p=body.getPosition();body.setPosition(P.Vec2(p.x,p.y+.75));body.setLinearVelocity(P.Vec2(0,0));body.setAngularVelocity(0);}
 prev=curr=snapshot();
};
function supportSample(){
 const mass=RIG.segments.reduce((n,s)=>n+s.mass,0);
 const comX=RIG.segments.reduce((n,s)=>n+s.mass*parts[s.id].body.getPosition().x,0)/mass;
 const comVx=RIG.segments.reduce((n,s)=>n+s.mass*parts[s.id].body.getLinearVelocity().x,0)/mass;
 const footContact=id=>{
  const body=parts[id].body;
  for(let c=world.getContactList();c;c=c.getNext()){
   if(!c.isTouching())continue;
   const a=c.getFixtureA().getBody(),b=c.getFixtureB().getBody();
   if((a===ground&&b===body)||(b===ground&&a===body))return true;
  }
  return false;
 };
 return supportGeometry(['footL','footR'].map(id=>{
  const b=parts[id].body,p=b.getPosition();
  return {id,x:p.x,y:p.y,angle:b.getAngle(),contact:footContact(id)};
 }),{comX,comVx});
}
function applyCappedImpulse(x,y){
 const m=Math.hypot(x,y),k=m>MAX_IMPULSE?MAX_IMPULSE/m:1;
 if(k<1)stability.clampedImpulses++;
 parts.torso.body.applyLinearImpulse(P.Vec2(x*k,y*k),parts.torso.body.getWorldCenter(),true);
}
document.querySelector('#push').onclick=()=>applyCappedImpulse(45,18);
document.querySelector('#qa').onclick=async()=>{
 const a=frames.slice().sort((x,y)=>x-y);
 const q={engine:'planck@1.5.1',stabilityRevision:'m2-guard55-wrist-brake45-v1',m2Revision:'m2-kite-canonical-visual-v1',characterId:CHARACTER_ID,artApproval:'provisional',support:supportSample(),selfCollision:'disabled-pending-isolated-acceptance',experimental:true,steps,physicsSubsteps:'adaptive-2-to-4-grab-8',catchupCaps:skips,gripForceCapsN:{hand:160,other:380},stability:{...stability},...profileSnapshot(),screen:[innerWidth,innerHeight],userAgent:navigator.userAgent,at:new Date().toISOString()};
 try{await navigator.clipboard.writeText(JSON.stringify(q,null,2));info.textContent='QA copied';}catch{info.textContent='Clipboard unavailable';}
};
document.addEventListener('visibilitychange',()=>{last=null;acc=0;if(document.hidden)visibilityInterruptions++;});
// Explicit test-only deterministic hooks; no animation clock during rig QA.
window.__balancePerf=profileSnapshot;
const qaMode=new URLSearchParams(location.search).has('rigqa');
if(qaMode){
 window.__balanceRigQA={
  reset,
  step(n){if(!Number.isInteger(n)||n<0||n>7200)throw Error('Invalid QA step count');for(let i=0;i<n;i++)simulate();prev=curr=snapshot();},
  event(e){
   if(e.type==='grab'){
    const id=e.part==='wrist'?'handL':e.part==='ankle'?'footL':e.part;
    if(!parts[id])throw Error('Unknown part');
    grab={pointer:-1,id,local:{x:0,y:0},target:{x:e.x,y:e.y}};
   }else if(e.type==='move'&&grab)grab.target={x:e.x,y:e.y};
   else if(e.type==='release')grab=null;
   else if(e.type==='drop'){
    for(const {body} of Object.values(parts)){
     const p=body.getPosition();body.setPosition(P.Vec2(p.x,p.y+e.height));
     body.setLinearVelocity(P.Vec2(0,0));body.setAngularVelocity(0);
    }
   }else if(e.type==='impulse')applyCappedImpulse(e.x,e.y);
  },
  sample(){return {support:supportSample(),characterId:CHARACTER_ID,steps,stability:{...stability},feetContact:footTouch(),bodies:snapshot(),rig:{bodies:defs.length,joints:hinges.length}};},
  pickAt(x,y){return pick({x,y});},
  render(){draw(1);},profile:profileSnapshot
 };
}
reset();if(!qaMode)requestAnimationFrame(frame);

