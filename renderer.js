'use strict';
document.body.classList.toggle('dashboard',new URLSearchParams(location.search).get('view')==='dashboard');
const settingsView=new URLSearchParams(location.search).get('view')==='settings';document.body.classList.toggle('settings-view',settingsView);if(settingsView)document.querySelector('.preferences').open=true;
const $=selector=>document.querySelector(selector),topButton=$('#back-to-top'),scrollHost=$('main');
let snapshot=null,tab='accounts',settingsDirty=false,settingsStatus='',currentLanguage='zh-CN';
const t=(key,params={})=>PetI18n.t(key,params,currentLanguage);
const friendly=value=>PetI18n.known(value,currentLanguage);
const number=value=>value===null?t('noData'):value.toLocaleString(currentLanguage,{maximumFractionDigits:6});
const date=value=>new Date(value*1000).toLocaleString(currentLanguage);
function el(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
function updateTopButton(){topButton.hidden=scrollHost.scrollHeight<=scrollHost.clientHeight||scrollHost.scrollTop<scrollHost.clientHeight/2;}
scrollHost.addEventListener('scroll',updateTopButton,{passive:true});topButton.addEventListener('click',()=>scrollHost.scrollTo({top:0,behavior:'auto'}));
function applyLanguage(lang){currentLanguage=PetI18n.locale(lang);document.documentElement.lang=currentLanguage;PetI18n.apply(document,currentLanguage);renderStatus();}
function renderStatus(){$('#preferences-status').textContent=settingsStatus?t(settingsStatus):'';}
let saveQueue=Promise.resolve(),pendingSaves=0;const pendingFields=new Map();let saveTimer;
const fields={'pet-choice':'petId','app-hotkey':'hotkey','refresh-mode':'refreshMinutes','refresh-minutes':'refreshMinutes','low-reminder':'lowQuotaReminder','browser-behind':'browserBehind','show-low-notice':'showLowNotice','app-theme':'theme','app-language':'language','open-in-browser':'openInBrowser','app-pin':'appAlwaysOnTop','sidebar-opacity':'sidebarOpacity','app-opacity':'appOpacity','pet-opacity':'petOpacity','pet-animation':'petAnimation','auto-update':'autoUpdate','pet-movement':'petMovement','pet-tail-motion':'petTailMotion','pet-size':'petSize','pet-move-radius':'petMoveRadius','pet-move-speed':'petMoveSpeed'};
function queueSave(patch){pendingSaves++;settingsDirty=true;settingsStatus='saving';renderStatus();saveQueue=saveQueue.then(async()=>{try{await window.pet.savePreferences(patch);settingsStatus='saved';}catch(error){settingsStatus=hotkeyErrorKey(error.message)||'saveFailed';}finally{pendingSaves--;settingsDirty=pendingSaves>0||pendingFields.size>0;render(await window.pet.snapshot());}});return saveQueue;}
function flushSettings(){clearTimeout(saveTimer);if(!pendingFields.size)return saveQueue;const patch=Object.fromEntries(pendingFields);pendingFields.clear();return queueSave(patch);}
function markDirty(control=$('#app-hotkey'),immediate=false){const key=fields[control.id];if(!key)return;if(control.id==='refresh-mode'){const manual=control.value==='manual';$('#refresh-minutes').disabled=manual;if(!manual&&Number($('#refresh-minutes').value)===0)$('#refresh-minutes').value=5;}
 if(control.type==='number'&&!control.checkValidity()){settingsStatus='invalidMinutes';renderStatus();return;}
 const value=key==='refreshMinutes'?($('#refresh-mode').value==='manual'?0:Number($('#refresh-minutes').value)):control.type==='checkbox'?control.checked:control.type==='range'?Number(control.value):control.value;
 pendingFields.set(key,value);settingsDirty=true;settingsStatus='saving';renderStatus();if(control.type==='range')$('#'+control.id+'-value').textContent=control.value+(control.dataset.unit||'%');clearTimeout(saveTimer);if(immediate)flushSettings();else saveTimer=setTimeout(flushSettings,180);
}
function render(d){
 if(d)snapshot=d;d=snapshot;if(!d)return;applyLanguage(d.preferences?.language);
 document.querySelector('[data-action=login]').hidden=d.state!=='auth';
 const toggle=document.querySelector('[data-action=hide]');toggle.textContent=t(d.orbVisible?'hide':'show');toggle.title=t(d.orbVisible?'hidePet':'showPet');toggle.setAttribute('aria-label',toggle.title);
 const maximize=document.querySelector('[data-action=maximize]');maximize.textContent=d.windowMaximized?'❐':'□';maximize.title=t(d.windowMaximized?'restore':'maximize');maximize.setAttribute('aria-label',maximize.title);
 const pin=$('#window-pin');pin.setAttribute('aria-pressed',String(!!d.appPinActive));pin.title=t(d.appPinActive?'unpinWindow':'pinWindow');pin.setAttribute('aria-label',pin.title);
 $('#undo-settings').disabled=!d.undoCount||settingsDirty;document.querySelector('[data-action=settings]').setAttribute('aria-expanded',String(!!d.settingsVisible));
 renderPreferences(d);renderUpdate(d.update);$('#time').textContent=(d.appVersion?t('version',{version:d.appVersion})+' · ':'')+(d.updatedAt?t('lastUpdated',{time:date(d.updatedAt)}):t('noDataYet'));
 const old=d.updatedAt&&Date.now()/1000-d.updatedAt>Math.max(5,d.preferences?.refreshMinutes||5)*60+60;
 $('#message').textContent=(d.state==='partial'?t('partial'):d.messageKey?t(d.messageKey):friendly(d.message||''))+(old?' · '+t('stale'):'');
 $('#count').textContent=d.accounts?.length??'—';$('#low').textContent=d.accounts?.flatMap(a=>a.windows).filter(w=>w.remaining!==null&&w.remaining<20).length??'—';
 const list=$('#list');list.replaceChildren();const q=$('#search').value.toLowerCase();let rows=(d[tab]||[]).filter(row=>JSON.stringify(row).toLowerCase().includes(q));
 if(tab==='accounts'){const order=d.preferences?.accountOrder||[],rank=new Map(order.map((id,i)=>[id,i]));const score=a=>Math.max(...(a.windows||[]).map(w=>Number.isFinite(w.remaining)?w.remaining:-1),-1);rows=[...rows].sort((a,b)=>{const ia=rank.get(a.owner+'|'+a.provider),ib=rank.get(b.owner+'|'+b.provider);if(ia!==undefined||ib!==undefined)return (ia??999999)-(ib??999999);return score(b)-score(a);});}
 if(tab!=='accounts'&&d.relayError)list.append(el('p',t(/未配置|GATEWAY_|未接入/.test(d.relayError)?'relayUnavailable':'balanceUnavailable'),'error'));
 for(const a of rows){
  const card=el('article',undefined,'account');if(tab==='accounts'){card.draggable=true;card.dataset.accountId=a.owner+'|'+a.provider;card.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',card.dataset.accountId));card.addEventListener('dragover',e=>e.preventDefault());card.addEventListener('drop',async e=>{e.preventDefault();const from=e.dataTransfer.getData('text/plain'),to=card.dataset.accountId;if(!from||from===to)return;const ids=[...list.querySelectorAll('.account')].map(x=>x.dataset.accountId),next=ids.filter(x=>x!==from),at=next.indexOf(to);next.splice(at<0?next.length:at,0,from);await window.pet.savePreferences({accountOrder:next});});}list.append(card);
  if(tab==='accounts'){
   // Account names and platform values are data, never translation keys.
   card.append(el('div',a.owner,'head'),el('div',[a.provider,a.plan,a.disabled?t('disabled'):''].filter(Boolean).join(' · '),'meta'));
   // Pending separate timing review; preserve draft, do not expose it in the 3D release.
   // if(a.ageMs!==null)card.append(el('div',`上游采集后 ${number(a.ageMs)} ms 发布 · 仅表示本次采集链路耗时`,'note'));
   if(a.diagnosis){const key='diagnosis.'+a.diagnosis.code;card.append(el('p',PetI18n.messages[key+'.title']?t(key+'.title'):a.diagnosis.title,'error'),el('p',PetI18n.messages[key+'.action']?t(key+'.action'):a.diagnosis.action,'note'));}
   for(const w of a.windows){
    const box=el('div',undefined,'window'),line=el('div',undefined,'line');line.append(el('span',friendly(w.label)),el('strong',w.remaining===null?t('noData'):t('remaining',{value:number(w.remaining)}),w.remaining!==null&&w.remaining<20?'low':''));box.append(line);
    if(w.remaining!==null){const progress=el('progress');progress.max=100;progress.value=w.remaining;box.append(progress);}
    if(w.note)box.append(el('div',friendly(w.note),'note'));
    if(w.resetAt){const delta=Math.ceil((w.resetAt-Date.now()/1000)/60);box.append(el('div',delta<=0?t('resetPending'):t('resetIn',{hours:Math.floor(delta/60),minutes:delta%60,time:date(w.resetAt)}),'reset'));}
    card.append(box);
   }
   for(const c of a.credits)card.append(el('div',t('creditValue',{label:friendly(c.label),value:friendly(c.raw),status:c.usable?'':t('disabledSuffix')}),'credit'));
  }else if(tab==='users')card.append(el('div',a.name,'head'),el('div',t('group',{name:a.group}),'meta'),el('div',t('userBalance',{remaining:number(a.remaining),used:number(a.used)}),'credit'));
  else{card.append(el('div',a.name,'head'),el('div',a.balance===null?t('balanceUnknown'):number(a.balance)+' '+a.currency,'credit'));if(a.note)card.append(el('p',friendly(a.note),'note'));}
 }
 if(!rows.length)list.append(el('div',t(q?'noMatches':d.state==='auth'?'signInToView':'empty'),'empty'));updateTopButton();
}
function renderPreferences(d){
 const p=d.preferences||{refreshMinutes:5,lowQuotaReminder:true};document.body.dataset.theme=p.theme||'cream';
 $('#refresh-description').textContent=p.refreshMinutes===0?t('manual'):t('refreshEvery',{minutes:p.refreshMinutes});$('#hotkey-status').textContent=d.hotkeyError?t('hotkeyUnavailable'):'';
 if(!settingsDirty){$('#app-hotkey').value=p.hotkey||'Ctrl+Shift+X';$('#refresh-mode').value=p.refreshMinutes===0?'manual':'auto';$('#refresh-minutes').value=p.refreshMinutes;$('#refresh-minutes').disabled=p.refreshMinutes===0;$('#low-reminder').checked=p.lowQuotaReminder;$('#browser-behind').checked=!!p.browserBehind;$('#show-low-notice').checked=p.showLowNotice!==false;$('#app-theme').value=p.theme||'cream';$('#app-language').value=p.language||'zh-CN';$('#open-in-browser').checked=!!p.openInBrowser;$('#app-pin').checked=!!p.appAlwaysOnTop;}
 if(!settingsDirty){$('#pet-choice').value=p.petId??'tuantuan-original';for(const [id,key] of [['sidebar-opacity','sidebarOpacity'],['app-opacity','appOpacity'],['pet-opacity','petOpacity']]){$('#'+id).value=p[key]??100;$('#'+id+'-value').textContent=(p[key]??100)+'%';}for(const [id,key,fallback] of [['pet-size','petSize',180],['pet-move-radius','petMoveRadius',220],['pet-move-speed','petMoveSpeed',35]]){const control=$('#'+id);control.value=p[key]??fallback;$('#'+id+'-value').textContent=control.value+control.dataset.unit;}$('#pet-movement').checked=p.petMovement===true;$('#pet-tail-motion').checked=p.petTailMotion!==false;$('#pet-animation').checked=p.petAnimation!==false;$('#auto-update').checked=p.autoUpdate!==false;}
 const alerts=d.lowQuota||[];$('#low-notice').hidden=!alerts.length||p.showLowNotice===false;$('#low-notice-text').textContent=alerts.map(a=>`${a.account} · ${a.provider} · ${friendly(a.period)}: ${t('remaining',{value:number(a.remaining)})}`).join('; ');
}
document.querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>window.pet.action(button.dataset.action));
document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{tab=button.dataset.tab;document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('selected',x===button));render();});
$('#search').oninput=()=>render();document.body.onmouseenter=()=>window.pet.action('enter');document.body.onmouseleave=()=>window.pet.action('leave');
$('#preferences-form').addEventListener('input',event=>markDirty(event.target));
$('#preferences-form').addEventListener('change',event=>markDirty(event.target,true));
$('#preferences-form').addEventListener('submit',event=>{event.preventDefault();flushSettings();});
$('#undo-settings').addEventListener('click',async()=>{await flushSettings();try{render(await window.pet.undoPreferences());settingsStatus='undone';}catch(error){settingsStatus=hotkeyErrorKey(error.message)||'saveFailed';}renderStatus();});
if(settingsView)document.addEventListener('keydown',event=>{if(event.key==='Escape')window.pet.action('collapse');});
$('#dismiss-notice').addEventListener('click',async()=>{const button=$('#dismiss-notice');button.disabled=true;try{const current=await window.pet.snapshot();await window.pet.savePreferences({...current.preferences,showLowNotice:false});$('#show-low-notice').checked=false;render(await window.pet.snapshot());}catch{$('#message').textContent=t('dismissFailed');}finally{button.disabled=false;}});
function hotkeyErrorKey(error){return error?.includes('HOTKEY_CONFLICT')?'hotkeyConflict':error?.includes('HOTKEY_INVALID')?'hotkeyInvalid':'';}
$('#app-hotkey').addEventListener('keydown',event=>{if(event.key==='Tab')return;event.preventDefault();event.stopPropagation();if(['Control','Shift','Alt','Meta'].includes(event.key))return;const key=/^Key[A-Z]$/.test(event.code)?event.code.slice(3):/^Digit[0-9]$/.test(event.code)?event.code.slice(5):/^F([1-9]|1[0-9]|2[0-4])$/.test(event.key)?event.key:null;if(event.isComposing||event.repeat||!key||!(event.ctrlKey||event.altKey||event.metaKey)){settingsStatus='hotkeyInvalid';renderStatus();return;}event.target.value=[event.ctrlKey?'Ctrl':null,event.altKey?'Alt':null,event.shiftKey?'Shift':null,event.metaKey?'Super':null,key].filter(Boolean).join('+');markDirty(event.target,true);});
$('#hotkey-reset').addEventListener('click',()=>{$('#app-hotkey').value='Ctrl+Shift+X';markDirty($('#app-hotkey'),true);});
applyLanguage(currentLanguage);window.pet.onSnapshot(render);window.pet.snapshot().then(render);setInterval(()=>render(),30000);

