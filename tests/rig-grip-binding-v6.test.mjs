import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createRigGripBinding} from '../src/input/rig-grip-binding.mjs';
test('M3 hand pull transmits force through whole body',()=>{
 const r=createActiveRigWorld();r.step(120);
 const p={...r.parts.get('handL').body.getPosition()};
 const t=createRigGripBinding({rig:r,toWorld:(x,y)=>({x,y})});
 assert.ok(t.down({pointerId:1,clientX:p.x,clientY:p.y,timeStamp:1}));
 t.move({pointerId:1,clientX:p.x-1,clientY:p.y+1,timeStamp:500});
 r.step(240);const s=r.snapshot();
 assert.ok(s.bodies.handL.x<p.x-.6);
 assert.ok(s.bodies.torso.x<-.5);
 t.up({pointerId:1,clientX:p.x-1,clientY:p.y+1,timeStamp:520});
 assert.equal(t.metrics.releases,1);assert.equal(s.metrics.nonfinite,0);
 r.dispose();
});
