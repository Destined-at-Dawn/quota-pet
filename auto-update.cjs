'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {allowedDownload,compareVersions}=require('./update-check.cjs');
const MAX_BYTES=512*1024*1024;
function signedMessage(r){return Buffer.from(JSON.stringify(['quota-pet','stable',r.version,r.platform,r.arch,r.runtime,r.format,r.url,r.size,r.sha256]));}
function verifyRelease(r,{current,runtime,publicKey,platform=process.platform,arch=process.arch}){
 if(!r||r.format!=='app-zip-v1'||r.platform!==platform||r.arch!==arch||r.runtime!==runtime||!allowedDownload(r.url)||!r.url.endsWith('.zip')||compareVersions(r.version,current)<=0||!Number.isSafeInteger(r.size)||r.size<1||r.size>MAX_BYTES||!/^[a-f0-9]{64}$/.test(r.sha256)||typeof r.signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(r.signature))throw Error('UPDATE_INVALID');
 if(!crypto.verify(null,signedMessage(r),publicKey,Buffer.from(r.signature,'base64')))throw Error('UPDATE_SIGNATURE');
 return r;
}
async function downloadRelease(r,{fetchImpl,folder,signal,onProgress=()=>{}}){
 fs.mkdirSync(folder,{recursive:true});const temporary=path.join(folder,crypto.randomUUID()+'.part');let file;
 try{
  const response=await fetchImpl(r.url,{credentials:'omit',redirect:'error',cache:'no-store',signal});
  if(response.status===401||response.status===403)throw Error('AUTH_REQUIRED');
  if(!response.ok||!response.body)throw Error('UPDATE_DOWNLOAD');
  const declared=response.headers.get('content-length');if(declared&&Number(declared)!==r.size)throw Error('UPDATE_SIZE');
  const reader=response.body.getReader(),hash=crypto.createHash('sha256');let count=0;file=fs.openSync(temporary,'wx');
  try{while(true){if(signal.aborted)throw Error('UPDATE_CANCELLED');const {done,value}=await reader.read();if(done)break;count+=value.byteLength;if(count>r.size)throw Error('UPDATE_SIZE');hash.update(value);fs.writeSync(file,value);onProgress(Math.floor(count/r.size*100));}}finally{await reader.cancel().catch(()=>{});}
  fs.closeSync(file);file=undefined;if(signal.aborted)throw Error('UPDATE_CANCELLED');
  if(count!==r.size||hash.digest('hex')!==r.sha256)throw Error('UPDATE_HASH');
  const archive=path.join(folder,crypto.randomUUID()+'.zip');fs.renameSync(temporary,archive);return archive;
 }catch(error){if(file!==undefined)fs.closeSync(file);fs.rmSync(temporary,{force:true});throw error;}
}
function createAutoUpdater({checker,current,runtime,publicKey,fetchImpl,folder,onChange=()=>{},onReady=()=>{},platform=process.platform,arch=process.arch}){
 let enabled=true,epoch=0,controller=null,pending=null,phase=null,ready=null,authPaused=false;
 const snapshot=()=>({...checker.snapshot(),...(phase||{}),autoEnabled:enabled});
 const publish=value=>{phase=value;onChange(snapshot());};
 function cancel(){epoch++;controller?.abort();controller=null;if(ready){fs.rmSync(ready.archive,{force:true});ready=null;}publish({status:'cancelled'});}
 async function download(){
  if(pending)return pending;if(ready)return ready;const state=checker.snapshot();if(state.status!=='available')return null;
  const ticket=++epoch;controller=new AbortController();const signal=controller.signal;
  pending=(async()=>{try{
   const release=verifyRelease(state.release,{current,runtime,publicKey,platform,arch});publish({status:'downloading',progress:0});
   const archive=await downloadRelease(release,{fetchImpl,folder,signal,onProgress:progress=>{if(ticket===epoch)publish({status:'downloading',progress});}});
   if(ticket!==epoch){fs.rmSync(archive,{force:true});return null;}
   ready={archive,release};publish({status:'ready',progress:100});onReady(snapshot());return ready;
  }catch(e){if(ticket===epoch){if(e.message==='AUTH_REQUIRED')authPaused=true;publish({status:'error',code:e.message==='AUTH_REQUIRED'?'AUTH_REQUIRED':'UPDATE_FAILED'});}return null;}
  finally{pending=null;controller=null;}})();return pending;
 }
 return {snapshot,cancel,download,ready:()=>ready,
  configure(value){if(typeof value!=='boolean')throw Error('INVALID_AUTO_UPDATE');const changed=enabled!==value;enabled=value;if(!enabled)cancel();else if(changed)publish(null);},
  async check({manual=false}={}){if(!manual&&(!enabled||authPaused))return snapshot();if(pending||ready)return snapshot();if(manual)authPaused=false;const ticket=epoch;publish(null);const result=await checker.check();if(ticket!==epoch)return snapshot();if(result.code==='AUTH_REQUIRED')authPaused=true;if(result.status==='available'&&enabled)await download();return snapshot();},
  install(launch){if(!ready)return false;try{launch(ready);ready=null;publish({status:'installing'});return true;}catch{publish({status:'error',code:'UPDATE_INSTALL'});return false;}}
 };
}
function launchInstaller({app,archive,release,userData,sourceDir=__dirname}){
 if(!app.isPackaged||process.platform!=='win32')throw Error('PACKAGED_WINDOWS_REQUIRED');
 const root=path.dirname(app.getPath('exe')),target=path.join(process.resourcesPath,'app');
 if(path.resolve(target)!==path.join(root,'resources','app'))throw Error('INVALID_INSTALL_ROOT');
 const id=crypto.randomUUID(),folder=path.join(userData,'updates',id);fs.mkdirSync(folder,{recursive:true});
 const helper=path.join(folder,'install.ps1'),job=path.join(folder,'job.json');fs.copyFileSync(path.join(sourceDir,'install-update.ps1'),helper);
 fs.writeFileSync(job,JSON.stringify({id,parentPid:process.pid,root,target,archive,sha256:release.sha256,version:release.version,exe:app.getPath('exe'),userData,marker:path.join(userData,'updates','health-'+id+'.json')}));
 const child=require('node:child_process').spawn('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',helper,'-JobFile',job],{detached:true,windowsHide:true,stdio:'ignore'});child.unref();
 return job;
}
function writeHealth(app){const prefix='--update-health=',arg=process.argv.find(x=>x.startsWith(prefix));if(!arg)return;const id=arg.slice(prefix.length);if(!/^[a-f0-9-]{36}$/.test(id))return;const folder=path.join(app.getPath('userData'),'updates');fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'health-'+id+'.json'),JSON.stringify({version:app.getVersion(),pid:process.pid,healthy:true}));}
module.exports={signedMessage,verifyRelease,downloadRelease,createAutoUpdater,launchInstaller,writeHealth};
