# Sources

Current teaching baseline: DeepSeek Harness `0.1.6-alpha.2`, commit `ddefc45fbc7f8e46dd73185e68295696d1297887`, reviewed 2026-09-18.

- [Architecture](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/docs/architecture.md)
- [Service catalog](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/docs/capability-seams.md)
- [Tool pipeline](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/docs/tool-execution-pipeline.md)
- [Presets](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/packages/preset/agent-presets/README.md)
- [Creator inspection](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/packages/extensions/tool-cordis/README.md)
- [Plugin Manager](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/packages/boot/plugin-manager/README.md)
- [File tools](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/packages/fs/tool-fs/README.md)
- [Compaction](https://github.com/deepseek-ai/deepseek-harness/blob/ddefc45fbc7f8e46dd73185e68295696d1297887/packages/compaction/compaction-basic/README.md)

Homepage plugin lifecycle, request thread and preset table: rechecked at `0010283` (dsh-v0.1.7-alpha.2) on 2026-09-23; snapshots in `upstream-0010283/`.

- [Plugin Manager (0010283)](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/packages/boot/plugin-manager/README.md)
- [Auto review (experimental)](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/packages/experimental/auto-review/README.md)
- [Plugin page](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/packages/client/ui-plugin-manager/README.md)
- [HMR](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/packages/boot/hmr/README.md)
- [Optional bundles](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/packages/boot/app-boot/src/profile.ts)
- [Presets (web-app bundle)](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/packages/bundle/web-app/presets/standard.patch.yml)
- [File tools (0010283)](https://github.com/deepseek-ai/deepseek-harness/blob/00102833dfaee1da9f48a3a8eae9d34005a75218/packages/fs/tool-fs/README.md)

The case-by-case audit and distinction between current package contracts and stale generated catalog descriptions are in `UPSTREAM_AUDIT.md`. Raw snapshots and hashes are in `upstream/registry.json`. Each teaching step records its source path and an actual line range.

The 82 service rows are parsed from the pinned official catalog. Their visual grouping and physical locations are original teaching design. Task scripts, sample outputs, pixel-office roles, and playback timing are illustrative, not measurements or recordings of a live run.

Models: copied from the local dsh-inside production assets. See `../assets/manifest.json` for source paths, hashes and metadata. Public redistribution rights remain unverified.

Pixel office: generated with the built-in imagegen tool for this project. `../assets/pixel-office.png` is illustration, not evidence of an official DSH interface. The website draws labels and state separately.

Long-context teaching references: [Lost in the Middle](https://arxiv.org/abs/2307.03172) and [RULER](https://arxiv.org/abs/2404.06654) motivate evidence retrieval tasks, not performance claims about current DeepSeek models. This site runs neither benchmark. The 1,200-record corpus is original deterministic teaching material; its illustrative pressure percentages are not measured token counts.
