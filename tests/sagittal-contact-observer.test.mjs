import test from 'node:test';import assert from 'node:assert/strict';
import {createActiveRigWorld} from '../adapters/active-planck-v6.mjs';
import {createFacingRig} from '../src/config/facing-rig.mjs';
import {createSagittalRig} from '../src/config/sagittal-rig.mjs';
test('sagittal rig exposes real physical foot contact evidence without modifying support',()=>{
 for(const facing of [1,-1]){
  const w=createActiveRigWorld(createFacingRig(createSagittalRig(),facing));w.enableRecoverySteps();w.enableBalanceReflex({ankleGain:1.8,hipGain:.6,smoothingSeconds:.01});
  for(let t=0;t<1200;t++)w.step();
  const s=w.getFootContactDiagnostics();
  assert.equal(s.frames,1200);assert.ok(s.feet.footL.landings+s.feet.footR.landings>=2);
  assert.ok(s.feet.footL.groundedFrames+s.feet.footR.groundedFrames>200);
  assert.deepEqual(s.rawFeet,w.getSupport().feet);
  w.dispose();
 }
});
