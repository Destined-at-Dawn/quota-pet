const {app,BrowserWindow,Tray,Menu,ipcMain,screen,nativeImage,session,globalShortcut,safeStorage,nativeTheme,shell,dialog}=require('electron');
nativeTheme.themeSource='light';
const path=require('node:path'),fs=require('node:fs');
const {normalize,dockBounds,panelBounds}=require('./model');
const i18n=require('./i18n.js');const nativeMenus=require('./native-menus.cjs');
const t=(key,params={})=>i18n.t(key,params,preferences.language);
const ORIGIN='https://pool.yulitongxing.com';
const TRANSIT_ORIGIN='https://console.yulitongxing.com';
function openExternalPage(url){shell.openExternal(url).catch(()=>{for(const w of [dashboard,panel])if(w&&!w.isDestroyed())w.webContents.send('operation-error','browserOpenFailed');});}
const {createVault}=require('./auth-vault.cjs');
const {defaults,validate,createScheduler,lowQuota}=require('./preferences.cjs');
const {createHotkeyManager}=require('./hotkey.cjs');
const petCatalog=require('./pet-catalog.cjs'),{createSelector}=require('./pet-contract.js');
const roaming=require('./pet-roaming.cjs').createRoaming();let roamTimer,petHovered=false,petDragging=false,petReducedMotion=false,petAnchor=null,petMotion={walking:false,heading:0};
const petBehavior=require('./pet-behavior.cjs').createBehavior();let petState={state:'unknown',event:null},settingsWindow,settingsHistory=[];
function applyOpacity(){for(const [w,key] of [[panel,'sidebarOpacity'],[dashboard,'appOpacity'],[orb,'petOpacity']])if(w&&!w.isDestroyed())w.setOpacity(preferences[key]/100);}
let hotkeyError='';const hotkeys=createHotkeyManager(globalShortcut,()=>{visible(true);showDashboard();});
let preferences={...defaults},preferencesFile,cacheFile;const refreshScheduler=createScheduler(()=>refresh());
function payload(){return {...(last||{}),appVersion:app.getVersion(),update:autoUpdater.snapshot(),preferences,petPack:petCatalog.getPack(preferences.petId),petCatalog:petCatalog.catalog,undoCount:settingsHistory.length,settingsVisible:!!settingsWindow?.isVisible(),petState,petMotion,hotkeyError,appPinActive:!!dashboard&&!dashboard.isDestroyed()&&dashboard.isAlwaysOnTop(),foregroundStatus,browserSuppressed:preferences.browserBehind&&browserFront&&!preferences.appAlwaysOnTop,windowMaximized:!!dashboard&&!dashboard.isDestroyed()&&dashboard.isMaximized(),orbVisible:orbRequestedVisible,lowQuota:lowQuota(last,preferences)};}
function loadPreferences(){try{const saved=JSON.parse(fs.readFileSync(preferencesFile,'utf8'));preferences=validate(saved);settingsHistory=Array.isArray(saved._undo)?saved._undo.map(validate):[];}catch{preferences={...defaults};}}
function loadCachedSnapshot(){try{const cached=JSON.parse(fs.readFileSync(cacheFile,'utf8'));if(cached&&Array.isArray(cached.accounts)){last={...cached,state:'ready',messageKey:'cached'};return true;}}catch{}return false;}
function saveCachedSnapshot(){try{if(last&&Array.isArray(last.accounts))fs.writeFileSync(cacheFile+'.tmp',JSON.stringify({...last, cachedAt:Date.now()}));fs.renameSync(cacheFile+'.tmp',cacheFile);}catch{}} 
function updateAppPin(){clearTimeout(hideTimer);clearTimeout(dashboardHideTimer);for(const window of [dashboard,consoleWindow,manager,login])if(window&&!window.isDestroyed()){window.setAlwaysOnTop(preferences.appAlwaysOnTop);if(window.isAlwaysOnTop()!==preferences.appAlwaysOnTop)throw Error('APP_PIN_FAILED');}}
function updatePreferences(value,{undo=false}={}){const next=validate({...preferences,...value});if(Object.keys(next).every(key=>JSON.stringify(next[key])===JSON.stringify(preferences[key]))&&!undo)return preferences;const history=undo?settingsHistory.slice(0,-1):[...settingsHistory,preferences];const persist=()=>{fs.writeFileSync(preferencesFile+'.tmp',JSON.stringify({...next,_undo:history}));fs.renameSync(preferencesFile+'.tmp',preferencesFile);};if(next.hotkey===preferences.hotkey&&hotkeyError){persist();}else{hotkeys.set(next.hotkey,persist);hotkeyError='';}const wasPinned=preferences.appAlwaysOnTop;const updateChanged=preferences.autoUpdate!==next.autoUpdate;preferences=next;settingsHistory=history;autoUpdater.configure(preferences.autoUpdate);if(updateChanged&&preferences.autoUpdate&&!smoke)checkForUpdates();applyPetSize();applyOpacity();updateNativeLanguage();updateAppPin();applyLayer(browserFront);if(wasPinned&&!preferences.appAlwaysOnTop){collapseLater();collapseDashboardLater();}refreshScheduler.configure(preferences.refreshMinutes);send();return preferences;}
let preferenceQueue=Promise.resolve();
function queuedPreferences(value,{undo=false}={}){
 const task=preferenceQueue.then(async()=>{
  if(undo&&!settingsHistory.length)return preferences;
  const patch=undo?settingsHistory.at(-1):value,next=validate({...preferences,...patch});
  if(next.petId!==preferences.petId){
   const selector=createSelector({initial:petCatalog.getPack(preferences.petId),
    prepare:async pack=>{const urls=Object.values(pack.assets);for(const asset of urls)if(!fs.existsSync(path.join(__dirname,asset)))throw Error('PET_ASSET_MISSING');
     await orb.webContents.executeJavaScript(`Promise.all(${JSON.stringify(urls)}.map(src=>{const img=new Image();img.src=src;return img.decode();}))`);},
    persist:async()=>updatePreferences(patch,{undo})});
   await selector.select(petCatalog.getPack(next.petId));return preferences;
  }
  return updatePreferences(patch,{undo});
 });preferenceQueue=task.catch(()=>{});return task;
}
let consoleWindow,manager,stopForeground,browserFront=false,orbRequestedVisible=true,foregroundStatus='starting';
function applyLayer(active){const changed=browserFront!==active;browserFront=active;const behind=preferences.browserBehind&&active&&!preferences.appAlwaysOnTop;for(const w of [orb,panel])if(w&&!w.isDestroyed())w.setAlwaysOnTop(!behind);if(behind){orb?.hide();panel?.hide();}else if(orbRequestedVisible&&orb&&!orb.isDestroyed()&&!orb.isVisible())orb.showInactive();if(changed)send();}
const updateChecker=require('./update-check.cjs').createUpdateChecker({current:app.getVersion(),fetchImpl:(...args)=>require('electron').net.fetch(...args),onChange:()=>send()});
const autoUpdater=require('./auto-update.cjs').createAutoUpdater({checker:updateChecker,current:app.getVersion(),runtime:process.versions.electron,publicKey:fs.readFileSync(path.join(__dirname,'update-public-key.txt')),fetchImpl:(...args)=>require('electron').net.fetch(...args),folder:path.join(app.getPath('userData'),'updates','downloads'),onChange:()=>{if(store)send();},onReady:async()=>{
 if(smoke)return;
 const result=await dialog.showMessageBox({type:'info',title:t('checkUpdate'),message:t('updateReady'),buttons:[t('installUpdate'),t('updateLater'),t('cancelAutoUpdate')],defaultId:1,cancelId:1});
 if(result.response===0)installUpdate();else if(result.response===2)updatePreferences({autoUpdate:false});
}});
function checkForUpdates(manual=false){return autoUpdater.check({manual});}
function downloadUpdate(){return autoUpdater.download();}
function launchReadyUpdate(){return autoUpdater.install(({archive,release})=>require('./auto-update.cjs').launchInstaller({app,archive,release,userData:app.getPath('userData')}));}
function installUpdate(){if(launchReadyUpdate())app.quit();}
function openConsole(){if(preferences.openInBrowser){openExternalPage(TRANSIT_ORIGIN+'/');return;}if(consoleWindow&&!consoleWindow.isDestroyed()){consoleWindow.show();consoleWindow.focus();return;}const origin=TRANSIT_ORIGIN;consoleWindow=new BrowserWindow({alwaysOnTop:preferences.appAlwaysOnTop,width:1180,height:850,title:t('windowTitle',{page:t('console')}),backgroundColor:'#ffffff',autoHideMenuBar:true,icon:path.join(__dirname,'icon.png'),webPreferences:{partition:'persist:quota-pet-pool',nodeIntegration:false,contextIsolation:true,sandbox:true}});consoleWindow.setMenu(null);require('./remote-ui.cjs').install(consoleWindow);consoleWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));consoleWindow.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==origin)event.preventDefault();});consoleWindow.on('closed',()=>{consoleWindow=null;});consoleWindow.loadURL(origin+'/');}
function manageAccounts(page="/"){if(preferences.openInBrowser){openExternalPage(ORIGIN+page);return;}if(manager&&!manager.isDestroyed()){manager.show();manager.focus();manager.loadURL(ORIGIN+page);return;}manager=new BrowserWindow({alwaysOnTop:preferences.appAlwaysOnTop,width:1100,height:820,title:t('windowTitle',{page:t('manage')}),backgroundColor:'#ffffff',autoHideMenuBar:true,icon:path.join(__dirname,'icon.png'),webPreferences:{partition:'persist:quota-pet-pool',nodeIntegration:false,contextIsolation:true,sandbox:true}});manager.setMenu(null);require('./remote-ui.cjs').install(manager);require('./account-links.cjs').installAccountLinks(manager.webContents,ORIGIN,url=>shell.openExternal(url));manager.webContents.on('did-finish-load',()=>{if(!smoke)scheduleAuthRefresh();});manager.on('closed',()=>{manager=null;if(!smoke){paused=false;refresh();}});manager.loadURL(ORIGIN+page);}
let vault,smokeAuth=false,authRestorePromise=Promise.resolve();
async function saveAuthorization(){const cookies=await session.fromPartition('persist:quota-pet-pool').cookies.get({url:ORIGIN});if(cookies.length)vault.save(cookies.map(c=>({...c,domain:c.domain.replace(/^\./,'')})));else vault.clear();}
async function restoreAuthorization(){const jar=session.fromPartition('persist:quota-pet-pool').cookies;const existing=await jar.get({url:ORIGIN});if(existing.length)return;const written=[];try{const records=vault.load();for(const c of records){const details={url:ORIGIN,name:c.name,value:c.value,path:c.path||'/',secure:true,httpOnly:!!c.httpOnly};if(!c.hostOnly)details.domain=c.domain;if(c.expirationDate)details.expirationDate=c.expirationDate;if(c.sameSite)details.sameSite=c.sameSite;await jar.set(details);written.push(c);}}catch{for(const c of written)await jar.remove(ORIGIN+(c.path||'/'),c.name);vault.clear();last={state:'auth',messageKey:'sessionExpired'};}}
let orb,panel,dashboard,tray,trayMenu,closeOptionsMenu,login,store,hasCachedSnapshot=false,edge='right',y=240,orbSize=72,authTimer,refreshAgain=false,hideTimer,dashboardHideTimer,busy=false,paused=false,last=null,quitting=false,autoLoginOpened=false;
const hoverSmoke=process.argv.includes('--hover-smoke');
const settingsSmoke=process.argv.includes('--settings-smoke');
const pet25Smoke=process.argv.includes('--pet-25d-smoke');
const catSmoke=process.argv.includes('--cat-3d-smoke')||pet25Smoke;
const smoke=process.argv.includes('--smoke')||hoverSmoke||settingsSmoke||catSmoke;
const connectionCheck=process.argv.includes('--connection-check');
const diagnosticCheck=process.argv.includes('--diagnostic-check');
const managementCheck=process.argv.includes('--management-check');
if(smoke)app.setPath('userData',process.env.QUOTA_PET_TEST_PROFILE||path.join(__dirname,pet25Smoke?'.pet-25d-smoke-profile':catSmoke?'.cat-3d-smoke-profile':settingsSmoke?'.settings-smoke-profile':hoverSmoke?'.hover-smoke-profile':'.smoke-profile'));
function send(){petState=petBehavior.update(last);for(const w of [panel,dashboard,orb,settingsWindow])if(w&&!w.isDestroyed())w.webContents.send('snapshot',payload());if(!smoke&&store)fs.writeFileSync(path.join(app.getPath('userData'),'runtime-status.json'),JSON.stringify({at:new Date().toISOString(),update:autoUpdater.snapshot(),version:app.getVersion(),pid:process.pid,petRenderer:'layered-2.5d',petId:preferences.petId,state:last?.state||'loading',refreshMinutes:preferences.refreshMinutes,lowQuotaReminder:preferences.lowQuotaReminder,lowQuotaCount:lowQuota(last,preferences).length,browserBehind:preferences.browserBehind,browserFront,foregroundStatus,browserSuppressed:preferences.browserBehind&&browserFront&&!preferences.appAlwaysOnTop,appAlwaysOnTop:preferences.appAlwaysOnTop,openInBrowser:preferences.openInBrowser,dashboardAlwaysOnTop:dashboard?.isAlwaysOnTop(),accounts:last?.accounts?.length||0,users:last?.users?.length||0,relayError:last?.relayError||null,taskbarWindow:!!dashboard&&!dashboard.isDestroyed(),dashboardVisible:dashboard?.isVisible(),settingsVisible:settingsWindow?.isVisible()||false,opacity:{sidebar:panel?.getOpacity(),app:dashboard?.getOpacity(),pet:orb?.getOpacity()},undoCount:settingsHistory.length,petState,orbVisible:orb?.isVisible(),loginVisible:login?.isVisible()||false}));}
function showDashboard(){clearTimeout(dashboardHideTimer);panel?.hide();if(dashboard.isMinimized())dashboard.restore();dashboard.show();dashboard.focus();send();}
function save(){fs.writeFileSync(store,JSON.stringify({edge,y,orbSize,anchor:petAnchor}));}
function dock(){const area=screen.getDisplayNearestPoint({x:orb?.getBounds().x||0,y}).workArea;const b=dockBounds(area,edge,y,orbSize);y=b.y;orb.setBounds(b);setPetAnchor(b);save();}
function setPetAnchor(point){petAnchor={x:point.x,y:point.y};roaming.anchor(petAnchor);}
function applyPetSize(){if(!orb||orb.isDestroyed()||orbSize===preferences.petSize)return;orbSize=preferences.petSize;const b=orb.getBounds(),a=screen.getDisplayMatching(b).workArea;orb.setBounds({x:Math.max(a.x,Math.min(b.x,a.x+a.width-orbSize)),y:Math.max(a.y,Math.min(b.y,a.y+a.height-orbSize)),width:orbSize,height:orbSize});setPetAnchor(orb.getBounds());save();}
function tickPet(dt=.05){if(!orb||orb.isDestroyed())return;const b=orb.getBounds(),a=screen.getDisplayMatching(b).workArea;
 const next=roaming.tick(dt,{area:a,size:Math.max(orbSize,b.width,b.height),radius:preferences.petMoveRadius,speed:preferences.petMoveSpeed,enabled:preferences.petMovement&&preferences.petAnimation&&!petReducedMotion&&petCatalog.getPack(preferences.petId).motionProfile!=='still',paused:petHovered||petDragging||panel?.isVisible()||!orb.isVisible()||petState.state==='exhausted'});
 const point={x:Math.round(next.x),y:Math.round(next.y)};if(point.x!==b.x||point.y!==b.y||Math.abs(b.width-orbSize)>1||Math.abs(b.height-orbSize)>1)orb.setBounds({...point,width:orbSize,height:orbSize},false);
 petMotion={walking:next.walking,heading:next.heading,dragging:petDragging};orb.webContents.send('pet-motion',petMotion);
}
function startRoaming(){clearInterval(roamTimer);let last=performance.now();roamTimer=setInterval(()=>{const now=performance.now();tickPet((now-last)/1000);last=now;},50);}
function expand(){if(!panel||panel.isDestroyed())return;if(preferences.browserBehind&&browserFront&&!preferences.appAlwaysOnTop)return;clearTimeout(hideTimer);const a=screen.getDisplayMatching(orb.getBounds()).workArea;panel.setBounds(panelBounds(a,orb.getBounds(),edge));panel.showInactive();send();}
function insideWindow(point,window){if(!window||window.isDestroyed()||!window.isVisible())return false;const b=window.getBounds();return point.x>=b.x&&point.x<b.x+b.width&&point.y>=b.y&&point.y<b.y+b.height;}
function collapseLater(cursor=()=>screen.getCursorScreenPoint()){clearTimeout(hideTimer);if(preferences.appAlwaysOnTop)return;hideTimer=setTimeout(()=>{if(preferences.appAlwaysOnTop)return;const p=cursor();if(!insideWindow(p,panel)&&!insideWindow(p,orb)){panel?.hide();send();}},120);}
function collapseDashboardLater(cursor=()=>screen.getCursorScreenPoint()){clearTimeout(dashboardHideTimer);if(preferences.appAlwaysOnTop)return;dashboardHideTimer=setTimeout(()=>{if(preferences.appAlwaysOnTop||!dashboard||dashboard.isDestroyed()||!dashboard.isVisible())return;if(!insideWindow(cursor(),dashboard)){dashboard.hide();send();}},120);}
function visible(show){orbRequestedVisible=show;if(show){if(!petAnchor)dock();applyLayer(browserFront);}else{orb.hide();panel?.hide();}send();}
function closeMenu(){closeOptionsMenu=Menu.buildFromTemplate(nativeMenus.closeTemplate(preferences.language,{background:()=>{if(preferences.appAlwaysOnTop){dashboard.show();dashboard.focus();}else dashboard.hide();},quit:()=>app.quit()}));closeOptionsMenu.popup({window:dashboard});}
function openSettings(){
 if(settingsWindow&&!settingsWindow.isDestroyed()){if(settingsWindow.isVisible())settingsWindow.hide();else{settingsWindow.show();settingsWindow.focus();}send();return;}
 const area=screen.getDisplayMatching((panel?.isVisible()?panel:orb).getBounds()).workArea;
 const anchor=panel?.isVisible()?panel.getBounds():orb.getBounds();const width=Math.min(460,area.width),height=Math.min(720,area.height);
 settingsWindow=new BrowserWindow({width,height,x:Math.max(area.x,Math.min(anchor.x-width-8,area.x+area.width-width)),y:Math.max(area.y,Math.min(anchor.y,area.y+area.height-height)),show:false,frame:false,transparent:true,resizable:true,minWidth:360,minHeight:360,alwaysOnTop:true,skipTaskbar:true,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 settingsWindow.setMenu(null);settingsWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));settingsWindow.webContents.on('will-navigate',e=>e.preventDefault());
 settingsWindow.on('close',e=>{if(!quitting){e.preventDefault();settingsWindow.hide();send();}});
 settingsWindow.once('ready-to-show',()=>{settingsWindow.show();settingsWindow.focus();send();});
 settingsWindow.loadFile(path.join(__dirname,'index.html'),{query:{view:'settings'}});
}

