/** Playable 2D profile presentation and physics interaction smoke on both facings. */
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
  const data=await page.evaluate(()=>{
   const q=window.__balanceActivePreviewQA;
   const canvas=document.querySelector('#scene');
   q.step(120);const before=q.sample();
   const pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
   let distinct=0;const colors=new Set();
   for(let y=Math.floor(canvas.height*.12);y<Math.floor(canvas.height*.8);y+=7)
    for(let x=Math.floor(canvas.width*.15);x<Math.floor(canvas.width*.85);x+=7){const i=(y*canvas.width+x)*4;colors.add(`${pixels[i]},${pixels[i+1]},${pixels[i+2]}`);}
   q.setGesture('guard');q.step(120);const after=q.sample();
   return {before:before.mode.mode,after:after.mode.mode,torsoY:after.rig.bodies.torso.y,
    finite:Object.values(after.rig.bodies).every(b=>[b.x,b.y,b.a].every(Number.isFinite)),
    gesture:after.gesture,distinctColors:colors.size,dimensions:[canvas.width,canvas.height]};
  });
  const result={facing,...data,pass:data.finite&&data.distinctColors>6&&data.gesture==='guard'&&data.torsoY>.8};
  results.push(result);
 }
 const pass=results.every(r=>r.pass)&&errors.length===0;
 console.log(JSON.stringify({schema:'BalanceLab-true-side-view-profile-browser-v1',pass,results,errors},null,2));
 if(!pass)process.exitCode=1;
}finally{await browser.close();}
