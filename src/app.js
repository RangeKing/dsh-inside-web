/* UI and data adapter. No network requests, model calls or tool execution. */
(() => {
    'use strict';
    const T=v=>window.DSHLocale.t(v);
    const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
    const catalog = JSON.parse($('#catalog-data').textContent), scenarios = JSON.parse($('#scenario-data').textContent);
    const services = catalog.services, byid = Object.fromEntries(services.map(s => [s.id, s]));
    const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const sourceUrl = (path, lines, commit=catalog.meta.commit) => `https://github.com/${catalog.meta.repository}/blob/${commit}/${path}${lines ? `#L${lines[0]}-L${lines[1]}` : ''}`;
    const docUrl = s => sourceUrl('docs/capability-seams.md', [s.sourceLine, s.sourceLine]);
    const link = (url, label, cls = '') => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer" class="${cls}">${label}</a>`;
    const state = { mode: 'home', scenario: 'repair-site', preset:'standard', caseFilter:'all', summaryVariant:'verify', decisionAcknowledged:false, index: 0, selected: 'sessionController', focus: false, flat: false, tab: 'plain', playing: false, speed: 1, filter: 'all', query: '', providers: {}, trace: null, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches };
    let renderError = null, playTimer = null, toastTimer = null, renderer = null, lastFocus = null;
    const roleNames = { seam: '可替换能力接口', core: '核心服务', bundle: '组合点' };
    const typeNames = { input: '任务入口', runtime: '执行调度', log: '会话记录', context: '上下文准备', model: '模型交互', guard: '执行边界', tool: '工具执行', parallel: '并行与顺序', blocked: '未完成 / 分岔反馈', delegate: '子任务', record: '日志原文' };
    function currentScenario() { return scenarios.find(s => s.id === state.scenario) || scenarios[0]; }
    function steps() { if(state.mode==='trace')return state.trace?.steps||[]; const sc=currentScenario();return window.DSHCasePaths.pathFor(sc,state.summaryVariant).steps; }
    function current() { return steps()[state.index] || null; }
    function say(text) { $('#announcer').textContent = text; }
    function toast(text) { clearTimeout(toastTimer); $('#toast').textContent = text; $('#toast').classList.add('show'); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 4000); }
    function updateHash() { const p = new URLSearchParams(); p.set('view', state.mode);if(state.mode==='home')p.set('chapter',String(window.DSHExperience.home.chapter)); if (state.mode === 'atlas')
        p.set('seam', state.selected);
    else if (state.mode === 'journey') {
        p.set('task', state.scenario);
        p.set('step', String(state.index + 1));p.set('preset',state.preset);p.set('branch',state.summaryVariant);
    } if(state.mode==='modes')p.set('preset',state.preset); try {
        if(new URLSearchParams(location.hash.slice(1)).get('view')!==state.mode)history.pushState(null, '', '#' + p.toString());else history.replaceState(null, '', '#' + p.toString());
    }
    catch { } }
    function setPlaying(value) { state.playing = !!value && steps().length > 0 && ['journey','trace'].includes(state.mode); clearTimeout(playTimer); if (state.playing) {
        if (state.index >= steps().length - 1) { state.decisionAcknowledged=false; jump(0, false);if(state.mode==='journey')renderSidebar(); }
        if(state.mode==='journey'&&window.DSHCasePaths.stopsAtDecision(currentScenario(),state.index,state.decisionAcknowledged)){state.playing=false;renderInspector();renderTransport();syncScene();return;}
        schedulePlay();
    } renderTransport(); const b = $('#sidebar-start'); if (b)
        b.innerHTML = `${state.playing ? '暂停，看看这一步' : '开始任务导览'}<span class="key">SPACE</span>`; syncScene(); }
    function schedulePlay() { clearTimeout(playTimer); if (!state.playing)
        return; playTimer = setTimeout(() => { if (state.index >= steps().length - 1) {
        state.playing = false;
        renderTransport();
        renderSidebar();
        syncScene();
        say('导览结束。你可以选择另一个场景，或独立查看接口。');
        return;
    } jump(state.index + 1, false); if(state.mode==='journey'&&window.DSHCasePaths.stopsAtDecision(currentScenario(),state.index,state.decisionAcknowledged)){state.playing=false;renderInspector();renderTransport();syncScene();say(T('到达关键分岔，请选择接下来的做法。'));return;} schedulePlay(); }, 4600 / state.speed); }
    function jump(index, pause = true, drag = false) { const arr = steps(); if (!arr.length)
        return; if (pause) {
        state.playing = false;
        clearTimeout(playTimer);
    } state.index = Math.max(0, Math.min(arr.length - 1, Number(index) || 0)); const s = current(); state.selected = s.nodes[1] || s.nodes[0] || 'sessions'; state.focus = false; renderInspector(); if (drag)
        updateTransportPosition();
    else
        renderTransport(); syncScene(); updateHash(); if (state.mode === 'trace')
        renderTraceEvents();
    else
        renderChapters(); say(`${state.index + 1} / ${arr.length}，${s.title}`); const b = $('#sidebar-start'); if (b)
        b.innerHTML = `${state.playing ? '暂停，看看这一步' : '开始任务导览'}<span class="key">SPACE</span>`; }
    function setMode(mode) { if (!['home','library','modes','journey','atlas','trace'].includes(mode))
        return; state.playing = false; clearTimeout(playTimer); state.mode = mode; state.index = 0; state.focus = mode === 'atlas'; if(mode==='journey')state.preset=currentScenario().preset; if (mode === 'journey')
        state.selected = current().nodes[1] || current().nodes[0]; if (mode === 'trace')
        state.selected = state.trace?.steps[0]?.nodes[0] || 'sessions'; if (!byid[state.selected])
        state.selected = 'llm'; renderAll(); if(mode!=='home')window.scrollTo(0,0); updateHash(); say(mode === 'atlas' ? '接口图鉴，可以按中文名称或 ctx key 搜索。' : mode === 'trace' ? '运行记录，仅在本地读取文件。' : '任务导览'); }
    function selectService(id, pause = true) { if (!byid[id])
        return; if (pause) {
        state.playing = false;
        clearTimeout(playTimer);
    } state.selected = id; renderInspector(); renderTransport(); if (state.mode === 'atlas')
        renderCatalogResults(); syncScene(); updateHash(); say(`${byid[id].title}，ctx.${id}，${roleNames[byid[id].role]}`); }
    function scenarioChange(id) { if (!scenarios.some(s => s.id === id))
        return; state.scenario = id; state.preset=currentScenario().preset||'standard';state.summaryVariant=currentScenario().defaultVariant;state.decisionAcknowledged=false; state.index = 0; state.playing = false; clearTimeout(playTimer); state.selected = current().nodes[1] || current().nodes[0]; state.focus = false; state.flat = false; renderAll(); updateHash(); }
    function renderAll() {
       const legacyBaseline=['atlas','trace'].includes(state.mode);$('#commit-button').textContent=legacyBaseline?T('接口图鉴')+' · DSH '+catalog.meta.version+' / '+catalog.meta.commit.slice(0,7):T('教学案例')+' · DSH 0.1.7-rc.1 / 46a7f68';
       const wide=['home','library','modes'].includes(state.mode);document.body.dataset.view=state.mode;
       $('#case-library').hidden=state.mode!=='library';$('#mode-lab').hidden=state.mode!=='modes';$('#workbench').hidden=wide;$('#transport').hidden=wide;window.DSHExperience.setMode(state.mode);
       $$('.nav').forEach(b=>{const active=b.dataset.mode===state.mode;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
       if(state.mode==='library')$('#case-library').innerHTML=window.DSHStudy.library(scenarios,state.caseFilter);
       else if(state.mode==='modes')$('#mode-lab').innerHTML=window.DSHStudy.modes(state.preset);
       else if(state.mode!=='home'){renderSidebar();renderInspector();renderTransport();}
       syncScene();window.DSHLocale.refresh();
    }
    function renderSidebar() {
      const el=$('#sidebar');el.className='sidebar '+state.mode+'-sidebar';
      if(state.mode==='atlas'){renderAtlasSidebar();return;}if(state.mode==='trace'){renderTraceSidebar();return;}
      const sc=currentScenario(),m=window.DSHStudy.preset(state.preset);
      el.innerHTML=`<button class="back-to-library" data-mode="library">← <span>返回案例库</span></button><div class="case-side-meta"><span class="case-number">${String(sc.rank).padStart(2,'0')}</span><span>${esc(sc.difficulty)}</span><button class="preset-badge" data-open-preset="${m.id}" style="--preset-color:${m.color}">${esc(T(m.name))} ↗</button></div>
        <h1 class="case-side-title">${esc(sc.name)}</h1><p class="lead">${esc(sc.story)}</p>
        <p class="case-requirements">${esc(T(sc.environment))}</p><div class="case-side-features"><span class="eyebrow">这个案例会展示什么</span><div>${sc.features.map(f=>`<span>${esc(f)}</span>`).join('')}</div></div>
        <details class="case-brief"><summary>${esc(T('任务与资料'))}<span aria-hidden="true">＋</span></summary><div class="mission"><label class="field-label" for="scenario">选择案例</label><select id="scenario" class="scenario-select">${scenarios.map(x=>`<option value="${x.id}" ${x.id===sc.id?'selected':''}>${String(x.rank).padStart(2,'0')} · ${esc(x.name)}</option>`).join('')}</select>
        <div class="prompt-card"><div class="prompt-card-head"><span>任务提示词</span><button id="copy-prompt" title="复制当前语言的提示词" aria-label="复制提示词">⧉</button></div><p id="mission-prompt">${esc(T(sc.prompt))}</p></div>
        <div class="mission-actions"><button id="view-fixtures" class="text-button">查看案例资料</button><button id="jump-result" class="text-button">直接查看最终结果 →</button></div>
        <button class="start-button" id="sidebar-start">${state.playing?'暂停在当前步骤':'开始播放导览'}<span class="key">SPACE</span></button></div></details>

        ${decisionMarkup(sc)}
        <div class="chapters" id="chapters"></div><div class="sidebar-bottom"><span class="local-demo-label"><i></i>教学任务 · 无真实工具执行</span><p class="source-note">框架路径与示例数据分开标注。</p></div>`;
      renderChapters();$('#scenario').onchange=e=>scenarioChange(e.target.value);$('#sidebar-start').onclick=()=>setPlaying(!state.playing);
    }
    function renderChapters() { const el = $('#chapters'); if (!el)
        return; const sc = currentScenario(); const defs = [['进入任务', ['input', 'runtime']], ['准备上下文', ['context']], ['模型做出响应', ['model']], ['检查与执行', ['guard', 'tool', 'blocked', 'delegate']], ['汇集结果', ['parallel']], ['记录与收尾', ['log']]]; const k = current()?.kind; el.innerHTML = defs.map(([label, kinds], i) => { let idx = steps().findIndex(s => kinds.includes(s.kind)); return `<button class="chapter ${kinds.includes(k) ? 'active' : ''}" data-jump="${idx}" ${idx < 0 ? 'disabled' : ''}><span>${String(i + 1).padStart(2, '0')}</span><span>${label}</span><span class="chapter-dot"></span></button>`; }).join(''); }
    function renderAtlasSidebar() { const el = $('#sidebar'); el.innerHTML = `<span class="eyebrow">THE CAPABILITY ATLAS</span><h1 class="catalog-heading">一个接口，<br>看清全部关系。</h1><p class="catalog-subtitle">保留官方分类。先理解单个服务，再回到它在任务中的位置。</p><div class="search-wrap"><span class="search-icon">⌕</span><input id="service-search" type="search" autocomplete="off" placeholder="搜索中文 / ctx.fs / 包名" aria-label="搜索服务" value="${esc(state.query)}"></div><div class="filters" aria-label="按服务类型筛选">${[['all', `${T('全部')} ${services.length}`], ['seam', `Seam ${services.filter(s=>s.role==='seam').length}`], ['core', `Core ${services.filter(s=>s.role==='core').length}`], ['bundle', `${T('组合')} ${services.filter(s=>s.role==='bundle').length}`]].map(([v, t]) => `<button class="filter ${state.filter === v ? 'active' : ''}" data-filter="${v}">${t}</button>`).join('')}</div><div id="filter-count" class="filter-count"></div><div id="catalog-list" class="catalog-list"></div>`; $('#service-search').addEventListener('input', e => { state.query = e.target.value; renderCatalogResults(); }); renderCatalogResults(); }
    function filteredServices() { const q = state.query.trim().toLowerCase().replace(/^ctx\./, ''); return services.filter(s => (state.filter === 'all' || s.role === state.filter) && (!q || [s.id, s.title, window.DSHLocale.messages[s.title]||'', s.owner, s.description, window.DSHLocale.messages[s.description]||'', ...s.implementations, ...s.consumers].join(' ').toLowerCase().includes(q))); }
    function renderCatalogResults() { const el = $('#catalog-list'); if (!el)
        return; const found = filteredServices(); $('#filter-count').textContent = `${found.length} 个结果 / 官方表共 ${services.length} 个服务`; el.innerHTML = found.length ? found.map(s => `<button class="catalog-item ${s.id === state.selected ? 'selected' : ''}" data-service="${s.id}" style="--color:${catalog.groups[s.group].color}" ${s.id === state.selected ? 'aria-current="true"' : ''}><span class="service-icon">${window.DSHIdentity.svg(s.id)}</span><span><strong>${esc(s.title)}</strong><small>ctx.${esc(s.id)}</small></span><span>↗</span></button>`).join('') : '<p class="empty-search">没有匹配项。试试“文件”“批准”“llm”或提供方包名。</p>'; $$('.filter').forEach(b => { b.classList.toggle('active', b.dataset.filter === state.filter); b.setAttribute('aria-pressed', String(b.dataset.filter === state.filter)); }); }
    function packageLabels(a) { return a.length ? `<div class="package-list">${a.map(p => `<span>${esc(p)}</span>`).join('')}</div>` : '<span>官方表未列出</span>'; }
    function providerPanel(s) { const chosen = state.providers[s.id] || s.implementations[0]; if (!s.implementations.length)
        return `<h4 class="subheading">${s.role === 'seam' ? '实现接入' : '官方类型'}</h4><p class="provider-help">${s.role === 'seam' ? '官方表未列出独立实现包。具体接入方式见声明包；部分服务通过运行时提供方或监听器完成交互。' : s.role === 'bundle' ? '这是一个具体的组合点，用来装配执行循环。' : '这是核心服务。请结合声明包、事件和直接消费者理解它的扩展方式。'}</p>`; return `<h4 class="subheading">实现方 <span style="color:#435e76">/ 结构切换演示</span></h4><div class="provider-options">${s.implementations.map(p => `<button class="provider-option ${chosen === p ? 'selected' : ''}" data-provider="${esc(p)}" data-for="${s.id}" aria-pressed="${chosen === p}">${esc(p)}</button>`).join('')}</div><p class="provider-help">点击查看接口与实现的分工。这里不安装插件，也不修改真实 DSH 配置。</p>${state.providers[s.id] ? `<div class="provider-diff"><span class="unchanged">保持：ctx.${s.id} 的接口职责</span><br>观察：${esc(chosen)} 的实现位置<br><span class="unchanged">实际切换仍需配置依赖、权限与运行环境。</span></div>` : ''}`; }
    function servicePanel(s, full = false) { const developer = state.tab === 'code'; return `<section class="service-panel"><h4 class="subheading">${full ? '当前服务' : '此刻聚焦的服务'}</h4><div class="service-title"><span class="inspector-service-icon">${window.DSHIdentity.svg(s.id)}</span><h3>${esc(s.title)}</h3><span class="role-badge ${s.role}">${s.role}</span>${s.id === 'agentTeams' ? '<span class="role-badge bundle">experimental</span>' : ''}</div><div class="service-key">ctx.${esc(s.id)}</div><p class="service-desc">${esc(s.description)}</p>${developer ? `<dl class="detail-list"><dt>职责</dt><dd>${roleNames[s.role]}</dd><dt>声明包</dt><dd>${esc(s.owner)}</dd><dt>消费方</dt><dd>${packageLabels(s.consumers)}</dd>${s.companions ? `<dt>配套插件</dt><dd>${packageLabels(s.companions)}</dd>` : ''}</dl><p class="plain-detail">${esc(s.detail)}</p>` : ''}${providerPanel(s)}${!developer && full ? `<div class="divider"></div><h4 class="subheading">开发者值得留意</h4><p class="plain-detail">${esc(s.detail)}</p><h4 class="subheading">官方表中的直接消费者</h4>${packageLabels(s.consumers)}` : ''}${link(docUrl(s), `<span>查看官方服务表</span><span>↗</span>`, 'source-link')}<div class="source-path">docs/capability-seams.md : ${s.sourceLine}<br>${esc(catalog.meta.commit.slice(0, 7))} · ${roleNames[s.role]}</div>${developer ? link(s.path === 'docs/capability-seams.md' ? docUrl(s) : sourceUrl(s.path), `打开声明包目录 ↗`, 'source-link') : ''}</section>`; }
    function tabs() { return `<div class="panel-top"><span class="eyebrow">${state.mode === 'atlas' ? 'SEAM INSPECTOR' : state.mode === 'trace' ? 'EVENT INSPECTOR' : 'STEP INSPECTOR'}</span><div class="tabs" role="tablist" aria-label="说明深度"><button class="tab ${state.tab === 'plain' ? 'active' : ''}" role="tab" aria-selected="${state.tab === 'plain'}" data-tab="plain">看懂</button><button class="tab ${state.tab === 'code' ? 'active' : ''}" role="tab" aria-selected="${state.tab === 'code'}" data-tab="code">源码</button></div></div>`; }
    function renderInspector() {
        const el = $('#inspector'), s = byid[state.selected] || byid.llm;
        let html = tabs();
        if (state.mode === 'atlas') {
            html += `<div class="step-heading"><span class="step-index">${String(services.indexOf(s) + 1).padStart(2, '0')}</span><span class="step-kind">${roleNames[s.role]}</span></div>${servicePanel(s, true)}<div class="divider"></div><p class="focus-note">关系图列出声明包、直接消费者和实现方；这些是结构关系，不表示实际调用时序。</p><button class="outline-button" id="related-journey">回到任务里看它</button>`;
            el.innerHTML = html;
            return;
        }
        if (state.mode === 'trace' && !state.trace) {
            el.innerHTML = html + `<div class="big-zero">∅</div><h2>让真实记录<br>进入这张图。</h2><p class="trace-empty-description">导入一个会话的 SessionEvent 数据。原始事件按文件顺序保留，选中事件后可查看原文和相关服务。</p><div class="insight"><b>观察边界</b>普通会话日志没有记录所有 seam 调用。这里不补造提供方、耗时、权限判断或未出现的调用。</div><p class="warning-note">支持标准化 SessionEvent 数组、{ events: […] } 或逐行事件 JSONL。当前工具不负责还原或恢复 DSH 会话。</p><button class="outline-button" id="example-format">查看格式与样本</button>`;
            return;
        }
        const st = current();
        if (!st) {
            el.innerHTML = html;
            return;
        }
        if (state.mode === 'trace') {
            const event = state.trace.events[state.index];
            const unknown = !eventMap[event.type];
            html += `<div class="step-heading"><span class="step-index">${esc(event.seq)}</span><span class="step-kind">${unknown ? '未映射事件' : '日志已记录'}</span></div><h2>${esc(st.title)}</h2><div class="event-chip">${esc(event.type)}</div><p class="log-time">${new Date(event.time).toISOString()}</p><p class="step-description">${esc(st.description)}</p><div class="warning-note">服务定位属于阅读辅助；本事件不证明一条完整的内部调用链。${unknown && !event.ignorable ? ' 此事件未标为 ignorable，不能据此重建会话。' : ''}</div><h4 class="subheading" style="margin-top:20px">事件原文 · 敏感字段按名称遮盖</h4><pre data-raw>${esc(JSON.stringify(redact(event), null, 2).slice(0, 18000))}${JSON.stringify(event).length > 18000 ? '\n… 仅截短界面显示，导入记录保留完整内容。' : ''}</pre>${event.surfaceOp ? `<div class="insight"><b>SURFACE METADATA</b>这条记录携带 surfaceOp。网页保留原始字段，不尝试重建模型当前消息。</div>` : ''}<div class="divider"></div>${servicePanel(s, false)}`;
            el.innerHTML = html;
            return;
        }
        html += `<div class="step-heading"><span class="step-index">${String(state.index + 1).padStart(2, '0')}</span><span class="step-kind">${typeNames[st.kind] || st.kind}</span></div><h2>${esc(st.title)}</h2>`;
        html+=`<p class="case-learning-note">${esc(currentScenario().learn)}</p>`;
        if(st.runtime){
          const r=st.runtime,final=state.index>=steps().length-1,verified=final&&window.DSHCasePaths.pathFor(currentScenario(),state.summaryVariant).success;
          html+=`<div class="live-status ${st.kind==='blocked'?'denied':verified?'complete':''}"><i></i><span>${esc(r.status)}</span><small>DEMO</small></div>
            <div class="runtime-card"><div class="runtime-label"><span>这一步收到</span><small>INPUT</small></div><pre class="sample-code input-code">${esc(T(r.input))}</pre>
            <div class="runtime-arrow">↓</div><div class="runtime-label"><span>${final?'本路径结果':'产生的状态 / 结果'}</span><small>${final?'ANSWER':'OUTPUT'}</small></div><pre class="sample-code output-code ${verified?'final-output':''}">${esc(T(r.output))}</pre></div>`;
        }
        if(state.index===currentScenario().decision?.index)html+=decisionMarkup(currentScenario(),true);
        html+=`<details class="step-explainer" ${state.tab==='code'?'open':''}><summary>为什么经过这些组件？</summary><p class="step-description">${esc(st.description)}</p><div class="event-chip">${esc(st.event)}</div><div class="insight"><b>这一刻，值得留意</b>${esc(st.insight)}</div></details>`;
        if (state.tab === 'code') {
            html += `<div class="code-caption"><span>${st.code ? '核对过的语句 / 标识' : '代码或文档依据'}</span><span>${esc((st.reviewedCommit||currentScenario().reviewedCommit).slice(0, 7))}</span></div>${st.code ? `<pre data-raw>${esc(st.code)}</pre>` : ''}${link(sourceUrl(st.source, st.lines, st.reviewedCommit||currentScenario().reviewedCommit), `查看对应源码 / 文档 ↗`)}<div class="source-path">${esc(st.source)}<br>L${st.lines[0]}–L${st.lines[1]}</div>${(st.supportingSources||[]).map(ref=>link(sourceUrl(ref.source,ref.lines,currentScenario().reviewedCommit),esc(ref.source)+' : '+ref.lines.join('–'))).join('<br>')}${Object.keys(st.payload).length ? `<h4 class="subheading" style="margin-top:18px">本页教学数据，非真实执行结果</h4><pre>${esc(JSON.stringify({ ...st.payload, input:T(st.payload.input), output:T(st.payload.output), ...(state.index === 0 ? { task: T(currentScenario().task) } : {}) }, null, 2))}</pre>` : ''}`;
        }
        html += `<div class="divider"></div><h4 class="subheading">相关服务 · 点击查看职责</h4><div class="related-nodes">${st.nodes.map(id => `<button class="node-chip ${id === s.id ? 'active' : ''}" data-service="${id}">ctx.${esc(id)}</button>`).join('')}</div>${servicePanel(s, false)}`;
        if(state.index===steps().length-1){html+=`<button class="outline-button result-files" id="view-deliverables">${esc(T('查看本路径结果文件'))} ↗</button>`;const next=scenarios.find(x=>x.rank===currentScenario().rank+1);html+=`<div class="case-next"><button data-mode="library" class="outline-button">返回案例库</button>${next?`<button data-open-case="${next.id}" class="outline-button">下一个案例 →</button>`:''}</div>`;}

        el.innerHTML = html;
    }
    function renderTransport() {
        const el = $('#transport');
        if (state.mode === 'atlas') {
            const s = byid[state.selected];
            el.innerHTML = `<div class="view-footer"><div><h3>${esc(s.title)} <span style="font:10px var(--mono);color:#6d91a9;margin-left:8px">ctx.${esc(s.id)}</span></h3><p>${s.implementations.length} 个已列出的实现方 · ${s.consumers.length} 个直接消费者 · 结构关系按需展开</p></div><div class="view-footer-buttons"><button class="outline-button" id="prev-service">← 上一个</button><button class="outline-button" id="next-service">下一个 →</button><button class="outline-button export-state" id="export-state">导出阅读位置</button></div></div><div class="transport-foot"><span>按 <b>/</b> 搜索 <span class="separator">·</span> 按 <b>F</b> 切换剖面 <span class="separator">·</span> 按 <b>R</b> 复位</span><span>静态关系依据官方表 · 源码固定到一个提交</span></div>`;
            return;
        }
        const arr = steps(), st = current(), count = arr.length;
        if (!count) {
            el.innerHTML = `<div class="view-footer"><div><h3>尚未载入会话记录</h3><p>文件只在此浏览器页面内读取；切换到任务导览可以查看教学流程。</p></div><div class="view-footer-buttons"><button class="outline-button" id="import-footer">导入日志</button><button class="outline-button" id="sample-footer">下载教学样本</button></div></div><div class="transport-foot"><span>支持单会话标准化事件 · 最大 8 MiB / 20,000 条</span><span>不上传、不执行、不重建会话</span></div>`;
            return;
        }
        const trace = state.mode === 'trace';
        const sampleIdx = count <= 40 ? arr.map((_, i) => i) : Array.from({ length: 25 }, (_, i) => Math.round(i / 24 * (count - 1)));
        el.innerHTML = `<div class="playback-control"><button class="skip-button" id="prev-step" aria-label="上一步" ${state.index === 0 ? 'disabled' : ''}>‹</button><button class="play-button" id="play" aria-label="${state.playing ? '暂停' : '播放'}" aria-pressed="${state.playing}">${state.playing ? 'Ⅱ' : '▷'}</button><button class="skip-button" id="next-step" aria-label="下一步" ${state.index === count - 1 ? 'disabled' : ''}>›</button><div class="play-meta"><strong>${trace ? '记录回放' : '源码导览'}</strong><small>${String(state.index + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}</small></div><select class="speed-select" id="speed" aria-label="教学播放速度">${[.5, 1, 1.5, 2].map(n => `<option value="${n}" ${state.speed === n ? 'selected' : ''}>${n}×</option>`).join('')}</select></div><div class="timeline-area"><div class="timeline-title"><strong>${esc(st.title)}</strong><small>${trace ? 'FILE ORDER' : 'STEP BY STEP'} <span style="margin-left:8px">${state.index + 1}/${count}</span></small></div><div class="segments" aria-label="选择步骤">${sampleIdx.map(i => `<button class="segment ${i < state.index ? 'done' : ''} ${i === state.index ? 'current' : ''}" data-jump="${i}" title="${esc(arr[i].title)}" aria-label="第 ${i + 1} 步：${esc(arr[i].title)}">${String(i + 1).padStart(2, '0')}</button>`).join('')}</div><input id="timeline-range" class="timeline-range" type="range" min="0" max="${count - 1}" value="${state.index}" step="1" aria-label="拖动查看步骤" aria-valuetext="${esc(st.title)}"></div><div class="transport-foot"><span>${trace ? '按文件顺序呈现原始事件' : '教学播放速度，不代表真实运行耗时'}<span class="separator">·</span>${trace ? '不推测未记录的调用' : '亮起的连接仅属于当前讲解步骤'}</span><span>← → 切换步骤 <span class="separator">·</span> SPACE 播放 / 暂停</span></div>`;
        $('#timeline-range').addEventListener('input', e => jump(Number(e.target.value), true, true));
        $('#speed').onchange = e => { state.speed = Number(e.target.value); schedulePlay(); syncScene(); };
    }
    function updateTransportPosition() {
        const arr = steps(), st = current(), range = $('#timeline-range');
        if (!st || !range)
            return;
        range.value = String(state.index);
        range.setAttribute('aria-valuetext', st.title);
        const title = $('.timeline-title strong'), small = $('.timeline-title small'), meta = $('.play-meta small');
        if (title)
            title.textContent = st.title;
        if (small)
            small.textContent = `${state.mode === 'trace' ? 'FILE ORDER' : 'STEP BY STEP'}   ${state.index + 1}/${arr.length}`;
        if (meta)
            meta.textContent = `${String(state.index + 1).padStart(2, '0')} / ${String(arr.length).padStart(2, '0')}`;
        $$('.segment').forEach(b => { b.classList.toggle('done', Number(b.dataset.jump) < state.index); b.classList.toggle('current', Number(b.dataset.jump) === state.index); });
        const prev = $('#prev-step'), next = $('#next-step'), play = $('#play');
        if (prev)
            prev.disabled = state.index === 0;
        if (next)
            next.disabled = state.index === arr.length - 1;
        if (play) {
            play.textContent = '▷';
            play.setAttribute('aria-pressed', 'false');
            play.setAttribute('aria-label', '播放');
        }
    }
    function syncScene() { if(['home','library','modes'].includes(state.mode)){renderer?.setState({playing:false,flow:null});return;} const st = current(); const active = state.mode === 'atlas' ? [] : st?.nodes || []; if (renderer)
        renderer.setState({ selected: state.selected, active, focus: state.focus, flat: state.flat, reduced: state.reduced, playing: state.playing, providers: state.providers, trace: state.mode === 'trace', flow:state.mode==='journey'?st?.flow:null, stepKey:state.mode+':'+state.scenario+':'+state.summaryVariant+':'+state.index, speed:state.speed, theme:window.DSHLocale.theme, language:window.DSHLocale.language }); $('#view-overview').classList.toggle('active', !state.focus && !state.flat); $('#view-flat').classList.toggle('active', !state.focus && state.flat); $('#view-focus').classList.toggle('active', state.focus); $('#view-overview').setAttribute('aria-pressed', String(!state.focus && !state.flat)); $('#view-flat').setAttribute('aria-pressed', String(!state.focus && state.flat)); $('#view-focus').setAttribute('aria-pressed', String(state.focus)); $('#focus-legend').hidden = !state.focus; $('.explode-control').hidden = state.focus || state.flat; $('#motion-toggle').textContent = state.reduced ? '恢复动态' : '减少动态'; $('#motion-toggle').setAttribute('aria-pressed', String(state.reduced)); $('#evidence-tag').textContent = state.mode === 'trace' ? (state.trace?.synthetic ? '教学样本' : '本地日志') : state.mode === 'atlas' ? '静态结构' : '教学演示'; $('#evidence-tag').classList.toggle('trace', state.mode === 'trace'); $('#scene-eyebrow').textContent = state.focus ? 'ONE SERVICE. EVERY CONNECTION.' : state.mode === 'trace' ? 'YOUR SESSION, IN VIEW.' : 'THE ANATOMY OF A TASK'; $('.stage-key').classList.toggle('focus-key',state.focus); $('#scene-caption').textContent = state.focus ? '把一个服务单独展开，查看它的调用方、声明包和实现方。' : state.mode === 'trace' ? '只定位日志能够支持的相关服务，不补画日志中没有的调用。' : state.flat ? '平面视图固定布局与方向，适合逐步阅读完整任务流程。' : '三维视图保留空间层级，并持续连接上一阶段与当前阶段。'; $('#stage').dataset.layout=state.focus?'focus':state.flat?'flat':'3d'; $('.interaction-hint').innerHTML=state.flat?'平面模式 <span>·</span> 滚轮缩放 <span>·</span> 点击组件':'<span class="tiny-cross">✣</span>拖动旋转 <span>·</span> 滚轮缩放 <span>·</span> 点击组件'; if(state.mode==='journey')$('#evidence-tag').innerHTML=`<span>${esc(T('教学演示'))}</span> · ${esc(T(window.DSHStudy.preset(state.preset).name))}`;renderSpecial(); if (renderError)
        renderFallback(); }
    function renderSpecial(){
      const el=$('#special-visual');el.innerHTML='';el.classList.remove('company-mode');delete el.dataset.raw;if(state.focus||state.flat||state.mode!=='journey')return;
      const st=current();
      if(currentScenario().company){window.DSHExperience.renderCompany(el,st,{reduced:state.reduced});return;}
      delete el.dataset.raw;
      if(st.ribbon)el.innerHTML=`<div class="context-ribbon ${st.kind==='blocked'?'denied':''}"><span>${esc(st.ribbon)}</span></div>`;
      else if(st.kind==='delegate')el.innerHTML='<div class="context-ribbon"><b>PARENT</b><span>⇄</span><b>logs / changes</b><i></i><span>独立子会话</span></div>';
    }
    function renderFallback() { const el = $('#no-webgl'); el.hidden = false; $('#scene').style.opacity = '0'; $('#projected-labels').style.display = 'none'; el.innerHTML = `<p class="fallback-note">当前浏览器的图形画布不可用，已切换为文字组件视图。全部导览、搜索、源码和日志功能仍可使用。</p><div class="fallback-grid">${catalog.groups.map(g => { const related = services.filter(s => s.group === g.id); const active = current()?.nodes || []; return `<button class="fallback-item ${related.some(s => active.includes(s.id)) ? 'active' : ''}" data-service="${related.find(s => active.includes(s.id))?.id || related[0].id}">${g.name}<br><small>${related.length} 个服务</small></button>`; }).join('')}</div>`; }
    function focusToggle(on) { state.focus = typeof on === 'boolean' ? on : !state.focus; if(state.focus) state.flat=false; state.playing = false; clearTimeout(playTimer); syncScene(); renderTransport(); }
    function flatToggle(on=true) { state.flat = typeof on === 'boolean' ? on : !state.flat; if(state.flat) state.focus=false; state.playing=false; clearTimeout(playTimer); syncScene(); renderTransport(); }
    function serviceMove(d) { let arr = filteredServices(); if (!arr.length)
        arr = services; let i = arr.findIndex(s => s.id === state.selected); selectService(arr[(Math.max(0, i) + d + arr.length) % arr.length].id); }
    function findRelated() { let sc = currentScenario(), idx = sc.steps.findIndex(s => s.nodes.includes(state.selected)); if (idx < 0) {
        sc = scenarios.find(x => x.steps.some(s => s.nodes.includes(state.selected)));
        if (!sc) {
            toast('此服务已收入图鉴；当前案例没有展开它的运行分支。');
            return;
        }
        idx = sc.steps.findIndex(s => s.nodes.includes(state.selected));
    } const chosen = state.selected; openCase(sc.id); jump(idx); selectService(chosen); }
    function showModal(content) { const dlg = $('#modal'); lastFocus = document.activeElement;dlg.classList.remove('archive-modal'); $('#modal-body').innerHTML = `<div class="modal-content">${content}</div>`; if (!dlg.open)
        dlg.showModal(); $('#modal-body').querySelector('[data-close]')?.focus(); }
    const modalHead = t => `<div class="modal-heading"><span class="eyebrow">${t}</span><button data-close aria-label="关闭">×</button></div>`;
    function showAbout() { showModal(`${modalHead('ABOUT DSH INSIDE')}<h2>把系统打开。<br>让复杂性变得可读。</h2><p>DSH Inside 是基于 DeepSeek Harness 官方源码制作的独立交互式导览。通过逐步任务导览和单服务剖面，把复杂关系拆成可连续阅读的过程。</p><div class="modal-stats"><div><strong>${services.length}</strong><small>官方表中的服务</small></div><div><strong>${services.filter(s=>s.role==='seam').length}</strong><small>标为 seam 的接口</small></div><div><strong>${scenarios.length}</strong><small>教学任务场景</small></div></div><h3>证据与范围</h3><p>服务名称、角色、声明包、实现方及直接消费者来自 capability-seams.md。任务主链核对了 agent-loop、tools 和 session 的关键源码。大肥鲸的空间布局、中文讲解、任务示例和播放速度为本项目设计。</p><p>教学动画没有真实模型输出或性能测量。提供方切换仅改变结构示意。日志模式展示本地导入的事件，不代表拥有全部 seam 的实测调用轨迹，也不尝试恢复会话。</p><h3>来源基线分别记录</h3><p>首页、六个案例与预设：0.1.7-rc.1 / 46a7f68，2026-09-24 核验。下列接口图鉴仍使用独立旧基线；步骤源码链接使用各自核验提交。</p><h3>接口图鉴基线</h3><p>DSH ${catalog.meta.version}<br><code style="font-size:10px;overflow-wrap:anywhere">${catalog.meta.commit}</code><br>核验日期：${catalog.meta.reviewedAt}</p><div class="source-table">${[['docs/capability-seams.md', '当前服务的职责、角色、声明与实现'], ['packages/core/agent-loop/src/agent.ts', 'turn / step / request / tool-call 主执行链'], ['docs/tool-execution-pipeline.md', '工具策略、守卫与结果处理'], ['packages/core/tools/src/index.ts', '前置、执行包装、后置、最终结果事件'], ['packages/core/session/src/index.ts', '追加式会话、事件观察与刷写检查点'], ['docs/subsystems/session.md', 'SessionEvent 与持久记录边界']].map(([p, t]) => link(sourceUrl(p), `${esc(p)}<br><span style="font-family:var(--sans);color:#7e96b0">${esc(t)}</span>`)).join('')}</div><p class="modal-footnote">本项目与 DeepSeek 官方无隶属关系。网页无需外部字体、脚本或模型密钥；只有主动打开源码链接时才访问 GitHub。</p><button class="close-cta" data-close>继续探索</button>`); }
    function showHelp() { showModal(`${modalHead('A SMALL FIELD GUIDE')}<h2>先看一次任务。<br>再拆开一个接口。</h2><h3>案例库与四种模式</h3><p>每个案例都有资料、能力前提、关键分岔和结果文件。播放会在分岔处暂停；选择后可以继续，也可以随时切换另一条路径。四种预设单独对照，不是能力排行榜。</p><h3>01 / 任务导览</h3><p>选择场景并播放，跟随亮起的组件。拖动底部时间轴回到任一步；切换“源码”查看该步骤的代码依据。播放速度仅用于讲解。</p><h3>02 / 接口图鉴</h3><p>搜索中文、ctx key 或包名。“剖面”列出所选服务的声明、消费者和实现方。点击提供方只切换结构示意，不改变真实配置。</p><h3>03 / 运行记录</h3><p>载入标准化的 SessionEvent。文件留在当前页面内存中，不上传、不自动保存。未知事件继续显示并提示解释限制。</p><h3>3D / 平面视图</h3><p>3D 视图支持拖动旋转、滚轮缩放和触屏双指缩放；“平面”会显示本步骤的二维组件关系，适合连续阅读任务步骤。点击组件可查看职责，“展开层级”只影响 3D 视图。</p><div class="keyboard-grid"><kbd>SPACE</kbd><span>播放 / 暂停</span><kbd>← →</kbd><span>前后步骤 / 前后服务</span><kbd>/</kbd><span>搜索接口</span><kbd>F</kbd><span>总览 / 单接口剖面</span><kbd>P</kbd><span>3D / 平面切换</span><kbd>R</kbd><span>复位视角</span><kbd>ESC</kbd><span>关闭说明 / 返回总览</span></div><p class="modal-footnote">可点击“减少动态”。模型无法显示时提供文字组件视图；平面关系图可随时使用。</p><button class="close-cta" data-close>开始探索</button>`); }
    function openCase(id){
       id=window.DSHCasePaths.resolveCaseId(id);
       if(!scenarios.some(s=>s.id===id))return;state.mode='journey';scenarioChange(id);
       window.scrollTo(0,0);
    }
    function decisionMarkup(sc,inline=false){
      if(!sc.decision)return '';
      return `<section class="branch-switch ${inline?'decision-inline':''}" aria-label="${esc(T('关键分岔'))}"><span class="eyebrow">${esc(T('关键分岔'))}</span><p>${esc(T(sc.decision.question))}</p>${Object.entries(sc.variants).map(([id,v])=>`<button data-summary-branch="${id}" class="${state.decisionAcknowledged&&state.summaryVariant===id?'selected':''}" aria-pressed="${state.decisionAcknowledged&&state.summaryVariant===id}">${esc(T(v.name))}</button>`).join('')}<small>${esc(T(!state.decisionAcknowledged?'选择一种做法，再继续播放；也可以逐步预览。':'切换会回到分岔处；所有结果都是教学编排。'))}</small></section>`;
    }
    function chooseBranch(id){
      if(!currentScenario().variants?.[id])return;
      state.playing=false;clearTimeout(playTimer);state.summaryVariant=id;state.decisionAcknowledged=true;
      state.index=window.DSHCasePaths.branchPosition(currentScenario(),id,currentScenario().decision.index);
      state.selected=current().nodes[1]||current().nodes[0];state.focus=false;
      renderAll();updateHash();
      $('#inspector [data-summary-branch="'+id+'"]')?.focus({preventScroll:true});
      say(T(currentScenario().variants[id].name));
    }
    function showDeliverables(){
      const sc=currentScenario(),path=window.DSHCasePaths.pathFor(sc,state.summaryVariant);
      showModal(`${modalHead('DELIVERABLES')}<h2>${esc(T(sc.name))}</h2><p>${esc(T(path.name))}</p><p class="fixture-notice">${esc(T('以下为当前分岔的教学结果文件，不是真实 DSH 执行记录。'))}</p>${path.files.map(f=>`<h3>${esc(f.path)}</h3><pre data-raw>${esc(window.DSHLocale.language==='en'?f.contentEn||f.content:f.content)}</pre>`).join('')}<button class="close-cta" data-close>${esc(T('返回任务'))}</button>`);
    }
    function showFixtures(){
       const sc=currentScenario();showModal(`${modalHead('MATERIALS')}<h2>${esc(sc.name)}</h2><p>${esc(sc.story)}</p><p>${esc(sc.learn)}</p><p class="fixture-notice">先认识这些资料，再看执行过程。</p>${sc.files.map(f=>`<div class="fixture-type">${f.origin==='upstream'?'官方源码节选':'本页原创样本'}${f.sourceUrl?` · ${link(f.sourceUrl,'↗ SOURCE')}`:''}</div><h3>${esc(f.path)}</h3><pre data-raw>${esc(window.DSHLocale.language==='en'&&f.contentEn?f.contentEn:f.content)}</pre>`).join('')}${sc.programSketch?`<h3>程序流程示意</h3><pre>${esc(T(sc.programSketch))}</pre>`:''}<button class="close-cta" data-close>返回任务</button>`);
    }
    function showIdentity(){
       const examples=['llm','agentLoop','tools','fs','shell','approval','sessions','subagents','systemPrompt'];
       showModal(`${modalHead('VISUAL LANGUAGE')}<h2>不同能力，<br>用不同外形来区分。</h2><p>轮廓区分组件类型，顶面图标表达职责，短标记区分具体服务。悬停显示名称，点击查看说明。</p><div class="identity-grid">${examples.map(id=>`<div><span>${window.DSHIdentity.svg(id)}</span><b>${esc(byid[id].title)}</b><code>ctx.${id}</code></div>`).join('')}</div><h3>连线怎样阅读</h3><p>任务导览中的箭头表示当前示例数据的传递方向。剖面中的实线表示消费与实现关系；声明包使用虚线。它们均附方向箭头。</p><p>灰色网格和层板只用于帮助定位。六种颜色来自阅读分组，不代表官方规定的固定执行层级。</p><button class="close-cta" data-close>继续探索</button>`);
    }
    async function copyPrompt(){
       const value=T(currentScenario().prompt);
       try{
         if(!navigator.clipboard?.writeText)throw new Error('clipboard unavailable');
         await navigator.clipboard.writeText(value);toast('提示词已复制');
       }catch{
         showModal(`${modalHead('COPY PROMPT')}<h2>复制提示词</h2><textarea id="copy-text" class="copy-text" readonly data-raw>${esc(value)}</textarea><p>浏览器未开放剪贴板，请选中文本后复制。</p><button class="close-cta" data-close>返回任务</button>`);const box=$('#copy-text');box.focus();box.select();
       }
    }
    function download(name, text, type = 'application/json') { const blob = new Blob([text], { type }), url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); }
    function exportState() { download('dsh-inside-reading-position.json', JSON.stringify({ format: 'dsh-inside-reading-position-v1', commit: catalog.meta.commit, mode: state.mode, scenario: state.scenario, index: state.index, selected: state.selected, preset:state.preset, summaryVariant:state.summaryVariant, flat:state.flat, providers: state.providers, notice: '仅导出阅读位置和教学提供方选择，不是 DSH 运行配置。' }, null, 2)); toast('已导出阅读位置，不包含导入的日志。'); }
    const eventMap = {
        'turn/start': ['新一轮开始', '会话记录了本轮开始的边界。', 'sessions'],
        'turn/end': ['这一轮结束', '查看原始 reason 字段，区分普通完成、错误、取消或其他结束原因。', 'sessions'],
        'step/start': ['步骤开始', '这是会话中的步骤边界；具体工具与提供方需要更多事件才能判断。', 'sessions'],
        'step/end': ['步骤结束', '步骤结束已被记录，不等于整个用户任务已结束。', 'sessions'],
        'user/message': ['用户消息进入日志', '消息及其表面操作元数据按原样保留。', 'sessions'],
        'assistant/message': ['助手消息进入日志', '这是一条已提交的助手消息。网页不从它推算所有模型请求或内部调用。', 'sessions'],
        'assistant/attempt': ['助手尝试记录', '此类记录用于保存一次助手尝试，不能当作成功答复。', 'sessions'],
        'tool/call': ['工具调用记录', '调用记录不保证工具本体已经执行。批准、守卫或取消仍可能改变结果。', 'tools'],
        'tool/result': ['工具结果记录', '原文保存这次调用的结果；页面不根据工具名称猜测具体文件或进程提供方。', 'tools'],
        'tool/ptc-dispatch': ['程序内工具调用记录', '这是 PTC 程序内部子调用的记录，与顶层工具结果分开阅读。', 'ptcRuntime']
    };
    function redact(value, depth = 0) { if (depth > 25)
        return '[嵌套过深，显示已折叠]'; if (Array.isArray(value))
        return value.map(v => redact(v, depth + 1)); if (value && typeof value === 'object') {
        let out = Object.create(null);
        for (const [k, v] of Object.entries(value))
            out[k] = /^(authorization|api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|client[_-]?secret|private[_-]?key)$/i.test(k) ? '[已遮盖]' : redact(v, depth + 1);
        return out;
    } return value; }
    function parseTrace(text, name = 'SessionEvent') { if (new TextEncoder().encode(text).length > 8 * 1024 * 1024)
        throw new Error('文件超过 8 MiB，请先导出更小的单会话片段。'); let raw, metadata = null; const clean = text.replace(/^\uFEFF/, '').trim(); if (!clean)
        throw new Error('文件内容为空。'); try {
        const j = JSON.parse(clean);
        if (Array.isArray(j))
            raw = j;
        else if (j && Array.isArray(j.events)) {
            raw = j.events;
            metadata = j.meta || j.header || null;
        }
        else if (j && typeof j.type === 'string' && j.seq !== undefined)
            raw = [j];
        else
            throw new Error('shape');
    }
    catch (e) {
        try {
            raw = clean.split(/\r?\n/).filter(s => s.trim()).map((line, i) => { try {
                return JSON.parse(line);
            }
            catch {
                throw new Error(`第 ${i + 1} 行不是有效 JSON。`);
            } });
        }
        catch (inner) {
            throw new Error(inner.message || '无法识别文件，请导入标准化 SessionEvent 数据。');
        }
    } if (!Array.isArray(raw))
        throw new Error('需要事件数组、{ events: […] } 或逐行 SessionEvent。'); if (raw[0] && typeof raw[0] === 'object' && (raw[0]._dshInside || (!raw[0].type && raw[0].version !== undefined && raw[0].id !== undefined))) {
        metadata = raw.shift();
    } if (!raw.length)
        throw new Error('文件没有可显示的事件。'); if (raw.length > 20000)
        throw new Error('事件超过 20,000 条，请导出更小的单会话片段。'); const ids = new Set(); for (let i = 0; i < raw.length; i++) {
        const e = raw[i];
        if (!e || typeof e !== 'object' || Array.isArray(e) || typeof e.type !== 'string' || !e.type || e.type.length > 256 || !Number.isSafeInteger(e.seq) || e.seq < 0 || !Number.isFinite(e.time) || e.time < 0 || e.time > 8640000000000000 || !e.data || typeof e.data !== 'object' || Array.isArray(e.data))
            throw new Error(`第 ${i + 1} 条不符合 SessionEvent：需要 type、非负整数 seq、毫秒 time、对象 data。原始存储封装请先转换为事件数组。`);
        if (e.sessionId !== undefined)
            ids.add(String(e.sessionId));
    } if (ids.size > 1)
        throw new Error('检测到多个 sessionId。请分会话导出，避免把不同轨道拼成一条。'); const warnings = []; if (raw.some((e, i) => i > 0 && e.seq <= raw[i - 1].seq))
        warnings.push('seq 并非严格递增；按文件原始顺序显示，不重新排序。'); if (raw.some((e, i) => i > 0 && e.time < raw[i - 1].time))
        warnings.push('时间戳存在倒序；不计算执行耗时。'); const unknown = raw.filter(e => !eventMap[e.type]); if (unknown.length)
        warnings.push(`${unknown.length} 条事件未建立讲解映射，原文完整保留。`); if (unknown.some(e => !e.ignorable))
        warnings.push('包含未知的必需事件，无法据此重建会话；本页只作记录查看。'); const synthetic = metadata?._dshInside?.kind === 'synthetic'; return { name: String(name).slice(0, 160), events: raw, metadata, synthetic, warnings, unknown: unknown.length, steps: raw.map(e => { const m = eventMap[e.type]; return { title: m ? m[0] : '未映射事件', description: m ? m[1] : '原始事件已保留。当前版本没有解释其语义，不推断它会改变哪些运行状态。', nodes: [m ? m[2] : 'sessions'], kind: 'record', event: e.type }; }) }; }
    async function importFile(file) { if (!file)
        return; if (file.size > 8 * 1024 * 1024) {
        toast('文件超过 8 MiB，请导出更小的片段。');
        return;
    } try {
        const result = parseTrace(await file.text(), file.name);
        state.trace = result;
        state.mode = 'trace';
        state.index = 0;
        state.selected = result.steps[0].nodes[0];
        state.focus = false;
        state.playing = false;
        clearTimeout(playTimer);
        renderAll();
        updateHash();
        toast(`${result.synthetic ? '教学样本' : '文件'}已载入：${result.events.length} 条事件，全部留在本页内存中。`);
        say('已载入日志。' + result.warnings.join(' '));
    }
    catch (e) {
        toast('导入失败：' + e.message);
    }
    finally {
        $('#trace-file').value = '';
    } }
    function renderTraceSidebar() {
        const el = $('#sidebar');
        if (!state.trace) {
            el.innerHTML = `<span class="eyebrow">YOUR LOCAL SESSION</span><h1 class="catalog-heading">这次，看看<br>你的任务记录。</h1><p class="catalog-subtitle">在本地读取一个会话的事件文件。<br>保留原文，按文件顺序查看。</p><div class="trace-upload" id="drop-zone"><span class="upload-icon">⇧</span><p>拖入 JSON / JSONL<br>或点击选择文件</p><button class="upload-button" id="import-log">选择日志文件</button></div><p class="source-note">支持标准化 SessionEvent 数据。<br>最大 8 MiB / 20,000 条。<br>无需 API Key，文件不上传。</p><button class="text-button" id="sample-log">下载带标识的教学样本 ↗</button>`;
            const d = $('#drop-zone');
            d.ondragover = e => { e.preventDefault(); d.style.borderColor = '#73e2de'; };
            d.ondragleave = () => { d.style.borderColor = ''; };
            d.ondrop = e => { e.preventDefault(); d.style.borderColor = ''; importFile(e.dataTransfer.files[0]); };
            return;
        }
        const tr = state.trace;
        el.innerHTML = `<span class="eyebrow">${tr.synthetic ? 'SYNTHETIC EXAMPLE' : 'LOCAL EVENT FILE'}</span><h1 class="catalog-heading">${tr.synthetic ? '教学样本' : '会话记录'}</h1><p class="trace-meta">${esc(tr.name)}<br>${tr.events.length} 条事件 · ${tr.unknown} 条未映射</p>${tr.synthetic ? '<p class="warning-note">该文件为格式演示，未运行 DSH。</p>' : ''}${tr.warnings.length ? `<p class="warning-note">${tr.warnings.map(esc).join('<br>')}</p>` : ''}<button class="text-button" id="replace-log">载入其他文件</button><span style="margin:0 10px;color:#344b64">/</span><button class="trace-clear" id="clear-log">清除记录</button><div id="trace-events" class="trace-events"></div><p class="trace-list-note">事件列表显示当前位置附近的记录。底部滑块可以到达任意一条。</p>`;
        renderTraceEvents();
    }
    function renderTraceEvents() { const el = $('#trace-events'); if (!el || !state.trace)
        return; const events = state.trace.events, start = Math.max(0, state.index - 7), end = Math.min(events.length, start + 25); el.innerHTML = events.slice(start, end).map((e, j) => `<button class="trace-event ${start + j === state.index ? 'active' : ''}" data-jump="${start + j}"><b>#${e.seq}</b><span>${esc(e.type)}</span></button>`).join(''); }
    function sampleEvents() { const base = 1788512400000; const events = [['turn/start', { turn: 1 }], ['step/start', { turn: 1, step: 1 }], ['user/message', { role: 'user', content: [{ type: 'text', text: '教学样例：读取一个文件' }] }], ['assistant/message', { turn: 1, step: 1, message: { role: 'assistant', content: [{ type: 'text', text: '此处仅展示事件格式，不是实测输出。' }] } }], ['tool/call', { turn: 1, step: 1, example: '工具调用数据仅用于演示' }], ['tool/result', { turn: 1, step: 1, example: '未访问真实文件' }], ['step/end', { turn: 1, step: 1 }], ['step/start', { turn: 1, step: 2 }], ['assistant/message', { turn: 1, step: 2, message: { role: 'assistant', content: [{ type: 'text', text: '教学样例结束' }] } }], ['step/end', { turn: 1, step: 2 }], ['turn/end', { turn: 1, reason: { kind: 'completed' } }]].map(([type, data], seq) => ({ type, seq, time: base + seq * 800, data })); return [{ _dshInside: { kind: 'synthetic', notice: '人工编写的 UI 导入测试样本。仅符合查看器的事件外层格式，不是可供 DSH 恢复的有效会话日志。' } }, ...events]; }
    function downloadSample() { download('dsh-inside-demo.synthetic.jsonl', sampleEvents().map(e => JSON.stringify(e)).join('\n') + '\n', 'application/x-ndjson'); toast('下载的是教学格式样本，未执行真实 DSH 任务。'); }
    function showFormat() { showModal(`${modalHead('SESSIONEVENT READER')}<h2>导入边界，先讲清楚。</h2><p>查看器接受一个会话的标准化事件数组、{ events: […] }，或一行一条事件的 JSONL。它验证外层结构，不校验每个插件事件的完整业务结构。</p><pre>${esc(JSON.stringify({ type: 'turn/start', seq: 0, time: 1788512400000, data: { turn: 1 } }, null, 2))}</pre><p>原始后端存储可能包含版本头、继承前缀或其他封装；出现不支持的结构时请先导出为上述事件形式。未知事件完整保留，不会默默丢弃。页面不会尝试恢复会话或推断未记录的 seam 调用。</p><p>日志可能含敏感内容。当前网页不发送任何日志网络请求；显示时会按字段名称遮盖常见密钥字段。重载或清除后，页面不保留导入记录。</p><button class="close-cta" id="sample-modal">下载教学样本</button><p class="modal-footnote">教学样本仅供测试查看器，事件内容未经过完整 DSH schema 校验，不能用于恢复真实会话。</p>`); }
    // Delegated events keep controls functional after panel re-rendering.
    document.addEventListener('click', e => { const b = e.target.closest('button,a'); if (!b)
        return; if(b.dataset.openCase){openCase(b.dataset.openCase);return;}
       if(b.dataset.openPreset){state.preset=b.dataset.openPreset;setMode('modes');return;}
       if(b.dataset.choosePreset){state.preset=b.dataset.choosePreset;renderAll();updateHash();return;}
              if(b.dataset.caseFilter){state.caseFilter=b.dataset.caseFilter;renderAll();return;}
       if(b.dataset.summaryBranch){chooseBranch(b.dataset.summaryBranch);return;}
       if (b.dataset.mode) setMode(b.dataset.mode); if (b.dataset.service)
        selectService(b.dataset.service); if (b.dataset.jump !== undefined && !b.disabled)
        jump(Number(b.dataset.jump)); if (b.dataset.filter) {
        state.filter = b.dataset.filter;
        renderCatalogResults();
    } if (b.dataset.tab) {
        state.tab = b.dataset.tab;
        renderInspector();
    } if (b.dataset.provider) {
        state.providers[b.dataset.for] = b.dataset.provider;
        state.selected = b.dataset.for;
        state.focus = true;
        state.playing = false;
        clearTimeout(playTimer);
        renderInspector();
        renderTransport();
        syncScene();
        toast(`正在观察 ${b.dataset.provider}。这是结构演示，未更改真实配置。`);
    } if (b.hasAttribute('data-close'))
        $('#modal').close(); const actions = { 'copy-prompt':copyPrompt, 'view-fixtures':showFixtures,'view-deliverables':showDeliverables, 'jump-result':()=>jump(steps().length-1), 'identity-legend':showIdentity, home: () => setMode('home'), help: showHelp, about: showAbout, 'commit-button': showAbout, 'view-overview': () => {state.flat=false;focusToggle(false);}, 'view-flat': () => flatToggle(true), 'view-focus': () => focusToggle(true), 'view-reset': () => { renderer?.reset(); toast('视角已复位'); }, 'view-top': () => renderer?.top(), 'motion-toggle': () => { state.reduced = !state.reduced; syncScene(); }, 'prev-step': () => jump(state.index - 1), 'next-step': () => jump(state.index + 1), play: () => setPlaying(!state.playing), 'prev-service': () => serviceMove(-1), 'next-service': () => serviceMove(1), 'export-state': exportState, 'related-journey': findRelated, 'import-log': () => $('#trace-file').click(), 'replace-log': () => $('#trace-file').click(), 'import-footer': () => $('#trace-file').click(), 'sample-log': downloadSample, 'sample-footer': downloadSample, 'sample-modal': downloadSample, 'example-format': showFormat, 'clear-log': () => { state.trace = null; state.index = 0; state.playing = false; state.focus = false; clearTimeout(playTimer); renderAll(); toast('已从页面内存清除日志'); } }; actions[b.id]?.(); });
    $('#explode').addEventListener('input', e => renderer?.setState({ explosion: Number(e.target.value) }));
    $('#trace-file').addEventListener('change', e => importFile(e.target.files[0]));
    $('#modal').addEventListener('close', () => { lastFocus?.focus?.(); });
    $('#modal').addEventListener('click', e => { const r = $('#modal').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
        $('#modal').close(); });
    document.addEventListener('keydown', e => { if ($('#modal').open || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable)
        return; if (e.ctrlKey || e.metaKey || e.altKey)
        return; const k = e.key.toLowerCase(); if(['home','library','modes'].includes(state.mode)&&!['/','?'].includes(k))return; if (k === ' ') {
        e.preventDefault();
        setPlaying(!state.playing);
    } if (k === 'arrowright') {
        e.preventDefault();
        state.mode === 'atlas' ? serviceMove(1) : jump(state.index + 1);
    } if (k === 'arrowleft') {
        e.preventDefault();
        state.mode === 'atlas' ? serviceMove(-1) : jump(state.index - 1);
    } if (k === '/') {
        e.preventDefault();
        setMode('atlas');
        $('#service-search').focus();
    } if (k === 'f')
        focusToggle(); if (k === 'p')
        flatToggle(!state.flat); if (k === 'r')
        renderer?.reset(); if (k === 'escape') { state.flat=false; focusToggle(false); } if (k === '?')
        showHelp(); });
    function initFromHash(){
      const q=new URLSearchParams(location.hash.slice(1));if(!q.has('view'))state.mode='home';q.set('task',window.DSHCasePaths.resolveCaseId(q.get('task')));
      if(scenarios.some(s=>s.id===q.get('task')))state.scenario=q.get('task');
      if(['home','library','modes','journey','atlas','trace'].includes(q.get('view')))state.mode=q.get('view');
      state.preset=currentScenario().preset;
      if(window.DSHStudy.presets.some(m=>m.id===q.get('preset'))&&state.mode==='modes')state.preset=q.get('preset');
      state.summaryVariant=currentScenario().variants?.[q.get('branch')]?q.get('branch'):currentScenario().defaultVariant;state.decisionAcknowledged=false;
      if(state.mode==='atlas'&&byid[q.get('seam')])state.selected=q.get('seam');
      else if(state.mode==='journey'){state.index=Math.max(0,Math.min(steps().length-1,(parseInt(q.get('step'))||1)-1));state.selected=current().nodes[1]||current().nodes[0];}
      state.focus=state.mode==='atlas';
    }
    window.addEventListener('dsh-preferences',()=>{
       const scroll=$('#inspector').scrollTop,queryFocus=document.activeElement?.id==='service-search';
       renderAll();$('#inspector').scrollTop=scroll;window.DSHLocale.refresh();
       if(queryFocus)$('#service-search')?.focus();
    });
    window.addEventListener('hashchange',()=>{state.playing=false;clearTimeout(playTimer);initFromHash();renderAll();if(state.mode==='home'){const q=new URLSearchParams(location.hash.slice(1));window.DSHExperience.home.go(Number(q.get('chapter'))||0,false);window.DSHExperience.home.updateScroll();}});
    initFromHash();
    renderAll();
    renderer = new window.DSHRenderer($('#scene'), catalog, (id, p) => { if (id.startsWith('provider:')) {
        const name = id.slice(9);
        const s = byid[state.selected];
        if (s?.implementations.includes(name)) {
            state.providers[s.id] = name;
            renderInspector();
            syncScene();
            toast(`结构示意：${name}。没有安装或切换真实插件。`);
        }
    }
    else if (byid[id])
        selectService(id);
    else if (id.startsWith('consumer:'))
        toast('这是官方列出的消费包。完整名单在右侧“源码”中。');
    else if (id.startsWith('owner:'))
        toast('声明包定义这项服务的接口与职责。'); }, error => { renderError = error; if (error)
        renderFallback();
    else {
        $('#no-webgl').hidden = true;
        $('#scene').style.opacity = '';
        $('#projected-labels').style.display = '';
    } });
    syncScene();
    // Read-only test surface; no traces are persisted or sent outside this document.
    window.DSHInside = { version:'5.0.0',presets:window.DSHStudy.presets,setMode,openCase,getSteps:steps, catalog, scenarios, setLanguage:window.DSHLocale.setLanguage, setTheme:window.DSHLocale.setTheme, parseTrace, sampleEvents, getState: () => ({ ...state, language:window.DSHLocale.language, theme:window.DSHLocale.theme, trace: state.trace ? { events: state.trace.events.length, synthetic: state.trace.synthetic } : null }), getRenderer: () => renderer, goTo: (id, index = 0) => { setMode('journey'); scenarioChange(id); jump(index); }, select: (id) => { setMode('atlas'); selectService(id); }, getDiagnostics: () => ({ services: services.length, seams: services.filter(s => s.role === 'seam').length, webgl: !renderError && !renderer?.software, backend: renderError ? 'text-fallback' : renderer?.software ? 'canvas-3d' : 'webgl', error: renderError?.message || null, frames: renderer?.frames || 0, glyphs:window.DSHIdentity?Object.keys(window.DSHIdentity.specs).length:0, arrows:renderer?.frameArrows?.length||0, language:window.DSHLocale.language, theme:window.DSHLocale.theme, flat:state.flat, transition:renderer?.transitionT ?? 1, activeStrengths:renderer?.points?.filter(p=>p.selectable&&!p.pseudo).slice(0,80).map(p=>[p.id,p.strength])||[] }) };
})();
