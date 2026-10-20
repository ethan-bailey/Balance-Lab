/** Immutable joint-local pose clips. The physics solver remains authoritative. */
const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
function checkPose(p) {
 if(!p||typeof p!=='object'||Array.isArray(p))throw Error('Invalid pose');
 const out={};
 for(const [id,v] of Object.entries(p)){if(!id||!Number.isFinite(v))throw Error('Invalid joint angle');out[id]=v;}
 return Object.freeze(out);
}
export function createPoseClip(frames) {
 if(!Array.isArray(frames)||!frames.length)throw Error('Empty clip');
 let previous=-Infinity, ids;
 return Object.freeze(frames.map(f=>{
  if(!Number.isFinite(f.time)||f.time<0||f.time<=previous)throw Error('Invalid keyframe time');
  previous=f.time;
  const pose=checkPose(f.pose),keys=Object.keys(pose).sort().join(',');
  if(ids!==undefined&&ids!==keys)throw Error('Inconsistent joints');
  ids=keys;
  return Object.freeze({time:f.time,pose});
 }));
}
export function blendPose(a,b,weight) {
 if(!Number.isFinite(weight)||weight<0||weight>1)throw Error('Invalid blend weight');
 const x=checkPose(a),y=checkPose(b);
 if(Object.keys(x).sort().join(',')!==Object.keys(y).sort().join(','))throw Error('Inconsistent joints');
 const out={};
 for(const id of Object.keys(x))out[id]=x[id]+wrap(y[id]-x[id])*weight;
 return Object.freeze(out);
}
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
