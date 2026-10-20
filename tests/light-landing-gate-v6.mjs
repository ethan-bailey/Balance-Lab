import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
const records=[];
for(let i=0;i<20;i++){
 const r=createActiveRigWorld();r.step(120);
 const h=.04+.01*(i%10);
 for(const {body} of r.parts.values()){const p=body.getPosition();body.setTransform({x:p.x,y:p.y+h},body.getAngle());}
 r.step(600);const s=r.snapshot(),mode=r.getState().mode,diag=r.getDiagnostics();
 const ok=mode==='standing'&&s.bodies.torso.y>1.15&&Math.abs(s.bodies.torso.x)<.4&&s.metrics.nonfinite===0&&diag.modeCounts.catching>0;
 records.push({i,h,ok,mode,x:s.bodies.torso.x,y:s.bodies.torso.y,catchFrames:diag.modeCounts.catching||0});r.dispose();
}
const passed=records.filter(x=>x.ok).length;
console.log(JSON.stringify({passed,total:20,failures:records.filter(x=>!x.ok)}));if(passed!==20)process.exitCode=1;
