# DSH 版本与案例核验

核验日期：2026-09-18。基线：`dsh-v0.1.6-alpha.2`，提交 `ddefc45fbc7f8e46dd73185e68295696d1297887`（提交时间 2026-09-17T13:19:19Z）。首次核对时 GitHub HEAD 与此标签一致；交付前再次检查见 QA 记录。

旧网站：`0.1.3-alpha.1 / d347e703908d0406b7a7ef80e3a0e594d86b2215`。本次从保留的 v4 单文件恢复生成源，再迁移内容。

## 官方来源与迁移结果

原文快照及 SHA-256 在 `upstream/registry.json`；提交元信息在 `upstream/commit.json`。来源文本作为研究资料，不作为智能体执行指令。`scripts/migrate_content.py` 从保留的旧版和锁定上游生成本次数据；步骤保存实际来源行号。

| 范围 | 核验来源（相对 upstream） | 结果 |
|---|---|---|
| 服务表 | docs/capability-seams.md | 82 行，32 seam；逐行解析 Owner、Provider、Consumer 与定位行号。旧表 70 行；移除 e2b/codeRuntime，新增服务按当前表收录。 |
| 任务循环 | docs/architecture.md；packages/core/agent-loop/src/agent.ts | 模型请求与工具形成 Step；Turn 可有多个 Step。输入、日志、请求准备分别表达，隐藏推理不做动画。 |
| 工具检查 | docs/tool-execution-pipeline.md；packages/core/tools/src/index.ts | pre-execute → monotonic guards → execute → post-execute → finalizeContent → tools/result；tool/result 是会话记录，不与 tools/result 通知混淆。 |
| 预设 | packages/preset/agent-presets/presets/*/agent.cordis.yml；README.md | 保留 Minimal/Standard/PTC/Creator 四预设。Standard 的 Plugin Manager 工具行默认 disabled；Creator 启用。Profile 与 Agent preset 不混用。 |
| Creator | packages/extensions/tool-cordis/README.md；packages/boot/plugin-manager/README.md；docs/user/develop/practice/dynamic-cordis.md | 公开工具为只读 inspect_list/query；持久 bundle 由 plugin_manager 管理。删除案例中 cordis_define/run/stop/undefine 的现行工具声明。 |
| PTC | docs/tool-execution-pipeline.md；docs/capability-seams.md | 当前接口 ptcRuntime；子调用记录 tool/ptc-dispatch。顶层 transport 与内部子调用均经过工具管线。 |
| 文件修改 | packages/fs/tool-fs/README.md | 文件观察策略、FS_STALE_VERSION 与重新读取后重试仍成立；不推广为任意 Shell 写入的保证。 |
| 子任务 | docs/subsystems/subagent.md；packages/preset/agent-presets/README.md | 展示有边界的子任务；进程内提供方的子 Agent 加入父级预设组合，状态分开。动画并发不作为实际并行的证据。 |
| 压缩 | packages/compaction/compaction-basic/README.md | 自动路径在 agent/pre-step 检查压力，可先 pruner 后 summary；裁剪可能免去摘要调用。压力百分比为教学示意。 |

## 八案例决策

1. **初识 DSH**：保留目标，重写步骤解释，替换旧 README 节选为明确标注的原创阅读地图。
2. **聚餐分账**：保留 96/54/30 元资料与 6/30 元转账结果。Creator 路线改为使用现有工具；一顿饭不强行安装插件。
3. **照片审批**：明确配置审批策略为前提；拒绝阻止工具本体，拒绝结果仍进入结果处理。
4. **共享采购单**：明确启用文件观察策略，保留外部更新、拒绝旧版本、重新读取、精确修改分支。
5. **报名表**：使用 ptcRuntime 与 tool/ptc-dispatch；12 行、9 个不同学号、3 个重复 ID 从资料独立复算。
6. **迎新活动**：保留场地 80/120 人、预算 1560/1500 元；不把未解决条件标为可举办。
7. **航行档案**：保留 1200 条确定性语料、关键证据与两种摘要分支；明确摘要可有损和压力为示意。
8. **像素 AI 公司**：替换临时分账工具。9 步覆盖接单、只读检查、制作、安装、确认 Host/Client 生效、分工、测试失败、修复交付、停用/移除。办公室图片为生成素材；番茄钟为本网站实际运行的小组件。

## 保留的不确定性

- 官方生成服务表仍保留 dynamicCordisRunner 及旧内部定义描述，当前 tool-cordis 包文档却明确公开工具只读。网站保留服务目录记录并注明该差异；不据生成表推断旧工具仍可调用。
- 所有案例为源码支持的教学编排，本次没有运行真实 DSH、安装办公室插件或调用模型。
- 日志查看器继续接受标准化事件数组/JSONL，验证外层格式；不宣称支持全部原始持久化代际，也不恢复会话。未知事件不推断。
- 模型来自本地参考项目；外部分发权未完成核验，本次只作已授权的本地复用与预览。

## 2026-09-19 教学动画复核

`git ls-remote ... HEAD` 仍返回 `ddefc45fbc7f8e46dd73185e68295696d1297887`。插件接入动画使用服务表中的 `ctx.llm`，可选提供方严格对应 `llm-deepseek`、`llm-pi-ai`、`llm-replay`；替换是教学分镜，显式经过依赖/配置/运行环境条件，不声明任意插件热插拔。执行循环沿用上述 Agent Loop、Session 和工具管线来源，按输入→上下文→模型→工具→结果记录→再次请求→最终回复呈现；检查与审批是否需要由策略决定。

## 2026-09-23 插件生命周期与首页主线复核

上游已从 `ddefc45`（dsh-v0.1.6-alpha.2）前进到 `00102833dfaee1da9f48a3a8eae9d34005a75218`（dsh-v0.1.7-alpha.2，2026-09-22T15:25:38Z）。本轮只复核首页新增或重写会用到的主张；新快照与哈希在 `upstream-0010283/`，逐条记录见 `upstream-0010283/AUDIT_NOTES.md`。服务表、八案例步骤与行号仍锁定 `ddefc45`，未整体迁移；`catalog.meta.commit` 不变。

| 首页主张 | 0010283 依据 | 结论 |
|---|---|---|
| Step = 一次模型请求加它调用的工具；Turn 可含多个 Step | docs/architecture.md:86；agent-loop/src/agent.ts:514-517 | 成立。上游原文为 “zero or more steps”，网站不写“至少一个”。 |
| 模型历史由追加式会话记录派生 | docs/subsystems/session.md:5 | 成立。 |
| 拒绝审批时工具本体跳过，结果仍经结果处理 | docs/tool-execution-pipeline.md:6,15,40-57 | 成立。 |
| `ctx.llm` 的三个提供方 | docs/capability-seams.md:581 | 成立：llm-deepseek、llm-pi-ai、llm-replay。 |
| 文件工具 `read` / `edit`，edit 需先 read | packages/fs/tool-fs/README.md:40-51 | 成立（启用策略插件时）。 |
| 压缩：pre-step 检查，先裁剪后摘要 | compaction-basic/README.md:90,113,177 | 成立。 |
| 插件装卸：inspect → 安装（默认启用）→ HMR 立即生效/否则重启 → 停用保留依赖 → 移除先卸载再运行 pnpm → 安装失败或取消恢复 package.json 与 pnpm-lock.yaml；改动影响使用该 profile 的所有会话；Host 代码在工作区沙箱外进程内运行；工具操作需 danger-full-access 或逐次审批 | plugin-manager/README.md:14,31,40,46,52,77,129；hmr/README.md:27,47 | 成立。 |
| 可选组合包只开关、不可卸载 | plugin-manager/README.md:52；app-boot/src/profile.ts:188-191；ui-plugin-manager/README.md:28 | 成立。列表已变为 voice-input-bundle 与 agent-team-profile。 |
| Auto review 示例 | experimental/auto-review/README.md:12；ui-plugin-manager/src/client/locales.ts:51,55 | 包名 `@deepseek-ai/dsh-experimental-auto-review`，是插件页安装引导的示例。装上后在当前会话权限选择器中新增 Auto review；每次原生或 PTC 内部工具调用前由当前模型评估，获准调用以 Full access 执行。实验功能，可能误放行、误拒绝并额外消耗 token。README 称“随安装附带”，但它不在 OPTIONAL_BUNDLES，也不是 CLI 依赖；网站按“显式安装的已发布实验组合包”表述。 |
| 预设能力组合 | packages/bundle/web-app/presets/{minimal,standard,ptc,cordis}.patch.yml | 文件已迁移，四预设组成基本不变；Standard 的 plugin_manager 仍关闭，Creator 在存在 profile 上下文时开启。首页对照表按新路径引用。 |

未迁移项：八案例 `reviewedCommit` 与服务表仍为 `ddefc45`；0010283 下 capability-seams、agent-loop、tools、session 等文件均有改动，本轮只核对上表所列行，没有逐行复核案例。
