/** Long-horizon, deterministic, no-input A2 stance gate. No fabricated contacts. */
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';

const cases=[];
for(const facing of [1,-1]){
 const r=createActiveRigWorld(createFacingRig(undefined,facing));
 r.enableRecoverySteps();
 let minTorsoY=Infinity,maxTorsoAngle=0,maxTorsoDisplacement=0,nonfinite=0;
 for(let t=0;t<72000;t+=120){
  r.step(120);const s=r.snapshot(),torso=s.bodies.torso;
  minTorsoY=Math.min(minTorsoY,torso.y);
  maxTorsoAngle=Math.max(maxTorsoAngle,Math.abs(torso.a));
  maxTorsoDisplacement=Math.max(maxTorsoDisplacement,Math.abs(torso.x));
  nonfinite=Math.max(nonfinite,s.metrics.nonfinite);
 }
 const d=r.getStepDiagnostics(),s=r.snapshot(),state=r.getState();
 const pass=nonfinite===0&&minTorsoY>1.15&&maxTorsoAngle<.35&&
  maxTorsoDisplacement<.25&&d.attempts===0&&state.mode==='standing';
 cases.push({facing,pass,minTorsoY,maxTorsoAngle,maxTorsoDisplacement,
  nonfinite,stepAttempts:d.attempts,finalMode:state.mode,finalTorsoY:s.bodies.torso.y});
 r.dispose();
}
const result={schema:'A2-600s-physical-no-input-stance-v1',fixedHz:120,seconds:600,engine:'planck@1.5.1',
 pass:cases.every(c=>c.pass),cases};
console.log(JSON.stringify(result,null,2));
if(!result.pass)process.exitCode=1;
