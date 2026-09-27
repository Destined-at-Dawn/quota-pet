'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async({app,orb,panel,dashboard,getSettings,screen,tickPet,startRoaming,setPetAnchor,getMotion,loadPreferences,send})=>{
 const root=process.env.QUOTA_PET_EVIDENCE||path.join(__dirname,'evidence/cat-25d-20260927');fs.mkdirSync(root,{recursive:true});
 const wait=ms=>new Promise(r=>setTimeout(r,ms)),js=(w,s)=>w.webContents.executeJavaScript(s),errors=[];
 orb.webContents.on('console-message',details=>{if(details.level==='error')errors.push(details.message);});
 for(const w of [orb,panel,dashboard])if(w.webContents.isLoading())await new Promise(r=>w.webContents.once('did-finish-load',r));
 const settings=patch=>js(panel,`window.pet.savePreferences(${JSON.stringify(patch)})`);
 if(process.argv.includes('--stationary-default-check')){
  const p=(await js(panel,'window.pet.snapshot()')).preferences;assert.equal(p.petMovement,false);assert.equal(p.petAnimation,true);assert.equal(p.petTailMotion,true);
  assert.equal(await js(panel,"document.querySelector('#pet-movement').checked"),false);
  const area=screen.getPrimaryDisplay().workArea,point={x:area.x+120,y:area.y+120};orb.setBounds({...point,width:p.petSize,height:p.petSize});setPetAnchor(point);orb.showInactive();panel.hide();dashboard.hide();send();
  const pose=()=>js(orb,"['pet-head','pet-tail'].map(id=>document.getElementById(id).getAttribute('transform'))");await wait(180);startRoaming();const bounds=orb.getBounds(),first=await pose();await wait(700);
  assert.deepEqual(orb.getBounds(),bounds);assert.notDeepEqual(await pose(),first);assert.equal(await js(orb,"document.querySelector('#pet-art').dataset.walking"),'false');
  console.log('STATIONARY PASS: default checkbox off; native position fixed; breathing and tail animation continue');
  await js(panel,"const c=document.getElementById('pet-movement');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));flushSettings()");assert.equal((await js(panel,'window.pet.snapshot()')).preferences.petMovement,true);
  setPetAnchor(orb.getBounds());await js(orb,"window.pet.action('pet-hover-end')");await wait(80);const from=orb.getBounds();for(let i=0;i<400;i++){tickPet(.05);if(getMotion().walking&&Math.hypot(orb.getBounds().x-from.x,orb.getBounds().y-from.y)>3)break;}assert(getMotion().walking);assert.notDeepEqual(orb.getBounds(),from);
  await js(panel,"const off=document.getElementById('pet-movement');off.checked=false;off.dispatchEvent(new Event('change',{bubbles:true}));flushSettings()");await wait(100);const stop=orb.getBounds();await settings({petMoveRadius:0});await wait(300);assert.deepEqual(orb.getBounds(),stop);assert(!getMotion().walking);assert.equal((await js(panel,'window.pet.snapshot()')).preferences.petTailMotion,true);
  await settings({petMoveRadius:220});loadPreferences();send();assert.equal((await js(panel,'window.pet.snapshot()')).preferences.petMovement,false);
  fs.writeFileSync(path.join(root,'stationary-pet.png'),(await orb.webContents.capturePage()).toPNG());
  console.log('OPT-IN PASS: user enables roaming, disables it, keeps animation and saves the choice');console.log('STATIONARY DEFAULT SMOKE PASS');app.quit();return;
 }
 if(process.argv.includes('--resume-check')){const p=(await js(panel,'window.pet.snapshot()')).preferences;assert.equal(p.petMovement,false);assert.equal(p.petTailMotion,true);assert.equal(p.petSize,240);orb.showInactive();panel.hide();dashboard.hide();startRoaming();await wait(200);const b=orb.getBounds();await wait(400);assert.deepEqual(orb.getBounds(),b);console.log('RESTART PASS: movement off, independent tail on and size persist across a real process restart');app.quit();return;}
 await settings({hotkey:'Ctrl+Alt+Shift+F8',autoUpdate:false,petId:'tuantuan-original',petAnimation:true,petMovement:true,petTailMotion:true,petSize:240,petMoveRadius:150,petMoveSpeed:60,browserBehind:false});
 // A running installed app may own the default hotkey and open the conflict settings window during fixture startup.
 if(getSettings()){for(let i=0;i<100&&getSettings().webContents.isLoading();i++)await wait(30);await wait(100);getSettings().hide();}
 const a=screen.getPrimaryDisplay().workArea,cursor=screen.getCursorScreenPoint(),anchor=[{x:a.x+170,y:a.y+170},{x:a.x+a.width-410,y:a.y+170},{x:a.x+170,y:a.y+a.height-410},{x:a.x+a.width-410,y:a.y+a.height-410}].sort((p,q)=>Math.hypot(q.x-cursor.x,q.y-cursor.y)-Math.hypot(p.x-cursor.x,p.y-cursor.y))[0];orb.setBounds({...anchor,width:240,height:240});setPetAnchor(anchor);orb.showInactive();panel.hide();dashboard.hide();send();
 for(let i=0;i<100;i++){if(await js(orb,"document.querySelector('#pet-art').dataset.renderer==='layered-2.5d'"))break;await wait(100);}
 const metrics=await js(orb,"({...document.querySelector('#pet-art').dataset})");assert.equal(metrics.renderer,'layered-2.5d');assert.equal(await js(orb,"document.querySelectorAll('canvas').length"),0);assert.equal(await js(orb,"getComputedStyle(document.querySelector('.pet-stage')).display"),'block');
 const pose=()=>js(orb,"['pet-head','pet-tail','foot-left'].map(id=>document.getElementById(id).getAttribute('transform'))");
 const first=await pose();await wait(220);assert.notDeepEqual(await pose(),first);
 await settings({petTailMotion:false,petMovement:false});for(let i=0;i<100;i++){if(await js(orb,"document.querySelector('#pet-art').dataset.tail==='false'"))break;await wait(30);}const stoppedTail=await js(orb,"document.querySelector('#pet-tail').getAttribute('transform')");await wait(180);assert.equal(await js(orb,"document.querySelector('#pet-tail').getAttribute('transform')"),stoppedTail);
 await settings({petAnimation:false});for(let i=0;i<100;i++){if(await js(orb,"document.querySelector('#pet-art').dataset.motion==='off'"))break;await wait(30);}const frozen=await pose();await wait(180);assert.deepEqual(await pose(),frozen);
 await settings({petAnimation:true,petTailMotion:true});for(let i=0;i<100;i++){if(await js(orb,"document.querySelector('#pet-art').dataset.motion==='on'"))break;await wait(30);}assert.notDeepEqual(await pose(),frozen);
 // Exercise the real settings IPC and decode-before-save transaction.
 const initial=(await js(panel,'window.pet.snapshot()')).preferences.petId;
 await js(orb,"window.originalDecode=Image.prototype.decode;Image.prototype.decode=()=>Promise.reject(Error('fixture decode failure'));void 0");
 await assert.rejects(settings({petId:'tuantuan-paper'}));
 assert.equal((await js(panel,'window.pet.snapshot()')).preferences.petId,initial);
 await js(orb,"Image.prototype.decode=window.originalDecode;delete window.originalDecode");
 await settings({petId:'tuantuan-paper'});await wait(120);
 assert.equal(await js(orb,"document.querySelector('#pet-art').dataset.motion"),'off');
 loadPreferences();assert.equal((await js(panel,'window.pet.snapshot()')).preferences.petId,'tuantuan-paper');
 await js(panel,'window.pet.undoPreferences()');await wait(120);
 assert.equal((await js(panel,'window.pet.snapshot()')).preferences.petId,initial);
 console.log('FUSION PASS: real decode failure preserves selection; selection saves, reloads and undoes');
 const modelTest={layers:true,motionToggle:true,tailToggle:true,noWebGL:true};
 // Render fixtures through real IPC; confirm visible faces and capture them.
 for(const state of ['idle','love','exhausted']){
  const data=await js(panel,'window.pet.snapshot()');data.preferences.petMovement=false;data.petMotion={walking:false,heading:0};data.petState={state:state==='exhausted'?'exhausted':'idle',event:state==='love'?{type:'love',id:991,until:Date.now()+5000}:null};orb.webContents.send('snapshot',data);await wait(250);
  const face=state==='love'?'eyes-love':state==='exhausted'?'eyes-tired':'eyes-normal';assert.notEqual(await js(orb,`getComputedStyle(document.getElementById('${face}')).display`),'none');
  fs.writeFileSync(path.join(root,'pet-'+state+'.png'),(await orb.webContents.capturePage()).toPNG());
 }
 await settings({petMovement:true,petAnimation:true,petTailMotion:true});await js(orb,"window.pet.action('pet-hover-end')");await wait(80);panel.hide();send();
 console.log('RENDER PASS: original layers, no WebGL, genuine motion/tail toggles, visible love/exhausted faces');
 for(let i=0;i<400;i++){tickPet(.05);const b=orb.getBounds();if(getMotion().walking&&Math.hypot(b.x-anchor.x,b.y-anchor.y)>3)break;}await wait(250);const moved=orb.getBounds();assert(Math.hypot(moved.x-anchor.x,moved.y-anchor.y)>3);assert(getMotion().walking);assert.equal(await js(orb,"document.querySelector('#pet-art').dataset.walking"),'true');fs.writeFileSync(path.join(root,'cat-3d-walking.png'),(await orb.webContents.capturePage()).toPNG());
 await settings({petMovement:false});tickPet();const stopped=orb.getBounds();for(let i=0;i<30;i++)tickPet(.05);assert.deepEqual(orb.getBounds(),stopped);assert(!getMotion().walking);assert.equal((await js(panel,'window.pet.snapshot()')).preferences.petTailMotion,true);
 await settings({petMovement:true});await js(orb,"window.pet.action('pet-hover-start')");await wait(80);tickPet();const hover=orb.getBounds();for(let i=0;i<20;i++)tickPet();assert.deepEqual(orb.getBounds(),hover);assert(!getMotion().walking);await js(orb,"window.pet.action('pet-hover-end')");await wait(80);
 panel.showInactive();tickPet();assert(!getMotion().walking);panel.hide();
 await js(orb,"window.pet.action('pet-drag-start')");await wait(80);tickPet();assert(!getMotion().walking);await js(orb,"window.pet.action('pet-drag-end');window.pet.action('pet-hover-end')");await wait(80);
 for(let i=0;i<3000;i++){tickPet(.05);const b=orb.getBounds();assert(b.x>=a.x&&b.x+b.width<=a.x+a.width&&b.y>=a.y&&b.y+b.height<=a.y+a.height,JSON.stringify({b,a,anchor}));assert(Math.abs(b.x-anchor.x)<=150&&Math.abs(b.y-anchor.y)<=150);}
 console.log('ROAMING PASS: native window moves, range/screen bounds, hover/drag/popup pause, movement off leaves tail enabled');
 // Exercise visible settings controls without an account, then reload persisted values.
 await js(panel,"window.pet.action('settings')");for(let i=0;i<100;i++){if(getSettings()?.isVisible()&&!getSettings().webContents.isLoading())break;await wait(50);}const settingsWindow=getSettings();assert(settingsWindow.isVisible());await js(settingsWindow,"document.getElementById('pet-choice').value='tuantuan-paper';document.getElementById('pet-choice').dispatchEvent(new Event('change',{bubbles:true}));flushSettings()");await wait(250);assert.equal((await js(panel,'window.pet.snapshot()')).preferences.petId,'tuantuan-paper');await js(panel,'window.pet.undoPreferences()');await wait(100);fs.writeFileSync(path.join(root,'pet-choice.png'),(await settingsWindow.webContents.capturePage()).toPNG());
 await js(settingsWindow,"for(const [id,value] of [['pet-size',260],['pet-move-radius',90],['pet-move-speed',22]]){const c=document.getElementById(id);c.value=value;c.dispatchEvent(new Event('input',{bubbles:true}));}document.getElementById('pet-tail-motion').click();flushSettings()");await wait(250);loadPreferences();send();let p=(await js(panel,'window.pet.snapshot()')).preferences;assert.equal(p.petSize,260);assert.equal(p.petMoveRadius,90);assert.equal(p.petMoveSpeed,22);assert.equal(p.petTailMotion,false);assert(Math.abs(orb.getBounds().width-260)<=1);
 await js(panel,'window.pet.undoPreferences()');p=(await js(panel,'window.pet.snapshot()')).preferences;assert.equal(p.petSize,240);assert.equal(p.petTailMotion,true);
 await settings({petMovement:false,petTailMotion:true,petSize:240});await js(settingsWindow,"document.querySelector('#pet-animation').scrollIntoView({block:'start'})");await wait(300);fs.writeFileSync(path.join(root,'cat-settings.png'),(await settingsWindow.webContents.capturePage()).toPNG());settingsWindow.hide();panel.hide();
 console.log('SETTINGS PASS: size/radius/speed/tail controls save, reload and undo; available without login or plan');
 await settings({petMovement:true});setPetAnchor(orb.getBounds());await js(orb,"window.pet.action('pet-hover-end')");await wait(80);startRoaming();const realStart=orb.getBounds();await wait(500);assert.notDeepEqual(orb.getBounds(),realStart);await settings({petMovement:false});await wait(120);const realStop=orb.getBounds();await wait(300);assert.deepEqual(orb.getBounds(),realStop);console.log('TIMER PASS: live timer moves the native window and stops on user toggle');
 // Real Chromium pointer input, not a direct animation-state fixture.
 await settings({petMovement:false,petAnimation:true,petId:'tuantuan-original'});panel.hide();dashboard.hide();orb.show();orb.focus();
 const mouse=(type,x,y,extra={})=>orb.webContents.sendInputEvent({type,x,y,globalX:orb.getBounds().x+x,globalY:orb.getBounds().y+y,button:'left',...extra});
 mouse('mouseMove',110,105);await wait(80);panel.hide();mouse('mouseDown',110,105,{clickCount:1});await wait(60);mouse('mouseMove',138,110,{modifiers:['leftButtonDown']});await wait(180);
 assert.equal(await js(orb,"document.querySelector('#pet-art').dataset.interaction"),'held');
 assert.equal(await js(orb,"getComputedStyle(document.querySelector('#pet-scruff')).display"),'block');
 assert.notEqual(await js(orb,"document.querySelector('#pet-body').getAttribute('transform')"),null);
 fs.writeFileSync(path.join(root,'pet-held.png'),(await orb.webContents.capturePage()).toPNG());
 mouse('mouseUp',138,110,{clickCount:1});await wait(100);
 assert.equal(await js(orb,"document.querySelector('#pet-art').dataset.interaction"),'landing');
 await wait(450);assert.equal(await js(orb,"document.querySelector('#pet-art').dataset.interaction"),'idle');
 mouse('mouseMove',110,105);mouse('mouseDown',110,105,{clickCount:1});mouse('mouseUp',110,105,{clickCount:1});await wait(150);
 assert.equal(await js(orb,"document.querySelector('#pet-art').dataset.interaction"),'pat');assert(!dashboard.isVisible());
 assert.equal(await js(orb,"getComputedStyle(document.querySelector('#eyes-happy')).display"),'block');
 fs.writeFileSync(path.join(root,'pet-click.png'),(await orb.webContents.capturePage()).toPNG());
 await wait(1350);assert.equal(await js(orb,"document.querySelector('#pet-art').dataset.interaction"),'idle');
 mouse('mouseDown',110,105,{clickCount:2});mouse('mouseUp',110,105,{clickCount:2});await wait(150);assert(dashboard.isVisible());dashboard.hide();panel.hide();
 console.log('INTERACTION PASS: native drag grips scruff, dangles, lands; single click responds without opening; double click opens');
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(root,'native-results.json'),JSON.stringify({passed:true,metrics,modelTest,errors},null,2));console.log('PET 2.5D SMOKE PASS');app.quit();
};
