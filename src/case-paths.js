// Pure path selection: one source for timeline, model, text and deliverables.
export const legacyCases = {
  'meet-dsh':'repair-site', dinner:'repair-site', photos:'archive-files', shopping:'shared-project',
  registration:'data-pipeline', 'welcome-event':'incident-report', voyage:'incident-report', 'make-tool':'pixel-company',
};
export function resolveCaseId(id) { return legacyCases[id] || id; }
export function pathFor(scenario, branch) { return scenario.variants?.[branch] || scenario.variants?.[scenario.defaultVariant] || {steps:scenario.steps, files:[], success:false}; }
export function branchPosition(scenario, branch, index) { return Math.max(0, Math.min(pathFor(scenario, branch).steps.length-1, Number(index)||0)); }
export function stopsAtDecision(scenario, index, acknowledged) { return !acknowledged && index===scenario.decision?.index; }
