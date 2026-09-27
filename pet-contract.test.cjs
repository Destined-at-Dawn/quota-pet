'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {validatePack,filterCatalog,atlasFrame,createSelector,createEventRouter}=require('./pet-contract.js');
const original=require('./pet-catalog.cjs').getPack('tuantuan-original');
const copy=id=>({...structuredClone(original),id,name:id});
test('original pack survives unchanged',()=>assert.deepEqual(validatePack(original),original));
test('paths stay in pack',()=>{for(const asset of ['../x.svg','https://x/a.png','C:/x','/tmp/x','a/../x'])assert.throws(()=>validatePack({...original,assets:{idle:asset}}));});
test('code licensing does not substitute for art provenance',()=>assert.throws(()=>validatePack({...original,provenance:{codeLicense:'MIT'}})));
test('catalog searches and deduplicates by stable id',()=>assert.equal(filterCatalog([original,original,copy('other')],'团团').length,1));
test('official 9-row atlas contract enforced',()=>{assert.throws(()=>validatePack({...original,renderer:'codex-atlas-v1'}));assert.equal(atlasFrame('review',5).y,1664);assert.throws(()=>atlasFrame('idle',6));});
test('load failure keeps current and never saves',async()=>{let calls=0;const s=createSelector({initial:original,prepare:async()=>{throw Error('decode failed');},persist:async()=>calls++});await assert.rejects(s.select(copy('bad')));assert.equal(s.current().id,original.id);assert.equal(calls,0);});
test('save failure preserves current and undo history',async()=>{const s=createSelector({initial:original,prepare:async()=>{},persist:async()=>{throw Error('disk full');}});await assert.rejects(s.select(copy('new')));assert.equal(s.current().id,original.id);assert.deepEqual(s.history(),[]);});
test('serialized selection prevents out-of-order apply',async()=>{const writes=[];const s=createSelector({initial:original,prepare:async()=>{},persist:async p=>writes.push(p.id)});await Promise.all([s.select(copy('first')),s.select(copy('second'))]);assert.deepEqual(writes,['first','second']);assert.equal(s.current().id,'second');await s.undo();assert.equal(s.current().id,'first');await s.undo();assert.equal(s.current().id,original.id);});
test('stale/unknown quota is not starving',()=>{const r=createEventRouter();r.observe({at:5,quotaConfirmed:false,allExhausted:true},100);assert.equal(r.view({now:101}).appearance,'normal');assert.equal(r.observe({at:4,quotaConfirmed:true,allExhausted:true},100),false);});
test('exhaustion wins over recharge, reduced motion preserves expression',()=>{const r=createEventRouter();r.observe({at:5,quotaConfirmed:true,allExhausted:true,eventId:'topup',eventType:'recharge'},100);assert.deepEqual(r.view({now:101,reducedMotion:true}),{appearance:'exhausted',motion:'still'});});
test('a repeated event does not replay',()=>{const r=createEventRouter();const e={at:5,eventId:'credit-1',eventType:'recharge'};r.observe(e,100);assert.equal(r.view({now:101}).appearance,'love');r.observe(e,5000);assert.equal(r.view({now:5001}).motion,'idle');});
test('drag pauses event motion; expiry returns to walking',()=>{const r=createEventRouter();r.observe({at:5,eventId:'reset-1',eventType:'quota-reset'},100);assert.equal(r.view({now:101,dragging:true}).motion,'held');assert.equal(r.view({now:5000,moving:true,heading:-1}).motion,'running-left');});

test('production packs are original artwork and accept both persisted modes',()=>{const {defaults,validate}=require('./preferences.cjs');for(const id of ['tuantuan-original','tuantuan-paper'])assert.equal(validate({...defaults,petId:id}).petId,id);assert.throws(()=>validate({...defaults,petId:'3d'}));});

test('cleared source event cancels a previous transient without losing dedupe',()=>{const r=createEventRouter();r.observe({at:1,eventId:'x',eventType:'recharge'},0);r.observe({at:2,clearEvent:true},1);assert.equal(r.view({now:2}).motion,'idle');r.observe({at:3,eventId:'x',eventType:'recharge'},3);assert.equal(r.view({now:4}).motion,'idle');});
