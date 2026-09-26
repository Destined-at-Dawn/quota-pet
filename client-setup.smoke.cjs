const {app,BrowserWindow,ipcMain}=require('electron');
const path=require('node:path'),assert=require('node:assert/strict');
app.setPath('userData',path.resolve(__dirname,'.smoke-profile/client-setup'));
let calls=0;
ipcMain.handle('snapshot',()=>null);
ipcMain.handle('configure-client',(_event,value)=>{calls++;assert.equal(value.client,'claude-desktop');assert.equal(value.apiKey,'fixture-key-not-real');return {ok:true,state:'awaiting-confirmation'};});
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false,width:760,height:850,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});
 await w.loadFile(path.join(__dirname,'index.html'));
 await w.webContents.executeJavaScript(`(async()=>{
 const q=s=>document.querySelector(s);if(!q('#client-setup'))throw Error('missing setup');
 if(!q('#cc-endpoint option[value="personal"]').disabled)throw Error('unsupported Codex personal route enabled');
 q('#cc-client').value='claude-desktop';q('#cc-client').dispatchEvent(new Event('change'));
 if(q('#cc-endpoint option[value="personal"]').disabled)throw Error('Claude personal route disabled');
 q('#cc-endpoint').value='personal';q('#cc-model').value='claude-test';q('#cc-key').value='fixture-key-not-real';
 q('#client-setup-form').dispatchEvent(new Event('submit',{cancelable:true}));
 for(let i=0;i<100&&q('#cc-key').value;i++)await new Promise(r=>setTimeout(r,20));
 if(q('#cc-key').value)throw Error('key retained');
 if(!q('#cc-status').textContent.includes('尚未验证客户端实际调用'))throw Error('false completion');
 })()`);
 assert.equal(calls,1);console.log('CLIENT_SETUP_UI=PASS (Electron UI + fixture IPC; no real client configuration)');w.destroy();app.exit(0);
}).catch(e=>{console.error(e.message);app.exit(1);});
