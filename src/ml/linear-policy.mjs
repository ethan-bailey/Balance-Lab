/** Small trainable baseline for 2D motor residual control.
 * A linear-tanh policy is deliberately interpretable and CPU-cheap. It is not
 * represented as a production-quality trained human movement controller.
 */
import {POLICY_JOINTS,POLICY_OBSERVATION_SIZE} from './side-profile-policy.mjs';
export const LINEAR_FEATURE_INDICES=Object.freeze([0,1,2,4,6,7]);
export const LINEAR_WEIGHT_COUNT=POLICY_JOINTS.length*LINEAR_FEATURE_INDICES.length;
export function createLinearMotorPolicy(weights){
 if(!weights||weights.length!==LINEAR_WEIGHT_COUNT||Array.from(weights).some(x=>!Number.isFinite(x)||Math.abs(x)>20))
  throw Error('Invalid linear policy weights');
 const w=Float64Array.from(weights),n=LINEAR_FEATURE_INDICES.length;
 return Object.freeze({predict(obs){
  if(!obs||obs.length!==POLICY_OBSERVATION_SIZE||Array.from(obs).some(x=>!Number.isFinite(x)))
   throw Error('Invalid linear policy observation');
  return POLICY_JOINTS.map((_,i)=>{
   let value=0;for(let j=0;j<n;j++)value+=w[i*n+j]*obs[LINEAR_FEATURE_INDICES[j]];
   return Math.tanh(value);
  });
 }});
}
