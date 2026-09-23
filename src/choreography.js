// Pure, seek-safe scene poses: the same scroll position always produces the same scene.
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const shots=[
 {camera:[33,10.3,20.5],screen:[0,-.005],yaw:-.20,open:0},
 {camera:[0,14,27],screen:[0,-.01],yaw:0,open:1},
 {camera:[0,16,29],screen:[0,-.01],yaw:0,open:1},
 {camera:[27,18,23],screen:[-.235,0],yaw:.32,open:1},
 {camera:[26,32,33],screen:[0,0],yaw:-.08,open:1},
 {camera:[32,21,34],screen:[.18,0],yaw:-.32,open:1},
 {camera:[38,13.8,26.5],screen:[0,-.02],yaw:-.1,open:0},
];
export function scenePose(chapter,progress,{reduced=false,mobile=false,aspect=.5}={}){
 const index=Math.max(0,Math.min(6,Math.floor(chapter)||0)),a=shots[index],b=shots[Math.min(6,index+1)];
 const blend=reduced?0:ease((clamp(progress)-.66)/.34),lerp=(a,b)=>a+(b-a)*blend;
 const scale=i=>{if(!mobile)return 1;const base=i===0||i===6?1.95:i===1?2.35:i===2?1.95:1.55;return base*((i===1||i===2)?Math.max(.55,Math.min(1,1/aspect/2.05)):1);};
 const camera=a.camera.map((v,i)=>lerp(v*scale(index),b.camera[i]*scale(Math.min(6,index+1))));
 const screen=a.screen.map((v,i)=>lerp(v,b.screen[i]));
 if(mobile){screen[0]=0;screen[1]=-.055;}
 return {camera,screen,yaw:lerp(a.yaw,b.yaw),open:lerp(a.open,b.open),blend,index};
}
