const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {screen}=require('electron');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
module.exports=async({app,orb,panel,dashboard,showDashboard,expand,visible,setSnapshot,normalize,testLayer})=>{
 const original=screen.getCursorScreenPoint();const area=screen.getPrimaryDisplay().workArea;
 const outside={x:area.x+15,y:area.y+15};
 const physical=point=>{
  const p=screen.dipToScreenPoint(point);
  execFileSync('powershell.exe',['-NoProfile','-Command',`Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class Mouse{[DllImport("user32.dll")]public static extern bool SetProcessDPIAware();[DllImport("user32.dll")]public static extern bool SetCursorPos(int x,int y);}';[Mouse]::SetProcessDPIAware()|Out-Null;[Mouse]::SetCursorPos(${p.x},${p.y})|Out-Null`],{windowsHide:true,stdio:'pipe'});
 };
 const inside=w=>{const b=w.getBounds();physical({x:b.x+100,y:b.y+180});w.webContents.sendInputEvent({type:'mouseMove',x:100,y:180});};
 const leave=()=>{physical(outside);for(const w of [dashboard,panel])if(w.isVisible())w.webContents.sendInputEvent({type:'mouseLeave',x:-1,y:-1});};
 const check=(value,label)=>{assert(value,label);console.log(label+'=PASS');};
 const nativeVisible=w=>{
  const h=w.getNativeWindowHandle().readBigUInt64LE().toString();
  return execFileSync('powershell.exe',['-NoProfile','-Command',`Add-Type -TypeDefinition 'using System;using System.Runtime.InteropServices;public class W{[DllImport("user32.dll")]public static extern bool IsWindowVisible(IntPtr h);}';[W]::IsWindowVisible([IntPtr]${h})`],{windowsHide:true,encoding:'utf8'}).trim()==='True';
 };
 const clickPin=async w=>{
  const r=await w.webContents.executeJavaScript("(()=>{const b=document.querySelector('#window-pin').getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2};})()");
  const b=w.getContentBounds();physical({x:Math.round(b.x+r.x),y:Math.round(b.y+r.y)});for(const type of ['mouseMove','mouseDown','mouseUp'])w.webContents.sendInputEvent({type,x:Math.round(r.x),y:Math.round(r.y),button:'left',clickCount:1});await wait(200);
 };
 try{
  await Promise.all([orb,panel,dashboard].map(w=>w.webContents.isLoading()?new Promise(r=>w.webContents.once('did-finish-load',r)):Promise.resolve()));
  const persisted=fs.existsSync(path.join(app.getPath('userData'),'preferences.json'))?JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'preferences.json'),'utf8')):{};
  if(process.argv.includes('--hover-restart')){
   check(persisted.appAlwaysOnTop===true&&dashboard.isAlwaysOnTop(),'PIN_RESTART_RESTORED');
   showDashboard();inside(dashboard);await wait(120);leave();await wait(300);
   check(dashboard.isVisible()&&nativeVisible(dashboard),'PIN_RESTART_LEAVE_STAYS');
   console.log('HOVER_RESTART=PASS');return;
  }
  await dashboard.webContents.executeJavaScript("window.pet.savePreferences({appAlwaysOnTop:false,browserBehind:false})");
  const data=require('./fixture.json');data.updated_at=Date.now()/1000;setSnapshot(normalize(data));visible(true);
  dashboard.setBounds({x:area.x+120,y:area.y+80,width:720,height:Math.min(820,area.height-120)});
  showDashboard();await dashboard.webContents.executeJavaScript("globalThis.hoverEvents=[];document.body.addEventListener('mouseenter',()=>hoverEvents.push('enter'));document.body.addEventListener('mouseleave',()=>hoverEvents.push('leave'));");inside(dashboard);await wait(120);
  console.log('HOVER_INSIDE',JSON.stringify({cursor:screen.getCursorScreenPoint(),bounds:dashboard.getBounds(),visible:dashboard.isVisible(),native:nativeVisible(dashboard)}));leave();await wait(300);
  console.log('HOVER_EVENTS',await dashboard.webContents.executeJavaScript('JSON.stringify(hoverEvents)'),JSON.stringify(screen.getCursorScreenPoint()));
  check(!dashboard.isVisible()&&!nativeVisible(dashboard),'DASHBOARD_UNPINNED_LEAVE_HIDES');
  showDashboard();inside(dashboard);await wait(100);await clickPin(dashboard);leave();await wait(300);
  check(dashboard.isAlwaysOnTop()&&dashboard.isVisible()&&nativeVisible(dashboard),'DASHBOARD_PIN_CLICK_LEAVE_STAYS');
  inside(dashboard);await clickPin(dashboard);leave();await wait(300);
  check(!dashboard.isAlwaysOnTop()&&!dashboard.isVisible()&&!nativeVisible(dashboard),'DASHBOARD_UNPIN_CLICK_LEAVE_HIDES');
  expand();inside(panel);await wait(100);leave();await wait(300);
  check(!panel.isVisible()&&!nativeVisible(panel),'PREVIEW_UNPINNED_LEAVE_HIDES');
  expand();inside(panel);await wait(100);await clickPin(panel);leave();await wait(300);
  check(panel.isVisible()&&nativeVisible(panel),'PREVIEW_PIN_CLICK_LEAVE_STAYS');
  await panel.webContents.executeJavaScript("window.pet.savePreferences({browserBehind:true})");testLayer(true);await wait(100);
  check(panel.isVisible(),'PIN_OVERRIDES_BROWSER_HIDE');testLayer(false);
  inside(panel);await clickPin(panel);leave();await wait(300);
  check(!panel.isVisible()&&!nativeVisible(panel),'PREVIEW_UNPIN_CLICK_LEAVE_HIDES');
  showDashboard();inside(dashboard);await clickPin(dashboard);
  check(JSON.parse(fs.readFileSync(path.join(app.getPath('userData'),'preferences.json'))).appAlwaysOnTop===true,'PIN_SAVED_FOR_RESTART');
  console.log('HOVER_NATIVE=PASS renderer_mouse_and_pin_click; Win32_visibility; reverse_action');
 }catch(error){console.error(error.stack);app.exitCode=1;}
 finally{physical(original);app.exit(app.exitCode||0);}
};
