/** Regression for real user's untouched playable A2 preview falling within 5 s.
 * Use the exact playable rig configuration, not only the controller's idle harness.
 */
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
const cases=[];
for(const facing of [1,-1]){
 const active=createActiveRigWorld(createFacingRig(undefined,facing));active.enableRecoverySteps();
 let minY=Infinity,maxAngle=0;
 for(let i=0;i<1200;i++){
  active.step(1);const torso=active.snapshot().bodies.torso;
  minY=Math.min(minY,torso.y);maxAngle=Math.max(maxAngle,Math.abs(torso.a));
 }
 const steps=active.getStepDiagnostics(),s=active.snapshot();
 const pass=minY>1.15&&maxAngle<.35&&steps.attempts===0&&s.metrics.nonfinite===0;
 cases.push({facing,pass,minY,maxAngle,steps});active.dispose();
}
console.log(JSON.stringify({schema:'A2-playable-no-input-10s-v1',pass:cases.every(c=>c.pass),cases},null,2));
if(cases.some(c=>!c.pass))process.exitCode=1;