window.pet.onOperationError(key=>{$('#message').textContent=t(key);});

async function setAppPin(enabled){
 const controls=[$('#window-pin'),$('#app-pin')];for(const control of controls)control.disabled=true;
 try{
  await window.pet.savePreferences({appAlwaysOnTop:enabled});
  const current=await window.pet.snapshot();if(current.appPinActive!==enabled)throw Error('APP_PIN_FAILED');
  $('#app-pin').checked=enabled;settingsStatus=settingsDirty?'unsaved':'saved';render(current);
 }catch{const current=await window.pet.snapshot();$('#app-pin').checked=!!current.appPinActive;render(current);settingsStatus='pinFailed';renderStatus();}
 finally{for(const control of controls)control.disabled=false;}
}
$('#window-pin').addEventListener('click',()=>setAppPin(!snapshot?.appPinActive));


function renderUpdate(update){
 const state=update||{status:'idle'},node=$('#update-status'),check=document.querySelector('[data-action="check-update"]'),download=document.querySelector('[data-action="download-update"]');
 node.hidden=state.status==='idle';check.disabled=['checking','downloading','installing'].includes(state.status);download.hidden=state.status!=='available';
 document.querySelector('[data-action=install-update]').hidden=state.status!=='ready';document.querySelector('[data-action=cancel-auto-update]').hidden=!['available','downloading','ready'].includes(state.status);
 const keys={downloading:'updateDownloading',ready:'updateReady',cancelled:'updateCancelled',installing:'updateInstalling',checking:'updateChecking',available:'updateAvailable',current:'updateCurrent',ahead:'updateAhead',unpublished:'updateUnpublished',unsupported:'updateUnsupported',error:state.code==='AUTH_REQUIRED'?'updateAuthError':'updateError'};
 if(keys[state.status])node.textContent=t(keys[state.status],{current:state.current||'',latest:state.latest||'',progress:state.progress||0});
}
