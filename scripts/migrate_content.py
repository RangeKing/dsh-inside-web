"""Migrate the preserved v4 teaching data to the reviewed upstream baseline."""
from pathlib import Path
import json, re, tarfile, copy

ROOT=Path(__file__).resolve().parents[1]
SHA='ddefc45fbc7f8e46dd73185e68295696d1297887'
VERSION='0.1.6-alpha.2'
with tarfile.open(ROOT/'archive/pre-redesign-20260918.tar.gz') as archive:
    html=archive.extractfile('DSH-Inside-v4.html').read().decode()
def embedded(id):return json.loads(re.search(r'<script type="application/json" id="'+id+r'">(.*?)</script>',html,re.S)[1])
catalog=embedded('catalog-data'); scenarios=embedded('scenario-data'); modes=embedded('modes-data'); locale=embedded('locale-data')
def tr(zh,en):locale[zh]=en;return zh
def save(path,data): (ROOT/path).write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def walk(obj,fn):
    if isinstance(obj,dict):return {k:walk(v,fn) for k,v in obj.items()}
    if isinstance(obj,list):return [walk(v,fn) for v in obj]
    return fn(obj) if isinstance(obj,str) else obj
def replace(s):return s.replace('codeRuntime','ptcRuntime').replace('tool/code-dispatch','tool/ptc-dispatch').replace('虎鲸','大肥鲸')
scenarios=walk(scenarios,replace);modes=walk(modes,replace)
old={x['id']:x for x in catalog['services']}
titles={
'pluginManager':('插件管理','Plugin Manager'),'profileContext':('启动配置','Profile context'),'hmr':('配置热更新','Configuration HMR'),
'connection':('浏览器连接','Browser connection'),'mcpResources':('MCP 资源','MCP resources'),'browserUse':('浏览器操作接口','Browser-use registry'),
'computerUse':('电脑操作接口','Computer-use registry'),'officeToPdf':('文档转 PDF','Office to PDF'),'terminalController':('交互终端入口','Terminal controller'),
'workspaceFiles':('工作区文件入口','Workspace files'),'workspaceChanges':('工作区改动','Workspace changes'),'sessionFeedback':('会话反馈','Session feedback'),
'ssh':('SSH 执行连接','SSH execution'),'ptcRuntime':('程序化工具运行时','PTC runtime')}
services=[]
table=(ROOT/'docs/upstream/docs/capability-seams.md').read_text().splitlines()
for line_no,line in enumerate(table,1):
    if not line.startswith('| `ctx.'):continue
    columns=[s.strip() for s in line.strip('|').split('|')]
    id=re.search(r'`ctx\.([^`]+)`',columns[0])[1]
    owner_match=re.search(r'\[`([^`]+)`\]\(\.\./([^)]*)\)',columns[2])
    owner,path=owner_match.groups() if owner_match else (columns[2].strip('`'),'packages/experimental/inspector')
    def names(s):return re.findall(r'`([^`]+)`',s)
    base=copy.deepcopy(old.get(id,{}))
    title=titles.get(id,(base.get('title',id),locale.get(base.get('title',id),id)))
    base.update(id=id,role=columns[1].strip('`'),owner=owner,path=path,implementations=names(columns[3]),consumers=names(columns[4]),sourceLine=line_no,docIndex=line_no-472,upstreamNote=columns[-1])
    base['title']=tr(*title)
    base.setdefault('group',4 if id in ['ptcRuntime','ssh','browserUse','computerUse'] else 5)
    base.setdefault('description',tr(f'由 {owner} 插件提供的服务。具体接口与边界见官方说明。',f'A service owned by {owner}. See the official reference for its contract and boundaries.'))
    base['detail']=tr('本图列出锁定版本的静态服务关系。是否调用取决于配置和任务；这些连线不是实测轨迹。','Static service relationships at the pinned revision. Actual calls depend on configuration and task; these lines are not an observed trace.')
    services.append(base)
