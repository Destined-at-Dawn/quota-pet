'use strict';
{
 const section=document.createElement('details');section.className='preferences';section.id='client-setup';section.open=true;
 section.innerHTML=`<summary>连接 Codex / Claude Desktop</summary>
 <p>已有 API Key 的配置入口。订阅账号自动生成个人 Key 的完整流程仍在接入中。</p>
 <ol><li>先安装 CC Switch v3.20.4 或更新版本。</li><li>选择客户端，填写与 Key 对应的接口和模型。</li><li>点击配置，在 CC Switch 中确认导入并启用，然后完全退出并重新打开目标客户端。</li></ol>
 <button type="button" id="cc-download">下载 CC Switch</button>
 <form id="client-setup-form" autocomplete="off">
 <label for="cc-client">客户端</label><select id="cc-client"><option value="codex">Codex 桌面端</option><option value="claude-desktop">Claude Desktop</option></select>
 <label for="cc-endpoint">Key 类型</label><select id="cc-endpoint"><option value="gateway">网关 API Key（不是订阅登录凭据）</option><option value="personal">个人 BYOK Key（仅 Claude Desktop）</option></select>
 <label for="cc-key">API Key</label><input id="cc-key" type="password" required minlength="8" maxlength="4096" autocomplete="off" spellcheck="false">
 <label for="cc-model">模型 ID（可留空）</label>
 <div class="model-picker" id="cc-picker"><input id="cc-model" maxlength="160" placeholder="留空：全部可用模型；点击选择或搜索" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="cc-model-list" aria-describedby="cc-model-hint">
 <div id="cc-model-popup" hidden><p id="cc-model-state" role="status"></p><div id="cc-model-list" role="listbox" aria-label="模型列表"></div><button type="button" id="cc-model-retry">刷新模型列表</button></div></div>
 <small id="cc-model-hint">留空不额外指定模型，可使用当前 Key 已授权的全部模型；套餐与 Key 的权限仍然生效。CC Switch 可能使用客户端默认模型。</small>
 <small>Claude Desktop 直连请填写 Claude 模型 ID。其他模型的映射请在 CC Switch 中设置。个人 BYOK 暂未开放 Codex 的 Responses 接口。</small>
 <button type="submit">交给 CC Switch 配置</button><button type="button" id="cc-clear">清除 Key</button>
 <p id="cc-status" role="status" aria-live="polite"></p></form>
 <p>恢复原登录：在 CC Switch 中切回 OpenAI Official 或 Claude Desktop Official，再重启对应客户端。这里不会删除会话、修改应用安装包或自动关闭正在运行的客户端。</p>`;
 document.querySelector('.preferences').after(section);
 const q=s=>section.querySelector(s),status=q('#cc-status'),key=q('#cc-key'),model=q('#cc-model'),popup=q('#cc-model-popup'),list=q('#cc-model-list'),modelState=q('#cc-model-state');
 const messages={INVALID_CLIENT:'请选择客户端。',INVALID_KEY:'请检查 API Key。',INVALID_MODEL:'请检查模型名称；Claude Desktop 直连需要 Claude 模型 ID。',INVALID_ENDPOINT:'请检查 Key 类型。',PERSONAL_CODEX_PENDING:'个人接口的 Responses 接入尚未完成。',CC_SWITCH_MISSING:'请先安装 CC Switch v3.20.4 或更新版本。',OPEN_FAILED:'CC Switch 打开失败，请安装后重试。',MODEL_AUTH_REQUIRED:'Key 已失效或未获授权，请更新 Key 后重试。',MODEL_LOOKUP_FAILED:'模型列表读取失败，请点击刷新重试。',MODEL_LOCKED:'当前 Key 尚未解锁此模型，请选择有权限的模型。',NO_AVAILABLE_MODELS:'当前 Key 没有可用于此客户端的模型。'};
 const lockReason='当前 Key 尚未解锁此模型。请先选择支持该模型的套餐；已有套餐请检查 Key 的模型权限。';
 const reasonFor=item=>item.reason==='PLAN_REQUIRED'?'体验档未解锁此模型：尚未选择支持该模型的套餐，请选择套餐后解锁。':lockReason;
 let models=[],revision=0,loaded=false,loading=false,attempted=false,active=-1,timer;
 const input=()=>({client:q('#cc-client').value,endpoint:q('#cc-endpoint').value,apiKey:key.value,model:model.value});
 function close(){popup.hidden=true;model.setAttribute('aria-expanded','false');model.removeAttribute('aria-activedescendant');active=-1;}
 function choose(id){model.value=id;close();model.focus();close();}
 function render(){
  list.replaceChildren();active=-1;model.removeAttribute('aria-activedescendant');
  if(!loaded)return;
  const term=model.value.trim().toLowerCase(),items=[{id:'',available:true},...models.filter(item=>item.id.toLowerCase().includes(term))];
  for(const [index,item] of items.entries()){
   const row=document.createElement('div');row.className='model-option';row.id=`cc-option-${index}`;row.setAttribute('role','option');row.setAttribute('aria-selected',String(model.value===item.id));row.setAttribute('aria-disabled',String(!item.available));row.dataset.model=item.id;row.dataset.reason=reasonFor(item);
   const label=document.createElement('span');label.textContent=item.id||'全部可用模型（留空）';row.append(label);
   if(item.available){row.addEventListener('mousedown',event=>event.preventDefault());row.addEventListener('click',()=>choose(item.id));}
   else{
    const lock=document.createElement('button');lock.type='button';lock.className='model-lock';lock.setAttribute('aria-label',`${item.id}：未解锁`);lock.setAttribute('aria-describedby',`cc-lock-${index}`);
    lock.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"></rect><path d="M8 10V7a4 4 0 0 1 8 0v3"></path><path d="M12 14v3"></path></svg>';
    const tip=document.createElement('span');tip.id=`cc-lock-${index}`;tip.className='model-lock-tip';tip.setAttribute('role','tooltip');tip.textContent=reasonFor(item);lock.append(tip);lock.addEventListener('click',()=>{modelState.textContent=reasonFor(item);});row.append(lock);
   }
   list.append(row);
  }
  if(items.length===1&&term)modelState.textContent='没有匹配的模型；可清空搜索查看全部。';
 }
 async function refresh(){
  clearTimeout(timer);const version=++revision;models=[];loaded=false;loading=false;attempted=true;render();
  if((key.value&&key.value.length<8)||(!key.value&&q('#cc-endpoint').value==='personal')){modelState.textContent='请先填写有效的 API Key，再读取可用模型。';return;}
  loading=true;modelState.textContent='正在读取此 Key 的模型权限…';
  try{const result=await window.pet.listClientModels(input());if(version!==revision)return;loading=false;
   if(!result.ok){modelState.textContent=messages[result.code]||messages.MODEL_LOOKUP_FAILED;return;}
   models=result.models;loaded=true;const count=models.filter(item=>item.available).length;
   modelState.textContent=result.mode==='trial-preview'?`免登录体验目录：${count} 个可选 · ${models.length-count} 个需套餐解锁。实际免登录调用待接入；填写 Key 可读取实际权限。`:`${count} 个可用 · ${models.length-count} 个未解锁${result.catalogAvailable?'':'（完整目录暂未读取）'}`;render();
  }catch{if(version===revision){loading=false;modelState.textContent=messages.MODEL_LOOKUP_FAILED;}}
 }
 function invalidate(){clearTimeout(timer);revision++;loaded=false;loading=false;attempted=false;models=[];model.value='';modelState.textContent='Key 或客户端已变更，等待重新读取。';render();}
 function open(){popup.hidden=false;model.setAttribute('aria-expanded','true');if(!attempted&&!loading)refresh();}
 model.addEventListener('focus',open);model.addEventListener('click',open);q('#cc-picker').addEventListener('mouseenter',()=>{if(document.activeElement===key)return;open();});
 q('#cc-picker').addEventListener('mouseleave',()=>{if(!q('#cc-picker').contains(document.activeElement))close();});
 model.addEventListener('input',()=>{open();render();});
 model.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if(!['ArrowDown','ArrowUp','Enter'].includes(event.key))return;
  if(event.key==='Enter'){if(!popup.hidden){event.preventDefault();const row=list.children[active];if(row&&row.getAttribute('aria-disabled')==='false')choose(row.dataset.model);else if(row)modelState.textContent=row.dataset.reason;}return;}
  event.preventDefault();open();const rows=[...list.children];if(!rows.length)return;active=(active+(event.key==='ArrowDown'?1:-1)+rows.length)%rows.length;
  rows.forEach((row,index)=>row.classList.toggle('active',index===active));model.setAttribute('aria-activedescendant',rows[active].id);rows[active].scrollIntoView({block:'nearest'});if(rows[active].getAttribute('aria-disabled')==='true')modelState.textContent=rows[active].dataset.reason;
 });
 document.addEventListener('pointerdown',event=>{if(!q('#cc-picker').contains(event.target))close();});
 q('#cc-picker').addEventListener('focusout',()=>{setTimeout(()=>{if(!q('#cc-picker').contains(document.activeElement))close();},0);});
 key.addEventListener('input',()=>{invalidate();timer=setTimeout(refresh,600);});
 q('#cc-model-retry').onclick=refresh;
 q('#cc-download').onclick=()=>window.pet.action('cc-switch-download');
 q('#cc-clear').onclick=()=>{key.value='';invalidate();close();status.textContent='Key 已清除。';};
 q('#cc-client').onchange=()=>{const personal=q('#cc-endpoint option[value="personal"]');personal.disabled=q('#cc-client').value==='codex';if(personal.disabled&&q('#cc-endpoint').value==='personal')q('#cc-endpoint').value='gateway';invalidate();if(!popup.hidden)refresh();};q('#cc-client').onchange();
 q('#cc-endpoint').onchange=()=>{invalidate();if(!popup.hidden)refresh();};
 q('form').onsubmit=async e=>{e.preventDefault();const button=q('button[type="submit"]');button.disabled=true;status.textContent='正在打开 CC Switch…';
  try{const result=await window.pet.configureClient({client:q('#cc-client').value,endpoint:q('#cc-endpoint').value,apiKey:key.value,model:q('#cc-model').value});status.textContent=result.ok?'已交给 CC Switch；请确认导入并启用。尚未验证客户端实际调用。':messages[result.code]||'配置未完成，请重试。';}
  catch{status.textContent='配置未完成，请重试。';}
  finally{key.value='';invalidate();close();button.disabled=false;}
 };
 window.addEventListener('pagehide',()=>{key.value='';invalidate();close();});
}
