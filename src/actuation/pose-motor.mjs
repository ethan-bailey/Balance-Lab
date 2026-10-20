const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
export function poseMotorCommand(s) {
 const {angle,angularVelocity,targetAngle,targetVelocity=0,kp=140,kd=12,maxSpeed=6,maxTorque=60,activation=1,speedGainScale=1/12}=s;
 const vals=[angle,angularVelocity,targetAngle,targetVelocity,kp,kd,maxSpeed,maxTorque,activation,speedGainScale];
 if(vals.some(v=>!Number.isFinite(v)))throw Error('Invalid motor input');
 if([kp,kd,maxSpeed,maxTorque,speedGainScale].some(v=>v<0)||activation<0||activation>1)throw Error('Invalid motor limits');
 return Object.freeze({
  speed:clamp((kp*wrap(targetAngle-angle)+kd*(targetVelocity-angularVelocity))*speedGainScale,-maxSpeed,maxSpeed),
  maxTorque:maxTorque*activation
 });
}
