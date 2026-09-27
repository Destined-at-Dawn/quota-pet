(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PetContract=factory();})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
// Production adapter promoted from the reviewed study prototype. Never executes pack scripts.
const ID=/^[a-z0-9][a-z0-9_-]{0,63}$/;
const pathOk=p=>typeof p==='string'&&p.length<240&&!p.includes('\\')&&!p.includes(':')&&!p.startsWith('/')&&p.split('/').every(x=>x&&x!=='.'&&x!=='..');
const ROWS=Object.freeze(['idle','running-right','running-left','waving','jumping','failed','waiting','running','review']);
const FRAMES=Object.freeze([6,8,8,4,5,8,6,6,6]);
function validatePack(value){
 if(!value||value.version!==1||!ID.test(value.id||'')||typeof value.name!=='string'||!value.name.trim()||value.name.length>80)throw Error('INVALID_PACK');
 if(!['layered-svg','codex-atlas-v1','transparent-video'].includes(value.renderer))throw Error('UNSUPPORTED_RENDERER');
 if(!value.assets||!pathOk(value.assets.idle))throw Error('INVALID_ASSET');
 for(const path of Object.values(value.assets))if(!pathOk(path))throw Error('INVALID_ASSET');
 if(!value.provenance||typeof value.provenance.assetLicense!=='string'||!value.provenance.assetLicense.trim())throw Error('ASSET_LICENSE_REQUIRED');
 if(value.renderer==='codex-atlas-v1'&&(value.atlas?.width!==1536||value.atlas?.height!==1872||value.atlas?.columns!==8||value.atlas?.rows!==9))throw Error('ATLAS_CONTRACT_MISMATCH');
 // Runtime loader still must decode/check the image and real alpha channel before accepting it.
 return structuredClone(value);
}
function filterCatalog(packs,query=''){
 const seen=new Set();return packs.map(validatePack).filter(p=>{if(seen.has(p.id))return false;seen.add(p.id);return (p.id+' '+p.name+' '+(p.description||'')).toLowerCase().includes(query.trim().toLowerCase());});
}
function atlasFrame(state,frame){
 const row=ROWS.indexOf(state);if(row<0||!Number.isInteger(frame)||frame<0||frame>=FRAMES[row])throw Error('INVALID_FRAME');
 return {row,column:frame,x:frame*192,y:row*208,width:192,height:208};
}
function createSelector({initial,prepare,persist}){
 let current=validatePack(initial),queue=Promise.resolve(),history=[];
 function enqueue(fn){const task=queue.then(fn);queue=task.catch(()=>{});return task;}
 return {
  current:()=>structuredClone(current),history:()=>history.map(p=>p.id),
  select(candidate){return enqueue(async()=>{const next=validatePack(candidate);if(next.id===current.id)return current;
   await prepare(next);await persist(next);history.push(current);current=next;return structuredClone(current);
  });},
  undo(){return enqueue(async()=>{const previous=history.at(-1);if(!previous)return structuredClone(current);await prepare(previous);await persist(previous);current=previous;history.pop();return structuredClone(current);});}
 };
}
function createEventRouter(){
 let latestAt=-Infinity,exhausted=false,event=null;const seen=new Set();
 return {
  observe({at,quotaConfirmed,allExhausted,eventId,eventType,eventUntil,clearEvent},now){
   if(!Number.isFinite(at)||at<latestAt)return false;latestAt=at;exhausted=quotaConfirmed===true&&allExhausted===true;
   if(clearEvent===true)event=null;
   if(eventId&&['recharge','credit-increase','quota-reset'].includes(eventType)&&!seen.has(eventId)){
    seen.add(eventId);event={kind:eventType,until:Number.isFinite(eventUntil)?eventUntil:now+4000};
   }return true;
  },
  view({now,animation=true,reducedMotion=false,dragging=false,moving=false,heading=1}){
   const appearance=exhausted?'exhausted':event?.until>now&&['recharge','credit-increase'].includes(event.kind)?'love':'normal';
   if(!animation||reducedMotion)return {appearance,motion:'still'};
   if(exhausted)return {appearance,motion:'tired'};
   if(dragging)return {appearance,motion:'held'};
   if(event?.until>now)return {appearance,motion:['recharge','credit-increase'].includes(event.kind)?'love':'orbit'};
   return {appearance,motion:moving?(heading<0?'running-left':'running-right'):'idle'};
  }
 };
}
return {ROWS,FRAMES,validatePack,filterCatalog,atlasFrame,createSelector,createEventRouter};
});
