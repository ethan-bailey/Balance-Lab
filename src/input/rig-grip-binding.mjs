import {createDragTracker} from './drag-tracker.mjs';
import {pickRigBody} from './rig-picking.mjs';
/** Binds the M3 pointer tracker to finite-force Planck rig grips.
 * Default release preserves solver velocity. Optional explicit flickGain
 * applies a separately tested, mass-scaled velocity-deficit impulse.
 */
export function createRigGripBinding({rig,toWorld,maxSpeed=12,flickGain=0}){
 if(!rig?.parts||typeof rig.grab!=='function'||typeof rig.moveGrab!=='function'||typeof rig.release!=='function'||typeof rig.impulse!=='function')throw Error('Invalid rig');
 if(!Number.isFinite(flickGain)||flickGain<0||flickGain>1)throw Error('Invalid flick gain');
 const tracker=createDragTracker({toWorld,maxSpeed,pick:p=>pickRigBody(rig.parts,p),
  onStart:(id,p)=>rig.grab(id,p,p),
  onMove:(_,p)=>rig.moveGrab({x:p.x,y:p.y}),
  onEnd:(id,result)=>{
   rig.release();
   if(result.cancelled||flickGain===0)return;
   const body=rig.parts.get(id).body,v=body.getLinearVelocity(),m=body.getMass();
   const dx=(result.vx-v.x)*m*flickGain,dy=(result.vy-v.y)*m*flickGain;
   if(Number.isFinite(dx)&&Number.isFinite(dy))rig.impulse(id,{x:dx,y:dy});
  }});
 return tracker;
}
