/** A2 active-source parity: same acceptance code in Node and mobile Chromium.
 * Requires candidate HTTP server on localhost:9021. Does not deploy.
 */
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const nodeCases=[1,-1].map(facing=>JSON.parse(execFileSync(process.execPath,
 ['tests/a2-acceptance-gate.mjs',...(facing===-1?['--facing=-1']:[])],
 {cwd:fileURLToPath(new URL('../../',import.meta.url)),encoding:'utf8',timeout:30000})));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
let result;
try{
 const page=await browser.newPage({viewport:{width:393,height:793},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:9021/active-qa.html');
 const chromiumCases=await page.evaluate(async()=>{
  const {runA2PhysicalGate}=await import('/src/qa/a2-physical-gate.mjs');
  return [runA2PhysicalGate(1),runA2PhysicalGate(-1)];
 });
 const deltas=[];
 for(let i=0;i<2;i++)for(let j=0;j<4;j++){
  const node=nodeCases[i].cases[j],web=chromiumCases[i].cases[j];
  deltas.push({facing:chromiumCases[i].facing,impulse:node.impulse,
   nodePass:node.pass,browserPass:web.pass,physicalStep:web.physicalStep,
   sustained:web.sustained,numericallyBounded:web.numericallyBounded,
   footMatch:web.swingFoot===node.swingFoot,
   torsoYDelta:Math.abs(web.torsoY-node.torsoY),
   angleDelta:Math.abs(web.maxAngleAfter1Sec-node.maxAngleAfter1Sec),
   touchdownFrameDelta:Math.abs(web.touchdownFrame-node.touchdownFrame)});
 }
 const pass=errors.length===0&&chromiumCases.every(x=>x.pass)&&nodeCases.every(x=>x.pass)&&
  deltas.every(x=>x.nodePass&&x.browserPass&&x.physicalStep&&x.sustained&&
   x.numericallyBounded&&x.footMatch&&x.torsoYDelta<.005&&x.angleDelta<.02&&x.touchdownFrameDelta<=1);
 result={schema:'A2-active-source-Node-Chromium-parity-v1',pass,cases:deltas.length,deltas,errors};
 await page.close();
}finally{await browser.close();}
console.log(JSON.stringify(result,null,2));
if(!result.pass)process.exitCode=1;
