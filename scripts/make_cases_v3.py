"""Original, deterministic teaching scenarios. No model or DSH execution.
Rebuilds the eight-case curriculum, four preset comparison routes, and all new translations.
"""
from pathlib import Path
import json, copy
ROOT=Path(__file__).resolve().parents[1]
LOCALE=json.loads((ROOT/'data/locale.json').read_text())
SHA='d347e703908d0406b7a7ef80e3a0e594d86b2215'
P='packages/preset/agent-presets/presets/'
SOURCES={
 'intro':('README.md',[1,10]),
 'table':('docs/capability-seams.md',[470,546]),
 'loop':('packages/core/agent-loop/src/agent.ts',[371,607]),
 'tools':('packages/core/tools/src/index.ts',[155,224]),
 'fs':('packages/fs/tool-fs/README.md',[12,85]),
 'schedule':('packages/core/agent-loop/src/tool-calls.ts',[1,103]),
 'log':('packages/core/session/src/index.ts',[1,90]),
 'compaction':('packages/compaction/compaction-basic/README.md',[12,145]),
 'cordis':('packages/extensions/tool-cordis/README.md',[12,102]),
 'roster':('packages/preset/agent-presets/README.md',[12,92]),
 **{m:(P+m+'/agent.cordis.yml',[1,95] if m=='minimal' else [1,270]) for m in ['minimal','standard','ptc','cordis-preset']}
}
SOURCES['cordis-preset']=(P+'cordis/agent.cordis.yml',[1,262])
def tr(zh,en):
 LOCALE[zh]=en;return zh

def step(title,en,status,statusen,inp,inpen,out,outen,nodes,kind='tool',event='tools/execute',source='tools',why=None,whyen=None,flow=None,ribbon=None):
 path,lines=SOURCES[source]
 r={
 'title':tr(title,en),'description':tr(why or '本阶段只展示相关的服务及其输入、输出。',whyen or 'This stage shows only the relevant services and their input and output.'),
 'nodes':nodes,'kind':kind,'event':event,'source':path,'lines':lines,'code':'',
 'insight':tr(why or '亮起的组件参与当前教学阶段；箭头只显示标注的交接。',whyen or 'Highlighted components participate in this teaching stage. Arrows show only the labeled hand-off.'),
 'payload':{'example':'synthetic','input':tr(inp,inpen),'output':tr(out,outen)},
 'runtime':{'status':tr(status,statusen),'input':tr(inp,inpen),'output':tr(out,outen),'packet':flow[2] if flow else title,'synthetic':True},
 'flow':{'from':flow[0],'to':flow[1],'label':flow[2]} if flow else None
 }
 if ribbon:r['ribbon']=tr(*ribbon)
 return r

def begin(prompt,en,preset):
 return step('先把要办的事说清楚','Start with a clear goal','收到你的任务','Task received',prompt,en,
  '本页已准备好教学资料。接下来逐步展示处理过程，不会操作你的文件。','The teaching materials are ready. Follow the steps without touching any of your files.',
  ['sessionController','agents','sessions'],'input','Session command','roster',flow=('sessionController','agents','USER → AGENT'))
def finish(out,en):
 return step('把答案与过程一并留下','Keep the answer and its record','任务完成','Task complete','汇总已确认的结果，等待会话记录刷写。','Collect confirmed results and wait for the session durability checkpoint.',out,en,
  ['sessions','sessionPersistence'],'log','session/event · session/flush','log',why='会话日志贯穿整个过程。持久化插件处理刷写；教学页面只在内存中播放。',whyen='The session log spans the entire process. A persistence plugin handles flushing; this teaching page plays in memory only.',flow=('sessions','sessionPersistence','CHECKPOINT'))
def case(id,rank,name,en,prompt,pen,preset,difficulty,den,story,sen,features,learn,len_,files,steps,output,oen,**extra):
 for i,x in enumerate(steps):x['runtime'].update(turn=1,phase=i+1)
 return {'id':id,'rank':rank,'name':tr(name,en),'label':tr(story,sen),'task':tr(story,sen),'prompt':tr(prompt,pen),'environment':tr('资料已放在本页：先点“看资料”，无需懂代码。','Materials are included here. Open “Materials” first; no coding knowledge is needed.'),'preset':preset,
 'difficulty':tr(difficulty,den),'story':tr(story,sen),'features':[tr(*x) for x in features],'learn':tr(learn,len_), 'files':files,'steps':steps,'output':tr(output,oen),'resultIndex':len(steps)-1,'synthetic':True,**extra}
def file(path,zh,en=None,origin='original',url=None):
 f={'path':path,'content':zh,'origin':origin}
 if en is not None:f['contentEn']=en
 if url:f['sourceUrl']=url
 return f

