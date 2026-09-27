(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PetInteraction=factory();})(globalThis,()=>{
 'use strict';
 function createInteraction(){let press=null,held=false,patUntil=0,landUntil=0,variant=-1,sway=0;
  return {
   down(x,y,at){press={x,y,lastX:x,lastAt:at};held=false;patUntil=0;landUntil=0;},
   move(x,y,at){if(!press)return false;if(Math.hypot(x-press.x,y-press.y)>5)held=true;if(held){sway=Math.max(-8,Math.min(8,(x-press.lastX)/Math.max(16,at-press.lastAt)*8));press.lastX=x;press.lastAt=at;}return held;},
   up(at,cancel=false){if(!press)return 'none';press=null;const wasHeld=held;held=false;if(wasHeld){landUntil=at+420;return 'release';}if(!cancel){variant=(variant+1)%3;patUntil=at+1300;return 'pat';}return 'none';},
   pat(at){variant=(variant+1)%3;patUntil=at+1300;},
   clear(){press=null;held=false;patUntil=0;landUntil=0;},
   view(at){return {phase:held?'held':at<landUntil?'landing':at<patUntil?'pat':'idle',variant,sway,landing:Math.max(0,(landUntil-at)/420)};}
  };
 }
 return {createInteraction};
});
