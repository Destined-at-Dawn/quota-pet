let drag=false,moved=false,start;const orb=document.querySelector('#orb');
const interaction=PetInteraction.createInteraction();window.petInteraction=interaction;
orb.addEventListener('mouseenter',()=>{window.pet.action('pet-hover-start');if(!drag)window.pet.action('expand');});
orb.addEventListener('mouseleave',()=>{window.pet.action('pet-hover-end');window.pet.action('leave');});
orb.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag=true;moved=false;start={x:e.screenX,y:e.screenY};interaction.down(e.screenX,e.screenY,performance.now());orb.setPointerCapture(e.pointerId);});
orb.addEventListener('pointermove',e=>{if(!drag)return;const active=interaction.move(e.screenX,e.screenY,performance.now());if(active){if(!moved)window.pet.action('pet-drag-start');moved=true;window.pet.move({x:e.screenX,y:e.screenY,grip:true});}});
function release(e,cancel=false){if(!drag)return;drag=false;interaction.up(performance.now(),cancel);if(moved)window.pet.action('pet-drag-end');if(orb.hasPointerCapture(e.pointerId))orb.releasePointerCapture(e.pointerId);moved=false;}
orb.addEventListener('pointerup',e=>{if(e.button===0)release(e);});orb.addEventListener('pointercancel',e=>release(e,true));orb.addEventListener('lostpointercapture',e=>release(e,true));
orb.addEventListener('dblclick',()=>{interaction.clear();window.pet.action('dashboard');});
orb.addEventListener('click',e=>{if(e.detail===0)interaction.pat(performance.now());});
orb.addEventListener('contextmenu',e=>{e.preventDefault();interaction.clear();window.pet.action('menu');});

let seenAlerts=new Set();
orb.addEventListener('animationend',event=>{if(event.target===orb&&event.animationName==='quota-reminder')orb.classList.remove('low-quota');});
function updateReminder(data){const alerts=data?.lowQuota||[];const current=new Set(alerts.map(a=>JSON.stringify([a.account,a.provider,a.period])));const fresh=[...current].some(key=>!seenAlerts.has(key));seenAlerts=current;if(!alerts.length)orb.classList.remove('low-quota');else if(fresh){orb.classList.remove('low-quota');void orb.offsetWidth;orb.classList.add('low-quota');}const lang=PetI18n.locale(data?.preferences?.language);document.documentElement.lang=lang;PetI18n.apply(document,lang);orb.title=PetI18n.t(alerts.length?'orbLow':'orbHint',{count:alerts.length},lang);orb.setAttribute('aria-label',orb.title);orb.querySelector('img').alt=PetI18n.t('pet',{},lang);}window.pet.onSnapshot(updateReminder);window.pet.snapshot().then(updateReminder);

