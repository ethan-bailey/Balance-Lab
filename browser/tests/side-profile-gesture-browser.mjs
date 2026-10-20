/** Side-profile physical animation browser acceptance: same v6 rig, no snap. */
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[],errors=[];
try{
 const page=await browser.newPage({viewport:{width:393,height:793},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 for(const facing of [1,-1]){
  await page.goto('http://127.0.0.1:9021/lab/active.html?rigqa=1'+(facing===-1?'&facing=-1':''));
  await page.waitForFunction(()=>!!window.__balanceActivePreviewQA);
  const samples=[];
  for(const gesture of ['rest','brace','reach','guard','rest']){
   const button=page.locator(`[data-gesture="${gesture}"]`);
   await button.click();
   const x=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;q.step(60);return q.sample();});
   const joints=Object.values(x.rig.bodies);
   samples.push({gesture,active:x.gesture,mode:x.mode.mode,finite:joints.every(b=>[b.x,b.y,b.a].every(Number.isFinite)),
    torsoY:x.rig.bodies.torso.y,pressed:await button.getAttribute('aria-pressed')});
  }
  const push=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;q.impulse(3*(new URLSearchParams(location.search).get('facing')==='-1'?-1:1));q.step(480);return q.sample();});
  const result={facing,samples,afterPush:{mode:push.mode.mode,torsoY:push.rig.bodies.torso.y,steps:push.steps.completed}};
  result.pass=samples.every(s=>s.gesture===s.active&&s.pressed==='true'&&s.finite&&s.torsoY>.8)&&
   Number.isFinite(push.rig.bodies.torso.y)&&push.mode.mode==='standing';
  results.push(result);
 }
 const pass=results.every(r=>r.pass)&&errors.length===0;
 console.log(JSON.stringify({schema:'BalanceLab-side-profile-gesture-browser-v1',pass,results,errors},null,2));
 if(!pass)process.exitCode=1;
}finally{await browser.close();}
