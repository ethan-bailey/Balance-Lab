import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/active-planck-v3.mjs';
test('T01 standing 60 seconds',()=>{
 const r=createActiveRigWorld();r.step(7200);
 const s=r.snapshot(),b=s.bodies.torso;
 assert.equal(s.metrics.nonfinite,0);
 assert.ok(Math.abs(b.x)<.10);
 assert.ok(b.y>1.15);
 assert.equal(r.getState().mode,'standing');
 r.dispose();
});
