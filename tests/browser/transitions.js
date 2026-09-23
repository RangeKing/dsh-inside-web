import { WhaleWorld } from '../../src/world.js';
const canvas=document.querySelector('canvas'),out=document.querySelector('output'),audit=document.querySelector('#audit'),slider=document.querySelector('#position');
const world=new WhaleWorld(canvas,{home:true});
const required=[...new Set(Array.from({length:7},(_,i)=>world.chapterAssets(i)).flat().concat(['orca_hull','support_node']))];
await Promise.all(required.map(id=>world.load(id)));
function snapshot(p){world.setState({chapter:Math.min(6,Math.floor(p)),progress:p%1});world.motion.set(p,true);Object.values(world.players).forEach(player=>player.playing=false);world.draw(performance.now());world.scene.updateMatrixWorld(true);
 const meshes={};world.scene.traverse(o=>{if(!o.isMesh)return;let visible=true;for(let n=o;n;n=n.parent)visible&&=n.visible;meshes[o.uuid]={opacity:visible?o.material.opacity:0,matrix:o.matrixWorld.elements.slice()};});return {meshes,camera:world.camera.position.toArray()};}
function delta(a,b){let opacity=0,transform=0;for(const id of new Set([...Object.keys(a.meshes),...Object.keys(b.meshes)])){const x=a.meshes[id],y=b.meshes[id];opacity=Math.max(opacity,Math.abs((x?.opacity||0)-(y?.opacity||0)));if(x?.opacity>.1&&y?.opacity>.1)transform=Math.max(transform,...x.matrix.map((v,i)=>Math.abs(v-y.matrix[i])));}
 return {opacity,transform,camera:Math.hypot(...a.camera.map((v,i)=>v-b.camera[i]))};}
function report(){const boundaries=[];for(let boundary=1;boundary<=6;boundary++){const a=snapshot(boundary-.0001),b=snapshot(boundary+.0001),reverse=snapshot(boundary-.0001);const d=delta(a,b),r=delta(a,reverse);boundaries.push({boundary,...d,reverseError:Math.max(r.opacity,r.transform,r.camera)});}const pass=boundaries.every(d=>d.opacity<.02&&d.transform<.02&&d.camera<.02&&d.reverseError<.00001);out.textContent=JSON.stringify({pass,boundaries},null,2);snapshot(+slider.value);}
audit.onclick=report;slider.oninput=()=>{snapshot(+slider.value);out.textContent='Scene position: '+slider.value;};
let run=0;function play(direction){const id=++run,start=performance.now(),initial=+slider.value;function tick(time){if(run!==id)return;const p=Math.max(0,Math.min(6.5,initial+direction*(time-start)/2500));slider.value=p;snapshot(p);out.textContent='Scene position: '+p.toFixed(3);if(p>0&&p<6.5)requestAnimationFrame(tick);}requestAnimationFrame(tick);}
document.querySelector('#forward').onclick=()=>play(1);document.querySelector('#reverse').onclick=()=>play(-1);slider.onpointerdown=()=>run++;
document.querySelector('#mobile').onchange=e=>{canvas.parentElement.style.width=e.target.checked?'390px':'100%';world.resize();snapshot(+slider.value);};
function ready(){if(required.every(id=>world.loaded.has(id))){snapshot(0);audit.disabled=false;out.textContent='Ready. Samples actual model matrices and opacity on both sides of every boundary.';}else requestAnimationFrame(ready);}ready();