async function logout(){if(login&&!login.isDestroyed()){login.close();login=null;}if(manager&&!manager.isDestroyed()){manager.close();manager=null;}if(consoleWindow&&!consoleWindow.isDestroyed()){consoleWindow.close();consoleWindow=null;}paused=true;petBehavior.reset();try{await session.fromPartition('persist:quota-pet-pool').clearStorageData({storages:['cookies','localstorage','serviceworkers']});}catch{}try{vault.clear();}catch{}last={state:'auth',messageKey:'signedOut'};send();}
function authWindow(){if(login&&!login.isDestroyed()){login.show();return;}
 login=new BrowserWindow({alwaysOnTop:preferences.appAlwaysOnTop,backgroundColor:'#ffffff',width:1000,height:760,title:t('windowTitle',{page:t('login')}),icon:path.join(__dirname,'icon.png'),webPreferences:{partition:'persist:quota-pet-pool',nodeIntegration:false,contextIsolation:true,sandbox:true}});
 login.setMenu(null);login.webContents.on('did-finish-load',scheduleAuthRefresh);login.webContents.on('did-navigate',scheduleAuthRefresh);login.webContents.setWindowOpenHandler(()=>({action:'deny'}));login.webContents.on('will-navigate',(e,url)=>{if(new URL(url).origin!==ORIGIN)e.preventDefault();else if(new URL(url).pathname==='/logout')vault.clear();});login.loadURL(ORIGIN+'/login');login.on('closed',()=>{login=null;paused=false;refresh();});send();
}
function scheduleAuthRefresh(){clearTimeout(authTimer);authTimer=setTimeout(()=>{paused=false;refresh();},120);}
async function refresh(){if(smoke&&!smokeAuth)return;await authRestorePromise;if(busy){refreshAgain=true;return;}if(paused)return;busy=true;
 try{const r=await session.fromPartition('persist:quota-pet-pool').fetch(ORIGIN+'/api/quota',{credentials:'include',redirect:'manual',signal:AbortSignal.timeout(60000)});
 if([301,302,303,307,308,401,403].includes(r.status)){paused=true;vault.clear();last={state:'auth',messageKey:'authRequired'};send();return;}
 if(!r.ok)throw Error('HTTP '+r.status);last=normalize(await r.json());saveCachedSnapshot();try{await saveAuthorization();}catch{last.messageKey='authSaveFailed';}send();if(login&&!login.isDestroyed()){login.close();showDashboard();}
 }catch(e){last={...(last||{}),state:'error',messageKey:'refreshFailed'};send();}finally{busy=false;if(refreshAgain){refreshAgain=false;setTimeout(()=>refresh(),0);}}
}
function localWindow(file,width,height){const w=new BrowserWindow({width,height,show:false,frame:false,transparent:true,resizable:false,alwaysOnTop:true,skipTaskbar:true,hasShadow:false,webPreferences:{backgroundThrottling:false,preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});w.loadFile(file);w.webContents.setWindowOpenHandler(()=>({action:'deny'}));w.webContents.on('will-navigate',e=>e.preventDefault());return w;}
app.setName('Quota Pet');
app.setAppUserModelId('LiAPI.QuotaPet');
app.on('browser-window-created',(_,window)=>{if(process.platform==='win32')window.setAppDetails({appId:'LiAPI.QuotaPet',appIconPath:process.execPath,appIconIndex:0,relaunchCommand:'"'+process.execPath+'"'+(app.isPackaged?'':' "'+__dirname+'"'),relaunchDisplayName:'Quota Pet'});});

if(!app.requestSingleInstanceLock()){app.quit();}else{app.on('second-instance',()=>{if(orb&&dashboard){visible(true);showDashboard();}});app.whenReady().then(async()=>{
 if(app.isPackaged&&process.platform==='win32'){
 const shortcut=path.join(app.getPath('appData'),'Microsoft','Windows','Start Menu','Programs','Quota Pet.lnk');
 const details={target:process.execPath,cwd:path.dirname(process.execPath),description:'Quota Pet',icon:process.execPath,iconIndex:0,appUserModelId:'LiAPI.QuotaPet'};
 const ok=shell.writeShortcutLink(shortcut,fs.existsSync(shortcut)?'replace':'create',details);
 if(!ok)console.error('Quota Pet shortcut update failed');
}
 preferencesFile=path.join(app.getPath('userData'),'preferences.json');loadPreferences();
 vault=createVault(path.join(app.getPath('userData'),'auth.dat'),safeStorage);if(!smoke)authRestorePromise=restoreAuthorization().catch(()=>{});
 cacheFile=path.join(app.getPath('userData'),'quota-cache.json');hasCachedSnapshot=loadCachedSnapshot();store=path.join(app.getPath('userData'),'position.json');try{const p=JSON.parse(fs.readFileSync(store));edge=p.edge==='left'?'left':'right';y=Number.isFinite(p.y)?p.y:240;if(p.anchor&&Number.isFinite(p.anchor.x)&&Number.isFinite(p.anchor.y))petAnchor=p.anchor;}catch{}
 orbSize=preferences.petSize;orb=localWindow(path.join(__dirname,'orb.html'),orbSize,orbSize);
 if(petAnchor){orb.setBounds({...petAnchor,width:orbSize,height:orbSize});roaming.anchor(petAnchor);tickPet(0);}else dock();
 Menu.setApplicationMenu(null);
 session.fromPartition('persist:quota-pet-pool').cookies.on('changed',(_,cookie)=>{if(cookie.domain.replace(/^\./,'')==='pool.yulitongxing.com')scheduleAuthRefresh();});
 dashboard=new BrowserWindow({alwaysOnTop:preferences.appAlwaysOnTop,frame:false,width:720,height:820,minWidth:480,minHeight:500,show:false,title:'Quota Pet',icon:path.join(__dirname,'icon.png'),backgroundColor:'#f5f0fc',autoHideMenuBar:true,webPreferences:{backgroundThrottling:false,preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 dashboard.on('maximize',send);dashboard.on('unmaximize',send);dashboard.setMenu(null);dashboard.loadFile(path.join(__dirname,'index.html'),{query:{view:'dashboard'}});if(smoke)panel=localWindow(path.join(__dirname,'index.html'),440,620);else setImmediate(()=>{panel=localWindow(path.join(__dirname,'index.html'),440,620);applyOpacity();});applyOpacity();dashboard.webContents.setWindowOpenHandler(()=>({action:'deny'}));dashboard.webContents.on('will-navigate',e=>e.preventDefault());dashboard.on('close',e=>{if(!quitting){e.preventDefault();dashboard.hide();}});
 tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'icon.png')));tray.on('click',()=>{visible(true);showDashboard();expand();});updateNativeLanguage();
 try{hotkeys.set(preferences.hotkey);}catch(e){hotkeyError=e.message;dashboard.webContents.once('did-finish-load',()=>{send();openSettings();});}screen.on('display-metrics-changed',()=>dock());
 if(catSmoke){await require(pet25Smoke?'./pet-25d.smoke.cjs':'./cat-3d.smoke.cjs')({app,orb,panel,dashboard,getSettings:()=>settingsWindow,screen,tickPet,startRoaming,setPetAnchor,getMotion:()=>petMotion,setSnapshot:d=>{last=d;send();},loadPreferences,send});return;}
 if(settingsSmoke){await require('./settings-pet.smoke.cjs')({app,orb,panel,dashboard,openSettings,getSettings:()=>settingsWindow,showDashboard,expand,setSnapshot:d=>{last=d;send();},preferencesFile,loadPreferences,applyOpacity,send});return;}
 if(hoverSmoke){await require('./hover.smoke.cjs')({app,orb,panel,dashboard,showDashboard,expand,visible,setSnapshot:d=>{last=d;send();},normalize,testLayer:applyLayer});return;}
 if(smoke){await require('./smoke.cjs')({app,orb,panel,dashboard,showDashboard,visible,expand,normalize,setSnapshot:d=>{last=d;send();},testLayer:applyLayer,getNativeLabels:()=>trayMenu.items.map(item=>item.label),dismissCloseMenu:()=>closeOptionsMenu?.closePopup(),testHoverExit:()=>collapseLater(()=>({x:-999999,y:-999999})),testAuthSync:async data=>{const ses=session.fromPartition('persist:quota-pet-pool');ses.protocol.handle('https',()=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}}));try{smokeAuth=true;paused=true;login=new BrowserWindow({show:false,webPreferences:{partition:'persist:quota-pet-pool'}});login.on('closed',()=>{login=null;});scheduleAuthRefresh();await new Promise(r=>setTimeout(r,600));if(login||last?.accounts?.length!==data.accounts.length)throw Error('auth synchronization failed');}finally{smokeAuth=false;ses.protocol.unhandle('https');}}});return;}
 if(managementCheck){const r=await session.fromPartition('persist:quota-pet-pool').fetch(ORIGIN+'/',{redirect:'manual'});const html=await r.text();const result={status:r.status,reset:html.includes('value="reset"'),delete:html.includes('value="delete"'),import:html.includes('/upload')};console.log('MANAGEMENT_READ '+JSON.stringify(result));app.exit(r.status===200&&result.delete&&result.import?0:1);return;}
 if(diagnosticCheck){await refresh();console.log('DIAGNOSIS '+JSON.stringify({state:last?.state,accounts:(last?.accounts||[]).filter(a=>a.owner==='demo-one@example.com'||a.owner==='demo-two@example.com').map(a=>({account:a.owner,plan:a.plan,diagnosis:a.diagnosis,credits:a.credits.length}))}));app.exit(0);return;}
 if(connectionCheck){await refresh();console.log('CONNECTION '+JSON.stringify({state:last?.state,message:last?.message,accounts:last?.accounts?.length,users:last?.users?.length}));app.exit(last?.state==='error'?1:0);return;}
 startRoaming();stopForeground=require('./foreground.cjs')(applyLayer,status=>{if(status!==foregroundStatus){foregroundStatus=status;send();}});visible(true);showDashboard();if(!hasCachedSnapshot)refresh();refreshScheduler.configure(preferences.refreshMinutes);autoUpdater.configure(preferences.autoUpdate);setTimeout(checkForUpdates,8000).unref();setInterval(checkForUpdates,6*60*60*1000).unref();
 const markUpdateHealthy=()=>setTimeout(()=>require('./auto-update.cjs').writeHealth(app),1200).unref();if(dashboard.webContents.isLoading())dashboard.webContents.once('did-finish-load',markUpdateHealthy);else markUpdateHealthy();
}).catch(e=>{console.error(e.stack);app.exit(1);});}
function trusted(event){return [orb,panel,dashboard,settingsWindow].some(w=>w&&!w.isDestroyed()&&event.sender===w.webContents);}
function sizeMenu(){panel?.hide();Menu.buildFromTemplate(nativeMenus.sizeTemplate(preferences.language,{open:showDashboard,console:openConsole,add:()=>manageAccounts('/add'),manage:()=>manageAccounts(),resize:size=>{updatePreferences({petSize:size});},hide:()=>visible(false)},orbSize)).popup({window:orb});}
ipcMain.on('action',(event,action)=>{if(!trusted(event))return;if(event.sender===settingsWindow?.webContents&&['enter','leave','close-menu','collapse'].includes(action)){if(['close-menu','collapse'].includes(action)){settingsWindow.hide();send();}return;}const preview=event.sender!==dashboard.webContents;
 if(event.sender===orb.webContents){if(action==='pet-hover-start')petHovered=true;if(action==='pet-hover-end')petHovered=false;if(action==='pet-drag-start'){petDragging=true;panel?.hide();}if(action==='pet-drag-end'){petDragging=false;petHovered=insideWindow(screen.getCursorScreenPoint(),orb);save();}}
 if(action==='expand'&&event.sender===orb.webContents)expand();if(action==='leave'){if(preview)collapseLater();else collapseDashboardLater();}if(action==='enter'){if(preview)clearTimeout(hideTimer);else clearTimeout(dashboardHideTimer);}
 if(action==='hide')visible(!orbRequestedVisible);if(action==='collapse'){if(preview)panel?.hide();else closeMenu();}
 if(action==='cc-switch-download')openExternalPage(require('./client-setup.cjs').RELEASE_URL);if(action==='check-update')checkForUpdates(true);if(action==='install-update')installUpdate();if(action==='cancel-auto-update')updatePreferences({autoUpdate:false});if(action==='download-update')downloadUpdate();if(action==='settings')openSettings();if(action==='close-menu')closeMenu();if(action==='logout')logout();if(action==='console')openConsole();if(action==='manage')manageAccounts();if(action==='add')manageAccounts('/add');if(action==='login')authWindow();if(action==='refresh'){paused=false;refresh();}if(action==='dashboard')showDashboard();
 if(action==='menu'&&event.sender===orb.webContents)sizeMenu();
 if(!preview&&action==='minimize')dashboard.minimize();if(!preview&&action==='maximize'){if(dashboard.isMaximized())dashboard.unmaximize();else dashboard.maximize();}
});
ipcMain.on('move',(event,p)=>{if(event.sender!==orb?.webContents||!Number.isFinite(p?.x)||!Number.isFinite(p?.y))return;const a=screen.getDisplayNearestPoint(p).workArea;edge=p.x<a.x+a.width/2?'left':'right';y=Math.max(a.y,Math.min(Math.round(p.y-orbSize*(p.grip===true?.25:.5)),a.y+a.height-orbSize));orb.setBounds({x:Math.max(a.x,Math.min(Math.round(p.x-orbSize/2),a.x+a.width-orbSize)),y,width:orbSize,height:orbSize});setPetAnchor(orb.getBounds());save();panel?.hide();});
ipcMain.on('pet-render-ready',(event,report)=>{
 if(event.sender!==orb?.webContents||report?.renderer!=='layered-2.5d')return;
 petReducedMotion=report.reducedMotion===true;
 const evidence={version:app.getVersion(),pid:process.pid,renderer:report.renderer,petId:report.petId,canvasCount:report.canvasCount,at:new Date().toISOString()};
 fs.writeFileSync(path.join(app.getPath('userData'),'pet-render-status.json'),JSON.stringify(evidence));
 if(process.argv.includes('--pet-release-check'))setTimeout(async()=>{const dir=process.env.QUOTA_PET_EVIDENCE;if(dir){fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'installed-pet.png'),(await orb.webContents.capturePage()).toPNG());fs.writeFileSync(path.join(dir,'installed-render.json'),JSON.stringify({...evidence,visible:orb.isVisible()},null,2));}},1500);
});
ipcMain.handle('snapshot',event=>trusted(event)?payload():null);
ipcMain.handle('undo-preferences',async event=>{if(!trusted(event)||event.sender===orb.webContents)throw Error('Invalid sender');await queuedPreferences(null,{undo:true});return payload();});
ipcMain.handle('preferences',(event,value)=>{if(!trusted(event)||event.sender===orb.webContents)throw Error('Invalid sender');return queuedPreferences(value);});
app.on('before-quit',()=>{quitting=true;if(!smoke&&preferences.autoUpdate&&autoUpdater.ready())launchReadyUpdate();});
app.on('window-all-closed',()=>{});app.on('will-quit',()=>{clearInterval(roamTimer);clearTimeout(hideTimer);clearTimeout(dashboardHideTimer);stopForeground?.();refreshScheduler.stop();globalShortcut.unregisterAll();});










