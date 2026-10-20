import test from 'node:test';
import assert from 'node:assert/strict';
import {jointMotorCommand} from '../src/physics/joint-motor.mjs';
test('shared joint motor preserves bounded force-overridable speed',()=>{
 const base={angle:0,velocity:0,lower:-1,upper:1,kp:140,kd:12,speedGainScale:1/12,maxSpeed:6,limitGuard:.55};
 assert.ok(Math.abs(jointMotorCommand(base).speed)<1e-12);
 assert.equal(jointMotorCommand(base).limitActive,false);
 assert.equal(jointMotorCommand({...base,requestedSpeed:100}).speed,6);
 assert.ok(jointMotorCommand({...base,angle:.9,velocity:3}).speed<=0);
 assert.ok(jointMotorCommand({...base,angle:-.9,velocity:-3}).speed>=0);
 assert.throws(()=>jointMotorCommand({...base,velocity:NaN}));
});
