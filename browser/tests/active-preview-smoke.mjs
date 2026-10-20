/** Mobile Chromium playable A2 candidate: real rig + A5 touch/pointer lifecycle. */
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];let result;
try{
 const page=await browser.newPage({viewport:{width:393,height:793},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:9021/lab/active.html?rigqa=1');
 await page.waitForFunction(()=>!!window.__balanceActivePreviewQA);
 const initial=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;q.step(120);
  const before=q.sample();q.impulse(8);q.step(600);return {before,after:q.sample()};});
 const hand=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;
  const p=q.sample().rig.bodies.handL;return q.worldToClient(p.x,p.y);});
 await page.mouse.move(hand.x,hand.y);await page.mouse.down();
 await page.mouse.move(hand.x+75,hand.y-65,{steps:6});
 await page.evaluate(()=>window.__balanceActivePreviewQA.step(80));
 await page.mouse.up();
 const pointerAfterRelease=await page.evaluate(()=>window.__balanceActivePreviewQA.sample().pointer);
 const other=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;
  const p=q.sample().rig.bodies.handR;return q.worldToClient(p.x,p.y);});
 await page.mouse.move(other.x,other.y);await page.mouse.down();
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
 const pointerAfterCancel=await page.evaluate(()=>window.__balanceActivePreviewQA.sample().pointer);
 await page.setViewportSize({width:793,height:393});
 const resized=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;q.resize();return q.sample().perf;});
 await page.reload();await page.waitForFunction(()=>!!window.__balanceActivePreviewQA);
 const reload=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;q.step(120);return q.sample();});
 const finite=sample=>Object.values(sample.rig.bodies).every(b=>[b.x,b.y,b.a].every(Number.isFinite));
 await page.goto('http://127.0.0.1:9021/lab/active.html?rigqa=1&facing=-1');
 await page.waitForFunction(()=>!!window.__balanceActivePreviewQA);
 const mirrored=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;
  q.step(120);q.impulse(-8);q.step(600);return q.sample();});
 const pass=errors.length===0&&finite(initial.after)&&finite(reload)&&finite(mirrored)&&
  mirrored.steps.completed>=1&&mirrored.mode.mode==='standing'&&
  initial.after.steps.completed>=1&&initial.after.rig.metrics.nonfinite===0&&
  pointerAfterRelease.starts>=1&&pointerAfterRelease.releases>=1&&
  pointerAfterCancel.cancels>=1&&resized.canvasPixels>0&&reload.perf.drawCalls>0;
 result={schema:'A2-playable-mobile-browser-smoke-v1',pass,
  recovery:initial.after.steps,pointerAfterRelease,pointerAfterCancel,
  resized:{canvasPixels:resized.canvasPixels,dpr:resized.dpr},
  reload:{drawCalls:reload.perf.drawCalls,mode:reload.mode.mode},
  mirrored:{completed:mirrored.steps.completed,mode:mirrored.mode.mode},errors};
 await page.close();
}finally{await browser.close();}
console.log(JSON.stringify(result,null,2));
if(!result.pass)process.exitCode=1;
