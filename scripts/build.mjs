import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { build } from 'esbuild';
import { createHash } from 'node:crypto';

await mkdir('build', { recursive: true });
await build({ entryPoints: ['src/experience.js'], outfile: 'build/experience.js', bundle: true, format: 'iife', minify: true, sourcemap: true, target: ['es2022'] });
await cp('node_modules/three/examples/jsm/libs/draco/gltf', 'build/draco', { recursive: true });
await cp('node_modules/three/LICENSE','build/THREE-LICENSE.txt');
await cp('assets/DRACO-LICENSE.txt','build/draco/LICENSE.txt');
const read = p => readFile(p, 'utf8');
let html = await read('src/index.html');
for (const [marker, path] of Object.entries({CSS:'src/styles.css', CATALOG:'data/catalog.json', SCENARIOS:'data/scenarios.json', MODES:'data/modes.json', LOCALE:'data/locale.json', I18N:'src/i18n.js', IDENTITY:'src/identity.js', STUDIO:'src/studio.js', APP:'src/app.js'})) {
  let value = await read(path);
  if (path.endsWith('.json')) {
    let data=JSON.parse(value);
    if(marker==='LOCALE') data={...data,...JSON.parse(await read('data/locale-v5.json'))};
    value=JSON.stringify(data).replaceAll('<', '\\u003c');
  }
  else if (path.endsWith('.js')) value = value.replaceAll('</script', '<\\/script');
  html = html.replace(`/*__${marker}__*/`, () => value);
}
const bundleVersion=createHash('sha256').update(await readFile('build/experience.js')).digest('hex').slice(0,12);
html = html.replace('<script>/*__ENGINE__*/</script>', `<script src="build/experience.js?v=${bundleVersion}"></script>`);
const experienceCSS=(await read('src/experience.css'))+'\n'+(await read('src/product.css')); 
html = html.replace('</head>', () => `<style>${experienceCSS}</style></head>`);
if (/\/\*__\w+__\*\//.test(html)) throw new Error('Unresolved build marker');
await writeFile('index.html', html);
console.log('Built index.html + build/experience.js; serve the repository over HTTP.');
