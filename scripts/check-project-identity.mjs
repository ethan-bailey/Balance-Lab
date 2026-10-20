/** Guard against future agents accidentally resurrecting legacy Balance Lab architecture. */
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../',import.meta.url);
const file=p=>new URL(p,root);
const read=p=>readFileSync(file(p),'utf8');
const requireFile=p=>{if(!existsSync(file(p)))throw Error('Missing project file '+p);};
for(const p of ['README.md','AGENTS.md','docs/PROJECT_CHARTER.md','docs/PHYSICS_AI_ROADMAP.md',
 'docs/ML_SIDE_PROFILE_EXPERIMENT.md','docs/LEGACY_INVENTORY.md','docs/history/README.md',
 'adapters/active-planck-v6.mjs','adapters/planck.mjs','browser/lab/active-lab.mjs'])requireFile(p);
for(const [p,required] of [
 ['README.md',['side-profile','combat','active-planck-v6.mjs']],
 ['AGENTS.md',['PROJECT_CHARTER.md','LEGACY_INVENTORY.md']],
 ['docs/PROJECT_CHARTER.md',['same physical rig','iPhone 16','side-profile']],
 ['docs/PHYSICS_AI_ROADMAP.md',['PROJECT_CHARTER.md']],
 ])for(const phrase of required)if(!read(p).includes(phrase))throw Error(`Identity drift: ${p} missing ${phrase}`);
for(const old of ['active-planck.mjs','active-planck-v2.mjs','active-planck-v3.mjs',
 'active-planck-v4.mjs','active-planck-v5.mjs']){
 requireFile('adapters/legacy/'+old);
 if(existsSync(file('adapters/'+old)))throw Error('Historical adapter reintroduced as active '+old);
}
const files=dir=>readdirSync(file(dir),{withFileTypes:true}).flatMap(x=>
 x.isDirectory()?files(dir+'/'+x.name):[dir+'/'+x.name]);
for(const p of [...files('tests'),...files('src'),...files('browser/lab'),...files('browser/tests')]){
 if(!p.endsWith('.mjs')||p.includes('node_modules'))continue;
 const s=read(p);
 if(/['"](?:\.\.\/)+adapters\/active-planck(?:-v[2345])?\.mjs['"]/.test(s))
  throw Error('Non-legacy import of obsolete adapter in '+p);
}
console.log('PASS: one Balance Lab identity, active v6 source, archived legacy adapters and documented release stages');
