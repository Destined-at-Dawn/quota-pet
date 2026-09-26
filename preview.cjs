// Generate a documentation screenshot using synthetic data only.
const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const {normalize}=require('./model'),{defaults}=require('./preferences.cjs');
app.setPath('userData',path.join(__dirname,'.smoke-profile/preview'));
const snapshot={...normalize(require('./fixture.json')),updatedAt:Date.now()/1000,appVersion:require('./package.json').version,preferences:defaults,orbVisible:true,update:{status:'idle'}};
ipcMain.handle('snapshot',()=>snapshot);
app.whenReady().then(async()=>{const w=new BrowserWindow({show:false,width:1000,height:900,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,sandbox:true}});await w.loadFile(path.join(__dirname,'index.html'),{query:{view:'dashboard'}});await new Promise(r=>setTimeout(r,700));fs.mkdirSync(path.join(__dirname,'docs'),{recursive:true});fs.writeFileSync(path.join(__dirname,'docs/preview.png'),(await w.capturePage()).toPNG());console.log('PREVIEW=synthetic data');w.destroy();app.exit(0);}).catch(e=>{console.error(e.message);app.exit(1);});
