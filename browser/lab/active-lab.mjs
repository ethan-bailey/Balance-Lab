/** Opt-in A2 playable browser candidate: exact active Node Planck rig.
 * All visible segment poses come from the authoritative Planck world.
 * Reuses approved M2 Kite art and A5 finite-grip pointer lifecycle.
 */
import {createActiveRigWorld} from '/adapters/active-planck-v6.mjs';
import {createSideProfileGesture,GESTURES} from '/src/animation/side-profile-gesture.mjs';
import {createFacingRig} from '/src/config/facing-rig.mjs';
import {createRigGripBinding} from '/src/input/rig-grip-binding.mjs';
import {attachCanvasPointerInput} from '/src/input/canvas-pointer.mjs';
import {drawSideViewSegment,drawSideViewHead,sideViewDrawingOrder,validateSideViewRig} from './side-view-character.mjs';
validateSideViewRig();
const DT=1/120,CAP=4,FLOOR=.86,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d',{alpha:false});
const status=document.querySelector('#status'),info=document.querySelector('#info');
const facing=new URLSearchParams(location.search).get('facing')==='-1'?-1:1;
const manualQA=new URLSearchParams(location.search).get('rigqa')==='1';
let width=1,height=1,dpr=1,scale=1,active=null,detach=null,tracker=null,prev={},curr={};
let last=null,acc=0,catchupCaps=0,physicsCalls=0,drawCalls=0,rafId=0,acceptedTouches=0;
let gesture='rest',balanceAssist=false,balanceProfile='strong';
const BALANCE_PROFILES=Object.freeze({
 strong:Object.freeze({ankleGain:1.8,hipGain:.6,smoothingSeconds:.01}),
 smooth:Object.freeze({ankleGain:1.8,hipGain:.6,smoothingSeconds:.01,reflexTorque:42,reflexTorqueFloor:28,deadband:.005}),
});
const intervals=[],work=[],physicsTimes=[];
const started=performance.now();
const percentile=(values,p)=>{if(!values.length)return 0;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.min(sorted.length-1,Math.floor(p*(sorted.length-1)))];};
const recent=(list,v)=>{list.push(v);if(list.length>240)list.shift();};
function resize(){const r=canvas.getBoundingClientRect();width=Math.max(1,r.width);height=Math.max(1,r.height);
 dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
 scale=Math.min(width/2.8,height/2.6);}
new ResizeObserver(resize).observe(canvas);resize();
const toWorld=(clientX,clientY)=>{const r=canvas.getBoundingClientRect();return {x:(clientX-r.left-width*.5)/scale,y:(height*FLOOR-(clientY-r.top))/scale};};
const screen=(x,y)=>({x:width*.5+x*scale,y:height*FLOOR-y*scale});
const angleWrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function snapshot(){return active.snapshot().bodies;}
function reset(){
 if(detach){detach();detach=null;}
 if(active)active.dispose();
 active=createActiveRigWorld(createFacingRig(undefined,facing));
 active.enableRecoverySteps();
 // Experimental whole-body balance mode can be compared with the
 // verified steps-only baseline. Both use bounded physical joint motors.
 if(balanceAssist)active.enableBalanceReflex(BALANCE_PROFILES[balanceProfile]);
 active.setPoseClip(createSideProfileGesture(gesture,{facing}),{fadeSeconds:.4});
 const gripBridge={parts:active.rig.parts,grab:(id,target,point)=>active.grab(id,target,point),
  moveGrab:p=>active.rig.moveGrab(p),release:()=>active.release(),impulse:(id,imp)=>active.impulse(id,imp)};
 tracker=createRigGripBinding({rig:gripBridge,toWorld,maxSpeed:12,flickGain:0});
 detach=attachCanvasPointerInput(canvas,tracker);
 prev=snapshot();curr=prev;acc=0;last=null;
 draw(1);
}
function step(n=1){prev=curr;active.step(n);curr=snapshot();physicsCalls+=n;return active.snapshot();}
function pose(id,alpha){const b=curr[id],a=prev[id]??b;if(!a||!b)throw Error('Unknown body '+id);
 return {x:a.x+(b.x-a.x)*alpha,y:a.y+(b.y-a.y)*alpha,a:a.a+angleWrap(b.a-a.a)*alpha};}
