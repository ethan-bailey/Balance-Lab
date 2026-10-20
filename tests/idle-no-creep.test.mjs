import test from 'node:test';
import assert from 'node:assert/strict';
import {createRigWorld} from '../adapters/planck.mjs';
import {createActiveRigWorld} from '../adapters/legacy/active-planck-v3.mjs';
test('T01 active no-creep 60s',()=>{const r=createActiveRigWorld();const x0=r.parts.get('torso').body.getPosition().x;r.step(7200);const dx=r.snapshot().bodies.torso.x-x0;assert.ok(Math.abs(dx)<.25,'drift '+dx+'m');});
