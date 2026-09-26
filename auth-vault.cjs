// Store only an already authenticated session. A local file never grants a role.
const fs=require('node:fs'),path=require('node:path');
function createVault(file,safeStorage){
 function available(){if(!safeStorage.isEncryptionAvailable())throw Error('Windows 凭据加密服务不可用');}
 return {
  save(cookies){available();const envelope={version:1,origin:'https://pool.yulitongxing.com',cookies};const encrypted=safeStorage.encryptString(JSON.stringify(envelope));fs.mkdirSync(path.dirname(file),{recursive:true});const temp=file+'.tmp';fs.writeFileSync(temp,encrypted,{mode:0o600});fs.renameSync(temp,file);},
  load(){if(!fs.existsSync(file))return [];available();const d=JSON.parse(safeStorage.decryptString(fs.readFileSync(file)));if(d.version!==1||d.origin!=='https://pool.yulitongxing.com'||!Array.isArray(d.cookies))throw Error('授权文件格式不匹配');return d.cookies.filter(c=>c&&typeof c.name==='string'&&typeof c.value==='string'&&c.domain==='pool.yulitongxing.com'&&(!c.expirationDate||c.expirationDate>Date.now()/1000));},
  clear(){if(fs.existsSync(file))fs.unlinkSync(file);}
 };
}
module.exports={createVault};
