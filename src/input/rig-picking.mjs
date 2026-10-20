/** Exact 2D rectangle hit-picking in body-local coordinates. No physics mutation. */
export function pickRigBody(parts,point,{padding=.025}={}){
 if(!parts||!point||![point.x,point.y,padding].every(Number.isFinite)||padding<0)throw Error('Invalid hit query');
 let best=null,score=Infinity;
 for(const [id,{body,def}] of parts){
  const p=body.getPosition(),a=body.getAngle(),dx=point.x-p.x,dy=point.y-p.y;
  const x=Math.cos(a)*dx+Math.sin(a)*dy,y=-Math.sin(a)*dx+Math.cos(a)*dy;
  if(Math.abs(x)>def.w/2+padding||Math.abs(y)>def.h/2+padding)continue;
  const normalized=(x/(def.w/2+padding))**2+(y/(def.h/2+padding))**2;
  if(normalized<score){score=normalized;best=id;}
 }
 return best;
}