# 01: source-tour — a gentle entry with real, attributed upstream excerpts.
prompt='我不会编程。请读 DSH 的官方介绍，用“收到任务 → 读资料 → 动手做 → 汇报结果”解释它怎么工作。再告诉我每一步由哪个源码包负责。不要修改文件。'
pen='I do not code. Read the official DSH introduction and explain how it works as “receive a task → read information → act → report back”. Name the source package responsible for each part. Do not change files.'
out='DSH 像一个能调用工具的任务执行系统。\n\n1. 接收你的任务：会话入口找到 Agent。\n2. 准备资料：system-prompt 组装说明与工具目录。\n3. 模型提出动作：llm 对接模型；tools 调度工具。\n4. 完成后汇报：agent-loop 继续循环或结束；session 留下记录。\n\n源码入口：packages/core/{agent-loop,system-prompt,tools,session}。\n读取文件会用到 tool-fs 与 ctx.fs；具体存储实现可替换。'
oen='DSH is a task execution system that can use tools.\n\n1. Receive the task: the session entry finds an Agent.\n2. Prepare context: system-prompt assembles guidance and the tool catalog.\n3. Propose an action: llm connects to a model; tools dispatches operations.\n4. Report back: agent-loop continues or ends; session keeps a record.\n\nSource entry points: packages/core/{agent-loop,system-prompt,tools,session}.\nFile reads use tool-fs and ctx.fs; the storage implementation can be replaced.'
intro=case('meet-dsh',1,'DSH 到底怎么帮我做事？','How does DSH do things for me?',prompt,pen,'standard','入门','Beginner','从官方自我介绍开始，不需要知道任何代码文件名。','Start with the official introduction. No knowledge of source filenames required.',
 [('模型 + 工具','Model + tools'),('一次任务的主循环','The task loop'),('源码与日常语言对照','Source-to-plain-language map')],
 '看见模型负责提出动作、工具负责执行、会话负责留下记录。','See the model propose actions, tools carry them out, and the session keep the record.',
 [file('官方 README（节选）','DeepSeek Harness (`dsh`) is an open-source agent harness developed by DeepSeek AI.\nIt is built on an **everything-is-a-plugin** architecture and powered by Cordis.',origin='upstream',url=f'https://github.com/deepseek-ai/deepseek-harness/blob/{SHA}/README.md'),file('源码阅读地图.txt','README.md：先了解项目做什么。\npackages/core/agent-loop：执行循环。\npackages/core/system-prompt：本轮上下文。\npackages/core/tools：工具目录与调用管线。\npackages/core/session：追加式会话日志。','README.md: what the project does.\npackages/core/agent-loop: the loop.\npackages/core/system-prompt: context assembly.\npackages/core/tools: tool catalog and execution.\npackages/core/session: append-only session log.')],
 [begin(prompt,pen,'standard'),
 step('把工具箱交给模型','Give the model its toolbox','Standard 预设已装配','Standard preset composed','选择 Standard；模型和工作区由宿主提供。','Select Standard; the host supplies the model and workspace.','本轮工具目录包括读取、搜索、命令等工具；工具是否可执行还需经过策略。','This step has read, search and shell tools. Actual execution still passes through policy.',['agentPresets','systemPrompt','tools'],'context','systemPrompt.assemble','standard',flow=('systemPrompt','tools','CATALOG')),
 step('读官方资料，别凭空猜','Read evidence rather than guess','正在读官方说明','Reading the official description','read → README.md\nread → docs/capability-seams.md','read → README.md\nread → docs/capability-seams.md','资料写明：Everything is a plugin。服务表分别列出声明包、实现方和消费者。','The material says “Everything is a plugin”. The service table separates declarations, implementations and consumers.',['tools','fs'],'tool','tools/execute → read','fs',flow=('tools','fs','README + SERVICES')),
 step('给技术名词配上日常解释','Translate technical terms into everyday roles','模型正在组织解释','The model is organizing the explanation','上下文：任务要求 + 官方节选 + 源码阅读地图。','Context: the user request, official excerpts and source map.','Agent：处理任务的助手。\nTool：它能调用的具体动作。\nSeam：能力与具体实现之间的接口。\nSession：这次任务留下的记录。','Agent: the assistant handling the task.\nTool: an action it can call.\nSeam: an interface between a capability and its implementation.\nSession: the record of this task.',['agentLoop','llm'],'model','llm.stream','loop',flow=('agentLoop','llm','EXPLAIN')),
 finish(out,oen)],out,oen)

# 02 and mode-comparison share identical, fully specified input.
billprompt='周末聚餐，安安付了 96 元，波波付了 54 元，晨晨付了 30 元。三人平摊。请读取三张小票，算出总额、每人应付和谁给谁转多少钱，别让我看代码。'
billpen='At dinner, An paid CNY 96, Bo paid CNY 54, and Chen paid CNY 30. Split the cost equally. Read the three receipts and report the total, each person’s share, and the transfers. Do not make me read code.'
billout='这顿饭总共 180 元，每人应付 60 元。\n\n波波 → 安安：6 元\n晨晨 → 安安：30 元\n\n核对：安安最终支出 96 − 36 = 60；波波 54 + 6 = 60；晨晨 30 + 30 = 60。'
billoen='Dinner cost CNY 180; each person owes CNY 60.\n\nBo → An: CNY 6\nChen → An: CNY 30\n\nCheck: An pays 96 − 36 = 60; Bo pays 54 + 6 = 60; Chen pays 30 + 30 = 60.'
receipts=[file(f'小票-{name}.txt',f'付款人：{name}\n金额：{amount} 元\n用途：周末聚餐',f'Paid by: {en}\nAmount: CNY {amount}\nPurpose: weekend dinner') for name,en,amount in [('安安','An',96),('波波','Bo',54),('晨晨','Chen',30)]]
minimalsteps=[begin(billprompt,billpen,'minimal'),
 step('只给两件工具','Just two tools','Minimal 已装配','Minimal composed','固定提示词：You are a helpful software engineer assistant.','Fixed prompt: You are a helpful software engineer assistant.','两个模型可见工具：持久 shell（POSIX 是 bash，Windows 是 pwsh）与 str_replace_editor。本预设没有自动压缩。','Two model-visible tools: a persistent shell (bash on POSIX, pwsh on Windows) and str_replace_editor. This preset has no automatic compaction.',['agentPresets','systemPrompt','tools'],'context','complete: true · includeRuntimeContext: false','minimal',flow=('agentPresets','tools','2 TOOLS')),
 step('看懂三张小票','Read the three receipts','正在查看小票','Viewing the receipts','str_replace_editor：查看三张小票，暂不编辑。','str_replace_editor: view all three receipts, without editing.','安安 96 元；波波 54 元；晨晨 30 元。','An: CNY 96; Bo: CNY 54; Chen: CNY 30.',['tools','fs'],'tool','str_replace_editor / view','minimal',flow=('tools','fs','96 + 54 + 30')),
 step('在持久命令环境里计算','Calculate in the persistent shell','计算完成','Calculation complete','通过 bash / pwsh 执行简单计算。\n总额 = 96 + 54 + 30；每人 = 总额 ÷ 3。','Use bash / pwsh for simple arithmetic.\nTotal = 96 + 54 + 30; share = total / 3.','总额 180；均摊 60；差额为 +36、−6、−30。\n不会修改小票。','Total 180; share 60; balances +36, −6, −30.\nThe receipts are unchanged.',['tools','terminals','subprocess'],'tool','persistent bash / pwsh','minimal',flow=('tools','terminals','180 / 3 = 60')),
 step('把数字变成转账建议','Turn the numbers into transfer instructions','最终答复已生成','Final response generated','总額与差额已经核对。','The total and balances have been checked.',billout,billoen,['agentLoop','llm'],'model','assistant/message','loop',flow=('llm','agentLoop','2 TRANSFERS')),
 finish(billout,billoen)]
