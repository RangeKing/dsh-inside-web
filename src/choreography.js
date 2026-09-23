// Pure, seek-safe scene poses: the same scroll position always produces the same scene.
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
// m: mobile camera distance factor; lesson shots also fit the viewport aspect.
const shots=[
 {camera:[40,12.4,24.8],screen:[0,.03],yaw:-.20,open:0,m:1.95},
 {camera:[0,14,27],screen:[0,-.01],yaw:0,open:1,m:2.35,lesson:true},
 {camera:[0,16,29],screen:[0,-.01],yaw:0,open:1,m:1.95,lesson:true},
 {camera:[27,18,23],screen:[-.235,0],yaw:.32,open:1,m:1.55},
 {camera:[0,17,30],screen:[0,-.01],yaw:0,open:1,m:1.95,lesson:true},
 {camera:[26,32,33],screen:[0,0],yaw:-.08,open:1,m:1.55},
 {camera:[32,21,34],screen:[.18,0],yaw:-.32,open:1,m:1.55},
 {camera:[38,13.8,26.5],screen:[0,-.02],yaw:-.1,open:0,m:1.95},
];
export const lastChapter=shots.length-1;
// side: short, wide viewports move lesson panels beside the model instead of under it.
export function scenePose(chapter,progress,{reduced=false,mobile=false,aspect=.5,side=false}={}){
 const index=Math.max(0,Math.min(lastChapter,Math.floor(chapter)||0)),a=shots[index],b=shots[Math.min(lastChapter,index+1)];
 const blend=reduced?0:ease((clamp(progress)-.66)/.34),lerp=(a,b)=>a+(b-a)*blend;
 const scale=shot=>!mobile?1:shot.m*(shot.lesson?Math.max(.55,Math.min(1,1/aspect/2.05)):1);
 const camera=a.camera.map((v,i)=>lerp(v*scale(a),b.camera[i]*scale(b)));
 const shift=shot=>side&&shot.lesson?[-.2,shot.screen[1]]:shot.screen,screen=shift(a).map((v,i)=>lerp(v,shift(b)[i]));
 if(mobile){screen[0]=0;screen[1]=-.055;}
 return {camera,screen,yaw:lerp(a.yaw,b.yaw),open:lerp(a.open,b.open),blend,index};
}