function updateNativeLanguage(){if(tray){tray.setToolTip(t('pet'));tray.setContextMenu(trayMenu=Menu.buildFromTemplate(nativeMenus.trayTemplate(preferences.language,{open:showDashboard,show:()=>visible(true),hide:()=>visible(false),left:()=>{edge='left';dock();visible(true);},right:()=>{edge='right';dock();visible(true);},login:authWindow,quit:()=>app.quit()})));}for(const [win,page] of [[consoleWindow,'console'],[manager,'manage'],[login,'login']])if(win&&!win.isDestroyed())win.setTitle(t('windowTitle',{page:t(page)}));}


// Only bundled local windows may request a CC Switch import.
ipcMain.handle('list-client-models',async(event,input)=>{if(!trusted(event)||event.sender===orb?.webContents)return {ok:false,code:'INVALID_CLIENT'};return require('./client-models.cjs').listModels(input,{fetchImpl:(...args)=>require('electron').net.fetch(...args)});});
ipcMain.handle('configure-client',async(event,input)=>{if(!trusted(event)||event.sender===orb?.webContents)return {ok:false,code:'INVALID_CLIENT'};return require('./client-setup.cjs').launchImport(input,{authorizeModel:value=>require('./client-models.cjs').authorizeModel(value,{fetchImpl:(...args)=>require('electron').net.fetch(...args)}),resolveApplication:scheme=>app.getApplicationInfoForProtocol(scheme),openExternal:url=>shell.openExternal(url)});});

