/** Side-view animation correction and opt-in experimental reflex comparison. */
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];let result;
try{
 const page=await browser.newPage({viewport:{width:393,height:793},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:9021/lab/active.html?rigqa=1');
 await page.waitForFunction(()=>!!window.__balanceActivePreviewQA);
 const baseline=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;q.step(120);q.impulse(-8);q.step(600);const s=q.sample();return {mode:s.mode.mode,torsoY:s.rig.bodies.torso.y,assist:s.balanceAssist};});
 await page.locator('#balance').click();
 const active=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;q.reset();q.step(120);q.impulse(-8);q.step(600);const s=q.sample();return {mode:s.mode.mode,torsoY:s.rig.bodies.torso.y,assist:s.balanceAssist};});
 const afterReset=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;q.reset();return q.sample().balanceAssist;});
 await page.locator('#balance').click();
 const off=await page.evaluate(()=>window.__balanceActivePreviewQA.sample().balanceAssist);
 result={schema:'BalanceLab-balance-assist-browser-v1',baseline,active,afterReset,off,errors};
 result.pass=errors.length===0&&baseline.assist===false&&baseline.torsoY<.8&&active.assist===true&&active.torsoY>1&&afterReset===true&&off===false;
 console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
}finally{await browser.close();}
