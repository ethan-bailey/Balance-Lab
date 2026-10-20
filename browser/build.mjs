import {mkdir,copyFile,cp,readFile,writeFile} from 'node:fs/promises';
await mkdir('dist/lab',{recursive:true});
await mkdir('dist/vendor',{recursive:true});
await copyFile('index.html','dist/index.html');
for(const f of ['index.html','lab.mjs','rig-config.mjs','rig-topology.mjs','support-geometry.mjs','m2-visual-rig.mjs'])
 await copyFile('lab/'+f,'dist/lab/'+f);
await copyFile('../src/physics/joint-motor.mjs','dist/lab/joint-motor.mjs');
await copyFile('node_modules/planck/dist/planck.mjs','dist/vendor/planck.mjs');
// A2 source-parity harness is opt-in and does not alter the M2 visual rig.
// The exact active source modules run in Chromium with the pinned Planck ESM.
await cp('../src','dist/src',{recursive:true,force:true});
await cp('../adapters','dist/adapters',{recursive:true,force:true});
await copyFile('../rig-config.mjs','dist/rig-config.mjs');
const planckAdapter=await readFile('dist/adapters/planck.mjs','utf8');
if(!planckAdapter.includes("from 'planck'"))throw Error('Planck adapter import not found');
await writeFile('dist/adapters/planck.mjs',planckAdapter.replace("from 'planck'","from '../vendor/planck.mjs'"));
await writeFile('dist/active-qa.html','<!doctype html><html><head><meta charset="utf-8"><title>Balance Lab A2 physics QA</title></head><body>A2 physics QA</body></html>');
console.log('Balance Lab M2 preview and A2 source-parity QA build generated');
