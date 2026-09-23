import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HomeScene } from './home-scene.js';
import { LessonPlayer } from './lessons.js';
import { ScrollMotion } from './motion.js';
import { prepareModel } from './prepare-model.js';
import { scenePose } from './choreography.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { assetRegistry, moduleDefinitions, moduleForService } from './assets.js';

function disposeTree(root) {
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root.traverse(object=>{if(object.geometry)geometries.add(object.geometry);for(const material of [object.material].flat().filter(Boolean)){materials.add(material);for(const v of Object.values(material))if(v?.isTexture)textures.add(v);}});
  textures.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());geometries.forEach(x=>x.dispose());
}

export class WhaleWorld {
  constructor(canvas,{onSelect=()=>{},onError=()=>{},onLoad=()=>{},home=false}={}) {
    this.canvas=canvas;this.home=home;this.onSelect=onSelect;this.onError=onError;this.onLoad=onLoad;this.disposed=false;this.loaded=new Map();this.pending=new Set();this.abort=new AbortController();
    this.motion=new ScrollMotion();this.state={active:[],selected:null,chapter:0,progress:0,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,theme:'dark',visible:true,explosion:.75};
    if(new URLSearchParams(location.search).get('graphics')==='off')throw new Error('Graphics disabled for fallback verification');
    this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.25:1.5));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.65;
    this.scene=new THREE.Scene();if(home){const room=new RoomEnvironment();const pmrem=new THREE.PMREMGenerator(this.renderer);this.environment=pmrem.fromScene(room,.06);this.scene.environment=this.environment.texture;room.dispose();pmrem.dispose();this.renderer.toneMappingExposure=1.05;}this.camera=new THREE.PerspectiveCamera(38,1,.1,180);this.camera.position.set(28,18,34);
    this.controls=new OrbitControls(this.camera,canvas);this.controls.enableDamping=false;this.controls.minDistance=15;this.controls.maxDistance=65;this.controls.enablePan=false;this.controls.enabled=!home;canvas.style.touchAction=home?'pan-y':'none';
    this.scene.add(new THREE.HemisphereLight(0xc6daf7,0x10131c,home?.65:3));
    for(const [color,intensity,pos] of [[0xffecd0,5,[10,25,16]],[0x44d9dd,4,[-20,8,-10]],[0xa1bfff,3,[0,3,-25]]]){const l=new THREE.DirectionalLight(home?(color===0xffecd0?0xf5f5ff:0x9db9e3):color,home?intensity*.55:intensity);l.position.set(...pos);this.scene.add(l);}
    this.group=new THREE.Group();this.scene.add(this.group);this.homeScene=home?new HomeScene(this.scene,this.loaded,moduleDefinitions):null;this.teaching=this.homeScene?.teaching;this.players={1:new LessonPlayer(1),2:new LessonPlayer(2)};this.providerIndex=1;
    this.draco=new DRACOLoader().setDecoderPath('build/draco/');this.loader=new GLTFLoader().setDRACOLoader(this.draco);
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();this.labels=[];
    this.flowLine=new THREE.Line(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3)),new THREE.LineBasicMaterial({color:0xf4bd8e,transparent:true,opacity:.6}));this.flowLine.visible=false;this.scene.add(this.flowLine);
    this.signal=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),new THREE.MeshBasicMaterial({color:0xffd3a0}));this.signal.visible=false;this.scene.add(this.signal);
    const signal=this.abort.signal;
    canvas.addEventListener('pointerdown',e=>{this.pointerStart=[e.clientX,e.clientY];},{signal});
    canvas.addEventListener('pointerup',e=>{if(!this.pointerStart||Math.hypot(e.clientX-this.pointerStart[0],e.clientY-this.pointerStart[1])>6)return;const r=canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hits=this.raycaster.intersectObjects([...this.loaded.values()].filter(x=>x.visible).concat(this.teaching?.pickables||[]),true);let o=hits[0]?.object;while(o&&!o.userData.assetId)o=o.parent;if(o)this.onSelect(o.userData.assetId);},{signal});
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.state.visible=false;this.onError(new Error('WebGL context lost'));},{signal});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.invalidate();},{signal});
    this.controls.addEventListener('change',()=>this.invalidate());
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas.parentElement);
    this.load('orca_hull');this.resize();
  }
  async load(id) {
    if(this.loaded.has(id)||this.pending.has(id)||!assetRegistry[id]||this.disposed)return;
    this.pending.add(id);
    try {
      const gltf=await this.loader.loadAsync(assetRegistry[id].path);
      if(this.disposed){disposeTree(gltf.scene);return;}
      const root=prepareModel(gltf.scene,id);
      this.loaded.set(id,root);this.group.add(root);this.canvas.dataset.loaded=String(this.loaded.size);this.onLoad(id);this.invalidate();
    } catch(error){if(!this.disposed){this.canvas.dataset.assetError=id;this.onError(error,id);}}
    finally{this.pending.delete(id);}
  }
  resize(){if(this.disposed)return;const rect=this.canvas.parentElement.getBoundingClientRect();if(!rect.width||!rect.height)return;this.width=rect.width;this.height=rect.height;this.renderer.setSize(rect.width,rect.height,false);this.camera.aspect=rect.width/rect.height;if(!this.home){const fit=Math.max(.72,.88/this.camera.aspect);this.camera.position.sub(this.controls.target).multiplyScalar(fit/(this.caseFit||1)).add(this.controls.target);this.caseFit=fit;this.controls.maxDistance=65*fit;this.controls.minDistance=15*fit;}this.camera.updateProjectionMatrix();this.invalidate();}
  setState(next){if(next.stepKey&&next.stepKey!==this.state.stepKey)this.stepStarted=performance.now();Object.assign(this.state,next);if(this.home&&next.chapter!==undefined)this.motion.set(next.chapter+(next.progress||0),!this.frames||this.state.reduced);if(this.state.visible){const ids=this.home?this.homeScene.required:[...new Set(this.state.active.map(moduleForService).concat(this.state.selected?moduleForService(this.state.selected):[]))];ids.forEach(id=>this.load(id));}this.invalidate();}
  chapterAssets(chapter=this.state.chapter){return [[],['agent_loop','llm_core','session_spine','tool_registry','capability_seam'],['agent_loop','llm_core','tool_registry','session_spine'],['capability_seam','tool_registry','approval_airlock'],['session_spine','compaction_chamber'],['subagent_orca','job_drone','cordis_workshop'],['agent_loop','llm_core','tool_registry','subagent_orca','cordis_workshop']][chapter]||[];}
  lessonAction(action,step,provider){const player=this.players[this.state.chapter];if(!player)return;if(provider!==undefined){this.providerIndex=provider;player.seek(0);player.playing=true;}else if(action==='toggle')player.toggle();else if(action==='seek')player.seek(step);else if(action==='next')player.seek(Math.floor(player.position)+1);else if(action==='previous')player.seek(Math.floor(player.position)-1);this.invalidate();}
  setExplore(value){this.controls.enabled=value;this.canvas.style.touchAction=value?'none':'pan-y';if(!value)this.reset();}
  reset(){this.camera.position.set(28,18,34).multiplyScalar(this.caseFit||1);this.controls.target.set(0,0,0);this.controls.update();this.invalidate();}
  top(){this.camera.position.set(.01,43,.01).multiplyScalar(this.caseFit||1);this.controls.target.set(0,0,0);this.controls.update();this.invalidate();}
  invalidate(){if(this.disposed||this.frame)return;this.frame=requestAnimationFrame(t=>{this.frame=null;this.draw(t);});}
  draw(time){
    if(this.disposed||!this.state.visible||document.hidden||!this.width)return;
    if(this.state.playing&&time-(this.lastDraw||0)<32){this.invalidate();return;}this.lastDraw=time;
    const {reduced,theme,explosion}=this.state;
    const position=this.home?this.motion.advance(time,reduced):0,chapter=this.home?Math.min(6,Math.floor(position)):this.state.chapter,progress=this.home?position-chapter:this.state.progress;
    const pose=this.home?scenePose(chapter,progress,{reduced,mobile:this.width<760,aspect:this.width/this.height}):null;
    let lessonFrame=null;
    const isLesson=this.home&&(chapter===1||chapter===2);
    if(this.home){
      if(!this.controls.enabled){this.camera.position.set(...pose.camera);this.camera.lookAt(0,0,0);this.camera.setViewOffset(this.width,this.height,-this.width*pose.screen[0],-this.height*pose.screen[1],this.width,this.height);}else this.camera.clearViewOffset();
      this.group.rotation.y=0;
      if(this.activeLesson!==chapter){for(const player of Object.values(this.players))player.time=null;this.activeLesson=chapter;}
      if(isLesson&&!this.controls.enabled)this.players[chapter].advance(time,reduced);
      lessonFrame=this.homeScene.update(chapter,pose,{1:this.players[1].position,2:this.players[2].position},this.providerIndex,this.width<760);
    }else{
      const active=[...new Set(this.state.active.map(moduleForService).concat(this.state.selected?moduleForService(this.state.selected):[]))],open=Math.max(.35,explosion),hull=this.loaded.get('orca_hull');
      if(hull){hull.visible=true;
        if(this.lastOpen!==open||this.lastHull!==hull){
          for(const o of hull.userData.panels){o.position.copy(o.userData.basePosition);const name=o.userData.panelKind;
            if(name==='left')o.position.x-=open*3;else if(name==='right')o.position.x+=open*3;else if(name==='head')o.position.z+=open*2;else if(name==='belly')o.position.y-=open*2;else o.position.y+=open*3;
          }
          for(const m of hull.userData.materials){m.transparent=true;m.opacity=1-open*.84;m.depthWrite=false;}
          this.lastOpen=open;this.lastHull=hull;
        }
      }
      let extra=0;const selected=moduleForService(this.state.selected);
      for(const [id,root] of this.loaded){if(id==='orca_hull')continue;root.visible=active.includes(id);if(!root.visible)continue;
        const def=moduleDefinitions.find(x=>x[0]===id);root.position.set(...(def?.[6]||[extra++%2===0?-7:7,1,4-extra*4]));root.scale.setScalar(id==='subagent_orca'?.7:id==='session_spine'?.85:1.2);root.rotation.set(0,id==='subagent_orca'?-.3:0,0);
        if(root.userData.selected!==(id===selected)){for(const m of root.userData.materials)if(m.emissive)m.emissiveIntensity=m.userData.originalEmissiveIntensity+(id===selected?.5:0);root.userData.selected=id===selected;}
      }
    }
    const flow=this.home?null:this.state.flow;
    const from=flow&&this.loaded.get(moduleForService(flow.from)),to=flow&&this.loaded.get(moduleForService(flow.to));
    this.flowLine.visible=!!(from?.visible&&to?.visible&&from!==to);this.signal.visible=this.flowLine.visible;
    if(this.flowLine.visible){this.group.updateMatrixWorld(true);const a=from.getWorldPosition(new THREE.Vector3()),b=to.getWorldPosition(new THREE.Vector3());a.y+=1;b.y+=1;const attr=this.flowLine.geometry.attributes.position;attr.setXYZ(0,a.x,a.y,a.z);attr.setXYZ(1,b.x,b.y,b.z);attr.needsUpdate=true;this.flowLine.geometry.computeBoundingSphere();const phase=reduced?.5:this.home?this.state.progress:((time-(this.stepStarted||time))*.00035*(this.state.speed||1))%1;this.signal.position.lerpVectors(a,b,this.state.playing||this.home?phase:.5);}
    this.renderer.setClearColor(theme==='light'?0xe2eff0:0x061820,0);
    this.renderer.render(this.scene,this.camera);this.frames=(this.frames||0)+1;this.canvas.dataset.rendered='true';
    if(this.home){this.annotationFrame={chapter,lesson:lessonFrame,playing:isLesson&&this.players[chapter].playing&&!reduced,anchors:this.homeScene.anchors};}
    if(this.onFrame)this.onFrame(time,this.annotationFrame);
    if((this.state.playing&&!reduced)||(this.home&&this.motion.moving)||(isLesson&&this.players[chapter].playing&&!reduced&&!this.controls.enabled))this.invalidate();
  }

  projectPosition(position){const p=position.clone().project(this.camera);return {x:(p.x+1)*this.width/2,y:(1-p.y)*this.height/2,visible:p.z>-1&&p.z<1};}
  project(id){const root=this.loaded.get(id);if(!root?.visible)return null;const p=root.getWorldPosition(new THREE.Vector3()).project(this.camera);return {x:(p.x+1)*this.width/2,y:(1-p.y)*this.height/2};}
  dispose(){if(this.disposed)return;this.disposed=true;cancelAnimationFrame(this.frame);this.abort.abort();this.resizeObserver.disconnect();this.controls.dispose();this.draco.dispose();disposeTree(this.scene);this.scene.clear();this.loaded.clear();this.environment?.dispose();this.renderer.dispose();if(this.home)this.renderer.forceContextLoss();}
}

