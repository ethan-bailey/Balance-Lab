import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/active-planck-v3.mjs';
import {createRigGripBinding} from '../src/input/rig-grip-binding.mjs';
test('cancel never imparts flick; release does',()=>{
 const r=createActiveRigWorld();const p=r.parts.get('handL').body.getPosition();
 let flicks=0;r.impulse=()=>{flicks++;};
 const t=createRigGripBinding({rig:r,toWorld:(x,y)=>({x,y})});
 const e=(id,x,y,ms)=>({pointerId:id,clientX:x,clientY:y,timeStamp:ms});
 assert.ok(t.down(e(7,p.x,p.y,1)));
 assert.equal(t.down(e(8,p.x,p.y,2)),false);
 t.move(e(7,p.x+2,p.y+2,40));t.cancel();
 assert.equal(flicks,0);assert.equal(t.metrics.cancels,1);
 assert.ok(t.down(e(9,p.x,p.y,100)));
 t.move(e(9,p.x+2,p.y+2,140));t.up(e(9,p.x+2,p.y+2,145));
 assert.equal(flicks,1);assert.equal(t.metrics.releases,1);
 r.dispose();
});
