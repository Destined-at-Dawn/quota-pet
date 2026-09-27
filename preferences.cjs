'use strict';
const {DEFAULT_HOTKEY,normalizeHotkey}=require('./hotkey.cjs');
const defaults=Object.freeze({hotkey:DEFAULT_HOTKEY,refreshMinutes:5,lowQuotaReminder:true,browserBehind:false,showLowNotice:true,openInBrowser:false,theme:"cream",appAlwaysOnTop:false,language:"zh-CN",accountOrder:[],sidebarOpacity:100,appOpacity:100,petOpacity:100,petAnimation:true,petMovement:false,petTailMotion:true,petSize:180,petMoveRadius:220,petMoveSpeed:35,autoUpdate:true,petId:'tuantuan-original'});
function validate(value){
 const petId=value?.petId??'tuantuan-original';if(!['tuantuan-original','tuantuan-paper'].includes(petId))throw Error('Invalid pet pack');
 const petOptions={petId};for(const [key,min,max,fallback] of [['petSize',48,320,180],['petMoveRadius',0,800,220],['petMoveSpeed',10,120,35]]){const n=value?.[key]??fallback;if(!Number.isInteger(n)||n<min||n>max)throw Error('Invalid '+key);petOptions[key]=n;}
 for(const key of ['petMovement','petTailMotion']){if(value?.[key]!==undefined&&typeof value[key]!=='boolean')throw Error('Invalid '+key);petOptions[key]=value?.[key]??(key==='petTailMotion');}
 const appearance={};for(const key of ['sidebarOpacity','appOpacity','petOpacity']){const n=value?.[key]??100;if(!Number.isInteger(n)||n<20||n>100)throw Error('Opacity must be an integer from 20 to 100');appearance[key]=n;}
 if(value?.autoUpdate!==undefined&&typeof value.autoUpdate!=='boolean')throw Error('Invalid automatic update setting');
 if(value?.petAnimation!==undefined&&typeof value.petAnimation!=='boolean')throw Error('Invalid pet animation');
 if(!value||!Number.isInteger(value.refreshMinutes)||value.refreshMinutes<0||value.refreshMinutes>60||typeof value.lowQuotaReminder!=='boolean')throw Error('请选择 0 到 60 之间的整数分钟。');
 if(value.browserBehind!==undefined&&typeof value.browserBehind!=='boolean')throw Error('请选择显示方式。');
 if(value.showLowNotice!==undefined&&typeof value.showLowNotice!=='boolean')throw Error('请选择提醒显示方式。');
 if(value.openInBrowser!==undefined&&typeof value.openInBrowser!=='boolean')throw Error('请选择打开方式。');
 if(value.language!==undefined&&!['zh-CN','zh-TW','en'].includes(value.language))throw Error('请选择语言。');
 if(value.appAlwaysOnTop!==undefined&&typeof value.appAlwaysOnTop!=='boolean')throw Error('Invalid app pin setting');
 if(value.theme!==undefined&&!['cream','ocean','mint','lavender'].includes(value.theme))throw Error('请选择界面风格。');
 if(value.accountOrder!==undefined&&(!Array.isArray(value.accountOrder)||value.accountOrder.some(x=>typeof x!=='string')))throw Error('Invalid account order');
 return {...appearance,...petOptions,autoUpdate:value.autoUpdate??true,petAnimation:value.petAnimation??true,hotkey:normalizeHotkey(value.hotkey),language:value.language??'zh-CN',appAlwaysOnTop:value.appAlwaysOnTop??(value.wechatAlwaysOnTop===true),openInBrowser:value.openInBrowser??false,theme:value.theme??'cream',showLowNotice:value.showLowNotice??true,refreshMinutes:value.refreshMinutes,lowQuotaReminder:value.lowQuotaReminder,browserBehind:value.browserBehind??false,accountOrder:Array.isArray(value.accountOrder)?value.accountOrder:[]};
}
function createScheduler(refresh,timers=globalThis){let timer=null;return {configure(minutes){if(timer!==null)timers.clearInterval(timer);timer=null;if(!Number.isInteger(minutes)||minutes<0||minutes>60)throw Error('Invalid refresh interval');if(minutes>0)timer=timers.setInterval(refresh,minutes*60000);},stop(){if(timer!==null)timers.clearInterval(timer);timer=null;}};}
function lowQuota(data,settings,now=Date.now()/1000){
 if(!settings.lowQuotaReminder||!['ok','partial'].includes(data?.state)||!Number.isFinite(data.updatedAt)||now-data.updatedAt>Math.max(5,settings.refreshMinutes)*60+60)return [];
 return (data.accounts||[]).filter(a=>!a.disabled&&!a.error).flatMap(a=>(a.windows||[]).filter(w=>Number.isFinite(w.remaining)&&w.remaining>=0&&w.remaining<=10&&(!Number.isFinite(w.resetAt)||w.resetAt>now)).map(w=>({account:a.owner,provider:a.provider,period:w.label,remaining:w.remaining})));
}
module.exports={defaults,validate,createScheduler,lowQuota};
