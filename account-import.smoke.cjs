const {app,BrowserWindow}=require('electron');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
app.setPath('userData',path.join(__dirname,'.import-smoke-profile'));
app.whenReady().then(async()=>{
 let status='wait',starts=0,callbacks=0,opens=0;
 const server=http.createServer((req,res)=>{
  if(req.url==='/add'){res.setHeader('content-type','text/html; charset=utf-8');return res.end(fs.readFileSync(path.join(__dirname,'..','outputs','account-import-20260925','add.html')));}
  res.setHeader('content-type','application/json');
  if(req.url.includes('/start')){starts++;return res.end(JSON.stringify({id:'fixture',url:'https://claude.ai/oauth/authorize',user_code:''}));}
  if(req.url.includes('/callback')){callbacks++;status='ok';return res.end('{"status":"wait"}');}
  if(req.url.includes('/cancel'))return res.end('{"status":"error","message":"cancelled"}');
  res.end(JSON.stringify({status,message:status==='ok'?'账号已导入':'waiting'}));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 const win=new BrowserWindow({show:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false}});
 require('./account-links.cjs').installAccountLinks(win.webContents,origin,()=>{opens++;});
 const run=s=>win.webContents.executeJavaScript(s);
 try{
  await win.loadURL(origin+'/add');
  assert.equal(await run('document.querySelectorAll("#provider option").length'),5);
  await run('startImport()');assert.equal(starts,1);
  await run('startImport()');assert.equal(starts,1);
  await run('document.querySelector("#box a").click()');await new Promise(r=>setTimeout(r,120));assert.equal(opens,1);
  assert.equal(await run('document.querySelector("#callback").hidden'),false);
  await run('document.querySelector("#redirect").value="http://localhost/cb?state=test&code=test";submitCallback()');
  await new Promise(r=>setTimeout(r,200));assert.equal(callbacks,1);
  assert.equal(await run('document.querySelector("#tip").textContent'),'账号已导入');
  assert.equal(await run('document.querySelector("#start").disabled'),false);
  status='wait';await run('startImport()');await run('cancelImport()');
  assert.equal(await run('document.querySelector("#tip").textContent'),'cancelled');
  console.log('IMPORT_UI=PASS platforms=5 external_auth=PASS callback=PASS completion=PASS cancel=PASS duplicate=PASS');
 }finally{win.destroy();server.close();app.quit();}
}).catch(e=>{console.error(e);app.exit(1);});
