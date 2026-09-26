const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path'),assert=require('node:assert/strict');
const {normalize}=require('./model'),{defaults}=require('./preferences.cjs');
const {createUpdateChecker}=require('./update-check.cjs');
app.setPath('userData',path.join(__dirname,'.smoke-profile/update-check'));
const testApp=process.env.QUOTA_PET_TEST_APP_DIR||__dirname;
let win,mode='current',calls=0;
const base={...normalize(require('./fixture.json')),preferences:defaults,appVersion:'0.1.0'};
const checker=createUpdateChecker({current:'0.1.0',platform:'win32',arch:'x64',onChange:()=>win?.webContents.send('snapshot',{...base,update:checker.snapshot()}),fetchImpl:async()=>{
 calls++;await new Promise(r=>setTimeout(r,50));if(mode==='error')throw Error('network');
 return new Response(JSON.stringify({schemaVersion:1,product:'quota-pet',channel:'stable',latest:mode==='unpublished'?null:{version:mode==='available'?'0.2.0':mode==='ahead'?'0.0.9':'0.1.0',url:'https://console.yulitongxing.com/updates/quota-pet/test.exe',notes:'Fixture',platform:'win32',arch:'x64'}}),{headers:{'content-type':'application/json'}});
}});
ipcMain.handle('snapshot',()=>({...base,update:checker.snapshot()}));
ipcMain.on('action',(_,action)=>{if(action==='check-update')checker.check();else throw Error('Unexpected external action: '+action);});
app.whenReady().then(async()=>{
 win=new BrowserWindow({show:false,webPreferences:{preload:path.join(testApp,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 await win.loadFile(path.join(testApp,'index.html'));
 for(const [value,expected] of [['current','已是官网最新'],['available','发现新版本'],['ahead','无需降级'],['unpublished','暂未发布'],['error','检查更新失败']]){
  mode=value;await win.webContents.executeJavaScript(`document.querySelector('[data-action="check-update"]').click()`);
  for(let i=0;i<100&&(checker.snapshot().status==='checking'||checker.snapshot().status==='idle');i++)await new Promise(r=>setTimeout(r,20));
  await new Promise(r=>setTimeout(r,80));
  const data=await win.webContents.executeJavaScript(`({text:document.querySelector('#update-status').textContent,disabled:document.querySelector('[data-action="check-update"]').disabled,download:!document.querySelector('[data-action="download-update"]').hidden})`);
  assert.ok(data.text.includes(expected),data.text);assert.equal(data.disabled,false);assert.equal(data.download,value==='available');
 }
 assert.equal(calls,5);console.log('UPDATE_UI=PASS; 5 result states; actual button IPC; no browser action');win.destroy();app.exit(0);
}).catch(e=>{console.error(e.message);app.exit(1);});
