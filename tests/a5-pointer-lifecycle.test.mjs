import test from 'node:test';
import assert from 'node:assert/strict';
import {attachCanvasPointerInput} from '../src/input/canvas-pointer.mjs';
import {createDragTracker} from '../src/input/drag-tracker.mjs';
import {createRigGripBinding} from '../src/input/rig-grip-binding.mjs';
import {pickRigBody} from '../src/input/rig-picking.mjs';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';

const event=(type,id,x=0,y=0,t=0)=>{
 const e=new Event(type,{cancelable:true});
 for(const [key,value] of Object.entries({pointerId:id,clientX:x,clientY:y,timeStamp:t}))
  Object.defineProperty(e,key,{value,configurable:true});
 return e;
};
function dom(){
 class Target{constructor(){this.listeners=new Map()} addEventListener(t,f){if(!this.listeners.has(t))this.listeners.set(t,new Set());this.listeners.get(t).add(f)} removeEventListener(t,f){this.listeners.get(t)?.delete(f)} dispatchEvent(e){for(const f of this.listeners.get(e.type)||[])f(e);return true}}
 const canvas=new Target(),doc=new Target(),win=new Target(),captured=new Set();
 canvas.style={touchAction:'pan-y'};
 canvas.setPointerCapture=id=>captured.add(id);
 canvas.hasPointerCapture=id=>captured.has(id);
 canvas.releasePointerCapture=id=>{captured.delete(id);canvas.dispatchEvent(event('lostpointercapture',id));};
 return {canvas,doc,win,captured,send:(type,id,x=0,y=0,t=0)=>canvas.dispatchEvent(event(type,id,x,y,t))};
}
function tracker(events=[]){
 return createDragTracker({toWorld:(x,y)=>({x,y}),pick:()=> 'handL',
  onStart:(id,p)=>events.push(['start',id,p]),
  onMove:(id,p)=>events.push(['move',id,p]),
  onEnd:(id,e)=>events.push(['end',id,e])});
}
test('A5.4: secondary pointer cannot release, move or cancel the owner',()=>{
 const d=dom(),events=[],t=tracker(events),detach=attachCanvasPointerInput(d.canvas,t,{documentRef:d.doc,windowRef:d.win});
 d.send('pointerdown',1,0,0,1);d.send('pointerdown',2,0,0,2);
 d.send('pointermove',2,4,0,3);d.send('pointerup',2,4,0,4);
 d.send('pointercancel',2,4,0,5);
 assert.deepEqual([...d.captured],[1]);assert.equal(t.active,true);assert.equal(t.metrics.moves,0);
 d.send('pointermove',1,2,0,6);d.send('pointerup',1,2,0,7);
 assert.equal(t.active,false);assert.equal(t.metrics.releases,1);
 assert.equal(t.metrics.cancels,0);assert.equal(d.captured.size,0);detach();
});
test('A5.4: blur releases native capture and cancels once, never flicks',()=>{
 const d=dom(),events=[],t=tracker(events),detach=attachCanvasPointerInput(d.canvas,t,{documentRef:d.doc,windowRef:d.win});
 d.send('pointerdown',3,0,0,1);d.send('pointermove',3,10,0,10);
 d.win.dispatchEvent(new Event('blur'));d.send('lostpointercapture',3);
 assert.equal(t.active,false);assert.equal(t.metrics.cancels,1);
 assert.equal(t.metrics.releases,0);assert.equal(d.captured.size,0);
 assert.equal(events.at(-1)[2].vx,0);detach();
});
test('A5.4: hidden tab, explicit pointercancel and detach all release capture',()=>{
 const d=dom(),t=tracker(),detach=attachCanvasPointerInput(d.canvas,t,{documentRef:d.doc,windowRef:d.win});
 d.send('pointerdown',4,0,0,1);d.doc.hidden=true;
 d.doc.dispatchEvent(new Event('visibilitychange'));
 assert.equal(d.captured.size,0);assert.equal(t.metrics.cancels,1);
 d.doc.hidden=false;d.send('pointerdown',5,0,0,2);d.send('pointercancel',5,0,0,3);
 assert.equal(d.captured.size,0);assert.equal(t.metrics.cancels,2);
 d.send('pointerdown',6,0,0,4);detach();
 assert.equal(t.metrics.cancels,3);assert.equal(d.captured.size,0);
 assert.equal(d.canvas.style.touchAction,'pan-y');
 d.send('pointerdown',7,0,0,5);assert.equal(t.metrics.starts,3);
});
test('A5.4: invalid pointer ID and failed grab do not strand active state',()=>{
 let starts=0;
 const t=createDragTracker({toWorld:(x,y)=>({x,y}),pick:()=> 'handL',
  onStart:()=>{starts++;if(starts===1)throw Error('grab failed');}});
 assert.equal(t.down({pointerId:NaN,clientX:1,clientY:1,timeStamp:0}),false);
 assert.throws(()=>t.down({pointerId:1,clientX:1,clientY:1,timeStamp:0}),/grab failed/);
 assert.equal(t.active,false);assert.equal(t.metrics.starts,0);
 assert.equal(t.down({pointerId:2,clientX:1,clientY:1,timeStamp:1}),true);
 assert.equal(t.metrics.starts,1);t.cancel();
});
test('A5.1: rotated segment is picked at exact local coordinates',()=>{
 const angle=Math.PI/3,p={x:1,y:2};
 const parts=new Map([['handL',{body:{getPosition:()=>p,getAngle:()=>angle},def:{w:.5,h:.15}}]]);
 const x=.18,y=.045;
 const world={x:p.x+Math.cos(angle)*x-Math.sin(angle)*y,y:p.y+Math.sin(angle)*x+Math.cos(angle)*y};
 assert.equal(pickRigBody(parts,world,{padding:0}),'handL');
 assert.equal(pickRigBody(parts,{x:p.x+1,y:p.y+1},{padding:0}),null);
});
function fakeRig(){
 const events=[];
 const body={getLinearVelocity:()=>({x:0,y:0}),getMass:()=>2};
 return {parts:new Map([['handL',{body,def:{w:2,h:2}}]]),events,
  grab:(...a)=>events.push(['grab',...a]),moveGrab:p=>events.push(['move',p]),
  release:()=>events.push(['release']),impulse:(...a)=>events.push(['impulse',...a])};
}
test('A5.4: default release never injects synthetic impulse',()=>{
 const rig=fakeRig(),t=createRigGripBinding({rig,toWorld:(x,y)=>({x,y})});
 const e=(id,x,y,timeStamp)=>({pointerId:id,clientX:x,clientY:y,timeStamp});
 rig.parts.get('handL').body.getPosition=()=>({x:0,y:0});
 rig.parts.get('handL').body.getAngle=()=>0;
 t.down(e(1,0,0,0));t.move(e(1,1,0,10));t.up(e(1,2,0,20));
 assert.equal(rig.events.filter(e=>e[0]==='impulse').length,0);
 assert.equal(rig.events.filter(e=>e[0]==='release').length,1);
});
test('A5.4: explicit capped flick opt-in; cancel applies no impulse',()=>{
 const rig=fakeRig();rig.parts.get('handL').body.getPosition=()=>({x:0,y:0});
 rig.parts.get('handL').body.getAngle=()=>0;
 const t=createRigGripBinding({rig,toWorld:(x,y)=>({x,y}),flickGain:.25,maxSpeed:10});
 const e=(id,x,y,timeStamp)=>({pointerId:id,clientX:x,clientY:y,timeStamp});
 t.down(e(1,0,0,0));t.move(e(1,50,0,10));t.cancel();
 assert.equal(rig.events.filter(e=>e[0]==='impulse').length,0);
 t.down(e(2,0,0,20));t.move(e(2,50,0,30));t.up(e(2,50,0,40));
 const impulse=rig.events.filter(e=>e[0]==='impulse');
 assert.equal(impulse.length,1);assert.ok(Math.abs(impulse[0][2].x-5)<1e-9);
 assert.equal(impulse[0][2].y,0);
});
test('A5.5: real active Planck rig pointer cancellation is force-bounded',()=>{
 const rig=createActiveRigWorld();rig.step(120);
 const b=rig.parts.get('handL').body,p={...b.getPosition()};
 let extraImpulses=0;const original=rig.impulse.bind(rig);
 rig.impulse=(...args)=>{extraImpulses++;return original(...args);};
 const t=createRigGripBinding({rig,toWorld:(x,y)=>({x,y})});
 const d=dom(),detach=attachCanvasPointerInput(d.canvas,t,{documentRef:d.doc,windowRef:d.win});
 d.send('pointerdown',1,p.x,p.y,1);
 assert.equal(t.active,true);
 d.send('pointermove',1,p.x-.8,p.y+1,200);
 rig.step(180);
 assert.ok(rig.snapshot().bodies.handL.x<p.x-.15);
 d.win.dispatchEvent(new Event('blur'));
 assert.equal(t.active,false);assert.equal(d.captured.size,0);
 assert.equal(extraImpulses,0);
 rig.step(120);
 assert.equal(rig.snapshot().metrics.nonfinite,0);
 detach();rig.dispose();
});

test('A5.4: pointerup callback failure cannot leak browser capture',()=>{
 const d=dom(),t=tracker(),original=t.up;
 t.up=e=>{original(e);throw Error('end failure');};
 const detach=attachCanvasPointerInput(d.canvas,t,{documentRef:d.doc,windowRef:d.win});
 d.send('pointerdown',12,0,0,1);
 assert.throws(()=>d.send('pointerup',12,0,0,2),/end failure/);
 assert.equal(d.captured.size,0);assert.equal(t.active,false);
 detach();
});
test('A5.4: cancellation callback failure cannot leak browser capture',()=>{
 const d=dom(),t=tracker(),original=t.cancel;
 t.cancel=()=>{original();throw Error('cancel failure');};
 const detach=attachCanvasPointerInput(d.canvas,t,{documentRef:d.doc,windowRef:d.win});
 d.send('pointerdown',13,0,0,1);
 assert.throws(()=>d.win.dispatchEvent(new Event('blur')),/cancel failure/);
 assert.equal(d.captured.size,0);assert.equal(t.active,false);
 detach();
});
