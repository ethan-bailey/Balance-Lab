import {createRigWorld} from '../adapters/planck.mjs';
const r=createRigWorld();const p=r.parts.get('footR').body.getPosition();const initial={x:p.x,y:p.y};r.grab('footR',{x:initial.x,y:initial.y+1});r.step(50);console.log(JSON.stringify({initial,after:r.snapshot().bodies.footR,metrics:r.metrics}));
