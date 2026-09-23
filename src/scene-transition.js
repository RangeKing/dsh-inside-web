import * as THREE from 'three';

// Both layouts use stable semantic identities, so a shared component travels instead of respawning.
export function mixLayouts(from,to,blend){
 const result=new Map();
 for(const key of new Set([...from.keys(),...to.keys()])){
   const a=from.get(key),b=to.get(key),reference=a||b;
   const absent=(state,entering)=>({...state,opacity:0,scale:state.scale*.94,position:state.position.map((v,i)=>v+(i===1?(entering?-1.2:1.2):0))});
   const start=a||absent(b,true),end=b||absent(a,false);
   const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...start.rotation));q.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(...end.rotation)),blend);
   result.set(key,{...(blend<.5?start:end),key,root:reference.root,
     opacity:start.opacity+(end.opacity-start.opacity)*blend,
     position:start.position.map((v,i)=>v+(end.position[i]-v)*blend),
     scale:start.scale+(end.scale-start.scale)*blend,quaternion:q,
     offset:start.offset.map((v,i)=>v+(end.offset[i]-v)*blend),
   });
 }
 return result;
}

export function applyPresentation(state,opacity=state.opacity){
 const root=state.root;root.visible=opacity>.000001;root.position.set(...state.position);root.scale.setScalar(state.scale);root.quaternion.copy(state.quaternion);
 root.userData.presentationOpacity=opacity;
 for(const m of root.userData.materials){
   m.opacity=(m.userData.presentationBaseOpacity??1)*opacity;
   m.transparent=true;
   m.depthWrite=opacity>.98&&m.userData.presentationBaseDepthWrite;
 }
}

export function preparePresentation(root){
 if(root.userData.presentationReady)return root;
 const materials=new Set(),bounds=new THREE.Box3();
 root.traverse(o=>{if(!o.isMesh)return;materials.add(o.material);if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox);});
 root.userData.materials=[...materials];
 for(const m of materials){m.userData.presentationBaseOpacity=m.opacity;m.userData.presentationBaseTransparent=m.transparent;m.userData.presentationBaseDepthWrite=m.depthWrite;m.transparent=true;m.forceSinglePass=true;m.needsUpdate=true;}
 const size=bounds.getSize(new THREE.Vector3());root.userData.presentationSize=Math.max(size.x,size.y,size.z)||1;root.userData.presentationReady=true;return root;
}
