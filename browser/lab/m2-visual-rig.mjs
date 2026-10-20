/** M2 visual-only rig: original 'Kite' character, dimensioned against RIG.
 * Rendering is pure Canvas 2D and never mutates Planck bodies, joints or masses.
 * All dimensions below are in meters, converted by the camera's pixels-per-meter.
 */
import {RIG} from './rig-config.mjs';
import {RIG_TOPOLOGY} from './rig-topology.mjs';

export const CHARACTER_ID='kite-trainee-v1';
export const CHARACTER_PALETTE=Object.freeze({
 outline:'#162a37',shadow:'#1d5265',suit:'#258b9b',suitLight:'#4ec1c4',
 undersuit:'#1a4052',trim:'#f1c67a',boot:'#354c67',bootHighlight:'#7388a3',
 glove:'#dce8db',hood:'#1c596a',face:'#c4e9df',eye:'#142c3b',cheek:'#e69c91'
});
const LAYERS=Object.freeze([
 'thighL','shinL','footL','upperArmL','forearmL','handL',
 'torso','thighR','shinR','footR','upperArmR','forearmR','handR'
]);
export const VISUAL_RIG=Object.freeze({
 id:CHARACTER_ID,head:{offsetY:.515,radius:.201},layers:LAYERS,
 style:'kite-hooded-trainee',concepts:Object.freeze([
  {id:'kite',label:'Kite',summary:'Hooded teal trainee, compact pads and expressive mask'},
  {id:'orbit',label:'Orbit',summary:'Lightweight explorer with a rounded helmet and cuffed suit'},
  {id:'moss',label:'Moss',summary:'Soft botanical guardian with tapered gloves and ankle wraps'}
 ])
});
export function validateVisualRig(rig=RIG,visual=VISUAL_RIG){
 const ids=rig.segments.map(s=>s.id),layers=visual.layers;
 if(ids.length!==layers.length||new Set(layers).size!==layers.length||ids.some(id=>!layers.includes(id)))throw Error('Visual layers must preserve all physical segment IDs');
 if(!Number.isFinite(visual.head.offsetY)||!Number.isFinite(visual.head.radius)||visual.head.radius<=0)throw Error('Invalid head geometry');
 if(!rig.segments.some(s=>s.id==='torso'))throw Error('Missing torso');
 return true;
}
export function proportionMetrics(rig=RIG,visual=VISUAL_RIG){
 validateVisualRig(rig,visual);
 const torso=rig.segments.find(s=>s.id==='torso');
 const footBottom=Math.min(...rig.segments.filter(s=>s.id.startsWith('foot')).map(s=>s.y-s.h/2));
 const top=torso.y+visual.head.offsetY+visual.head.radius;
 return {totalHeightM:top-footBottom,headDiameterM:2*visual.head.radius,headsTall:(top-footBottom)/(2*visual.head.radius),topY:top,bottomY:footBottom};
}
const rr=(c,x,y,w,h,r)=>{
 const q=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+q,y);c.lineTo(x+w-q,y);c.quadraticCurveTo(x+w,y,x+w,y+q);c.lineTo(x+w,y+h-q);c.quadraticCurveTo(x+w,y+h,x+w-q,y+h);c.lineTo(x+q,y+h);c.quadraticCurveTo(x,y+h,x,y+h-q);c.lineTo(x,y+q);c.quadraticCurveTo(x,y,x+q,y);c.closePath();
};
const ellipse=(c,x,y,rx,ry)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);};
function paddedSegment(c,id,w,h,p){
 const pal=CHARACTER_PALETTE;
 const leg=id.startsWith('thigh')||id.startsWith('shin');
 const upper=id.startsWith('upperArm');
 const fore=id.startsWith('forearm');
 const torso=id==='torso';
 const shoe=id.startsWith('foot');
 const hand=id.startsWith('hand');
 const left=id.endsWith('L');
 c.lineJoin='round';c.lineCap='round';c.strokeStyle=pal.outline;c.lineWidth=.018*p;
 if(torso){
  // Tapered chest, inset waist, and small fabric folds. Entirely inside the
  // torso's physical envelope apart from 1cm of decorative seam allowance.
  c.fillStyle=pal.undersuit;rr(c,-w*.50*p,-h*.49*p,w*p,h*.98*p,.12*p);c.fill();c.stroke();
  c.fillStyle=pal.suit;
  c.beginPath();c.moveTo(-w*.49*p,-h*.42*p);c.quadraticCurveTo(0,-h*.57*p,w*.49*p,-h*.42*p);
  c.lineTo(w*.34*p,h*.31*p);c.quadraticCurveTo(0,h*.44*p,-w*.34*p,h*.31*p);c.closePath();c.fill();
  c.fillStyle=pal.suitLight;rr(c,-w*.35*p,-h*.34*p,w*.16*p,h*.44*p,.045*p);c.fill();
  c.fillStyle=pal.trim;rr(c,-w*.42*p,h*.30*p,w*.84*p,.073*p,.027*p);c.fill();
  c.fillStyle=pal.undersuit;rr(c,-w*.08*p,h*.275*p,w*.16*p,.125*p,.015*p);c.fill();
 }else if(shoe){
  c.fillStyle=pal.boot;rr(c,-w*.50*p,-h*.49*p,w*p,h*.98*p,.045*p);c.fill();c.stroke();
  c.fillStyle=pal.bootHighlight;rr(c,-w*.40*p,-h*.28*p,w*.52*p,h*.22*p,.025*p);c.fill();
  c.fillStyle=pal.trim;rr(c,-w*.42*p,h*.27*p,w*.84*p,.065*p,.024*p);c.fill();
 }else if(hand){
  c.fillStyle=pal.glove;rr(c,-w*.47*p,-h*.46*p,w*.94*p,h*.89*p,.042*p);c.fill();c.stroke();
  const fingerW=w*.18*p;
  for(let i=0;i<3;i++){
   c.fillStyle=pal.glove;rr(c,(-.31+i*.22)*w*p,h*.30*p,fingerW,h*.24*p,.018*p);c.fill();c.stroke();
  }
  c.fillStyle=pal.glove;
  c.save();c.translate((left?.44:-.44)*w*p,h*.06*p);c.rotate(left?.38:-.38);
  rr(c,-fingerW*.5,-h*.10*p,fingerW*1.15,h*.40*p,.023*p);c.fill();c.stroke();c.restore();
  c.fillStyle=pal.trim;rr(c,-w*.46*p,-h*.47*p,w*.92*p,h*.14*p,.018*p);c.fill();
 }else{
  c.fillStyle=leg?pal.undersuit:pal.suit;
  rr(c,-w*.48*p,-h*.48*p,w*.96*p,h*.96*p,Math.min(w*.45,h*.22)*p);c.fill();c.stroke();
  c.fillStyle=leg?pal.suit:pal.suitLight;
  rr(c,-w*.29*p,-h*.39*p,w*.27*p,h*.64*p,.02*p);c.fill();
  if(leg||upper||fore){
   c.fillStyle=pal.trim;rr(c,-w*.43*p,-h*.43*p,w*.86*p,h*.12*p,.018*p);c.fill();
  }
 }
}
/** Draw one segment in local rigid-body coordinates. ctx already translated and rotated. */
export function drawCharacterSegment(ctx,id,w,h,pixelsPerMeter){
 if(!RIG_TOPOLOGY.segments.has(id))throw Error('Unknown visual segment '+id);
 if(![w,h,pixelsPerMeter].every(Number.isFinite)||w<=0||h<=0||pixelsPerMeter<=0)throw Error('Invalid visual scale');
 paddedSegment(ctx,id,w,h,pixelsPerMeter);
}
/** Torso-local head: rotate and translate with torso; no independent head body. */
export function drawCharacterHead(ctx,pixelsPerMeter,face={blink:false}){
 const p=pixelsPerMeter,rad=VISUAL_RIG.head.radius*p,pal=CHARACTER_PALETTE;
 ctx.save();ctx.translate(0,-VISUAL_RIG.head.offsetY*p);
 ctx.lineWidth=.019*p;ctx.strokeStyle=pal.outline;
 ctx.fillStyle=pal.hood;ellipse(ctx,0,0,rad,rad*.96);ctx.fill();ctx.stroke();
 ctx.fillStyle=pal.suitLight;
 ctx.beginPath();ctx.ellipse(-rad*.42,-rad*.36,rad*.18,rad*.27,-.42,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=pal.face;rr(ctx,-rad*.78,-rad*.12,rad*1.56,rad*.87,rad*.30);ctx.fill();ctx.stroke();
 ctx.fillStyle=pal.eye;ctx.strokeStyle=pal.eye;ctx.lineWidth=.012*p;
 for(const side of [-1,1]){
  if(face.blink){ctx.beginPath();ctx.moveTo(side*rad*.18,rad*.16);ctx.lineTo(side*rad*.51,rad*.16);ctx.stroke();}
  else{ellipse(ctx,side*rad*.34,rad*.12,rad*.083,rad*.12);ctx.fill();}
 }
 ctx.fillStyle=pal.cheek;ellipse(ctx,-rad*.61,rad*.34,rad*.095,rad*.05);ctx.fill();
 ellipse(ctx,rad*.61,rad*.34,rad*.095,rad*.05);ctx.fill();
 ctx.strokeStyle=pal.undersuit;ctx.lineWidth=.013*p;ctx.beginPath();ctx.arc(0,rad*.31,rad*.14,.12,Math.PI-.12);ctx.stroke();
 ctx.restore();
}
export function drawingOrder(){return [...VISUAL_RIG.layers];}
export const VISUAL_REFERENCE={physicsIds:RIG.segments.map(s=>s.id),jointIds:RIG.joints.map(j=>j.id),headAttachedTo:'torso'};
validateVisualRig();
