'use strict';
const {validatePack,filterCatalog}=require('./pet-contract.js');
const base={version:1,renderer:'layered-svg',assets:{idle:'cat.svg',love:'cat-love.svg',exhausted:'cat-exhausted.svg'},provenance:{source:'quota-pet original artwork',codeLicense:'project source',assetLicense:'existing project artwork'}};
const catalog=[{...base,id:'tuantuan-original',name:'团团 · 灵动原画',description:'原来的小猫，轻微呼吸、眨眼、摇尾',motionProfile:'gentle'},{...base,id:'tuantuan-paper',name:'团团 · 安静贴纸',description:'同一只原画小猫，静静陪伴，保留状态表情',motionProfile:'still'}].map(validatePack);
function getPack(id){return catalog.find(p=>p.id===id)||catalog[0];}
module.exports={catalog,getPack,search:q=>filterCatalog(catalog,q)};
