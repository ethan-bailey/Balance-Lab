/** Safari-safe requestAnimationFrame lifecycle. Does not change physics state. */
export function createBrowserFrameDriver({scheduler, requestFrame, cancelFrame, documentRef, windowRef} = {}) {
  if (!scheduler || !['advance', 'pause', 'resume'].every(k => typeof scheduler[k] === 'function'))
    throw new TypeError('Invalid fixed-step scheduler');
  if (typeof requestFrame !== 'function' || typeof cancelFrame !== 'function')
    throw new TypeError('Missing requestAnimationFrame or cancelAnimationFrame');
  if (!documentRef?.addEventListener || !documentRef?.removeEventListener ||
      !windowRef?.addEventListener || !windowRef?.removeEventListener)
    throw new TypeError('Missing browser lifecycle event target');

  let running = false;
  let destroyed = false;
  let pending = null;
  let suspended = Boolean(documentRef.hidden);
  function cancelPending() {
    if (pending !== null) { cancelFrame(pending); pending = null; }
  }
  function queueFrame() {
    if (running && !suspended && pending === null) pending = requestFrame(tick);
  }
  function tick(timestampMs) {
    pending = null;
    if (!running || suspended) return;
    scheduler.advance(timestampMs);
    queueFrame();
  }
  function suspend() {
    if (suspended) return;
    suspended = true;
    cancelPending();
    scheduler.pause();
  }
  function wake() {
    if (!suspended) return;
    suspended = false;
    if (running) { scheduler.resume(); queueFrame(); }
  }
  function visibilityChange() { if (documentRef.hidden) suspend(); else wake(); }
  function pageHide() { suspend(); }
  function pageShow() { if (!documentRef.hidden) wake(); }
  documentRef.addEventListener('visibilitychange', visibilityChange);
  windowRef.addEventListener('pagehide', pageHide);
  windowRef.addEventListener('pageshow', pageShow);
  if (suspended) scheduler.pause();
  function start() {
    if (destroyed) throw new Error('Frame driver destroyed');
    if (running) return;
    running = true;
    if (!suspended) scheduler.resume();
    queueFrame();
  }
  function stop() {
    running = false;
    cancelPending();
    scheduler.pause();
  }
  function destroy() {
    if (destroyed) return;
    stop();
    destroyed = true;
    documentRef.removeEventListener('visibilitychange', visibilityChange);
    windowRef.removeEventListener('pagehide', pageHide);
    windowRef.removeEventListener('pageshow', pageShow);
  }
  return {start, stop, destroy, get running() { return running; }, get suspended() { return suspended; }};
}
