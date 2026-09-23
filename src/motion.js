// Exponential damping is frame-rate independent; large wheel deltas settle without snapping.
export class ScrollMotion {
 constructor(value=0){this.value=value;this.target=value;this.time=null;}
 set(value,snap=false){this.target=value;if(snap){this.value=value;this.time=null;}}
 advance(time,reduced=false){const dt=this.time===null?1/60:Math.min(.05,Math.max(0,(time-this.time)/1000));this.time=time;
   if(reduced)this.value=this.target;else this.value+=(this.target-this.value)*(1-Math.exp(-dt/.095));
   if(Math.abs(this.target-this.value)<.00004)this.value=this.target;
   return this.value;
 }
 get moving(){return this.value!==this.target;}
}
