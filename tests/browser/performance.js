import { WhaleWorld } from '../../src/world.js';
const canvas=document.querySelector('canvas'),out=document.querySelector('output'),button=document.querySelector('button');
const world=new WhaleWorld(canvas,{home:true,onLoad:()=>{if(world.loaded.has('orca_hull')&&world.teaching.required.every(id=>world.loaded.has(id))){button.disabled=false;out.textContent='Ready. 6 seconds, 10 wheel updates/second. Final integrated lesson scene.';}}});
world.setState({chapter:1,progress:0});
button.onclick=()=>{
 button.disabled=true;const start=performance.now(),times=[],positions=[];let tick=-1,updates=0;
 world.setState({visible:true,reduced:false});world.players[1].position=0;world.players[1].playing=true;world.players[1].time=null;
 world.onFrame=time=>{times.push(time);positions.push(world.camera.position.toArray());};
 function feed(time){const elapsed=time-start,k=Math.floor(elapsed/100);if(k!==tick&&elapsed<6000){tick=k;world.setState({chapter:1,progress:Math.min(1,elapsed/6000)});updates++;}
 if(elapsed<6600)requestAnimationFrame(feed);else{
   world.onFrame=null;const gaps=times.slice(1).map((v,i)=>v-times[i]).sort((a,b)=>a-b),steps=positions.slice(1).map((v,i)=>Math.hypot(...v.map((x,j)=>x-positions[i][j])));
   const report={scenario:'Final integrated plugin scene; 10-Hz scroll input',updates,frames:times.length,frameGapP50:gaps[Math.floor(gaps.length*.5)],frameGapP95:gaps[Math.floor(gaps.length*.95)],maxCameraVectorStep:Math.max(...steps),drawCalls:world.renderer.info.render.calls,triangles:world.renderer.info.render.triangles};
   world.setState({reduced:true});requestAnimationFrame(()=>{const reducedStart=world.frames;setTimeout(()=>{report.reducedIdleFrames=world.frames-reducedStart;world.setState({visible:false});const hiddenStart=world.frames;setTimeout(()=>{report.hiddenFrames=world.frames-hiddenStart;report.lifecyclePass=report.reducedIdleFrames===0&&report.hiddenFrames===0;out.textContent=JSON.stringify(report,null,2);button.disabled=false;},350);},350);});
 }}requestAnimationFrame(feed);
};
