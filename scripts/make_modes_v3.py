from pathlib import Path
import json
R=Path(__file__).resolve().parents[1];L=json.loads((R/'data/locale.json').read_text())
def t(z,e):L[z]=e;return z
base='packages/preset/agent-presets/presets/'
data=[
 dict(id='minimal',name='Minimal',title=t('只带两件工具','Just two tools'),tag=t('极简','Minimal'),color='#90a6c3',glyph='terminals',
 blurb=t('固定提示词 + 持久 shell + 文本编辑器。','Fixed prompt, persistent shell, and text editor.'),
 tools=['bash / pwsh','str_replace_editor'],
 strengths=t('用少量工具完成读取、编辑与命令计算。','Read, edit, and calculate with a small tool surface.'),
 limits=t('没有压缩、技能与子任务工具。编辑器使用局部 fs-local；不要把“极简”理解为最严格的文件隔离。','No compaction, skills, or delegation tools in this preset. Its editor uses local fs-local; a minimal tool set does not imply the strictest filesystem isolation.'),
 delta=t('完整固定提示词；不注入运行时上下文。','A complete fixed prompt; runtime-context snapshots are suppressed.'),
 source=base+'minimal/agent.cordis.yml',
 snippet='text: You are a helpful software engineer assistant.\ncomplete: true\nincludeRuntimeContext: false\n# persistent shell + str_replace_editor\n# Context compaction is absent.',
 nodes=['systemPrompt','tools','terminals','fs'],route=t('查看小票 → shell 计算 → 转账建议','View receipts → shell calculation → transfers'),
 cells=[t('2 个工具入口','2 tool entries'),t('完整固定','Complete and fixed'),t('未挂载','Not mounted'),t('未挂载','Not mounted'),t('无委派工具','No delegation tools'),t('未挂载','Not mounted'),t('未挂载','Not mounted')]),
 dict(id='standard',name='Standard',title=t('用现成工具办事','Use the existing toolbox'),tag=t('标准','Standard'),color='#6ce0cc',glyph='tools',
 blurb=t('模型直接选择读取、搜索、命令等原生工具。','The model directly chooses native read, search, shell and other tools.'),tools=['read / write / edit','glob / grep','bash / pwsh','subagent / subagent_fork','load_skill / …'],
 strengths=t('适合多步骤任务：文件、搜索、计划、委派、上下文整理。','For multi-step work: files, search, planning, delegation and context management.'),
 limits=t('能力由预设与宿主共同提供。列出工具不表示已获执行许可。','Capabilities come from both the preset and host. A listed tool does not imply permission to execute it.'),
 delta=t('可组合提示词；多项能力按需使用。','Composable prompts; use the available capabilities as needed.'),source=base+'standard/agent.cordis.yml',
 snippet="- name: '@deepseek-ai/dsh-tool-fs'\n- name: '@deepseek-ai/dsh-tool-bash'\n# ... compaction, skills, delegation ...",
 nodes=['systemPrompt','tools','fs','shell','subagents','compaction','skills'],route=t('read 三张小票 → shell 计算 → 转账建议','read three receipts → shell calculation → transfers'),
 cells=[t('多个原生工具','Multiple native tools'),t('按插件组合','Plugin-composed'),t('已挂载','Mounted'),t('已挂载','Mounted'),'spawn / fork',t('已挂载','Mounted'),t('未挂载','Not mounted')]),
 dict(id='ptc',name='PTC',title=t('写程序来调用工具','Orchestrate tools in a program'),tag=t('程序化','Programmatic'),color='#b09aff',glyph='codeRuntime',
 blurb=t('模型调用 run_code，程序通过生成的 SDK 使用工具。','The model calls run_code; the program uses tools through a generated SDK.'),tools=['run_code'],
 strengths=t('在程序内组合、循环、过滤或汇总，只返回需要的结果。','Compose, loop, filter, or aggregate inside the program and return only needed results.'),
 limits=t('内部工具仍受执行管线约束。workflow 工具在该预设中禁用；工作流引擎仍可供 ralph 使用。','Nested tools remain guarded. The workflow tool is disabled in this preset; its engine remains available for ralph.'),
 delta=t('主要继承 Standard 的能力；改变的是模型可见的工具呈现。','Retains most Standard capabilities while changing the model-facing tool presentation.'),source=base+'ptc/agent.cordis.yml',
 snippet="- id: tool-workflow\n  name: '@deepseek-ai/dsh-tool-workflow'\n  disabled: true\n\n- id: tool-presentation\n  name: '@deepseek-ai/dsh-agent-tool-presentation'\n  config:\n    mode: ptc",
 nodes=['tools','codeRuntime','fs','compaction','subagents'],route=t('run_code → SDK 读表 → 程序内计算 → 精简结果','run_code → SDK reads → in-program calculation → compact result'),
 cells=[t('仅 run_code','run_code only'),t('可组合 + 工具 SDK','Composable + tool SDK'),t('已挂载','Mounted'),t('SDK 内调用','Via the SDK'),t('SDK 内 spawn / fork','spawn / fork via SDK'),t('工具禁用，保留引擎','Tool disabled; engine retained'),t('未挂载','Not mounted')]),
 dict(id='cordis',name='Cordis',title=t('临时添加自己的工具','Add a temporary capability'),tag=t('扩展','Extensible'),color='#e6b777',glyph='dynamicCordisRunner',
 blurb=t('在 Standard 基础上，检查、定义、运行动态插件。','Add dynamic-plugin inspection, definition and execution to Standard.'),tools=['Standard 工具','cordis_inspect_list','cordis_inspect_query','cordis_inspect_self','cordis_define','cordis_run','cordis_stop','cordis_undefine'],
 strengths=t('为重复任务制作临时工具或界面，也能编写新的预设副本。','Build temporary tools or interfaces for repeated work, or author a copied preset.'),
 limits=t('属于高信任能力。动态代码可影响同进程其他会话；定义、运行与安装是不同操作。','A high-trust capability: dynamic code can affect other sessions in the process. Defining, running and installing are distinct operations.'),
 delta=t('增加 Cordis 七工具及配置编写技能；不用废弃的 cordis_mount 名称。','Adds seven Cordis tools and a composition-authoring skill; this page uses the current lifecycle API.'),source=base+'cordis/agent.cordis.yml',
 snippet="- id: tool-cordis\n  name: '@deepseek-ai/dsh-tool-cordis'\n# inspect → define → run → stop / undefine\n# composition authoring skill",
 nodes=['tools','cordisInspect','dynamicCordisRunner','clientModules','skills','compaction'],route=t('inspect → define → 批准 run → 临时分账面板','inspect → define → approve run → temporary calculator'),
 cells=[t('Standard + Cordis 七工具','Standard + seven Cordis tools'),t('加入配置编写指导','Adds composition guidance'),t('已挂载','Mounted'),t('含配置编写技能','Includes composition skill'),'spawn / fork',t('已挂载','Mounted'),t('七工具 + 宿主 runner','Seven tools + host runner')])
]
# Use only verified tool spelling for the skill loader label.
for x in data:
 if x['id']=='standard': x['tools'][-1]='skill catalog / …'
