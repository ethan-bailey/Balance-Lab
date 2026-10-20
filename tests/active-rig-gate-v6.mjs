import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
const cases=Number(process.argv[2]||800),modes=['idle','wrist','ankle','flick','drop','shove','tumble','extreme'];
if(!Number.isInteger(cases)||cases<1||cases>10000)throw Error('bad count');
let passed=0,failed=[],measurements=[],start=performance.now();
for(let i=0;i<cases;i++){
 const mode=modes[i%8],seed=(0x6b6f7275+Math.imul(i+1,0x9e3779b9))>>>0;
 let x=seed;const random=()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};
 const r=createActiveRigWorld();
 try{
  if(mode==='drop')for(const {body} of r.parts.values()){const p=body.getPosition();body.setTransform({x:p.x,y:p.y+.08},body.getAngle());}
  let origin;
  for(let f=0;f<300;f++){
   if(mode==='wrist'||mode==='ankle'){
    const id=mode==='wrist'?'handL':'footR';
    if(f===20){const p=r.parts.get(id).body.getPosition();origin={x:p.x,y:p.y};r.grab(id,origin);}
    if(f>=20&&f<145){const t=(f-20)/125;r.moveGrab({x:origin.x+(mode==='wrist'?-1:.7)*t,y:origin.y+1.0*t});}
    if(f===145)r.release();
   }
   if(mode==='flick'&&f===35)r.impulse('handR',{x:15+10*random(),y:9+7*random()});
   if(mode==='shove'&&f===45)r.impulse('torso',{x:8+4*random(),y:2});
   if(mode==='tumble'&&f===30)r.impulse('torso',{x:25,y:16});
   if(mode==='extreme'&&f%35===0)r.impulse(['handL','footR','torso'][(f/35)%3|0],{x:(random()-.5)*100,y:(random()-.5)*100});
   r.step();
  }
  const s=r.snapshot(),m=s.metrics,finite=Object.values(s.bodies).every(b=>Object.values(b).every(Number.isFinite));
  const distance=Math.max(...Object.values(s.bodies).map(b=>Math.hypot(b.x,b.y)));
  const ok=finite&&m.nonfinite===0&&m.maxAnchorErrorM<.045&&m.maxLimitViolationRad<.32&&distance<60;
  const item={i,mode,seed,ok,anchor:m.maxAnchorErrorM,limit:m.maxLimitViolationRad,distance,groundedSteps:m.groundedSteps,grabSteps:m.grabSteps};
  measurements.push(item);if(ok)passed++;else failed.push(item);
 }catch(e){failed.push({i,mode,seed,error:String(e)});}
}
const result={schema:'active-planck-rig-v1',date:new Date().toISOString(),node:process.version,engine:'planck@1.5.1',cases,passed,failed:failed.length,durationMs:Math.round(performance.now()-start),maxAnchor:Math.max(...measurements.map(x=>x.anchor)),maxLimit:Math.max(...measurements.map(x=>x.limit)),failures:failed.slice(0,40),byMode:modes.map(mode=>({mode,pass:measurements.filter(x=>x.mode===mode&&x.ok).length,fail:failed.filter(x=>x.mode===mode).length}))};
writeFileSync('/vercel/balance-engineering/evidence/active-rig-gate-v6-'+cases+'.json',JSON.stringify({...result,measurements},null,2));
console.log(JSON.stringify(result));if(failed.length)process.exitCode=1;
