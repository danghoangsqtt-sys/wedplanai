const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const findings = require('./findings.json');
const reproduction = require('./reproduction-results.json');
const counts = findings.reduce((a,f) => { a[f.severity] = (a[f.severity] || 0) + 1; return a; }, {});
const sourceLink = ref => { const match = ref.match(/^(.*):(\d+)$/); return `[${ref}](../${match[1]}#L${match[2]})`; };
let report = `# Báo cáo audit WedPlan AI — 2026-11-03\n\n`;
report += `Commit: \`2eaafe7\`, nhánh \`main\`, phiên bản \`2.2.0\`. Trạng thái: **ISSUES_FOUND**.\n\n`;
report += `Phát hiện **${findings.length} vấn đề**: ${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low. Severity là mức ảnh hưởng kỹ thuật; mức triển khai production của các policy/secret chưa được xác minh.\n\n`;
report += `## Phạm vi và kết quả kiểm tra\n\n- Rà soát 58 tệp TypeScript/TSX (kể cả entry/config/script kiểm tra), hai SQL, manifest, lockfile và tài liệu/trạng thái liên quan.\n- Kiến trúc: SPA React 19 + TypeScript + Vite 6/Tailwind 4; Zustand persist trong localStorage; frontend gọi Supabase Data API/Storage và Gemini trực tiếp. PIN chỉ là cổng giao diện. Không tìm thấy backend riêng trong repo.\n- Build production đã thành công. Audit bổ sung build in-memory với dummy key, không ghi bản build đó ra đĩa.\n- \`npx --no-install tsc --noEmit\`: thành công, không có lỗi type được trình biên dịch hiện tại báo.\n- \`node .viepilot/audit/reproduce-audit.cjs\`: **${reproduction.results.filter(x=>x.reproduced).length}/${reproduction.results.length} kịch bản tái hiện lỗi**. Assertion thành công nghĩa là xác nhận lỗi đang tồn tại, không có nghĩa lỗi đã sửa.\n- ESLint: không thể chạy đầy đủ; import config lỗi thiếu \`@eslint/js\`.\n- \`npm audit\`: 14 package bị cảnh báo (10 high, 3 moderate, 1 low), không đồng nhất với số lỗ hổng khai thác được trong ứng dụng.\n- Không có cấu hình Supabase local; không đọc/ghi database production, không gọi Gemini thật. Chưa chạy UI/E2E, test SQL trên PostgreSQL hoặc kiểm tra chính sách đang áp dụng ở production. Hook runner offline không thay cho React DOM/browser test.\n- Không sửa mã ứng dụng, SQL, dependency hay tự tạo/push tag. Chỉ tạo bằng chứng/báo cáo và auto-log backlog theo skill.\n\n`;
report += `## Tổng hợp theo tier\n\n| Tier | Trạng thái | Số vấn đề |\n|---|---|---:|\n| 1 — Trạng thái dự án | Cần đồng bộ ROADMAP/checkpoint | 2 |\n| 2 — Tài liệu | Setup sai backend, changelog cũ | 2 |\n| 3 — Mã nguồn và stack | Có lỗi dữ liệu, bảo mật, editor, RSVP/AI | 16 |\n\nREADME/package đồng nhất 2.2.0; có nhiều brainstorm session hợp lệ. Không có HANDOFF/ARCHITECTURE để đối chiếu tương ứng. Không có bằng chứng đủ để gắn cờ execute-first/docs-later; không suy diễn từ ngày timestamp.\n\n`;
for (const tier of [3,1,2]) {
  report += `## Tier ${tier}\n\n`;
  for (const f of findings.filter(f=>f.tier===tier)) {
    report += `### ${f.id} — ${f.severity.toUpperCase()} — ${f.title}\n\n`;
    report += `**Vị trí:** ${f.refs.map(sourceLink).join(', ')}.\n\n${f.detail}\n\n**Bằng chứng:** ${f.evidence}\n\n**Hướng xử lý:** ${f.fix}\n\n`;
  }
}
report += `## Thứ tự xử lý đề xuất\n\n1. A01/A14: khóa quyền dữ liệu riêng và bảo vệ key hệ thống; kiểm tra cấu hình production thực trước khi kết luận mức phơi lộ.\n2. A02/A03/A05: chuẩn hóa migration không phá dữ liệu và contract RSVP; thử trên database dùng một lần trước khi áp dụng.\n3. A04/A06/A07: bảo vệ dữ liệu khi đọc lỗi, phản ánh trạng thái đồng bộ thật, backup đầy đủ.\n4. A08–A13: sửa editor, nguồn ngày cưới, key cá nhân và số người RSVP; bổ sung test hành vi.\n5. A15/A16 và Tier 1/2: cập nhật có kiểm soát dependency/quality gates/tài liệu, rồi kiểm chứng browser với backend thử nghiệm.\n\n## Guardrails cho vp-auto\n\nContract máy đọc được: [guardrails.json](audit/guardrails.json).\n\n- React/Zustand: không dùng object identity đã clone để nhận diện origin; Undo phải sống qua autosave; render order/visibility từ cùng schema với editor.\n- Dữ liệu: lỗi đọc remote phải khác empty-success; không ghi full default sau read-error; có concurrency/version hoặc merge chính xác. Backup/export/import phải giữ nguyên dữ liệu qua round-trip.\n- Supabase/PostgreSQL: Auth/RLS tại server; anon chỉ nhận projection công khai; migration phải chạy từ database trống và bảo tồn dữ liệu khi nâng cấp; payload/DTO khớp schema.\n- AI/Vite: không đặt system secret vào VITE_*; dùng backend có xác thực/quota; lựa chọn key người dùng phải được kiểm tra nhất quán.\n- Validation: tsc + lint + build + test hành vi; thử thành công/lỗi/network chậm; E2E bằng dự án Supabase thử nghiệm. Không dùng live database để thử xóa/sửa.\n\n## Nguồn tham chiếu chính thức\n\n- Supabase: RLS kết hợp Auth, vai trò anon/authenticated và auth.uid(): [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security). Dùng đối chiếu A01, không suy ra policy production đã áp dụng.\n- PostgreSQL: policy dùng USING cho hàng hiện có và WITH CHECK cho dữ liệu mới; kiểm tra phạm vi ALL/SELECT/UPDATE: [CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html).\n- Vite: biến VITE_* được đưa vào client bundle, không dùng chứa key bí mật; khuyến nghị backend để bảo vệ secrets: [Env Variables and Modes](https://vite.dev/guide/env-and-mode).\n- Vite: build TypeScript là transpilation, cần chạy typecheck riêng: [Features — Transpile Only](https://vite.dev/guide/features.html#transpile-only).\n\nCache stack React/Vite/Supabase/PostgreSQL phù hợp không có ở thư mục stack cache hiện tại; audit dùng các nguồn chính thức trên làm fallback.\n\n## Backlog\n\nMỗi phát hiện Axx/Sxx/Dxx có mã độc lập trong báo cáo. Auto-log kiểm tra request đang mở và gộp theo title/file overlap theo quy tắc skill; một request có thể chứa nhiều phát hiện. Xem [autolog-index.json](audit/autolog-index.json) để ánh xạ. Việc ghi backlog không đồng nghĩa đã triển khai bản sửa.\n`;
fs.writeFileSync(path.join(root, '.viepilot/audit-report.md'), report);
const guardrails = {
  version:1, project:'wedplan-ai', audit_commit:'2eaafe7', generated:'2026-11-03',
  source_confidence:'official documentation + repository source + offline reproductions',
  stacks:['react','typescript','zustand','vite','supabase','postgresql'],
  preflight:['read .viepilot/audit-report.md and findings.json','use disposable database for migration/RLS tests','preserve existing data and backups','verify live policy state separately without destructive writes'],
  invariants:[
    'Unauthenticated API clients cannot read or mutate owner-private data or read RSVP phones',
    'System API secrets never occur in public build output',
    'Failed cloud reads never authorize full-default writes',
    'Success UI is conditional on the intended persistence acknowledgement',
    'Backup export/import round-trip retains invitation, procedures, guests, budget and wedding date',
    'Undo/redo survives autosave; section order and visibility affect both editor and public view',
    'RSVP payload, DB columns and read DTOs match and preserve party size',
    'A configured user AI key follows an explicit tested selection policy',
    'One wedding-date source survives cloud round-trip across devices',
    'Fresh and upgrade SQL migrations succeed without losing existing rows',
  ],
  required_checks:['typecheck','lint','production build','targeted behavior tests','disposable-database RLS/migration tests','browser checks after test configuration'],
  current_audit_reproduction_command:'node .viepilot/audit/reproduce-audit.cjs',
  reproduction_semantics:'Assertions intentionally demonstrate current defects. Replace with correct-behavior regression tests when fixes are implemented.'
};
fs.writeFileSync(path.join(__dirname, 'guardrails.json'), JSON.stringify(guardrails,null,2)+'\n');
const packageNames=['@babel/core','@protobufjs/utf8','baseline-browser-mapping','browserslist','dompurify','fflate','image-size','nanoid','postcss','pptxgenjs','protobufjs','source-map-js','vite','ws'];
const lock = JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
fs.writeFileSync(path.join(__dirname, 'dependency-summary.json'), JSON.stringify({
  generated:'2026-11-03', command:'npm audit --json', result:{ total:14, high:10, moderate:3, low:1, critical:0 },
  note:'Audit registry output observed during this audit. Versions below are from the checked-in lockfile. Runtime reachability of each advisory is not established.',
  packages:packageNames.map(name=>({name, instances:Object.entries(lock.packages).filter(([p])=>p.endsWith('/node_modules/'+name)||p==='node_modules/'+name).map(([p,v])=>({path:p,version:v.version}))}))
},null,2)+'\n');
console.log(JSON.stringify({ report:'.viepilot/audit-report.md', findings:findings.length, severity:counts, reproductions:reproduction.results.length }));
