import { WhaleWorld } from './world.js';
import { ModelAnnotations } from './annotations.js';
import { lessonFor, providers, LessonPlayer } from './lessons.js';
import { moduleDefinitions } from './assets.js';

const chapters=[
 {slug:'hello',tag:'01 / MEET THE BIG WHALE',title:['大肥鲸。\n大有可为。','Big Whale.\nBig possibilities.'],body:['模型会回答问题。Harness 把工具、记忆和执行接起来，让回答变成一件做完的事。跟着大肥鲸下潜，看看 DSH 怎么开工。','A model can answer. A harness connects tools, context and execution to get a task done. Dive in and see how DSH works.'],aside:['不是海洋生物课。是 AI 的开箱现场。','Not marine biology. More of an AI unboxing.'],modules:[]},
 {slug:'plugins',tag:'02 / EVERYTHING IS A PLUGIN',title:['天生一体。\n搭档，可以换。','One whole.\nA world of possibilities.'],body:['模型接口、工具、会话记录，连执行循环本身都是插件。Cordis 把它们组合起来：需要什么装什么，接口一致就能换搭档。','The model adapter, tools, session log—even the agent loop—are plugins. Cordis composes them. Keep the contract and you can change the provider.'],aside:['看起来是一整只，里面是模块化装修。','One whale outside. Modular furniture inside.'],modules:['agent_loop','llm_core','session_spine','tool_registry','capability_seam']},
 {slug:'loop',tag:'03 / ONE MORE STEP',title:['从一句话，\n到一件做完的事。','From a request.\nTo a result.'],body:['DSH 接收输入、准备上下文，再向模型发起请求。模型可以调用工具；执行结果返回后，再继续下一步。一次任务可能需要多轮这样的往返。','DSH accepts input, prepares context, and requests the model. Tools execute its calls; their results can lead to another model step. A turn can include several steps.'],aside:['“马上好”不是状态。“工具已完成”才是。','“Almost done” is not a tool result.'],modules:['agent_loop','llm_core','tool_registry','session_spine']},
 {slug:'tools',tag:'04 / TOOLS, WITH BOUNDARIES',title:['放开手脚。\n也守住边界。','Power to act.\nSense to ask.'],body:['使用方通过接口找提供方办事。工具调用经过前置策略、守卫、执行与结果处理；如果策略要求确认，拒绝会阻止工具本体运行。','Consumers use a contract to reach a provider. Calls pass through policy, guards, execution and result handling. When approval is required, refusal skips the tool body.'],aside:['机械臂很能干，但不会因为你眨眼就删文件。','A capable robot arm still has to pass the gate.'],modules:['capability_seam','tool_registry','approval_airlock']},
 {slug:'memory',tag:'05 / PACK THE IMPORTANT BITS',title:['装得下经历。\n留得住重点。','More experience.\nLess baggage.'],body:['会话记录留下发生过的事；模型历史从记录中投影出来。上下文压力过高时，可先裁剪工具输出，再压缩较早的历史。摘要可能漏线索，所以证据要能回查。','The session log records what happened; model history is projected from it. Under pressure, large tool outputs may be pruned before older history is summarized. Keep source anchors: summaries can miss clues.'],aside:['行李箱可以关上，重要证据不能夹在外面。','Pack lighter. Do not leave the evidence behind.'],modules:['session_spine','compaction_chamber']},
 {slug:'crew',tag:'06 / THE CREW & THE WORKSHOP',title:['一个好搭档。\n也可以是一群。','A great partner.\nOr a whole crew.'],body:['子 Agent 处理有边界的子任务，后台作业继续做耗时的事。预设决定会话的能力组合；Creator 还能检查接口、通过 Plugin Manager 安装插件。装好之后，仍要确认真的生效。','Subagents handle bounded tasks; background jobs handle longer work. Presets compose session capabilities. Creator can inspect APIs and install plugins through Plugin Manager. Installation and activation are separate checks.'],aside:['办公室也能开进来。咖啡机另算。','You can even install an office. Coffee is extra.'],modules:['subagent_orca','cordis_workshop']},
 {slug:'cases',tag:'07 / LET’S DO SOMETHING',title:['看懂里面。\n去做点不一样的。','Now you know.\nMake something happen.'],body:['从聚餐分账、照片审批，到把 DSH 变成一家像素风 AI 公司。八个案例，把每一步、每个工具和最后的结果放在一起讲清楚。','From splitting dinner bills and photo approvals to turning DSH into a pixel-art AI company: eight stories connect each step, tool, and outcome.'],aside:['教学演示，不会偷偷让你的电脑加班。','Teaching simulations. Your computer is off the clock.'],modules:['agent_loop','tool_registry','subagent_orca','cordis_workshop']}
];

