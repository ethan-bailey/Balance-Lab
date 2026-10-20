/** M4 perception only: read Planck post-solve impulses without mutating world in callbacks. */
export function attachFootImpactSensor(world,ground,parts){
 if(!world||!ground||!parts)throw Error('Missing world/ground/parts');
 const feet=['footL','footR'];
 let sample={footL:{events:0,normalImpulse:0},footR:{events:0,normalImpulse:0}};
 const callback=(contact,impulse)=>{
  const a=contact.getFixtureA().getBody(),b=contact.getFixtureB().getBody();
  let id=null;
  for(const foot of feet){
   const body=parts.get(foot)?.body;
   if((a===ground&&b===body)||(b===ground&&a===body)){id=foot;break;}
  }
  if(!id)return;
  let normal=0;
  for(const v of impulse.normalImpulses||[])if(Number.isFinite(v)&&v>0)normal+=v;
  sample[id].events++;sample[id].normalImpulse+=normal;
 };
 world.on('post-solve',callback);
 return {
  reset(){sample={footL:{events:0,normalImpulse:0},footR:{events:0,normalImpulse:0}};},
  snapshot(){return {footL:{...sample.footL},footR:{...sample.footR}};},
  detach(){world.off('post-solve',callback);}
 };
}
