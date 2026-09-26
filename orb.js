let drag=false,moved=false,start;const orb=document.querySelector('#orb');
orb.addEventListener('mouseenter',()=>{if(!drag)window.pet.action('expand');});orb.addEventListener('mouseleave',()=>window.pet.action('leave'));
orb.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag=true;moved=false;start={x:e.screenX,y:e.screenY};orb.setPointerCapture(e.pointerId);});
orb.addEventListener('pointermove',e=>{if(drag&&(Math.abs(e.screenX-start.x)+Math.abs(e.screenY-start.y)>5)){moved=true;window.pet.move({x:e.screenX,y:e.screenY});}});
orb.addEventListener('pointerup',e=>{if(e.button!==0||!drag)return;drag=false;if(!moved)window.pet.action('dashboard');});
orb.addEventListener('pointercancel',()=>{drag=false;moved=false;});orb.addEventListener('contextmenu',e=>{e.preventDefault();window.pet.action('menu');});

let seenAlerts=new Set();
orb.addEventListener('animationend',()=>orb.classList.remove('low-quota'));
function updateReminder(data){const alerts=data?.lowQuota||[];const current=new Set(alerts.map(a=>JSON.stringify([a.account,a.provider,a.period])));const fresh=[...current].some(key=>!seenAlerts.has(key));seenAlerts=current;if(!alerts.length)orb.classList.remove('low-quota');else if(fresh){orb.classList.remove('low-quota');void orb.offsetWidth;orb.classList.add('low-quota');}const lang=PetI18n.locale(data?.preferences?.language);document.documentElement.lang=lang;orb.title=PetI18n.t(alerts.length?'orbLow':'orbHint',{count:alerts.length},lang);orb.setAttribute('aria-label',orb.title);orb.querySelector('img').alt=PetI18n.t('pet',{},lang);}window.pet.onSnapshot(updateReminder);window.pet.snapshot().then(updateReminder);