bill=case('dinner',2,'聚餐后，谁该转多少钱？','Who pays whom after dinner?',billprompt,billpen,'minimal','入门','Beginner','三张小票、三位朋友、一个能核对的答案。','Three receipts, three friends, one verifiable answer.',[('Minimal 两个工具','Minimal’s two tools'),('持久命令环境','Persistent shell'),('同题比较四种模式','Compare all four presets')],'工具少也能完成任务。Minimal 的两个工具足以读取资料与做计算。','A small tool surface can still do useful work: Minimal can read evidence and calculate.',receipts,minimalsteps,billout,billoen)

# 03: explicit configured approval policy, not a promise of automatic prompt safety.
prompt='帮我把三张旅行照片按月份归档。先展示移动清单，得到我同意后才能移动。不要删除照片，也不要改动内容。'
pen='Organize my three travel photos by month. Show the move list and wait for my approval before moving anything. Do not delete photos or change their contents.'
out='已取消这次归档，3 张照片仍在原目录。\n移动：0 张；删除：0 张；内容修改：0。\n\n我已保留移动清单，等你确认新的方案。'
oen='Archiving was cancelled. All three photos remain in their original folder.\nMoved: 0; deleted: 0; contents changed: 0.\n\nThe proposed move list is available for a revised plan.'
photos=case('photos',3,'说了“不”，照片就不动','Say no, and the photos stay put',prompt,pen,'standard','基础','Basic','看看用户拒绝批准时，动作怎样停在工具执行之前。','Watch a refusal stop an action before the tool body runs.',[('用户审批','User approval'),('拒绝也有结果','A denial is a result'),('工具边界','Tool boundary')],
 '自然语言要求配合实际审批规则。本例明确配置了对移动命令的前置审批。','The request is backed by an explicit pre-execution approval rule for move commands in this example.',[file('照片清单.txt','海边.jpg｜2026-06-02\n山顶.jpg｜2026-07-16\n合影.jpg｜2026-07-17\n说明：这是照片元数据样本，未附带真实照片。','beach.jpg | 2026-06-02\nsummit.jpg | 2026-07-16\ngroup.jpg | 2026-07-17\nThis is synthetic photo metadata, not real image files.')],
 [begin(prompt,pen,'standard'),
 step('先看照片清单','Inspect the photo list first','只读查看','Read-only inspection','3 张照片的文件名与拍摄月份。','The filenames and capture months of three photos.','计划：海边.jpg → 2026-06/\n山顶.jpg、合影.jpg → 2026-07/\n此刻尚未移动任何文件。','Proposal: beach.jpg → 2026-06/\nsummit.jpg and group.jpg → 2026-07/\nNothing has moved yet.',['tools','fs'],'tool','read','fs',flow=('tools','fs','3 PHOTOS')),
 step('把计划送到审批边界','Send the proposal to the approval boundary','等待你的批准','Waiting for your approval','移动命令已准备好；示例策略要求先批准。','The move command is prepared; the example policy requires approval first.','tools/pre-execute 返回 ask；审批请求交给 ctx.approval。工具本体尚未调用。','tools/pre-execute returns ask; ctx.approval handles the request. The tool body has not been called.',['tools','approval'],'guard','tools/pre-execute · approval/request','tools',flow=('tools','approval','ASK')),
 step('你说：先不要移动','You say: do not move them yet','用户已拒绝','User denied','用户回复：不要移动，我想先把清单发给朋友确认。','User response: do not move them; I want a friend to check the list first.','拒绝结果返回工具管线。没有 shell 执行，也没有文件写入。','A denial returns to the tool pipeline. No shell command executes and no file is written.',['approval','tools'],'blocked','approval/request → deny','tools',flow=('approval','tools','DENIED'),ribbon=('用户拒绝 · 文件保持原样','User denied · Files unchanged')),
 step('把拒绝准确记下来','Record the refusal accurately','记录拒绝结果','Recording the denied result','工具调用结果：未获批准。','Tool outcome: approval denied.','会话留下拒绝结果，模型据此解释任务为何没有执行。','The session records the denial; the model uses it to explain why no action was taken.',['tools','sessions'],'log','tool/result','log',flow=('tools','sessions','DENIAL RECORDED')),
 finish(out,oen)],out,oen)

