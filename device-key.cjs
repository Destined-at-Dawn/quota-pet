// Server-side primitive; do not ship a universal credential or derive keys from user IDs.
const {randomInt,createHmac}=require('node:crypto');
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
function acceptable(key){return key.length===16&&/[A-Z]/.test(key)&&/[a-z]/.test(key)&&/[2-9]/.test(key)&&!/(.)\1\1/.test(key)&&!/(?:012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/.test(key);}
function generate(){let key;do{key=Array.from({length:16},()=>alphabet[randomInt(alphabet.length)]).join('');}while(!acceptable(key));return key;}
function digest(key,pepper){if(typeof pepper!=='string'||pepper.length<32)throw Error('Server pepper required');return createHmac('sha256',pepper).update(key).digest('hex');}
module.exports={generate,acceptable,digest};
