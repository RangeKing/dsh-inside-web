# 滚动性能记录

测试环境：本机 Codex 内置 Chromium 浏览器、实际 production GLB、1000×650 WebGL 画布。数值仅代表本机本轮结果。

- `before.json`：修改前，6 秒内以 10 Hz 更新滚动目标，60 次更新只渲染 60 帧，P95 帧间隔 101.1 ms，466 draw calls。
- `after-optimization.json`：相同旧分镜与输入，加入 RAF 连续补间、静态网格批处理与缓冲复用后，391 帧，P95 18.6 ms，30 draw calls。记录于新教学分镜加入之前。`maxCameraStep` 是相邻帧的 camera.x 差值。
- `final-integrated.json`：最终插件教学场景，包含实际提供方替换动画。分镜改变，draw calls 与相机位移不可直接作为上面同场景的百分比比较。`maxCameraVectorStep` 是三维相机位置差的长度。另检查减少动态和隐藏状态下是否继续出帧。

复测：在仓库运行 `./node_modules/.bin/esbuild tests/browser/performance.js --bundle --format=iife --outfile=build/performance.js`，启动静态服务后打开 `/tests/browser/performance.html`，等待 GLB 加载后点击 Run scroll benchmark。期间保持该标签前台可见。测试本身不驱动真实 DSH。

原始 GLB 未删减几何；透明材质单面提交策略、批处理和减少重复绘制降低提交次数。保留外壳不同活动面板，自动测试验证边界框与独立面板。页面的渲染性能、实际设备操作感受和长时间显存压力是不同验收，本轮未做实体手机与 GPU 压力全矩阵。

## 章节连续性（2026-09-19 追加）

上一轮只证明渲染频率，没有覆盖场景显隐跳变。`transitions-before.json` 记录实际 GLB 在章节前后 ±0.0001 的有效材质透明度与世界矩阵：前五个边界透明度跳变量 1，插件→循环还有 6.368 的矩阵元素变化。

`transitions-desktop.json` / `transitions-mobile.json` 是修复后的同路径实际 GLB 结果。六个边界全部通过；正向与反向回到同一位置的误差为 0。这是场景坐标、尺寸与显隐的连续性检查，数值不是毫秒或帧率。

复测：`./node_modules/.bin/esbuild tests/browser/transitions.js --bundle --format=esm --outfile=build/transitions.js`，打开 `/tests/browser/transitions.html`，点击 Audit all scene boundaries。Mobile canvas 可在 390 px 画布重跑；位置滑块和正/反向播放用于查看过渡中间态。页面会驱动实际渲染器，暂停教学播放器，避免把教学阶段变化混入滚动边界测量。
