/** A2 T06 physical contact gate: identical acceptance in Node and browser. */
import {runA2PhysicalGate} from '../src/qa/a2-physical-gate.mjs';
if(process.argv.slice(2).some(a=>a!=='--facing=-1'))throw Error('Invalid facing argument');
const facing=process.argv.includes('--facing=-1')?-1:1;
const result=runA2PhysicalGate(facing);
console.log(JSON.stringify(result,null,2));
if(!result.pass)process.exitCode=1;