catalog['services']=services
catalog['meta'].update(commit=SHA,version=VERSION,commitDate=json.loads((ROOT/'docs/upstream/commit.json').read_text())['date'],reviewedAt='2026-09-18',provenance='官方 capability-seams 服务表逐项解析；八个案例对照当前包文档、预设配置与执行管线。空间位置、任务数据和动画为教学编排。')
byid={s['id']:s for s in services}
byid['dynamicCordisRunner']['description']=tr('上游生成服务表仍列出的内部服务；当前 Creator 的公开工具只做只读检查，持久插件变更由 Plugin Manager 管理。','An internal service still listed in the generated upstream catalog. Current Creator tools expose read-only inspection; Plugin Manager owns persistent plugin changes.')
byid['ptcRuntime']['description']=tr('运行程序并连接宿主提供的异步工具绑定。工具呈现由 tools 负责，工作流编排由 workflow-ptc 负责。','Runs programs against host async bindings. Tools owns PTC presentation; workflow-ptc owns workflow orchestration.')
byid['compaction']['description']=tr('基础实现可在 agent/pre-step 检查压力，先裁剪工具结果、再按需摘要；也支持命令触发和溢出恢复。','The basic backend can check pressure at agent/pre-step, prune tool results and summarize as needed; command-triggered compaction and overflow recovery are also supported.')

def source(step,path,needle):
    lines=(ROOT/'docs/upstream'/path).read_text().splitlines()
    matches=[i for i,line in enumerate(lines,1) if needle.lower() in line.lower()]
    if not matches:raise ValueError((path,needle))
    start=matches[0];step.update(source=path,lines=[start,min(start+5,len(lines))],code='')
    step['reviewedAt']='2026-09-18';step['evidence']='source-backed teaching sequence'

