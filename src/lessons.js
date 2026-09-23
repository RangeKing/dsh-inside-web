export const providers=[
 {id:'llm-deepseek',name:['DeepSeek 适配插件','DeepSeek adapter'],asset:'llm_core'},
 {id:'llm-pi-ai',name:['Pi-AI 适配插件','Pi-AI adapter'],asset:'llm_core'},
 {id:'llm-replay',name:['录制回放插件','Recorded replay'],asset:'llm_core'},
];
export const pluginSteps=[
 ['都是插件','All are plugins','执行循环、模型适配、会话记录共同组成 Harness。','The loop, model adapter and session log all compose the harness.'],
 ['认准接口','Keep the contract','使用方只认 ctx.llm；提供方负责实现它。','The consumer calls ctx.llm. A provider implements its contract.'],
 ['旧插件退场','Disconnect','先解除旧提供方。接口和使用方留在原位。','The old provider detaches. The consumer and contract stay in place.'],
 ['新插件接入','Connect','另一提供方接到同一个 ctx.llm 接口。','Another provider connects to the same ctx.llm contract.'],
 ['配置生效','Activate','依赖、配置和运行环境满足后，绑定才可使用。','The binding becomes usable when its dependencies and configuration are ready.'],
 ['继续调用','Call again','请求走相同接口；实现它的插件已经换了。','Requests use the same contract through the replacement provider.'],
];
export const loopSteps=[
 ['接到输入','Receive input','你：帮我看看采购单还缺什么，顺便把缺的补进去。','You: check what’s missing from my shopping list, and add it.'],
 ['准备上下文','Prepare context','读取会话记录，准备模型本轮能看到的消息。','Project the session record into messages for this model step.'],
 ['请求模型','Request the model','模型还没看过文件，回复里不是答案，而是一个 read 调用。','The model has not seen the files, so it replies with a read call instead of an answer.'],
 ['调用工具','Call a tool','工具先过策略检查，再读出采购单和周末菜单。','The call passes policy checks, then reads the shopping list and the weekend menu.'],
 ['结果回来','Return the result','文件内容写进会话记录，交回执行循环。','The file contents are recorded in the session log and handed back to the loop.'],
 ['再问一轮','Request again','模型带着文件内容再看一遍：缺番茄和鸡蛋，于是发起 edit。一次任务可以有多个 Step。','With the files in view, the model finds tomatoes and eggs missing and calls edit. One turn can hold several steps.'],
 ['输出答案','Deliver the answer','edit 那一轮往返和前面相同，这里略过。结果回来后，模型回复：已补上番茄和鸡蛋。','The edit round trip works like the read one and is skipped here. Then the model replies: tomatoes and eggs added.'],
];
export const lessonFor=chapter=>chapter===1?pluginSteps:chapter===2?loopSteps:null;
export const stepDuration=2.2;
export function lessonFrame(chapter,position){const steps=lessonFor(chapter);if(!steps)return null;const p=Math.max(0,Math.min(steps.length-.0001,position));return {step:Math.floor(p),t:p%1,steps};}
export class LessonPlayer {
 constructor(chapter){this.chapter=chapter;this.position=0;this.playing=true;this.time=null;}
 advance(time,reduced=false){const dt=this.time===null?0:Math.max(0,Math.min(.05,(time-this.time)/1000));this.time=time;
 if(this.playing&&!reduced){this.position+=dt/stepDuration;const end=lessonFor(this.chapter).length-.001;if(this.position>=end){this.position=end;this.playing=false;}}
 return this.position;
 }
 seek(step){this.position=Math.max(0,Math.min(lessonFor(this.chapter).length-.001,Math.floor(step)+.999));this.playing=false;this.time=null;}
 toggle(){if(this.position>=lessonFor(this.chapter).length-.01)this.position=0;this.playing=!this.playing;this.time=null;}
}
