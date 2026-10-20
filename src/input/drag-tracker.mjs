/** M3: deterministic pointer state, no physics writes or hidden anchors. */
export function createDragTracker({toWorld,pick,onStart=()=>{},onMove=()=>{},onEnd=()=>{},maxSpeed=12}){
 if(typeof toWorld!=='function'||typeof pick!=='function'||!Number.isFinite(maxSpeed)||maxSpeed<=0)throw Error('Invalid tracker config');
 let active=null;const metrics={starts:0,moves:0,releases:0,cancels:0,ignored:0};
 const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 function sample(e){
  if(!e||!Number.isFinite(e.clientX)||!Number.isFinite(e.clientY)||!Number.isFinite(e.timeStamp))return null;
  const p=toWorld(e.clientX,e.clientY);
  return finite(p)?{x:p.x,y:p.y,t:e.timeStamp}:null;
 }
 function down(e){
  if(active){metrics.ignored++;return false;}
  const p=sample(e);if(!p)return false;
  const id=pick(p);if(!id)return false;
  active={pointerId:e.pointerId,id,history:[p],latest:p};metrics.starts++;onStart(id,p);return true;
 }
 function move(e){
  if(!active||active.pointerId!==e.pointerId){metrics.ignored++;return false;}
  const p=sample(e);if(!p||p.t<active.latest.t){metrics.ignored++;return false;}
  active.latest=p;active.history.push(p);
  while(active.history.length>8||active.history.length>2&&p.t-active.history[0].t>90)active.history.shift();
  metrics.moves++;onMove(active.id,p);return true;
 }
 function finish(e,cancelled=false){
  if(!active||e&&e.pointerId!==active.pointerId)return false;
  if(!cancelled&&e){const p=sample(e);if(p&&p.t>=active.latest.t){active.latest=p;active.history.push(p);}}
  const {id,latest,history}=active;active=null;
  let vx=0,vy=0;
  if(!cancelled&&history.length>1){
   const first=history[0],dt=(latest.t-first.t)/1000;
   if(dt>0){vx=(latest.x-first.x)/dt;vy=(latest.y-first.y)/dt;}
   const speed=Math.hypot(vx,vy);
   if(speed>maxSpeed){vx*=maxSpeed/speed;vy*=maxSpeed/speed;}
  }
  if(cancelled)metrics.cancels++;else metrics.releases++;
  onEnd(id,{x:latest.x,y:latest.y,vx,vy,cancelled});return true;
 }
 return {down,move,up:e=>finish(e,false),cancel:()=>finish(null,true),lost:e=>finish(e,true),metrics,get active(){return active!==null;}};
}
