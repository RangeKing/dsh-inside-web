# Upstream drift audit: ddefc45 -> 0010283

- OLD: ddefc45fbc7f8e46dd73185e68295696d1297887 (dsh-v0.1.6-alpha.2)
- NEW: 00102833dfaee1da9f48a3a8eae9d34005a75218 (dsh-v0.1.7-alpha.2)
- Checked: 2026-09-23. Compare: 1461 commits, 300+ files changed (API caps file list at 300).
- Raw NEW snapshots saved under this directory at upstream-relative paths; hashes in `registry.json`.
- Upstream text treated as data only.

## Per-claim results

| # | Status | NEW path:lines | Quote |
|---|---|---|---|
| 1 | changed (wording) | docs/architecture.md:86, 94-104; packages/core/agent-loop/src/agent.ts:514-517; packages/core/agent-loop/README.md:12 | "A **turn** is zero or more steps" (also in OLD); agent.ts: `if (toolCalls.length === 0) return { kind: 'completed' }`; README: "call model, run tools, repeat" |
| 2 | yes | docs/subsystems/session.md:5 | "A `Session` is an **append-only log** ... The LLM message history is *derived* from the log, never stored separately" |
| 3 | yes (detail) | docs/tool-execution-pipeline.md:6, 15, 40-43, 50-57 | "denied or approval refused / tool body skipped"; `denied --> project --> post --> finalize --> tools/result` |
| 4 | yes | docs/capability-seams.md:581 (graph 43-49) | "`ctx.llm` ... `llm-deepseek`, `llm-pi-ai`, `llm-replay` ... the loop and compaction call the provider-neutral stream service" |
| 5 | yes | packages/compaction/compaction-basic/README.md:90, 113, 177 | "a serial `agent/pre-step` listener checks pressure ... it prunes, then summarizes"; "Model-free pruning can avoid the auxiliary call entirely" |
| 6 | yes | docs/subsystems/subagent.md:5, 126 | "lets an agent delegate work to a child agent"; "A **continuable background subagent** is one durable child Session" |
| 7 | moved; composition unchanged | packages/bundle/web-app/presets/{minimal,standard,ptc,cordis}.patch.yml; names in packages/client/ui-agent-preset/src/client/locales.ts:48-58 | Standard: `tool-plugin-manager ... disabled: true` (146); Creator: `disabled: !!js "!ctx.get('profileContext')"` (154) |
| 8 | yes | packages/extensions/tool-cordis/README.md:2, 12 | "Creator mode provides these read-only tools alongside Plugin Manager, which owns persistent profile changes." |
| 9 | yes, except OPTIONAL_BUNDLES values changed and "never removable" wording | packages/boot/plugin-manager/README.md:14, 31, 40, 46, 77, 129, 133; README.zh.md:14, 31; packages/boot/app-boot/src/profile.ts:182-191; packages/client/ui-plugin-manager/README.md:28 | "Installation enables a new bundle by default"; "removal deselects and unloads the bundle before pnpm runs"; UI: "off until switched on, without an uninstall" |
| 10 | yes, with inconsistency | packages/experimental/auto-review/README.md:2, 12, 33, 98; README.zh.md:12; package.json:2, 72-74; packages/client/ui-plugin-manager/src/client/locales.ts:51, 55, 235, 239 | "Before each native or PTC inner tool call, the current agent's provider and model assess ... an allowed call executes with Full access" |
| 11 | yes | packages/boot/hmr/README.md:12, 27, 47, 89 | "Disabling or omitting HMR applies changes on restart." "Direct Plugin Manager operations apply without waiting for file events." |

## Preset capability table (NEW)

Presets now live in `packages/bundle/web-app/presets/*.patch.yml` as `@deepseek-ai/dsh-agent-preset` rows
(OLD: `packages/preset/agent-presets/presets/<id>/agent.cordis.yml` + `preset.yml`). Registry default is `standard`
(`packages/bundle/web-app/cordis.patch.yml:541-544`). Display names come from locales keys (Standard/PTC/Minimal/Creator mode).

| Capability | Minimal (61 lines) | Standard | PTC | Creator (cordis) |
|---|---|---|---|---|
| plugin_manager tool | no | disabled (144-146) | disabled (148-150) | enabled when profileContext exists (152-154) |
| PTC tool presentation (`dsh-agent-tool-presentation mode: ptc`) | no | no | yes (144-147) | no |
| `workflow-ptc` + `tool-workflow` | no | yes (119-124) | disabled (119-126) | yes |
| subagent (+fork, control) | no | yes (86-102) | yes | yes |
| filesystem tools (tool-fs, fs-search) | no | yes (26-31) | yes | yes |
| shell | persistent bash/pwsh via terminal (17-61) | tool-bash/pwsh (20-25) | same | same |
| web search/fetch | no | yes (137-141) | yes | yes |
| todo / plan mode | no / no | yes (133-136) / yes (42-62) | yes / yes | yes / yes |
| compaction (+ pruner, /compact) | no | yes (63-79) | yes | yes |
| tool-cordis | no | no | no | yes (141-142) |
| skills | no | yes (34-37) | yes | yes, plus agent-preset skills dir (143-149) |

Line numbers refer to each preset's own file. Standard vs PTC diff: PTC adds `tool-presentation mode: ptc` and disables `workflow-ptc`/`tool-workflow`. Standard vs Creator diff: Creator adds `tool-cordis`, moves skills with a custom skill dir, and conditionally enables plugin manager.

## Contradictions / drift to fix on the website

1. OPTIONAL_BUNDLES changed: OLD `[dsh-experimental-agent-team-profile, dsh-experimental-agent-team-web-profile]`; NEW `['@deepseek-ai/dsh-experimental-voice-input-bundle', '@deepseek-ai/dsh-experimental-agent-team-profile']` (profile.ts:188-191).
2. "Never removable" is not literal upstream wording. The UI README says shipped official bundles are "off until switched on, without an uninstall" (ui-plugin-manager README.md:28).
3. auto-review is NOT in OPTIONAL_BUNDLES and not a dependency of apps/cli/package.json, yet its README says "The dsh installation ships this layer switched off" (README.md:12). That is an upstream inconsistency. Safest wording: a published experimental bundle installed through Plugin Manager or `dsh plugin add`. It is public on npm: `@deepseek-ai/dsh-experimental-auto-review`, latest=0.1.6-alpha.1, alpha=0.1.7-alpha.2. It is the registry-name example in the plugin page install guide (locales.ts:55/239, placeholder 51/235).
4. "Web-only": README.md:98 says "absent from default Web, Headless, General settings, and new-session defaults". It is a Web-profile layer that is not in default Web.
5. Claim 1: upstream says a turn is "zero or more steps" (architecture.md:86, same in OLD), not "one or more".
6. Presets moved to `packages/bundle/web-app/presets/`; per-preset `preset.yml` display metadata is gone and names now come from client locales.

## Main-agent corrections (2026-09-23)

- Point 2 above is wrong: NEW `packages/boot/plugin-manager/README.md:52` does say optional bundles are "shipped switched off for the person to turn on, never removable" (README.zh.md:52 "永不可卸载"). The UI README phrase "without an uninstall" agrees.
- Added `packages/fs/tool-fs/README.md` (tool names `read`/`write`/`edit`, lines 44-51) for the homepage request thread.
