import test from 'node:test';
import assert from 'node:assert/strict';
import {createRecoveryStepController} from '../src/behavior/recovery-step.mjs';
import {capturePoint1D} from '../src/physics/support-estimator.mjs';

const sensor=(vx,feet=['footL','footR'])=>({
 com:{x:0,y:1.2,vx,vy:0},feet,contactCount:feet.length,
 margin:.1,captureMargin:-.1
});
function harness(){
 const positions={footL:{x:-.12,y:.08},footR:{x:.12,y:.08}};
 const parts=new Map(Object.entries(positions).map(([id,pos])=>[id,{body:{getPosition:()=>pos}}]));
 const sample=(controller,vx,feet)=>controller.update({dt:1/120,support:sensor(vx,feet),parts,torsoHeight:1.35});
 return {positions,parts,sample};
}

test('capture point reflects COM momentum and rejects invalid gravity',()=>{
 assert.ok(Math.abs(capturePoint1D({x:.1,y:1,vx:1})-(.1+Math.sqrt(1/9.81)))<1e-12);
 assert.equal(capturePoint1D({x:0,y:0,vx:1}),null);
 assert.throws(()=>capturePoint1D({x:0,y:1,vx:NaN}),/Invalid capture point/);
});

test('strong COM velocity initiates an immediate bounded swing in either direction',()=>{
 const {sample}=harness();
 const right=createRecoveryStepController();
 const r=sample(right,.34);
 assert.equal(r.phase,'swing');
 assert.equal(r.targets.hipL,.5);
 assert.equal(right.diagnostics().foot,'L');
 const left=createRecoveryStepController();
 const l=sample(left,-.4);
 assert.equal(l.phase,'swing');
 assert.equal(l.targets.hipR,-.2);
 assert.equal(left.diagnostics().foot,'R');
 assert.equal(right.diagnostics().attempts,1);
});

test('lesser COM velocity prepares before swing; standing idle never steps on its own',()=>{
 const {sample}=harness();
 const c=createRecoveryStepController();
 for(let i=0;i<120;i++)assert.equal(sample(c,.02).phase,'idle');
 assert.equal(c.diagnostics().attempts,0);
 for(let i=0;i<10;i++){
  const result=sample(c,.27);
  assert.deepEqual(result.targets,{},'prepare stage cannot drive physics motors');
 }
 const next=sample(c,.27);
 assert.equal(next.phase,'swing');
 assert.equal(next.targets.hipL,.7);
});

test('no landing can be counted without physical liftoff and shifted renewed contact',()=>{
 const {positions,sample}=harness();
 const c=createRecoveryStepController();
 sample(c,-.5);
 for(let i=1;i<75;i++)sample(c,-.5);
 assert.equal(c.diagnostics().landings,0);
 assert.equal(c.diagnostics().completed,0);
 // A failed attempt cannot masquerade as a step through a state name.
 assert.equal(c.diagnostics().failures,1);

 const d=createRecoveryStepController();
 sample(d,-.5);
 sample(d,-.5,['footL']);
 assert.equal(d.diagnostics().lifts,1);
 sample(d,-.5,['footL','footR']);
 assert.equal(d.diagnostics().landings,0,'recontact at the original position is not a step');
 const e=createRecoveryStepController();
 sample(e,-.5);
 sample(e,-.5,['footL']);
 positions.footR.x=-.22;
 sample(e,-.5,['footL','footR']);
 assert.equal(e.diagnostics().landings,1,'foot moved 0.34m left before contact');
 for(let i=0;i<70;i++)sample(e,-.5,['footL','footR']);
 assert.equal(e.diagnostics().completed,1);
 assert.equal(e.diagnostics().failures,0);
});

test('grab or fall cancels an active motor sequence and reports failure',()=>{
 const {sample,parts}=harness();
 const c=createRecoveryStepController();
 sample(c,-.5);
 const cancelled=c.update({dt:1/120,support:sensor(-.5),parts,grabbed:true});
 assert.deepEqual(cancelled.targets,{});
 assert.equal(c.diagnostics().phase,'idle');
 assert.equal(c.diagnostics().failures,1);

 const d=createRecoveryStepController();
 sample(d,-.5);
 const toppled=d.update({dt:1/120,support:sensor(-.5),parts,torsoHeight:.4});
 assert.deepEqual(toppled.targets,{});
 assert.equal(d.diagnostics().failures,1);
});

test('planner rejects invalid sensors, thresholds and durations',()=>{
 assert.throws(()=>createRecoveryStepController({triggerVelocity:NaN}),/Invalid step configuration/);
 assert.throws(()=>createRecoveryStepController({quickVelocity:.1}),/Invalid step configuration/);
 assert.throws(()=>createRecoveryStepController({swingFrames:-1}),/Invalid step frame count/);
 assert.throws(()=>createRecoveryStepController({swingFrames:3.4}),/Invalid step frame count/);
 const {parts}=harness();
 const c=createRecoveryStepController();
 assert.throws(()=>c.update({dt:Infinity,support:sensor(0),parts}),/Invalid step sensor/);
});
