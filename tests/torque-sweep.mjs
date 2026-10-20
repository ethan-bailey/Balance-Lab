import {RIG} from '../rig-config.mjs'; import {createRigWorld} from '../adapters/planck.mjs';
for(const torque of [10,12,14,16,18,20,22,24,26,28,30]){
 const c={...RIG,motor:{...RIG.motor,maxTorque:torque}};
 const w=createRigWorld(c);let maxX=0,minY=9,contact=0;
 for(let i=0;i<7200;i++){const s=w.step();if(i%120===0){const b=s.bodies.torso;maxX=Math.max(maxX,Math.abs(b.x));minY=Math.min(minY,b.y);} if(s.grounded)contact++;}
 const s=w.snapshot(),b=s.bodies.torso;console.log(JSON.stringify({torque,x:+b.x.toFixed(4),y:+b.y.toFixed(4),vx:+b.vx.toFixed(4),maxX:+maxX.toFixed(4),minY:+minY.toFixed(4),groundedPct:+(100*contact/7200).toFixed(1),maxAnchor:+s.metrics.maxAnchorErrorM.toFixed(5)}));
}
