import test from 'node:test';import assert from 'node:assert/strict';
import {createDragTracker} from '../src/input/drag-tracker.mjs';
const ev=(pointerId,clientX,clientY,timeStamp)=>({pointerId,clientX,clientY,timeStamp});
test('one pointer owns drag and velocity is capped',()=>{
 const events=[];const t=createDragTracker({toWorld:(x,y)=>({x,y}),pick:()=> 'handL',onStart:(...a)=>events.push(['start',...a]),onMove:(...a)=>events.push(['move',...a]),onEnd:(...a)=>events.push(['end',...a]),maxSpeed:10});
 assert.equal(t.down(ev(1,0,0,0)),true);assert.equal(t.down(ev(2,0,0,1)),false);
 assert.equal(t.move(ev(2,4,4,10)),false);assert.equal(t.move(ev(1,20,0,50)),true);
 assert.equal(t.up(ev(1,30,0,60)),true);assert.equal(t.active,false);
 assert.ok(Math.hypot(events.at(-1)[2].vx,events.at(-1)[2].vy)<=10.00001);
 assert.deepEqual({starts:t.metrics.starts,releases:t.metrics.releases},{starts:1,releases:1});
});
test('cancel never applies release flick',()=>{
 let ended;const t=createDragTracker({toWorld:(x,y)=>({x,y}),pick:()=> 'footR',onEnd:(_,e)=>ended=e});
 t.down(ev(7,0,0,0));t.move(ev(7,10,5,40));t.cancel();
 assert.deepEqual({vx:ended.vx,vy:ended.vy,cancelled:ended.cancelled},{vx:0,vy:0,cancelled:true});
});
test('invalid and out of order coordinates cannot poison drag',()=>{
 const t=createDragTracker({toWorld:(x,y)=>({x,y}),pick:()=> 'torso'});
 assert.equal(t.down(ev(1,NaN,0,0)),false);t.down(ev(1,0,0,10));
 assert.equal(t.move(ev(1,1,1,5)),false);assert.equal(t.move(ev(1,Infinity,1,20)),false);
 assert.equal(t.up(ev(1,0,0,30)),true);
});
