// Record audit findings only; does not implement fixes or change phase completion.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const dir = path.join(root, '.viepilot/requests');
const findings = require('./findings.json');
const indexPath = path.join(__dirname, 'autolog-index.json');
if (fs.existsSync(indexPath)) { console.log('This audit has already been logged; refusing to duplicate entries.'); process.exit(0); }
const requests = fs.readdirSync(dir).filter(x=>x.endsWith('.md')).map(name=>({name,text:fs.readFileSync(path.join(dir,name),'utf8'),created:false,changed:false}));
const allFiles = [...new Set(findings.flatMap(f=>f.files))];
function normalize(s) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }
function title(r) { return normalize((r.text.match(/^# (?:BUG|ENH|FEAT):\s*(.+)/m)||[])[1] || ''); }
function overlap(f,r) {
  const a=normalize(f.title), b=title(r);
  const titleMatch = b.length > 0 && (a.includes(b)||b.includes(a));
  const related = r.text.match(/## Related\s*\n([\s\S]*?)(?=\n## |$)/)?.[1] || '';
  return titleMatch || f.files.some(file=>related.includes(file));
}
const logged=[];
for (const f of findings) {
  let r = requests.find(r=>/\*\*Status\*\*:\s*(new|triaged|in_progress)\b/.test(r.text) && overlap(f,r));
  if (!r) {
    const kind = f.kind || 'BUG';
    const number = Math.max(0,...requests.map(r=>Number(r.name.match(new RegExp('^'+kind+'-(\\d+)\\.md$'))?.[1] || 0)))+1;
    const id = `${kind}-${String(number).padStart(3,'0')}`;
    const priority = f.tier===1 ? 'medium' : f.tier===2 ? 'low' : kind==='ENH' ? 'medium' : 'high';
    r = {name:id+'.md',created:true,changed:true,text:`# ${kind}: ${f.title}\n\n## Meta\n- **ID**: ${id}\n- **Type**: ${kind==='BUG'?'Bug':'Enhancement'}\n- **Status**: new\n- **Priority**: ${priority}\n- **Created**: 2026-11-03\n- **Reporter**: vp-audit (auto-logged)\n- **Assignee**: AI\n- **Source**: auto-logged by vp-audit Tier ${f.tier}\n\n## Summary\n${f.detail}\n\n## Details\n- **Tier**: ${f.tier}\n- **Audit date**: 2026-11-03\n- **Severity**: ${f.severity}\n- **Affected files**: ${f.files.map(x=>'`'+x+'`').join(', ')}\n\n## Acceptance Criteria\n- [ ] Address every linked audit finding with correct-behavior tests.\n- [ ] Re-run the relevant checks and verify the finding no longer occurs.\n- [ ] Preserve existing user data; validate SQL/RLS on a disposable database.\n\n## Related\n- Files: ${f.files.map(x=>'`'+x+'`').join(', ')}\n- Dependencies: see .viepilot/audit-report.md\n\n## Resolution\nChưa triển khai bản sửa.\n`};
    requests.push(r);
  } else {
    r.changed=true;
    const related = r.text.match(/## Related\s*\n([\s\S]*?)(?=\n## |$)/)?.[1] || '';
    const mergedFiles = [...new Set([...allFiles.filter(x=>related.includes(x)), ...f.files])];
    const replacement=`## Related\n- Files: ${mergedFiles.map(x=>'`'+x+'`').join(', ')}\n- Dependencies: see .viepilot/audit-report.md\n`;
    if (related) r.text=r.text.replace(/## Related\s*\n[\s\S]*?(?=\n## |$)/,replacement);
    else r.text+='\n'+replacement;
  }
  if (!r.text.includes('## Discussion')) r.text+='\n## Discussion\n';
  r.text+=`\n### Re-detected by vp-audit 2026-11-03 — ${f.id} (${f.severity}, Tier ${f.tier})\n\n${f.title}\n\n${f.detail}\n\nBằng chứng: ${f.evidence}\n\nVị trí: ${f.refs.map(x=>'`'+x+'`').join(', ')}.\n\nĐề xuất: ${f.fix}\n`;
  logged.push({finding:f.id,request:r.name.replace('.md',''),tier:f.tier,severity:f.severity});
}
for(const r of requests.filter(r=>r.changed)) fs.writeFileSync(path.join(dir,r.name),r.text);
const created=requests.filter(r=>r.created);
const updated=requests.filter(r=>r.changed&&!r.created);
const trackerPath=path.join(root,'.viepilot/TRACKER.md');
let tracker=fs.readFileSync(trackerPath,'utf8');
tracker+='\n## Audit Backlog — 2026-11-03\n\nAudit commit `2eaafe7`: 20 findings (1 critical, 7 high, 10 medium, 2 low). Báo cáo: `.viepilot/audit-report.md`. Chưa thực hiện bản sửa.\n\nCác phát hiện được gom theo title/file overlap theo skill; xem `.viepilot/audit/autolog-index.json` để biết phạm vi của từng request.\n\n| ID | Findings | Status |\n|----|----------|--------|\n';
for(const r of requests.filter(r=>r.changed)) {
  const id=r.name.replace('.md','');
  tracker+=`| ${id} | ${logged.filter(x=>x.request===id).map(x=>x.finding).join(', ')} | new |\n`;
}
tracker+='\n## Decision Log\n\n| Date | Decision | Source | State |\n|------|----------|--------|-------|\n';
for(const r of created) {
  const first=logged.find(x=>x.request===r.name.replace('.md',''));
  const f=findings.find(x=>x.id===first.finding);
  tracker+=`| 2026-11-03 | ${first.request} auto-logged by vp-audit Tier ${f.tier}: ${f.title} | vp-audit | Backlog |\n`;
}
fs.writeFileSync(trackerPath,tracker);
const index={generated:'2026-11-03',commit:'2eaafe7',new:created.map(r=>r.name.replace('.md','')),updated:updated.map(r=>r.name.replace('.md','')),deduplication:'An existing open request is reused when its normalized title is contained in the finding title, or Related files overlap. Reuse includes requests created earlier in this audit.',findings:logged};
fs.writeFileSync(indexPath,JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify({new:index.new,updated:index.updated,mapping:logged}));