# 04: stale observed state; no silent overwrite.
prompt='这是一份家里的共享采购单。请把牛奶从 2 盒改成 4 盒。家人可能同时修改它，请保留其他人的更新。'
pen='This is our shared shopping list. Change milk from 2 cartons to 4. My family may edit it at the same time; preserve their changes.'
old='牛奶：2 盒\n大米：1 袋';mid=old+'\n鸡蛋：12 个';final='牛奶：4 盒\n大米：1 袋\n鸡蛋：12 个'
olden='Milk: 2 cartons\nRice: 1 bag';miden=olden+'\nEggs: 12';finalen='Milk: 4 cartons\nRice: 1 bag\nEggs: 12'
out='牛奶已改为 4 盒。\n\n'+final+'\n\n第一次编辑遇到版本冲突后，我重新读取，再应用修改；家人新增的鸡蛋仍然保留。'
oen='Milk is now 4 cartons.\n\n'+finalen+'\n\nThe first edit hit a stale-version conflict. A fresh read preceded the retry, preserving the eggs added by your family.'
stale=case('shopping',4,'共享采购单，别覆盖家人的修改','Do not overwrite the family’s update',prompt,pen,'standard','进阶','Intermediate','你改牛奶，家人加鸡蛋。先发现冲突，再安全重试。','You change milk while a family member adds eggs. Detect the conflict, then retry safely.',[('先读后改','Read before edit'),('版本冲突','Stale-version conflict'),('读新版本后重试','Reread and retry')],
 '展示 fs-observation-policy 与文件系统实现的配合。该策略需要实际挂载，文件读写工具本身不会自动拥有它。','This shows fs-observation-policy working with a filesystem provider. The policy must be mounted; file tools do not automatically supply it.',
 [file('采购单-v1.txt',old,olden),file('家人更新后的-v2.txt',mid,miden),file('预期-v3.txt',final,finalen)],
 [begin(prompt,pen,'standard'),
 step('记住刚刚读到的版本','Remember the observed version','已观察版本 v1','Observed version v1',old,olden,'read 成功后产生 fs/observed，记录当时的文件版本。','A successful read emits fs/observed and records the version seen.',['tools','fs'],'tool','read · fs/observed','fs',flow=('tools','fs','READ v1')),
 step('家人在你动手前加了一项','A family member adds an item','外部更新插入','External update interleaved','家人把“鸡蛋：12 个”加入同一份采购单。','A family member adds “Eggs: 12” to the same list.',mid,miden,['fs'],'runtime','External file edit (teaching interleaving)','fs',why='这里插入一次教学用并发更新；DSH 尚未重新读到它。',whyen='This is a synthetic concurrent update. DSH has not reread it yet.'),
 step('旧版本编辑被拦住','Block the stale edit','发现版本冲突','Stale version detected','edit：将“牛奶：2 盒”替换为“牛奶：4 盒”；携带旧的观察状态。','edit: replace “Milk: 2 cartons” with “Milk: 4 cartons”, based on the old observed state.','FS_STALE_VERSION\n请重新读取文件，再重试。\n此次没有写入。','FS_STALE_VERSION\nReread the file, then retry.\nThis attempt made no write.',['tools','fs'],'guard','fs/edit-intent → FS_STALE_VERSION','fs',flow=('fs','tools','STALE VERSION'),ribbon=('发现冲突 · 先停下来重读','Conflict found · Reread first')),
 step('重新读取，看到新加的鸡蛋','Reread and see the added eggs','已观察版本 v2','Observed version v2','按错误提示重新读取采购单。','Reread the list as instructed by the error.',mid,miden,['tools','fs'],'tool','read · fs/observed','fs',flow=('tools','fs','READ v2')),
 step('只改自己负责的那一项','Change only the requested item','编辑成功','Edit successful','基于 v2，把牛奶 2 盒改成 4 盒。','Based on v2, change milk from 2 cartons to 4.',final,finalen,['tools','fs'],'tool','edit → atomic mutation','fs',flow=('tools','fs','MILK 2 → 4')),
 finish(out,oen)],out,oen)

# 05: PTC. Three real teaching CSVs, 12 rows, 9 unique, 3 duplicate IDs.
prompt='三个班分别发来了迎新活动报名表。请合并它们，用学号识别重复报名，告诉我总记录数、实际人数，以及哪些同学重复报名。表格已放在本页，不需要联网。'
pen='Three classes sent registration sheets for a welcome event. Merge them, identify duplicate registrations by student ID, and report the row count, unique people, and duplicate IDs. The sheets are included here; no network is needed.'
rows=[[(1,'林青'),(2,'周宁'),(3,'许禾'),(4,'赵海')],[(3,'许禾'),(5,'陈星'),(6,'吴月'),(7,'叶雨')],[(2,'周宁'),(7,'叶雨'),(8,'方林'),(9,'罗川')]]
regfiles=[file(f'班级-{i+1}-报名.csv','student_id,name\n'+'\n'.join(f'S{n:02d},{name}' for n,name in r)) for i,r in enumerate(rows)]
out='报名记录：12 条\n实际人数：9 人\n多余报名：3 条\n\n重复报名者：\nS02 周宁：2 次\nS03 许禾：2 次\nS07 叶雨：2 次\n\n去重依据是学号。没有删除原表。'
oen='Registration rows: 12\nUnique people: 9\nExtra registrations: 3\n\nDuplicate IDs:\nS02 Zhou Ning: twice\nS03 Xu He: twice\nS07 Ye Yu: twice\n\nDeduplication uses student ID. The source sheets are unchanged.'
ptc=case('registration',5,'三张报名表，谁重复报名了？','Who registered twice across three sheets?',prompt,pen,'ptc','进阶','Intermediate','把一连串“读表—合并—去重”交给一段程序。','Give one program the sequence: read, merge and deduplicate.',[('PTC 程序调工具','PTC programmatic calls'),('内部子调用','Nested tool calls'),('只返回必要结果','Return only needed results')],
 'run_code 是模型直接看到的工具入口；程序内部仍通过受控工具完成读取。程序可以在内部处理数据后返回摘要。','run_code is the model-facing tool entry. Its program still reads through guarded tools and can process data before returning a summary.',regfiles,
 [begin(prompt,pen,'ptc'),
 step('模型只看到一个原生入口','The model sees one native entry','PTC 预设已装配','PTC preset composed','该预设加载工具呈现插件，mode: ptc。','The preset mounts tool presentation with mode: ptc.','原生工具目录：run_code。\n原来的读取等能力以生成的 SDK 供程序调用。','Native tool catalog: run_code.\nUnderlying read and other capabilities are exposed through a generated SDK.',['agentPresets','tools','codeRuntime'],'context','agent-tool-presentation / ptc','ptc',flow=('tools','codeRuntime','GENERATED SDK')),
 step('先写好处理流程','Prepare the processing program','程序已提交','Program submitted','伪代码：读取三表 → 按学号分组 → 统计次数 → 只输出合并摘要。','Pseudocode: read three sheets → group by student ID → count → emit a compact summary.','run_code 开始执行。它可以调用 SDK 中的工具；不会直接拿到无限制的宿主权限。','run_code begins. It can call SDK tools; this does not grant unrestricted host access.',['tools','codeRuntime'],'model','run_code','tools',flow=('tools','codeRuntime','READ → GROUP → COUNT')),
 step('程序内部读取三个表','Read the sheets inside the program','3 次内部读取','Three nested reads','通过 SDK 读取班级 1、2、3 的 CSV。','Read the CSV for classes 1, 2 and 3 through the SDK.','各表 4 行，共 12 条原始报名。内部工具调用照常经过工具管线。','Each sheet contains 4 rows: 12 registrations in total. Nested tool calls still pass through the tool pipeline.',['codeRuntime','tools','fs'],'tool','tool/code-dispatch · read','tools',flow=('tools','fs','3 CSV / 12 ROWS')),
 step('在程序里完成去重','Deduplicate within the program','统计完成','Aggregation complete','12 条报名记录；以 student_id 为键。','12 registration rows; group by student_id.','计数：S02=2，S03=2，S07=2；其他学号各 1 次。\n唯一学号总数：9。','Counts: S02=2, S03=2, S07=2; all others=1.\nUnique student IDs: 9.',['codeRuntime'],'tool','program-local aggregation','ptc',why='这部分是程序内计算，无需把每行原始数据都送回主模型。Standard 也可以通过 shell 程序做批处理；PTC 的区别在工具接口与数据流。',whyen='This is local computation within the program. Standard can also batch work using a shell program; PTC differs in its tool interface and data flow.'),
 step('返回简短结果，再写答复','Return a compact result, then answer','摘要返回主循环','Summary returned to the loop','程序只返回计数与重复者列表。','The program returns only counts and duplicate IDs.',out,oen,['codeRuntime','tools','llm'],'model','tool/result → next model step','tools',flow=('codeRuntime','tools','9 UNIQUE / 3 DUPLICATES')),
 finish(out,oen)],out,oen,programSketch=tr('伪代码（流程示意，不是可直接运行的 SDK 代码）：\n读取 3 张报名表\n按 student_id 分组\n输出行数、人数、重复学号','Pseudocode (conceptual, not executable SDK code):\nRead 3 sheets\nGroup by student_id\nReturn row count, people and duplicate IDs'))

