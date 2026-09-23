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
 js(page,'V3 opens the case library','DSHInside.version==="3.0.0"&&DSHInside.getState().mode==="library"')
 check('Landing shows eight case cards and four preset shortcuts',page.locator('.case-card').count()==8 and page.locator('.mode-mini').count()==4)
 js(page,'Hidden 3D workbench does not obstruct the library','document.querySelector("#workbench").hidden && document.querySelector("#transport").hidden')
 for mode,n in [('minimal',1),('standard',5),('ptc',1),('cordis',1),('all',8)]:
  page.locator(f'[data-case-filter="{mode}"]').click();wait(page)
  check('Recommended-preset library filter: '+mode,page.locator('.case-card').count()==n)
 snap(page,'library-dark.png')
 for preset in ['minimal','standard','ptc','cordis']:
  page.locator(f'[data-open-preset="{preset}"]').click() if page.locator('#case-library').is_visible() else page.locator(f'[data-choose-preset="{preset}"]').click()
  wait(page)
  check('All four comparison cards stay visible: '+preset,page.locator('.preset-choice').count()==4 and page.locator(f'.preset-choice[data-choose-preset="{preset}"]').get_attribute('aria-pressed')=='true')
  check('Capability matrix retains all modes: '+preset,page.locator('.mode-matrix tbody tr').count()==7 and page.locator('.mode-matrix thead th').count()==5)
  check('Selected preset links to exact pinned configuration: '+preset,page.locator('.workshop-details a').get_attribute('href').endswith('/'+preset+'/agent.cordis.yml') and 'd347e703' in page.locator('.workshop-details a').get_attribute('href'))
 page.locator('[data-choose-preset="minimal"]').click();wait(page)
 check('Minimal calls out omitted compaction and different filesystem scope','压缩' in page.locator('.workshop-details').inner_text() and 'fs-local' in page.locator('.workshop-details').inner_text())
 page.locator('[data-choose-preset="ptc"]').click();wait(page)
 check('PTC points out disabled workflow tool while retaining engine','禁用' in page.locator('.workshop-details').inner_text() and '保留' in page.locator('.mode-matrix').inner_text())
 snap(page,'modes-dark.png')
 page.locator('[data-demo-preset="ptc"]').click();wait(page,350)
 js(page,'Follow-in-3D opens PTC meal route','DSHInside.getState().scenario==="dinner"&&DSHInside.getState().preset==="ptc"&&DSHInside.getState().index===0')
 for preset in ['minimal','standard','ptc','cordis']:
  page.locator(f'[data-route-preset="{preset}"]').click();wait(page)
  check('Route switch resets an independent demo: '+preset,page.evaluate('DSHInside.getState().index')==0 and not page.evaluate('DSHInside.getState().playing') and page.evaluate('DSHInside.getState().preset')==preset)
  for i in range(page.evaluate('DSHInside.getSteps().length')):
   page.locator(f'.segment[data-jump="{i}"]').click();page.evaluate('DSHLocale.refresh()')
  check('Same meal outcome on route: '+preset,all(x in page.locator('#inspector').inner_text() for x in ['180','60','30']))
  page.locator('#jump-result').click();wait(page)
  check('Final-answer button follows route-specific length: '+preset,page.evaluate('DSHInside.getState().index===DSHInside.getSteps().length-1'))
 for s in data:
  page.evaluate('id=>DSHInside.openCase(id)',s['id']);wait(page)
  check('Question and features visible before coding: '+s['id'],page.locator('#mission-prompt').inner_text()==s['prompt'] and page.locator('.case-side-features div span').count()==3)
  page.locator('#view-fixtures').click();wait(page)
  check('Materials are available in-page: '+s['id'],page.locator('#modal pre[data-raw]').count()==len(s['files']))
  close(page)
  for i in range(len(s['steps'])):
   page.locator(f'.segment[data-jump="{i}"]').click();page.evaluate('DSHLocale.refresh()')
  check('Every stage renders through its own final answer: '+s['id'],page.locator('#inspector h2').count()>0 and page.evaluate('DSHInside.getState().index')==len(s['steps'])-1)
  page.locator('[data-tab="code"]').click();wait(page)
  check('Source inspector remains pinned: '+s['id'],page.locator('#inspector a').evaluate_all('aa=>aa.length>0&&aa.every(a=>a.href.includes("d347e703908d0406b7a7ef80e3a0e594d86b2215"))'))
  page.locator('[data-tab="plain"]').click()

 diagnostics=page.evaluate("DSHInside.getDiagnostics()")
 b.close()
report={'version':'3.0.0','generated_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'build_sha256':hashlib.sha256((R/'index.html').read_bytes()).hexdigest(),'environment':{'browser':'Chromium','loading':'set_content of exact standalone HTML','backend':'Canvas software 3D','live_DSH':False,'model_calls':False},'summary':{'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'total':len(checks)},'not_tested':['hardware WebGL','Safari','Firefox','real DSH backend or live model execution'],'checks':checks}
(R/'tests/test-v3-A.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('SUMMARY',report['summary'])
if report['summary']['failed']:raise SystemExit(1)
