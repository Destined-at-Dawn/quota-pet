'use strict';
const MANIFEST_URL='https://console.yulitongxing.com/updates/quota-pet/stable.json';
function version(value){
 if(typeof value!=='string'||value.length>128)throw Error('INVALID_VERSION');
 const m=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.exec(value);
 if(!m)throw Error('INVALID_VERSION');
 const pre=m[4]?.split('.')||[];if(pre.some(s=>/^\d+$/.test(s)&&s.length>1&&s[0]==='0'))throw Error('INVALID_VERSION');
 return {parts:m.slice(1,4).map(BigInt),pre};
}
function compareVersions(a,b){
 const x=version(a),y=version(b);
 for(let i=0;i<3;i++)if(x.parts[i]!==y.parts[i])return x.parts[i]>y.parts[i]?1:-1;
 if(!x.pre.length||!y.pre.length)return x.pre.length===y.pre.length?0:x.pre.length?-1:1;
 for(let i=0;i<Math.max(x.pre.length,y.pre.length);i++){
  const l=x.pre[i],r=y.pre[i];if(l===r)continue;if(l===undefined)return -1;if(r===undefined)return 1;
  const ln=/^\d+$/.test(l),rn=/^\d+$/.test(r);
  if(ln&&rn)return BigInt(l)>BigInt(r)?1:-1;if(ln!==rn)return ln?-1:1;return l>r?1:-1;
 }return 0;
}
function allowedDownload(value){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&(!u.port||u.port==='443')&&['console.yulitongxing.com','download.yulitongxing.com'].includes(u.hostname)&&u.pathname.startsWith('/updates/quota-pet/')&&/\.(exe|zip|msi)$/.test(u.pathname);}catch{return false;}
}
function evaluate(current,manifest,platform=process.platform,arch=process.arch){
 version(current);
 if(!manifest||manifest.schemaVersion!==1||manifest.product!=='quota-pet'||manifest.channel!=='stable')throw Error('INVALID_MANIFEST');
 if(manifest.latest===null)return {status:'unpublished',current};
 const item=manifest.latest;if(!item||typeof item!=='object'||version(item.version).pre.length||!allowedDownload(item.url)||typeof item.notes!=='string'||item.notes.length>4000)throw Error('INVALID_MANIFEST');
 if(item.platform!==platform||item.arch!==arch)return {status:'unsupported',current,latest:item.version};
 const cmp=compareVersions(item.version,current);
 return {status:cmp>0?'available':cmp===0?'current':'ahead',current,latest:item.version,notes:item.notes,downloadUrl:cmp>0?item.url:null};
}
async function readManifest(fetchImpl){
 const r=await fetchImpl(MANIFEST_URL,{credentials:'omit',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}});
 if(r.status===401||r.status===403)throw Error('AUTH_REQUIRED');
 if(!r.ok)throw Error('HTTP_ERROR');
 if(!/application\/json/i.test(r.headers.get('content-type')||''))throw Error('INVALID_MANIFEST');
 const reader=r.body.getReader();let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536)throw Error('INVALID_MANIFEST');chunks.push(Buffer.from(value));}}finally{await reader.cancel().catch(()=>{});}
 return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function createUpdateChecker({current,fetchImpl,onChange=()=>{},platform=process.platform,arch=process.arch}){
 let state={status:'idle',current},pending=null;
 function publish(next){state=next;onChange({...state});return {...state};}
 return {snapshot:()=>({...state}),check(){
  if(pending)return pending;
  publish({status:'checking',current});
  pending=(async()=>{
   try{return publish({...evaluate(current,await readManifest(fetchImpl),platform,arch),checkedAt:Date.now()});}
   catch(e){return publish({status:'error',current,code:['INVALID_VERSION','INVALID_MANIFEST','AUTH_REQUIRED'].includes(e.message)?e.message:'NETWORK',checkedAt:Date.now()});}
   finally{pending=null;}
  })();return pending;
 }};
}
module.exports={MANIFEST_URL,compareVersions,allowedDownload,evaluate,createUpdateChecker};
