/** Ground contact and mass-weighted COM, in metres (Planck y-up).
 * Perception only: never pins or teleports bodies.
 */
export function estimateSupport(world,ground,parts,{horizonSeconds=0.18}={}){
 if(!Number.isFinite(horizonSeconds)||horizonSeconds<0||horizonSeconds>1)throw Error('Invalid prediction horizon');
 const touched=new Set();
 for(let c=world.getContactList();c;c=c.getNext()){
  if(!c.isTouching())continue;
  const a=c.getFixtureA().getBody(),b=c.getFixtureB().getBody();
  for(const id of ['footL','footR']){
   const foot=parts.get(id)?.body;
   if((a===ground&&b===foot)||(b===ground&&a===foot))touched.add(id);
  }
 }
 let mass=0,x=0,y=0,vx=0,vy=0;
 for(const {body} of parts.values()){
  const m=body.getMass(),p=body.getWorldCenter(),v=body.getLinearVelocity();
  mass+=m;x+=m*p.x;y+=m*p.y;vx+=m*v.x;vy+=m*v.y;
 }
 if(!(mass>0))throw Error('Zero rig mass');
 const com={x:x/mass,y:y/mass,vx:vx/mass,vy:vy/mass};
 let minX=Infinity,maxX=-Infinity;
 for(const id of touched){
  const {body,def}=parts.get(id),p=body.getPosition();
  const half=Math.abs(Math.cos(body.getAngle()))*def.w/2+Math.abs(Math.sin(body.getAngle()))*def.h/2;
  minX=Math.min(minX,p.x-half);maxX=Math.max(maxX,p.x+half);
 }
 const projectedX=com.x+com.vx*horizonSeconds;
 const margin=touched.size?Math.min(projectedX-minX,maxX-projectedX):null;
 return {com,contactCount:touched.size,feet:[...touched].sort(),support:touched.size?{minX,maxX,projectedX,margin}:null,margin};
}
