/** Deadline-based clock: pause preserves the remaining duration; reset stops it. */
export class Timer {
  constructor(duration=25*60*1000){this.duration=duration;this.remaining=duration;this.deadline=null;}
  read(now){if(this.deadline!==null){this.remaining=Math.max(0,this.deadline-now);if(!this.remaining)this.deadline=null;}return this.remaining;}
  start(now){if(this.deadline===null&&this.remaining>0)this.deadline=now+this.remaining;}
  pause(now){this.read(now);this.deadline=null;}
  reset(){this.remaining=this.duration;this.deadline=null;}
}
