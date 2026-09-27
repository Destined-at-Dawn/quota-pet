'use strict';
// Protocol integration, not a fork of the CC Switch application.
// Verified against farion1231/cc-switch v3.20.4 and source e0f70019.
const RELEASE_URL='https://github.com/farion1231/cc-switch/releases/tag/v3.20.4';
const errors={INVALID_CLIENT:'请选择 Codex 或 Claude Desktop。',INVALID_KEY:'请填写有效的网关 API Key。',INVALID_MODEL:'请填写控制台中可用的模型名称。',INVALID_ENDPOINT:'请选择受支持的网关地址。',PERSONAL_CODEX_PENDING:'个人接口尚未完成 Responses 接入，暂未开放 Codex 配置。',CC_SWITCH_MISSING:'请先安装 CC Switch v3.20.4 或更新版本，再重试。',OPEN_FAILED:'CC Switch 打开失败，请确认已安装后重试。'};
function fail(code){throw new Error(code);}
function buildImport(input){
 if(!input||!['codex','claude-desktop'].includes(input.client))fail('INVALID_CLIENT');
 const {client}=input;
 if(typeof input.apiKey!=='string'||input.apiKey.length<8||input.apiKey.length>4096||/[\s\x00-\x1f\x7f]/.test(input.apiKey))fail('INVALID_KEY');
 if(typeof input.model!=='string'||input.model.length>160||/[\x00-\x1f\x7f]/.test(input.model))fail('INVALID_MODEL');
 if(!['gateway','personal'].includes(input.endpoint))fail('INVALID_ENDPOINT');
 if(client==='codex'&&input.endpoint==='personal')fail('PERSONAL_CODEX_PENDING');
 const endpoint=input.endpoint==='personal'?'https://console.yulitongxing.com/byok':client==='codex'?'https://api.yulitongxing.com/v1':'https://api.yulitongxing.com';
 const params=new URLSearchParams({resource:'provider',app:client,name:input.endpoint==='personal'?'与黎同行 · 个人 API':'与黎同行 · 网关 API',endpoint,apiKey:input.apiKey,homepage:'https://console.yulitongxing.com',enabled:'true'});
 // Claude Desktop direct mode requires Claude model IDs. Mapping other models
 // is configured in CC Switch; do not silently relabel a different model.
 if(input.model.trim())params.set('model',input.model.trim());
 if(client==='claude-desktop'&&input.model.trim()){
  if(!/^(claude-|anthropic\/claude-)[A-Za-z0-9._/-]+$/.test(input.model.trim()))fail('INVALID_MODEL');
  for(const tier of ['sonnetModel','opusModel','haikuModel'])params.set(tier,input.model.trim());
 }
 return 'ccswitch://v1/import?'+params.toString();
}
async function launchImport(input,{resolveApplication,openExternal,authorizeModel=require('./client-models.cjs').authorizeModel}){
 let url;
 try{url=buildImport(input);}catch(e){return {ok:false,code:e.message in errors?e.message:'INVALID_CLIENT'};}
 let permission;try{permission=await authorizeModel(input);}catch{return {ok:false,code:'MODEL_LOOKUP_FAILED'};}
 if(!permission.ok)return permission;
 try{const app=await resolveApplication('ccswitch://');if(!app)throw Error();}catch{return {ok:false,code:'CC_SWITCH_MISSING'};}
 try{await openExternal(url);return {ok:true,state:'awaiting-confirmation'};}catch{return {ok:false,code:'OPEN_FAILED'};}
}
module.exports={RELEASE_URL,errors,buildImport,launchImport};
