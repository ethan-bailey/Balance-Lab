/** A2: light disturbances must be absorbed without unnecessary foot lifting. */
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
const cases=[];
for(const facing of [1,-1])for(const impulse of [-5,-3,3,5]){
 const r=createActiveRigWorld(createFacingRig(undefined,facing));
 r.enableRecoverySteps();r.step(120);r.impulse('torso',{x:impulse,y:0});
 let minTorsoY=Infinity,maxTorsoAngle=0;
 for(let i=0;i<600;i++){
  r.step(1);
  if(i>=120){const torso=r.snapshot().bodies.torso;
   minTorsoY=Math.min(minTorsoY,torso.y);
   maxTorsoAngle=Math.max(maxTorsoAngle,Math.abs(torso.a));}
 }
 const d=r.getStepDiagnostics(),s=r.snapshot(),mode=r.getState().mode;
 const pass=mode==='standing'&&minTorsoY>1.15&&maxTorsoAngle<.35&&
  d.attempts===0&&s.metrics.nonfinite===0;
 cases.push({facing,impulse,pass,minTorsoY,maxTorsoAngle,stepAttempts:d.attempts,mode});r.dispose();
}
console.log(JSON.stringify({schema:'A2-light-catch-v1',fixedHz:120,engine:'planck@1.5.1',
 pass:cases.every(c=>c.pass),cases},null,2));
if(cases.some(c=>!c.pass))process.exitCode=1;
