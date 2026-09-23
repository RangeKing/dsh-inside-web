# DSH Inside Web

跟着大肥鲸拆开 DeepSeek Harness：七章产品式视差滚动科普、八个可逐步阅读的案例，以及一家像素风 AI 公司。

当前内容核验到 `0.1.6-alpha.2 / ddefc45`。网站为独立教学演示，不调用模型、不安装 DSH 插件、不上传日志。

## 本地使用

```sh
npm ci
npm run build
npm run serve
```

打开 http://127.0.0.1:8080 。GLB 与 Draco 资源需要 HTTP 服务；不再支持把一个 HTML 文件双击当作完整网站。所有运行资源均来自本站，不依赖 CDN。

- 首页：`/#view=home&chapter=0`
- 案例库：`/#view=library`
- 像素公司：`/#view=journey&task=pixel-company&step=1`
- 接口图鉴：`/#view=atlas`
- 降级检查：`/?graphics=off#view=home&chapter=0`

## 维护

- `AGENTS.md`：已确认的产品与工程约束。
- `REPOSITORY_PLAN.md`：阶段、验收与实际状态。
- `src/index.html`、`src/app.js`、`src/studio.js`：现有案例交互与页面模板。
- `src/home.js`、`src/choreography.js`、`src/world.js`、`src/assets.js`：滚动首页、共享 Three.js 场景与资产映射。
- `src/company.js`、`src/timer.js`：像素公司教学与可运行番茄钟。
- `data/`：案例、服务、预设与双语数据。
- `assets/manifest.json`：29 个模型的本地来源、校验和与契约。
- `docs/UPSTREAM_AUDIT.md`、`docs/SOURCES.md`：逐项版本核验与来源。
- `docs/QA.md`：实际检查与未覆盖边界。

修改源码后运行 `npm run build`；`index.html` 和 `build/` 为生成产物。`python3 scripts/build.py` 是同一构建器的兼容入口。旧 v3 生成脚本及旧 engine 保留作历史参考，不用于当前构建。

内容迁移可运行 `python3 scripts/migrate_content.py`，它从旧版快照和锁定上游重新生成基础数据，会覆盖 `data/catalog.json`、`scenarios.json`、`modes.json`、`locale.json`；后续编辑优先维护该脚本，额外界面译文放在 `locale-v5.json`。

```sh
npm run build
npm run check
```

原版完整备份：`archive/pre-redesign-20260918.tar.gz`。根目录 `DSH-Inside-v4.html` 与 v4 报告是历史交付物，不代表当前版本。当前文件夹尚未初始化 Git。

## 边界

模型是社区科普隐喻，空间分组不等于官方固定架构。像素公司展示安装与协作的教学过程，不是在网页里运行多 Agent。番茄钟是可实际操作的本地示例。

代码沿用 MIT；上游来源与 Three.js 声明见 `THIRD_PARTY_NOTICES.md`。模型外部分发权尚未核验，本次交付仅为本地预览，未公开部署。
