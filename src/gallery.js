import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { assetRegistry } from './assets.js';

const cache=new Map();let generation=0;
function dispose(root){const geometries=new Set(),materials=new Set(),textures=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [o.material].flat().filter(Boolean)){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});geometries.forEach(x=>x.dispose());materials.forEach(x=>x.dispose());textures.forEach(x=>x.dispose());}
// One short-lived context produces transparent product stills from the real assets.
// No render loop, no extra live 3D scenes per card; stills survive language/theme changes.
export async function refreshGallery(mode){
 const ticket=++generation;if(mode!=='library'||new URLSearchParams(location.search).get('graphics')==='off')return;
 await new Promise(resolve=>requestAnimationFrame(resolve));
 if(ticket!==generation)return;
 const images=[...document.querySelectorAll('[data-product-asset]')];
 const assign=(id,url)=>images.filter(img=>img.dataset.productAsset===id).forEach(img=>{img.src=url;img.classList.add('ready');});
 images.forEach(img=>{if(cache.has(img.dataset.productAsset))assign(img.dataset.productAsset,cache.get(img.dataset.productAsset));});
 const missing=[...new Set(images.map(img=>img.dataset.productAsset))].filter(id=>!cache.has(id));if(!missing.length)return;
 let renderer,draco,environment;
 try{
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});renderer.setSize(960,540);renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,960/540,.01,1000);
  const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);environment=pmrem.fromScene(room,.06);scene.environment=environment.texture;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xf2f5ff,0x667084,2));const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(5,12,8);scene.add(key);
  draco=new DRACOLoader().setDecoderPath('build/draco/');const loader=new GLTFLoader().setDRACOLoader(draco);
  for(const id of missing){
   if(ticket!==generation)break;
   let root;
   try{
    root=(await loader.loadAsync(assetRegistry[id].path)).scene;
    if(ticket!==generation)break;
    const box=new THREE.Box3().setFromObject(root),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());root.position.sub(center);scene.add(root);
    const radius=size.length()/2;camera.position.copy(new THREE.Vector3(1,.52,1).normalize().multiplyScalar(radius/Math.sin(THREE.MathUtils.degToRad(16))*1.02));camera.near=radius/100;camera.far=radius*30;camera.lookAt(0,0,0);camera.updateProjectionMatrix();renderer.render(scene,camera);
    const url=renderer.domElement.toDataURL('image/png');cache.set(id,url);assign(id,url);
   }finally{if(root){scene.remove(root);dispose(root);}}
  }
 }catch{ /* Decorative stills may fail; the case title and links remain usable. */ }
 finally{draco?.dispose();environment?.dispose();renderer?.dispose();renderer?.forceContextLoss();}
}
