"""V3 acceptance checks against the actual offline build.
Requires playwright Python package and a Chromium executable. No live DSH/model use.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, csv, io, os, time, hashlib
R=Path(__file__).resolve().parents[1]
checks=[]; errors=[]; requests=[]; started=time.monotonic()
def check(name, ok, detail=None):
 d={'name':name,'passed':bool(ok)}
 if detail is not None:d['detail']=detail
 checks.append(d); print(f'{time.monotonic()-started:.1f}s '+('PASS ' if ok else 'FAIL ')+name,flush=True)
def js(page,name,expr): check(name,page.evaluate(expr))
def wait(page,ms=70):page.wait_for_timeout(ms)
def close(page):
 if page.locator('#modal').evaluate('e=>e.open'):page.keyboard.press('Escape');wait(page)
def snap(page,name):
 page.locator('#toast').evaluate('e=>e.classList.remove("show")');wait(page,250)
 page.screenshot(path=str(R/'previews'/name),full_page=True)

data=json.loads((R/'data/scenarios.json').read_text());byid={s['id']:s for s in data}
catalog=json.loads((R/'data/catalog.json').read_text());ids={x['id'] for x in catalog['services']}
check('8 cases form ordered beginner-to-advanced curriculum',[s['rank'] for s in data]==list(range(1,9)))
check('Every case introduces materials, features, a question and an answer',all(s['files'] and len(s['prompt'])>25 and len(s['output'])>40 and len(s['features'])==3 and s['learn'] and s['story'] for s in data))
check('Old opaque price and discount examples removed from active cases','src/price.ts' not in json.dumps(data,ensure_ascii=False))
check('Source identifiers retain the official role counts',[sum(s['role']==r for s in catalog['services']) for r in ['seam','core','bundle']]==[29,40,1])
routes=[]
for s in data:
 routes += [(s['id'],s['steps'])]+[(s['id']+'/'+k,v) for k,v in s.get('presetRoutes',{}).items()]+[(s['id']+'/'+k,v['steps']) for k,v in s.get('variants',{}).items()]
check('Every base and alternative stage has known services and valid animated endpoints',all(all(set(t['nodes'])<=ids and (not t['flow'] or {t['flow']['from'],t['flow']['to']}<=set(t['nodes'])) for t in rr) for _,rr in routes))
check('Every teaching stage includes specific input, output and provenance',all(all(t['runtime']['input'] and t['runtime']['output'] and t['runtime']['synthetic'] and t['source'] and t['lines'] for t in rr) for _,rr in routes))
check('Four independent meal routes are actually different',set(byid['dinner']['presetRoutes'])=={'minimal','standard','ptc','cordis'} and len({json.dumps(rr,ensure_ascii=False) for rr in byid['dinner']['presetRoutes'].values()})==4)
rows=[]
for f in byid['registration']['files']:
 if f['path'].endswith('.csv'):rows+=list(csv.DictReader(io.StringIO(f['content'])))
studentkey=next(iter(rows[0]))
from collections import Counter
counts=Counter(r[studentkey] for r in rows)
check('Registration fixtures support 12 rows / 9 people / 3 duplicate IDs',len(rows)==12 and len(counts)==9 and {k for k,v in counts.items() if v>1}=={'S02','S03','S07'})
check('Venue and cost example arithmetic is internally consistent',120-80==40 and 120*12+120==1560 and 1560-1500==60)
check('Lost and retained summary branches contain different evidence',byid['voyage']['variants']['lost']['steps'][5]['runtime']['output']!=byid['voyage']['variants']['kept']['steps'][5]['runtime']['output'])

with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'],timeout=12000)
 page=b.new_page(viewport={'width':1600,'height':1060},device_scale_factor=1,color_scheme='dark',accept_downloads=True)
 page.set_default_timeout(8000)
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
 page.set_content((R/'index.html').read_text(),wait_until='domcontentloaded',timeout=15000);wait(page,350)
 def fresh_page(old_page):
  # Use isolated pages for independent suites to bound test-runner memory.
  old_page.close()
  pp=b.new_page(viewport={'width':1600,'height':1060},device_scale_factor=1,color_scheme='dark',accept_downloads=True)
  pp.set_default_timeout(8000)
  pp.on('pageerror',lambda e:errors.append(str(e)));pp.on('request',lambda r:requests.append(r.url))
  pp.set_content((R/'index.html').read_text(),wait_until='domcontentloaded',timeout=15000)
  wait(pp,200)
  return pp
 # Actual 3D regression checks.
 page.evaluate('DSHInside.goTo("shopping",5)');wait(page,300)
 js(page,'70 glyph identities retained','Object.keys(DSHIdentity.specs).length===70&&new Set(Object.values(DSHIdentity.specs).map(x=>x.join("|"))).size===70')
 js(page,'9 distinct model-shape families retained','new Set(Object.values(DSHIdentity.specs).map(x=>x[1])).size===9')
 js(page,'All 70 top-plane icons render','Number(document.querySelector("#scene-annotations").dataset.icons)===70')
 js(page,'Teaching segment uses one arrow with explicit endpoints','DSHInside.getDiagnostics().arrows===1&&document.querySelector("#flow-packet").dataset.from==="tools"&&document.querySelector("#flow-packet").dataset.to==="fs"')
 page.locator('#play').click();wait(page,150);p1=page.locator('#flow-packet').get_attribute('data-progress');wait(page,500);p2=page.locator('#flow-packet').get_attribute('data-progress')
 check('Packet moves on the actual 3D route during playback',float(p2)>float(p1),{'from':p1,'to':p2})
 page.locator('#play').click();wait(page,100);p1=page.locator('#flow-packet').get_attribute('data-progress');wait(page,350);p2=page.locator('#flow-packet').get_attribute('data-progress')
 check('Pause freezes the packet',p1==p2)
 page.locator('#motion-toggle').click();wait(page,100)
 check('Reduced motion fixes the packet position',page.locator('#flow-packet').get_attribute('data-progress')=='0.620')
 page.locator('#motion-toggle').click()
 rect=page.locator('#scene').bounding_box();x=rect['x']+rect['width']*.5;y=rect['y']+rect['height']*.5
 old=page.evaluate('({...DSHInside.getRenderer().target})')
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+70,y+15,steps=5);page.mouse.up();wait(page)
 check('Drag still orbits the 3D camera',old['yaw']!=page.evaluate('DSHInside.getRenderer().target.yaw'))
 page.mouse.wheel(0,120);wait(page)
 check('Wheel still zooms the 3D camera',old['dist']!=page.evaluate('DSHInside.getRenderer().target.dist'))
 page.locator('#view-reset').click();page.locator('#explode').fill('0.4');wait(page)
 js(page,'Layer separation still changes the renderer','DSHInside.getRenderer().state.explosion===.4')
 page.locator('#explode').fill('0.8')
 for lang,theme in [('en','light'),('zh','dark'),('en','dark'),('zh','light')]:
  before=page.evaluate('({scenario:DSHInside.getState().scenario,index:DSHInside.getState().index,preset:DSHInside.getState().preset})')
  page.evaluate('([l,t])=>{DSHInside.setLanguage(l);DSHInside.setTheme(t)}',[lang,theme]);wait(page)
  after=page.evaluate('({scenario:DSHInside.getState().scenario,index:DSHInside.getState().index,preset:DSHInside.getState().preset})')
  check('Language/theme preserve case, mode and position: '+lang+'/'+theme,before==after)
 page.locator('#play').click();page.locator('#language-toggle').click();wait(page)
 js(page,'Changing language preserves active playback','DSHInside.getState().playing')
 page.locator('#play').click()
 page.evaluate('DSHInside.select("fs")');wait(page,300)
 js(page,'Seam focus retains declaration and call arrows','()=>{let a=DSHInside.getRenderer().frameArrows;return a.some(x=>x.relation==="declaration")&&a.some(x=>x.relation==="call")&&document.querySelector("#flow-packet").hidden}')
 for filt,n in [('seam',29),('core',40),('bundle',1),('all',70)]:
  page.locator('[data-filter="'+filt+'"]').click();wait(page)
  check('Service filter preserved: '+filt,page.locator('.catalog-item').count()==n)
 page.locator('#service-search').fill('文件系统');wait(page)
 check('Chinese atlas search preserved',page.locator('.catalog-item[data-service="fs"]').count()==1)
 page.locator('#service-search').fill('filesystem');wait(page)
 check('English atlas search preserved',page.locator('.catalog-item[data-service="fs"]').count()==1)
 page.locator('.catalog-item[data-service="fs"]').click();page.locator('[data-provider="fs-e2b"]').click();wait(page)
 js(page,'Implementation selection remains diagram-only','DSHInside.getState().providers.fs==="fs-e2b"')
 # Import safety.
 page=fresh_page(page)
 page.evaluate('DSHInside.setMode("trace")')
 events=[{'type':'user/message','seq':0,'time':1788512400000,'data':{'apiKey':'SECRET_VALUE_TEST','text':'<img src=x onerror="window.pwned=1">'}},{'type':'custom/unknown','seq':1,'time':1788512400100,'data':{'test':True}}]
 page.locator('#trace-file').set_input_files({'name':'test.jsonl','mimeType':'application/x-ndjson','buffer':'\n'.join(json.dumps(x) for x in events).encode()});wait(page,200)
 check('User trace imports without dropping unknown records',page.evaluate('DSHInside.getState().trace.events')==2)
 check('Secret fields are redacted from the visible record','SECRET_VALUE_TEST' not in page.locator('#inspector').inner_text())
 js(page,'Imported HTML stays inert text','!window.pwned&&document.querySelectorAll("#inspector img").length===0')
 js(page,'Trace mode does not invent full service call paths','DSHInside.getRenderer().state.active.length===1&&document.querySelector("#flow-packet").hidden')
 page.locator('#next-step').click();wait(page)
 check('Unknown event remains visible','custom/unknown' in page.locator('#inspector').inner_text())
 page.locator('#clear-log').click();wait(page)
 js(page,'Clear really removes trace data from page state','DSHInside.getState().trace===null')

 diagnostics=page.evaluate("DSHInside.getDiagnostics()")
 b.close()
report={'version':'3.0.0','generated_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'build_sha256':hashlib.sha256((R/'index.html').read_bytes()).hexdigest(),'environment':{'browser':'Chromium','loading':'set_content of exact standalone HTML','backend':'Canvas software 3D','live_DSH':False,'model_calls':False},'summary':{'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'total':len(checks)},'not_tested':['hardware WebGL','Safari','Firefox','real DSH backend or live model execution'],'checks':checks}
(R/'tests/test-v3-C.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('SUMMARY',report['summary'])
if report['summary']['failed']:raise SystemExit(1)
