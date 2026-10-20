/** True 2D profile presentation of the existing authoritative Planck humanoid.
 * Pure Canvas artwork: no body, collider, joint, mass, or pose mutation.
 * Facing only affects the silhouette and limb depth ordering.
 * Back limbs remain drawn from their actual independent physics bodies.
 */
import {RIG} from './rig-config.mjs';

export const SIDE_VIEW_ART_ID='balance-lab-human-profile-v1';
const ink='#141e28',cloth='#506b75',clothLight='#76919a',seam='#283d47',
      pants='#394b56',boot='#252e38',skin='#c5a087',hair='#29272b',glove='#8b8f88';
const roundRect=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,Math.max(0,r));};
const oval=(c,x,y,rx,ry)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);};
function fillStroke(c,fill,lineWidth){c.fillStyle=fill;c.strokeStyle=ink;c.lineWidth=lineWidth;c.fill();c.stroke();}
export function sideViewDrawingOrder(facing=1){
 if(facing!==1&&facing!==-1)throw Error('Invalid profile facing');
 // Two independent legs and arms, one behind the trunk, one in front.
 const back=facing===1?'R':'L',front=facing===1?'L':'R';
 return [`thigh${back}`,`shin${back}`,`foot${back}`,`upperArm${back}`,`forearm${back}`,`hand${back}`,
 'torso',`thigh${front}`,`shin${front}`,`foot${front}`,`upperArm${front}`,`forearm${front}`,`hand${front}`];
}
export function validateSideViewRig(rig=RIG){
 const ids=rig.segments.map(s=>s.id),draw=sideViewDrawingOrder();
 if(ids.length!==draw.length||new Set(draw).size!==draw.length||ids.some(id=>!draw.includes(id)))
  throw Error('Profile renderer requires the existing 13 physical segments');
 return true;
}
/** Segment coordinates: center origin, y down, long axis vertical. */
export function drawSideViewSegment(c,id,w,h,ppm,facing=1){
 if(!Number.isFinite(ppm)||ppm<=0||![1,-1].includes(facing))throw Error('Invalid profile renderer parameters');
 const x=w*ppm,y=h*ppm,line=Math.max(1,ppm*.014),isBack=id.endsWith(facing===1?'R':'L');
 c.save();c.lineJoin='round';c.lineCap='round';
 if(isBack)c.globalAlpha=.72;
 if(id==='torso'){
  // Side-on chest and abdomen: sternum toward facing, curved back opposite.
  c.beginPath();c.moveTo(-facing*x*.42,-y*.49);c.lineTo(facing*x*.23,-y*.49);
  c.quadraticCurveTo(facing*x*.59,-y*.27,facing*x*.49,-y*.03);
  c.lineTo(facing*x*.35,y*.39);c.lineTo(-facing*x*.30,y*.49);
  c.quadraticCurveTo(-facing*x*.52,y*.13,-facing*x*.42,-y*.49);c.closePath();
  fillStroke(c,cloth,line);
  c.strokeStyle=clothLight;c.lineWidth=line*1.2;c.beginPath();c.moveTo(facing*x*.23,-y*.33);c.lineTo(facing*x*.31,y*.08);c.stroke();
  c.strokeStyle=seam;c.lineWidth=line*.75;c.beginPath();c.moveTo(-facing*x*.25,y*.24);c.lineTo(facing*x*.33,y*.24);c.stroke();
  c.fillStyle=boot;roundRect(c,-x*.38,y*.32,x*.76,y*.08,y*.025);c.fill();
 }else if(id.startsWith('foot')){
  // Anatomical ankle and forward toe: unmistakable profile direction.
  c.beginPath();c.moveTo(-facing*x*.43,-y*.39);c.lineTo(facing*x*.16,-y*.39);
  c.lineTo(facing*x*.47,-y*.07);c.lineTo(facing*x*.50,y*.33);
  c.quadraticCurveTo(facing*x*.44,y*.49,facing*x*.23,y*.49);
  c.lineTo(-facing*x*.49,y*.48);c.closePath();fillStroke(c,boot,line);
  c.strokeStyle=clothLight;c.lineWidth=line*.9;c.beginPath();c.moveTo(-facing*x*.3,y*.33);c.lineTo(facing*x*.41,y*.33);c.stroke();
 }else if(id.startsWith('hand')){
  c.save();c.translate(facing*x*.04,y*.05);c.rotate(-facing*.18);
  roundRect(c,-x*.34,-y*.43,x*.68,y*.84,x*.23);fillStroke(c,glove,line);
  c.strokeStyle=seam;c.lineWidth=line*.7;c.beginPath();c.moveTo(-x*.25,y*.12);c.lineTo(x*.25,y*.12);c.stroke();c.restore();
 }else{
  const leg=id.startsWith('thigh')||id.startsWith('shin');
  const arm=id.startsWith('upperArm')||id.startsWith('forearm');
  roundRect(c,-x*.46,-y*.50,x*.92,y*.98,Math.min(x*.38,y*.13));
  fillStroke(c,leg?pants:arm?cloth:glove,line);
  if(leg){c.fillStyle=clothLight;roundRect(c,-x*.30,-y*.30,x*.20,y*.32,x*.05);c.fill();}
  if(id.startsWith('forearm')){c.strokeStyle=seam;c.lineWidth=line*.7;c.beginPath();c.moveTo(-x*.36,y*.23);c.lineTo(x*.35,y*.23);c.stroke();}
 }
 c.restore();
}
/** Head is torso-attached, with one eye, one ear, a nose and a profile jaw. */
export function drawSideViewHead(c,ppm,facing=1){
 if(!Number.isFinite(ppm)||ppm<=0||![1,-1].includes(facing))throw Error('Invalid profile head');
 const p=ppm,f=facing;c.save();c.translate(0,-.52*p);
 c.lineJoin='round';c.lineCap='round';
 // Neck is entirely cosmetic; remains attached to the physical torso.
 c.fillStyle=skin;roundRect(c,-.055*p,.10*p,.12*p,.19*p,.025*p);c.fill();
 c.beginPath();c.moveTo(-f*.14*p,-.15*p);c.quadraticCurveTo(-f*.21*p,-.07*p,-f*.17*p,.065*p);
 c.lineTo(-f*.11*p,.14*p);c.lineTo(f*.07*p,.145*p);
 c.quadraticCurveTo(f*.15*p,.12*p,f*.155*p,.055*p);
 c.lineTo(f*.225*p,.025*p);c.lineTo(f*.15*p,-.025*p);
 c.quadraticCurveTo(f*.19*p,-.15*p,f*.065*p,-.19*p);
 c.quadraticCurveTo(-f*.07*p,-.245*p,-f*.14*p,-.15*p);c.closePath();fillStroke(c,skin,.012*p);
 c.beginPath();c.moveTo(-f*.16*p,-.05*p);c.quadraticCurveTo(-f*.23*p,-.23*p,-f*.045*p,-.22*p);
 c.quadraticCurveTo(f*.115*p,-.245*p,f*.15*p,-.125*p);
 c.lineTo(f*.09*p,-.145*p);c.quadraticCurveTo(-f*.045*p,-.165*p,-f*.08*p,-.065*p);c.closePath();
 c.fillStyle=hair;c.fill();
 oval(c,-f*.125*p,-.003*p,.038*p,.052*p);c.fillStyle=skin;c.fill();c.strokeStyle=seam;c.lineWidth=.008*p;c.stroke();
 oval(c,f*.083*p,-.047*p,.012*p,.017*p);c.fillStyle=ink;c.fill();
 c.strokeStyle=seam;c.lineWidth=.007*p;c.beginPath();c.moveTo(f*.11*p,.08*p);c.lineTo(f*.15*p,.08*p);c.stroke();
 c.restore();
}
validateSideViewRig();
