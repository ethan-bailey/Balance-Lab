/** Passive per-foot contact hysteresis and real touchdown/liftoff evidence.
 * Uses measured Planck contact flags only; never moves bodies or claims support.
 * Hysteresis is a diagnostic state, not an artificial ground constraint.
 */
export function createFootContactObserver({contactFrames=2,releaseFrames=3}={}){
 if(!Number.isInteger(contactFrames)||contactFrames<1||contactFrames>30||!Number.isInteger(releaseFrames)||releaseFrames<1||releaseFrames>30)throw Error('Invalid contact hysteresis');
 const footNames=['footL','footR'];
 const state=Object.fromEntries(footNames.map(id=>[id,{contact:false,contactRun:0,releaseRun:0,landings:0,lifts:0,groundedFrames:0,airFrames:0,lastEvent:null}]));
 let frames=0;
 function update(support){
  if(!support||!Array.isArray(support.feet)||support.feet.some(id=>!footNames.includes(id))||new Set(support.feet).size!==support.feet.length)throw Error('Invalid foot contacts');
  const raw=new Set(support.feet);frames++;
  for(const id of footNames){
   const s=state[id],touch=raw.has(id);
   s.contactRun=touch?s.contactRun+1:0;
   s.releaseRun=touch?0:s.releaseRun+1;
   if(!s.contact&&s.contactRun>=contactFrames){s.contact=true;s.landings++;s.lastEvent={type:'land',frame:frames};}
   if(s.contact&&s.releaseRun>=releaseFrames){s.contact=false;s.lifts++;s.lastEvent={type:'lift',frame:frames};}
   if(s.contact)s.groundedFrames++;else s.airFrames++;
  }
  return snapshot();
 }
 function snapshot(){
  return {frames,feet:Object.fromEntries(footNames.map(id=>[id,{...state[id],lastEvent:state[id].lastEvent?{...state[id].lastEvent}:null}])),stableFeet:footNames.filter(id=>state[id].contact),rawFeet:footNames.filter(id=>state[id].contactRun>0)};
 }
 return Object.freeze({update,snapshot});
}
