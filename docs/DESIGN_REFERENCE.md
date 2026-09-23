# 产品展示视觉参考 · 2026-09-20

用户指定参考：https://www.apple.com/iphone-duo/

实际在浏览器观察了首屏、滚动后的局部导航，并阅读页面中的 highlights、design、product-viewer 等结构。借鉴居中产品标题、充足留白、低饱和表面、圆角展陈、胶囊控制与逐段叙事。不复制 Apple 图片、字体文件、产品文案或站点私有代码。

## 现成代码检索与选择

检索词：`apple product scroll animation github MIT vanilla javascript`。

- https://github.com/emanuelefavero/apple-scroll-animation ：README 指向 vanilla JS 图片帧序列绑定滚动；GitHub 仓库元数据未声明 license。未复制代码。
- https://github.com/alfzilham/apple-scroll-hud ：README 指向帧序列、Lenis、HUD 与 React/Motion；GitHub 仓库元数据未声明 license，技术与本项目实时 GLB/科普标注不匹配。未复制代码。

两者均未提供足以直接纳入本项目的许可证据，图片帧序列也无法代替可点击的模型与插件动画。保留本项目已有的 Three.js 0.180.0（MIT，已锁定并附带许可）、RoomEnvironment、GLTFLoader 和 DRACOLoader；以原生 CSS sticky、details、媒体查询及既有确定性滚动插值完成适配，无新增依赖、CDN 或外部字体。

## 本轮实现

- `src/product.css`：首页、案例库、案例页共享颜色、文字、留白、按钮、表面和响应式布局；构建入口统一内联。
- 首页：标题/模型/说明分区；前一章文案提前退场，避免两章文字互相叠压；保留共享模型插值及交互引线。
- 案例库：双列大卡片，手机单列；沿用像素公司素材，其余卡片和导语主视觉由本站现有 GLB 实时生成透明背景静帧。
- `src/gallery.js`：顺序使用一个临时 WebGL 上下文生成装饰性 PNG，结果内存缓存；离开页面取消后续生成，释放几何、材质、纹理、Draco 与渲染器，无持续 RAF。生成失败不影响案例入口和文字，`graphics=off` 不尝试生成。
- 案例页：导语置顶，任务/提示词/资料收进原生 details；桌面模型与步骤说明并列，手机纵向阅读；底部胶囊播放栏。所有八案例、预设对照、摘要分支、来源、二维视图与交互工具继续使用原教学状态。
- 手机案例镜头按展示区宽高比调整距离，复位/俯视使用同一适配系数。

原有第三方许可与 3D 资产分发边界仍以 `SOURCES.md`、资产 manifest 和第三方声明为准。本轮无新外部视觉资产。
