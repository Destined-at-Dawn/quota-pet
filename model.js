'use strict';
const {diagnose}=require('./diagnosis.cjs');
const numeric=x=>typeof x==='number'&&Number.isFinite(x);
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const entries=x=>Array.isArray(x)?x.filter(obj):[];
function normalize(d){
 if(!d||!Array.isArray(d.accounts))throw Error('额度接口结构不匹配');
 const invalid=d.accounts.length-entries(d.accounts).length;
 return {state:d.error||invalid?'partial':'ok',message:[d.error,invalid?`${invalid} 条账号结构异常，未计入显示数量`:null].filter(Boolean).join('；'),updatedAt:numeric(d.updated_at)?d.updated_at:null,
 accounts:entries(d.accounts).map(a=>({diagnosis:diagnose(a),owner:String(a.owner||a.name||'未命名账号'),provider:String(a.provider||a.type||'未知平台'),type:String(a.type||''),plan:String(a.plan||''),disabled:!!a.disabled,error:String(a.error||''),
 windows:entries(a.windows).map(w=>({label:String(w.label||'额度窗口'),remaining:numeric(w.used_pct)&&w.used_pct>=0&&w.used_pct<=100?Number((100-w.used_pct).toFixed(6)):null,resetAt:numeric(w.reset_at)?w.reset_at:null,note:String(w.note||'')})),
 credits:entries(a.credits).map(c=>({label:String(c.label||'余额'),raw:String(c.raw??'上游未返回'),usable:c.usable!==false})),extra:obj(a.extra)?a.extra:{}})),
 users:entries(d.relay?.users).map(u=>({name:String(u.name||u.username||'未命名用户'),group:String(u.group||''),remaining:numeric(u.remain_usd)?u.remain_usd:null,used:numeric(u.used_usd)?u.used_usd:null})),
 channels:entries(d.relay?.channels).map(c=>({name:String(c.name||'渠道'),balance:numeric(c.balance)?c.balance:null,currency:String(c.currency||''),note:String(c.note||'')})),relayError:String(d.relay?.error||'')};
}
function dockBounds(a,edge,y,size=60){return {x:edge==='left'?a.x:a.x+a.width-size,y:Math.max(a.y,Math.min(y,a.y+a.height-size)),width:size,height:size};}
function panelBounds(a,o,edge){const width=Math.min(440,a.width-20),height=Math.min(620,a.height-20);return {x:Math.max(a.x,Math.min(edge==='left'?o.x+o.width-2:o.x-width+2,a.x+a.width-width)),y:Math.max(a.y,Math.min(o.y-30,a.y+a.height-height)),width,height};}
module.exports={normalize,dockBounds,panelBounds};
