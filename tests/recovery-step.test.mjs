import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecoveryStepController} from '../src/behavior/recovery-step.mjs';
import {capturePoint1D} from '../src/physics/support-estimator.mjs';
const positions={footL:{x:-.12},footR:{x:.12}};
const parts=new Map(Object.entries(positions).map(([id,pos])=>[id,{body:{getPosition:()=>pos}}]));
const sensor=(vx,feet=['footL','footR'])=>({com:{x:0,y:1.2,vx,vy:0},feet,contactCount:feet.length,margin:.1,captureMargin:-.1});
const frame=(controller,vx,feet)=>controller.update({dt:1/120,support:sensor(vx,feet),parts,torsoHeight:1.35});
test('capture point reflects COM momentum and rejects invalid gravity',()=>{
 assert.ok(Math.abs(capturePoint1D({x:.1,y:1,vx:1})-(.1+Math.sqrt(1/9.81)))<1e-12);
 assert.equal(capturePoint1D({x:0,y:0,vx:1}),null);
 assert.throws(()=>capturePoint1D({x:0,y:1,vx:NaN}),/Invalid capture point/);
});
test('step cannot count a landing without measured liftoff, displacement, and contact',()=>{
 const c=createRecoveryStepController({triggerVelocity:.2});
 assert.equal(frame(c,-.5).phase,'lift');
 for(let i=0;i<20;i++)frame(c,-.5);
 assert.equal(c.diagnostics().landings,0);
 assert.equal(frame(c,-.5,['footL']).phase,'swing');
 assert.equal(c.diagnostics().lifts,1);
 for(let i=0;i<40;i++)frame(c,-.5,['footL']);
 assert.equal(c.diagnostics().landings,0);
 positions.footR.x=-.22;
 assert.equal(frame(c,-.5,['footL','footR']).phase,'idle');
 assert.equal(c.diagnostics().landings,1);
 assert.equal(c.diagnostics().failures,0);
 positions.footR.x=.12;
});
test('landing at unchanged location fails; grabbed motion cancels and disables motors',()=>{
 const c=createRecoveryStepController({triggerVelocity:.2});
 frame(c,-.5);frame(c,-.5,['footL']);
 for(let i=0;i<40;i++)frame(c,-.5,['footL']);
 frame(c,-.5,['footL','footR']);
 assert.equal(c.diagnostics().landings,0);
 assert.equal(c.diagnostics().failures,1);
 const d=createRecoveryStepController({triggerVelocity:.2});
 frame(d,-.5);
 const cancelled=d.update({dt:1/120,support:sensor(-.5),parts,grabbed:true});
 assert.deepEqual(cancelled.targets,{});
 assert.equal(d.diagnostics().failures,1);
});
test('planner rejects invalid sensor and configuration values',()=>{
 assert.throws(()=>createRecoveryStepController({triggerVelocity:NaN}),/Invalid step configuration/);
 const c=createRecoveryStepController();
 assert.throws(()=>c.update({dt:Infinity,support:sensor(0),parts}),/Invalid step sensor/);
});
