/** Deterministic reproducible balance perturbation matrix; no browser or CI usage. */
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {createSideProfileGesture} from '../src/animation/side-profile-gesture.mjs';
import {RIG} from '../rig-config.mjs';
const args=process.argv.slice(2),get=(name,fallback)=>{const a=args.find(s=>s.startsWith('--'+name+'='));return a?a.split('=')[1]:fallback;};
const params={ankleGain:Number(get('ankle','1.4')),hipGain:Number(get('hip','.8')),smoothingSeconds:Number(get('smooth','.01')),maxAnkle:Number(get('maxAnkle','.28')),maxHip:Number(get('maxHip','.24')),reflexTorque:Number(get('torque','42')),reflexTorqueFloor:Number(get('floor',get('torque','42'))),deadband:Number(get('deadband','0'))};
const mode=get('mode','assist'),subset=get('subset','full');
const kp=Number(get('kp','140')),kd=Number(get('kd','12')),cooldown=Number(get('cooldown','4.5'));
const suite=[];
for(const facing of [1,-1])for(const gesture of ['rest','brace','reach','guard'])for(const sign of [-1,1]){
 for(const force of subset==='fast'?[8,12]:subset==='holdout'?[5,10,14,20]:[8,12,16])suite.push({facing,gesture,sign,force,pattern:'single'});
 if(subset!=='fast')suite.push({facing,gesture,sign,force:subset==='holdout'?9:7,pattern:'repeat'});
}
const results=[];
for(const spec of suite){
 const w=createActiveRigWorld(createFacingRig({...RIG,motor:{...RIG.motor,kp,kd}},spec.facing));w.enableRecoverySteps(true,{cooldownSeconds:cooldown});
 if(mode==='assist')w.enableBalanceReflex(params);
 w.setPoseClip(createSideProfileGesture(spec.gesture,{facing:spec.facing}),{fadeSeconds:.35});
 let fallTicks=0,firstFall=-1,minY=100,maxKnee=0,torsoAngularTotal=0,idleAngularTotal=0,previousAngular=0;
 const start=w.rig.parts.get('torso').body.getPosition().x;
 for(let tick=0;tick<720;tick++){
  if(tick===(subset==='holdout'?170:120)||(spec.pattern==='repeat'&&(subset==='holdout'?[310,470]:[270,420]).includes(tick)))w.impulse('torso',{x:spec.sign*spec.force*spec.facing,y:0});
  w.step();const torso=w.rig.parts.get('torso').body;
  minY=Math.min(minY,torso.getPosition().y);
  const angular=torso.getAngularVelocity();if(tick>120)torsoAngularTotal+=Math.abs(angular-previousAngular);
  if(tick>1&&tick<120)idleAngularTotal+=Math.abs(angular-previousAngular);
  previousAngular=angular;
  for(const side of ['L','R'])maxKnee=Math.max(maxKnee,Math.abs(w.rig.links.find(l=>l.def.id==='knee'+side).joint.getJointAngle()));
  if(['fallen','tumbling'].includes(w.getState().mode)){fallTicks++;if(firstFall<0)firstFall=tick;}
 }
 const end=w.rig.parts.get('torso').body.getPosition().x;
 results.push({...spec,failed:fallTicks>0,fallTicks,firstFall,minY,maxKnee,torsoAngularTotal,idleAngularTotal,drift:Math.abs(end-start),step:w.getStepDiagnostics(),endMode:w.getState().mode});w.dispose();
}
const failed=results.filter(r=>r.failed),summary={mode,subset,params,kp,kd,cooldown,count:results.length,failures:failed.length,byForce:Object.fromEntries([...new Set(results.map(r=>r.force))].map(force=>[force,{n:results.filter(r=>r.force===force).length,failed:results.filter(r=>r.force===force&&r.failed).length}])),meanAngularTotal:results.reduce((s,r)=>s+r.torsoAngularTotal,0)/results.length,meanIdleAngularTotal:results.reduce((s,r)=>s+r.idleAngularTotal,0)/results.length,maxKnee:Math.max(...results.map(r=>r.maxKnee)),failedScenarios:failed.map(r=>[r.facing,r.gesture,r.sign,r.force,r.pattern])};
console.log(JSON.stringify({summary,results}));
