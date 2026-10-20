/** M2: solver-independent articulation graph compiled from the single RIG definition.
 * Stable IDs are preserved for the live Planck and fallback Rapier adapters.
 * This module does not alter body transforms, joint limits or collision filters.
 */
import {RIG} from './rig-config.mjs';

export function compileRigTopology(rig=RIG,{root='torso'}={}){
  if(!Array.isArray(rig?.segments)||!Array.isArray(rig?.joints))throw Error('Missing rig arrays');
  const segments=new Map(),joints=new Map(),parent=new Map(),children=new Map();
  for(const s of rig.segments){
    if(typeof s.id!=='string'||!s.id||segments.has(s.id))throw Error('Duplicate or missing segment ID: '+s.id);
    if(![s.x,s.y,s.w,s.h,s.mass].every(Number.isFinite)||s.w<=0||s.h<=0||s.mass<=0)throw Error('Invalid segment geometry: '+s.id);
    segments.set(s.id,s);children.set(s.id,[]);
  }
  if(!segments.has(root))throw Error('Missing root '+root);
  for(const j of rig.joints){
    if(typeof j.id!=='string'||!j.id||joints.has(j.id))throw Error('Duplicate or missing joint ID: '+j.id);
    if(!segments.has(j.a)||!segments.has(j.b)||j.a===j.b)throw Error('Invalid joint endpoints: '+j.id);
    if(![j.x,j.y,j.lower,j.upper].every(Number.isFinite)||j.lower>=j.upper)throw Error('Invalid joint limits/anchor: '+j.id);
    if(parent.has(j.b)||j.b===root)throw Error('Multiple parents or root parent: '+j.b);
    parent.set(j.b,j.a);children.get(j.a).push(j.b);joints.set(j.id,j);
  }
  if(rig.joints.length!==rig.segments.length-1)throw Error('Articulation must have n-1 joints');
  const order=[],visiting=new Set(),visited=new Set();
  const visit=id=>{
    if(visiting.has(id))throw Error('Articulation cycle at '+id);
    if(visited.has(id))return;
    visiting.add(id);order.push(id);
    for(const child of children.get(id))visit(child);
    visiting.delete(id);visited.add(id);
  };
  visit(root);
  if(visited.size!==segments.size)throw Error('Disconnected articulation: '+[...segments.keys()].filter(id=>!visited.has(id)).join(','));
  const totalMass=rig.segments.reduce((sum,s)=>sum+s.mass,0);
  const initialCOM={x:rig.segments.reduce((sum,s)=>sum+s.mass*s.x,0)/totalMass,
    y:rig.segments.reduce((sum,s)=>sum+s.mass*s.y,0)/totalMass};
  return Object.freeze({root,segments,joints,parent,children,order:Object.freeze(order),totalMass,initialCOM,
    parentOf(id){if(!segments.has(id))throw Error('Unknown segment '+id);return parent.get(id)??null;},
    chainToRoot(id){if(!segments.has(id))throw Error('Unknown segment '+id);const chain=[];let cur=id;
      while(cur!==null){chain.push(cur);cur=parent.get(cur)??null;}return chain;},
    adjacent(a,b){return parent.get(a)===b||parent.get(b)===a;}
  });
}
export const RIG_TOPOLOGY=compileRigTopology();
