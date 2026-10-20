/** Read-only accounting of actual Planck motor torque and relative angular speed.
 * Work is numerical quadrature, not a metabolic-energy model.
 */
export function createMotorTelemetry(ids) {
 if(!Array.isArray(ids)||!ids.length||ids.some(id=>typeof id!=='string'||!id)||new Set(ids).size!==ids.length)throw Error('Invalid telemetry joints');
 const empty=()=>Object.fromEntries(ids.map(id=>[id,{samples:0,netWorkJ:0,positiveWorkJ:0,negativeWorkJ:0,absoluteWorkJ:0,peakTorqueNm:0,peakPowerW:0,saturatedSamples:0}]));
 let joints=empty(),substeps=0;
 function sample(id,torque,omega,dt,limit){
  if(!Object.hasOwn(joints,id)||![torque,omega,dt,limit].every(Number.isFinite)||dt<=0||dt>1/30||limit<0)throw Error('Invalid motor telemetry sample');
  const work=torque*omega*dt,power=torque*omega;
  if(!Number.isFinite(work)||!Number.isFinite(power))throw Error('Invalid motor telemetry work');
  const row=joints[id];
  row.samples++;row.netWorkJ+=work;row.positiveWorkJ+=Math.max(0,work);
  row.negativeWorkJ+=Math.min(0,work);row.absoluteWorkJ+=Math.abs(work);
  row.peakTorqueNm=Math.max(row.peakTorqueNm,Math.abs(torque));
  row.peakPowerW=Math.max(row.peakPowerW,Math.abs(power));
  if(limit>0&&Math.abs(torque)>=limit*.98)row.saturatedSamples++;
 }
 function snapshot(){
  const result=Object.fromEntries(Object.entries(joints).map(([id,v])=>[id,{...v}]));
  const total={samples:0,netWorkJ:0,positiveWorkJ:0,negativeWorkJ:0,absoluteWorkJ:0,peakTorqueNm:0,peakPowerW:0,saturatedSamples:0};
  for(const row of Object.values(result))for(const key of Object.keys(total)){
   if(key.startsWith('peak'))total[key]=Math.max(total[key],row[key]);else total[key]+=row[key];
  }
  return {substeps,joints:result,total};
 }
 return {sample,nextSubstep(){substeps++;},snapshot,reset(){joints=empty();substeps=0;}};
}
