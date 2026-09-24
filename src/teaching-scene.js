import * as THREE from 'three';
import { lessonFrame, lessonFor, providers } from './lessons.js';
import { preparePresentation, applyPresentation, mixLayouts } from './scene-transition.js';
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
const definitions={
 consumer:{asset:'agent_loop',size:3,label:['执行循环插件','Agent loop plugin'],note:['发起请求的使用方','The consumer sends requests']},
 port:{asset:'capability_seam',size:2.3,label:['模型接口 · ctx.llm','Model contract · ctx.llm'],note:['接口固定，提供方可换','Stable contract, replaceable provider']},
 old:{asset:'llm_core',size:3,label:['原模型适配插件','Original model adapter'],note:['提供方 A','Provider A']},
 next:{asset:'llm_core',size:3,label:['新模型适配插件','Replacement adapter'],note:['提供方 B','Provider B']},
 record:{asset:'session_spine',size:4,label:['会话记录插件','Session log plugin'],note:['保留输入与执行结果','Keeps inputs and results']},
 input:{asset:'support_node',size:1.3,label:['用户输入','User input'],note:['请 3 休 13 怎么排？','How to take 3 and get 13?']},
 loop:{asset:'agent_loop',size:3,label:['执行循环','Agent loop'],note:['组织下一步','Coordinates the next step']},
 model:{asset:'llm_core',size:3,label:['模型适配插件','Model adapter'],note:['发送请求，接收回复','Sends requests, receives replies']},
 tool:{asset:'tool_registry',size:3,label:['工具与检查','Tools & checks'],note:['通过必要检查后执行','Executes after required checks']},
 memory:{asset:'session_spine',size:3.4,label:['会话记录','Session log'],note:['上下文与工具结果','Context and tool results']},
 manager:{asset:'cordis_workshop',size:3.6,label:['插件管理器','Plugin Manager'],note:['读包、安装、开关、移除','Inspect, install, toggle, remove']},
 bundle:{asset:'cordis_extension',size:2.6,label:['Auto review 组合包','Auto review bundle'],note:['实验功能 · 需显式安装','Experimental · installed explicitly']},
 iloop:{asset:'agent_loop',size:3,label:['执行循环','Agent loop'],note:['发出写请假条的 write','Sends the write call']},
 airlock:{asset:'approval_airlock',size:2.8,label:['人工审批','Ask the user'],note:['写入前先问你','Asks before writes']},
 itool:{asset:'tool_registry',size:3,label:['文件工具','File tools'],note:['执行 write','Runs write']},
 output:{asset:'support_node',size:1.3,label:['最终输出','Final answer'],note:['请假条写好了','Leave request ready']},
};
const pluginPositions={consumer:[-7,0,0],port:[0,0,0],old:[3.2,0,0],next:[7,0,-6],record:[-7,0,-5]};
const loopPositions={input:[-10,0,0],loop:[-4,0,0],memory:[-4,0,5],model:[3.5,0,-3.8],tool:[3.5,0,3.8],output:[10,0,0]};
const mobileLoopPositions={input:[-6,0,-6],loop:[-3,0,0],memory:[-3,0,5],model:[3,0,-3],tool:[3,0,4],output:[6,0,-6]};
const installPositions={manager:[-8,0,-8],bundle:[10,0,-12],iloop:[-7.5,0,-.5],airlock:[0,0,3.5],itool:[7.5,0,-1.5]};
const mobileInstallPositions={manager:[-4.5,0,-8],bundle:[5.5,0,-12],iloop:[-4.5,0,0],airlock:[0,0,2.5],itool:[4.5,0,-1]};
const pluginKeys=Object.keys(pluginPositions),loopKeys=Object.keys(loopPositions),installKeys=Object.keys(installPositions);
const paths=[['input','loop'],['memory','loop'],['loop','model'],['model','tool'],['tool','memory'],['memory','loop'],['loop','model'],['model','output']];
const stagePaths=[[0],[1],[2],[3],[4,5],[6],[7]];
// Install lesson: 0 manager↔bundle, 1–2 the write call through Auto review, 3–4 the same call through manual approval.
const installPaths=[['manager','bundle'],['iloop','bundle'],['bundle','itool'],['iloop','airlock'],['airlock','itool']];
const installActive=[[0],[0],[0],[],[1,2],[3,4],[0],[0]];
const installShown=step=>step>=3&&step<=5?[1,2,3,4]:[0,3,4];
const installSlot=[0,0,-7],installNear=[-4,0,-9.5];
const lerp3=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const identities={manager:'cordis_workshop',bundle:'cordis_extension',iloop:'agent_loop',airlock:'approval_airlock',itool:'tool_registry',consumer:'agent_loop',loop:'agent_loop',port:'capability_seam',old:'departing_adapter',next:'llm_core',model:'llm_core',record:'session_spine',memory:'session_spine',tool:'tool_registry',input:'input',output:'output'};
const offsets={manager:[-40,-80],bundle:[165,-10],iloop:[-60,72],airlock:[150,20],itool:[40,-85],consumer:[-65,75],port:[0,85],old:[70,70],next:[30,-78],record:[-50,-65],input:[0,-58],loop:[-25,-85],memory:[-35,67],model:[30,-62],tool:[45,70],output:[0,-58]};
export class TeachingScene {
 constructor(scene,loaded){
   this.loaded=loaded;this.root=new THREE.Group();this.root.name='teaching-links';scene.add(this.root);this.instances=new Map();this.models=new Map();this.anchors=[];
   this.pathsByChapter={1:this.makePaths(2),2:this.makePaths(8),4:this.makePaths(5)};this.paths=this.pathsByChapter[1];
 }
 makePaths(count){return Array.from({length:count},()=>{
   const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(99),3));
   const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color:0x617b9b,transparent:true,opacity:0,depthTest:false}));line.renderOrder=5;
   const arrow=new THREE.Mesh(new THREE.ConeGeometry(.16,.45,8),new THREE.MeshBasicMaterial({color:0x7899bf,transparent:true,opacity:0,depthTest:false}));arrow.renderOrder=6;
   const packet=new THREE.Mesh(new THREE.IcosahedronGeometry(.16,0),new THREE.MeshBasicMaterial({color:0xffcc88,transparent:true,opacity:0,depthTest:false}));packet.renderOrder=7;
   for(const object of [line,arrow,packet]){object.visible=false;this.root.add(object);}return {line,arrow,packet};
 });}
 get required(){return [...new Set(Object.values(definitions).map(d=>d.asset))];}
 ensure(role){
   const key=identities[role];if(this.models.has(key)){const model=this.models.get(key);this.instances.set(role,model);return model;}
   const def=definitions[role],source=this.loaded.get(def.asset);if(!source)return null;preparePresentation(source);
   let model=source;
   if(key!==def.asset){model=source.clone(true);const materials=new Map();model.userData={assetId:def.asset};model.traverse(o=>{if(o.isMesh){if(!materials.has(o.material)){const m=o.material.clone();m.opacity=m.userData.presentationBaseOpacity??1;m.transparent=m.userData.presentationBaseTransparent;m.depthWrite=m.userData.presentationBaseDepthWrite;materials.set(o.material,m);}o.material=materials.get(o.material);}});preparePresentation(model);this.root.add(model);}
   this.models.set(key,model);this.instances.set(role,model);return model;
 }
 sample(chapter,position,providerIndex=1,mobile=false){
   const frame=lessonFrame(chapter,position),layout=new Map();if(!frame)return {layout,frame};
   const {step,t}=frame,keys=chapter===1?pluginKeys:chapter===4?installKeys:loopKeys,positions=chapter===1?pluginPositions:chapter===4?(mobile?mobileInstallPositions:installPositions):mobile?mobileLoopPositions:loopPositions;
   for(const role of keys){const root=this.ensure(role);if(!root)continue;const d=definitions[role],pos=[...positions[role]];let opacity=1,label=d.label,note=d.note;
     if(chapter===1&&role==='old'){const distance=step<2?0:step===2?smooth(t):1;pos.splice(0,3,3.2+distance*4,0,distance*5);opacity=1-distance*.8;const provider=providers[(providerIndex+2)%3];label=provider.name;note=[provider.id,provider.id];}
     if(chapter===1&&role==='next'){const distance=step<3?0:step===3?smooth(t):1;pos.splice(0,3,7+(3.2-7)*distance,0,-6*(1-distance));opacity=step<2?.18:1;const provider=providers[providerIndex];label=provider.name;note=[provider.id,provider.id];}
     if(chapter===4&&role==='bundle'){const out=positions.bundle,near=mobile?[-2,0,-9]:installNear,slot=mobile?[0,0,-4.5]:installSlot;
       const at=[out,lerp3(out,near,smooth(t)),lerp3(near,slot,smooth(t)),slot,slot,slot,lerp3(slot,out,smooth(t)),lerp3(out,near,Math.sin(Math.PI*smooth(t))*.7)][step];
       pos.splice(0,3,...at);opacity=step===0||step===7?.55:step===5?.35:step===6?.35*(1-smooth(t)):1;}
     const key=identities[role];layout.set(key,{key,role,root,id:d.asset,position:pos,rotation:[0,0,0],scale:d.size/root.userData.presentationSize,opacity,label,note,offset:offsets[role],active:chapter===2?stagePaths[step].some(i=>paths[i].includes(role)):chapter===4?(step===3&&role==='bundle')||installActive[step].some(i=>installPaths[i].includes(role)):role==='port'||(step>=3?role==='next':role==='old')});
   }
   return {layout,frame};
 }
 clearLinks(){for(const group of Object.values(this.pathsByChapter))for(const p of group)p.line.visible=p.arrow.visible=p.packet.visible=false;}
 drawLinks(chapter,frame,weight){
   if(!frame||weight<.000001)return;this.paths=this.pathsByChapter[chapter];const {step,t}=frame;
   if(chapter===1){this.connect(0,'consumer','port',step===1||(step===5&&t<.5),step===5?Math.min(1,t*2):t,weight);if(step<2||step>=4)this.connect(1,'port',step<2?'old':'next',step===5&&t>=.5,Math.max(0,t*2-1),weight);}
   else if(chapter===4){const active=installActive[step];for(const i of installShown(step)){const [a,b]=installPaths[i];this.connect(i,a,b,active.includes(i),active.length===2?Math.min(1,Math.max(0,t*2-active.indexOf(i))):t,weight);}}
   else paths.forEach(([a,b],i)=>this.connect(i,a,b,stagePaths[step].includes(i),stagePaths[step].length===2?Math.min(1,Math.max(0,t*2-stagePaths[step].indexOf(i))):t,weight));
 }
 connect(i,a,b,active,t,weight=1){
   const from=this.instances.get(a),to=this.instances.get(b);if(!from||!to)return;
   const p=this.paths[i];p.line.visible=p.arrow.visible=true;p.packet.visible=active;
   const key=from.position.toArray().join(',')+'|'+to.position.toArray().join(',');
   if(p.key!==key){p.key=key;const v0=from.position.clone(),v1=to.position.clone();v0.y+=.4;v1.y+=.4;const mid=v0.clone().lerp(v1,.5);mid.y+=i===5?1.7:.65;
     p.curve=new THREE.QuadraticBezierCurve3(v0,mid,v1);const attr=p.line.geometry.attributes.position,point=new THREE.Vector3();
     for(let j=0;j<=32;j++){p.curve.getPoint(j/32,point);attr.setXYZ(j,point.x,point.y,point.z);}attr.needsUpdate=true;p.line.geometry.computeBoundingSphere();
     p.arrow.position.copy(p.curve.getPoint(.74));p.arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),p.curve.getTangent(.74).normalize());
   }
   p.line.material.opacity=(active?.95:.24)*weight;p.line.material.color.set(active?0xffc780:0x5e7796);p.arrow.material.color.copy(p.line.material.color);p.arrow.material.opacity=weight;p.packet.material.opacity=weight;p.curve.getPoint(smooth(t),p.packet.position);
 }
 // Standalone lesson previews and tests use the same sampler and path renderer as the homepage.
 update(chapter,position,providerIndex=1,mobile=false){
   this.root.visible=!!lessonFor(chapter);for(const model of this.models.values())model.visible=false;this.clearLinks();const {layout,frame}=this.sample(chapter,position,providerIndex,mobile);
   for(const state of mixLayouts(layout,layout,0).values())applyPresentation(state);this.root.updateMatrixWorld(true);this.drawLinks(chapter,frame,1);
   this.anchors=[...layout.values()].map(s=>({...s,position:s.root.getWorldPosition(new THREE.Vector3())}));return frame;
 }
 get pickables(){return [...this.models.values()].filter(m=>m.visible);}
}