# 06: two children, bounded evidence and honest inconsistencies.
prompt='我们计划办一场 120 人的迎新活动，预算 1500 元。请让两个子助手分工：一个检查场地容量，一个检查费用，最后告诉我活动能否按原计划举行。只读资料，不订场地、不付款。'
pen='We are planning a welcome event for 120 people with a budget of CNY 1,500. Have two subagents split the checks: one checks venue capacity and the other costs. Tell me whether the plan is feasible. Read only; do not book or pay.'
out='按目前资料，原计划需要调整。\n\n场地：最多 80 人，比计划少 40 个名额。\n费用：120 × 12 元餐费 + 120 元物料 = 1560 元，超预算 60 元。\n\n建议：先确认是换更大场地还是缩小规模，再按新人数核算预算。\n没有预订场地，也没有付款。'
oen='The current plan needs revision.\n\nVenue: capacity 80, short of the planned 120 by 40 places.\nCost: 120 × CNY 12 for meals + CNY 120 for materials = CNY 1,560, exceeding the budget by CNY 60.\n\nDecide whether to change venues or reduce attendance, then recalculate costs.\nNo booking or payment was made.'
team=case('welcome-event',6,'活动能办吗？让两位助手分工检查','Can the event go ahead? Split the checks',prompt,pen,'standard','进阶','Intermediate','一个查人数，一个查钱，主助手把证据拼在一起。','One checks capacity, one checks money, and the parent combines the evidence.',[('子 Agent 委派','Subagent delegation'),('独立会话','Separate sessions'),('结果交叉核对','Cross-check results')],
 '主任务和子任务各有记录，子任务通过提供方运行。给子任务写“只读”任务要求，还需实际权限配置来强制限制。','Parent and children have separate records and run through providers. A read-only instruction must be backed by permissions to be an enforced boundary.',
 [file('活动方案.txt','预计人数：120\n预算：1500 元','Expected attendance: 120\nBudget: CNY 1,500'),file('场地确认.txt','小礼堂核定容量：80 人\n未预订','Hall capacity: 80\nNot booked'),file('费用报价.txt','餐费：12 元/人\n物料：120 元固定费用','Meals: CNY 12/person\nMaterials: CNY 120 fixed')],
 [begin(prompt,pen,'standard'),
 step('拆成两个可核对的问题','Split the task into two verifiable checks','已拆分子任务','Subtasks planned',prompt,pen,'子任务 venue：人数是否超容量？\n子任务 budget：总价是否超预算？','Child venue: does attendance exceed capacity?\nChild budget: does cost exceed budget?',['agentLoop','tools','subagents'],'delegate','subagent / provider: spawn','standard',flow=('tools','subagents','2 CHECKS')),
 step('给子任务各自建立会话','Create separate child sessions','子任务已建立','Child sessions created','新建 venue-01 和 budget-01。','Create venue-01 and budget-01.','spawn 示例建立新的子会话。fork 则可以继承一段历史，二者用途不同。','The spawn example creates fresh child sessions. A fork can inherit a history prefix; the two serve different purposes.',['subagents','agents','sessions'],'delegate','subagent → agent creation','standard',flow=('subagents','agents','SPAWN CHILDREN')),
 step('第一位助手查场地','The first child checks the venue','场地检查完成','Venue check complete','计划 120 人；场地最多 80 人。','Planned attendance: 120; venue capacity: 80.','venue-01：容量不足，缺 40 个名额。依据：场地确认.txt。','venue-01: capacity shortfall of 40 places. Evidence: venue confirmation.',['tools','fs'],'tool','child read','fs',flow=('tools','fs','120 > 80')),
 step('第二位助手查费用','The second child checks the cost','预算检查完成','Budget check complete','餐费 12 元 × 120 人；固定物料费 120 元；预算 1500 元。','Meals CNY 12 × 120; materials CNY 120; budget CNY 1,500.','budget-01：总额 1560 元，超出 60 元。依据：费用报价.txt。','budget-01: total CNY 1,560, exceeding budget by CNY 60. Evidence: price quote.',['tools','fs','llm'],'tool','child tool/result','fs',flow=('fs','tools','1560 > 1500')),
 step('把两份结论交回主任务','Bring both results back to the parent','主任务收到子任务结果','Parent receives the child results','venue-01 与 budget-01 的结论和引用。','Conclusions and citations from venue-01 and budget-01.','主任务保留两个约束：容量不足；预算超额。不能只看其中一个就宣布可行。','The parent preserves both constraints: insufficient capacity and excess cost. Either alone would be an incomplete feasibility check.',['subagents','tools','agentLoop'],'delegate','subagent result / continuation','standard',flow=('subagents','tools','2 FINDINGS')),
 finish(out,oen)],out,oen)

