'use strict';
const policy=require('./model-access-policy.json');
function family(id){
 const value=String(id).trim().toLowerCase().replaceAll('_','-').replaceAll(' ','');
 if(/(?:^|[/:-])(?:claude-)?fable-?5[.-]1(?=$|[^0-9])/.test(value))return 'fable-5.1';
 if(/(?:^|[/:-])(?:claude-)?opus-?5[.-]5(?=$|[^0-9])/.test(value))return 'opus-5.5';
 if(/(?:^|[/:-])gpt-?6(?=$|[^0-9])/.test(value))return 'gpt-6';
 return null;
}
function decision(plan,id){
 const rule=Object.hasOwn(policy.plans,plan)?policy.plans[plan]:null;
 if(!rule||!Array.isArray(rule.deniedFamilies))return {allowed:false,reason:'PLAN_UNCONFIRMED'};
 const blocked=rule.deniedFamilies.includes(family(id));
 return {allowed:!blocked,reason:blocked?'PLAN_REQUIRED':null};
}
module.exports={policy,family,decision};
