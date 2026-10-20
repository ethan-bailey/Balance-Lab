import test from 'node:test';
import assert from 'node:assert/strict';
import {createPoseClip,samplePose,blendPose} from '../src/animation/pose-sampler.mjs';
import {poseMotorCommand} from '../src/actuation/pose-motor.mjs';

test('pose keys and frames remain immutable and interpolation is deterministic',()=>{
 const input=[{time:0,pose:{kneeL:0}},{time:2,pose:{kneeL:1}}];
 const clip=createPoseClip(input);
 input[0].pose.kneeL=2;
 assert.equal(samplePose(clip,0).kneeL,0);
 assert.ok(Math.abs(samplePose(clip,1).kneeL-.5)<1e-12);
 assert.ok(Object.isFrozen(clip)&&Object.isFrozen(clip[0])&&Object.isFrozen(clip[0].pose));
 assert.deepEqual(samplePose(clip,3),clip[1].pose);
 assert.ok(Math.abs(samplePose(clip,2.5,{loop:true}).kneeL-.25)<1e-12);
});
test('blending crosses wrapped angular boundary along shortest arc',()=>{
 const a=Math.PI-.1,b=-Math.PI+.1;
 const middle=blendPose({hip:a},{hip:b},.5).hip;
 assert.ok(Math.abs(Math.abs(middle)-Math.PI)<1e-10);
});
test('clips reject nonfinite, unordered, and inconsistent joint keys',()=>{
 assert.throws(()=>createPoseClip([{time:0,pose:{hip:Infinity}}]),/Invalid joint angle/);
 assert.throws(()=>createPoseClip([{time:1,pose:{hip:0}},{time:0,pose:{hip:0}}]),/Invalid keyframe time/);
 assert.throws(()=>createPoseClip([{time:0,pose:{hip:0}},{time:1,pose:{knee:0}}]),/Inconsistent joints/);
 assert.throws(()=>samplePose([],0),/Invalid sample/);
 assert.throws(()=>blendPose({a:1},{b:2},.5),/Inconsistent joints/);
});
test('motor command is bounded and yields when external error exceeds its strength',()=>{
 const m=poseMotorCommand({angle:0,angularVelocity:-20,targetAngle:2,maxSpeed:3,maxTorque:7,activation:.5});
 assert.equal(Math.abs(m.speed),3);
 assert.equal(m.maxTorque,3.5);
 assert.ok(Object.isFrozen(m));
 assert.equal(poseMotorCommand({angle:0,angularVelocity:0,targetAngle:0}).speed,0);
});
test('motor input validation prevents NaN, negative and unbounded activation',()=>{
 assert.throws(()=>poseMotorCommand({angle:NaN,angularVelocity:0,targetAngle:0}),/Invalid motor input/);
 assert.throws(()=>poseMotorCommand({angle:0,angularVelocity:0,targetAngle:0,maxTorque:-1}),/Invalid motor limits/);
 assert.throws(()=>poseMotorCommand({angle:0,angularVelocity:0,targetAngle:0,activation:1.1}),/Invalid motor limits/);
});