ARCH='docs/architecture.md';TOOLS='docs/tool-execution-pipeline.md';FS='packages/fs/tool-fs/README.md';COMP='packages/compaction/compaction-basic/README.md';SUB='docs/subsystems/subagent.md';PRE='packages/preset/agent-presets/README.md';MANAGER='packages/boot/plugin-manager/README.md';INSPECT='packages/extensions/tool-cordis/README.md'
descriptions={
'meet-dsh':[
('收到任务后，会话记录与 Agent 执行负责不同的事。这里使用预先编排的任务，不会读取你的文件。','Session records and agent execution have different jobs. This prewritten task does not read your files.'),
('提示词和工具声明由插件组合。模型只能使用本次请求暴露的工具，不能凭空调用能力。','Plugins assemble prompt sections and tool declarations. The model can use only the tools exposed in this request.'),
('工具调用先经过策略和守卫，再由文件工具读取资料。工具结果进入后续模型步骤。','Policy and guards precede the file read. The tool result becomes input to a later model step.'),
('模型依据已读取资料组织答复。页面展示结果与工具交接，不展示隐藏思考。','The model writes a response from the retrieved material. This page shows outcomes and tool handoffs, not hidden reasoning.'),
('工具结果和助手输出是会话中的持久事实。没有待处理工作时，本轮结束；持久化由相应插件处理。','Tool results and assistant output are durable session facts. The turn ends when no work is owed; persistence is handled by its plugin.')],
'photos':[
('本例明确假设已配置“移动前询问”的执行策略。自然语言提示本身不等于强制审批。','This case assumes an ask-before-moving execution policy. A natural-language request alone is not an enforced policy.'),
('先读取原创照片清单，提出归档方案。此时尚未移动任何文件。','Read the sample photo list and propose folders. No files have moved yet.'),
('策略在 tools/pre-execute 阶段要求一次性确认。用户答复到来前，工具本体尚未执行。','Policy asks for one-shot approval during tools/pre-execute. The tool body has not run while the reply is pending.'),
('拒绝、取消或无法获得答复都会阻止这次工具本体运行。这里演示用户拒绝。','Refusal, cancellation, or an unavailable answer prevents this tool body from running. This branch shows refusal.'),
('拒绝结果仍会经过结果处理并形成 tool/result。它不是“文件移动成功”。','The refusal still passes through result handling and becomes tool/result. It is not a successful file move.'),
('助手说明操作未执行，并保留已有文件。教学时间线结束不代表真实 DSH 执行完成。','The assistant explains that nothing moved. Ending this teaching timeline is not proof of a real DSH run.')],
'shopping':[
('任务是修改共享采购单。这里明确启用文件观察策略，避免把保护机制说成所有配置都必然具备。','Update a shared shopping list. The file-observation policy is explicitly enabled in this case.'),
('read 成功后记录已观察版本；后续修改针对这个版本进行检查。','A successful read records the observed version, which later mutations validate.'),
('另一位家人添加了鸡蛋。这是教学中编排的外部更新，不是当前 Agent 的写入。','A family member adds eggs. This is a scripted external update, not a write by the current agent.'),
('当前文件与已观察版本不同，写入被拒绝并返回 FS_STALE_VERSION，提示先重新读取。','The file no longer matches the observed version. FS_STALE_VERSION refuses the mutation and requests a fresh read.'),
('重新读取确认新增的鸡蛋仍在，再基于当前内容构造修改。','Read again, retain the newly added eggs, and prepare the edit against current content.'),
('只修改目标行。文件工具的受保护修改不等于任意 Shell 写文件也有相同保证。','Edit only the intended line. Guarded file-tool mutations do not imply identical protection for arbitrary shell writes.'),
('汇报牛奶数量已更新，鸡蛋保留。这里的具体文本来自可核对的教学资料。','Report the new milk quantity with the eggs preserved. The exact text comes from inspectable teaching fixtures.')],
'registration':[
('三张表共 12 条报名记录，去重键是学号。先确定规则，再动数据。','The three tables contain 12 rows. Student ID is the deduplication key.'),
('PTC 把工具呈现为 run_code；内部工具仍存在，只是通过程序中的 SDK 绑定调用。','PTC presents run_code. Internal tools still exist and are called through program SDK bindings.'),
('模型提供程序；PTC 运行时执行程序并连接异步工具绑定。这不等于绕过工具权限。','The model supplies a program; the PTC runtime executes it against async tool bindings. Tool policy still applies.'),
('顶层 run_code 与内部子调用都经过工具管线，子调用使用 tool/ptc-dispatch 记录。','Both run_code and its sub-calls pass through the tool pipeline. Sub-calls use tool/ptc-dispatch records.'),
('程序汇总得到 9 个不同学号，S02、S03、S07 重复。Standard 也能用 Shell 脚本计算，不声称 PTC 必然更快。','The program finds 9 unique IDs; S02, S03 and S07 repeat. Standard can also use shell scripts; no speedup is claimed.'),
('程序把需要的汇总返回模型，再组织最终说明。示例数据可以在资料面板核算。','The program returns a compact summary for the final response. You can check the figures in the materials panel.'),
('结果被记录，任务结束。网页里的去重演示不调用真实模型。','Record the outcome and finish the task. This teaching page makes no real model call.')],
'welcome-event':[
('同一个活动需要检查场地与预算，两个子问题的资料和目标都先界定。','The event needs venue and budget checks. Bound each subtask with its own inputs and goal.'),
('主 Agent 通过已配置的 subagents 提供方委派。本例选择内置进程内子 Agent，不代表所有提供方相同。','Delegate through a configured subagents provider. This case uses in-process agents; other providers differ.'),
('子 Agent 加入父级预设组合，同时有各自会话状态。画面中的两个岗位是教学角色。','Child agents join the parent preset composition while keeping separate session state. The two roles are teaching labels.'),
('场地只能容纳 80 人，而计划有 120 人：缺少 40 个位置。','The venue holds 80 people, but 120 are planned: a shortfall of 40 places.'),
('餐费 120 × 12 元，加 120 元材料费，共 1560 元，超出 1500 元预算 60 元。','Meals cost 120 × 12 plus 120 for materials: 1560 total, 60 above the 1500 budget.'),
('主 Agent 汇总两个结果。不能仅凭两个动画同时亮起，就声称真实调用并行发生。','The parent combines both results. Simultaneous animation alone is not evidence of real parallel execution.'),
('交付容量和预算问题，并提出调整建议；不把未解决的问题标为成功举办。','Deliver the capacity and budget issues with recommendations; do not claim the event is ready.')]
}

