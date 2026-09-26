'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[2]||__dirname),packaged=process.argv.includes('--package');
const skip=new Set(['.git','node_modules','dist','artifacts','evidence','.smoke-profile']);
const forbidden=/^(?:\.env(?:\..*)?|auth\.dat|auth\.json|Cookies|Login Data|preferences\.json|quota-cache\.json|runtime-status\.json|position\.json|keys\.json)$/i;
const issues=[];let count=0;
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const full=path.join(dir,entry.name),rel=path.relative(root,full);
 if(entry.isSymbolicLink()){issues.push([rel,'symlink']);continue;}
 if(entry.isDirectory()){
  if(skip.has(entry.name)){if(packaged)issues.push([rel,'runtime-directory']);continue;}
  scan(full);continue;
 }
 count++;
 if(forbidden.test(entry.name)||/\.(pem|key|token|log)$/i.test(entry.name)){issues.push([rel,'runtime-or-secret-file']);continue;}
 if(!/\.(js|cjs|json|md|html|css|ps1|svg|txt)$/i.test(entry.name)||fs.statSync(full).size>5e6)continue;
 const s=fs.readFileSync(full,'utf8');
 if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(s)||/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|sk-[A-Za-z0-9_-]{32,})\b/.test(s))issues.push([rel,'credential-pattern']);
 // Workstation identity paths are never release inputs. System paths are allowed.
 if(/(?:[A-Z]:[\\/]Users[\\/](?!Public\b|Default\b)[^\s'"<>]+)/i.test(s)||/\/(?:Users|home)\/[a-z0-9_-]+\//i.test(s))issues.push([rel,'personal-path']);
 const emails=[...s.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)];
 // URI userinfo in negative tests is not a mailbox; legal attributions stay intact.
 if(entry.name!=='THIRD_PARTY_NOTICES.md'&&emails.some(m=>{
  const prefix=s.slice(Math.max(0,m.index-20),m.index);
  return !/:\/\/(?:[A-Za-z0-9_-]+:)?$/.test(prefix)&&!/@(?:example\.(?:com|org|net|invalid)(?:-plus\.json)?|users\.noreply\.github\.com)$/i.test(m[0]);
 }))issues.push([rel,'non-example-email']);
}}
scan(root);
console.log(JSON.stringify({audit:issues.length?'FAIL':'PASS',files:count,issues},null,2));
process.exitCode=issues.length?1:0;
