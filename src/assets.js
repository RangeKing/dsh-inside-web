import manifest from '../assets/manifest.json';

export const assetRegistry = Object.fromEntries(manifest.assets.map(asset => [asset.id, asset]));
export const moduleDefinitions = [
  ['agent_loop','执行循环','Agent loop','任务还没完成？再来一轮。','Another step, until the task is done.',['agents','agentLoop'],[0,2,7]],
  ['llm_core','模型接口','Model adapter','负责模型请求，也是一块可以更换的插件。','Model requests go through a replaceable plugin.',['llm','systemPrompt','tokenMeter'],[-5,1,5]],
  ['session_spine','会话记录','Session log','做过什么，记下来。脑容量另算。','Keep the record. Context capacity is a different matter.',['sessions','sessionPersistence','sessionProjections','sessionController'],[0,2,-3]],
  ['tool_registry','工具舱','Tool registry','工具在场，不等于每次都上场。','Available tools do not all run on every task.',['tools'],[6,0,3]],
  ['capability_seam','能力接口','Capability seam','接口对上，搭档就能换。','Keep the contract; swap the provider.',['ptcRuntime','mcpResources'],[-6,-1,-1]],
  ['approval_airlock','审批气闸','Approval airlock','该问人的时候，先别动手。','When permission is required, ask before acting.',['approval','userQuestions','restrict'],[6,-1,-3]],
  ['compaction_chamber','上下文整理舱','Compaction chamber','行李要精简，关键线索别落下。','Pack lighter. Keep the important clues.',['compaction','toolResultPruner'],[-5,1,-7]],
  ['subagent_orca','子 Agent','Subagent','分工可以，凭空长出同事不行。','Delegate work through an actual provider.',['subagents','agentTeams'],[7,2,-8]],
  ['job_drone','后台作业','Background job','耗时任务继续做，完成后交回结果。','Long-running work reports back when complete.',['jobs'],[-7,1,-8]],
  ['cordis_workshop','插件工坊','Plugin workshop','办公室也能装进去。咖啡请自备。','An office can be a plugin. Coffee sold separately.',['pluginManager','cordisInspect','dynamicCordisRunner','clientModules'],[0,-1,-10]],
];
export const serviceAsset = {
  fs:'filesystem_bay', shell:'shell_execution_bay', terminals:'shell_execution_bay', subprocess:'shell_execution_bay',
  web:'web_sonar', browserUse:'web_sonar', computerUse:'protocol_adapter', sandbox:'sandbox_chamber', sandboxPolicy:'sandbox_chamber',
  skills:'skill_cartridge', jobs:'job_drone', goals:'goal_core', plans:'plan_rail', todo:'todo_queue', credentials:'credentials_vault',
  ptcRuntime:'ptc_core', workflowEngine:'workflow_rail', scope:'scope_chamber', storage:'context_storage',
};
for (const [id,,,,,services] of moduleDefinitions) for (const service of services) if (!serviceAsset[service]) serviceAsset[service]=id;
export const moduleForService = id => serviceAsset[id] || 'support_node';
export const moduleInfo = id => moduleDefinitions.find(row=>row[0]===id);
