// Only provider authorization links may leave the sandboxed account window.
const AUTH_HOSTS = new Set([
 'auth.openai.com','accounts.google.com','claude.ai','platform.claude.com',
 'console.anthropic.com','auth.anthropic.com','chat.qwen.ai','www.kimi.com',
 'kimi.com','auth.x.ai','accounts.x.ai','login.x.ai','devin.ai','app.devin.ai',
 'www.meta.ai','meta.ai','www.facebook.com'
]);
function isAuthLink(value){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&AUTH_HOSTS.has(u.hostname);}catch{return false;}
}
function installAccountLinks(contents,origin,openExternal){
 const open=value=>{if(isAuthLink(value))Promise.resolve(openExternal(value)).catch(()=>{});};
 contents.setWindowOpenHandler(({url})=>{open(url);return {action:'deny'};});
 contents.on('will-navigate',(event,value)=>{
  let same=false;try{same=new URL(value).origin===origin;}catch{}
  if(!same){event.preventDefault();open(value);}
 });
}
module.exports={isAuthLink,installAccountLinks};
