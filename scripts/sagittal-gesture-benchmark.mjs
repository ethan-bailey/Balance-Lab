import {RIG} from '../rig-config.mjs';
import {createSagittalRig} from '../src/config/sagittal-rig.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createSideProfileGesture} from '../src/animation/side-profile-gesture.mjs';
const mode=process.argv.includes('--holdout')?'holdout':'dev';
const baseline=process.argv.includes('--baseline');
const param=(n,d)=>{const a=process.argv.find(s=>s.startsWith('--'+n+'='));return a?Number(a.split('=')[1]):d;};
const out=[];
for(const facing of [1,-1])for(const gesture of ['rest','brace','reach','guard'])for(const force of (mode==='holdout'?[-10,10,-16,16]:[-8,8,-12,12])){
 const w=createActiveRigWorld(createFacingRig(baseline?RIG:createSagittalRig(RIG,{hipHalfSeparation:param('leg',.1),footLength:param('foot',.26),shoulderHalfSeparation:param('arm',.09)}),facing));w.enableRecoverySteps();w.enableBalanceReflex({ankleGain:1.8,hipGain:.6,smoothingSeconds:.01});
 w.setPoseClip(createSideProfileGesture(gesture,{facing}),{fadeSeconds:.35});let falls=0;
 for(let t=0;t<960;t++){if(t===(mode==='holdout'?260:160))w.impulse('torso',{x:force*facing,y:0});w.step();if(['fallen','tumbling'].includes(w.getState().mode))falls++;}
 out.push({facing,gesture,force,falls,steps:w.getStepDiagnostics()});w.dispose();
}
console.log(JSON.stringify({mode,baseline,leg:param('leg',.1),foot:param('foot',.26),arm:param('arm',.09),total:out.length,failed:out.filter(x=>x.falls>0).length,failures:out.filter(x=>x.falls>0)}));
