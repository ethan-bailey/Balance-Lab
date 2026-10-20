/** Browser pointer-capture lifecycle; no engine or rendering dependencies.
 * Only the accepted pointer owns capture. All terminal paths release it.
 */
export function attachCanvasPointerInput(canvas,tracker,{documentRef=globalThis.document,windowRef=globalThis.window}={}){
 if(!canvas?.addEventListener||!tracker?.down||!tracker?.move||!tracker?.up||!tracker?.lost||!tracker?.cancel)throw Error('Invalid pointer target');
 const original=canvas.style?.touchAction;
 if(canvas.style)canvas.style.touchAction='none';
 let owner=null;
 const releaseCapture=id=>{
  if(id===null)return;
  try{if(canvas.hasPointerCapture?.(id))canvas.releasePointerCapture?.(id);}catch{}
 };
 const cancelOwner=()=>{
  if(owner===null)return;
  const id=owner;owner=null;
  try{tracker.cancel();}finally{releaseCapture(id);}
 };
 const down=e=>{
  if(owner!==null||!tracker.down(e))return;
  owner=e.pointerId;
  try{canvas.setPointerCapture?.(owner);}catch{}
  e.preventDefault?.();
 };
 const move=e=>{if(e.pointerId===owner&&tracker.move(e))e.preventDefault?.();};
 const up=e=>{
  if(e.pointerId!==owner)return;
  const id=owner;owner=null;
  try{if(tracker.up(e))e.preventDefault?.();}finally{releaseCapture(id);}
 };
 const cancel=e=>{
  if(e.pointerId!==owner)return;
  const id=owner;owner=null;
  try{tracker.lost(e);}finally{releaseCapture(id);}
 };
 const blur=()=>cancelOwner();
 const hidden=()=>{if(documentRef?.hidden)cancelOwner();};
 const handlers=[['pointerdown',down],['pointermove',move],['pointerup',up],
  ['pointercancel',cancel],['lostpointercapture',cancel]];
 for(const [type,fn] of handlers)canvas.addEventListener(type,fn,{passive:false});
 windowRef?.addEventListener?.('blur',blur);
 documentRef?.addEventListener?.('visibilitychange',hidden);
 return ()=>{
  cancelOwner();
  for(const [type,fn] of handlers)canvas.removeEventListener(type,fn);
  windowRef?.removeEventListener?.('blur',blur);
  documentRef?.removeEventListener?.('visibilitychange',hidden);
  if(canvas.style)canvas.style.touchAction=original;
 };
}
