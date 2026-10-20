import test from 'node:test';
import assert from 'node:assert/strict';
import {attachCanvasPointerInput} from '../src/input/canvas-pointer.mjs';
test('M3 DOM pointer capture and lifecycle cancellation',()=>{
 class Target extends EventTarget{}
 const canvas=new Target(),doc=new Target(),win=new Target();
 canvas.style={touchAction:'pan-y'};
 const captures=new Set();
 canvas.setPointerCapture=id=>captures.add(id);
 canvas.hasPointerCapture=id=>captures.has(id);
 canvas.releasePointerCapture=id=>captures.delete(id);
 const calls={down:0,move:0,up:0,lost:0,cancel:0};
 const tracker=Object.fromEntries(Object.keys(calls).map(k=>[k,()=>{calls[k]++;return true;}]));
 const detach=attachCanvasPointerInput(canvas,tracker,{documentRef:doc,windowRef:win});
 const event=(type,id)=>{const e=new Event(type,{cancelable:true});e.pointerId=id;canvas.dispatchEvent(e);return e;};
 assert.equal(canvas.style.touchAction,'none');
 assert.ok(event('pointerdown',4).defaultPrevented);
 assert.ok(captures.has(4));
 event('pointermove',4);event('pointerup',4);
 assert.equal(captures.size,0);
 event('pointerdown',5);event('pointercancel',5);
 event('pointerdown',6);win.dispatchEvent(new Event('blur'));
 event('pointerdown',7);doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));
 assert.equal(calls.lost,1);assert.equal(calls.cancel,2);assert.equal(captures.size,0);
 detach();assert.equal(canvas.style.touchAction,'pan-y');
 event('pointerdown',8);assert.equal(calls.down,4);
});
