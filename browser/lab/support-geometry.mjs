/** M2: passive ground-support geometry. It reports evidence; it NEVER pins a foot.
 * Contact booleans must come from the physics engine. Foot bounds are estimated
 * from rigid segment shapes; exact contact-manifold points are not yet sampled.
 */
import {RIG} from './rig-config.mjs';
import {RIG_TOPOLOGY} from './rig-topology.mjs';

export function supportGeometry(feet,{comX,comVx=0,predictSeconds=.18}={}){
  if(!Array.isArray(feet)||feet.length!==2)throw Error('Expected two foot samples');
  if(![comX,comVx,predictSeconds].every(Number.isFinite)||predictSeconds<0)throw Error('Invalid COM prediction');
  let left=Infinity,right=-Infinity,contactCount=0;
  const samples=feet.map(f=>{
    const seg=RIG_TOPOLOGY.segments.get(f.id);
    if(!seg||!f.id.startsWith('foot')||![f.x,f.y,f.angle].every(Number.isFinite)||typeof f.contact!=='boolean')throw Error('Invalid foot state');
    const radiusX=(Math.abs(Math.cos(f.angle))*seg.w+Math.abs(Math.sin(f.angle))*seg.h)/2;
    const footprint={id:f.id,contact:f.contact,left:f.x-radiusX,right:f.x+radiusX,
      approximation:'oriented-box-projection'};
    if(f.contact){contactCount++;left=Math.min(left,footprint.left);right=Math.max(right,footprint.right);}
    return footprint;
  });
  const predictedComX=comX+comVx*predictSeconds;
  return {contactCount,hasSupport:contactCount>0,left:contactCount?left:null,right:contactCount?right:null,
    predictedComX,margin:contactCount?Math.min(predictedComX-left,right-predictedComX):null,
    predictedOutside:contactCount?predictedComX<left||predictedComX>right:null,
    footprints:samples,contactPrecision:'estimated-box-not-manifold'};
}

export function supportFromRigBodies(parts,contact,comX,comVx=0){
  if(typeof contact!=='function')throw Error('Missing contact sensor');
  return supportGeometry(['footL','footR'].map(id=>{
    const body=parts[id];if(!body)throw Error('Missing foot body '+id);
    const pos=body.pos();return {id,x:pos.x,y:pos.y,angle:body.angle(),contact:!!contact(id)};
  }),{comX,comVx});
}
