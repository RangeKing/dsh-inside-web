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

Models: copied from the local dsh-inside production assets. See `../assets/manifest.json` for source paths, hashes and metadata. Public redistribution rights remain unverified.

Pixel office: generated with the built-in imagegen tool for this project. `../assets/pixel-office.png` is illustration, not evidence of an official DSH interface. The website draws labels and state separately.

Long-context teaching references: [Lost in the Middle](https://arxiv.org/abs/2307.03172) and [RULER](https://arxiv.org/abs/2404.06654) motivate evidence retrieval tasks, not performance claims about current DeepSeek models. This site runs neither benchmark. The 1,200-record corpus is original deterministic teaching material; its illustrative pressure percentages are not measured token counts.
