import test from 'node:test';
import assert from 'node:assert/strict';
import {RIG} from '../rig-config.mjs';
import {SIDE_VIEW_ART_ID,sideViewDrawingOrder,validateSideViewRig,drawSideViewSegment,drawSideViewHead} from '../browser/lab/side-view-character.mjs';
test('true 2D profile renderer keeps the 13 independent Planck physical segments',()=>{
 assert.equal(SIDE_VIEW_ART_ID,'balance-lab-human-profile-v1');
 assert.equal(validateSideViewRig(RIG),true);
 for(const facing of [-1,1]){
  const order=sideViewDrawingOrder(facing);
  assert.equal(order.length,13);assert.equal(new Set(order).size,13);
  assert.deepEqual(new Set(order),new Set(RIG.segments.map(s=>s.id)));
  assert.equal(order.indexOf('torso'),6);
 }
 assert.notDeepEqual(sideViewDrawingOrder(1),sideViewDrawingOrder(-1));
 assert.throws(()=>sideViewDrawingOrder(0));
});
test('profile renderer rejects invalid parameters without altering physical rig',()=>{
 const dummy={};assert.throws(()=>drawSideViewHead(dummy,0));
 assert.throws(()=>drawSideViewSegment(dummy,'torso',.3,.7,0));
 assert.throws(()=>drawSideViewSegment(dummy,'torso',.3,.7,40,0));
 assert.throws(()=>drawSideViewHead(dummy,40,0));
});
