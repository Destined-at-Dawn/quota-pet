const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {defaults,validate}=require('./preferences.cjs');
test('app pin defaults, migration and explicit new value',()=>{
 const base={refreshMinutes:5,lowQuotaReminder:true};
 assert.equal(defaults.appAlwaysOnTop,false);
 assert.equal(validate({...base,wechatAlwaysOnTop:true}).appAlwaysOnTop,true);
 assert.equal(validate({...base,wechatAlwaysOnTop:true,appAlwaysOnTop:false}).appAlwaysOnTop,false);
 assert.equal('wechatAlwaysOnTop' in validate({...base,wechatAlwaysOnTop:true}),false);
 assert.throws(()=>validate({...base,appAlwaysOnTop:'true'}));
});
test('pin uses app-owned windows and header lives outside scrolling main',()=>{
 const read=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
 const main=read('main.js'),html=read('index.html');
 assert.doesNotMatch(main,/wechatPinProcess|updateWechatPin|wechat-pin\.ps1/);
 assert(main.includes('window.setAlwaysOnTop(preferences.appAlwaysOnTop'));
 assert(html.indexOf('</header>')<html.indexOf('<main>'));
 assert(html.includes('class="window-controls"'));
 assert.doesNotMatch(read('build.cjs'),/wechat-pin\.ps1/);
});
