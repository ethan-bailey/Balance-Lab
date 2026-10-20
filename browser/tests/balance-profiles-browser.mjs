/** Mobile Chromium QA: deterministic A/B strength and smoothing modes. */
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:393,height:793},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:9021/lab/active.html?rigqa=1');
 await page.waitForFunction(()=>!!window.__balanceActivePreviewQA);
 const initial=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;return q.sample();});
 await page.locator('#balance').click();
 const strong=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;q.reset();q.step(120);q.impulse(-8);q.step(600);const s=q.sample();return {mode:s.mode.mode,y:s.rig.bodies.torso.y,profile:s.balanceProfile,assist:s.balanceAssist};});
 await page.locator('#balanceProfile').click();
 const smooth=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;q.reset();q.step(120);q.impulse(-8);q.step(600);const s=q.sample();return {mode:s.mode.mode,y:s.rig.bodies.torso.y,profile:s.balanceProfile,assist:s.balanceAssist};});
 const aria=await page.locator('#balanceProfile').getAttribute('aria-pressed');
 await page.locator('#balanceProfile').click();
 const after=await page.evaluate(()=>window.__balanceActivePreviewQA.sample().balanceProfile);
 const result={schema:'BalanceLab-balance-profiles-browser-v1',initial:{profile:initial.balanceProfile,assist:initial.balanceAssist},strong,smooth,aria,after,errors};
 result.pass=!initial.balanceAssist&&initial.balanceProfile==='strong'&&strong.mode==='standing'&&strong.y>1&&smooth.mode==='standing'&&smooth.y>1&&smooth.profile==='smooth'&&smooth.assist&&aria==='true'&&after==='strong'&&!errors.length;
 console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
}finally{await browser.close();}