export class CaseRenderer {
  constructor(canvas,data,onSelect,onFailure){
    this.canvas=canvas;this.data=data;this.onSelect=onSelect;this.onFailure=onFailure;this.motion=new ScrollMotion();this.state={active:[],visible:false};this.frames=0;this.software=false;
    this.labelsRoot=document.getElementById('projected-labels');this.flatRoot=document.createElement('div');this.flatRoot.className='semantic-flat';this.flatRoot.hidden=true;canvas.closest('.stage').append(this.flatRoot);this.legend=document.createElement('div');this.legend.className='case-label-list';canvas.closest('.stage').append(this.legend);
    this.abort=new AbortController();this.flatRoot.addEventListener('click',e=>{const b=e.target.closest('[data-node]');if(b)onSelect(b.dataset.node);},{signal:this.abort.signal});
  }
  ensureWorld(){if(this.world||this.failed)return;try{this.world=new WhaleWorld(this.canvas,{onSelect:id=>{const choices=this.data.services.filter(s=>moduleForService(s.id)===id);this.onSelect(choices.find(s=>this.state.active.includes(s.id))?.id||choices[0]?.id||'agents');},onLoad:()=>this.updateLabels(),onError:(e,id)=>{if(id&&id!=='orca_hull'){this.assetWarning=id;this.updateLabels();return;}this.failed=true;this.onFailure(e);}});this.world.onFrame=()=>this.updateLabels();}catch(e){this.failed=true;this.onFailure(e);}}
  setState(next){Object.assign(this.state,next);const hidden=['home','library','modes'].includes(document.body.dataset.view);this.state.visible=!hidden;
    if(hidden){if(this.world){this.world.dispose();this.world=null;}this.failed=false;this.labelsRoot.replaceChildren();this.legend.replaceChildren();delete this.legend.dataset.key;return;}
    this.ensureWorld();this.flatRoot.hidden=!(this.state.flat||this.state.focus);this.canvas.style.visibility=this.flatRoot.hidden?'visible':'hidden';this.labelsRoot.style.visibility=this.flatRoot.hidden?'visible':'hidden';this.legend.hidden=!this.flatRoot.hidden;
    if(!this.flatRoot.hidden)this.renderFlat();this.world?.setState({...this.state,visible:this.flatRoot.hidden});this.frames=this.world?.frames||0;
  }
  updateLabels(){
    if(!this.world||!this.labelsRoot||!this.state.visible)return;
    const t=window.DSHLocale?.t||String,entries=[...new Set(this.state.active.concat(this.state.selected||[]))].map(id=>({id,service:this.data.services.find(s=>s.id===id),point:this.world.project(moduleForService(id))})).filter(e=>e.service&&e.point);
    this.labelsRoot.replaceChildren();const key=entries.map(e=>e.id+':'+t(e.service.title)).join('|')+':'+this.state.selected;
    if(this.legend.dataset.key!==key){this.legend.dataset.key=key;this.legend.replaceChildren(...entries.map((e,i)=>{const b=document.createElement('button');b.className='case-label-item';b.dataset.serviceId=e.id;b.setAttribute('aria-pressed',String(e.id===this.state.selected));const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');b.append(n,document.createTextNode(t(e.service.title)));b.onclick=()=>this.onSelect(e.id);return b;}));}
    const seen=new Map();
    for(const [i,e] of entries.entries()){
      const asset=moduleForService(e.id),offset=seen.get(asset)||0;seen.set(asset,offset+1);
      const x=e.point.x+offset*22,y=e.point.y;
      if(x<12||x>this.world.width-12||y<12||y>this.world.height-12)continue;
      const marker=document.createElement('span');marker.className='case-model-marker';marker.textContent=String(i+1).padStart(2,'0');marker.style.left=x+'px';marker.style.top=y+'px';this.labelsRoot.append(marker);
      if(e.id===this.state.selected){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('case-label-leader');const line=document.createElementNS(svg.namespaceURI,'path');line.setAttribute('d',`M ${x} ${y+10} L ${x} ${this.world.height+8}`);svg.append(line);this.labelsRoot.prepend(svg);}
    }
    this.frames=this.world.frames;
  }
  renderFlat(){const t=window.DSHLocale?.t||String;const services=this.state.focus?this.data.services.filter(s=>s.id===this.state.selected):this.data.services.filter(s=>this.state.active.includes(s.id));this.flatRoot.replaceChildren();const heading=document.createElement('p');heading.textContent=t(this.state.focus?'接口、提供方与使用方':'本步骤参与的组件');this.flatRoot.append(heading);for(const s of services){const button=document.createElement('button');button.dataset.node=s.id;const title=document.createElement('strong');title.textContent=t(s.title);const key=document.createElement('code');key.textContent='ctx.'+s.id;button.append(title,key);this.flatRoot.append(button);if(this.state.focus){const info=document.createElement('p');info.textContent=`${t('声明')}：${s.owner} · ${t('实现方')}：${s.implementations.join(', ')||'—'} · ${t('调用方')}：${s.consumers.join(', ')||'—'}`;this.flatRoot.append(info);}}
    if(this.state.flow&&!this.state.focus){const p=document.createElement('p');p.textContent=`${this.state.flow.from} → ${this.state.flow.to} · ${t(this.state.flow.label)}`;this.flatRoot.append(p);}
  }
  reset(){this.world?.reset();}top(){this.world?.top();}dispose(){this.abort.abort();this.world?.dispose();this.flatRoot.remove();this.legend.remove();this.labelsRoot.replaceChildren();}
}