# 07: long-context original corpus; three linked needles + one distractor.
prompt='从本页 1200 份《远星号航行档案》中查清：D-17 改道把目的地改成了哪里、谁批准、为什么改？请引用记录编号与原句。可能遇到很长的历史；即使做了摘要，也不要猜测漏掉的细节。'
pen='Use the 1,200 original Farstar voyage records included here to find where reroute D-17 changed the destination, who authorized it, and why. Cite record IDs and exact evidence. History may get long; do not guess details lost in a summary.'
out='D-17 的最终目的地是白鹭港，批准人是林岚，原因是海棠港航道封闭。\n\n#0187：申请编号 D-17；原因：海棠港航道封闭；拟改目的地：白鹭港。\n#0674：D-17 审批完成；批准人：林岚；批准目的地：白鹭港。\n#1109：执行确认：D-17 已生效；远星号最终驶向白鹭港。\n\n#0675 属于 R-17，其批准人和目的地不能用于回答 D-17。\n摘要漏掉的姓名已通过重新读取 #0674 确认。'
oen='D-17’s final destination is Egret Port, authorized by Lin Lan because Begonia Port’s channel was closed.\n\n#0187: Request D-17; cause: Begonia Port channel closure; proposed destination: Egret Port.\n#0674: D-17 approved; authorizer: Lin Lan; approved destination: Egret Port.\n#1109: Execution confirmed: D-17 is effective; Farstar is proceeding to Egret Port.\n\n#0675 concerns R-17, so its authorizer and destination do not answer the D-17 question.\nThe missing name was verified by rereading #0674.'
summary='D-17 因原港航道封闭而改道；申请见 #0187，审批见 #0674。继续检查后续执行记录。'
summaryen='D-17 requests a reroute after the original channel closed. Request: #0187; approval: #0674. Check the later execution confirmation.'
archsteps=[begin(prompt,pen,'standard'),
 step('档案很多，先定位相关编号','Locate relevant record IDs','正在分批查阅','Reading in batches','档案有 1200 份。以 D-17 为目标，分批检索并读取上下文。','There are 1,200 records. Search and read context for D-17 in batches.','#0187：D-17 拟改道去白鹭港；原因是海棠港航道封闭。','Record #0187: D-17 proposes Egret Port because Begonia Port’s channel is closed.',['tools','fs'],'tool','search → bounded read','fs',flow=('tools','fs','#0187 / REQUEST')),
 step('读到批准，记下证据位置','Read the approval and keep its location','已发现审批证据','Approval evidence found','#0674、#0675 相邻，但事件编号不同。','#0674 and #0675 are adjacent but describe different events.','#0674：D-17 批准人林岚，目的地白鹭港。\n#0675：R-17 批准人孟舟，目的地青石港。','#0674: D-17, authorizer Lin Lan, destination Egret Port.\n#0675: R-17, authorizer Meng Zhou, destination Bluestone Port.',['tools','fs'],'tool','read','fs',flow=('fs','tools','#0674 / APPROVAL')),
 step('多轮历史挤满了当前窗口','Several rounds fill the current window','达到演示压力阈值','Illustrative pressure threshold reached','历次请求、工具结果和新问题逐渐累积。','Requests, tool outputs and follow-up questions have accumulated.','示意压力：86%。演示沿用 0.8 的压缩触发比例。\n这里只演示阈值，不把字符数当作 Token 数。','Illustrative pressure: 86%. The example uses the 0.8 compaction ratio.\nThis is a threshold illustration, not a character-to-token measurement.',['tokenMeter','compaction'],'context','agent/pre-step → pressure','compaction',flow=('tokenMeter','compaction','86% / ILLUSTRATIVE'),ribbon=('演示压力 86% · 默认触发比例 80%','Illustrative pressure 86% · default trigger ratio 80%')),
 step('先剪长结果，仍然不够','Prune large results first; pressure remains','裁剪后仍高于阈值','Pressure still above threshold after pruning','可用的 toolResultPruner 先缩短过长工具结果。','The optional toolResultPruner shortens oversized tool results first.','示意压力：86% → 82%。仍需摘要。\n若裁剪后已足够小，真实后端可以跳过摘要模型调用。','Illustrative pressure: 86% → 82%. A summary is still needed.\nWhen pruning suffices, the real backend can skip a summarization model call.',['compaction','toolResultPruner','tokenMeter'],'context','tool-result pruning','compaction',flow=('compaction','toolResultPruner','PRUNE FIRST')),
 step('给旧历史写摘要','Summarize the older history','生成摘要','Generating a summary','选取可安全替换的旧历史区间；保留近期内容。','Select a safely replaceable old-history span and retain recent content.',summary,summaryen,['compaction','llm'],'model','purpose: compaction','compaction',flow=('compaction','llm','SUMMARIZE')),
 step('模型看摘要，完整日志仍在','The model sees a summary; the log remains','当前上下文已替换','Current context replaced',summary,summaryen,'旧区间由摘要消息替代；原始日志继续保留。示意压力降至 29%。\n摘要是有损信息，不能保证保留每一个姓名。','A summary message replaces the old span in the current context; the original log remains. Illustrative pressure drops to 29%.\nSummaries are lossy and need not preserve every name.',['compaction','sessions'],'context','compaction/summary · user/message surfaceOp: replace','compaction',flow=('compaction','sessions','SUMMARY / 29%'),ribbon=('原始日志不删 · 模型当前上下文变短','Original log retained · Current model context reduced')),
 step('后续档案确认改道真正执行','Later evidence confirms the reroute happened','执行记录已找到','Execution confirmation found','继续查 #0801–#1200；重点验证申请是否已执行。','Continue in records #0801–#1200 and verify that the request was executed.','#1109：D-17 已生效，远星号最终驶向白鹭港。','#1109: D-17 is effective; Farstar is proceeding to Egret Port.',['tools','fs'],'tool','read','fs',flow=('tools','fs','#1109 / CONFIRMED')),
 step('摘要里没有姓名，先别补答案','The summary lacks a name; do not fill it in','发现证据缺口','Evidence gap detected','已有目的地与原因；摘要没有保留批准人姓名。','Destination and cause are known; the summary omitted the authorizer’s name.','不能借用旁边 R-17 的“孟舟”。先回到摘要保留的位置 #0674。','Do not borrow “Meng Zhou” from neighboring R-17. Return to #0674, whose location survived in the summary.',['agentLoop','llm'],'model','evidence check (teaching branch)','loop',flow=('agentLoop','llm','NAME MISSING')),
 step('按编号重读，只取需要的原句','Reread the cited record, not the entire archive','补回准确证据','Exact evidence recovered','再次读取 #0674 的审批句及上下文。','Reread the approval sentence and context in #0674.','D-17 审批完成；批准人：林岚；批准目的地：白鹭港。','D-17 approved; authorizer: Lin Lan; approved destination: Egret Port.',['tools','fs'],'tool','read / evidence recovery','fs',flow=('tools','fs','#0674 / REREAD')),
 finish(out,oen)]
