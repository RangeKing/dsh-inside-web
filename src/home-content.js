// Homepage reference content: footnotes, preset comparison and highlight cards.
export const UPSTREAM='46a7f68b0922371ce7144b668b90e377d8e799f4';
export const src=(path,lines)=>`https://github.com/deepseek-ai/deepseek-harness/blob/${UPSTREAM}/${path}${lines?'#L'+lines.replace('-','-L'):''}`;
// Footnotes point at the dsh-v0.1.7-rc.1 snapshots audited in docs/upstream-0.1.7-rc.1/.
export const NOTES=[
 {id:'seams',path:'docs/capability-seams.md',lines:'579',text:['ctx.llm 是服务接口，llm-deepseek、llm-pi-ai、llm-replay 是它的提供方。','ctx.llm is the service contract; llm-deepseek, llm-pi-ai and llm-replay implement it.']},
 {id:'turn',path:'docs/architecture.md',lines:'86',text:['Step 是一次模型请求加上它调用的工具；Turn 由若干 Step 组成。','A step is one model request plus the tools it calls; a turn is made of steps.']},
 {id:'fs',path:'packages/fs/tool-fs/README.md',lines:'40-51',text:['文件工具 read、write、edit。write 新建文件不需要先 read；覆盖已有文件时，启用策略插件就要求先 read 且文件未变。','File tools read, write and edit. write can create a new file without a prior read; with the policy plugin, overwriting needs a prior read of an unchanged file.']},
 {id:'holidays',url:'https://www.gov.cn/zhengce/content/202511/content_7047090.htm',snapshot:'docs/external/gov-2026-holidays.html',sha256:'36fe1206ceb7685bc8827350d9552d60fff8393919f6afd0d1b0161c97628c0d',label:'国办发明电〔2025〕7号',text:['2026 年中秋 9 月 25–27 日、国庆 10 月 1–7 日放假，9 月 20 日（周日）和 10 月 10 日（周六）上班。','2026: Mid-Autumn Sep 25–27 and National Day Oct 1–7 are holidays; Sep 20 (Sun) and Oct 10 (Sat) are workdays.']},
 {id:'pipeline',path:'docs/tool-execution-pipeline.md',lines:'6-15',text:['工具调用先过策略与守卫；审批被拒时跳过工具本体，结果仍经过结果处理。','Calls pass policy and guards first; a refused approval skips the tool body, and the result is still processed.']},
 {id:'manager',path:'packages/boot/plugin-manager/README.md',lines:'14-63',text:['插件管理器：pnpm 运行前先查 DSH 版本兼容，安装默认启用，HMR 决定何时生效，停用保留依赖，移除先卸载，失败回滚；可选组合包不能卸载。','Plugin Manager: DSH version compatibility is checked before pnpm runs, installs enable by default, HMR decides when changes apply, disabling keeps the dependency, removal unloads first, failures roll back; optional bundles cannot be removed.']},
 {id:'review',path:'packages/experimental/auto-review/README.md',lines:'12',text:['Auto review 是实验组合包：工具调用前由当前模型评估，获准后以 Full access 执行。','Auto review is an experimental bundle: the current model assesses each tool call, and allowed calls run with Full access.']},
 {id:'hmr',path:'packages/boot/hmr/README.md',lines:'27',text:['关闭或不配置 HMR 时，改动在重启后生效。','Without HMR, changes apply on restart.']},
 {id:'session',path:'docs/subsystems/session.md',lines:'5',text:['会话是追加式记录，发给模型的消息历史由记录派生。','A session is an append-only log; the model’s message history is derived from it.']},
 {id:'compaction',path:'packages/compaction/compaction-basic/README.md',lines:'90-113',text:['每个 Step 前检查上下文压力，先裁剪工具结果，再做摘要。','Pressure is checked before each step: prune tool results first, then summarize.']},
 {id:'subagent',path:'docs/subsystems/subagent.md',lines:'5',text:['子 Agent 让一个 Agent 把工作委派给子 Agent。','Subagents let an agent delegate work to a child agent.']},
 {id:'presets',path:'packages/bundle/web-app/presets/standard.patch.yml',lines:'',text:['四个预设的组成，见 web-app 组合包的 presets 目录。','The four presets are defined in the web-app bundle’s presets directory.']},
];
export const noteNumber=id=>NOTES.findIndex(n=>n.id===id)+1;
// From packages/bundle/web-app/presets/*.patch.yml at dsh-v0.1.7-rc.1 (unchanged since 0010283).
export const PRESETS=[
 [['文件读写','File tools'],0,1,1,1],
 [['Shell','Shell'],['仅常驻终端','Terminal only'],1,1,1],
 [['网页搜索与抓取','Web search & fetch'],0,1,1,1],
 [['待办与计划模式','Todo & plan mode'],0,1,1,1],
 [['子 Agent','Subagents'],0,1,1,1],
 [['上下文压缩','Compaction'],0,1,1,1],
 [['Skills','Skills'],0,1,1,1],
 [['工作流','Workflows'],0,1,['关闭','Off'],1],
 [['PTC 工具呈现','PTC tool presentation'],0,0,1,0],
 [['Creator 只读检查工具','Creator inspection tools'],0,0,0,1],
 [['插件管理器工具','Plugin Manager tool'],0,['关闭','Off'],['关闭','Off'],['有 profile 时开启','On with a profile']],
];
export const HIGHLIGHTS=[
 {chapter:2,title:['你说一句话','You ask once'],body:['模型自己决定读哪些文件、调哪个工具。','The model decides which files to read and which tool to call.']},
 {chapter:3,title:['动手前先过关','Checks before acting'],body:['写文件这类操作，可以设成先问你。','Writes can be set to ask you first.']},
 {chapter:4,title:['能力可以装卸','Plug in, pull out'],body:['插件装上、选用、停用、移除，各是一步。','Install, choose, disable and remove are separate steps.']},
 {chapter:5,title:['记得住，分得开','Remembers, delegates'],body:['会话记录留痕，大任务可以分给子 Agent。','The session log keeps the trail; big jobs can go to subagents.']},
];
