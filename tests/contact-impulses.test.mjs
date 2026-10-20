import test from 'node:test';import assert from 'node:assert/strict';
import {createRigWorld} from '../adapters/planck.mjs';
import {attachFootImpactSensor} from '../src/physics/contact-impulses.mjs';
test('post-solve foot impulses are finite and observed',()=>{
 const r=createRigWorld(),sensor=attachFootImpactSensor(r.world,r.ground,r.parts);
 for(const {body} of r.parts.values()){const p=body.getPosition();body.setTransform({x:p.x,y:p.y+.3},body.getAngle());}
 r.step(240);const s=sensor.snapshot();
 assert.ok(s.footL.events+s.footR.events>0);
 assert.ok(Number.isFinite(s.footL.normalImpulse+s.footR.normalImpulse));
 assert.ok(s.footL.normalImpulse+s.footR.normalImpulse>0);
 sensor.reset();assert.equal(sensor.snapshot().footL.events,0);sensor.detach();
});