for sc in scenarios:
    sid=sc['id']
    if sid=='make-tool':continue
    sc['reviewedAt']='2026-09-18';sc['reviewedCommit']=SHA
    sc['environment']=replace(sc['environment'])
    all_steps=[sc['steps']]+list(sc.get('presetRoutes',{}).values())+[v['steps'] for v in sc.get('variants',{}).values()]
    for steps in all_steps:
        for i,st in enumerate(steps):
            st['event']=st.get('event','').replace('session/event · session/flush','session/event · turn/end')
            if sid in descriptions and i<len(descriptions[sid]):st['description']=tr(*descriptions[sid][i])
            if st['kind']=='log':source(st,ARCH,'Session log')
            elif sid=='photos':source(st,TOOLS,'approval' if i in [2,3] else 'tools/pre-execute')
            elif sid=='shopping':source(st,FS,'FS_STALE_VERSION' if i in [2,3,4,5] else 'observation')
            elif sid=='registration':source(st,TOOLS,'PTC mode')
            elif sid=='welcome-event':source(st,PRE,'child agent')
            elif sid=='voyage':source(st,COMP,'pruner' if i==4 else 'summary' if 3<=i<=6 else 'Use this package')
            elif sid=='dinner':source(st,f"packages/preset/agent-presets/presets/{sc['preset']}/agent.cordis.yml",'name:')
            else:source(st,ARCH,'Turn flow')
    if sid=='voyage':
        for steps in all_steps:
            for i,st in enumerate(steps):
                if 3<=i<=6:st['insight']=tr('上下文压力百分比是讲解用数值；压缩阈值依配置与模型窗口而定。可选 pruner 可能让摘要调用不再必要。','Pressure percentages are illustrative. Thresholds depend on configuration and model window; the optional pruner may avoid summarization.')
    if sid=='dinner':
        sc['presetRoutes']['cordis']=copy.deepcopy(sc['presetRoutes']['standard'])
        sc['presetRoutes']['cordis'][1]['insight']=tr('Creator 也能直接使用现有工具。算一顿饭无需安装插件；有重复需求时再扩展。','Creator can use existing tools directly. Splitting one bill needs no new plugin; extend when reuse warrants it.')
        for preset,steps in sc['presetRoutes'].items():
            for st in steps:source(st,f'packages/preset/agent-presets/presets/{preset}/agent.cordis.yml','name:')

company=next(s for s in scenarios if s['id']=='make-tool')
company.clear();company.update(id='pixel-company',rank=8,preset='cordis',difficulty=tr('进阶','Advanced'),synthetic=True,reviewedAt='2026-09-18',reviewedCommit=SHA,company=True,
 name=tr('把 DSH 变成一家像素风 AI 公司','Turn DSH into a pixel-art AI company'),
 label=tr('大肥鲸开公司：办公室是插件，第一单是番茄钟。','The Big Whale starts a company: an office plugin, then a Pomodoro order.'),
 task=tr('安装一个像素办公室插件，再用它讲清一项任务的分工与交付。','Install a pixel-office plugin, then explain task delegation and delivery.'),
 prompt=tr('请把 DSH 变成一家像素风 AI 公司。先检查接口，制作并安装办公室插件，确认生效。第一单：给大肥鲸做一个能开始、暂停和复位的番茄钟网页，并检查暂停后倒计时是否停止。','Turn DSH into a pixel-art AI company. Inspect APIs, create and install an office plugin, and confirm activation. First order: build a Pomodoro page with start, pause and reset; test that pause actually stops the countdown.'),
 environment=tr('教学假设：Web Profile、Creator 预设、可用的 Plugin Manager 与客户端页面。所有安装和 Agent 状态均为编排示例。','Teaching assumptions: Web profile, Creator preset, Plugin Manager and a connected client. All installation and agent states are scripted examples.'),
 story=tr('老板只带来一句需求，办公室却要忙起来。先把像素办公室装成插件，再让设计、开发、测试按任务板分工；发现一个暂停 bug，修好再交付。','One request gets the office moving. Install the office plugin, then assign design, development and testing. Find a pause bug, fix it, and deliver.'),
 features=[tr('持久插件','Persistent plugins'),tr('岗位分工','Role-based tasks'),tr('检查与返工','Test and revise')],
 learn=tr('区分检查接口、安装保存、运行时生效与实际使用。像素员工是教学状态的可视化，不是独立运行的真实 Agent。','Separate API discovery, saved installation, runtime activation and actual use. Pixel employees visualize teaching states, not independent live agents.'),
 output=tr('示例办公室呈现任务分工；番茄钟示例支持开始、暂停、复位。实际 DSH 插件未在本网站安装。','The sample office shows task roles. The timer supports start, pause and reset. This website does not install a real DSH plugin.'),
 files=[{'path':'office-brief.txt','origin':'original','content':'像素办公室：协调、设计、开发、测试。界面展示任务板与交付区。\n订单：25 分钟番茄钟，支持开始、暂停、复位；暂停后时间不得继续减少。','contentEn':'Pixel office: coordinator, designer, developer, tester. Show a task board and deliverables.\nOrder: a 25-minute Pomodoro timer with start, pause and reset. Time must not decrease while paused.'}],steps=[])
