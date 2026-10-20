import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createPoseClip} from '../src/animation/pose-sampler.mjs';
const engine='planck@1.5.1';
const clip=createPoseClip([
 {time:0,pose:{shoulderL:.2,shoulderR:-.2}},
 {time:3,pose:{shoulderL:.2,shoulderR:-.2}}
]);
const n=Number(process.argv[2]||100);
if(!Number.isInteger(n)||n<1||n>1000)throw Error('Invalid case count');
let seed=0x38c6d,passed=0,failed=0,maxAnchor=0,maxLimit=0,physicalLifts=0,physicalLandings=0,physicalFalls=0;
const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
for(let i=0;i<n;i++){
 const r=createActiveRigWorld();r.enableRecoverySteps();
 r.setPoseClip(clip);r.step(120);
 const x=(next()*2-1)*35,y=next()*8;
 r.impulse('torso',{x,y});r.step(480);
 const s=r.snapshot(),d=r.getStepDiagnostics();
 maxAnchor=Math.max(maxAnchor,s.metrics.maxAnchorErrorM);
 maxLimit=Math.max(maxLimit,s.metrics.maxLimitViolationRad);
 physicalLifts+=d.lifts;physicalLandings+=d.landings;
 physicalFalls+=(s.bodies.torso.y<.9?1:0);
 if(s.metrics.nonfinite===0&&s.metrics.maxAnchorErrorM<.045&&s.metrics.maxLimitViolationRad<.32)passed++;else failed++;
 r.dispose();
}
console.log(JSON.stringify({schema:'A2-opt-in-step-stress-v1',engine,cases:n,passed,failed,maxAnchor,maxLimit,physicalLifts,physicalLandings,physicalFalls}));
if(failed)process.exitCode=1;
