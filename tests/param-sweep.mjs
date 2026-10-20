import {RIG} from '../rig-config.mjs';
import {createRigWorld} from '../adapters/planck.mjs';
const configs=[
 ['base',{}],['lowgain',{motor:{kp:50,kd:10}}],['verylow',{motor:{kp:20,kd:8}}],
 ['damped',{motor:{kp:60,kd:24}}],['damped2',{motor:{kp:100,kd:36}}],
 ['highDamp',{angularDamping:.5,linearDamping:.1}],
 ['hiFriction',{groundFriction:2,segmentFriction:1.8}],
 ['lessTorque',{motor:{maxTorque:20}}],['lessTorque2',{motor:{maxTorque:35}}],
 ['lowSpeed',{motor:{maxSpeed:2}}],['speedGain',{motor:{speedGainScale:1/30}}],
 ['mix',{motor:{kp:55,kd:22,maxTorque:30,maxSpeed:3},angularDamping:.3,linearDamping:.06}],
 ['mix2',{motor:{kp:80,kd:32,maxTorque:40,maxSpeed:4},angularDamping:.3,linearDamping:.06}],
 ['mix3',{motor:{kp:120,kd:36,maxTorque:60,maxSpeed:3},angularDamping:.2,linearDamping:.06}]
];
for(const [name,p] of configs){
 const c={...RIG,...p,motor:{...RIG.motor,...p.motor}};
 const w=createRigWorld(c);
 let maxX=0,minY=100,maxTilt=0;
 for(let i=0;i<2400;i++){
  const s=w.step();if(i%120===0){const b=s.bodies.torso;maxX=Math.max(maxX,Math.abs(b.x));minY=Math.min(minY,b.y);maxTilt=Math.max(maxTilt,Math.abs(b.a));}
 }
 const s=w.snapshot(),b=s.bodies.torso;
 console.log(JSON.stringify({name,x:+b.x.toFixed(3),y:+b.y.toFixed(3),vx:+b.vx.toFixed(3),maxX:+maxX.toFixed(3),minY:+minY.toFixed(3),maxTilt:+maxTilt.toFixed(3),anchor:+s.metrics.maxAnchorErrorM.toFixed(4),limit:+s.metrics.maxLimitViolationRad.toFixed(4)}));
}
