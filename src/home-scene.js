import * as THREE from 'three';
import { scenePose, lastChapter } from './choreography.js';
import { lessonFor } from './lessons.js';
import { TeachingScene } from './teaching-scene.js';
import { preparePresentation, mixLayouts, applyPresentation } from './scene-transition.js';
// Modules for the chapters HomeScene lays out itself; lesson chapters come from TeachingScene.
const chapters=[[],[],[],['capability_seam','tool_registry','approval_airlock'],[],['session_spine','compaction_chamber'],['subagent_orca','job_drone','cordis_workshop'],[]];
const offsets={capability_seam:[70,-60],tool_registry:[-60,60],approval_airlock:[-60,60],session_spine:[-60,60],compaction_chamber:[70,-60],subagent_orca:[-60,60],job_drone:[70,-60],cordis_workshop:[-60,60]};
export class HomeScene {
 constructor(scene,loaded,definitions=[]){this.reveal=0;this.loaded=loaded;this.definitions=definitions;this.teaching=new TeachingScene(scene,loaded);this.states=new Map();this.anchors=[];}
 get required(){return [...new Set(['orca_hull',...chapters.flat(),...this.teaching.required])];}
 sample(chapter,lessonPositions,provider,mobile){
   if(lessonFor(chapter))return this.teaching.sample(chapter,lessonPositions[chapter],provider,mobile);
   const layout=new Map(),yaw=scenePose(chapter,0).yaw;
   // Dragging the hero control opens the hull and previews the chapter-2 modules in place.
   const reveal=chapter===0?this.reveal:0,ids=reveal>0?['orca_hull','agent_loop','llm_core','session_spine','tool_registry','capability_seam']:['orca_hull',...chapters[chapter]];
   for(const id of ids){
     const root=this.loaded.get(id);if(!root)continue;preparePresentation(root);const def=this.definitions.find(d=>d[0]===id),position=new THREE.Vector3(...(def?.[6]||[0,0,0])).applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
     layout.set(id,{key:id,id,root,position:position.toArray(),rotation:[0,yaw+(id==='subagent_orca'?-.3:0),0],scale:id==='orca_hull'?1:(id==='subagent_orca'?.7:id==='session_spine'?.85:1.2)*(reveal>0?.62:1.35),opacity:id==='orca_hull'||chapter!==0?1:reveal,label:def&&!reveal?[def[1],def[2]]:null,note:def?[def[3],def[4]]:null,offset:offsets[id]||[0,0]});
   }return {layout,frame:null};
 }
 update(chapter,pose,lessonPositions,provider,mobile){
   const next=Math.min(lastChapter,chapter+1),a=this.sample(chapter,lessonPositions,provider,mobile),b=pose.blend>0?this.sample(next,lessonPositions,provider,mobile):a;
   const states=mixLayouts(a.layout,b.layout,pose.blend);this.states=states;
   // Hide only after opacity reaches zero; shared keys retain one model across every layout.
   for(const root of new Set([...this.loaded.values(),...this.teaching.models.values()]))root.visible=false;
   for(const state of states.values())applyPresentation(state,state.opacity*(state.id==='orca_hull'?1-pose.open*.94:1));
   const hull=this.loaded.get('orca_hull');if(hull)for(const panel of hull.userData.panels||[]){panel.position.copy(panel.userData.basePosition);const side=panel.userData.panelKind;
     if(side==='left')panel.position.x-=pose.open*3;else if(side==='right')panel.position.x+=pose.open*3;else if(side==='head')panel.position.z+=pose.open*2;else if(side==='belly')panel.position.y-=pose.open*2;else panel.position.y+=pose.open*3;
   }
   this.teaching.root.visible=true;this.teaching.clearLinks();this.teaching.drawLinks(chapter,a.frame,1-pose.blend);if(pose.blend>0)this.teaching.drawLinks(next,b.frame,pose.blend);
   this.anchors=[...states.values()].filter(s=>s.label&&s.opacity>.005).map(s=>({...s,position:new THREE.Vector3(...s.position)}));
   return a.frame;
 }
 get pickables(){return this.teaching.pickables;}
}
