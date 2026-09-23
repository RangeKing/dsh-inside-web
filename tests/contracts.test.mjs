import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { Timer } from '../src/timer.js';
import { scenePose, lastChapter } from '../src/choreography.js';

const json=p=>JSON.parse(readFileSync(p,'utf8'));
const catalog=json('data/catalog.json'),scenarios=json('data/scenarios.json'),assets=json('assets/manifest.json');
const ids=new Set(catalog.services.map(s=>s.id));
const allSteps=scenarios.flatMap(s=>[s.steps,...Object.values(s.presetRoutes||{}),...Object.values(s.variants||{}).map(v=>v.steps)].flat());

test('all 8 cases and alternate paths refer to current services and valid pinned source ranges',()=>{
  assert.equal(scenarios.length,8);assert.equal(new Set(scenarios.map(s=>s.id)).size,8);
  for(const scenario of scenarios)assert.equal(scenario.reviewedCommit,catalog.meta.commit);
  for(const step of allSteps){for(const id of step.nodes)assert.ok(ids.has(id),id);const lines=readFileSync('docs/upstream/'+step.source,'utf8').split('\n');assert.ok(step.lines[0]>=1&&step.lines[1]<=lines.length);assert.ok(step.lines[0]<=step.lines[1]);}
});
test('service catalog matches every row of the current upstream table',()=>{
  const lines=readFileSync('docs/upstream/docs/capability-seams.md','utf8').split('\n');
  const upstream=lines.filter(l=>l.startsWith('| `ctx.')).map(l=>l.match(/`ctx\.([^`]+)`/)[1]);
  assert.deepEqual([...ids].sort(),upstream.sort());
  for(const service of catalog.services)assert.ok(lines[service.sourceLine-1].startsWith('| `ctx.'+service.id+'`'));
  assert.ok(ids.has('ptcRuntime'));assert.ok(!ids.has('codeRuntime'));
});
test('current teaching paths do not advertise retired Creator tool calls or old dispatch event',()=>{
  const active=JSON.stringify([scenarios,json('data/modes.json')])+readFileSync('src/studio.js','utf8');
  assert.doesNotMatch(active,/cordis_(define|run|stop|undefine|inspect_self)|tool\/code-dispatch|inspect \/ define \/ run/);
  const company=scenarios.find(s=>s.id==='pixel-company');assert.equal(company.steps.length,9);assert.ok(company.steps.some(s=>s.companyPhase==='bug'));assert.ok(company.steps.some(s=>s.companyPhase==='done'));
});
test('each copied model has the recorded hash, a valid GLB scene and semantic node names',()=>{
  assert.equal(assets.assets.length,29);
  for(const asset of assets.assets){const bytes=readFileSync(asset.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256);assert.equal(bytes.toString('utf8',0,4),'glTF');assert.equal(bytes.readUInt32LE(8),bytes.length);const gltf=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)));assert.ok(gltf.scenes?.length);assert.ok(gltf.nodes.some(n=>n.name?.startsWith(asset.id+'__')));}
});
test('timer handles pause, resume, repeated starts, long gaps and reset without drift',()=>{
  const timer=new Timer(10000);timer.start(100);timer.start(500);assert.equal(timer.read(1100),9000);timer.pause(1600);assert.equal(timer.read(99999),8500);timer.start(100000);assert.equal(timer.read(101000),7500);timer.pause(101000);timer.reset();assert.equal(timer.read(999999),10000);assert.equal(timer.deadline,null);timer.start(1000000);assert.equal(timer.read(1020000),0);assert.equal(timer.deadline,null);
});
test('registration fixtures independently reproduce the displayed duplicate counts',()=>{
  const rows=scenarios.find(s=>s.id==='registration').files.filter(f=>f.path.endsWith('.csv')).flatMap(f=>f.content.trim().split('\n').slice(1).map(l=>l.split(',')[0]));
  assert.equal(rows.length,12);assert.equal(new Set(rows).size,9);const duplicates=[...new Set(rows.filter((id,i)=>rows.indexOf(id)!==i))].sort();assert.deepEqual(duplicates,['S02','S03','S07']);
});
test('built inline scripts parse, use local resources, and expose no forbidden public naming',()=>{
  const html=readFileSync('index.html','utf8');for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
  assert.doesNotMatch(html,/<script[^>]+src=["']https?:/);assert.ok(html.includes('build/experience.js'));
  for(const file of ['src/home.js','src/company.js'])assert.doesNotMatch(readFileSync(file,'utf8'),/虎鲸/);
  assert.doesNotMatch(JSON.stringify(scenarios),/虎鲸/);
});

// Boundaries matter more than a particular aesthetic camera coordinate.
test('scroll choreography is continuous, reversible, and static with reduced motion',()=>{
  assert.equal(lastChapter,7);
  for(let chapter=0;chapter<lastChapter;chapter++){
    const end=scenePose(chapter,1),start=scenePose(chapter+1,0);
    for(const key of ['camera','screen'])end[key].forEach((v,i)=>assert.ok(Math.abs(v-start[key][i])<1e-9));
    assert.ok(Math.abs(end.open-start.open)<1e-9);
  }
  const sample=scenePose(2,.83);scenePose(5,.9);assert.deepEqual(scenePose(2,.83),sample);
  assert.deepEqual(scenePose(3,0,{reduced:true}),scenePose(3,1,{reduced:true}));
  for(let chapter=0;chapter<=lastChapter;chapter++)assert.equal(scenePose(chapter,.9,{mobile:true}).screen[0],0);
  assert.equal(scenePose(0,0).open,0);assert.equal(scenePose(lastChapter,1).open,0);
});

test('coarse wheel events produce intermediate frames and settle consistently at 60/120 Hz',async()=>{
 const {ScrollMotion}=await import('../src/motion.js');
 for(const fps of [60,120]){const m=new ScrollMotion(1);m.set(2);let previous=1,intermediate=0;
 for(let i=0;i<fps;i++){const v=m.advance(i*1000/fps);assert.ok(v>=previous&&v<=2);if(v>1&&v<2)intermediate++;previous=v;}
 assert.ok(intermediate>fps/2);assert.ok(Math.abs(m.value-2)<.0001);m.set(0);m.advance(1200,true);assert.equal(m.value,0);}
});

test('static batching preserves transformed geometry, materials, and independent moving panels',async()=>{
 const THREE=await import('three');const {prepareModel}=await import('../src/prepare-model.js');
 const source=new THREE.Group(),material=new THREE.MeshStandardMaterial();
 for(let i=0;i<20;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);mesh.position.x=i;mesh.name=i<10?'orca_hull__panel_left_'+i:'orca_hull__body_'+i;source.add(mesh);}
 const before=new THREE.Box3().setFromObject(source),batched=prepareModel(source,'orca_hull'),after=new THREE.Box3().setFromObject(batched);
 assert.equal(batched.children.length,2);assert.equal(batched.userData.panels.length,1);assert.deepEqual(after.min.toArray(),before.min.toArray());assert.deepEqual(after.max.toArray(),before.max.toArray());
});

test('lesson controls freeze, seek to completed steps, respect reduced motion and stop at the answer',async()=>{
 const {LessonPlayer,lessonFrame,loopSteps}=await import('../src/lessons.js');
 const p=new LessonPlayer(2);p.advance(0);p.advance(40);assert.ok(p.position>0);
 p.toggle();const paused=p.position;p.advance(80);assert.equal(p.position,paused);
 p.seek(4);assert.equal(lessonFrame(2,p.position).step,4);assert.ok(lessonFrame(2,p.position).t>.99);
 p.toggle();const reduced=p.position;p.advance(120,true);assert.equal(p.position,reduced);
 for(let t=160;t<18000;t+=40)p.advance(t);
 assert.equal(lessonFrame(2,p.position).step,loopSteps.length-1);assert.equal(p.playing,false);
 p.toggle();assert.equal(p.position,0);assert.equal(p.playing,true);
 p.seek(-3);assert.equal(p.position,0);p.seek(99);assert.equal(lessonFrame(2,p.position).step,6);
});

test('plugin choices implement the actual model contract; replacement keeps consumer and interface fixed',async()=>{
 const THREE=await import('three');const {TeachingScene}=await import('../src/teaching-scene.js');const {providers}=await import('../src/lessons.js');
 assert.deepEqual(providers.map(p=>p.id).sort(),catalog.services.find(s=>s.id==='llm').implementations.slice().sort());
 const loaded=new Map();for(const id of ['agent_loop','capability_seam','llm_core','session_spine','support_node','tool_registry']){const root=new THREE.Group();root.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial()));loaded.set(id,root);}
 const lesson=new TeachingScene(new THREE.Scene(),loaded);lesson.update(1,0);
 const fixed=lesson.instances.get('port').position.clone(),old=lesson.instances.get('old').position.clone();
 lesson.update(1,2.999);assert.deepEqual(lesson.instances.get('port').position.toArray(),fixed.toArray());assert.ok(lesson.instances.get('old').position.distanceTo(old)>4);assert.equal(lesson.paths[1].line.visible,false);
 lesson.update(1,3.999);assert.ok(lesson.instances.get('next').position.distanceTo(old)<.001);
 lesson.update(1,5.5,2);assert.equal(lesson.anchors.find(a=>a.role==='next').note[0],'llm-replay');assert.equal(lesson.paths[1].packet.visible,true);
 lesson.update(2,4.4);assert.ok(lesson.paths[4].packet.visible&&lesson.paths[5].packet.visible);assert.equal(lesson.anchors.find(a=>a.role==='memory').active,true);
 lesson.update(2,6.99);assert.equal(lesson.paths[7].packet.visible,true);assert.equal(lesson.paths[0].packet.visible,false);
 lesson.update(0,0);assert.equal(lesson.root.visible,false);
});

test('every home scene morphs continuously and reversibly, with one identity per shared component',async()=>{
 const THREE=await import('three');const {HomeScene}=await import('../src/home-scene.js');
 const ids=['orca_hull','agent_loop','llm_core','session_spine','tool_registry','capability_seam','approval_airlock','compaction_chamber','subagent_orca','job_drone','cordis_workshop','cordis_extension','support_node'];
 const loaded=new Map(ids.map(id=>{const root=new THREE.Group();root.add(new THREE.Mesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshStandardMaterial()));root.userData.panels=[];return [id,root];}));
 const definitions=ids.map((id,i)=>[id,id,id,'purpose','purpose',[],[i-5,1,i%3]]),home=new HomeScene(new THREE.Scene(),loaded,definitions);
 function sample(p,mobile=false){const chapter=Math.min(lastChapter,Math.floor(p)),pose=scenePose(chapter,p%1,{mobile,aspect:.6});home.update(chapter,pose,{1:0,2:0,4:0},1,mobile);return new Map([...home.states].map(([key,s])=>[key,{opacity:s.opacity,position:s.position.slice(),scale:s.scale,quaternion:s.quaternion.toArray(),root:s.root}]));}
 function close(a,b,tolerance){for(const key of new Set([...a.keys(),...b.keys()])){const x=a.get(key),y=b.get(key);assert.ok(Math.abs((x?.opacity||0)-(y?.opacity||0))<tolerance,`opacity ${key}`);if(x?.opacity>.01&&y?.opacity>.01){assert.equal(x.root,y.root,`identity ${key}`);for(const prop of ['position','quaternion'])x[prop].forEach((v,i)=>assert.ok(Math.abs(v-y[prop][i])<tolerance,`${prop} ${key}`));assert.ok(Math.abs(x.scale-y.scale)<tolerance);}}}
 for(const mobile of [false,true])for(let chapter=0;chapter<lastChapter;chapter++){
   // Check both the start of the dissolve and the chapter hand-off, including reversed seeks.
   for(const p of [chapter+.66,chapter+1]){const a=sample(p-.00001,mobile),b=sample(p+.00001,mobile);close(a,b,.002);sample(lastChapter,mobile);close(a,sample(p-.00001,mobile),1e-10);}
   const mid=sample(chapter+.83,mobile);assert.ok([...mid.values()].some(s=>s.opacity>.45),'no empty midpoint');
 }
 const plugins=sample(1),loop=sample(2);for(const id of ['agent_loop','llm_core','session_spine'])assert.equal(plugins.get(id).root,loop.get(id).root);
 for(const s of loop.values())for(const m of s.root.userData.materials)assert.equal(m.transparent,true,'keep the alpha-capable shader even at full opacity');
 const middle=sample(1.83);for(const id of ['agent_loop','session_spine']){const a=plugins.get(id).position,b=loop.get(id).position,m=middle.get(id).position;a.forEach((v,i)=>assert.ok(Math.abs(m[i]-(v+b[i])/2)<1e-9));}
});

test('mobile camera scaling is interpolated before crossing into and out of teaching chapters',()=>{
 for(const aspect of [.46,.6,.95])for(let chapter=0;chapter<lastChapter;chapter++){
   const end=scenePose(chapter,1,{mobile:true,aspect}),start=scenePose(chapter+1,0,{mobile:true,aspect});
   end.camera.forEach((v,i)=>assert.ok(Math.abs(v-start.camera[i])<1e-10));
 }
});

test('install lesson separates inspect, install, apply, choose, review, disable, remove and rollback',async()=>{
 const THREE=await import('three');const {TeachingScene}=await import('../src/teaching-scene.js');const {installSteps,autoReview}=await import('../src/lessons.js');
 assert.equal(installSteps.length,8);assert.equal(autoReview,'@deepseek-ai/dsh-experimental-auto-review');
 const loaded=new Map();for(const id of ['cordis_workshop','cordis_extension','agent_loop','approval_airlock','tool_registry']){const root=new THREE.Group();root.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial()));loaded.set(id,root);}
 const lesson=new TeachingScene(new THREE.Scene(),loaded),state=(p,role)=>lesson.sample(4,p).layout.get({bundle:'cordis_extension',airlock:'approval_airlock'}[role]);
 const outside=state(0,'bundle').position,slot=state(3.5,'bundle').position;
 assert.ok(Math.hypot(...outside.map((v,i)=>v-slot[i]))>8,'installed bundle sits in the harness, away from its package position');
 assert.ok(state(0,'bundle').opacity<1&&state(3.5,'bundle').opacity===1&&state(3.5,'bundle').active,'inspection is not installation; choosing activates it');
 lesson.update(4,4.5);assert.ok(lesson.paths[1].packet.visible||lesson.paths[2].packet.visible);assert.ok(!lesson.paths[3].packet.visible&&!lesson.paths[4].packet.visible,'reviewed call bypasses manual approval');
 lesson.update(4,5.5);assert.ok(lesson.paths[3].packet.visible||lesson.paths[4].packet.visible);assert.ok(!lesson.paths[1].packet.visible,'disabled bundle no longer reviews');
 assert.ok(state(5.5,'bundle').opacity>0&&state(5.5,'bundle').opacity<.5,'disabled bundle stays installed');
 assert.ok(state(6.999,'bundle').opacity<.001,'removed bundle is gone');
 const rolled=state(7.999,'bundle').position;rolled.forEach((v,i)=>assert.ok(Math.abs(v-outside[i])<1e-3,'failed install returns to the pre-install state'));
});

test('homepage footnotes cite audited rc.1 snapshots at valid lines; preset table has four columns',async()=>{
 const {NOTES,PRESETS}=await import('../src/home-content.js');const registry=json('docs/upstream-0.1.7-rc.1/registry.json');
 assert.equal(registry.commit,'46a7f68b0922371ce7144b668b90e377d8e799f4');
 for(const note of NOTES){const entry=registry.files.find(f=>f.path===note.path);assert.ok(entry,note.path);const bytes=readFileSync('docs/upstream-0.1.7-rc.1/'+note.path);assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);
   if(note.lines){const [a,b=a]=note.lines.split('-').map(Number);assert.ok(a>=1&&b>=a&&b<=bytes.toString('utf8').split('\n').length,note.id);}}
 for(const row of PRESETS)assert.equal(row.length,5);
});
