const {app,BrowserWindow,Tray,Menu,ipcMain,screen,nativeImage,session,globalShortcut,safeStorage,nativeTheme,shell}=require('electron');
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
let hotkeyError='';const hotkeys=createHotkeyManager(globalShortcut,()=>{visible(true);showDashboard();});
let preferences={...defaults},preferencesFile,cacheFile;const refreshScheduler=createScheduler(()=>refresh());
function payload(){return {...(last||{}),appVersion:app.getVersion(),update:updateChecker.snapshot(),preferences,hotkeyError,appPinActive:!!dashboard&&!dashboard.isDestroyed()&&dashboard.isAlwaysOnTop(),foregroundStatus,browserSuppressed:preferences.browserBehind&&browserFront,windowMaximized:!!dashboard&&!dashboard.isDestroyed()&&dashboard.isMaximized(),orbVisible:orbRequestedVisible,lowQuota:lowQuota(last,preferences)};}
function loadPreferences(){try{preferences=validate(JSON.parse(fs.readFileSync(preferencesFile,'utf8')));}catch{preferences={...defaults};}}
function loadCachedSnapshot(){try{const cached=JSON.parse(fs.readFileSync(cacheFile,'utf8'));if(cached&&Array.isArray(cached.accounts)){last={...cached,state:'ready',messageKey:'cached'};return true;}}catch{}return false;}
function saveCachedSnapshot(){try{if(last&&Array.isArray(last.accounts))fs.writeFileSync(cacheFile+'.tmp',JSON.stringify({...last, cachedAt:Date.now()}));fs.renameSync(cacheFile+'.tmp',cacheFile);}catch{}} 
function updateAppPin(){for(const window of [dashboard,consoleWindow,manager,login])if(window&&!window.isDestroyed()){window.setAlwaysOnTop(preferences.appAlwaysOnTop);if(window.isAlwaysOnTop()!==preferences.appAlwaysOnTop)throw Error('APP_PIN_FAILED');}}
function updatePreferences(value){const next=validate({...preferences,...value});const persist=()=>{fs.writeFileSync(preferencesFile+'.tmp',JSON.stringify(next));fs.renameSync(preferencesFile+'.tmp',preferencesFile);};if(next.hotkey===preferences.hotkey&&hotkeyError){persist();}else{hotkeys.set(next.hotkey,persist);hotkeyError='';}preferences=next;updateNativeLanguage();updateAppPin();applyLayer(browserFront);refreshScheduler.configure(preferences.refreshMinutes);send();return preferences;}
let consoleWindow,manager,stopForeground,browserFront=false,orbRequestedVisible=true,foregroundStatus='starting';
function applyLayer(active){const changed=browserFront!==active;browserFront=active;const behind=preferences.browserBehind&&active;for(const w of [orb,panel])if(w&&!w.isDestroyed())w.setAlwaysOnTop(!behind);if(behind){orb?.hide();panel?.hide();}else if(orbRequestedVisible&&orb&&!orb.isDestroyed()&&!orb.isVisible())orb.showInactive();if(changed)send();}
const updateChecker=require('./update-check.cjs').createUpdateChecker({current:app.getVersion(),fetchImpl:(...args)=>require('electron').net.fetch(...args),onChange:()=>send()});
function checkForUpdates(){return updateChecker.check();}
function downloadUpdate(){const state=updateChecker.snapshot();if(state.status==='available'&&require('./update-check.cjs').allowedDownload(state.downloadUrl))openExternalPage(state.downloadUrl);}
function openConsole(){if(preferences.openInBrowser){openExternalPage(TRANSIT_ORIGIN+'/');return;}if(consoleWindow&&!consoleWindow.isDestroyed()){consoleWindow.show();consoleWindow.focus();return;}const origin=TRANSIT_ORIGIN;consoleWindow=new BrowserWindow({alwaysOnTop:preferences.appAlwaysOnTop,width:1180,height:850,title:t('windowTitle',{page:t('console')}),backgroundColor:'#ffffff',autoHideMenuBar:true,icon:path.join(__dirname,'icon.png'),webPreferences:{partition:'persist:quota-pet-pool',nodeIntegration:false,contextIsolation:true,sandbox:true}});consoleWindow.setMenu(null);require('./remote-ui.cjs').install(consoleWindow);consoleWindow.webContents.setWindowOpenHandler(()=>({action:'deny'}));consoleWindow.webContents.on('will-navigate',(event,url)=>{if(new URL(url).origin!==origin)event.preventDefault();});consoleWindow.on('closed',()=>{consoleWindow=null;});consoleWindow.loadURL(origin+'/');}
function manageAccounts(page="/"){if(preferences.openInBrowser){openExternalPage(ORIGIN+page);return;}if(manager&&!manager.isDestroyed()){manager.show();manager.focus();manager.loadURL(ORIGIN+page);return;}manager=new BrowserWindow({alwaysOnTop:preferences.appAlwaysOnTop,width:1100,height:820,title:t('windowTitle',{page:t('manage')}),backgroundColor:'#ffffff',autoHideMenuBar:true,icon:path.join(__dirname,'icon.png'),webPreferences:{partition:'persist:quota-pet-pool',nodeIntegration:false,contextIsolation:true,sandbox:true}});manager.setMenu(null);require('./remote-ui.cjs').install(manager);require('./account-links.cjs').installAccountLinks(manager.webContents,ORIGIN,url=>shell.openExternal(url));manager.webContents.on('did-finish-load',()=>{if(!smoke)scheduleAuthRefresh();});manager.on('closed',()=>{manager=null;if(!smoke){paused=false;refresh();}});manager.loadURL(ORIGIN+page);}
let vault,smokeAuth=false,authRestorePromise=Promise.resolve();
async function saveAuthorization(){const cookies=await session.fromPartition('persist:quota-pet-pool').cookies.get({url:ORIGIN});if(cookies.length)vault.save(cookies.map(c=>({...c,domain:c.domain.replace(/^\./,'')})));else vault.clear();}
async function restoreAuthorization(){const jar=session.fromPartition('persist:quota-pet-pool').cookies;const existing=await jar.get({url:ORIGIN});if(existing.length)return;const written=[];try{const records=vault.load();for(const c of records){const details={url:ORIGIN,name:c.name,value:c.value,path:c.path||'/',secure:true,httpOnly:!!c.httpOnly};if(!c.hostOnly)details.domain=c.domain;if(c.expirationDate)details.expirationDate=c.expirationDate;if(c.sameSite)details.sameSite=c.sameSite;await jar.set(details);written.push(c);}}catch{for(const c of written)await jar.remove(ORIGIN+(c.path||'/'),c.name);vault.clear();last={state:'auth',messageKey:'sessionExpired'};}}
let orb,panel,dashboard,tray,trayMenu,closeOptionsMenu,login,store,hasCachedSnapshot=false,edge='right',y=240,orbSize=72,authTimer,refreshAgain=false,hideTimer,busy=false,paused=false,last=null,quitting=false,autoLoginOpened=false;
const smoke=process.argv.includes('--smoke');
const connectionCheck=process.argv.includes('--connection-check');
const managementCheck=process.argv.includes('--management-check');
if(smoke)app.setPath('userData',path.join(__dirname,'.smoke-profile'));
function send(){for(const w of [panel,dashboard,orb])if(w&&!w.isDestroyed())w.webContents.send('snapshot',payload());if(!smoke&&store)fs.writeFileSync(path.join(app.getPath('userData'),'runtime-status.json'),JSON.stringify({at:new Date().toISOString(),update:updateChecker.snapshot(),state:last?.state||'loading',refreshMinutes:preferences.refreshMinutes,lowQuotaReminder:preferences.lowQuotaReminder,lowQuotaCount:lowQuota(last,preferences).length,browserBehind:preferences.browserBehind,browserFront,foregroundStatus,browserSuppressed:preferences.browserBehind&&browserFront,appAlwaysOnTop:preferences.appAlwaysOnTop,openInBrowser:preferences.openInBrowser,dashboardAlwaysOnTop:dashboard?.isAlwaysOnTop(),accounts:last?.accounts?.length||0,users:last?.users?.length||0,relayError:last?.relayError||null,taskbarWindow:!!dashboard&&!dashboard.isDestroyed(),dashboardVisible:dashboard?.isVisible(),orbVisible:orb?.isVisible(),loginVisible:login?.isVisible()||false}));}
function showDashboard(){panel?.hide();if(dashboard.isMinimized())dashboard.restore();dashboard.show();dashboard.focus();send();}
function save(){fs.writeFileSync(store,JSON.stringify({edge,y,orbSize}));}
function dock(){const area=screen.getDisplayNearestPoint({x:orb?.getBounds().x||0,y}).workArea;const b=dockBounds(area,edge,y,orbSize);y=b.y;orb.setBounds(b);save();}
function expand(){if(!panel||panel.isDestroyed())return;if(preferences.browserBehind&&browserFront)return;clearTimeout(hideTimer);const a=screen.getDisplayMatching(orb.getBounds()).workArea;panel.setBounds(panelBounds(a,orb.getBounds(),edge));panel.showInactive();send();}
function collapseLater(cursor=()=>screen.getCursorScreenPoint()){clearTimeout(hideTimer);hideTimer=setTimeout(()=>{const p=cursor();const b=panel.getBounds(),o=orb.getBounds();const inside=r=>p.x>=r.x&&p.x<r.x+r.width&&p.y>=r.y&&p.y<r.y+r.height;if(!inside(b)&&!inside(o))panel?.hide();},80);}
function visible(show){orbRequestedVisible=show;if(show){dock();applyLayer(browserFront);}else{orb.hide();panel?.hide();}send();}
function closeMenu(){closeOptionsMenu=Menu.buildFromTemplate(nativeMenus.closeTemplate(preferences.language,{background:()=>{if(preferences.appAlwaysOnTop){dashboard.show();dashboard.focus();}else dashboard.hide();},quit:()=>app.quit()}));closeOptionsMenu.popup({window:dashboard});}
function openSettings(){for(const w of [dashboard,panel])if(w&&!w.isDestroyed())w.webContents.executeJavaScript("document.querySelector('.preferences')?.setAttribute('open','');document.querySelector('.preferences')?.scrollIntoView({behavior:'smooth',block:'start'})").catch(()=>{});showDashboard();}
async function logout(){if(login&&!login.isDestroyed()){login.close();login=null;}if(manager&&!manager.isDestroyed()){manager.close();manager=null;}if(consoleWindow&&!consoleWindow.isDestroyed()){consoleWindow.close();consoleWindow=null;}paused=true;try{await session.fromPartition('persist:quota-pet-pool').clearStorageData({storages:['cookies','localstorage','serviceworkers']});}catch{}try{vault.clear();}catch{}last={state:'auth',messageKey:'signedOut'};send();}
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
 cacheFile=path.join(app.getPath('userData'),'quota-cache.json');hasCachedSnapshot=loadCachedSnapshot();store=path.join(app.getPath('userData'),'position.json');try{const p=JSON.parse(fs.readFileSync(store));edge=p.edge==='left'?'left':'right';y=Number.isFinite(p.y)?p.y:240;orbSize=[48,60,72,96,120].includes(p.orbSize)?p.orbSize:72;}catch{}
 orb=localWindow(path.join(__dirname,'orb.html'),60,60);
 Menu.setApplicationMenu(null);
 session.fromPartition('persist:quota-pet-pool').cookies.on('changed',(_,cookie)=>{if(cookie.domain.replace(/^\./,'')==='pool.yulitongxing.com')scheduleAuthRefresh();});
 dashboard=new BrowserWindow({alwaysOnTop:preferences.appAlwaysOnTop,frame:false,width:720,height:820,minWidth:480,minHeight:500,show:false,title:'Quota Pet',icon:path.join(__dirname,'icon.png'),backgroundColor:'#f5f0fc',autoHideMenuBar:true,webPreferences:{backgroundThrottling:false,preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 dashboard.on('maximize',send);dashboard.on('unmaximize',send);dashboard.setMenu(null);dashboard.loadFile(path.join(__dirname,'index.html'),{query:{view:'dashboard'}});if(smoke)panel=localWindow(path.join(__dirname,'index.html'),440,620);else setImmediate(()=>{panel=localWindow(path.join(__dirname,'index.html'),440,620);});dashboard.webContents.setWindowOpenHandler(()=>({action:'deny'}));dashboard.webContents.on('will-navigate',e=>e.preventDefault());dashboard.on('close',e=>{if(!quitting){e.preventDefault();dashboard.hide();}});
 tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'icon.png')));tray.on('click',()=>{visible(true);showDashboard();expand();});updateNativeLanguage();
 try{hotkeys.set(preferences.hotkey);}catch(e){hotkeyError=e.message;dashboard.webContents.once('did-finish-load',()=>{send();openSettings();});}screen.on('display-metrics-changed',()=>dock());
 if(smoke){await require('./smoke.cjs')({app,orb,panel,dashboard,showDashboard,visible,expand,normalize,setSnapshot:d=>{last=d;send();},testLayer:applyLayer,getNativeLabels:()=>trayMenu.items.map(item=>item.label),dismissCloseMenu:()=>closeOptionsMenu?.closePopup(),testHoverExit:()=>collapseLater(()=>({x:-999999,y:-999999})),testAuthSync:async data=>{const ses=session.fromPartition('persist:quota-pet-pool');ses.protocol.handle('https',()=>new Response(JSON.stringify(data),{headers:{'content-type':'application/json'}}));try{smokeAuth=true;paused=true;login=new BrowserWindow({show:false,webPreferences:{partition:'persist:quota-pet-pool'}});login.on('closed',()=>{login=null;});scheduleAuthRefresh();await new Promise(r=>setTimeout(r,600));if(login||last?.accounts?.length!==data.accounts.length)throw Error('auth synchronization failed');}finally{smokeAuth=false;ses.protocol.unhandle('https');}}});return;}
 if(managementCheck){const r=await session.fromPartition('persist:quota-pet-pool').fetch(ORIGIN+'/',{redirect:'manual'});const html=await r.text();const result={status:r.status,reset:html.includes('value="reset"'),delete:html.includes('value="delete"'),import:html.includes('/upload')};console.log('MANAGEMENT_READ '+JSON.stringify(result));app.exit(r.status===200&&result.delete&&result.import?0:1);return;}
 if(connectionCheck){await refresh();console.log('CONNECTION '+JSON.stringify({state:last?.state,message:last?.message,accounts:last?.accounts?.length,users:last?.users?.length}));app.exit(last?.state==='error'?1:0);return;}
 stopForeground=require('./foreground.cjs')(applyLayer,status=>{if(status!==foregroundStatus){foregroundStatus=status;send();}});visible(true);showDashboard();if(!hasCachedSnapshot)refresh();refreshScheduler.configure(preferences.refreshMinutes);setTimeout(checkForUpdates,8000).unref();setInterval(checkForUpdates,6*60*60*1000).unref();
}).catch(e=>{console.error(e.stack);app.exit(1);});}
function trusted(event){return [orb,panel,dashboard].some(w=>w&&!w.isDestroyed()&&event.sender===w.webContents);}
function sizeMenu(){panel?.hide();Menu.buildFromTemplate(nativeMenus.sizeTemplate(preferences.language,{open:showDashboard,console:openConsole,add:()=>manageAccounts('/add'),manage:()=>manageAccounts(),resize:size=>{orbSize=size;dock();},hide:()=>visible(false)},orbSize)).popup({window:orb});}
ipcMain.on('action',(event,action)=>{if(!trusted(event))return;const preview=event.sender!==dashboard.webContents;
 if(action==='expand'&&event.sender===orb.webContents)expand();if(action==='leave'&&preview)collapseLater();if(action==='enter'&&preview)clearTimeout(hideTimer);
 if(action==='hide')visible(!orbRequestedVisible);if(action==='collapse'){if(preview)panel?.hide();else closeMenu();}
 if(action==='cc-switch-download')openExternalPage(require('./client-setup.cjs').RELEASE_URL);if(action==='check-update')checkForUpdates();if(action==='download-update')downloadUpdate();if(action==='settings')openSettings();if(action==='close-menu')closeMenu();if(action==='logout')logout();if(action==='console')openConsole();if(action==='manage')manageAccounts();if(action==='add')manageAccounts('/add');if(action==='login')authWindow();if(action==='refresh'){paused=false;refresh();}if(action==='dashboard')showDashboard();
 if(action==='menu'&&event.sender===orb.webContents)sizeMenu();
 if(!preview&&action==='minimize')dashboard.minimize();if(!preview&&action==='maximize'){if(dashboard.isMaximized())dashboard.unmaximize();else dashboard.maximize();}
});
ipcMain.on('move',(event,p)=>{if(event.sender!==orb?.webContents||!Number.isFinite(p?.x)||!Number.isFinite(p?.y))return;const a=screen.getDisplayNearestPoint(p).workArea;edge=p.x<a.x+a.width/2?'left':'right';y=p.y-orbSize/2;orb.setBounds(dockBounds(a,edge,y,orbSize));save();panel?.hide();});
ipcMain.handle('snapshot',event=>trusted(event)?payload():null);
ipcMain.handle('preferences',(event,value)=>{if(!trusted(event)||event.sender===orb.webContents)throw Error('Invalid sender');return updatePreferences(value);});
app.on('before-quit',()=>{quitting=true;});
app.on('window-all-closed',()=>{});app.on('will-quit',()=>{stopForeground?.();refreshScheduler.stop();globalShortcut.unregisterAll();});










function updateNativeLanguage(){if(tray){tray.setToolTip(t('pet'));tray.setContextMenu(trayMenu=Menu.buildFromTemplate(nativeMenus.trayTemplate(preferences.language,{open:showDashboard,show:()=>visible(true),hide:()=>visible(false),left:()=>{edge='left';visible(true);},right:()=>{edge='right';visible(true);},login:authWindow,quit:()=>app.quit()})));}for(const [win,page] of [[consoleWindow,'console'],[manager,'manage'],[login,'login']])if(win&&!win.isDestroyed())win.setTitle(t('windowTitle',{page:t(page)}));}


// Only bundled local windows may request a CC Switch import.
ipcMain.handle('configure-client',async(event,input)=>{if(!trusted(event)||event.sender===orb?.webContents)return {ok:false,code:'INVALID_CLIENT'};return require('./client-setup.cjs').launchImport(input,{resolveApplication:scheme=>app.getApplicationInfoForProtocol(scheme),openExternal:url=>shell.openExternal(url)});});
