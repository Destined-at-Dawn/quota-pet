'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async({app,orb,panel,dashboard,getSettings,expand,setSnapshot,preferencesFile,loadPreferences,applyOpacity,send})=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),js=(w,s)=>w.webContents.executeJavaScript(s),snap=()=>js(panel,'window.pet.snapshot()');
 const until=async(fn)=>{for(let i=0;i<100;i++){if(await fn())return;await wait(40);}throw Error('Timed out waiting for settings state');};
 await until(()=>!panel.webContents.isLoading()&&!dashboard.webContents.isLoading()&&!orb.webContents.isLoading());
 const root=process.env.QUOTA_PET_EVIDENCE||path.join(__dirname,'evidence/settings-pet-20260926');fs.mkdirSync(root,{recursive:true});
 const marker=path.join(app.getPath('userData'),'restart-marker.json');
 if(process.argv.includes('--resume-check')){
  const expected=JSON.parse(fs.readFileSync(marker));const d=await snap();assert.equal(d.preferences.petOpacity,47);assert.equal(d.undoCount,expected.count);assert(Math.abs(orb.getOpacity()-.47)<.01);
  await js(panel,'window.pet.undoPreferences()');assert.equal((await snap()).preferences.petOpacity,expected.previous);console.log('RESTART PASS: preferences, native opacity and undo history survive process restart');app.quit();return;
 }
 if((await snap()).hotkeyError)await js(panel,"window.pet.savePreferences({hotkey:'Ctrl+Alt+Shift+F9'})");
 await js(panel,'window.pet.savePreferences({appAlwaysOnTop:false,browserBehind:false,sidebarOpacity:100,appOpacity:100,petOpacity:100,petAnimation:true})');
 dashboard.hide();expand();
 await js(panel,"document.querySelector('[data-action=settings]').click()");await until(()=>getSettings()?.isVisible());const settings=getSettings();await until(()=>!settings.webContents.isLoading());
 assert(!dashboard.isVisible());assert(await js(settings,"document.body.classList.contains('settings-view')"));assert.equal(await js(settings,"getComputedStyle(document.querySelector('#list')).display"),'none');
 for(let i=0;i<3;i++){await js(panel,"document.querySelector('[data-action=settings]').click()");await until(()=>!settings.isVisible());assert(!dashboard.isVisible());await js(panel,"document.querySelector('[data-action=settings]').click()");await until(()=>settings.isVisible());assert(!dashboard.isVisible());}
 await js(settings,"window.pet.action('leave')");await wait(250);assert(settings.isVisible());
 await js(settings,"document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");await until(()=>!settings.isVisible());
 await js(panel,"document.querySelector('[data-action=settings]').click()");await until(()=>settings.isVisible());
 await js(settings,"document.querySelector('[data-action=close-menu]').click()");await until(()=>!settings.isVisible());assert(!dashboard.isVisible());
 await js(panel,"document.querySelector('[data-action=settings]').click()");await until(()=>settings.isVisible());console.log('SETTINGS PASS: sidebar toggles independent window repeatedly; no dashboard; Escape/close; pointer leave stays open');
 const change=async(id,value)=>{await js(settings,`(()=>{const c=document.getElementById('${id}');c.${typeof value==='boolean'?'checked':'value'}=${JSON.stringify(value)};c.dispatchEvent(new Event('input',{bubbles:true}));c.dispatchEvent(new Event('change',{bubbles:true}));})()`);await js(settings,'flushSettings()');};
 const initial=await snap();await change('app-theme','ocean');await change('sidebar-opacity',61);await change('app-opacity',72);await change('pet-opacity',43);
 for(const [w,n] of [[panel,.61],[dashboard,.72],[orb,.43],[settings,1]])assert(Math.abs(w.getOpacity()-n)<.01);
 const saved=JSON.parse(fs.readFileSync(preferencesFile));assert.equal(saved.petOpacity,43);assert.equal(saved.sidebarOpacity,61);assert.equal(saved.appOpacity,72);assert.equal(saved.theme,'ocean');
 await js(settings,"document.querySelector('#undo-settings').click()");await until(async()=>(await snap()).preferences.petOpacity===100);assert(Math.abs(orb.getOpacity()-1)<.01);
 // Rapid edits are field patches and cannot overwrite each other.
 await js(settings,"for(const [id,value] of [['app-opacity',56],['pet-opacity',67]]){const c=document.getElementById(id);c.value=value;c.dispatchEvent(new Event('input',{bubbles:true}));}flushSettings()");await until(async()=>(await snap()).preferences.petOpacity===67);assert.equal((await snap()).preferences.appOpacity,56);
 const beforeInvalid=(await snap()).undoCount;const invalid=await js(settings,"window.pet.savePreferences({petOpacity:0}).then(()=>false,()=>true)");assert(invalid);assert.equal((await snap()).undoCount,beforeInvalid);
 const {globalShortcut}=require('electron');const conflict='Ctrl+Alt+Shift+F8';assert(globalShortcut.register(conflict,()=>{}));try{assert(await js(settings,`window.pet.savePreferences({hotkey:'${conflict}'}).then(()=>false,()=>true)`));assert.equal((await snap()).undoCount,beforeInvalid);}finally{globalShortcut.unregister(conflict);}
 console.log('AUTOSAVE PASS: UI edits persist without submit; independent native opacity; rapid edits; undo; failed changes excluded');
 const start=await snap();for(let i=0;i<125;i++)await js(settings,`window.pet.savePreferences({petOpacity:${i%2?45:46}})`);assert.equal((await snap()).undoCount,start.undoCount+125);
 loadPreferences();applyOpacity();send();assert.equal((await snap()).undoCount,start.undoCount+125);
 for(let i=0;i<125;i++)await js(settings,'window.pet.undoPreferences()');assert.deepEqual((await snap()).preferences,start.preferences);assert.equal((await snap()).undoCount,start.undoCount);
 console.log('UNDO PASS: 125 consecutive operations restored in order; disk reload retains history; no fixed history cap');
 const now=Math.floor(Date.now()/1000);const d=(remaining,at)=>({state:'ok',updatedAt:at,accounts:[{owner:'fixture',provider:'fixture',windows:[{label:'hour',remaining}],credits:[]}],users:[{id:'fixture-user',name:'fixture',remaining:10,used:2}],channels:[],relayError:''});
 const state=()=>js(orb,"document.querySelector('#orb').dataset.petState");
 setSnapshot(d(50,now));await until(async()=>await state()==='idle');setSnapshot(d(0,now+1));await until(async()=>await state()==='exhausted');
 setSnapshot(d(100,now+2));await until(async()=>await state()==='orbit');const eventId=(await snap()).petState.event.id;send();assert.equal((await snap()).petState.event.id,eventId);
 const love=d(99,now+3);love.users[0].remaining=20;setSnapshot(love);await until(async()=>await state()==='love');assert.equal(await js(orb,"document.querySelector('img').getAttribute('src')"),'cat-love.svg');
 await change('pet-animation',false);await until(async()=>await js(orb,"document.querySelector('#orb').dataset.motion")==='off');assert.equal(await state(),'love');await change('pet-animation',true);await until(async()=>await state()==='love');
 await wait(5100);assert.equal(await state(),'idle');setSnapshot({state:'error'});await until(async()=>await state()==='idle');
 console.log('PET PASS: gentle idle, exhausted, recovery orbit, credit heart eyes, no repeat, timed return, animation switch, unknown is not exhausted');
 await change('app-theme','cream');await change('app-language','en');await change('app-language','zh-TW');await change('app-language','zh-CN');
 assert.equal(await js(settings,"getComputedStyle(document.body).getPropertyValue('--canvas').trim()"),'#fbf8f3');assert.equal(await js(settings,"getComputedStyle(document.body).getPropertyValue('--accent').trim()"),'#926e4e');console.log('PALETTE PASS: original cream canvas and brown accent preserved');
 await js(settings,"document.querySelector('main').scrollTop=0");await wait(100);fs.writeFileSync(path.join(root,'settings.png'),(await settings.capturePage()).toPNG());
 const previous=(await snap()).preferences.petOpacity;await js(settings,'window.pet.savePreferences({petOpacity:47})');fs.writeFileSync(marker,JSON.stringify({previous,count:(await snap()).undoCount}));
 console.log('SETTINGS_PET_SMOKE PASS');app.quit();
};
