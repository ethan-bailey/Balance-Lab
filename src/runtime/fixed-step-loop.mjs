/**
 * Balance Lab: allocation-bounded, physics-authoritative frame scheduler.
 * Physics always advances at 120 Hz; rendering may interpolate but never changes physics.
 * `advance()` returns a REUSED mutable frame object to avoid per-frame allocations.
 * The caller must not retain or mutate that object.
 */
export const PHYSICS_HZ = 120;
export const FIXED_STEP_SECONDS = 1 / PHYSICS_HZ;
export const FIXED_STEP_MS = 1000 / PHYSICS_HZ;

export function createFixedStepLoop({
  step,
  render = () => {},
  maxStepsPerFrame = 8,
  maxFrameDeltaMs = 100,
} = {}) {
  if (typeof step !== 'function' || typeof render !== 'function')
    throw new TypeError('step and render must be functions');
  if (!Number.isInteger(maxStepsPerFrame) || maxStepsPerFrame < 1 || maxStepsPerFrame > 32)
    throw new RangeError('maxStepsPerFrame must be an integer in [1,32]');
  if (!Number.isFinite(maxFrameDeltaMs) || maxFrameDeltaMs < FIXED_STEP_MS || maxFrameDeltaMs > 1000)
    throw new RangeError('maxFrameDeltaMs must be finite and within the safe range');

  let accumulatorMs = 0;
  let lastTimeMs = null;
  let paused = false;
  let totalSteps = 0;
  let frames = 0;
  let droppedMs = 0;
  let droppedBacklogSteps = 0;
  let clockRegressions = 0;
  let advancing = false;
  const frame = {steps: 0, alpha: 0, deltaMs: 0, droppedMs: 0, paused: false};
  const EPSILON_MS = 1e-7;

  function advance(timestampMs) {
    if (!Number.isFinite(timestampMs) || timestampMs < 0)
      throw new RangeError('timestamp must be finite and nonnegative');
    if (advancing) throw new Error('Reentrant frame advance');
    if (paused) {
      lastTimeMs = null;
      frame.steps = 0;
      frame.alpha = 0;
      frame.deltaMs = 0;
      frame.droppedMs = 0;
      frame.paused = true;
      return frame;
    }
    advancing = true;
    try {
      let deltaMs = 0;
      if (lastTimeMs !== null) {
        const rawDelta = timestampMs - lastTimeMs;
        if (rawDelta < 0) clockRegressions++;
        else {
          deltaMs = rawDelta;
          lastTimeMs = timestampMs;
        }
      } else lastTimeMs = timestampMs;
      const admittedMs = Math.min(deltaMs, maxFrameDeltaMs);
      let discardedMs = deltaMs - admittedMs;
      accumulatorMs += admittedMs;
      let steps = 0;
      while (accumulatorMs + EPSILON_MS >= FIXED_STEP_MS && steps < maxStepsPerFrame) {
        step(FIXED_STEP_SECONDS, totalSteps);
        accumulatorMs = Math.max(0, accumulatorMs - FIXED_STEP_MS);
        totalSteps++;
        steps++;
      }
      if (accumulatorMs + EPSILON_MS >= FIXED_STEP_MS) {
        const skipped = Math.floor((accumulatorMs + EPSILON_MS) / FIXED_STEP_MS);
        const skippedMs = skipped * FIXED_STEP_MS;
        accumulatorMs = Math.max(0, accumulatorMs - skippedMs);
        droppedBacklogSteps += skipped;
        discardedMs += skippedMs;
      }
      droppedMs += discardedMs;
      frames++;
      frame.steps = steps;
      frame.alpha = Math.max(0, Math.min(1, accumulatorMs / FIXED_STEP_MS));
      frame.deltaMs = deltaMs;
      frame.droppedMs = discardedMs;
      frame.paused = false;
      render(frame.alpha, frame);
      return frame;
    } finally { advancing = false; }
  }
  function pause() {
    paused = true;
    lastTimeMs = null;
    accumulatorMs = 0;
  }
  function resume() {
    paused = false;
    lastTimeMs = null;
    accumulatorMs = 0;
  }
  function reset() {
    pause();
    totalSteps = 0;
    frames = 0;
    droppedMs = 0;
    droppedBacklogSteps = 0;
    clockRegressions = 0;
    resume();
  }
  function snapshot() {
    return {paused, totalSteps, frames, droppedMs, droppedBacklogSteps,
      clockRegressions, accumulatorMs, lastTimeMs};
  }
  return {advance, pause, resume, reset, snapshot};
}
