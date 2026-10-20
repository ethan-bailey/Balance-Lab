/** Browser pointer capture lifecycle; no engine or rendering dependencies. */
export function attachCanvasPointerInput(canvas,tracker,{documentRef=globalThis.document,windowRef=globalThis.window}={}){
 if(!canvas?.addEventListener||!tracker?.down||!tracker?.move||!tracker?.up)throw Error('Invalid pointer target');
 const original=canvas.style?.touchAction;
 if(canvas.style)canvas.style.touchAction='none';
 const down=e=>{
  if(!tracker.down(e))return;
  try{canvas.setPointerCapture?.(e.pointerId);}catch{}
  e.preventDefault?.();
 };
 const move=e=>{if(tracker.move(e))e.preventDefault?.();};
 const up=e=>{
  if(tracker.up(e))e.preventDefault?.();
  try{if(canvas.hasPointerCapture?.(e.pointerId))canvas.releasePointerCapture(e.pointerId);}catch{}
 };
 const cancel=e=>{tracker.lost(e);};
 const blur=()=>{tracker.cancel();};
 const hidden=()=>{if(documentRef?.hidden)tracker.cancel();};
 const handlers=[['pointerdown',down],['pointermove',move],['pointerup',up],
  ['pointercancel',cancel],['lostpointercapture',cancel]];
 for(const [type,fn] of handlers)canvas.addEventListener(type,fn,{passive:false});
 windowRef?.addEventListener?.('blur',blur);
 documentRef?.addEventListener?.('visibilitychange',hidden);
 return ()=>{
  tracker.cancel();
  for(const [type,fn] of handlers)canvas.removeEventListener(type,fn);
  windowRef?.removeEventListener?.('blur',blur);
  documentRef?.removeEventListener?.('visibilitychange',hidden);
  if(canvas.style)canvas.style.touchAction=original;
 };
}
