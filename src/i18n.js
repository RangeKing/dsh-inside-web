/* Offline localization using source-text message IDs. User logs and code stay untouched.
   A WeakMap preserves source text across language changes; dynamic UI is localized in
   one mutation batch. Theme/language preferences alone may be saved locally. */
(() => {
 'use strict';
 const messages=JSON.parse(document.getElementById('locale-data').textContent);
 const original=new WeakMap();const attributeSource=new WeakMap();
 const pref=(k,fallback)=>{try{return localStorage.getItem('dsh-inside-'+k)||fallback;}catch{return fallback;}};
 let language=pref('language','zh');if(!['zh','en'].includes(language))language='zh';
 let theme=pref('theme','dark');if(!['dark','light'].includes(theme))theme='dark';
 const missing=new Set();
 function english(text){
   if(messages[text]!==undefined)return messages[text];
   const trimmed=text.trim();if(messages[trimmed]!==undefined)return text.replace(trimmed,messages[trimmed]);
   let m;
   if((m=text.match(/^(\d+) 个结果 \/ 官方表共 (\d+) 个服务$/)))return `${m[1]} results / ${m[2]} official services`;
   if((m=text.match(/^第 (\d+) 步：(.*)$/)))return `Step ${m[1]}: ${english(m[2])}`;
   if((m=text.match(/^\+(\d+) 个调用方$/)))return `+${m[1]} consumers`;
   if((m=text.match(/^声明 · (.*)$/)))return `Declaration · ${m[1]}`;
   if((m=text.match(/^(\d+) 个服务$/)))return `${m[1]} services`;
   if((m=text.match(/^官方类型：(.*) · (\d+) 个直接消费者 · 结构关系按需展开$/)))return `Official role: ${english(m[1])} · ${m[2]} direct consumers · connections on demand`;
   if((m=text.match(/^保持：ctx\.(.*) 的接口职责$/)))return `Unchanged: the ctx.${m[1]} contract`;
   if((m=text.match(/^观察：(.*) 的实现位置$/)))return `Inspecting the ${m[1]} implementation`;
   if((m=text.match(/^正在观察 (.*)。这是结构演示，未更改真实配置。$/)))return `Inspecting ${m[1]}. This is a structural preview; your real configuration is unchanged.`;
   if((m=text.match(/^结构示意：(.*)。没有安装或切换真实插件。$/)))return `Structure preview: ${m[1]}. No real plugins were installed or switched.`;
   if((m=text.match(/^(\d+) \/ (\d+)，(.*)$/)))return `${m[1]} / ${m[2]}, ${english(m[3])}`;
   if((m=text.match(/^(\d+) 条(.*)$/)))return `${m[1]} events ${english(m[2])}`;
   if((m=text.match(/^第 (\d+) 行不是有效 JSON。$/)))return `Line ${m[1]} is not valid JSON.`;
   if((m=text.match(/^(\d+) 个已列出的实现方 · (\d+) 个直接消费者 · 结构关系按需展开$/)))return `${m[1]} listed implementations · ${m[2]} direct consumers · connections on demand`;
   if((m=text.match(/^事件 · (\d+) 条未映射$/)))return `events · ${m[1]} unmapped`;
   if((m=text.match(/^文件已载入：(\d+) 条事件，全部留在本页内存中。$/)))return `Loaded ${m[1]} events. All remain in this tab's memory.`;
   if((m=text.match(/^已载入日志。(\d+) 条事件未建立讲解映射，原文完整保留。(.*)$/)))return `Log loaded. ${m[1]} unmapped events are preserved in full. ${english(m[2].trim())}`;
   if((m=text.match(/^(\d+) 条事件未建立讲解映射，原文完整保留。$/)))return `${m[1]} unmapped events; raw records preserved.`;
   if((m=text.match(/^导入失败：(.*)$/s)))return `Import failed: ${english(m[1])}`;
   if((m=text.match(/^教学样本已载入：(\d+) 条事件，全部留在本页内存中。$/)))return `Teaching sample loaded: ${m[1]} events remain in this tab's memory.`;
   if((m=text.match(/^第 (\d+) 条不符合 SessionEvent：需要 type、非负整数 seq、毫秒 time、对象 data。原始存储封装请先转换为事件数组。$/)))return `Record ${m[1]} is not a valid SessionEvent: expected type, a non-negative integer seq, time in milliseconds, and an object data field. Convert native storage envelopes to an event array first.`;
   if((m=text.match(/^(\d+) · (.+)$/s)))return `${m[1]} · ${english(m[2])}`;
   if((m=text.match(/^(\d+) 个服务 · (.*)$/)))return `${m[1]} services · ${m[2]}`;
   if((m=text.match(/^(.*?)( [↗→])$/s)))return english(m[1])+m[2];
   // Known prose fragments around immutable IDs and counters.
   const pieces=text.split(/( · |，|：|\n)/);if(pieces.length>1){const mapped=pieces.map(p=>messages[p]??p).join('');if(mapped!==text)return mapped;}
   if(/[\u3400-\u9fff]/.test(text))missing.add(text);
   return text;
 }
 const t=text=>language==='en'?english(String(text??'')):String(text??'');
 function ignored(el){return !el||!!el.closest('script,style,[data-raw],#projected-labels,#flow-packet,textarea');}
 function refresh(root=document.body){
   if(!root)return;
   const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
   let n;
   while((n=walker.nextNode())){
     if(ignored(n.parentElement))continue;
     const saved=original.get(n);let raw=saved&&n.nodeValue===saved.last?saved.raw:n.nodeValue;
     const value=t(raw);original.set(n,{raw,last:value});if(n.nodeValue!==value)n.nodeValue=value;
   }
   const elements=root.querySelectorAll('[title],[aria-label],[placeholder],[aria-valuetext]');
   for(const el of elements){if(ignored(el))continue;let map=attributeSource.get(el)||{};
     for(const name of ['title','aria-label','placeholder','aria-valuetext']){
       if(!el.hasAttribute(name))continue;
       const current=el.getAttribute(name),saved=map[name],raw=saved&&current===saved.last?saved.raw:current;
       const value=t(raw);map[name]={raw,last:value};if(current!==value)el.setAttribute(name,value);
     }attributeSource.set(el,map);
   }
 }
 let observer;
 function apply(){
   document.documentElement.lang=language==='zh'?'zh-CN':'en';
   document.documentElement.dataset.theme=theme;
   document.querySelector('meta[name="color-scheme"]').content=theme;
   const lang=document.getElementById('language-toggle'),themeButton=document.getElementById('theme-toggle');
   if(lang){lang.innerHTML=`<span class="${language==='zh'?'chosen':''}">中</span><i>/</i><span class="${language==='en'?'chosen':''}">EN</span>`;lang.title=language==='zh'?'Switch to English':'切换为中文';lang.setAttribute('aria-label',lang.title);lang.dataset.language=language;}
   if(themeButton){themeButton.innerHTML=theme==='dark'?'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2V4M12 20V22M2 12H4M20 12H22M5 5L6.5 6.5M17.5 17.5L19 19M5 19L6.5 17.5M17.5 6.5L19 5"/></svg>':'<svg viewBox="0 0 24 24"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>';themeButton.setAttribute('aria-label',t(theme==='dark'?'切换亮色主题':'切换暗色主题'));themeButton.title=themeButton.getAttribute('aria-label');themeButton.setAttribute('aria-pressed',String(theme==='light'));}
   document.title=language==='en'?'DSH Inside — Follow a task through the system':'DSH Inside — 看见任务如何完成';
   refresh();
 }
 function setLanguage(value){if(!['zh','en'].includes(value))return;language=value;try{localStorage.setItem('dsh-inside-language',value);}catch{}apply();window.dispatchEvent(new CustomEvent('dsh-preferences',{detail:{language,theme}}));}
 function setTheme(value){if(!['light','dark'].includes(value))return;theme=value;try{localStorage.setItem('dsh-inside-theme',value);}catch{}apply();window.dispatchEvent(new CustomEvent('dsh-preferences',{detail:{language,theme}}));}
 window.DSHLocale={t,refresh,setLanguage,setTheme,get language(){return language},get theme(){return theme},getMissing:()=>[...missing],messages};
 document.documentElement.dataset.theme=theme;
 // Projected labels are refreshed by the renderer and deliberately excluded from this observer.
 observer=new MutationObserver(records=>{
   if(!records.some(r=>!ignored(r.target.nodeType===3?r.target.parentElement:r.target)))return;
   observer.disconnect();refresh();observer.observe(document.body,{childList:true,subtree:true,characterData:true});
 });
 observer.observe(document.body,{childList:true,subtree:true,characterData:true});
 document.addEventListener('click',e=>{
   if(e.target.closest('#language-toggle'))setLanguage(language==='zh'?'en':'zh');
   if(e.target.closest('#theme-toggle'))setTheme(theme==='dark'?'light':'dark');
 });
 apply();
})();
