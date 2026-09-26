'use strict';
{
 const section=document.createElement('details');section.className='preferences';section.id='client-setup';
 section.innerHTML=`<summary>连接 Codex / Claude Desktop</summary>
 <p>已有 API Key 的配置入口。订阅账号自动生成个人 Key 的完整流程仍在接入中。</p>
 <ol><li>先安装 CC Switch v3.20.4 或更新版本。</li><li>选择客户端，填写与 Key 对应的接口和模型。</li><li>点击配置，在 CC Switch 中确认导入并启用，然后完全退出并重新打开目标客户端。</li></ol>
 <button type="button" id="cc-download">下载 CC Switch</button>
 <form id="client-setup-form" autocomplete="off">
 <label for="cc-client">客户端</label><select id="cc-client"><option value="codex">Codex 桌面端</option><option value="claude-desktop">Claude Desktop</option></select>
 <label for="cc-endpoint">Key 类型</label><select id="cc-endpoint"><option value="gateway">网关 API Key（不是订阅登录凭据）</option><option value="personal">个人 BYOK Key（仅 Claude Desktop）</option></select>
 <label for="cc-key">API Key</label><input id="cc-key" type="password" required minlength="8" maxlength="4096" autocomplete="off" spellcheck="false">
 <label for="cc-model">模型名称</label><input id="cc-model" required maxlength="160" placeholder="填写该 Key 可用的模型 ID" autocomplete="off" spellcheck="false">
 <small>Claude Desktop 直连请填写 Claude 模型 ID。其他模型的映射请在 CC Switch 中设置。个人 BYOK 暂未开放 Codex 的 Responses 接口。</small>
 <button type="submit">交给 CC Switch 配置</button><button type="button" id="cc-clear">清除 Key</button>
 <p id="cc-status" role="status" aria-live="polite"></p></form>
 <p>恢复原登录：在 CC Switch 中切回 OpenAI Official 或 Claude Desktop Official，再重启对应客户端。这里不会删除会话、修改应用安装包或自动关闭正在运行的客户端。</p>`;
 document.querySelector('.preferences').after(section);
 const q=s=>section.querySelector(s),status=q('#cc-status'),key=q('#cc-key');
 q('#cc-download').onclick=()=>window.pet.action('cc-switch-download');
 q('#cc-clear').onclick=()=>{key.value='';status.textContent='Key 已清除。';};
 q('#cc-client').onchange=()=>{const personal=q('#cc-endpoint option[value="personal"]');personal.disabled=q('#cc-client').value==='codex';if(personal.disabled&&q('#cc-endpoint').value==='personal')q('#cc-endpoint').value='gateway';};q('#cc-client').onchange();
 const messages={INVALID_CLIENT:'请选择客户端。',INVALID_KEY:'请检查 API Key。',INVALID_MODEL:'请检查模型名称；Claude Desktop 直连需要 Claude 模型 ID。',INVALID_ENDPOINT:'请检查 Key 类型。',PERSONAL_CODEX_PENDING:'个人接口的 Responses 接入尚未完成。',CC_SWITCH_MISSING:'请先安装 CC Switch v3.20.4 或更新版本。',OPEN_FAILED:'CC Switch 打开失败，请安装后重试。'};
 q('form').onsubmit=async e=>{e.preventDefault();const button=q('button[type="submit"]');button.disabled=true;status.textContent='正在打开 CC Switch…';
  try{const result=await window.pet.configureClient({client:q('#cc-client').value,endpoint:q('#cc-endpoint').value,apiKey:key.value,model:q('#cc-model').value});status.textContent=result.ok?'已交给 CC Switch；请确认导入并启用。尚未验证客户端实际调用。':messages[result.code]||'配置未完成，请重试。';}
  catch{status.textContent='配置未完成，请重试。';}
  finally{key.value='';button.disabled=false;}
 };
 window.addEventListener('pagehide',()=>{key.value='';});
}