archive=case('voyage',7,'1200 份航行档案，找回三条线索','Find three linked clues in 1,200 voyage records',prompt,pen,'standard','挑战','Advanced','找目的地、批准人和原因。摘要漏掉姓名时，回原文补证据。','Find the destination, authorizer and cause; reread when a summary loses the name.',[('超长多轮上下文','Long multi-turn context'),('压缩 + 裁剪','Compaction + pruning'),('摘要遗失后重查','Recover from summary loss')],
 '长上下文检索与压缩是两回事。本例分批查阅原创档案，再演示历史压力、摘要替换和回查；不宣称完成模型长上下文评测。','Long-context retrieval and compaction are distinct. This original corpus illustrates batched reading, pressure, replacement and rereading. It is not a model benchmark.',
 [file('档案说明.txt','这是一套原创、确定性生成的 1200 份航行记录。\n在“档案阅览室”中可查看或下载全文。\n关键记录：0187、0674、1109。干扰记录：0675。\n未使用《三体》或其他受版权保护的小说全文。','An original, deterministically generated set of 1,200 voyage records.\nRead or download it in the Archive Room.\nKey records: 0187, 0674, 1109. Distractor: 0675.\nNo copyrighted novel text is included.')],archsteps,out,oen,archive=True,defaultVariant='lost')
kept=copy.deepcopy(archsteps)
kept[5]['runtime']['output']=tr('D-17 因海棠港航道封闭拟改到白鹭港；#0674 的批准人是林岚。保留原句和记录编号，继续查执行记录。','D-17 proposes Egret Port because Begonia Port’s channel is closed. #0674 names Lin Lan as the authorizer. Keep the quote and record IDs, and check execution.')
kept[5]['payload']['output']=kept[5]['runtime']['output'];kept[6]['runtime']['input']=kept[5]['runtime']['output'];kept[6]['payload']['input']=kept[5]['runtime']['output']
kept[8]=step('摘要保留了姓名，也要核对出处','Even a complete summary needs a source check','关键字段保留','Key fields retained','摘要保留：林岚、白鹭港、#0674。','Summary retained: Lin Lan, Egret Port and #0674.','三个字段都有来源。最终引用前，用 #0674 原句核对一次。','All three fields have a source. Verify the original #0674 sentence before citing it.',['agentLoop','llm'],'model','evidence check (teaching branch)','loop',flow=('agentLoop','llm','VERIFY QUOTE'))
keptout=out.replace('摘要漏掉的姓名已通过重新读取 #0674 确认。','摘要保留了关键字段，最终答复仍核对原句。');kepten=oen.replace('The missing name was verified by rereading #0674.','The summary retained key fields; the final answer still verifies the original wording.')
kept[-1]=finish(keptout,kepten)
archive['variants']={'lost':{'name':tr('摘要漏掉姓名','Summary loses the name'),'steps':archsteps},'kept':{'name':tr('摘要保留关键线索','Summary keeps key evidence'),'steps':kept}}

# 08: dynamic runtime lifecycle, current seven-tool API; no outdated cordis_mount.
prompt='每次聚餐都要分账。请在当前会话里做一个临时分账面板，输入三个人各自付款金额就能算转账建议。先说明会用到的能力，等我批准再运行。演示后停止它，不修改仓库配置。'
pen='We split dinner bills frequently. Build a temporary panel in this session that takes three payments and suggests transfers. Explain the capabilities first and run it only after my approval. Stop it after the demo; do not edit repository configuration.'
out='临时分账面板已完成一次演示，并已停止。\n\n96、54、30 元 → 总额 180 元，每人 60 元；转账 6 元和 30 元给安安。\n\ncordis_define 只保存定义；cordis_run 才激活。\ncordis_stop 停止当前运行，定义仍可保留；cordis_undefine 才移除插件。\n这些定义保存在进程内，重启后不会自动变成已安装插件。'
oen='The temporary split-bill panel was demonstrated and then stopped.\n\nCNY 96, 54, 30 → total 180, share 60; transfer 6 and 30 to An.\n\ncordis_define records a definition; cordis_run activates it.\ncordis_stop stops the run but can keep its definition; cordis_undefine removes it.\nDefinitions are process-local and do not automatically become installed plugins after restart.'
cordis=case('make-tool',8,'让助手临时长出一个新工具','Let the assistant add a temporary tool',prompt,pen,'cordis','开发者','Developer','从使用现成工具，走到定义、批准、运行与停止临时面板。','Go from using existing tools to defining, approving, running and stopping a panel.',[('Cordis 动态扩展','Cordis dynamic extension'),('先定义，再运行','Define before running'),('生命周期与信任边界','Lifecycle and trust boundary')],
 '展示当前七个 Cordis 工具的生命周期。动态代码可能影响同进程其他会话，必须按高信任操作对待；本网页只播放教学状态。','This shows the current seven-tool Cordis lifecycle. Dynamic code may affect other sessions in the process and requires high trust; this page only plays teaching states.',
 [file('面板需求.txt','输入：三人姓名与金额。\n输出：总额、均摊、转账建议。\n不访问网络，不修改仓库配置。\n本页提供可交互的本地算术预览，未启动 DSH 插件。','Inputs: three names and payments.\nOutputs: total, equal share, transfers.\nNo network access or repository config edits.\nThe page offers a local arithmetic preview, not an executing DSH plugin.')],
 [begin(prompt,pen,'cordis'),
 step('先查看有哪些可用接口','Inspect the available contracts first','接口查询完成','Contract inspection complete','cordis_inspect_list / cordis_inspect_query：查询可用服务、工具或浏览器插槽。','cordis_inspect_list / cordis_inspect_query: query live services, tools or browser slots.','读取当前环境公开的接口后再写定义，不凭记忆编造可调用方法。','Read the live exposed contract before authoring a definition; do not invent callable methods.',['tools','cordisInspect'],'tool','cordis_inspect_query','cordis',flow=('tools','cordisInspect','INSPECT')),
 step('写好定义，但还没有运行','Define it without running it','定义已保存','Definition recorded','cordis_define：保存一个含浏览器界面的新插件版本。','cordis_define: record a new plugin version with a browser interface.','已通过参数与语法检查；仅保存在进程内。尚未运行，也未在此步骤申请批准。','Parameters and syntax pass validation. The definition is in memory only; nothing runs or requests approval at this stage.',['tools','dynamicCordisRunner'],'tool','cordis_define','cordis',flow=('tools','dynamicCordisRunner','DEFINE v1')),
 step('运行浏览器部分前等待批准','Wait for approval before the browser half runs','等待用户批准','Awaiting user approval','cordis_run：请求激活刚定义的浏览器面板。','cordis_run: request activation of the defined browser panel.','返回 awaiting-approval 收据。它表示已发起运行请求，不能当作面板已成功运行。','Returns an awaiting-approval receipt. It confirms a request, not a successfully running panel.',['tools','dynamicCordisRunner'],'guard','cordis_run → awaiting-approval','cordis',flow=('tools','dynamicCordisRunner','AWAITING APPROVAL')),
 step('获准运行，在面板里试算','After approval, try the panel','临时面板运行中（教学）','Temporary panel running (teaching)','用户已批准本次运行；进入 running 状态。','The user approves this run; it enters running state.','试算：96、54、30 元 → 总额 180 元；每人 60 元。\n点击“试用分账面板”，可以在本网页调整金额。','Try 96, 54, 30 → total 180; each pays 60.\nUse “Try the calculator” to adjust amounts locally on this page.',['dynamicCordisRunner','clientModules'],'tool','cordis_run / running','cordis',flow=('dynamicCordisRunner','clientModules','RUNNING'),ribbon=('临时面板示意 · 未实际启动 DSH 插件','Temporary panel preview · No live DSH plugin')),
 step('用完停下，保留可追溯的定义','Stop after use and keep the definition','当前运行已停止','Current run stopped','cordis_stop：停止当前插件运行，取消待处理审批。','cordis_stop: stop the current run and cancel pending approval.','状态：stopped。定义和版本可继续保留；本次没有修改 cordis.yml，也没有安装包。','State: stopped. Definitions and versions can remain. No cordis.yml edit or package installation occurred.',['tools','dynamicCordisRunner'],'tool','cordis_stop','cordis',flow=('tools','dynamicCordisRunner','STOPPED')),
 finish(out,oen)],out,oen,calculator=True)

