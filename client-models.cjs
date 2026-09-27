'use strict';
const {buildImport}=require('./client-setup.cjs');
const {decision}=require('./model-access-policy.cjs');
const CATALOG_URL='https://console.yulitongxing.com/api/pricing';
const MODEL_URLS={gateway:'https://api.yulitongxing.com/v1/models',personal:'https://console.yulitongxing.com/byok/v1/models'};
const validId=id=>typeof id==='string'&&id.length>0&&id.length<=160&&!/[\s\x00-\x1f\x7f]/.test(id);
const compatible=(id,client)=>client!=='claude-desktop'||/^(claude-|anthropic\/claude-)[A-Za-z0-9._/-]+$/.test(id);
function mergeModels(allowed,catalog,client){
 const available=new Set(allowed.filter(validId));
 return [...new Set([...available,...catalog.filter(validId)])].filter(id=>compatible(id,client)).sort((a,b)=>Number(available.has(b))-Number(available.has(a))||a.localeCompare(b)).map(id=>({id,available:available.has(id),reason:available.has(id)?null:'KEY_NOT_AUTHORIZED'}));
}
async function readJson(fetchImpl,url,apiKey){
 const response=await fetchImpl(url,{method:'GET',headers:apiKey?{Authorization:`Bearer ${apiKey}`}:{},credentials:'omit',redirect:'manual',signal:AbortSignal.timeout(12000)});
 if(response.status===401||response.status===403)throw Error('MODEL_AUTH_REQUIRED');
 if(!response.ok)throw Error('MODEL_LOOKUP_FAILED');
 return response.json();
}
async function listModels(input,{fetchImpl=fetch}={}){
 if(input&&input.apiKey===''&&input.endpoint==='gateway'&&['codex','claude-desktop'].includes(input.client)){
  try{
   const pricing=await readJson(fetchImpl,CATALOG_URL);
   if(pricing.success===false||!Array.isArray(pricing.data))throw Error();
   const ids=pricing.data.map(item=>item.model_name).filter(validId);
   const models=mergeModels(ids.filter(id=>decision('trial',id).allowed),ids,input.client).map(item=>({...item,reason:item.available?null:'PLAN_REQUIRED'}));
   // Anonymous discovery is not an inference credential. Never use it to authorize an import.
   return {ok:true,models,catalogAvailable:true,mode:'trial-preview',plan:'trial'};
  }catch{return {ok:false,code:'MODEL_LOOKUP_FAILED'};}
 }
 try{buildImport({...input,model:''});}catch(e){return {ok:false,code:e.message};}
 try{
  // The key's effective model list is authoritative. Public pricing never grants access.
  const payload=await readJson(fetchImpl,MODEL_URLS[input.endpoint],input.apiKey);
  if(!Array.isArray(payload.data)||payload.data.some(item=>!item||!validId(item.id)))throw Error('MODEL_LOOKUP_FAILED');
  let catalog=[],catalogAvailable=input.endpoint==='personal';
  if(input.endpoint==='gateway'){
   try{const pricing=await readJson(fetchImpl,CATALOG_URL);if(pricing.success!==false&&Array.isArray(pricing.data)){catalog=pricing.data.map(item=>item.model_name);catalogAvailable=true;}}catch{/* A catalog outage must not discard verified accessible IDs. */}
  }
  return {ok:true,models:mergeModels(payload.data.map(item=>item.id),catalog,input.client),catalogAvailable};
 }catch(e){return {ok:false,code:e.message==='MODEL_AUTH_REQUIRED'?'MODEL_AUTH_REQUIRED':'MODEL_LOOKUP_FAILED'};}
}
async function authorizeModel(input,dependencies){
 if(!input.apiKey)return {ok:false,code:'TRIAL_INFERENCE_PENDING'};
 const result=await listModels(input,dependencies);
 if(!result.ok)return result;
 if(input.model.trim()&&!result.models.some(item=>item.available&&item.id===input.model.trim()))return {ok:false,code:'MODEL_LOCKED'};
 if(!result.models.some(item=>item.available))return {ok:false,code:'NO_AVAILABLE_MODELS'};
 return {ok:true};
}
module.exports={listModels,authorizeModel,mergeModels,MODEL_URLS,CATALOG_URL};
