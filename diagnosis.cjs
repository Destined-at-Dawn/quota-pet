'use strict';
function diagnose(a){
 const evidence=[a.error,a.status_message,a.error_code,a.diagnostic?.code].filter(Boolean).join(' ').toLowerCase();
 const result=(code,title,action)=>({code,title,action});
 if(a.disabled)return result('disabled','账号已停用','启用账号后再查看额度。');
 if(/invalid_grant|token_expired|token_revoked|refresh_token_reused|authentication_error|unauthorized|invalid.*token|expired.*token|token.*expired|登录.*失效|认证.*失效|上游 http 401/.test(evidence))return result('auth_expired','登录已失效','请重新登录这个账号，或重新导入登录信息。');
 const exhausted=/usage_limit_reached|quota_exceeded|insufficient_quota|额度.*用完|已触顶/.test(evidence)||a.extra?.状态==='已触顶'||(Array.isArray(a.windows)?a.windows:[]).some(w=>typeof w?.used_pct==='number'&&w.used_pct>=100);
 if(exhausted)return String(a.plan||'').toLowerCase()==='free'?result('free_exhausted','免费额度已用完','等待额度恢复，或切换其他可用账号。'):result('quota_exhausted','当前额度已用完','等待额度恢复，或切换其他可用账号。');
 if(/http 429|too many requests|rate_limit_exceeded/.test(evidence))return result('rate_limited','查询过于频繁','稍等一会儿再刷新。');
 if(/http 403|permission_denied|access_denied/.test(evidence))return result('access_denied','平台拒绝了额度查询','可能是账号权限或访问限制，需要进一步检查；不代表额度为零。');
 if(/timeout|timed out|超时|econn|network|http 50[0234]/.test(evidence))return result('network','暂时连接不上平台','稍后重试，不影响已保存的账号。');
 if(/auth_index|project_id/.test(evidence))return result('configuration','账号信息不完整','请重新导入账号，或联系管理员检查。');
 if(a.error)return result('unknown','暂时未查明原因','平台没有提供明确原因，请重新检查账号状态。');
 if(!(a.windows||[]).length&&!(a.credits||[]).length)return result('unavailable','平台暂未提供额度详情','暂无数据不代表额度已用完。');
 return null;
}
module.exports={diagnose};

