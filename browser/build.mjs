import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist/lab',{recursive:true});
await mkdir('dist/vendor',{recursive:true});
await copyFile('index.html','dist/index.html');
for(const f of ['index.html','lab.mjs','rig-config.mjs','rig-topology.mjs','support-geometry.mjs','m2-visual-rig.mjs'])
 await copyFile('lab/'+f,'dist/lab/'+f);
await copyFile('../src/physics/joint-motor.mjs','dist/lab/joint-motor.mjs');
await copyFile('node_modules/planck/dist/planck.mjs','dist/vendor/planck.mjs');
console.log('Balance Lab M2 Kite provisional build generated');
