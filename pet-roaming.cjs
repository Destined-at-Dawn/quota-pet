'use strict';
function createRoaming(random=Math.random){
 let anchor=null,pos=null,target=null,rest=0,heading=0;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 return {
  anchor(point){anchor={...point};pos={...point};target=null;rest=0;},
  tick(dt,{area,size,radius,speed,enabled,paused}){
   if(!anchor)this.anchor({x:area.x+area.width-size,y:area.y+area.height-size});
   const maxX=Math.max(area.x,area.x+area.width-size),maxY=Math.max(area.y,area.y+area.height-size);
   pos={x:clamp(pos.x,area.x,maxX),y:clamp(pos.y,area.y,maxY)};
   if(!enabled||paused){target=null;return {...pos,heading,walking:false};}
   const bounds={left:clamp(anchor.x-radius,area.x,maxX),right:clamp(anchor.x+radius,area.x,maxX),top:clamp(anchor.y-radius,area.y,maxY),bottom:clamp(anchor.y+radius,area.y,maxY)};
   pos.x=clamp(pos.x,bounds.left,bounds.right);pos.y=clamp(pos.y,bounds.top,bounds.bottom);
   if(radius===0){target=null;return {...pos,heading,walking:false};}
   dt=clamp(dt,0,.1);rest-=dt;
   if(rest>0)return {...pos,heading,walking:false};
   if(!target)target={x:bounds.left+random()*(bounds.right-bounds.left),y:bounds.top+random()*(bounds.bottom-bounds.top)};
   target.x=clamp(target.x,bounds.left,bounds.right);target.y=clamp(target.y,bounds.top,bounds.bottom);
   const dx=target.x-pos.x,dy=target.y-pos.y,d=Math.hypot(dx,dy),step=speed*dt;
   if(d<Math.max(2,step)){target=null;rest=1.5+random()*4;return {...pos,heading,walking:false};}
   pos.x+=dx/d*step;pos.y+=dy/d*step;heading=Math.atan2(dy,dx);
   return {...pos,heading,walking:true};
  }
 };
}
module.exports={createRoaming};
