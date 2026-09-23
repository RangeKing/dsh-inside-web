const NS='http://www.w3.org/2000/svg';
const offsets={consumer:[-65,75],port:[0,85],old:[70,70],next:[30,-78],record:[-50,-65],input:[0,-58],loop:[-25,-85],memory:[-35,67],model:[30,-62],tool:[45,70],output:[0,-58]};
export class ModelAnnotations {
 constructor(root,translate){this.root=root;this.translate=translate;this.nodes=new Map();this.svg=document.createElementNS(NS,'svg');this.svg.classList.add('annotation-lines');root.append(this.svg);}
 update(world,anchors,chapter){
  const mobile=world.width<760,activeKeys=new Set(),placed=[];this.root.dataset.mobile=String(mobile);
  for(let i=0;i<anchors.length;i++){
   const a=anchors[i],p=world.projectPosition(a.position);if(!p.visible)continue;activeKeys.add(a.key);
   let node=this.nodes.get(a.key);if(!node){const button=document.createElement('button');button.className='model-callout';button.dataset.module=a.id;button.innerHTML='<span class="callout-number"></span><span class="callout-copy"><strong></strong><small></small></span>';const line=document.createElementNS(NS,'path');this.svg.append(line);this.root.append(button);node={button,line};this.nodes.set(a.key,node);}
   const {button,line}=node;button.hidden=false;line.style.display='';button.dataset.module=a.id;button.dataset.annotationKey=a.key;
   const label=this.translate(a.label),note=this.translate(a.note);if(button.getAttribute('aria-label')!==label+' — '+note){button.setAttribute('aria-label',label+' — '+note);button.querySelector('strong').textContent=label;button.querySelector('small').textContent=note;}
   button.querySelector('.callout-number').textContent=String(i+1).padStart(2,'0');button.classList.toggle('active',!!a.active);
   button.style.opacity=String(a.opacity??1);line.style.opacity=String(a.opacity??1);
   let [dx,dy]=a.offset||offsets[a.key]||[i%2?70:-60,i%2?-60:60];
   let x=mobile?p.x:p.x+dx,y=mobile?p.y-30:p.y+dy;
   const width=mobile?26:190,height=mobile?26:52;x=Math.max(width/2+12,Math.min(world.width-width/2-32,x));y=Math.max(mobile?240:155,Math.min(world.height-(mobile?235:165),y));
   if(!mobile){for(let tries=0;tries<8&&placed.some(r=>Math.abs(r.x-x)<width+8&&Math.abs(r.y-y)<height+6);tries++)y+=dy<0?-height-8:height+8;}
   placed.push({x,y});button.style.transform=`translate3d(${x-width/2}px,${y-height/2}px,0)`;line.setAttribute('d',`M${p.x.toFixed(1)},${p.y.toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)}`);
  }
  for(const [key,node] of this.nodes)if(!activeKeys.has(key)){node.button.hidden=true;node.line.style.display='none';}
  const legend=document.querySelector(`[data-chapter-index="${chapter}"] .model-legend`);
  const legendKey=anchors.map(a=>this.translate(a.label)).join('|');if(legend&&legend.dataset.key!==legendKey){legend.dataset.key=legendKey;legend.replaceChildren(...anchors.map((a,i)=>{const button=document.createElement('button');button.dataset.module=a.id;button.dataset.annotationKey=a.key;button.textContent=`${String(i+1).padStart(2,'0')} ${this.translate(a.label)}`;return button;}));}
 }
 clear(){for(const node of this.nodes.values()){node.button.hidden=true;node.line.style.display='none';}}
}
