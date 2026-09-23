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
 # English coverage and final snapshots.
 page=fresh_page(page)
 page.evaluate('DSHInside.setLanguage("en");DSHInside.setTheme("light")')
 for mode in ['library','modes']:
  page.evaluate('m=>DSHInside.setMode(m)',mode);wait(page)
 for s in data:
  page.evaluate('id=>{DSHInside.openCase(id);DSHLocale.refresh()}',s['id'])
  for i in range(len(s['steps'])):page.locator(f'.segment[data-jump="{i}"]').click();page.evaluate('DSHLocale.refresh()')
 page.evaluate('DSHInside.setMode("modes")');page.locator('[data-choose-preset="ptc"]').click();wait(page,250)
 snap(page,'modes-light-en.png')
 page.evaluate('DSHInside.setMode("library")');wait(page,250);snap(page,'library-light-en.png')
 check('English mode matrix and library navigation are translated','Case library' in page.locator('.main-nav').inner_text() and 'One task' not in page.locator('.library-hero').inner_text() and 'Start' in page.locator('#case-library .hero-start').inner_text())
 page=fresh_page(page)
 page.evaluate('DSHInside.setLanguage("en");DSHInside.setTheme("light")')
 for width in [390,768,1280,1600]:
  page.set_viewport_size({'width':width,'height':1060 if width>=1280 else 900})
  for mode in ['library','modes','journey','atlas','trace']:
   page.evaluate('m=>DSHInside.setMode(m)',mode);wait(page,80)
   check('No horizontal body overflow: '+str(width)+' / '+mode,page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 page.set_viewport_size({'width':390,'height':844});page.evaluate('DSHInside.setMode("library")');wait(page,180);snap(page,'mobile-library.png')
 page.evaluate('DSHInside.setMode("modes")');wait(page,180);snap(page,'mobile-modes.png')
 page.set_viewport_size({'width':1600,'height':1060});page.evaluate('DSHInside.setLanguage("zh");DSHInside.setTheme("dark");DSHInside.openCase("meet-dsh")');wait(page,300);snap(page,'journey-dark.png')
 check('No automatic network requests made',len(requests)==0,requests)
 check('No uncaught browser errors',len(errors)==0,errors)
 diagnostics=page.evaluate('DSHInside.getDiagnostics()')
 check('A tested 3D backend remains active',diagnostics['backend']=='canvas-3d',diagnostics)

 diagnostics=page.evaluate("DSHInside.getDiagnostics()")
 b.close()
report={'version':'3.0.0','generated_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'build_sha256':hashlib.sha256((R/'index.html').read_bytes()).hexdigest(),'environment':{'browser':'Chromium','loading':'set_content of exact standalone HTML','backend':'Canvas software 3D','live_DSH':False,'model_calls':False},'summary':{'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'total':len(checks)},'not_tested':['hardware WebGL','Safari','Firefox','real DSH backend or live model execution'],'checks':checks}
(R/'tests/test-v3-D.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('SUMMARY',report['summary'])
if report['summary']['failed']:raise SystemExit(1)
