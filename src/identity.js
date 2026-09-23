/* Semantic identities: family silhouettes + pictograms + unique service marks.
   The glyphs are original 24×24 vector paths. No external font or icon request. */
(() => {
 'use strict';
 const glyphs={
  chat:'M4 4H20V16H11L6 21V16H4Z M8 8H16 M8 12H13',
  upload:'M4 15V20H20V15 M12 16V3 M7 8L12 3L17 8',
  file:'M5 3H14L19 8V21H5Z M14 3V8H19 M8 12H16 M8 16H14',
  folder:'M3 6H10L12 9H21V20H3Z M3 10H21',
  key:'M10 9A4 4 0 1 1 2 9A4 4 0 1 1 10 9 M10 9H22 M17 9V13 M21 9V12',
  sliders:'M5 3V21 M12 3V21 M19 3V21 M2 8H8 M9 16H15 M16 10H22',
  window:'M3 4H21V20H3Z M3 9H21 M6 6H7 M10 6H11',
  cursor:'M5 3L20 13L13 14L10 21Z',
  braces:'M9 3H6V9L3 12L6 15V21H9 M15 3H18V9L21 12L18 15V21H15',
  gateway:'M3 6H9V18H3Z M15 6H21V18H15Z M9 12H15 M12 9L15 12L12 15',
  grid:'M3 3H10V10H3Z M14 3H21V10H14Z M3 14H10V21H3Z M14 14H21V21H14Z',
  question:'M8 8C8 2 17 2 17 8C17 12 12 11 12 15 M12 19H12.2',
  terminal:'M3 4H21V20H3Z M6 8L10 12L6 16 M13 16H18',
  globe:'M12 2A10 10 0 1 1 12 22A10 10 0 1 1 12 2 M2 12H22 M12 2C5 6 5 18 12 22C19 18 19 6 12 2',
  puzzle:'M3 3H9V7C14 4 14 12 9 9V14H3V9C8 12 8 4 3 7Z M14 14H21V21H14Z',
  hook:'M5 3V12A7 7 0 0 0 19 12V8 M15 12L19 8L23 12',
  paperclip:'M9 17L17 9C21 5 16 0 12 4L4 12C-1 17 6 24 11 19L20 10 M7 15L14 8',
  gauge:'M3 18A10 10 0 1 1 21 18 M12 14L18 7 M4 12H6 M18 12H20 M12 3V5',
  scissors:'M8 6A3 3 0 1 1 2 6A3 3 0 1 1 8 6 M8 18A3 3 0 1 1 2 18A3 3 0 1 1 8 18 M8 6L21 21 M8 18L21 3',
  search:'M17 9A7 7 0 1 1 3 9A7 7 0 1 1 17 9 M15 15L22 22',
  link:'M10 7L13 4A5 5 0 0 1 20 11L16 15 M14 17L11 20A5 5 0 0 1 4 13L8 9 M8 16L16 8',
  prompt:'M4 3H17V21H4Z M8 7H13 M8 11H13 M8 15H11 M20 8V16 M18 10L20 8L22 10',
  checklist:'M9 5H21 M9 12H21 M9 19H21 M2 4L4 6L7 2 M2 11L4 13L7 9 M2 18L4 20L7 16',
  book:'M12 5C8 2 4 2 2 4V20C6 18 9 18 12 21C15 18 18 18 22 20V4C18 2 15 2 12 5V21',
  compress:'M3 3L9 9 M3 9H9V3 M21 3L15 9 M15 3V9H21 M3 21L9 15 M3 15H9V21 M21 21L15 15 M15 21V15H21',
  brain:'M12 3C7 0 4 3 5 7C0 8 1 13 4 15C2 20 7 23 12 20C17 23 22 20 20 15C24 12 23 7 19 7C20 3 16 0 12 3V20 M5 7L9 9 M19 7L15 9 M4 15L8 14 M20 15L16 14',
  wave:'M2 12H6L9 4L14 20L18 8L21 12H23',
  fork:'M5 3V6C5 10 12 9 12 13V21 M19 3V6C19 10 12 9 12 13 M2 3H8 M16 3H22 M9 21H15',
  tools:'M3 7H21V21H3Z M8 7V3H16V7 M3 12H21 M10 11H14V15H10Z',
  layers:'M12 2L22 7L12 12L2 7Z M2 12L12 17L22 12 M2 17L12 22L22 17',
  agent:'M4 7H20V20H4Z M12 7V3 M10 3H14 M8 11V14 M16 11V14 M8 17H16 M1 11V16 M23 11V16',
  star:'M12 2L15 8L22 10L17 15L18 22L12 18L6 22L7 15L2 10L9 8Z',
  loop:'M20 8A9 9 0 0 0 4 7 M4 2V7H9 M4 16A9 9 0 0 0 20 17 M15 17H20V22',
  target:'M12 3A9 9 0 1 1 12 21A9 9 0 1 1 12 3 M12 7A5 5 0 1 1 12 17A5 5 0 1 1 12 7 M12 12L21 3 M17 3H21V7',
  branch:'M9 2H15V7H9Z M3 17H9V22H3Z M15 17H21V22H15Z M12 7V12 M6 17V12H18V17',
  team:'M10 6A3 3 0 1 1 4 6A3 3 0 1 1 10 6 M20 6A3 3 0 1 1 14 6A3 3 0 1 1 20 6 M2 20V16C2 11 12 11 12 16V20 M12 20V16C12 11 22 11 22 16V20',
  flow:'M3 3H10V10H3Z M14 14H21V21H14Z M10 6H18V14 M15 11L18 14L21 11',
  shield:'M12 2L21 6V12C21 17 16 21 12 23C8 21 3 17 3 12V6Z M7 12L11 16L17 9',
  lock:'M4 10H20V22H4Z M7 10V6A5 5 0 0 1 17 6V10 M12 14V18',
  boundary:'M3 8V3H8 M16 3H21V8 M21 16V21H16 M8 21H3V16 M7 7H17V17H7Z',
  check:'M3 12L9 18L21 5',
  cloud:'M6 19C-2 19 0 10 6 10C6 0 18 0 18 10C25 9 26 19 19 19Z',
  process:'M3 4H11V11H3Z M14 14H22V21H14Z M7 11V18H14 M11 17L14 18L11 20',
  env:'M4 3H20V21H4Z M7 8H17 M7 16H17 M9 6L8 10 M15 14L14 18',
  code:'M8 5L2 12L8 19 M16 5L22 12L16 19 M14 3L10 21',
  clock:'M12 2A10 10 0 1 1 12 22A10 10 0 1 1 12 2 M12 6V12L17 15',
  navigation:'M12 2L21 21L12 16L3 21Z M12 7V13',
  database:'M3 5C3 1 21 1 21 5C21 9 3 9 3 5V19C3 23 21 23 21 19V5 M3 12C3 16 21 16 21 12',
  pulse:'M3 3H21V21H3Z M3 12H7L10 7L14 17L17 12H21',
  save:'M3 3H17L21 7V21H3Z M7 3V9H16V3 M7 21V14H17V21',
  signal:'M5 17C-1 10 2 3 7 1 M9 14C5 10 7 6 10 5 M19 17C25 10 22 3 17 1 M15 14C19 10 17 6 14 5 M12 11V22 M9 22H15',
  feedback:'M3 3H21V16H10L5 21V16H3Z M8 9L11 12L17 6',
  title:'M3 4H21 M12 4V21 M8 21H16',
  projection:'M3 4H21V17H3Z M12 17V22 M7 22H17 M6 8H10V13H6Z M14 9H18 M14 12H17',
  cache:'M4 4H20V20H4Z M8 8H16V16H8Z M9 1V4 M15 1V4 M9 20V23 M15 20V23 M1 9H4 M1 15H4 M20 9H23 M20 15H23',
  eye:'M1 12C6 2 18 2 23 12C18 22 6 22 1 12Z M16 12A4 4 0 1 1 8 12A4 4 0 1 1 16 12',
  archive:'M2 3H22V8H2Z M4 8V22H20V8 M9 12H15 M12 12V18 M9 15L12 18L15 15',
  plugin:'M7 3V8 M17 3V8 M5 8H19V12A7 7 0 0 1 5 12Z M12 19V23'
 };
 const specs={
  fileUploads:['upload','panel','UP'],sessionController:['chat','panel','SC'],sessionFileReferences:['file','document','SF'],sessionSkillCatalog:['book','document','SK'],credentialsController:['key','gate','CC'],settingsController:['sliders','panel','ST'],workspaceController:['window','panel','WC'],directoryPickerController:['cursor','folder','DP'],typert:['braces','chip','TY'],typertGateway:['gateway','gate','GW'],workspaceRegistry:['grid','chip','WR'],userQuestions:['question','panel','QA'],commands:['terminal','terminal','CMD'],directoryPicker:['folder','folder','DIR'],webServer:['globe','hex','HTTP'],clientModules:['puzzle','chip','MOD'],webhookRuntime:['hook','gate','HOOK'],
  attachments:['paperclip','document','ATT'],tokenMeter:['gauge','hex','TOK'],toolResultPruner:['scissors','document','CUT'],fileReferences:['search','folder','REF'],sessionReferenceResolver:['link','document','LINK'],systemPrompt:['prompt','document','SYS'],planMode:['checklist','document','PLAN'],skills:['book','document','SKILL'],compaction:['compress','chip','CMP'],
  llm:['brain','hex','LLM'],deepseekLlmApiExtensions:['wave','hex','EXT'],subagentModelSelection:['fork','hex','SM'],tools:['tools','chip','TOOL'],agentPresets:['layers','chip','PRE'],agents:['agent','chip','AGT'],agentDefaultModel:['star','hex','DEF'],agentLoop:['loop','hex','LOOP'],goals:['target','hex','GOAL'],subagents:['branch','chip','SUB'],agentTeams:['team','chip','TEAM'],workflowEngine:['flow','chip','FLOW'],
  settings:['sliders','panel','CFG'],credentials:['key','shield','KEY'],authorization:['lock','shield','AUTH'],sandbox:['boundary','gate','BOX'],sandboxPolicy:['shield','shield','POL'],approval:['check','shield','OK?'],permissionPresets:['layers','shield','PERM'],
  e2b:['cloud','hex','E2B'],subprocess:['process','terminal','PROC'],shell:['terminal','terminal','SH'],shellEnv:['env','terminal','ENV'],terminals:['window','terminal','PTY'],ptcRuntime:['code','chip','CODE'],fs:['folder','folder','FS'],jobs:['clock','hex','JOB'],web:['globe','hex','WEB'],lsp:['navigation','chip','LSP'],
  sessions:['database','cylinder','LOG'],invariants:['pulse','gate','INV'],sessionPersistence:['save','cylinder','SAVE'],sessionTelemetry:['signal','hex','OTEL'],storage:['database','cylinder','KV'],storageDomain:['grid','cylinder','DOM'],messageFeedback:['feedback','panel','FDBK'],sessionQuery:['search','cylinder','QUERY'],sessionTitle:['title','document','TITLE'],sessionProjections:['projection','panel','VIEW'],sessionProjectionCache:['cache','cylinder','CACHE'],inspector:['eye','hex','INSP'],spillStore:['archive','cylinder','SPILL'],dynamicCordisRunner:['plugin','chip','RUN'],cordisInspect:['eye','chip','CI']
 };
 const paths=Object.fromEntries(Object.entries(glyphs).map(([k,v])=>[k,new Path2D(v)]));
 const resolve=(id)=>{
  if(specs[id]){const [glyph,family,mark]=specs[id];return {glyph,family,mark};}
  const name=id.split(':').slice(1).join(':');
  if(id.startsWith('consumer:')) return {glyph:'gateway',family:'panel',mark:'CALL'};
  if(id.startsWith('owner:')) return {glyph:'braces',family:'document',mark:'DEF'};
  return {glyph: /local/.test(name)?'terminal':/e2b/.test(name)?'cloud':/sandbox/.test(name)?'shield':/replay/.test(name)?'loop':'plugin',family:'chip',mark:'IMPL'};
 };
 function svg(id){const {glyph}=resolve(id);return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${glyphs[glyph]}"/></svg>`;}
 function draw(ctx,id,x,y,size,color){const info=resolve(id);ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(size/24,size/24);ctx.strokeStyle=color;ctx.lineWidth=1.65;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke(paths[info.glyph]);ctx.restore();}
 window.DSHIdentity={resolve,svg,draw,specs};
})();
