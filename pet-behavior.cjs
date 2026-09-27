'use strict';
// Only fresh, complete observations drive events; opening settings never replays them.
function observation(data,now=Date.now()/1000){
 if(data?.state!=='ok'||!Number.isFinite(data.updatedAt)||Math.abs(now-data.updatedAt)>360)return null;
 const accounts=(data.accounts||[]).filter(a=>!a.disabled);
 const windows=new Map();let complete=accounts.length>0;
 for(const a of accounts){if(a.error||!a.windows?.length)complete=false;for(const w of a.windows||[]){if(!Number.isFinite(w.remaining)||(Number.isFinite(w.resetAt)&&w.resetAt<=now))complete=false;windows.set(JSON.stringify([a.owner,a.provider,w.label]),w.remaining);}}
 const grants=new Map();if(!data.relayError)for(const u of data.users||[]){if(Number.isFinite(u.remaining)&&Number.isFinite(u.used))grants.set(u.id||u.name,{total:u.remaining+u.used,used:u.used});}
 return {at:data.updatedAt,windows,grants,exhausted:complete&&accounts.every(a=>a.windows.some(w=>w.remaining===0))};
}
function createBehavior(){let previous=null,sequence=0,event=null;return {
 reset(){previous=null;event=null;},
 update(data,now=Date.now()/1000){const current=observation(data,now);if(!current){previous=null;event=null;return {state:'unknown',event:null};}
 if(previous&&current.at<previous.at)return {state:previous.exhausted?'exhausted':'idle',event:previous.exhausted?null:event};
 if(previous&&current.at>previous.at){
  const recharge=[...current.grants].some(([id,g])=>{const old=previous.grants.get(id);return old&&g.used>=old.used&&g.total-old.total>0.001;});
  const refill=[...current.windows].some(([id,n])=>Number.isFinite(n)&&Number.isFinite(previous.windows.get(id))&&n>previous.windows.get(id));
  if(recharge||refill)event={id:++sequence,type:recharge?'love':'orbit',cause:recharge?'credit-increase':'quota-reset',until:Date.now()+5000};
 }
 if(!previous||current.at>previous.at)previous=current;
 if(event?.until<Date.now())event=null;
 return {state:current.exhausted?'exhausted':'idle',event:current.exhausted?null:event};
 }
};}
module.exports={observation,createBehavior};
