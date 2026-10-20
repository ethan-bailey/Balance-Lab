/** Decision only. No body translation, teleportation or foot pinning. */
export function createBalanceState(){
 let mode='airborne',age=0;
 function update(s){
  const {dt,contactCount,margin,torsoAngle,angularVelocity,impactSpeed=0,grabbed=false,torsoHeight=null}=s;
  if(![dt,contactCount,torsoAngle,angularVelocity,impactSpeed].every(Number.isFinite)||dt<0||dt>.5||contactCount<0||contactCount>2)throw Error('Invalid sensor data');
  if(margin!==null&&!Number.isFinite(margin))throw Error('Invalid COM margin');
  if(torsoHeight!==null&&!Number.isFinite(torsoHeight))throw Error('Invalid torso height');
  age+=dt;const tilt=Math.abs(torsoAngle),spin=Math.abs(angularVelocity);
  let next=grabbed?'grabbed':contactCount===0?(tilt>1||spin>4?'tumbling':'airborne'):
    tilt>1.25||impactSpeed>3.5||(torsoHeight!==null&&torsoHeight<.55)?'fallen':
    impactSpeed>.4&&impactSpeed<2.5&&tilt<.75&&margin>=-.15?'catching':
    margin<-.05?(margin<-.5?'fallen':'stepping'):'standing';
  if(mode==='catching'&&next==='standing'&&age<.25)next='catching';
  const urgent=['grabbed','tumbling','fallen'].includes(next)||mode==='grabbed';
  if(next!==mode&&(urgent||age>=.14)){mode=next;age=0;}
  return {mode,age,canActuate:['standing','catching','stepping'].includes(mode)};
 }
 return {update,get mode(){return mode;},reset(){mode='airborne';age=0;}};
}
