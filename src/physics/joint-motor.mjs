/** Shared bounded joint controller for browser and headless Planck solvers.
 * Motor torque remains finite and external forces can overcome it.
 */
export function jointMotorCommand({angle,velocity,lower,upper,kp,kd,speedGainScale,maxSpeed,limitGuard,limitCorrectionSpeed=3,requestedSpeed}) {
 const values=[angle,velocity,lower,upper,kp,kd,speedGainScale,maxSpeed,limitGuard,limitCorrectionSpeed];
 if(!values.every(Number.isFinite)||lower>upper||maxSpeed<=0||limitGuard<0||limitCorrectionSpeed<=0)throw Error('Invalid joint motor input');
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const wrapped=Math.atan2(Math.sin(angle),Math.cos(angle));
 let speed=clamp((-kp*wrapped-kd*velocity)*speedGainScale,-maxSpeed,maxSpeed);
 if(requestedSpeed!==undefined){if(!Number.isFinite(requestedSpeed))throw Error('Invalid requested motor speed');speed=clamp(requestedSpeed,-maxSpeed,maxSpeed);}
 const upperActive=angle>upper-limitGuard&&velocity>0;
 const lowerActive=angle<lower+limitGuard&&velocity<0;
 if(upperActive)speed=Math.min(speed,-clamp((angle-upper+limitGuard)*24+velocity*.8,0,limitCorrectionSpeed));
 if(lowerActive)speed=Math.max(speed,clamp((lower+limitGuard-angle)*24-velocity*.8,0,limitCorrectionSpeed));
 return {speed,limitActive:upperActive||lowerActive};
}
