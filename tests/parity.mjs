import {chromium} from '/vercel/m2/node_modules/playwright/index.mjs';
import {createRigWorld} from '../adapters/planck.mjs';
const b=await chromium.launch({headless:true,args:['--no-sandbox']});
const p=await b.newPage({viewport:{width:393,height:793},isMobile:true,hasTouch:true});
const res=await p.goto('https://sling-lab-play.vercel.app/lab/?rigqa=1');
await p.waitForFunction(()=>!!window.__balanceRigQA);
const n=createRigWorld(),checks=[];
async function compare(label,count){
 n.step(count);
 const s=await p.evaluate(count=>{window.__balanceRigQA.step(count);return window.__balanceRigQA.sample();},count);
 let error=0,angle=0;
 for(const [id,v] of Object.entries(n.snapshot().bodies)){
  const q=s.bodies[id];error=Math.max(error,Math.hypot(q.x-v.x,q.y-v.y));angle=Math.max(angle,Math.abs(q.a-v.a));
 }
 checks.push({label,error,angle});
}
await compare('idle',120);
n.impulse('torso',{x:8,y:3});
await p.evaluate(()=>window.__balanceRigQA.event({type:'impulse',x:8,y:3}));
await compare('shove',120);
const h=n.snapshot().bodies.handL,t={x:h.x-.2,y:h.y+.4};
n.grab('handL',t);
await p.evaluate(t=>window.__balanceRigQA.event({type:'grab',part:'handL',...t}),t);
await compare('grab',90);
n.release();await p.evaluate(()=>window.__balanceRigQA.event({type:'release'}));
await compare('release',60);
const pass=res.status()===200&&checks.every(x=>x.error<.03&&x.angle<.08);
console.log(JSON.stringify({pass,status:res.status(),checks}));await b.close();if(!pass)process.exitCode=1;
