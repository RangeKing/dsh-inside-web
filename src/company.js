import { Timer } from './timer.js';

const text=(zh,en)=>window.DSHLocale.language==='en'?en:zh;
let showOffice=true;
export function renderCompany(root,step){
  root.dataset.raw='';root.classList.add('company-mode');root.replaceChildren();
  const toggle=document.createElement('button');toggle.className='company-preview-button';toggle.textContent=showOffice?text('查看 3D 工坊','View 3D workshop'):text('查看像素办公室','View pixel office');toggle.onclick=()=>{showOffice=!showOffice;renderCompany(root,step);};root.append(toggle);
  if(!showOffice)return;
  const phase=step.companyPhase;const index=['queued','inspect','build','install','assign','work','bug','done','closed'].indexOf(phase);
  const active=index<5?0:index===5?2:index===6?3:index===7?2:-1;
  const names=[['协调','Coordinator'],['设计','Designer'],['开发','Developer'],['测试','Tester']];
  const positions=[[49,48],[28,62],[47,76],[33,34]];
  const status=index<4?['—','—','—','—']:index===4?[text('分派中','Assigning'),'—','—','—']:index===5?[text('跟进','Tracking'),text('完成','Done'),text('编写','Building'),text('待检查','Queued')]:index===6?[text('跟进','Tracking'),text('完成','Done'),text('返工','Rework'),text('发现问题','Issue found')]:index>=7?[text('已交付','Delivered'),text('完成','Done'),text('完成','Done'),text('通过','Passed')]:[];
  const panel=document.createElement('section');panel.className='pixel-office';
  panel.innerHTML=`<div class="office-art"><span class="office-caption">${text('大肥鲸像素公司 / 教学示例','BIG WHALE CO. / TEACHING SAMPLE')}</span>${index>=4?names.map((n,i)=>`<div class="office-person ${i===active?'active':''}" style="left:${positions[i][0]}%;top:${positions[i][1]}%"><i class="pixel-person" aria-hidden="true"></i><b>${text(...n)}</b></div>`).join(''):''}</div><div class="office-board"><h3>${text('第一单：一个不偷跑的番茄钟','ORDER 01: A timer that actually pauses')}</h3><ul>${names.map((n,i)=>`<li>${text(...n)} <span>${status[i]||'—'}</span></li>`).join('')}</ul><p></p><button>${text('打开番茄钟示例 ↗','Open the timer sample ↗')}</button><p class="image-credit">${text('办公室背景：AI 生成素材。角色与状态为教学编排，非真实运行监控。','Office background: AI-generated art. Roles and states are scripted teaching examples, not live monitoring.')}</p></div>`;
  panel.querySelector('.office-board>p').textContent=window.DSHLocale.t(step.description);
  const button=panel.querySelector('.office-board>button');button.onclick=showTimer;button.disabled=index<7;if(index<7)button.textContent=text('交付步骤解锁番茄钟','Timer unlocks at delivery');root.append(panel);
}

export function showTimer(){
  const dialog=document.querySelector('#modal'),body=document.querySelector('#modal-body');const timer=new Timer();
  body.innerHTML=`<section class="timer-demo" data-raw><span class="eyebrow">BIG WHALE / POMODORO</span><h2>${text('专注一下，鲸然有序。','A little focus. A lot less flailing.')}</h2><p class="timer-note">${text('本页可运行的教学产物；不是已安装的 DSH 插件。','A working sample on this page, not an installed DSH plugin.')}</p><div class="timer-display" role="timer" aria-label="${text('剩余时间','Time remaining')}">25:00</div><p class="timer-note" id="timer-status"></p><div class="timer-actions"><button data-clock="start">${text('开始','Start')}</button><button data-clock="pause">${text('暂停','Pause')}</button><button data-clock="reset">${text('复位','Reset')}</button></div><button class="close-cta" data-close>${text('关闭示例','Close sample')}</button></section>`;
  const abort=new AbortController();
  const render=()=>{const ms=timer.read(performance.now()),seconds=Math.ceil(ms/1000);body.querySelector('.timer-display').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;body.querySelector('#timer-status').textContent=ms===0?text('完成，伸个懒腰。','Done. Have a stretch.'):timer.deadline!==null?text('专注中','Focusing'):text('已暂停','Paused');};
  body.addEventListener('click',e=>{const command=e.target.closest('[data-clock]')?.dataset.clock;if(command){timer[command](performance.now());render();}},{signal:abort.signal});
  const interval=setInterval(render,200);dialog.addEventListener('close',()=>{clearInterval(interval);abort.abort();},{once:true});render();if(!dialog.open)dialog.showModal();
}
