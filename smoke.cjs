const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async({app,orb,panel,dashboard,showDashboard,visible,expand,normalize,setSnapshot,testAuthSync,testHoverExit,testLayer,getNativeLabels,dismissCloseMenu})=>{
 const wait=ms=>new Promise(r=>setTimeout(r,ms));await wait(1200);

 const {globalShortcut}=require('electron');
 const startup=await dashboard.webContents.executeJavaScript('window.pet.snapshot()');
 if(startup.hotkeyError){await dashboard.webContents.executeJavaScript("window.pet.savePreferences({language:'en'})");assert.equal((await dashboard.webContents.executeJavaScript('window.pet.snapshot()')).preferences.language,'en');await dashboard.webContents.executeJavaScript("window.pet.savePreferences({language:'zh-CN'})");assert.match(await dashboard.webContents.executeJavaScript("document.querySelector('#hotkey-status').textContent"),/占用|occupied/);await dashboard.webContents.executeJavaScript("window.pet.snapshot().then(d=>window.pet.savePreferences({...d.preferences,hotkey:'Ctrl+Alt+Shift+F10'}))");}
 const original=(await dashboard.webContents.executeJavaScript('window.pet.snapshot()')).preferences;
 assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('#app-hotkey').value"),original.hotkey);
 dashboard.minimize();visible(false);await wait(100);
 const sendKeys=original.hotkey.replace('Ctrl+','^').replace('Alt+','%').replace('Shift+','+').replace(/F(\d+)$/,'{F$1}');
 require('node:child_process').execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${sendKeys}')`],{windowsHide:true});await wait(300);
 assert(dashboard.isVisible());assert(!dashboard.isMinimized());assert(orb.isVisible());console.log('HOTKEY_KEYPRESS_WAKE PASS');
 const candidate='Ctrl+Alt+Shift+F11';assert(globalShortcut.register(candidate,()=>{}),'test conflict key must be available');
 try{const result=await dashboard.webContents.executeJavaScript(`window.pet.savePreferences({...${JSON.stringify(original)},hotkey:'${candidate}'}).then(()=> 'unexpected',e=>e.message)`);assert.match(result,/HOTKEY_CONFLICT/);assert.equal((await dashboard.webContents.executeJavaScript('window.pet.snapshot()')).preferences.hotkey,original.hotkey);}finally{globalShortcut.unregister(candidate);}
 await dashboard.webContents.executeJavaScript("document.querySelector('#app-hotkey').dispatchEvent(new KeyboardEvent('keydown',{code:'F11',key:'F11',ctrlKey:true,altKey:true,shiftKey:true,bubbles:true}));document.querySelector('#preferences-form').requestSubmit()");await wait(120);assert.equal(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'preferences.json'))).hotkey,candidate);assert(globalShortcut.isRegistered(candidate));
 await dashboard.webContents.executeJavaScript(`window.pet.savePreferences(${JSON.stringify(original)})`);assert(!globalShortcut.isRegistered(candidate));console.log('HOTKEY_NATIVE_UI PASS');
 const originalOrbBounds=orb.getBounds();
 for(const size of [48,60,72,96,120]){orb.setSize(size,size);await wait(60);const metrics=await orb.webContents.executeJavaScript(`(()=>{const root=document.documentElement;const b=document.querySelector('#orb');return {overflow:getComputedStyle(root).overflow,body:getComputedStyle(document.body).overflow,width:root.clientWidth,viewport:innerWidth,height:root.clientHeight,viewportHeight:innerHeight,controls:b.querySelectorAll('input,select').length};})()`);assert.equal(metrics.overflow,'hidden');assert.equal(metrics.body,'hidden');assert.equal(metrics.width,metrics.viewport);assert.equal(metrics.height,metrics.viewportHeight);assert.equal(metrics.controls,0);}
 orb.setBounds(originalOrbBounds);
 const {safeStorage}=require('electron');const {createVault}=require('./auth-vault.cjs');const vf=path.join(app.getPath('userData'),'vault-test.dat');const v=createVault(vf,safeStorage);const fake='fixture-only-not-a-real-session';v.save([{name:'session',value:fake,domain:'pool.yulitongxing.com',secure:true,httpOnly:true}]);assert.equal(fs.readFileSync(vf).includes(Buffer.from(fake)),false);assert.equal(v.load()[0].value,fake);v.clear();assert.equal(fs.existsSync(vf),false);
 const icon=await panel.webContents.executeJavaScript(`new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;canvas.getContext('2d').drawImage(image,0,0,128,128);resolve(canvas.toDataURL('image/png').split(',')[1]);};image.onerror=reject;image.src='cat.svg';})`);fs.writeFileSync(path.join(__dirname,'icon.png'),Buffer.from(icon,'base64'));
 const data=require('./fixture.json');data.updated_at=Math.floor(Date.now()/1000);data.accounts[0].windows[0].reset_at=data.updated_at+5400;
 await testAuthSync(data);setSnapshot(normalize(data));visible(true);expand();await wait(400);
 showDashboard();await wait(150);assert.equal(dashboard.isVisible(),true);assert.equal(dashboard.isMinimized(),false);assert.equal(await dashboard.webContents.executeJavaScript("document.querySelectorAll('.account').length"),3);dashboard.close();await wait(100);assert.equal(dashboard.isDestroyed(),false);assert.equal(dashboard.isVisible(),false);showDashboard();dashboard.hide();
 assert.equal(await panel.webContents.executeJavaScript("document.querySelectorAll('.account').length"),3);
 await panel.webContents.executeJavaScript("document.querySelector('[data-tab=users]').click()");assert.equal(await panel.webContents.executeJavaScript("document.querySelectorAll('.account').length"),1);
 await panel.webContents.executeJavaScript("document.querySelector('[data-tab=accounts]').click();document.querySelector('#search').value='Claude';document.querySelector('#search').dispatchEvent(new Event('input'))");assert.equal(await panel.webContents.executeJavaScript("document.querySelectorAll('.account').length"),1);
 await panel.webContents.executeJavaScript("document.querySelector('#search').value='';document.querySelector('#search').dispatchEvent(new Event('input'))");
 await panel.webContents.executeJavaScript("window.pet.action('hide')");await wait(100);assert.equal(orb.isVisible(),false);assert.equal(panel.isVisible(),false);visible(true);assert.equal(orb.isVisible(),true);

 for(let i=0;i<4;i++){await dashboard.webContents.executeJavaScript("document.querySelector('[data-action=hide]').click()");await wait(80);const expected=i%2===1;assert.equal(orb.isVisible(),expected);assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('[data-action=hide]').textContent"),expected?'隐藏':'显示');assert.equal(await panel.webContents.executeJavaScript("document.querySelector('[data-action=hide]').textContent"),expected?'隐藏':'显示');}
 visible(false);await wait(60);assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('[data-action=hide]').textContent"),'显示');visible(true);
 await orb.webContents.executeJavaScript("window.pet.action('expand')");await wait(100);assert.equal(panel.isVisible(),true);
 await panel.webContents.executeJavaScript("window.pet.action('collapse')");await wait(100);assert.equal(panel.isVisible(),false);expand();
 dashboard.hide();await orb.webContents.executeJavaScript("const target=document.querySelector('#orb');target.dispatchEvent(new PointerEvent('pointerdown',{button:0,pointerId:1,screenX:20,screenY:20}));target.dispatchEvent(new PointerEvent('pointerup',{button:0,pointerId:1}));");await wait(120);assert.equal(dashboard.isVisible(),true);assert.equal(panel.isVisible(),false);assert.equal(await dashboard.webContents.executeJavaScript("document.body.classList.contains('dashboard')"),true);expand();
 await wait(250);testHoverExit();await wait(160);assert.equal(panel.isVisible(),false);expand();

 await dashboard.webContents.executeJavaScript("window.pet.savePreferences({refreshMinutes:0,lowQuotaReminder:true})");await wait(80);
 assert.equal(await panel.webContents.executeJavaScript("document.querySelector('#refresh-description').textContent"),'仅手动更新');
 assert.equal(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'preferences.json'))).refreshMinutes,0);
 await dashboard.webContents.executeJavaScript("window.pet.savePreferences({refreshMinutes:60,lowQuotaReminder:true})");await wait(80);
 assert.equal(await panel.webContents.executeJavaScript("document.querySelector('#refresh-description').textContent"),'每 60 分钟自动更新');
 const lowData=normalize(data);lowData.accounts[0].windows[0].remaining=10;setSnapshot(lowData);await wait(80);
 assert.equal(await orb.webContents.executeJavaScript("document.querySelector('#orb').classList.contains('low-quota')"),true);
 assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('#low-notice').hidden"),false);
 await dashboard.webContents.executeJavaScript("document.querySelector('#dismiss-notice').click()");await wait(160);
 assert.equal(await panel.webContents.executeJavaScript("document.querySelector('#low-notice').hidden"),true);
 assert.equal(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'preferences.json'))).showLowNotice,false);
 setSnapshot(lowData);await wait(80);assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('#low-notice').hidden"),true);
 await dashboard.webContents.executeJavaScript("window.pet.snapshot().then(d=>window.pet.savePreferences({...d.preferences,showLowNotice:true}))");await wait(100);
 assert.equal(await panel.webContents.executeJavaScript("document.querySelector('#low-notice').hidden"),false);
 const positions=await dashboard.webContents.executeJavaScript("Array.from(document.querySelectorAll('.account')).slice(0,2).map(n=>({x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y}))");assert.equal(positions[0].y,positions[1].y);assert.notEqual(positions[0].x,positions[1].x);

 assert.equal(await orb.webContents.executeJavaScript("getComputedStyle(document.querySelector('#orb')).animationIterationCount"),'3');
 await wait(3900);assert.equal(await orb.webContents.executeJavaScript("document.querySelector('#orb').classList.contains('low-quota')"),false);
 setSnapshot(lowData);await wait(80);assert.equal(await orb.webContents.executeJavaScript("document.querySelector('#orb').classList.contains('low-quota')"),false);
 await dashboard.webContents.executeJavaScript("window.pet.savePreferences({refreshMinutes:5,lowQuotaReminder:true,browserBehind:true})");testLayer(true);assert.equal(orb.isAlwaysOnTop(),false);testLayer(false);assert.equal(orb.isAlwaysOnTop(),true);

 await dashboard.webContents.executeJavaScript("window.pet.savePreferences({refreshMinutes:5,lowQuotaReminder:false})");await wait(80);
 assert.equal(await orb.webContents.executeJavaScript("document.querySelector('#orb').classList.contains('low-quota')"),false);
 await dashboard.webContents.executeJavaScript("window.pet.savePreferences({refreshMinutes:5,lowQuotaReminder:true})");
 lowData.accounts[0].windows[0].remaining=11;setSnapshot(lowData);await wait(80);
 assert.equal(await orb.webContents.executeJavaScript("document.querySelector('#orb').classList.contains('low-quota')"),false);
 setSnapshot(normalize(data));

 assert.equal(require('electron').nativeTheme.themeSource,'light');
 for(const theme of ['cream','ocean','mint','lavender']){await dashboard.webContents.executeJavaScript(`window.pet.snapshot().then(d=>window.pet.savePreferences({...d.preferences,theme:'${theme}',openInBrowser:true}))`);await wait(60);assert.equal(await panel.webContents.executeJavaScript('document.body.dataset.theme'),theme);}
 assert.equal(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'preferences.json'))).openInBrowser,true);
 await dashboard.webContents.executeJavaScript("window.pet.snapshot().then(d=>window.pet.savePreferences({...d.preferences,theme:'cream',openInBrowser:false}))");
 const remoteUI=require('./remote-ui.cjs');await panel.webContents.insertCSS(remoteUI.css);
 await panel.webContents.executeJavaScript(`(()=>{const form=document.createElement('form');form.id='delete-fixture';form.setAttribute('onsubmit','return confirm("old dialog")');for(const [name,value] of [['op','delete'],['name','codex-abc123-fixture@example.invalid-plus.json']]){const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;form.append(input);}document.body.append(form);window.fixtureSubmits=0;})()`);
 await panel.webContents.executeJavaScript(remoteUI.script);
 await panel.webContents.executeJavaScript(`(()=>{const form=document.querySelector('#delete-fixture');form.addEventListener('submit',e=>{if(!e.defaultPrevented)window.fixtureSubmits++;e.preventDefault();});form.requestSubmit();})()`);
 assert.equal(await panel.webContents.executeJavaScript("document.querySelector('#pet-delete-dialog').open"),true);
 assert.equal(await panel.webContents.executeJavaScript("document.querySelector('#pet-delete-dialog p').textContent"),'fixture@example.invalid');
 await panel.webContents.executeJavaScript("document.querySelector('#pet-delete-dialog button').click()");assert.equal(await panel.webContents.executeJavaScript('window.fixtureSubmits'),0);
 await panel.webContents.executeJavaScript("document.querySelector('#delete-fixture').requestSubmit();document.querySelector('#pet-delete-dialog .danger').click()");assert.equal(await panel.webContents.executeJavaScript('window.fixtureSubmits'),1);
 await panel.webContents.executeJavaScript("document.querySelector('#delete-fixture').remove()");

 await dashboard.webContents.executeJavaScript("document.querySelector('[data-action=settings]').click()");await wait(80);assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('.preferences').open"),true);
 setSnapshot({...normalize(data),state:'ok'});await wait(80);assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('[data-action=login]').hidden"),true);
 setSnapshot({...normalize(data),state:'auth'});await wait(80);assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('[data-action=login]').hidden"),false);
 await dashboard.webContents.executeJavaScript("document.querySelector('[data-action=close-menu]').click()");await wait(80);assert.equal(dashboard.isVisible(),true);dismissCloseMenu();await panel.webContents.executeJavaScript("window.pet.action('collapse')");await wait(80);assert.equal(panel.isVisible(),false);await dashboard.webContents.executeJavaScript("window.pet.snapshot().then(x=>window.pet.savePreferences({...x.preferences,appAlwaysOnTop:true}))");await wait(80);assert.equal(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'preferences.json'))).appAlwaysOnTop,true);assert.equal(dashboard.isAlwaysOnTop(),true);testLayer(true);assert.equal(dashboard.isAlwaysOnTop(),true);testLayer(false);await dashboard.webContents.executeJavaScript("window.pet.snapshot().then(x=>window.pet.savePreferences({...x.preferences,appAlwaysOnTop:false}))");

 await panel.webContents.executeJavaScript("document.querySelector('main').scrollTop=document.querySelector('main').scrollHeight");await wait(80);assert.equal(await panel.webContents.executeJavaScript("document.querySelector('#back-to-top').hidden"),false);await panel.webContents.executeJavaScript("document.querySelector('#back-to-top').click()");await wait(100);assert.equal(await panel.webContents.executeJavaScript("document.querySelector('main').scrollTop"),0);
 assert.equal(dashboard.isAlwaysOnTop(),false);
 showDashboard();await wait(80);
 const controlMetrics=()=>dashboard.webContents.executeJavaScript(`Array.from(document.querySelectorAll('.window-controls button')).map(button=>{const r=button.getBoundingClientRect();return {action:button.dataset.action,x:r.x,y:r.y,width:r.width,height:r.height,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===button};})`);
 const topControls=await controlMetrics();
 await dashboard.webContents.executeJavaScript("document.querySelector('main').scrollTop=document.querySelector('main').scrollHeight");await wait(100);
 const bottomControls=await controlMetrics();assert.deepEqual(bottomControls,topControls);assert(bottomControls.every(b=>b.hit&&b.y>=0&&b.y<40));
 await dashboard.webContents.executeJavaScript("document.querySelector('[data-action=minimize]').click()");await wait(450);assert(dashboard.isMinimized());showDashboard();await wait(100);
 await dashboard.webContents.executeJavaScript("document.querySelector('[data-action=maximize]').click()");await wait(180);assert(dashboard.isMaximized());assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('[data-action=maximize]').title"),'还原窗口');
 await dashboard.webContents.executeJavaScript("document.querySelector('[data-action=maximize]').click()");await wait(180);assert(!dashboard.isMaximized());
 await dashboard.webContents.executeJavaScript("document.querySelector('[data-action=close-menu]').click()");await wait(80);assert(dashboard.isVisible());dismissCloseMenu();
 await dashboard.webContents.executeJavaScript("document.querySelector('#app-pin').checked=true;document.querySelector('#app-pin').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#preferences-form').requestSubmit()");await wait(120);assert(dashboard.isAlwaysOnTop());
 await dashboard.webContents.executeJavaScript("document.querySelector('#app-pin').checked=false;document.querySelector('#app-pin').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#preferences-form').requestSubmit()");await wait(120);assert(!dashboard.isAlwaysOnTop());
 fs.mkdirSync(path.join(__dirname,'evidence/window-controls-20260926'),{recursive:true});await fs.promises.writeFile(path.join(__dirname,'evidence/window-controls-20260926/bottom-controls.png'),(await dashboard.capturePage()).toPNG());
 console.log('WINDOW_CONTROLS_NATIVE PASS: app pin on/off; pin independent of orb layering; saved; bottom scroll controls visible/hittable; minimize; maximize; restore; close menu');
 // Trace real UI actions through main routing without opening signed-in sites during fixtures.
 const electron=require('electron'),originalOpen=electron.shell.openExternal,opened=[];
 electron.shell.openExternal=async url=>{opened.push(url);};
 try{
  await dashboard.webContents.executeJavaScript("document.querySelector('#open-in-browser').checked=true;document.querySelector('#open-in-browser').dispatchEvent(new Event('change',{bubbles:true}))");await wait(150);
  assert.equal(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'preferences.json'))).openInBrowser,true);
  for(const action of ['console','manage','add']){await dashboard.webContents.executeJavaScript(`document.querySelector('[data-action=${action}]').click()`);await wait(60);}
  assert.deepEqual(opened,['https://console.yulitongxing.com/','https://pool.yulitongxing.com/','https://pool.yulitongxing.com/add']);
  await dashboard.webContents.executeJavaScript("document.querySelector('#open-in-browser').checked=false;document.querySelector('#open-in-browser').dispatchEvent(new Event('change',{bubbles:true}))");await wait(150);
  assert.equal(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'preferences.json'))).openInBrowser,false);
 }finally{electron.shell.openExternal=originalOpen;}
 await dashboard.webContents.executeJavaScript("document.querySelector('#browser-behind').checked=true;document.querySelector('#browser-behind').dispatchEvent(new Event('change',{bubbles:true}))");await wait(120);
 visible(true);testLayer(true);assert(!orb.isVisible());assert(!panel.isVisible());testLayer(false);assert(orb.isVisible());
 visible(false);testLayer(true);testLayer(false);assert(!orb.isVisible());visible(true);
 await dashboard.webContents.executeJavaScript("document.querySelector('#browser-behind').checked=false;document.querySelector('#browser-behind').dispatchEvent(new Event('change',{bubbles:true}))");await wait(120);testLayer(true);assert(orb.isVisible());testLayer(false);
 console.log('BROWSER_SWITCH_UI PASS: immediate persistence; three external routes; foreground hide/restore; manual hide preserved; disabled mode visible');
 // Verify the OS window flag and z-order, not just Electron's cached property.
 const overlap=new (require('electron').BrowserWindow)({show:false,width:420,height:300,alwaysOnTop:false});
 await overlap.loadURL('data:text/html,<h1>Ordinary window test</h1>');
 const nativeState=()=>{
  const handle=dashboard.getNativeWindowHandle().readBigUInt64LE().toString(),other=overlap.getNativeWindowHandle().readBigUInt64LE().toString();
  const script=`Add-Type 'using System;using System.Runtime.InteropServices;public class PinProbe{[DllImport("user32.dll")]public static extern int GetWindowLong(IntPtr h,int n);[DllImport("user32.dll")]public static extern IntPtr GetWindow(IntPtr h,uint cmd);}';$h=[IntPtr]${handle};$other=[IntPtr]${other};$top=([PinProbe]::GetWindowLong($h,-20) -band 8) -ne 0;$w=$h;$above=$false;for($i=0;$i -lt 2048;$i++){$w=[PinProbe]::GetWindow($w,2);if($w -eq [IntPtr]::Zero){break};if($w -eq $other){$above=$true;break}};@{topmost=$top;aboveOther=$above}|ConvertTo-Json -Compress`;
  return JSON.parse(require('node:child_process').execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',script],{windowsHide:true,encoding:'utf8'}));
 };
 try{
  await dashboard.webContents.executeJavaScript("window.pet.savePreferences({appAlwaysOnTop:false})");showDashboard();await wait(80);
  await dashboard.webContents.executeJavaScript("document.querySelector('#window-pin').click()");await wait(200);
  assert.equal(await dashboard.webContents.executeJavaScript("document.querySelector('#window-pin').getAttribute('aria-pressed')"),'true');
  assert.equal(await panel.webContents.executeJavaScript("document.querySelector('#app-pin').checked"),true);
  overlap.show();overlap.focus();await wait(150);const pinned=nativeState();assert.equal(pinned.topmost,true);assert.equal(pinned.aboveOther,true);
  console.log('PIN_OS_ENABLED PASS: WS_EX_TOPMOST=true; above ordinary window=true');
  await dashboard.webContents.executeJavaScript("document.querySelector('#window-pin').click()");await wait(150);assert.equal(nativeState().topmost,false);assert.equal(dashboard.isAlwaysOnTop(),false);
  await dashboard.webContents.executeJavaScript("document.querySelector('#app-pin').checked=true;document.querySelector('#app-pin').dispatchEvent(new Event('change',{bubbles:true}))");await wait(180);assert.equal(nativeState().topmost,true);
  const saved=JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'preferences.json')));assert.equal(saved.appAlwaysOnTop,true);
  showDashboard();fs.mkdirSync(path.join(__dirname,'evidence/pogget-pin-20260926'),{recursive:true});await fs.promises.writeFile(path.join(__dirname,'evidence/pogget-pin-20260926/pinned.png'),(await dashboard.capturePage()).toPNG());
  await dashboard.webContents.executeJavaScript("document.querySelector('#app-pin').checked=false;document.querySelector('#app-pin').dispatchEvent(new Event('change',{bubbles:true}))");await wait(150);assert.equal(nativeState().topmost,false);
  console.log('PIN_OS_DISABLED_AND_SETTINGS PASS: WS_EX_TOPMOST=false; settings immediate; saved; cross-window synchronized');
 }finally{overlap.destroy();}
 const {t}=require('./i18n.js');
 const named=normalize(data);named.accounts[0].owner='小猫团队 · user@example.com';setSnapshot(named);
 await dashboard.webContents.executeJavaScript("window.noReloadMarker=12345");
 for(const language of ['en','zh-TW','zh-CN','en','zh-CN']){
  await dashboard.webContents.executeJavaScript(`document.querySelector('#app-language').value='${language}';document.querySelector('#app-language').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#preferences-form').requestSubmit()`);await wait(180);
  assert.equal(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'preferences.json'))).language,language);
  for(const win of [dashboard,panel]){
   const metrics=await win.webContents.executeJavaScript(`({lang:document.documentElement.lang,brand:document.querySelector('h1').textContent,help:document.querySelector('#hotkey-help').textContent,tooltip:document.querySelector('[data-action=hide]').title,owners:Array.from(document.querySelectorAll('.account .head'),n=>n.textContent),invalid:Array.from(document.querySelectorAll('[data-i18n]')).filter(n=>n.textContent!==PetI18n.t(n.dataset.i18n,{},document.documentElement.lang)).map(n=>n.dataset.i18n)})`);
   assert.equal(metrics.lang,language);assert.equal(metrics.brand,t('pet',{},language));assert.equal(metrics.help,t('hotkeyHelp',{},language));assert(metrics.owners.includes('小猫团队 · user@example.com')); assert.deepEqual(metrics.invalid,[]);assert(metrics.tooltip.includes(t('pet',{},language)));
  }
  assert.equal(await dashboard.webContents.executeJavaScript('window.noReloadMarker'),12345);
  const orbMetrics=await orb.webContents.executeJavaScript("({lang:document.documentElement.lang,title:document.querySelector('#orb').title,alt:document.querySelector('img').alt})");assert.equal(orbMetrics.lang,language);assert(orbMetrics.title.includes(t('pet',{},language)));assert.equal(orbMetrics.alt,t('pet',{},language));
  assert.equal(getNativeLabels()[1],t('showPet',{},language));
  setSnapshot(named);await wait(60);assert.equal(await panel.webContents.executeJavaScript("document.querySelector('h1').textContent"),t('pet',{},language));
 }
 setSnapshot(normalize(data));console.log('I18N_NATIVE_UI PASS: 5 language switches; both windows; orb; tray; persistence; refresh; no reload; account data unchanged');
 const b=panel.getBounds();assert.ok(b.width>200&&b.height>200);
 await fs.promises.writeFile(path.join(__dirname,'smoke.png'),(await panel.capturePage()).toPNG());
 console.log('SMOKE PASS: native windows, tray, search, tabs, hide/restore, expand/collapse, screenshot; DPAPI vault roundtrip, encrypted-at-rest, clear; cat icon; login sync without closing login first; single click dashboard; pointer exit closes within 160ms; preferences 0/60/5 persisted and synchronized; low quota pulse on/off/recovery; exactly 3 pulses; no repeat; browser layering; scrollbar-free orb at all five sizes; dismiss persisted and synchronized; restore notice; desktop two-column cards; forced light theme; four themes; browser preference; custom delete cancel and confirm; repeated hide/show toggle and external visibility synchronization');app.quit();
};


