/** T07: severe impulse must still overpower the physically limited recovery motors. */
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
const cases=[];
for(const facing of [1,-1])for(const direction of [-1,1]){
 const r=createActiveRigWorld(createFacingRig(undefined,facing));r.enableRecoverySteps();r.step(120);
 r.impulse('torso',{x:35*direction,y:5});r.step(360);
 const s=r.snapshot(),state=r.getState();
 const pass=s.metrics.nonfinite===0&&state.mode==='fallen'&&s.bodies.torso.y<.6&&Math.abs(s.bodies.torso.a)>1;
 cases.push({facing,direction,pass,mode:state.mode,torsoY:s.bodies.torso.y,torsoAngle:s.bodies.torso.a,nonfinite:s.metrics.nonfinite});r.dispose();
}
console.log(JSON.stringify({schema:'A2-T07-severe-fall-v1',engine:'planck@1.5.1',pass:cases.every(c=>c.pass),cases},null,2));
if(cases.some(c=>!c.pass))process.exitCode=1;
