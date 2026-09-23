import * as THREE from 'three';
// Product-style finishes keyed by the shared GLB material names. Values are presentation choices, not asset data.
const finishes={
 MAT_HULL_DARK:{metalness:.28,roughness:.46,clearcoat:.18,clearcoatRoughness:.45},
 MAT_HULL_GRAPHITE:{metalness:.5,roughness:.36,clearcoat:.15,clearcoatRoughness:.45},
 MAT_IVORY:{metalness:0,roughness:.46,clearcoat:.25,clearcoatRoughness:.5,sheen:.35,sheenRoughness:.6},
 MAT_EMISSIVE_CYAN:{emissiveIntensity:1.6,roughness:.25},
};
export function refineMaterials(root){
 const swapped=new Map();
 root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const source=o.material,finish=finishes[source.name];if(!finish||!source.isMeshStandardMaterial)return;
   if(!swapped.has(source)){const m=new THREE.MeshPhysicalMaterial();THREE.MeshStandardMaterial.prototype.copy.call(m,source);m.name=source.name;
     for(const [k,v] of Object.entries(finish)){if(k==='emissiveIntensity')m.emissiveIntensity=(source.emissiveIntensity||1)*v/1.2;else m[k]=v;}
     m.envMapIntensity=source.name==='MAT_EMISSIVE_CYAN'?.6:1.15;m.userData={...source.userData,originalEmissiveIntensity:m.emissiveIntensity};swapped.set(source,m);}
   o.material=swapped.get(source);});
 if(root.userData.materials)root.userData.materials=root.userData.materials.map(m=>swapped.get(m)||m);
 swapped.forEach((_,old)=>old.dispose());return root;
}
