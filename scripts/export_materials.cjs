/* Export the same original teaching corpus shipped by the offline webpage. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
global.window={DSHLocale:{t:x=>x,language:'zh'}};
global.document={getElementById:()=>({textContent:fs.readFileSync(path.join(root,'data/modes.json'),'utf8')})};
require(path.join(root,'src/studio.js'));
for(const lang of ['zh','en']){
 const dst=path.join(root,'examples/materials','farstar-1200-'+lang+'.txt');
 const text=window.DSHStudy.corpus(lang);fs.writeFileSync(dst,text,'utf8');
 console.log(path.basename(dst),text.length,'characters',Buffer.byteLength(text),'bytes');
}