# Four routes for the same exact dinner question. Native versus PTC is a dataflow distinction.
standardbill=[begin(billprompt,billpen,'standard'),
 step('打开现成的完整工具箱','Open the standard toolbox','Standard 已装配','Standard composed','模型看到读取、搜索、shell 等原生工具。','The model sees native read, search, shell and other tools.','本例只用读取与简单计算，不会为了展示功能强行调用子任务。','This example only reads and calculates. It does not invoke a subagent just to demonstrate a feature.',['agentPresets','systemPrompt','tools'],'context','native tool schemas','standard',flow=('agentPresets','tools','NATIVE TOOLS')),
 step('分别读取三张小票','Read the three receipts','读取完成','Reads complete','read：安安、波波、晨晨的小票。','read: the receipts for An, Bo and Chen.','付款额：96、54、30 元。','Payments: CNY 96, 54, 30.',['tools','fs'],'tool','read','fs',flow=('tools','fs','3 READS')),
 step('用 shell 核对算术','Check the arithmetic with the shell','计算完成','Calculation complete','bash / pwsh：汇总付款额并除以 3。','bash / pwsh: sum the payments and divide by 3.','总额 180 元；每人 60 元；差额 +36、−6、−30。','Total 180; share 60; balances +36, −6, −30.',['tools','shell'],'tool','bash / pwsh','standard',flow=('tools','shell','CALCULATE')),
 finish(billout,billoen)]
ptcbill=[begin(billprompt,billpen,'ptc'),
 step('用一个入口调用底层工具','Call underlying tools through one entry','PTC 已装配','PTC composed','模型原生目录：run_code。','Model-visible native catalog: run_code.','读取与计算流程编排在一段程序内；依然使用受控 SDK 工具。','Reading and calculation are orchestrated within one program using guarded SDK tools.',['tools','codeRuntime'],'context','run_code','ptc',flow=('tools','codeRuntime','ONE PROGRAM')),
 step('在程序内读取与计算','Read and calculate inside the program','内部处理完成','Nested processing complete','SDK 读取三张小票，然后在程序内计算均摊。','Read three receipts through the SDK, then calculate the equal share within the program.','只输出必要结果：total=180, share=60, transfers=[6,30]。','Return only the necessary result: total=180, share=60, transfers=[6,30].',['codeRuntime','tools','fs'],'tool','tool/code-dispatch','tools',flow=('tools','fs','SDK READS')),
 finish(billout,billoen)]
cordisbill=[begin(billprompt,billpen,'cordis'),
 step('先判断要不要新增工具','Decide whether a new tool is useful','检查使用场景','Checking the use case',billprompt,billpen,'一次分账用现成工具即可。这里为对照，展示以后要反复分账时的临时面板路径。','Existing tools suffice for one bill. For comparison, this route shows a temporary panel useful for repeated bills.',['agentLoop','llm'],'model','task choice (teaching)','cordis'),
 *copy.deepcopy(cordis['steps'][1:5]),finish(billout,billoen)]
bill['presetRoutes']={'minimal':minimalsteps,'standard':standardbill,'ptc':ptcbill,'cordis':cordisbill}

CASES=[intro,bill,photos,stale,ptc,team,archive,cordis]
for s in CASES:
 s['chapterCount']=len(s['steps'])
 for seq in [s['steps'],*s.get('presetRoutes',{}).values(),*[v['steps'] for v in s.get('variants',{}).values()]]:
  for i,t in enumerate(seq):t['runtime'].update(turn=1,phase=i+1)
(ROOT/'data/scenarios.json').write_text(json.dumps(CASES,ensure_ascii=False,indent=2))
(ROOT/'data/locale.json').write_text(json.dumps(LOCALE,ensure_ascii=False,indent=2))
print('Built',len(CASES),'cases;',sum(len(s['steps']) for s in CASES),'base stages;',len(LOCALE),'translations')
