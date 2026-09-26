// Shared by Electron main and local renderer pages. Keys, not rendered text, identify messages.
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PetI18n=factory();})(globalThis,()=>{
'use strict';
const messages={

  "downloadUpdate": {
    "zh-CN": "下载新版本",
    "zh-TW": "下載新版本",
    "en": "Download update"
  },
  "updateChecking": {
    "zh-CN": "正在检查更新… 当前版本 {current}",
    "zh-TW": "正在檢查更新… 目前版本 {current}",
    "en": "Checking for updates… Installed {current}"
  },
  "updateAvailable": {
    "zh-CN": "发现新版本 {latest}，当前版本 {current}。",
    "zh-TW": "發現新版本 {latest}，目前版本 {current}。",
    "en": "Update available: {latest}. Installed: {current}."
  },
  "updateCurrent": {
    "zh-CN": "当前版本 {current} 已是官网最新版本。",
    "zh-TW": "目前版本 {current} 已是官網最新版本。",
    "en": "Version {current} is up to date."
  },
  "updateAhead": {
    "zh-CN": "当前版本 {current} 高于官网正式版本 {latest}，无需降级。",
    "zh-TW": "目前版本 {current} 高於官網正式版本 {latest}，無需降級。",
    "en": "Installed {current} is newer than published {latest}; no downgrade needed."
  },
  "updateUnpublished": {
    "zh-CN": "当前版本 {current}；官网暂未发布正式安装包。",
    "zh-TW": "目前版本 {current}；官網暫未發布正式安裝包。",
    "en": "Installed {current}; no official release has been published yet."
  },
  "updateUnsupported": {
    "zh-CN": "当前版本 {current}；官网暂无适合此系统的安装包。",
    "zh-TW": "目前版本 {current}；官網暫無適合此系統的安裝包。",
    "en": "Installed {current}; no release is available for this system."
  },
  "updateError": {
    "zh-CN": "检查更新失败，请检查网络后重试。当前版本 {current}。",
    "zh-TW": "檢查更新失敗，請檢查網路後重試。目前版本 {current}。",
    "en": "Update check failed. Check your connection and retry. Installed {current}."
  },
  "updateAuthError": {
    "zh-CN": "官网更新接口要求登录，检查未完成。当前版本 {current}。",
    "zh-TW": "官網更新介面要求登入，檢查未完成。目前版本 {current}。",
    "en": "The update service requires sign-in; check not completed. Installed {current}."
  }
,
  "checkUpdate": {"zh-CN":"检查更新","zh-TW":"檢查更新","en":"Check updates"},
  "version": {"zh-CN":"版本 {version}","zh-TW":"版本 {version}","en":"Version {version}"},
  "pet": {
    "zh-CN": "团团",
    "zh-TW": "團團",
    "en": "Quota Pet"
  },
  "subtitle": {
    "zh-CN": "你的额度，{pet}替你守着",
    "zh-TW": "你的額度，{pet}替你守護",
    "en": "Let {pet} keep an eye on your quota"
  },
  "settings": {
    "zh-CN": "设置与外观",
    "zh-TW": "設定與外觀",
    "en": "Settings & appearance"
  },
  "settingsButton": {
    "zh-CN": "设置",
    "zh-TW": "設定",
    "en": "Settings"
  },
  "openSettings": {
    "zh-CN": "打开设置",
    "zh-TW": "開啟設定",
    "en": "Open settings"
  },
  "hide": {
    "zh-CN": "隐藏",
    "zh-TW": "隱藏",
    "en": "Hide"
  },
  "show": {
    "zh-CN": "显示",
    "zh-TW": "顯示",
    "en": "Show"
  },
  "hidePet": {
    "zh-CN": "隐藏{pet}",
    "zh-TW": "隱藏{pet}",
    "en": "Hide {pet}"
  },
  "showPet": {
    "zh-CN": "显示{pet}",
    "zh-TW": "顯示{pet}",
    "en": "Show {pet}"
  },
  "openPet": {
    "zh-CN": "打开{pet}",
    "zh-TW": "開啟{pet}",
    "en": "Open {pet}"
  },
  "petSize": {
    "zh-CN": "{pet}大小",
    "zh-TW": "{pet}大小",
    "en": "Resize {pet}"
  },
  "minimize": {
    "zh-CN": "最小化",
    "zh-TW": "最小化",
    "en": "Minimize"
  },
  "maximize": {
    "zh-CN": "最大化",
    "zh-TW": "最大化",
    "en": "Maximize"
  },
  "closeOptions": {
    "zh-CN": "关闭选项",
    "zh-TW": "關閉選項",
    "en": "Close options"
  },
  "login": {
    "zh-CN": "登录账号",
    "zh-TW": "登入帳號",
    "en": "Sign in"
  },
  "console": {
    "zh-CN": "中转站",
    "zh-TW": "中轉站",
    "en": "Transit"
  },
  "add": {
    "zh-CN": "添加账号",
    "zh-TW": "新增帳號",
    "en": "Add account"
  },
  "addButton": {
    "zh-CN": "＋ 添加账号",
    "zh-TW": "＋ 新增帳號",
    "en": "＋ Add account"
  },
  "addHint": {
    "zh-CN": "选择平台并授权导入",
    "zh-TW": "選擇平台並授權匯入",
    "en": "Choose a platform and authorize import"
  },
  "manage": {
    "zh-CN": "管理账号",
    "zh-TW": "管理帳號",
    "en": "Manage accounts"
  },
  "manageHint": {
    "zh-CN": "管理账号（重置、删除、导入）",
    "zh-TW": "管理帳號（重設、刪除、匯入）",
    "en": "Manage accounts (reset, delete, import)"
  },
  "refresh": {
    "zh-CN": "刷新",
    "zh-TW": "重新整理",
    "en": "Refresh"
  },
  "hotkeyLabel": {
    "zh-CN": "唤起快捷键",
    "zh-TW": "喚起快捷鍵",
    "en": "Global shortcut"
  },
  "hotkeyReset": {
    "zh-CN": "恢复默认快捷键",
    "zh-TW": "恢復預設快捷鍵",
    "en": "Restore default shortcut"
  },
  "hotkeyHelp": {
    "zh-CN": "点击输入框后按下组合键，再保存。后台运行时唤起主窗口和{pet}；彻底退出后需先打开 App。",
    "zh-TW": "點擊輸入框後按下組合鍵，再儲存。背景執行時喚起主視窗和{pet}；完全退出後需先開啟 App。",
    "en": "Click the field, press a shortcut, then save. Bring the main window and {pet} back from the background. After quitting, launch the app first."
  },
  "hotkeyConflict": {
    "zh-CN": "快捷键已被占用或不可用，请换一组；原快捷键保持不变。",
    "zh-TW": "快捷鍵已被占用或不可用，請換一組；原快捷鍵保持不變。",
    "en": "That shortcut is taken or unavailable. Choose another; your previous shortcut is unchanged."
  },
  "hotkeyInvalid": {
    "zh-CN": "请使用 Ctrl、Alt 或 Super 搭配字母、数字或 F1–F24。",
    "zh-TW": "請使用 Ctrl、Alt 或 Super 搭配字母、數字或 F1–F24。",
    "en": "Use Ctrl, Alt or Super with a letter, number or F1–F24."
  },
  "hotkeyUnavailable": {
    "zh-CN": "已保存的快捷键被占用或不可用，请重新设置。",
    "zh-TW": "已儲存的快捷鍵被占用或不可用，請重新設定。",
    "en": "Your saved shortcut is taken or unavailable. Choose another."
  },
  "quotaRefresh": {
    "zh-CN": "额度更新",
    "zh-TW": "額度更新",
    "en": "Quota refresh"
  },
  "manual": {
    "zh-CN": "仅手动更新",
    "zh-TW": "僅手動更新",
    "en": "Manual refresh only"
  },
  "automatic": {
    "zh-CN": "自动更新",
    "zh-TW": "自動更新",
    "en": "Automatic refresh"
  },
  "minutes": {
    "zh-CN": "间隔（分钟）",
    "zh-TW": "間隔（分鐘）",
    "en": "Interval (minutes)"
  },
  "refreshHelp": {
    "zh-CN": "默认 5 分钟，可设为 0～60 分钟。0 表示仅手动更新。",
    "zh-TW": "預設 5 分鐘，可設為 0～60 分鐘；0 表示僅手動更新。",
    "en": "Default: 5 minutes. Choose 0–60 minutes; 0 means manual refresh only."
  },
  "lowReminder": {
    "zh-CN": "额度剩余 10% 或更少时，{pet}闪三下提醒",
    "zh-TW": "額度剩餘 10% 或更少時，{pet}閃三下提醒",
    "en": "Have {pet} blink three times when quota reaches 10% or less"
  },
  "perAccount": {
    "zh-CN": "按各账号的额度分别提醒，不合并不同平台的额度。",
    "zh-TW": "依各帳號的額度分別提醒，不合併不同平台的額度。",
    "en": "Check each account separately; do not combine quotas across platforms."
  },
  "showLowNotice": {
    "zh-CN": "一直显示额度不足提示",
    "zh-TW": "一直顯示額度不足提示",
    "en": "Keep low-quota notices visible"
  },
  "lowNoticeHelp": {
    "zh-CN": "关闭后不再显示黄色提示，不影响查看账号额度和{pet}闪动。",
    "zh-TW": "關閉後隱藏黃色提示，不影響查看帳號額度和{pet}閃動。",
    "en": "Hide the yellow notice without changing account quotas or {pet}'s blinking reminder."
  },
  "browserBehind": {
    "zh-CN": "浏览器在前面时，{pet}不遮挡浏览器",
    "zh-TW": "瀏覽器在前面時，{pet}不遮擋瀏覽器",
    "en": "Keep {pet} behind the browser"
  },
  "browserBehindHelp": {
    "zh-CN": "开关立即生效。浏览器在前台时，{pet}自动收起；最小化浏览器或切换到其他应用后恢复显示。",
    "zh-TW": "開關立即生效。瀏覽器在前景時，{pet}自動收起；最小化瀏覽器或切換到其他應用程式後恢復顯示。",
    "en": "Applies immediately. {pet} hides while a browser is active and returns when you minimize it or switch apps."
  },
  "language": {
    "zh-CN": "语言 / Language",
    "zh-TW": "語言 / Language",
    "en": "Language"
  },
  "simplified": {
    "zh-CN": "简体中文",
    "zh-TW": "簡體中文",
    "en": "Simplified Chinese"
  },
  "traditional": {
    "zh-CN": "繁體中文",
    "zh-TW": "繁體中文",
    "en": "Traditional Chinese"
  },
  "english": {
    "zh-CN": "English",
    "zh-TW": "English",
    "en": "English"
  },
  "appearance": {
    "zh-CN": "界面风格",
    "zh-TW": "介面風格",
    "en": "Appearance"
  },
  "cream": {
    "zh-CN": "奶油暖白",
    "zh-TW": "奶油暖白",
    "en": "Warm cream"
  },
  "ocean": {
    "zh-CN": "晴空蓝",
    "zh-TW": "晴空藍",
    "en": "Sky blue"
  },
  "mint": {
    "zh-CN": "薄荷绿",
    "zh-TW": "薄荷綠",
    "en": "Mint green"
  },
  "lavender": {
    "zh-CN": "淡紫色",
    "zh-TW": "淡紫色",
    "en": "Lavender"
  },
  "externalBrowser": {
    "zh-CN": "用默认浏览器打开中转站和账号管理",
    "zh-TW": "用預設瀏覽器開啟中轉站和帳號管理",
    "en": "Open Transit and account management in your default browser"
  },
  "externalBrowserHelp": {
    "zh-CN": "开关立即生效。开启后由系统默认浏览器打开；关闭后在 App 内打开。两者登录状态分别保存。",
    "zh-TW": "開關立即生效。開啟後由系統預設瀏覽器開啟；關閉後在 App 內開啟。兩者登入狀態分別儲存。",
    "en": "Applies immediately. Open in your system default browser when on, or inside the app when off. Sign-in is stored separately."
  },
  "account": {
    "zh-CN": "账号",
    "zh-TW": "帳號",
    "en": "Account"
  },
  "logout": {
    "zh-CN": "退出登录",
    "zh-TW": "登出",
    "en": "Sign out"
  },
  "switchAccount": {
    "zh-CN": "切换账号",
    "zh-TW": "切換帳號",
    "en": "Switch account"
  },
  "logoutHelp": {
    "zh-CN": "退出后会清除本机登录状态；切换账号会打开登录页面。",
    "zh-TW": "登出後會清除本機登入狀態；切換帳號會開啟登入頁面。",
    "en": "Signing out clears this device's sign-in. Switching accounts opens the sign-in page."
  },
  "save": {
    "zh-CN": "保存设置",
    "zh-TW": "儲存設定",
    "en": "Save settings"
  },
  "saved": {
    "zh-CN": "已保存",
    "zh-TW": "已儲存",
    "en": "Saved"
  },
  "unsaved": {
    "zh-CN": "尚未保存",
    "zh-TW": "尚未儲存",
    "en": "Unsaved changes"
  },
  "saveFailed": {
    "zh-CN": "保存失败，请检查设置后重试。",
    "zh-TW": "儲存失敗，請檢查設定後重試。",
    "en": "Could not save. Check your settings and try again."
  },
  "dismissNotice": {
    "zh-CN": "隐藏额度提醒",
    "zh-TW": "隱藏額度提醒",
    "en": "Dismiss quota notice"
  },
  "dismissNoticeHelp": {
    "zh-CN": "隐藏额度提醒，可在设置与外观中重新打开",
    "zh-TW": "隱藏額度提醒，可在設定與外觀中重新開啟",
    "en": "Dismiss this notice; turn it back on in settings"
  },
  "dismissFailed": {
    "zh-CN": "暂时未能隐藏提醒，请重试。",
    "zh-TW": "暫時未能隱藏提醒，請重試。",
    "en": "Could not dismiss the notice. Try again."
  },
  "checkingLogin": {
    "zh-CN": "正在查看登录状态…",
    "zh-TW": "正在確認登入狀態…",
    "en": "Checking sign-in…"
  },
  "waiting": {
    "zh-CN": "等待连接",
    "zh-TW": "等待連線",
    "en": "Connecting…"
  },
  "accountCount": {
    "zh-CN": "个账号",
    "zh-TW": "個帳號",
    "en": "accounts"
  },
  "lowCount": {
    "zh-CN": "项额度低于 20%",
    "zh-TW": "項額度低於 20%",
    "en": "quotas below 20%"
  },
  "searchPlaceholder": {
    "zh-CN": "搜索账号、成员或平台",
    "zh-TW": "搜尋帳號、成員或平台",
    "en": "Search accounts, members or platforms"
  },
  "search": {
    "zh-CN": "搜索",
    "zh-TW": "搜尋",
    "en": "Search"
  },
  "accountsTab": {
    "zh-CN": "账号额度",
    "zh-TW": "帳號額度",
    "en": "Account quotas"
  },
  "usersTab": {
    "zh-CN": "成员余额",
    "zh-TW": "成員餘額",
    "en": "Member balances"
  },
  "channelsTab": {
    "zh-CN": "服务余额",
    "zh-TW": "服務餘額",
    "en": "Service balances"
  },
  "sharingNote": {
    "zh-CN": "多个模型可能共用额度，具体以各平台显示为准。",
    "zh-TW": "多個模型可能共用額度，詳情以各平台顯示為準。",
    "en": "Models may share quota. Refer to each platform for details."
  },
  "backTop": {
    "zh-CN": "回到顶部",
    "zh-TW": "回到頂部",
    "en": "Back to top"
  },
  "refreshEvery": {
    "zh-CN": "每 {minutes} 分钟自动更新",
    "zh-TW": "每 {minutes} 分鐘自動更新",
    "en": "Updates every {minutes} minutes"
  },
  "lastUpdated": {
    "zh-CN": "上次更新 {time}",
    "zh-TW": "上次更新 {time}",
    "en": "Last updated {time}"
  },
  "noDataYet": {
    "zh-CN": "暂时没有数据",
    "zh-TW": "暫時沒有資料",
    "en": "No data yet"
  },
  "noData": {
    "zh-CN": "暂无数据",
    "zh-TW": "暫無資料",
    "en": "No data"
  },
  "partial": {
    "zh-CN": "部分账号暂时查不到额度，请稍后刷新。",
    "zh-TW": "部分帳號暫時查不到額度，請稍後重新整理。",
    "en": "Some account quotas are unavailable. Refresh again later."
  },
  "stale": {
    "zh-CN": "显示的是之前的额度，可点击刷新查看最新结果",
    "zh-TW": "目前顯示先前的額度，請重新整理以查看最新結果",
    "en": "Showing previous quotas. Refresh for the latest results."
  },
  "relayUnavailable": {
    "zh-CN": "这项余额查询暂未开通，请联系管理员。",
    "zh-TW": "此餘額查詢尚未開通，請聯絡管理員。",
    "en": "Balance lookup is not enabled. Contact your administrator."
  },
  "balanceUnavailable": {
    "zh-CN": "暂时查不到余额，请稍后刷新。",
    "zh-TW": "暫時查不到餘額，請稍後重新整理。",
    "en": "Balance is unavailable. Refresh again later."
  },
  "balanceUnknown": {
    "zh-CN": "暂时查不到余额",
    "zh-TW": "暫時查不到餘額",
    "en": "Balance unavailable"
  },
  "disabled": {
    "zh-CN": "已停用",
    "zh-TW": "已停用",
    "en": "Disabled"
  },
  "remaining": {
    "zh-CN": "剩余 {value}%",
    "zh-TW": "剩餘 {value}%",
    "en": "{value}% remaining"
  },
  "resetPending": {
    "zh-CN": "额度恢复时间已到，正在等待平台更新",
    "zh-TW": "額度恢復時間已到，正在等待平台更新",
    "en": "The reset time has passed. Waiting for the platform to update."
  },
  "resetIn": {
    "zh-CN": "{hours} 小时 {minutes} 分后恢复额度 · {time}",
    "zh-TW": "{hours} 小時 {minutes} 分後恢復額度 · {time}",
    "en": "Resets in {hours}h {minutes}m · {time}"
  },
  "creditValue": {
    "zh-CN": "{label}：{value}{status}",
    "zh-TW": "{label}：{value}{status}",
    "en": "{label}: {value}{status}"
  },
  "disabledSuffix": {
    "zh-CN": "（已停用）",
    "zh-TW": "（已停用）",
    "en": " (disabled)"
  },
  "group": {
    "zh-CN": "分组 {name}",
    "zh-TW": "群組 {name}",
    "en": "Group {name}"
  },
  "userBalance": {
    "zh-CN": "剩余 ${remaining} · 已用 ${used}",
    "zh-TW": "剩餘 ${remaining} · 已用 ${used}",
    "en": "${remaining} remaining · ${used} used"
  },
  "noMatches": {
    "zh-CN": "没有找到相关结果",
    "zh-TW": "找不到相關結果",
    "en": "No matching results"
  },
  "signInToView": {
    "zh-CN": "登录后即可查看额度。",
    "zh-TW": "登入後即可查看額度。",
    "en": "Sign in to view quotas."
  },
  "empty": {
    "zh-CN": "暂时没有数据，请稍后刷新。",
    "zh-TW": "暫時沒有資料，請稍後重新整理。",
    "en": "No data yet. Refresh again later."
  },
  "weekly": {
    "zh-CN": "每周",
    "zh-TW": "每週",
    "en": "Weekly"
  },
  "fiveHours": {
    "zh-CN": "5 小时",
    "zh-TW": "5 小時",
    "en": "5 hours"
  },
  "quotaPeriod": {
    "zh-CN": "额度周期",
    "zh-TW": "額度週期",
    "en": "Quota period"
  },
  "balance": {
    "zh-CN": "余额",
    "zh-TW": "餘額",
    "en": "Balance"
  },
  "background": {
    "zh-CN": "保留后台运行",
    "zh-TW": "保留背景執行",
    "en": "Keep running in the background"
  },
  "quit": {
    "zh-CN": "彻底退出",
    "zh-TW": "完全退出",
    "en": "Quit"
  },
  "left": {
    "zh-CN": "贴左边",
    "zh-TW": "靠左側",
    "en": "Dock left"
  },
  "right": {
    "zh-CN": "贴右边",
    "zh-TW": "靠右側",
    "en": "Dock right"
  },
  "orbHint": {
    "zh-CN": "{pet} · 单击打开，悬停预览，拖动贴边，右键调大小",
    "zh-TW": "{pet} · 點擊開啟，停留預覽，拖曳靠邊，右鍵調整大小",
    "en": "{pet} · Click to open, hover to preview, drag to dock, right-click to resize"
  },
  "orbLow": {
    "zh-CN": "{pet} · {count} 项额度剩余 10% 或更少，点击查看",
    "zh-TW": "{pet} · {count} 項額度剩餘 10% 或更少，點擊查看",
    "en": "{pet} · {count} quotas at 10% or less. Click to view."
  },
  "windowTitle": {
    "zh-CN": "Quota Pet · {page}",
    "zh-TW": "Quota Pet · {page}",
    "en": "Quota Pet · {page}"
  },
  "cached": {
    "zh-CN": "已使用本机保存的额度数据。",
    "zh-TW": "已載入本機儲存的額度資料。",
    "en": "Showing quotas saved on this device."
  },
  "sessionExpired": {
    "zh-CN": "登录信息已失效，请重新登录。",
    "zh-TW": "登入資訊已失效，請重新登入。",
    "en": "Your sign-in has expired. Please sign in again."
  },
  "signedOut": {
    "zh-CN": "已退出登录。需要查看额度时，请重新登录账号。",
    "zh-TW": "已登出。需要查看額度時，請重新登入。",
    "en": "You are signed out. Sign in again to view quotas."
  },
  "authRequired": {
    "zh-CN": "请先登录账号。登录后会记住你，下次打开无需重复登录。",
    "zh-TW": "請先登入帳號。登入後會記住你，下次開啟不必重複登入。",
    "en": "Sign in to get started. Your sign-in will be remembered on this device."
  },
  "authSaveFailed": {
    "zh-CN": "额度已更新，但未能记住登录状态，下次打开可能需要重新登录。",
    "zh-TW": "額度已更新，但未能儲存登入狀態，下次開啟可能需要重新登入。",
    "en": "Quotas updated, but your sign-in could not be saved. You may need to sign in next time."
  },
  "refreshFailed": {
    "zh-CN": "更新失败，请稍后重试。已有额度仍显示上次更新的结果。",
    "zh-TW": "更新失敗，請稍後重試。目前仍顯示上次更新的額度。",
    "en": "Update failed. Try again later; previous quotas are still shown."
  },
  "diagnosis.disabled.title": {
    "zh-CN": "账号已停用",
    "zh-TW": "帳號已停用",
    "en": "Account disabled"
  },
  "diagnosis.disabled.action": {
    "zh-CN": "启用账号后再查看额度。",
    "zh-TW": "啟用帳號後再查看額度。",
    "en": "Enable the account to view quotas."
  },
  "diagnosis.auth_expired.title": {
    "zh-CN": "登录已失效",
    "zh-TW": "登入已失效",
    "en": "Sign-in expired"
  },
  "diagnosis.auth_expired.action": {
    "zh-CN": "请重新登录这个账号，或重新导入登录信息。",
    "zh-TW": "請重新登入此帳號，或重新匯入登入資訊。",
    "en": "Sign in again or import this account again."
  },
  "diagnosis.free_exhausted.title": {
    "zh-CN": "免费额度已用完",
    "zh-TW": "免費額度已用完",
    "en": "Free quota used up"
  },
  "diagnosis.free_exhausted.action": {
    "zh-CN": "等待额度恢复，或切换其他可用账号。",
    "zh-TW": "等待額度恢復，或切換其他可用帳號。",
    "en": "Wait for the quota reset or switch accounts."
  },
  "diagnosis.quota_exhausted.title": {
    "zh-CN": "当前额度已用完",
    "zh-TW": "目前額度已用完",
    "en": "Quota used up"
  },
  "diagnosis.quota_exhausted.action": {
    "zh-CN": "等待额度恢复，或切换其他可用账号。",
    "zh-TW": "等待額度恢復，或切換其他可用帳號。",
    "en": "Wait for the quota reset or switch accounts."
  },
  "diagnosis.rate_limited.title": {
    "zh-CN": "查询过于频繁",
    "zh-TW": "查詢過於頻繁",
    "en": "Too many requests"
  },
  "diagnosis.rate_limited.action": {
    "zh-CN": "稍等一会儿再刷新。",
    "zh-TW": "稍等片刻再重新整理。",
    "en": "Wait a moment before refreshing."
  },
  "diagnosis.access_denied.title": {
    "zh-CN": "平台拒绝了额度查询",
    "zh-TW": "平台拒絕了額度查詢",
    "en": "Quota lookup denied"
  },
  "diagnosis.access_denied.action": {
    "zh-CN": "可能是账号权限或访问限制，需要进一步检查；不代表额度为零。",
    "zh-TW": "可能是帳號權限或存取限制，需要進一步檢查；不代表額度為零。",
    "en": "Check account permissions and access limits. This does not mean the quota is zero."
  },
  "diagnosis.network.title": {
    "zh-CN": "暂时连接不上平台",
    "zh-TW": "暫時連不上平台",
    "en": "Platform unavailable"
  },
  "diagnosis.network.action": {
    "zh-CN": "稍后重试，不影响已保存的账号。",
    "zh-TW": "稍後重試，不影響已儲存的帳號。",
    "en": "Try again later. Saved accounts are unaffected."
  },
  "diagnosis.configuration.title": {
    "zh-CN": "账号信息不完整",
    "zh-TW": "帳號資訊不完整",
    "en": "Incomplete account information"
  },
  "diagnosis.configuration.action": {
    "zh-CN": "请重新导入账号，或联系管理员检查。",
    "zh-TW": "請重新匯入帳號，或聯絡管理員檢查。",
    "en": "Import the account again or contact your administrator."
  },
  "diagnosis.unknown.title": {
    "zh-CN": "暂时未查明原因",
    "zh-TW": "暫時未查明原因",
    "en": "Cause unknown"
  },
  "diagnosis.unknown.action": {
    "zh-CN": "平台没有提供明确原因，请重新检查账号状态。",
    "zh-TW": "平台未提供明確原因，請重新檢查帳號狀態。",
    "en": "The platform gave no clear reason. Check the account status."
  },
  "diagnosis.unavailable.title": {
    "zh-CN": "平台暂未提供额度详情",
    "zh-TW": "平台尚未提供額度詳情",
    "en": "Quota details unavailable"
  },
  "diagnosis.unavailable.action": {
    "zh-CN": "暂无数据不代表额度已用完。",
    "zh-TW": "暫無資料不代表額度已用完。",
    "en": "Missing data does not mean the quota is used up."
  },
  "appPin": {
    "zh-CN": "让本 App 窗口始终显示在最前面",
    "zh-TW": "讓本 App 視窗保持在最前面",
    "en": "Keep this app always on top"
  },
  "appPinHelp": {
    "zh-CN": "开关立即生效，也可点击右上角图钉；蓝色表示已置顶，再点取消。",
    "zh-TW": "開關立即生效，也可點擊右上角圖釘；藍色表示已置頂，再點取消。",
    "en": "Applies immediately. You can also use the top-right pin: blue means pinned; click again to unpin."
  },
  "restore": {
    "zh-CN": "还原窗口",
    "zh-TW": "還原視窗",
    "en": "Restore window"
  },
  "browserOpenFailed": {
    "zh-CN": "未能打开默认浏览器，请检查系统默认浏览器设置后重试。",
    "zh-TW": "未能開啟預設瀏覽器，請檢查系統預設瀏覽器設定後重試。",
    "en": "Could not open your default browser. Check the system default browser setting and try again."
  },
  "pinWindow": {
    "zh-CN": "置顶窗口",
    "zh-TW": "置頂視窗",
    "en": "Pin window on top"
  },
  "unpinWindow": {
    "zh-CN": "取消置顶",
    "zh-TW": "取消置頂",
    "en": "Unpin window"
  },
  "pinFailed": {
    "zh-CN": "窗口置顶未生效，请重试。",
    "zh-TW": "視窗置頂未生效，請重試。",
    "en": "Window pinning did not take effect. Please try again."
  }
};
const locales=Object.freeze(['zh-CN','zh-TW','en']);
function locale(value){return locales.includes(value)?value:'zh-CN';}
function t(key,params={},lang='zh-CN'){
 const current=locale(lang),entry=messages[key];if(!entry)throw Error('Unknown message key: '+key);
 const values={pet:messages.pet[current],...params};
 return entry[current].replace(/\{(\w+)\}/g,(_,name)=>{if(!(name in values))throw Error('Missing message parameter: '+name);return String(values[name]);});
}
function apply(root,lang){
 for(const element of root.querySelectorAll('[data-i18n]'))element.textContent=t(element.dataset.i18n,{},lang);
 for(const attr of ['title','aria-label','placeholder','alt'])for(const element of root.querySelectorAll('[data-i18n-'+attr+']'))element.setAttribute(attr,t(element.getAttribute('data-i18n-'+attr),{},lang));
}
const knownKeys={};
for(const [key,entry] of Object.entries(messages))if(!entry['zh-CN'].includes('{'))knownKeys[entry['zh-CN']]=key;
Object.assign(knownKeys,{'上游未返回':'noData','未返回':'noData','上游尚未提供':'noData','额度窗口':'quotaPeriod','（已停用）':'disabledSuffix'});
function known(value,lang){const text=String(value);return knownKeys[text]?t(knownKeys[text],{},lang):text;}
return Object.freeze({messages,locales,locale,t,apply,known});
});
