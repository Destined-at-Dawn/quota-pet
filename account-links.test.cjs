const test=require('node:test'),assert=require('node:assert/strict');
const {isAuthLink,installAccountLinks}=require('./account-links.cjs');
test('official authorization hosts only',()=>{
 for(const u of ['https://auth.openai.com/device','https://accounts.google.com/o/oauth2/auth','https://claude.ai/oauth/authorize','https://chat.qwen.ai/authorize'])assert.equal(isAuthLink(u),true);
 for(const u of ['javascript:alert(1)','file:///C:/Windows','http://auth.openai.com/device','https://auth.openai.com.evil.test/','https://evil.test/?auth.openai.com','https://user:password@auth.openai.com/','https://auth.openai.com:8443/','not-url'])assert.equal(isAuthLink(u),false);
});
test('popup opens external auth; same-origin navigation remains in app',()=>{
 const events={},opened=[];let popup;const contents={setWindowOpenHandler:f=>popup=f,on:(n,f)=>events[n]=f};
 installAccountLinks(contents,'https://pool.yulitongxing.com',u=>opened.push(u));
 assert.deepEqual(popup({url:'https://claude.ai/oauth/authorize'}),{action:'deny'});assert.equal(opened.length,1);
 popup({url:'https://evil.test/'});assert.equal(opened.length,1);
 let prevented=0;const event={preventDefault:()=>prevented++};
 events['will-navigate'](event,'https://pool.yulitongxing.com/add');assert.equal(prevented,0);
 events['will-navigate'](event,'https://accounts.google.com/o/oauth2/auth');assert.equal(prevented,1);assert.equal(opened.length,2);
 events['will-navigate'](event,'file:///etc/passwd');assert.equal(prevented,2);assert.equal(opened.length,2);
});
