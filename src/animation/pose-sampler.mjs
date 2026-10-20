/** Immutable joint-local reference clips. No writes to physics bodies. */
const wrap = x => Math.atan2(Math.sin(x), Math.cos(x));
function checkPose(p) {
 if(!p || typeof p!=='object' || Array.isArray(p)) throw Error('Invalid pose');
 const out={};
 for(const [id,v] of Object.entries(p)){
  if(!id || !Number.isFinite(v)) throw Error('Invalid joint angle');
  out[id]=v;
 }
 return Object.freeze(out);
}
function checkVelocity(v,pose) {
 if(v===undefined) return undefined;
 const out=checkPose(v);
 if(Object.keys(out).sort().join(',')!==Object.keys(pose).sort().join(','))
  throw Error('Inconsistent velocity joints');
 return out;
}
export function createPoseClip(frames) {
 if(!Array.isArray(frames)||!frames.length) throw Error('Empty clip');
 let previous=-Infinity, ids;
 return Object.freeze(frames.map(f=>{
  if(!f||!Number.isFinite(f.time)||f.time<0||f.time<=previous)
   throw Error('Invalid keyframe time');
  previous=f.time;
  const pose=checkPose(f.pose),keys=Object.keys(pose).sort().join(',');
  if(ids!==undefined&&ids!==keys) throw Error('Inconsistent joints');
  ids=keys;
  const velocity=checkVelocity(f.velocity,pose);
  return Object.freeze(velocity===undefined?{time:f.time,pose}:{time:f.time,pose,velocity});
 }));
}
export function blendPose(a,b,weight) {
 if(!Number.isFinite(weight)||weight<0||weight>1) throw Error('Invalid blend weight');
 const x=checkPose(a),y=checkPose(b);
 if(Object.keys(x).sort().join(',')!==Object.keys(y).sort().join(','))
  throw Error('Inconsistent joints');
 const out={};
 for(const id of Object.keys(x)) out[id]=x[id]+wrap(y[id]-x[id])*weight;
 return Object.freeze(out);
}
function interval(a,b,time) {
 const dt=b.time-a.time,u=(time-a.time)/dt;
 const pose={},velocity={};
 for(const id of Object.keys(a.pose)){
  const delta=wrap(b.pose[id]-a.pose[id]);
  if(a.velocity&&b.velocity){
   const v0=a.velocity[id],v1=b.velocity[id],u2=u*u,u3=u2*u;
   pose[id]=a.pose[id]+(3*u2-2*u3)*delta+(u3-2*u2+u)*dt*v0+(u3-u2)*dt*v1;
   velocity[id]=((6*u-6*u2)*delta+(3*u2-4*u+1)*dt*v0+(3*u2-2*u)*dt*v1)/dt;
  }else{
   pose[id]=a.pose[id]+u*delta;
   velocity[id]=delta/dt;
  }
 }
 return Object.freeze({pose:Object.freeze(pose),velocity:Object.freeze(velocity)});
}
function endpoint(f){
 return Object.freeze({pose:f.pose,velocity:f.velocity??Object.freeze(Object.fromEntries(Object.keys(f.pose).map(id=>[id,0])))});
}
/** Returns immutable {pose,velocity}, with angular velocity in rad/s.
 * Explicit endpoint velocities use cubic Hermite interpolation; otherwise
 * shortest-arc linear interpolation yields a constant per-segment velocity.
 * loopBlendSeconds > 0 physically closes a cyclic reference over an
 * additional seam interval without a discontinuous reference-angle jump.
 */
export function samplePoseFrame(clip,time,{loop=false,loopBlendSeconds=0}={}){
 if(!Array.isArray(clip)||!clip.length||!Number.isFinite(time)||typeof loop!=='boolean'||
    !Number.isFinite(loopBlendSeconds)||loopBlendSeconds<0||loopBlendSeconds>5||
    (!loop&&loopBlendSeconds>0)) throw Error('Invalid pose sample');
 const first=clip[0],last=clip.at(-1),span=last.time-first.time;
 if(loop&&span>0){
  const period=span+loopBlendSeconds;
  time=first.time+((time-first.time)%period+period)%period;
  if(time>last.time && loopBlendSeconds>0)
   return interval(last,{time:last.time+loopBlendSeconds,pose:first.pose,velocity:first.velocity},time);
 }
 if(time<=first.time)return endpoint(first);
 if(time>=last.time)return endpoint(last);
 let lo=0,hi=clip.length-1;
 while(hi-lo>1){const m=(hi+lo)>>1;if(clip[m].time<=time)lo=m;else hi=m;}
 return interval(clip[lo],clip[hi],time);
}
/** Legacy angle-only API preserved for pinned M2 comparison behavior. */
export function samplePose(clip,time,{loop=false}={}) {
 if(!Array.isArray(clip)||!clip.length||!Number.isFinite(time))throw Error('Invalid sample');
 const first=clip[0],last=clip.at(-1),span=last.time-first.time;
 if(loop&&span>0)time=first.time+((time-first.time)%span+span)%span;
 if(time<=first.time)return first.pose;
 if(time>=last.time)return last.pose;
 let lo=0,hi=clip.length-1;
 while(hi-lo>1){const m=(hi+lo)>>1;if(clip[m].time<=time)lo=m;else hi=m;}
 return blendPose(clip[lo].pose,clip[hi].pose,(time-clip[lo].time)/(clip[hi].time-clip[lo].time));
}
