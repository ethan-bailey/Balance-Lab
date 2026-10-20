import {chromium} from '/vercel/m2/node_modules/playwright/index.mjs';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:393,height:793},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const response=await page.goto('https://sling-lab-play.vercel.app/lab/?rigqa=1',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>!!window.__balanceRigQA,{timeout:15000});
const state=await page.evaluate(()=>({sample:window.__balanceRigQA.sample(),perf:window.__balancePerf()}));
console.log(JSON.stringify({status:response.status(),errors,ids:Object.keys(state.sample.bodies),revision:state.sample.m2Revision,characterId:state.sample.characterId,support:state.sample.support,perf:state.perf}));
await browser.close();
