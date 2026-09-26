'use strict';
const {t}=require('./i18n.js');
function trayTemplate(lang,actions){
 return [['openPet','open'],['showPet','show'],['hidePet','hide'],['left','left'],['right','right'],['login','login'],['quit','quit']].map(([key,action])=>({label:t(key,{},lang),click:actions[action]}));
}
function sizeTemplate(lang,actions,size){
 return [
  ...[['openPet','open'],['console','console'],['add','add'],['manageHint','manage']].map(([key,action])=>({label:t(key,{},lang),click:actions[action]})),
  {label:t('petSize',{},lang),submenu:[48,60,72,96,120].map(value=>({label:String(value)+' px',type:'radio',checked:size===value,click:()=>actions.resize(value)}))},
  {label:t('hidePet',{},lang),click:actions.hide}
 ];
}
function closeTemplate(lang,actions){return [{label:t('background',{},lang),click:actions.background},{label:t('quit',{},lang),click:actions.quit}];}
module.exports={trayTemplate,sizeTemplate,closeTemplate};
