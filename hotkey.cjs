 'use strict';
const DEFAULT_HOTKEY='Ctrl+Shift+X';
function normalizeHotkey(value=DEFAULT_HOTKEY){
 if(typeof value!=='string')throw Error('HOTKEY_INVALID');
 const parts=value.split('+');const key=parts.pop();
 if(!parts.length||parts.some(x=>!['Ctrl','Alt','Shift','Super'].includes(x))||new Set(parts).size!==parts.length||!parts.some(x=>['Ctrl','Alt','Super'].includes(x))||!/^([A-Z0-9]|F([1-9]|1[0-9]|2[0-4]))$/.test(key))throw Error('HOTKEY_INVALID');
 return ['Ctrl','Alt','Shift','Super'].filter(x=>parts.includes(x)).concat(key).join('+');
}
function createHotkeyManager(api,onActivate){
 let active=null;
 return {get active(){return active;},set(value,persist=()=>{}){
 const next=normalizeHotkey(value);
 if(next===active){persist();return next;}
 let registered=false;try{registered=api.register(next,onActivate);}catch{}
 if(!registered)throw Error('HOTKEY_CONFLICT');
 try{persist();}catch(e){api.unregister(next);throw e;}
 const old=active;active=next;if(old)api.unregister(old);return next;
 }};
}
module.exports={DEFAULT_HOTKEY,normalizeHotkey,createHotkeyManager};
