/** Isolated opt-in sagittal physical geometry on mobile viewport. */
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:393,height:793},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:9021/lab/active.html?rigqa=1');
 await page.waitForFunction(()=>!!window.__balanceActivePreviewQA);
 const baseline=await page.evaluate(()=>window.__balanceActivePreviewQA.sample());
 await page.locator('#balance').click();
 await page.locator('#physicalRig').click();
 const sagittal=await page.evaluate(()=>{const q=window.__balanceActivePreviewQA;q.step(1200);const s=q.sample();return {physicalRig:s.physicalRig,mode:s.mode.mode,torsoY:s.rig.bodies.torso.y,bodyCount:Object.keys(s.rig.bodies).length,steps:s.steps};});
 const pressed=await page.locator('#physicalRig').getAttribute('aria-pressed');
 await page.locator('#physicalRig').click();
 const after=await page.evaluate(()=>window.__balanceActivePreviewQA.sample().physicalRig);
 const result={schema:'BalanceLab-sagittal-rig-browser-v1',baseline:{rig:baseline.physicalRig,assist:baseline.balanceAssist},sagittal,pressed,after,errors};
 result.pass=baseline.physicalRig==='baseline'&&!baseline.balanceAssist&&sagittal.physicalRig==='sagittal'&&sagittal.mode==='standing'&&sagittal.torsoY>1.1&&sagittal.bodyCount===13&&pressed==='true'&&after==='baseline'&&!errors.length;
 console.log(JSON.stringify(result,null,2));if(!result.pass)process.exitCode=1;
}finally{await browser.close();}
