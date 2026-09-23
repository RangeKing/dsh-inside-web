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
 ['接到输入','Receive input','用户：请读取采购单，告诉我还缺什么。','User: read the shopping list and tell me what is missing.'],
 ['准备上下文','Prepare context','读取会话记录，准备模型本轮能看到的消息。','Project the session record into messages for this model step.'],
 ['请求模型','Request the model','模型收到任务和上下文，返回一个工具调用。','The model receives the task and context, then returns a tool call.'],
 ['调用工具','Call a tool','先做策略检查；需要审批时先确认，再读取采购单。','Policy checks come first, including approval when required, before reading the list.'],
 ['结果回来','Return the result','工具结果写回会话，再交给执行循环。','The tool result is recorded and returned to the loop.'],
 ['再问一轮','Request again','携带新结果，再次请求模型。任务可以有多个 Step。','Request the model again with the new result. A turn may have several steps.'],
 ['输出答案','Deliver the answer','模型给出最终回复；这次任务才算完成。','The model gives its final answer, completing this turn.'],
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
