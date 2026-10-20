import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
const make=async port=>{
 const p=await b.newPage({viewport:{width:393,height:793},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 p.on('pageerror',e=>errors.push(port+': '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push(port+': '+m.text())});
 await p.goto('http://127.0.0.1:'+port+'/lab/?rigqa=1');
 await p.waitForFunction(()=>!!window.__balanceRigQA,{timeout:10000});
 return p;
};
const candidate=await make(9021),baseline=await make(9001);
const seeds=[0x6c234ac5,0x72ad991b,0x98314adf,0x12345678,0xdeadbeef,0xaabbccdd,0x98765432,0x4badf00d];
const stress=await candidate.evaluate(seeds=>{
 const q=window.__balanceRigQA;let bad=[],maxErr=0,maxLimit=0,perSeed=[];
 for(const seedInit of seeds){
  let seed=seedInit;const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296};
  let failures=0;
  for(let i=0;i<100;i++){
   q.reset();q.step(50);
   const part=['handL','handR','footL','footR','forearmL','forearmR'][i%6],start=q.sample().bodies[part];
   q.event({type:'grab',part,x:start.x,y:start.y});
   for(let j=0;j<(seedInit===0x98314adf?12:8);j++){
    q.event({type:'move',x:(rand()-.5)*(seedInit===0x98314adf?5.5:4.5),y:.2+rand()*3.5});
    q.step(30+Math.floor(rand()*30));
   }
   q.event({type:'release'});q.step(200);
   const v=q.sample(),s=v.stability;maxErr=Math.max(maxErr,s.maxJointErrorM);maxLimit=Math.max(maxLimit,s.maxLimitViolationRad);
   if(s.maxJointErrorM>.025||s.maxLimitViolationRad>.12||!Object.values(v.bodies).every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&Number.isFinite(b.a))){
    failures++;bad.push({seedInit,case:i,part,err:s.maxJointErrorM,limit:s.maxLimitViolationRad});
   }
  }
  perSeed.push({seedInit,failures});
 }
 return {total:800,passed:800-bad.length,failures:bad.length,maxErr,maxLimit,perSeed,bad:bad.slice(0,8)};
},seeds);
console.log('STRESS',JSON.stringify(stress));
const scenarios=[
 {name:'idle',steps:7200},
 {name:'wristDrag',steps:1800,events:[{at:50,type:'grab',part:'handL',x:-.265,y:1.057},{at:300,type:'move',x:-1.0,y:2.2},{at:900,type:'move',x:.8,y:2.7},{at:1250,type:'release'}]},
 {name:'ankleFlip',steps:1800,events:[{at:50,type:'grab',part:'footL',x:-.13,y:.205},{at:250,type:'move',x:1.4,y:3.0},{at:800,type:'move',x:-1.5,y:2.5},{at:1200,type:'release'}]},
 {name:'lightDrop',steps:960,events:[{at:20,type:'drop',height:.75}]},
 {name:'extremeImpulse',steps:1440,events:[{at:20,type:'impulse',x:100,y:100}]}
];
const runScenario=async (page,sc)=>page.evaluate(sc=>{
 const q=window.__balanceRigQA;q.reset();let cursor=0;
 for(const e of [...(sc.events||[]),{at:sc.steps,type:'end'}]){
  q.step(e.at-cursor);cursor=e.at;
  if(e.type!=='end')q.event(e);
 }
 const v=q.sample();return {stability:v.stability,bodies:v.bodies,support:v.support,rig:v.rig};
},sc);
const parity=[];
for(const sc of scenarios){
 const a=await runScenario(candidate,sc),v=await runScenario(baseline,sc);
 let maxPositionDelta=0,maxAngleDelta=0;
 for(const id of Object.keys(a.bodies)){
  const p=a.bodies[id],r=v.bodies[id];
  maxPositionDelta=Math.max(maxPositionDelta,Math.hypot(p.x-r.x,p.y-r.y));
  maxAngleDelta=Math.max(maxAngleDelta,Math.abs(p.a-r.a));
 }
 parity.push({name:sc.name,positionDelta:maxPositionDelta,angleDelta:maxAngleDelta,
  maxJointErrorM:a.stability.maxJointErrorM,maxLimitViolationRad:a.stability.maxLimitViolationRad,
  pass:a.stability.maxJointErrorM<=.025&&a.stability.maxLimitViolationRad<=.12});
}
console.log('PARITY',JSON.stringify(parity));
const p=await b.newPage({viewport:{width:393,height:793},deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('pageerror',e=>errors.push('touch: '+e.message));p.on('console',m=>{if(m.type()==='error')errors.push('touch: '+m.text())});
await p.goto('http://127.0.0.1:9021/lab/');await p.waitForFunction(()=>window.__balancePerf?.().rafCount>4);
const before=await p.evaluate(()=>window.__balancePerf().acceptedTouches);
await p.touchscreen.tap(194,400);
await p.waitForTimeout(60);
const after=await p.evaluate(()=>window.__balancePerf().acceptedTouches);
await p.setViewportSize({width:793,height:393});await p.waitForTimeout(120);
const resized=await p.evaluate(()=>({w:document.querySelector('canvas').width,h:document.querySelector('canvas').height,clientW:document.querySelector('canvas').clientWidth}));
await p.reload();await p.waitForFunction(()=>window.__balancePerf?.().rafCount>3);
const fresh=await p.evaluate(()=>window.__balancePerf());
const touch={before,after,resized,reloadFrames:fresh.rafCount,passed:after>before&&resized.w>0&&resized.h>0&&fresh.rafCount>3};
console.log('TOUCH',JSON.stringify(touch),'ERRORS',JSON.stringify(errors));
const report={stress,parity,touch,errors,passed:stress.failures===0&&parity.every(p=>p.pass)&&touch.passed&&errors.length===0};
await writeFile('m2-browser-gate.json',JSON.stringify(report,null,2));
await b.close();
if(!report.passed)process.exitCode=1;
