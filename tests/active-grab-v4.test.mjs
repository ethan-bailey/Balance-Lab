import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/legacy/active-planck-v4.mjs';
test('T03 ankle lift flips the unpinned body',()=>{
 const r=createActiveRigWorld();r.step(120);
 const p=r.parts.get('footR').body.getPosition();
 r.grab('footR',{x:p.x+.7,y:p.y+2.3});
 r.step(240);const held=r.snapshot();
 assert.ok(held.bodies.footR.y>1.8);
 assert.ok(Math.abs(held.bodies.torso.a)>2);
 assert.equal(r.getState().mode,'grabbed');
 r.release();r.step(120);
 const released=r.snapshot();
 assert.ok(released.bodies.torso.y<.6);
 assert.equal(r.getState().mode,'fallen');
 assert.equal(released.metrics.nonfinite,0);
 r.dispose();
});
