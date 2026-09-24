import { Timer } from './timer.js';

const text=(zh,en)=>window.DSHLocale.language==='en'?en:zh;
let showOffice=true,lastPhase=null;
// One generated scene per teaching phase (assets/office/, provenance in assets/image-provenance.json).
const PHASES=['queued','inspect','build','install','assign','work','bug','done','closed'];
const SCENES={
 queued:['办公室还没开张：灯暗着，大肥鲸在会议桌前读第一张订单。','The office is still closed: lights down, the whale reads the first order at the meeting table.'],
 inspect:['大肥鲸拿着放大镜，检查墙上的接口面板。','The whale checks the interface panel on the wall with a magnifying glass.'],
 build:['工作台上，办公室插件正被打包进木箱。','On the workbench, the office plugin is packed into a crate.'],
 install:['插头接上，办公室一片片亮起来。','The plug goes in and the office lights up one area at a time.'],
 assign:['四位员工围着任务板领活，目标是一个番茄钟。','Four crew members gather at the task board; the goal is a tomato timer.'],
 work:['设计画番茄钟，开发写代码，测试在一旁待命。','Design draws the timer, development writes code, testing stands by.'],
 bug:['红灯亮起：测试指着屏幕，番茄钟里爬出一只 bug。','A red light flashes: testing points at a bug crawling out of the timer.'],
 done:['修好了：番茄钟交付，彩带飞起来。','Fixed: the timer is delivered and confetti flies.'],
 closed:['下班：插头拔掉，桌椅装箱，大家挥手离开。','Closing time: unplugged, furniture packed, everyone waves goodbye.'],
};
const art=phase=>`assets/office/${phase}.webp`;
export function renderCompany(root,step,{reduced=false}={}){
  root.dataset.raw='';root.classList.add('company-mode');root.replaceChildren();
  const toggle=document.createElement('button');toggle.className='company-preview-button';toggle.textContent=showOffice?text('查看 3D 工坊','View 3D workshop'):text('查看像素办公室','View pixel office');toggle.onclick=()=>{showOffice=!showOffice;renderCompany(root,step,{reduced});};root.append(toggle);
  if(!showOffice)return;
  const phase=step.companyPhase;const index=PHASES.indexOf(phase);
  const active=index<5?0:index===5?2:index===6?3:index===7?2:-1;
  const names=[['协调','Coordinator'],['设计','Designer'],['开发','Developer'],['测试','Tester']];
  const status=index<4?['—','—','—','—']:index===4?[text('分派中','Assigning'),'—','—','—']:index===5?[text('跟进','Tracking'),text('完成','Done'),text('编写','Building'),text('待检查','Queued')]:index===6?[text('跟进','Tracking'),text('完成','Done'),text('返工','Rework'),text('发现问题','Issue found')]:index>=7?[text('已交付','Delivered'),text('完成','Done'),text('完成','Done'),text('通过','Passed')]:[];
  // Crossfade from the previous phase's scene; reduced motion swaps instantly.
  const previous=!reduced&&lastPhase&&lastPhase!==phase&&PHASES.includes(lastPhase)?`<img class="office-frame previous" src="${art(lastPhase)}" alt="" aria-hidden="true">`:'';
  const scene=SCENES[phase]||SCENES.queued;
  const panel=document.createElement('section');panel.className='pixel-office';panel.dataset.phase=phase;panel.classList.toggle('reduced',reduced);
  panel.innerHTML=`<div class="office-art">${previous}<img class="office-frame current" src="${art(PHASES.includes(phase)?phase:'queued')}" alt=""><span class="office-caption">${text('大肥鲸像素公司 / AI 生成教学插图','BIG WHALE CO. / AI-GENERATED ART')}</span><span class="office-phase">${String(index+1).padStart(2,'0')} / ${PHASES.length}</span></div><div class="office-board"><h3>${text('第一单：一个不偷跑的番茄钟','ORDER 01: A timer that actually pauses')}</h3><ul>${names.map((n,i)=>`<li class="${i===active?'active':''}">${text(...n)} <span>${status[i]||'—'}</span></li>`).join('')}</ul><p class="office-step"></p><div class="office-actions"><button class="office-timer"></button><p class="image-credit">${text('场景图：AI 生成的教学插图。角色与状态为教学编排，不是真实运行监控。','Scenes: AI-generated teaching illustrations. Roles and states are scripted, not live monitoring.')}</p></div></div>`;
  panel.querySelector('.office-frame.current').alt=text(...scene);
  panel.querySelector('.office-step').textContent=window.DSHLocale.t(step.description);
  const button=panel.querySelector('.office-timer');button.textContent=text('打开番茄钟示例 ↗','Open the timer sample ↗');button.onclick=showTimer;button.disabled=index<7;if(index<7)button.textContent=text('交付步骤解锁番茄钟','Timer unlocks at delivery');
  panel.querySelector('.office-actions').prepend(toggle);root.append(panel);lastPhase=phase;
  if(PHASES[index+1]){const next=new Image();next.src=art(PHASES[index+1]);}
}

export function showTimer(){
  const dialog=document.querySelector('#modal'),body=document.querySelector('#modal-body');const timer=new Timer();
  body.innerHTML=`<section class="timer-demo" data-raw><span class="eyebrow">BIG WHALE / POMODORO</span><h2>${text('专注一下，鲸然有序。','A little focus. A lot less flailing.')}</h2><p class="timer-note">${text('本页可运行的教学产物；不是已安装的 DSH 插件。','A working sample on this page, not an installed DSH plugin.')}</p><div class="timer-display" role="timer" aria-label="${text('剩余时间','Time remaining')}">25:00</div><p class="timer-note" id="timer-status"></p><div class="timer-actions"><button data-clock="start">${text('开始','Start')}</button><button data-clock="pause">${text('暂停','Pause')}</button><button data-clock="reset">${text('复位','Reset')}</button></div><button class="close-cta" data-close>${text('关闭示例','Close sample')}</button></section>`;
  const abort=new AbortController();
  const render=()=>{const ms=timer.read(performance.now()),seconds=Math.ceil(ms/1000);body.querySelector('.timer-display').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;body.querySelector('#timer-status').textContent=ms===0?text('完成，伸个懒腰。','Done. Have a stretch.'):timer.deadline!==null?text('专注中','Focusing'):text('已暂停','Paused');};
  body.addEventListener('click',e=>{const command=e.target.closest('[data-clock]')?.dataset.clock;if(command){timer[command](performance.now());render();}},{signal:abort.signal});
  const interval=setInterval(render,200);dialog.addEventListener('close',()=>{clearInterval(interval);abort.abort();},{once:true});render();if(!dialog.open)dialog.showModal();
}
