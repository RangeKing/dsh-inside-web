# Sources

Current homepage, six execution cases and preset comparison: DeepSeek Harness `0.1.7-rc.1`, commit `46a7f68b0922371ce7144b668b90e377d8e799f4`, reviewed 2026-09-24. Each case and step records its own audited commit and source ranges; service-atlas links retain their separate earlier baseline. Start-of-work HEAD matched rc.1. See `HARNESS_CASES.md` and the final QA drift check.

The six cases additionally use the pinned [Shell tool](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/shell/tool-bash/README.md), [Tools / PTC](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/core/tools/README.md), and [File observation policy](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/fs/fs-observation-policy/README.md) references. New snapshot hashes are recorded in `upstream-0.1.7-rc.1/registry.json`.

Service atlas baseline (the former eight cases are archived): DeepSeek Harness `0.1.6-alpha.2`, commit `ddefc45fbc7f8e46dd73185e68295696d1297887`, reviewed 2026-09-18.

- [Architecture](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/docs/architecture.md)
- [Service catalog](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/docs/capability-seams.md)
- [Tool pipeline](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/docs/tool-execution-pipeline.md)
- [Presets](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/packages/preset/agent-presets/README.md)
- [Creator inspection](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/packages/extensions/tool-cordis/README.md)
- [Plugin Manager](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/packages/boot/plugin-manager/README.md)
- [File tools](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/packages/fs/tool-fs/README.md)
- [Compaction](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/packages/compaction/compaction-basic/README.md)

Homepage plugin lifecycle, request thread, preset table and footnotes: pinned to `dsh-v0.1.7-rc.1` (`46a7f68`), checked 2026-09-24; snapshots in `upstream-0.1.7-rc.1/` (the earlier 0010283 audit remains in `upstream-0010283/`).

- [Plugin Manager (rc.1)](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/boot/plugin-manager/README.md)
- [Auto review (experimental)](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/experimental/auto-review/README.md)
- [Plugin page](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/client/ui-plugin-manager/README.md)
- [HMR](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/boot/hmr/README.md)
- [Optional bundles](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/boot/app-boot/src/profile.ts)
- [Presets (web-app bundle)](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/bundle/web-app/presets/standard.patch.yml)
- [File tools](https://github.com/deepseek-ai/deepseek-harness/blob/46a7f68b0922371ce7144b668b90e377d8e799f4/packages/fs/tool-fs/README.md)
- [Release notes](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.1.7-rc.1)

The case-by-case audit and distinction between current package contracts and stale generated catalog descriptions are in `UPSTREAM_AUDIT.md`. Raw snapshots and hashes are in `upstream/registry.json`. Each teaching step records its source path and an actual line range.

The 82 service rows are parsed from the pinned official catalog. Their visual grouping and physical locations are original teaching design. Task scripts, sample outputs, pixel-office roles, and playback timing are illustrative, not measurements or recordings of a live run.

Models: copied from the local dsh-inside production assets. The hull and 12 homepage modules were then refined with `scripts/blender/refine_models.py` (2026-09-24): welded vertices, rebuilt smooth normals and angle-limited bevels on hard-surface parts. The hull keeps its original geometry; its colour texture was rebuilt in texture space as dark / ivory / cyan zones taken from the texture's own colours, and its normal and metallic-roughness maps were removed. `../assets/manifest.json` records each input hash, output hash, bevel segments and triangle count. Public redistribution rights remain unverified; refinement does not change that status.

Pixel office: generated with the built-in imagegen tool for this project. `../assets/pixel-office.png` is illustration, not evidence of an official DSH interface. The website draws labels and state separately.

Historical long-context teaching references (retained for the archived voyage case, no longer a current case): [Lost in the Middle](https://arxiv.org/abs/2307.03172) and [RULER](https://arxiv.org/abs/2404.06654) motivate evidence retrieval tasks, not performance claims about current DeepSeek models. This site runs neither benchmark. The 1,200-record corpus is original deterministic teaching material; its illustrative pressure percentages are not measured token counts.


Historical holiday request thread (replaced by website repair on 2026-09-24): [国务院办公厅关于2026年部分节假日安排的通知（国办发明电〔2025〕7号）](https://www.gov.cn/zhengce/content/202511/content_7047090.htm), retrieved 2026-09-24; snapshot `external/gov-2026-holidays.html`, SHA-256 `36fe1206ceb7685bc8827350d9552d60fff8393919f6afd0d1b0161c97628c0d`. The 请3休13 framing and the Kanas / Zhangjiajie destinations follow coverage of the 2026 holiday travel forecast ([腾讯新闻](https://news.qq.com/rain/a/20260918A05TRC00)); the calendar, travel notes, leave request and reply are original teaching material.
