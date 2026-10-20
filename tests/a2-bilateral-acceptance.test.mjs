import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

// Full physically simulated recovery (not a scripted step-count assertion).
// Each gate separately verifies lift, real touchdown, displacement, upright
// support over the full five-second window and finite joint constraints.
for(const facing of [1,-1])test(`A2 bilateral physical recovery acceptance: facing ${facing}`,()=>{
 const output=execFileSync(process.execPath,
  ['tests/a2-acceptance-gate.mjs',...(facing===-1?['--facing=-1']:[])],
  {cwd:process.cwd(),encoding:'utf8',timeout:30000});
 const result=JSON.parse(output);
 assert.equal(result.cases.length,4);
 for(const c of result.cases){
  assert.equal(c.pass,true,`facing ${facing}, impulse ${c.impulse}: ${JSON.stringify(c)}`);
  assert.equal(c.physicalStep,true);
  assert.equal(c.sustained,true);
  assert.equal(c.numericallyBounded,true);
  assert.ok(c.touchdownFrame>=0);
 }
});
