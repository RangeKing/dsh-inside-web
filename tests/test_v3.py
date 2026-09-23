"""Run isolated V3 browser suites, then merge unique checks.
python tests/test_v3.py
CHROMIUM=/path/to/chromium python tests/test_v3.py
"""
from pathlib import Path
import subprocess, sys, json, hashlib, time
R=Path(__file__).resolve().parents[1]
def merge():
    parts=[json.loads((R/f'tests/test-v3-{k}.json').read_text()) for k in 'ABCD']
    digest=hashlib.sha256((R/'index.html').read_bytes()).hexdigest()
    if any(p['build_sha256']!=digest for p in parts):raise ValueError('Test reports do not match the current build')
    unique={}
    for p in parts:
        for row in p['checks']:
            old=unique.get(row['name'])
            if old and old['passed']!=row['passed']:raise ValueError('Suites disagree on '+row['name'])
            unique[row['name']]=row
    checks=list(unique.values())
    report={'version':'3.0.0','generated_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'build_sha256':digest,'environment':parts[0]['environment'],'summary':{'passed':sum(r['passed'] for r in checks),'failed':sum(not r['passed'] for r in checks),'total':len(checks)},'not_tested':parts[0]['not_tested'],'suite_reports':[f'test-v3-{k}.json' for k in 'ABCD'],'checks':checks}
    (R/'tests/test-v3-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(report['summary'])
    if report['summary']['failed']:raise SystemExit(1)
    return report
if __name__=='__main__':
    if '--merge-only' not in sys.argv:
        for k in 'ABCD':subprocess.run([sys.executable,str(R/f'tests/test_v3_{k}.py')],cwd=R,check=True)
    merge()
