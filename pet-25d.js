'use strict';
// Original Tuantuan artwork. One controller owns pose, expression and event timing.
(()=>{
 const orb=document.getElementById('orb'),art=document.getElementById('pet-art'),q=id=>document.getElementById(id);
 const tail=q('pet-tail'),head=q('pet-head'),ears=q('pet-ears'),body=q('pet-body'),left=q('foot-left'),right=q('foot-right'),eyes=q('eyes-normal'),collar=q('pet-collar'),scruff=q('pet-scruff'),happy=q('eyes-happy'),patMark=q('pet-pat-mark');
 const router=PetContract.createEventRouter(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let prefs={},motion={},pack=null,elapsed=0,last=performance.now(),carry=0,blinkAt=3.2,blinkLeft=0,tailTarget=5,tailAmp=5,tailNext=2,danceAt=24,danceUntil=0,receipt='';
 let latestData=null;art.dataset.renderer='layered-2.5d';
 function report(){const key=(pack?.id||'tuantuan-original')+reduced.matches;if(receipt===key)return;receipt=key;window.pet.renderReady({renderer:'layered-2.5d',petId:pack?.id||'tuantuan-original',canvasCount:document.querySelectorAll('canvas').length,reducedMotion:reduced.matches});}
 function snapshot(d){if(!d)return;latestData=d;prefs=d.preferences||{};motion=d.petMotion||motion;pack=d.petPack||{id:'tuantuan-original',motionProfile:'gentle'};
  const p=d.petState||{},event=p.event,kind=event?.type==='love'?(event.cause==='recharge'?'recharge':'credit-increase'):event?.type==='orbit'?'quota-reset':null;
  router.observe({at:Number.isFinite(d.updatedAt)?d.updatedAt:0,quotaConfirmed:p.state==='idle'||p.state==='exhausted',allExhausted:p.state==='exhausted',eventId:event?.id,eventType:kind,eventUntil:event?.until,clearEvent:!event},Date.now());
  art.dataset.petId=pack.id;report();
 }
 window.pet.onSnapshot(snapshot);window.pet.snapshot().then(snapshot);window.pet.onPetMotion(d=>motion=d);reduced.addEventListener('change',report);
 const reset=()=>{for(const node of [tail,head,ears,body,left,right,eyes,collar,scruff])node.removeAttribute('transform');};
 function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.1);last=now;if(document.hidden)return;carry+=dt;if(carry<1/30)return;const step=carry;carry=0;
  const animated=prefs.petAnimation!==false&&!reduced.matches&&pack?.motionProfile!=='still';
  const state=router.view({now:Date.now(),animation:animated,reducedMotion:reduced.matches,dragging:!!motion.dragging,moving:prefs.petMovement===true&&!!motion.walking,heading:motion.heading});
  const interaction=window.petInteraction?.view(now)||{phase:'idle'},held=interaction.phase==='held',pat=interaction.phase==='pat',landing=interaction.phase==='landing';
  const tired=state.appearance==='exhausted',walk= !held&&!pat&&!landing&&animated&&/^running-/.test(state.motion);
  let action=state.appearance==='exhausted'?'exhausted':state.appearance==='love'?'love':state.motion==='orbit'?'orbit':'idle';
  if(animated&&state.motion==='idle'){danceAt-=step;if(danceAt<=0){danceUntil=elapsed+2;danceAt=24+Math.random()*20;}if(elapsed<danceUntil)action='dance';}
  orb.dataset.interaction=interaction.phase;art.dataset.interaction=interaction.phase;
  scruff.style.display=held?'block':'none';happy.style.display=pat&&!tired&&state.appearance!=='love'?'block':'none';patMark.style.display=pat?'block':'none';
  orb.dataset.motion=animated?'on':'off';orb.dataset.petState=action;art.dataset.action=state.motion;
  art.dataset.walking=String(!!walk);art.dataset.tail=String(animated&&prefs.petTailMotion!==false&&!tired);art.dataset.motion=animated?'on':'off';
  const image=orb.querySelector('img'),src=state.appearance==='love'?'cat-love.svg':tired?'cat-exhausted.svg':'cat.svg';if(image.getAttribute('src')!==src)image.src=src;
  if(!animated){reset();return;}elapsed+=step;
  const breath=Math.sin(elapsed*2.1),stride=Math.sin(elapsed*(5+(prefs.petMoveSpeed||35)/22));
  head.setAttribute('transform',`translate(${Math.sin(elapsed*.8)*.3} ${breath*.45}) rotate(${walk?stride*.8:Math.sin(elapsed*.9)*.45} 64 92)`);
  body.setAttribute('transform',`translate(0 ${breath*.35})`);ears.setAttribute('transform',`rotate(${Math.sin(elapsed*1.15)*.5} 64 44)`);
  left.setAttribute('transform',`translate(0 ${walk?-Math.max(0,stride)*2:0})`);right.setAttribute('transform',`translate(0 ${walk?-Math.max(0,-stride)*2:0})`);
  tailNext-=step;if(tailNext<=0){tailNext=2+Math.random()*4;tailTarget=3+Math.random()*5;}tailAmp+=(tailTarget-tailAmp)*step;
  tail.setAttribute('transform',`rotate(${prefs.petTailMotion!==false&&!tired?Math.sin(elapsed*1.5)*tailAmp:0} 88 99)`);
  blinkAt-=step;if(blinkAt<=0){blinkAt=3+Math.random()*4;blinkLeft=.16;}blinkLeft=Math.max(0,blinkLeft-step);
  const scale=blinkLeft>0?Math.max(.12,Math.abs(blinkLeft-.08)/.08):1;eyes.setAttribute('transform',`translate(0 63) scale(1 ${scale}) translate(0 -63)`);
  collar.removeAttribute('transform');
  // The head stays near the grip while the relaxed torso and paws hang below it.
  if(held){
   const sway=interaction.sway*.55+Math.sin(elapsed*3.2)*1.5;
   head.setAttribute('transform','translate(0 -4)');ears.setAttribute('transform','translate(0 2)');
   body.setAttribute('transform',`rotate(${sway} 64 40) translate(0 2) translate(64 90) scale(.9 1.06) translate(-64 -90)`);
   collar.setAttribute('transform',`rotate(${sway*.4} 64 40) translate(0 1)`);
   left.setAttribute('transform',`translate(7 2) rotate(-32 47 115) scale(1 .98)`);
   right.setAttribute('transform',`translate(-7 2) rotate(32 80 115) scale(1 .98)`);
   tail.setAttribute('transform',`rotate(${18+sway} 88 99) translate(-1 2)`);
   eyes.setAttribute('transform','translate(0 62) scale(1 .76) translate(0 -62)');
  }else if(landing){
   const bounce=Math.sin((1-interaction.landing)*Math.PI);
   head.setAttribute('transform',`translate(0 ${bounce*2.8})`);
   body.setAttribute('transform',`translate(64 118) scale(${1+bounce*.035} ${1-bounce*.06}) translate(-64 -118)`);
  }else if(pat){
   const wave=Math.sin(elapsed*8),tilt=interaction.variant===0?-6:interaction.variant===1?5:wave*2;
   head.setAttribute('transform',`rotate(${tilt} 64 90) translate(0 ${-Math.abs(wave)*.7})`);
   if(interaction.variant===1)right.setAttribute('transform',`translate(-2 -8) rotate(${-24+wave*8} 80 115)`);
   if(interaction.variant===2){body.setAttribute('transform',`translate(0 ${-Math.abs(wave)*1.5})`);ears.setAttribute('transform','translate(0 -1.5)');}
  }
  art.dataset.frame=String((Number(art.dataset.frame)||0)+1);
 }
 requestAnimationFrame(frame);
})();
