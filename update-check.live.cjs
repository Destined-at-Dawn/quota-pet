const {app,net}=require('electron');
const path=require('node:path');
const dir=process.env.QUOTA_PET_TEST_APP_DIR||__dirname;
app.setPath('userData',path.join(__dirname,'.smoke-profile/update-live'));
app.whenReady().then(async()=>{
 const {createUpdateChecker}=require(path.join(dir,'update-check.cjs'));
 const current=require(path.join(dir,'package.json')).version;
 const checker=createUpdateChecker({current,fetchImpl:(...args)=>net.fetch(...args)});
 const state=await checker.check();console.log('LIVE_UPDATE='+JSON.stringify(state));app.exit(state.status==='error'?1:0);
}).catch(e=>{console.error(e.message);app.exit(1);});
