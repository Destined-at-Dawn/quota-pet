'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const i18n=require('./i18n.js'),menus=require('./native-menus.cjs');
test('all locales have matching message parameters and no generic kitten copy',()=>{
 for(const [key,row] of Object.entries(i18n.messages)){
  const params=value=>[...value.matchAll(/\{(\w+)\}/g)].map(x=>x[1]).sort();
  for(const lang of i18n.locales){assert.equal(typeof row[lang],'string',key+':'+lang);assert.deepEqual(params(row[lang]),params(row['zh-CN']),key);assert.doesNotMatch(row[lang],/小猫|小貓/);}
 }
});
test('brand interpolation and repeated switches are deterministic',()=>{
 for(const lang of ['en','zh-TW','zh-CN','en','zh-CN']){
  const name={en:'Quota Pet','zh-TW':'團團','zh-CN':'团团'}[lang];
  assert.equal(i18n.t('pet',{},lang),name);assert(i18n.t('hotkeyHelp',{},lang).includes(name));assert(i18n.t('orbLow',{count:3},lang).includes(name));
 }
 assert.equal(i18n.locale('bad'),'zh-CN');assert.throws(()=>i18n.t('missing'),/Unknown message key/);assert.throws(()=>i18n.t('remaining'),/Missing message parameter/);
});
test('all declarative UI keys exist; runtime code has no embedded mascot names or DOM text translation',()=>{
 for(const file of ['index.html','orb.html'])for(const match of fs.readFileSync(path.join(__dirname,file),'utf8').matchAll(/data-i18n(?:-[\w-]+)?="([^"]+)"/g))assert(i18n.messages[match[1]],match[1]);
 for(const file of ['main.js','renderer.js','orb.js','index.html','orb.html','native-menus.cjs'])assert.doesNotMatch(fs.readFileSync(path.join(__dirname,file),'utf8'),/小猫|小貓|团团|團團|createTreeWalker|location\.reload/);
});
test('native menus use current locale and preserve click actions',()=>{
 let count=0;const actions=new Proxy({},{get:()=>()=>count++});
 for(const lang of i18n.locales){const tray=menus.trayTemplate(lang,actions);assert.equal(tray[1].label,i18n.t('showPet',{},lang));tray[1].click();assert.equal(menus.sizeTemplate(lang,actions,72)[4].label,i18n.t('petSize',{},lang));assert.equal(menus.closeTemplate(lang,actions)[0].label,i18n.t('background',{},lang));}assert.equal(count,3);
});
test('account names and unrecognized upstream values remain untouched',()=>{
 for(const lang of i18n.locales){assert.equal(i18n.known('小猫团队 · user@example.com',lang),'小猫团队 · user@example.com');assert.equal(i18n.known('custom platform value',lang),'custom platform value');}
});
