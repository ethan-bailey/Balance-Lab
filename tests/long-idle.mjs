import {createRigWorld} from '../adapters/planck.mjs';
const r=createRigWorld();r.step(7200);const s=r.snapshot();const m=s.metrics;
const pass=m.nonfinite===0&&m.maxAnchorErrorM<.045&&m.maxLimitViolationRad<.32;
console.log(JSON.stringify({pass,steps:m.steps,groundedSteps:m.groundedSteps,maxAnchorErrorM:m.maxAnchorErrorM,maxLimitViolationRad:m.maxLimitViolationRad,torso:s.bodies.torso}));if(!pass)process.exitCode=1;