company_steps=[
('接单：先开公司，再做番茄钟','Take the order: office first, timer next','把插件安装与业务任务分成两段，避免“办公室出现了”等于“任务完成了”的误解。','Separate plugin setup from the work order. An office appearing does not mean a task is complete.',['agents','sessions'],'Session command',ARCH,'Profiles and bundles','queued'),
('检查当前 Host 与 Client 接口','Inspect Host and Client APIs','用只读检查发现实际可用接口；客户端查询需要已连接页面。不能靠猜测挂载槽位。','Read-only inspection discovers real APIs. Client queries need a connected page; mounting points must not be guessed.',['cordisInspect','clientModules'],'cordis_inspect_list / cordis_inspect_query',INSPECT,'Use this package','inspect'),
('制作办公室插件包','Prepare the office plugin bundle','按检查到的接口制作客户端组件与 bundle 配置。此处的办公室图像是 AI 生成的教学素材，不是官方界面。','Prepare client components and a bundle using verified APIs. This office image is AI-generated teaching art, not an official screenshot.',['pluginManager','fs','clientModules'],'plugin authoring (teaching)',MANAGER,'bundle','build'),
('安装并检查应用状态','Install and inspect application status','Plugin Manager 安装持久 bundle。保存成功和运行时生效分别检查；restart-required 表示仍需重启。','Plugin Manager installs a persistent bundle. Check saved state separately from activation; restart-required still needs a restart.',['pluginManager','hmr'],'plugin_manager / install_bundle',MANAGER,'application','install'),
('确认办公室可用，再分派订单','Confirm the office works; assign the order','本教学分支假设 application: applied，且浏览器组件已同步显示。主 Agent 再把设计、开发、测试的任务边界写清楚。','This branch assumes application: applied and successful browser synchronization. The parent then defines design, development and testing tasks.',['pluginManager','clientModules','subagents'],'activation + visible client check',MANAGER,'Browser synchronization','assign'),
('设计与开发：别把暂停键画成摆设','Design and build: pause must actually pause','设计给出清楚的按钮和状态；开发实现番茄钟。岗位对应教学中的子任务，具体执行取决于配置的委派提供方。','Design defines clear controls and states; development implements the timer. Roles are teaching subtasks; real delegation depends on the provider.',['subagents','fs','tools'],'bounded subagent tasks',PRE,'child agent','work'),
('测试发现：暂停后还在偷偷倒数','Test finds the countdown keeps running','测试按明确条件复查暂停行为，发现旧实现仍在计时。这里是编排的失败分支，不能把失败画成已通过。','Test the pause condition and find that the old implementation still counts down. This is a scripted failure branch, not a passed test.',['subagents','shell','tools'],'test failed (teaching branch)',TOOLS,'tool/result','bug'),
('修复后复测，交付可用示例','Fix, retest, and deliver the sample','开发修正计时状态，再检查开始、暂停、复位。下方可打开本网站的实际番茄钟示例。','Correct the timer state, then check start, pause and reset. Open this website’s working timer sample below.',['subagents','tools','sessions'],'test passed + delivery (teaching)',ARCH,'Session log','done'),
('下班：停用与移除也是生命周期','Clock out: disable or remove the plugin','Plugin Manager 可停用 bundle，停用保留依赖；移除涉及卸载与依赖变更。不要把教学按钮当成对本机 DSH 的操作。','Plugin Manager can disable a bundle while keeping its dependency; removal involves unload and package changes. Teaching controls do not operate your local DSH.',['pluginManager','sessions'],'plugin lifecycle',MANAGER,'Disabling retains','closed')]
for i,(title,en,description,en_desc,nodes,event,path,needle,phase) in enumerate(company_steps):
    st={'title':tr(title,en),'description':tr(description,en_desc),'nodes':nodes,'kind':'blocked' if phase=='bug' else 'delegate' if phase in ['assign','work'] else 'tool','event':event,'insight':company['learn'],'payload':{'example':'synthetic','phase':phase},'runtime':{'status':tr(title,en),'input':company['task'],'output':tr(description,en_desc),'packet':event,'synthetic':True,'turn':1,'phase':i+1},'flow':{'from':nodes[0],'to':nodes[-1],'label':event},'companyPhase':phase}
    st['kind']=['input','context','tool','tool','runtime','delegate','blocked','tool','log'][i]
    source(st,path,needle);company['steps'].append(st)
