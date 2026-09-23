import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
export function panelKind(name){if(!name.includes('__panel_'))return 'fixed';return ['left','right','head','belly'].find(k=>name.includes(k))||'top';}
// Bake static local transforms, retaining each moving shell panel as a separate batch.
export function prepareModel(source,id){
 source.updateMatrixWorld(true);const batches=new Map(),originals=new Set();
 source.traverse(o=>{if(!o.isMesh)return;if(o.isSkinnedMesh||Array.isArray(o.material))throw new Error('Static single-material model expected');
   const kind=id==='orca_hull'?panelKind(o.name):'fixed';
   const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);const key=[kind,o.material.uuid,Object.keys(geometry.attributes).sort().join(','),!!geometry.index].join('|');
   if(!batches.has(key))batches.set(key,{kind,material:o.material,geometries:[]});batches.get(key).geometries.push(geometry);originals.add(o.geometry);
 });
 const root=new THREE.Group();root.userData.assetId=id;root.userData.panels=[];root.userData.materials=[];
 for(const {kind,material,geometries} of batches.values()){
   const geometry=mergeGeometries(geometries,false);if(!geometry)throw new Error('Incompatible static model geometry');
   geometries.forEach(g=>g.dispose());material.forceSinglePass=true;
   const mesh=new THREE.Mesh(geometry,material);mesh.name=id+'__'+kind;mesh.userData.basePosition=new THREE.Vector3();
   mesh.userData.panelKind=kind;root.add(mesh);if(kind!=='fixed')root.userData.panels.push(mesh);
   if(!root.userData.materials.includes(material)){material.userData.originalEmissiveIntensity=material.emissiveIntensity||0;root.userData.materials.push(material);}
 }
 originals.forEach(g=>g.dispose());return root;
}
