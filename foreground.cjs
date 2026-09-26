 'use strict';
const {spawn}=require('node:child_process'),path=require('node:path');
module.exports=function watchForeground(onChange,onStatus=()=>{}){
 let child,buffer='',stopped=false,retry=null,retries=0;
 function start(){
  if(stopped)return;
  const exe=path.join(process.env.SystemRoot||'C:/Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
  child=spawn(exe,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',path.join(__dirname,'foreground.ps1')],{windowsHide:true,stdio:['ignore','pipe','pipe']});buffer='';
  child.stdout.on('data',chunk=>{buffer+=chunk;const lines=buffer.split(/\r?\n/);buffer=lines.pop();for(const line of lines){try{const value=JSON.parse(line);if(value.status==='ok'&&typeof value.browser==='boolean'){onStatus('ok');onChange(value.browser);}else onStatus('error');}catch{onStatus('error');}}});
  child.stderr.on('data',()=>onStatus('error'));child.on('error',()=>onStatus('error'));
  child.on('close',()=>{if(stopped)return;onStatus('error');if(retries++<3)retry=setTimeout(start,1000*retries);});
 }
 start();return ()=>{stopped=true;clearTimeout(retry);child?.kill();};
};
