import test from 'node:test';
import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/legacy/active-planck-v4.mjs';
test('T01 v4 ten-minute uncommanded standing',()=>{const r=createActiveRigWorld();r.step(72000);const s=r.snapshot();assert.equal(s.metrics.nonfinite,0);assert.equal(r.getState().mode,'standing');assert.ok(Math.abs(s.bodies.torso.x)<.20,'drift '+s.bodies.torso.x);assert.ok(s.bodies.torso.y>1.15);r.dispose();});