function draw(alpha){
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#0c1622';ctx.fillRect(0,0,width,height);
 const floorY=height*FLOOR;ctx.fillStyle='#233745';ctx.fillRect(0,floorY,width,height-floorY);
 ctx.strokeStyle='#496477';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,floorY);ctx.lineTo(width,floorY);ctx.stroke();
 for(const id of sideViewDrawingOrder(facing)){
  const def=active.rig.parts.get(id)?.def;if(!def)throw Error('Missing visual segment '+id);
  const q=pose(id,alpha),p=screen(q.x,q.y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-q.a);
  drawSideViewSegment(ctx,id,def.w,def.h,scale,facing);ctx.restore();
 }
 const torso=pose('torso',alpha),neck=screen(torso.x,torso.y);
 ctx.save();ctx.translate(neck.x,neck.y);ctx.rotate(-torso.a);drawSideViewHead(ctx,scale,facing);ctx.restore();
 drawCalls++;
}
function perf(){return {uptimeSeconds:(performance.now()-started)/1000,frameP95Ms:percentile(intervals,.95),
 workP95Ms:percentile(work,.95),physicsP95Ms:percentile(physicsTimes,.95),physicsCalls,drawCalls,
 catchupCaps,acceptedTouches:tracker?.metrics?.starts??0,cancelledTouches:tracker?.metrics?.cancels??0,
 dpr,canvasPixels:canvas.width*canvas.height};}
function frame(now){const begin=performance.now();if(last===null)last=now;
 const elapsed=Math.max(0,Math.min(.1,(now-last)/1000));last=now;
 if(elapsed>0)recent(intervals,elapsed*1000);acc+=elapsed;
 const physicsStart=performance.now();let n=0;
 while(acc>=DT&&n<CAP){step(1);acc-=DT;n++;}
 if(acc>=DT){catchupCaps++;acc%=DT;}
 recent(physicsTimes,performance.now()-physicsStart);draw(clamp(acc/DT,0,1));
 if(now%600<17){const d=active.getStepDiagnostics();status.textContent=`Physical rig · ${active.getState().mode} · ${balanceAssist?'assist '+balanceProfile:'steps'} · steps ${d.completed} · ${percentile(intervals,.95).toFixed(1)} ms p95`;}
 recent(work,performance.now()-begin);rafId=requestAnimationFrame(frame);
}
function setBalanceAssist(enabled){
 balanceAssist=Boolean(enabled);
 active.enableBalanceReflex(balanceAssist?BALANCE_PROFILES[balanceProfile]:null);
 const button=document.querySelector('#balance');
 if(button){button.setAttribute('aria-pressed',String(balanceAssist));
  button.textContent=balanceAssist?'Balance: Assist (experimental)':'Balance: Steps only';}
}
function setBalanceProfile(name){
 if(!Object.hasOwn(BALANCE_PROFILES,name))throw Error('Unknown balance profile');
 balanceProfile=name;
 if(balanceAssist)active.enableBalanceReflex(BALANCE_PROFILES[balanceProfile]);
 const button=document.querySelector('#balanceProfile');
 if(button){button.setAttribute('aria-pressed',String(balanceProfile==='smooth'));
  button.textContent=balanceProfile==='smooth'?'Response: Smooth':'Response: Strong';}
}
function setGesture(name){
 if(!GESTURES.includes(name))throw Error('Unknown gesture');
 gesture=name;active.setPoseClip(createSideProfileGesture(name,{facing}),{fadeSeconds:.32});
 document.querySelectorAll('[data-gesture]').forEach(b=>{
  b.setAttribute('aria-pressed',String(b.dataset.gesture===name));
 });
}
const actions={
 balance:()=>setBalanceAssist(!balanceAssist),
 balanceProfile:()=>setBalanceProfile(balanceProfile==='strong'?'smooth':'strong'),
 reset:()=>reset(),
 drop:()=>active.impulse('torso',{x:35,y:5}),
 push:()=>active.impulse('torso',{x:8*facing,y:0}),
 qa:()=>navigator.clipboard?.writeText(JSON.stringify({rig:active.snapshot(),steps:active.getStepDiagnostics(),perf:perf()}))
};
for(const [id,action] of Object.entries(actions))document.querySelector('#'+id)?.addEventListener('click',action);
document.querySelectorAll('[data-gesture]').forEach(b=>b.addEventListener('click',()=>setGesture(b.dataset.gesture)));
reset();
setGesture(gesture);
info.textContent='True side-view humanoid · one visible eye, forward-facing nose and boots. Drag limbs, pose, push or drop; Planck controls every physical segment.';
window.__balanceActivePreviewQA={
 sample:()=>({rig:active.snapshot(),steps:active.getStepDiagnostics(),mode:active.getState(),pointer:{...tracker.metrics},gesture,balanceAssist,balanceProfile,perf:perf()}),
 step:n=>{if(!manualQA)throw Error('Manual stepping only in rigqa mode');const result=step(n);draw(1);return result;},
 reset,setGesture,setBalanceAssist,setBalanceProfile,impulse:(x,y=0)=>active.impulse('torso',{x,y}),
 worldToClient:(x,y)=>{const p=screen(x,y),r=canvas.getBoundingClientRect();return {x:p.x+r.left,y:p.y+r.top};},
 resize:()=>{resize();draw(1);},
};
if(!manualQA)rafId=requestAnimationFrame(frame);
window.addEventListener('pagehide',()=>{if(rafId)cancelAnimationFrame(rafId);if(detach)detach();active?.dispose();},{once:true});