# Shared reading labels used by the new interface.
strings={
'案例库':'Case library','四种模式':'Four presets','从一个你关心的问题开始。':'Start with a question that matters to you.',
'看见每一步，为什么发生。':'See each step, and why it happens.',
'每个故事都有资料、过程和答案。按难度逐步探索，也可以直达感兴趣的能力。':'Each story includes materials, a process and an answer. Follow the learning path or jump to a capability.',
'第一次来？从这里开始':'New here? Start here','先看四种模式':'Compare the four presets','学习路线':'LEARNING PATH','由易到难':'Easy → advanced',
'全部案例':'All cases','推荐预设':'Suggested preset','你会看到':'You will see','开始这个案例':'Open this case','看资料':'Materials',
'本页原创资料 / 教学状态':'Original materials / teaching states','源码节选有出处；示例执行没有调用真实模型。':'Source excerpts are attributed; the execution examples do not call a live model.',
'四种预设，四种工具组织方式。':'Four presets. Four ways to organize tools.',
'模型不变，看看工具箱怎样变化。':'Keep the model fixed. Watch the toolbox change.',
'选择的是 Agent 预设。计划模式、审批策略和模型推理强度属于其他设置。':'These are Agent presets. Plan mode, approval policy and model reasoning effort are separate settings.',
'模型直接看到':'THE MODEL SEES','适合怎样使用':'GOOD FIT','要注意':'BOUNDARY','主要变化':'WHAT CHANGES',
'同一顿饭，四种做法':'One dinner bill, four approaches','相同输入：96、54、30 元，三人平摊。相同目标：转账 6 元和 30 元给安安。':'Same input: 96, 54, 30 yuan, split three ways. Same target: transfer 6 and 30 yuan to An.',
'在 3D 中走一遍':'Follow this route in 3D','比较的是组织方式，不排名模型能力。以下流程是教学选择，不是固定调用次数或性能测量。':'Compare organization, not model intelligence. These are teaching routes, not fixed call counts or performance measurements.',
'功能对照':'CAPABILITY COMPARISON','来源与边界':'SOURCES & BOUNDARIES','模型原生工具入口':'Native model-facing tool entry','系统提示词':'System prompt','上下文压缩':'Context compaction','技能目录':'Skills','子任务委派':'Delegation','workflow 工具':'workflow tool','原生 Cordis 工具':'Native Cordis tools',
'点选卡片，比较同一个任务的做法':'Select a card to compare the same task','查看预设原文件 ↗':'Open the preset source ↗','配置摘录与流程标识':'Configuration excerpts and flow labels',
'四种预设都由宿主提供模型、核心注册表和会话记录。具体权限取决于实际部署；工具数量不能代表权限强弱。':'The host provides the model, core registries and session records. Permissions depend on deployment; tool count is not a safety ranking.',
'真实会话一旦产生消息或工具调用，就不能直接切换预设。本页切换仅比较独立教学路径。':'A real session cannot switch presets after producing messages or tool calls. Switching here compares independent teaching paths.',
'这组对照固定到源码提交':'This comparison is pinned to commit','源码优先于过时注释。Cordis 使用 inspect / define / run / stop / undefine。':'Source contracts take precedence over stale comments. Cordis uses inspect / define / run / stop / undefine.',
'这个案例看什么':'WHAT THIS CASE SHOWS','先认识这些资料，再看执行过程。':'Meet the materials before following execution.','返回案例库':'Back to cases','下一个案例 →':'Next case →','对照另一种模式':'Compare another preset',
'本案例展示的预设':'Preset used in this case','每条路线独立从头演示，未改变真实 DSH 配置。':'Each route restarts an independent illustration; no real DSH settings change.',
'换成 Minimal 会怎样？':'What changes under Minimal?','Minimal 没有压缩能力；本例的压缩分支无法照搬。可以新建采用其他预设的会话，或改用分块检索策略。':'Minimal has no compaction; this branch cannot be carried over. Start a new session with another preset or use a chunked-retrieval strategy.',
'摘要分支':'SUMMARY BRANCH','打开档案阅览室':'Open Archive Room','试用分账面板':'Try the calculator','查看完整学习说明':'Open learning notes',
'档案阅览室':'ARCHIVE ROOM','1200 份原创航行记录':'1,200 original voyage records','可查全文。这里在浏览器本地搜索原文，没有调用模型。':'Search the full corpus locally in your browser. No model is called.',
'搜索编号、事件或关键词':'Search a record ID, event or keyword','下载当前语言全文':'Download full text in this language','关键证据':'KEY EVIDENCE','上一页':'Previous','下一页':'Next','清空搜索':'Clear search',
'先在原文里找到证据，再观察压缩如何影响后续步骤。':'Find the original evidence, then inspect how compaction changes later steps.',
'阅读资料不是压缩触发条件。只有被读进会话的内容及历史压力达到配置条件，才可能触发相应后端。':'Reading material is not itself a compaction trigger. Imported context and conversation pressure must meet the backend’s configured conditions.',
'字符数不等于 Token 数。窗口压力为示意；没有执行模型容量评测。':'Character counts are not token counts. Pressure is illustrative; no model context benchmark was run.',
'源码与研究依据':'SOURCE & RESEARCH BASIS','研究提示：检索到一个词并不能证明长文理解；本例要求关联三条证据并排除一个干扰项。':'Research motivation: finding one word is not proof of long-text understanding. This case links three pieces of evidence and rejects a distractor.',
'回到当前步骤':'Back to the current step','本地分账预览':'LOCAL CALCULATOR PREVIEW','这只是本页的算术组件，不会启动或修改 DSH 插件。':'This is an arithmetic component in this page. It does not start or modify a DSH plugin.',
'付款金额（元）':'Payments (CNY)','重新计算':'Recalculate','所有金额都应是非负数，最多两位小数。':'Use non-negative amounts with at most two decimal places.','合计':'Total','均摊':'Share','没有需要转账的差额。':'No transfers needed.',
'四种模式快速比较':'Compare four presets','匹配案例':'Matching cases','源材料类型':'Material type','官方源码节选':'Official source excerpt','本页原创样本':'Original teaching fixture',
'正文':'Text','图形只强调当前交接，详细数据留在侧栏。':'The scene highlights the current hand-off; full data stays in the inspector.',
'你的问题 → 工具与模型协作 → 有依据的结果':'Your question → model/tool collaboration → an evidenced result',
'再看这一步涉及的服务':'SERVICES IN THIS STEP','框架路径与示例数据分开标注。':'Framework paths and example data are labeled separately.',
'只保存语言与主题偏好；导入日志不落盘、不上传。':'Only language and theme preferences may be stored; imported traces are neither saved nor uploaded.',
'资料全文':'Full material','当前页':'Page','条记录':'records','字 / characters':'characters',
'搜索没有结果。':'No matches found.','暂无对应推荐案例。':'No recommended cases match.',
'精确引用前回查原文；有损摘要无法承诺保留所有细节。':'Check the original before exact quotation; lossy summaries cannot promise to retain every detail.',
'返回':'Back','调用方式':'Invocation path','资料与问题':'MATERIALS & QUESTION','观察重点':'WATCH FOR','任务提示词':'TASK PROMPT',
'当前示例没有绑定真实模型；能力与限制来自固定的官方源码。':'No live model is attached to this example. Capability descriptions are grounded in the pinned official source.',
'3D 导览':'3D Journey',
}
for z,e in strings.items():t(z,e)
(ROOT if False else R/'data/modes.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
(R/'data/locale.json').write_text(json.dumps(L,ensure_ascii=False,indent=2))
print('4 preset definitions written;',len(L),'translations')
