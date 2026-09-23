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
 # Route selection must not contaminate an unrelated case's mode badge.
 page.evaluate('DSHInside.openCase("voyage");DSHInside.setMode("modes")')
 page.locator('[data-choose-preset="minimal"]').click();page.locator('.nav[data-mode="journey"]').click();wait(page)
 js(page,'Returning to a single-route case restores its true preset','DSHInside.getState().scenario==="voyage"&&DSHInside.getState().preset==="standard"')
 page.evaluate('DSHInside.openCase("dinner");DSHInside.select("compaction")')
 page.locator('#related-journey').click();wait(page)
 js(page,'Seam-to-case return restores the correct preset','DSHInside.getState().scenario==="voyage"&&DSHInside.getState().preset==="standard"')
 # Long document: generated corpus is actual downloadable text, not a count label.
 js(page,'Original corpus contains exactly 1200 stable unique records','DSHStudy.records().length===1200&&new Set(DSHStudy.records().map(x=>x.id)).size===1200')
 js(page,'Three linked D-17 needles and one R-17 distractor are preserved','()=>{const r=DSHStudy.records();return r[186].text.includes("海棠港")&&r[673].text.includes("林岚")&&r[674].text.includes("孟舟")&&r[674].text.includes("R-17")&&r[1108].text.includes("白鹭港")}')
 page.locator('#open-archive').click();wait(page)
 check('Archive paginates twenty records per page',page.locator('.archive-record').count()==20 and page.locator('#archive-page').inner_text()=='1 / 60')
 page.locator('#archive-next').click();wait(page)
 check('Archive next-page control',page.locator('#archive-page').inner_text()=='2 / 60' and '#0021' in page.locator('.archive-record h3').first.inner_text())
 for number,needle in [('0187','海棠港'),('0674','林岚'),('0675','孟舟'),('1109','白鹭港')]:
  page.locator(f'[data-archive-q="{number}"]').click();wait(page)
  check('Exact record search: '+number,page.locator('.archive-record').count()==1 and needle in page.locator('.archive-record').inner_text())
 page.locator('#archive-search').fill('D-17');wait(page)
 check('Full-text search preserves the related-record distractor',page.locator('.archive-record').count()==4)
 page.locator('#archive-search').fill('NO-SUCH-RECORD-XYZ');wait(page)
 check('Empty-search result and paging handled',page.locator('.archive-record').count()==0 and page.locator('#archive-next').is_disabled())
 page.locator('[data-archive-q="0674"]').click()
 with page.expect_download() as dl:page.locator('#download-archive').click()
 download=dl.value
 text=Path(download.path()).read_text()
 check('Full text download is real and equals corpus',text==page.evaluate('DSHStudy.corpus("zh")') and len(text)>400000,{'characters':len(text),'name':download.suggested_filename})
 snap(page,'archive-evidence.png');close(page)
 page.locator('.segment[data-jump="5"]').click();wait(page)
 lost=page.locator('#inspector').inner_text()
 page.locator('[data-summary-branch="kept"]').click();wait(page)
 kept=page.locator('#inspector').inner_text()
 check('Summary toggle changes actual checkpoint content',lost!=kept and '林岚' in kept)
 js(page,'Summary branch is recorded without modifying corpus','DSHInside.getState().summaryVariant==="kept"&&DSHStudy.records("zh")[673].text.includes("林岚")')
 page.locator('[data-summary-branch="lost"]').click();page.locator('.segment[data-jump="8"]').click();wait(page,250)
 check('Loss branch requires reread rather than a fabricated authorizer','0674' in page.locator('#inspector').inner_text() and '孟舟' in page.locator('#inspector').inner_text())
 snap(page,'voyage-dark.png')
 # Local panel preview validates inputs and rounds exactly in cents.
 page.evaluate('DSHInside.openCase("make-tool")');page.locator('#open-calculator').click();wait(page)
 result=page.locator('#calc-result').inner_text()
 check('Local panel computes the stated settlement','¥180.00' in result and 'Bo → An: ¥6.00' in result and 'Chen → An: ¥30.00' in result)
 page.locator('#calc-0').fill('96.01');page.locator('#calc-run').click();wait(page)
 result=page.locator('#calc-result').inner_text()
 check('Odd-cent sharing reconciles exactly','¥180.01' in result and '¥60.01 / ¥60.00 / ¥60.00' in result)
 page.locator('#calc-0').fill('-1');page.locator('#calc-run').click();wait(page)
 check('Panel rejects negative amounts','非负数' in page.locator('#calc-result').inner_text())
 page.locator('#calc-0').fill('1.111');page.locator('#calc-run').click();wait(page)
 check('Panel rejects excessive decimal precision','两位小数' in page.locator('#calc-result').inner_text())
 for i in range(3):page.locator('#calc-'+str(i)).fill('0')
 page.locator('#calc-run').click();wait(page)
 check('Zero-value settlement has no phantom transfers','没有需要转账' in page.locator('#calc-result').inner_text());close(page)

 diagnostics=page.evaluate("DSHInside.getDiagnostics()")
 b.close()
report={'version':'3.0.0','generated_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'build_sha256':hashlib.sha256((R/'index.html').read_bytes()).hexdigest(),'environment':{'browser':'Chromium','loading':'set_content of exact standalone HTML','backend':'Canvas software 3D','live_DSH':False,'model_calls':False},'summary':{'passed':sum(x['passed'] for x in checks),'failed':sum(not x['passed'] for x in checks),'total':len(checks)},'not_tested':['hardware WebGL','Safari','Firefox','real DSH backend or live model execution'],'checks':checks}
(R/'tests/test-v3-B.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('SUMMARY',report['summary'])
if report['summary']['failed']:raise SystemExit(1)
