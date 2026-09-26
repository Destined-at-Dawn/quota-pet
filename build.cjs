const fs=require('node:fs'),path=require('node:path');
const dest=path.resolve(__dirname,process.env.QUOTA_PET_BUILD_DIR||'dist/QuotaPet');if(fs.existsSync(dest))throw Error('Use a new build directory to avoid shipping stale runtime data');fs.mkdirSync(dest,{recursive:true});
fs.cpSync(path.join(__dirname,'node_modules','electron','dist'),dest,{recursive:true});
if(fs.existsSync(path.join(dest,'QuotaPet.exe')))fs.unlinkSync(path.join(dest,'QuotaPet.exe'));
fs.renameSync(path.join(dest,'electron.exe'),path.join(dest,'QuotaPet.exe'));
const out=path.join(dest,'resources','app');fs.mkdirSync(out,{recursive:true});
for(const file of ['LICENSE','NOTICE','update-check.cjs','client-setup.cjs','client-setup-ui.js','window-pin.svg','window-minimize.svg','native-menus.cjs','i18n.js','hotkey.cjs','account-links.cjs','remote-ui.cjs','diagnosis.cjs','foreground.cjs','foreground.ps1','preferences.cjs','main.js','model.js','preload.js','orb.js','orb.html','index.html','renderer.js','style.css','icon.png','cat.svg','auth-vault.cjs','fixture.json','smoke.cjs','package.json','README.md','THIRD_PARTY_NOTICES.md'])fs.copyFileSync(path.join(__dirname,file),path.join(out,file));
(async()=>{try{const {rcedit}=require('rcedit');await rcedit(path.join(dest,'QuotaPet.exe'),{icon:path.join(__dirname,'icon.ico'),"version-string":{"ProductName":"Quota Pet","FileDescription":"Quota Pet","OriginalFilename":"QuotaPet.exe","InternalName":"QuotaPet","CompanyName":"Li API"}});console.log('ICON PATCH PASS: '+path.join(dest,'QuotaPet.exe'));}catch(e){console.error('ICON PATCH FAIL: '+e.message);process.exitCode=1;return;}console.log('BUILD PASS: '+path.join(dest,'QuotaPet.exe'));})();

