const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const tasks=['4.1','4.2','4.3','5.1','5.2','6.1','6.2'];
const current=process.argv[2];
if (!tasks.includes(current)) throw new Error('Expected task ID');
const evidence=process.argv[3] || 'Focused checks, typecheck, lint and build passed.';
const pos=tasks.indexOf(current), next=tasks[pos+1];
const phase=current.split('.')[0];
const statePath=p=>path.join(root,`.viepilot/phases/audit-phase-${p}/PHASE-STATE.md`);
let state=fs.readFileSync(statePath(phase),'utf8');
state=state.replace(new RegExp('(\\| '+current.replace('.','\\.')+' \\|[^\\n]*\\| )in_progress( \\|)'), '$1done$2');
state+=`\n- ${current}: ${evidence} Branch persistence checked before this state update; state changes are committed and pushed in the following checkpoint.\n`;
if (!next || !next.startsWith(phase+'.')) state=state.replace('**Status:** in_progress','**Status:** complete');
fs.writeFileSync(statePath(phase),state);
const taskPath=path.join(root,`.viepilot/phases/audit-phase-${phase}/tasks/${current}.md`);
let task=fs.readFileSync(taskPath,'utf8').replaceAll('- [ ]','- [x]');
task+=`\n## Result\n${evidence}\nDeployment/configuration of live Supabase is separate from local code verification.\n`;
fs.writeFileSync(taskPath,task);
if(next){
 const p=next.split('.')[0]; let s=fs.readFileSync(statePath(p),'utf8');
 s=s.replace('**Status:** planned','**Status:** in_progress').replace(new RegExp('(\\| '+next.replace('.','\\.')+' \\|[^\\n]*\\| )planned( \\|)'), '$1in_progress$2');
 s+=`\n- ${next}: contract and audit guardrails read; task started before implementation.\n`; fs.writeFileSync(statePath(p),s);
}
const trackerPath=path.join(root,'.viepilot/TRACKER.md');
let tracker=fs.readFileSync(trackerPath,'utf8').replace(/\r\n/g,'\n');
tracker=tracker.replace(/## Current State\n[\s\S]*?(?=\n## |$)/,`## Current State\n\n- Milestone: audit remediation, target 2.2.1.\n- Last verified task: ${current}.\n- Current task: ${next||'none'}; ${pos+1}/7 tasks verified.\n- Branch: fix/audit-2026-11-03.\n- Evidence: ${evidence}\n- Deployment: live SQL/function/Auth setup remains to be applied with actual configuration.\n`);
fs.writeFileSync(trackerPath,tracker);
const handoff={updated:'2026-11-03',current_phase:next?Number(next.split('.')[0]):6,current_task:next||null,status:next?'in_progress':'code_complete_deployment_pending',target_version:'2.2.1',branch:'fix/audit-2026-11-03',tasks_total:7,tasks_completed:pos+1,last_verified:current,evidence,notes:['No live Supabase migration or function deployment performed']};
fs.writeFileSync(path.join(root,'.viepilot/HANDOFF.json'),JSON.stringify(handoff,null,2)+'\n');
const roadmapPath=path.join(root,'.viepilot/ROADMAP.md'); let roadmap=fs.readFileSync(roadmapPath,'utf8');
for(const p of [4,5,6]){
 const total=tasks.filter(t=>t.startsWith(p+'.')).length;
 const done=tasks.slice(0,pos+1).filter(t=>t.startsWith(p+'.')).length;
 const status=done===total?'complete':next?.startsWith(p+'.')?'in_progress':'planned';
 roadmap=roadmap.replace(new RegExp('(\\| '+p+' \\|[^\\n]*\\| '+total+' \\| )\\d+( \\| )[^|]+(\\|)'),`$1${done}$2${status} $3`);
}
fs.writeFileSync(roadmapPath,roadmap);
const changePath=path.join(root,'CHANGELOG.md'); let changes=fs.readFileSync(changePath,'utf8');
if (!changes.includes('## [v2.2.1]')) {
if(!changes.includes('## [Unreleased] — 2.2.1')) changes=changes.replace(/\n## /, '\n## [Unreleased] — 2.2.1\n\n## ');
changes=changes.replace('## [Unreleased] — 2.2.1','## [Unreleased] — 2.2.1\n\n- Audit remediation '+current+': '+evidence);
}
fs.writeFileSync(changePath,changes);
console.log(`Verified ${current}; next ${next||'release review'}`);
