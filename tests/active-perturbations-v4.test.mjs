import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/legacy/active-planck-v4.mjs';
test('T07 severe shove produces physical fall',()=>{
 const r=createActiveRigWorld();r.step(120);r.impulse('torso',{x:35,y:5});r.step(300);
 const s=r.snapshot();assert.equal(s.metrics.nonfinite,0);
 assert.equal(r.getState().mode,'fallen');
 assert.ok(s.bodies.torso.y<.6);
 assert.ok(Math.abs(s.bodies.torso.a)>1);
 r.dispose();
});
test('deterministic perturbation replay',()=>{
 const a=createActiveRigWorld(),b=createActiveRigWorld();
 for(const r of [a,b]){r.step(120);r.impulse('torso',{x:8,y:1});r.step(360);}
 assert.deepEqual(a.snapshot(),b.snapshot());
 assert.deepEqual(a.getDiagnostics(),b.getDiagnostics());
 a.dispose();b.dispose();
});