company['resultIndex']=7;company['chapterCount']=len(company['steps'])

for mode in modes:
    if mode['id']=='cordis':
        mode.update(title=tr('给 DSH 装上新本领','Install new capabilities'),blurb=tr('检查运行时接口，通过 Plugin Manager 管理持久插件。','Inspect runtime APIs and manage persistent plugins with Plugin Manager.'),tools=['Standard tools','cordis_inspect_list','cordis_inspect_query','plugin_manager'],
        strengths=tr('制作或安装可复用的工具与界面，例如像素办公室。','Create or install reusable tools and interfaces, such as a pixel office.'),limits=tr('变更属于当前 Profile；保存、Host 生效和浏览器同步分别检查。','Changes belong to the current profile. Check saving, Host activation and browser synchronization separately.'),delta=tr('Creator 增加只读检查与插件管理；安装能力不等于所有操作都已授权。','Creator adds read-only inspection and plugin management. Available capabilities do not imply permission for every action.'),snippet="- id: tool-cordis\n  name: '@deepseek-ai/dsh-tool-cordis'\n- id: tool-plugin-manager\n  name: '@deepseek-ai/dsh-plugin-manager/tools'",nodes=['tools','cordisInspect','pluginManager','clientModules','skills','compaction'],route=tr('读取小票 → 用现有工具计算 → 汇报；需要复用时再安装插件','Read receipts → calculate with existing tools → report; install a plugin only when reuse warrants it'),cells=[tr('原生工具 + 检查 + 插件管理','Native tools + inspection + plugin management'),tr('加入插件开发指导','Plugin development guidance'),'已挂载','含配置编写技能','spawn / fork','已挂载',tr('只读检查与持久插件管理','Read-only inspection and persistent plugin management')])
    if mode['id']=='ptc':mode['snippet']=tr('# PTC：tools 管理 run_code 呈现，ptcRuntime 运行程序。\n# 内部子调用仍通过工具执行管线。','# PTC: tools owns run_code presentation; ptcRuntime executes programs.\n# Sub-calls still pass through the tool pipeline.')
    mode['reviewedCommit']=SHA

# Retire stale source snippets; keep inspectable, explicitly authored reading notes.
scenarios[0]['files']=[{'path':'source-reading-map.txt','origin':'original','content':'Harness 基于 Cordis 的插件组合。\nSession 保存事件；Agent Loop 推进任务；tools 管理工具与执行管线。\n所有空间位置与动画均为本站教学设计。','contentEn':'The harness is a Cordis plugin composition.\nSession records events; Agent Loop advances tasks; tools owns the tool registry and execution pipeline.\nSpatial layouts and animations are this site’s teaching design.','sourceUrl':f'https://github.com/deepseek-ai/deepseek-harness/blob/{SHA}/docs/architecture.md'}]
# Keep common wording in the bilingual dictionary aligned with renamed PTC IDs.
locale={replace(k):replace(v) for k,v in locale.items()}
for zh,en in [('接口、提供方与使用方','Contract, providers and consumers'),('本步骤参与的组件','Components in this step'),('声明','Definition'),('实现方','Providers'),('调用方','Consumers')]:locale[zh]=en
save('data/catalog.json',catalog);save('data/scenarios.json',scenarios);save('data/modes.json',modes);save('data/locale.json',locale)
print(f'Migrated {len(services)} services and {len(scenarios)} cases to {VERSION}; source-backed teaching, not live execution.')