export class HomeExperience {
 constructor(){
   this.root=document.createElement('main');this.root.id='ocean-home';this.root.dataset.raw='';this.root.hidden=true;
   document.querySelector('#case-library').before(this.root);
   this.chapter=0;this.scrollPosition=0;this.active=false;this.exploring=false;this.abort=new AbortController();
   const signal=this.abort.signal;
   this.root.addEventListener('click',e=>{
     const chapter=e.target.closest('[data-chapter]');if(chapter)this.go(Number(chapter.dataset.chapter));
     const mod=e.target.closest('[data-module]');if(mod)this.inspect(mod.dataset.module,mod.dataset.annotationKey);
     const action=e.target.closest('[data-lesson-action]');if(action){this.lessonAction(action.dataset.lessonAction,Number(action.dataset.step));return;}const provider=e.target.closest('[data-provider-choice]');if(provider){this.world?.lessonAction(null,null,Number(provider.dataset.providerChoice));this.root.querySelectorAll('[data-provider-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b===provider)));return;}if(e.target.closest('[data-reduce]')){this.reducedMotion=!this.reduced();this.updateScroll();const b=this.root.querySelector('[data-reduce]');b.setAttribute('aria-pressed',String(this.reduced()));b.textContent=this.text(this.reduced()?['恢复动态','Motion on']:['减少动态','Less motion']);return;}if(e.target.closest('[data-explore]'))this.explore(!this.exploring);
   },{signal});
   window.addEventListener('scroll',()=>{if(!this.active||this.scrollFrame)return;this.scrollFrame=requestAnimationFrame(()=>{this.scrollFrame=null;this.updateScroll();});},{passive:true,signal});
   window.addEventListener('resize',()=>{this.measure();this.updateScroll();},{signal});
   window.addEventListener('dsh-preferences',()=>{if(this.active){const y=scrollY;this.render();window.scrollTo({top:y,behavior:'instant'});this.mountWorld();this.updateScroll();}},{signal});
   matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>this.updateScroll(),{signal});
   document.addEventListener('keydown',e=>{if(this.active&&e.key==='Escape')this.explore(false);},{signal});
 }
 reduced(){return this.reducedMotion??matchMedia('(prefers-reduced-motion: reduce)').matches;}
 text(pair){return pair[window.DSHLocale?.language==='en'?1:0];}
 render(){
   this.world?.dispose();this.world=null;this.exploring=false;this.root.dataset.chapter='';this.root.classList.remove('exploring');
   const T=x=>this.text(x);
   const names=T([['初见','拆开','执行','工具','记忆','协作','开始'],['Meet','Inside','Loop','Tools','Context','Crew','Begin']]);
   this.root.innerHTML=`
   <div class="ocean-stage"><div class="product-glow" aria-hidden="true"></div><canvas id="home-canvas" aria-hidden="true"></canvas><div class="model-annotations"></div><div class="home-loading" role="status">${T(['大肥鲸正在就位','Getting the Big Whale ready'])}<span></span></div></div>
   <nav class="chapter-rail" aria-label="${T(['科普章节','Story chapters'])}">${chapters.map((c,i)=>`<button data-chapter="${i}" aria-label="${T(c.title).replace('\n',' ')}"><span>${names[i]}</span><i></i></button>`).join('')}</nav>
   <div class="ocean-tools"><span class="chapter-position">01 / 07</span><button data-reduce aria-pressed="${this.reduced()}">${T(this.reduced()?['恢复动态','Motion on']:['减少动态','Less motion'])}</button><button data-explore aria-pressed="false">${T(['近距离看看','Take a closer look'])}<span aria-hidden="true">＋</span></button></div>
   ${chapters.map((c,i)=>`<section id="chapter-${c.slug}" class="ocean-chapter chapter-${i}" data-chapter-index="${i}"><div class="chapter-sticky"><div class="chapter-copy">
     <p class="ocean-eyebrow">${i===0?'DeepSeek Harness':T([['','模块化设计','执行循环','工具与审批','上下文管理','分工与扩展','开始探索'][i],['','Modular by design','The agent loop','Tools & boundaries','Context, considered','Better together','Your next step'][i]])}</p>
     <${i===0?'h1':'h2'}>${T(c.title).split('\n').map((line,j)=>`<span class="headline-line line-${j}">${line}</span>`).join(window.DSHLocale?.language==='en'?' ':'')}</${i===0?'h1':'h2'}>
     <div class="chapter-detail">${i===1||i===2?this.lessonMarkup(i):''}<div class="model-legend"></div><p class="chapter-body">${T(c.body)}</p>
     ${i===0?`<div class="ocean-actions"><button class="dive-button" data-chapter="1">${T(['看看里面','Look inside'])} <span>↓</span></button><button class="quiet-link" data-mode="library">${T(['探索案例','View cases'])} ↗</button></div>`:''}
     ${c.modules.length?`<div class="module-chips">${c.modules.map(id=>{const d=moduleDefinitions.find(x=>x[0]===id);return `<button data-module="${id}">${T([d[1],d[2]])}<span aria-hidden="true">＋</span></button>`;}).join('')}</div>`:''}
     ${i===6?`<button class="dive-button final-cta" data-mode="library">${T(['进入八个案例','Explore all eight cases'])}<span>↗</span></button>`:''}
     <p class="whale-aside">${T(c.aside)}</p></div>
   </div><span class="scene-caption" aria-hidden="true">${i===0?T(['向下滚动，打开新视角','Scroll to see a different side']):String(i+1).padStart(2,'0')+' / '+c.tag.split(' / ')[1]}</span></div></section>`).join('')}
   <section class="company-feature"><div class="company-feature-copy"><p class="ocean-eyebrow">${T(['还有一种打开方式','One more possibility'])}</p><h2>${T(['今天，<br>大肥鲸当老板。','Today, the whale<br>starts a company.'])}</h2><p>${T(['把 DSH 变成一家像素风 AI 公司。设计、开发、测试就位，第一单：做个能用的番茄钟。','Turn DSH into a pixel-art AI company. Design, development and testing, ready for their first order: a working Pomodoro timer.'])}</p><button class="dive-button" data-open-case="pixel-company">${T(['去公司看看','Visit the office'])}<span>↗</span></button></div><button class="company-feature-art" data-open-case="pixel-company" aria-label="${T(['进入像素公司案例','Open the pixel company case'])}"><img src="assets/pixel-office.png" alt="${T(['为教学生成的像素办公室示例','Generated pixel office for this teaching example'])}" loading="lazy"></button></section>
   <footer class="ocean-footer"><span>DSH INSIDE</span><p>${T(['独立社区科普。大肥鲸是社区对 DeepSeek logo 的昵称。空间布局为教学隐喻，动画不代表实时运行。','An independent community guide. Big Whale is a nickname for the DeepSeek logo. Spatial layouts are teaching metaphors; animations are not live runtime evidence.'])}</p><button id="home-sources">${T(['来源与版本','Sources & version'])} ↗</button></footer>
   <dialog class="module-dialog" id="module-dialog"><div></div><button class="dialog-close">${T(['关闭','Close'])} ×</button></dialog>`;
   this.annotations=new ModelAnnotations(this.root.querySelector('.model-annotations'),x=>this.text(x));this.measure();
   this.root.querySelector('#home-sources').onclick=()=>document.querySelector('#about').click();
   const dialog=this.root.querySelector('dialog');dialog.querySelector('.dialog-close').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 }
 mountWorld(){
   if(!this.active)return;this.world?.dispose();
   const unavailable=()=>{const stage=this.root.querySelector('.ocean-stage');stage.classList.add('model-unavailable');const status=this.root.querySelector('.home-loading');status.hidden=false;status.textContent=this.text(['模型暂不可用，仍可阅读全部章节。','Model unavailable. All chapters are still readable.']);};
   try{this.world=new WhaleWorld(this.root.querySelector('canvas'),{home:true,onSelect:id=>this.inspect(id),onLoad:id=>{if(id==='orca_hull'){this.root.querySelector('.home-loading').hidden=true;this.root.querySelector('.ocean-stage').classList.add('loaded');}},onError:unavailable});this.world.onFrame=(time,frame)=>this.onFrame(frame);this.updateScroll();}catch{unavailable();this.root.querySelectorAll('[data-lesson-action="toggle"]').forEach(b=>{b.disabled=true;b.textContent=this.text(['逐步阅读','Step through']);});}
 }
 show(value){
   if(value===this.active)return;
   const q=new URLSearchParams(location.hash.slice(1)),savedY=this.scrollPosition;
   this.active=value;this.root.hidden=!value;
   if(value){this.render();if(q.get('view')==='home'&&q.has('chapter'))this.go(Number(q.get('chapter')),false);else window.scrollTo({top:savedY,behavior:'instant'});this.mountWorld();this.updateScroll();}
   else{cancelAnimationFrame(this.scrollFrame);this.scrollFrame=null;this.world?.dispose();this.world=null;this.exploring=false;}
 }
 go(index,smoothScroll=true){
   index=Math.max(0,Math.min(6,Number.isFinite(index)?index:0));
   const section=this.root.querySelector(`[data-chapter-index="${index}"]`);
   if(section)window.scrollTo({top:section.getBoundingClientRect().top+scrollY-document.querySelector('.header').offsetHeight,behavior:smoothScroll&&!this.reduced()?'smooth':'instant'});
 }
 measure(){if(!this.active)return;const sections=[...this.root.querySelectorAll('.ocean-chapter')];this.layout={header:document.querySelector('.header').offsetHeight,origin:this.root.getBoundingClientRect().top+scrollY,sections:sections.map(s=>({element:s,top:s.offsetTop,height:s.offsetHeight,copy:s.querySelector('.chapter-copy')}))};this.rail=[...this.root.querySelectorAll('.chapter-rail button')];this.stage=this.root.querySelector('.ocean-stage');this.oceanTools=this.root.querySelector('.ocean-tools');}
 updateScroll(){
   if(!this.active||!this.layout?.sections.length)return;
   const {sections,header,origin}=this.layout;this.scrollPosition=scrollY;
   const y=Math.max(0,scrollY-origin+header);let index=0;sections.forEach((s,i)=>{if(s.top<=y+1)index=i;});
   const section=sections[index],progress=Math.max(0,Math.min(1,(y-section.top)/section.height));
   const changed=this.chapter!==index;this.chapter=index;const reduced=this.reduced();this.root.dataset.reduced=String(reduced);
   const afterStory=Math.max(0,(y-sections[6].top-sections[6].height+innerHeight)/innerHeight);
   this.world?.setState({chapter:index,progress,theme:window.DSHLocale.theme,visible:afterStory<1.1,reduced});
   this.stage.style.opacity=String(1-Math.min(1,afterStory));this.oceanTools.style.visibility=afterStory>.7?'hidden':'visible';
   sections.forEach((s,i)=>{const local=(y-s.top)/s.height;const enter=i===0?1:Math.max(0,Math.min(1,(local+.12)/.12));const exit=1-Math.max(0,Math.min(1,(local-.66)/.20));const opacity=reduced?(i===index?1:0):enter*exit;s.copy.style.opacity=String(opacity);s.copy.style.visibility=opacity<.01?'hidden':'visible';s.copy.style.setProperty('--copy-shift',reduced?'0px':`${(1-enter)*24-(1-exit)*24}px`);});
   if(changed||this.root.dataset.chapter!==String(index)){
     this.root.dataset.chapter=String(index);this.rail.forEach((b,i)=>{b.classList.toggle('current',i===index);b.setAttribute('aria-current',i===index?'step':'false');});this.root.querySelector('.chapter-position').textContent=`${String(index+1).padStart(2,'0')} / 07`;
     history.replaceState(null,'',`#view=home&chapter=${index}`);
   }
 }
 lessonMarkup(chapter){const T=x=>this.text(x),steps=lessonFor(chapter);return `<div class="lesson-panel" data-lesson="${chapter}"><p class="lesson-heading">${T(['跟着模型，看一次完整过程','Follow one complete process'])}<span>${T(['教学演示','Teaching demo'])}</span></p>${chapter===1?`<div class="provider-choices" aria-label="${T(['选择替换提供方','Choose a replacement provider'])}">${providers.map((p,i)=>`<button data-provider-choice="${i}" aria-pressed="${i===1}">${p.id}</button>`).join('')}</div>`:''}<div class="lesson-steps">${steps.map((s,i)=>`<button data-lesson-action="seek" data-step="${i}" aria-label="${T([s[0],s[1]])}" title="${T([s[0],s[1]])}">${i+1}</button>`).join('')}</div><div class="lesson-current"><strong>${T([steps[0][0],steps[0][1]])}</strong><p>${T([steps[0][2],steps[0][3]])}</p></div><div class="lesson-controls"><button data-lesson-action="previous">${T(['上一步','Previous'])}</button><button data-lesson-action="toggle">${T(['暂停演示','Pause demo'])}</button><button data-lesson-action="next">${T(['下一步','Next'])}</button></div></div>`;}
 lessonAction(action,step){if(this.world){this.world.lessonAction(action,step);return;}this.fallbackPlayers??={1:new LessonPlayer(1),2:new LessonPlayer(2)};const player=this.fallbackPlayers[this.chapter];if(!player)return;if(action==='seek')player.seek(step);else if(action==='next')player.seek(Math.floor(player.position)+1);else if(action==='previous')player.seek(Math.floor(player.position)-1);this.updateLesson(this.chapter,Math.floor(player.position),false);}
 updateLesson(chapter,step,playing){const panel=this.root.querySelector(`[data-lesson="${chapter}"]`);if(!panel)return;const key=step+':'+playing+':'+this.reduced()+':'+window.DSHLocale.language;if(panel.dataset.state===key)return;panel.dataset.state=key;const s=lessonFor(chapter)[step];panel.querySelector('.lesson-current strong').textContent=this.text([s[0],s[1]]);panel.querySelector('.lesson-current p').textContent=this.text([s[2],s[3]]);const toggle=panel.querySelector('[data-lesson-action="toggle"]');toggle.disabled=this.reduced()||!this.world;toggle.textContent=this.text(toggle.disabled?['逐步阅读','Step through']:playing?['暂停演示','Pause demo']:['播放演示','Play demo']);panel.querySelectorAll('.lesson-steps button').forEach((b,i)=>{b.classList.toggle('current',i===step);b.setAttribute('aria-current',i===step?'step':'false');});}
 onFrame(frame){if(!frame||!this.active)return;if(!this.exploring)this.annotations.update(this.world,frame.anchors,frame.chapter);else this.annotations.clear();if(frame.lesson)this.updateLesson(frame.chapter,frame.lesson.step,frame.playing);}

 explore(value){
   if(!this.world)return;this.exploring=value;this.world.setExplore(value);this.root.classList.toggle('exploring',value);
   const button=this.root.querySelector('[data-explore]');button.setAttribute('aria-pressed',String(value));button.innerHTML=this.text(value?['返回阅读 <span>×</span>','Back to reading <span>×</span>']:['近距离看看 <span>＋</span>','Take a closer look <span>＋</span>']);
 }
 inspect(id,key){
   const anchor=key&&this.world?.annotationFrame?.anchors.find(a=>a.key===key);
   let d=moduleDefinitions.find(x=>x[0]===id);
   if(anchor){const role=anchor.role||key,isToken=role==='input'||role==='output';d=[id,...anchor.label,...(isToken?['这块模型代表用户消息，是教学用的输入或输出标记。','This model represents a user message: a teaching marker for input or output.']:anchor.note),role==='port'||role==='old'||role==='next'?['llm']:(d?.[5]||[])];}
   if(!d)return;
   const dialog=this.root.querySelector('dialog'),title=document.createElement('h2');title.textContent=this.text([d[1],d[2]]);
   const p=document.createElement('p');p.textContent=this.text([d[3],d[4]]);
   const code=document.createElement('p');code.textContent=d[5].map(id=>'ctx.'+id).join(' / ');
   const note=document.createElement('p');note.textContent=this.text(['模型是功能的教学隐喻；实际调用取决于预设、配置和任务。','This model is a teaching metaphor. Actual calls depend on the preset, configuration, and task.']);
   const a=document.createElement('a');a.href=`https://github.com/deepseek-ai/deepseek-harness/blob/${window.DSHInside.catalog.meta.commit}/docs/architecture.md`;a.target='_blank';a.rel='noopener noreferrer';a.textContent=this.text(['查看官方架构说明 ↗','Official architecture ↗']);
   dialog.firstElementChild.replaceChildren(title,p,code,note,a);dialog.showModal();
 }
}
