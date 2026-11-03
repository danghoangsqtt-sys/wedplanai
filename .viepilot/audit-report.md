# Báo cáo audit WedPlan AI — 2026-11-03

Commit: `2eaafe7`, nhánh `main`, phiên bản `2.2.0`. Trạng thái: **ISSUES_FOUND**.

Phát hiện **20 vấn đề**: 1 critical, 7 high, 10 medium, 2 low. Severity là mức ảnh hưởng kỹ thuật; mức triển khai production của các policy/secret chưa được xác minh.

## Phạm vi và kết quả kiểm tra

- Rà soát 58 tệp TypeScript/TSX (kể cả entry/config/script kiểm tra), hai SQL, manifest, lockfile và tài liệu/trạng thái liên quan.
- Kiến trúc: SPA React 19 + TypeScript + Vite 6/Tailwind 4; Zustand persist trong localStorage; frontend gọi Supabase Data API/Storage và Gemini trực tiếp. PIN chỉ là cổng giao diện. Không tìm thấy backend riêng trong repo.
- Build production đã thành công. Audit bổ sung build in-memory với dummy key, không ghi bản build đó ra đĩa.
- `npx --no-install tsc --noEmit`: thành công, không có lỗi type được trình biên dịch hiện tại báo.
- `node .viepilot/audit/reproduce-audit.cjs`: **11/11 kịch bản tái hiện lỗi**. Assertion thành công nghĩa là xác nhận lỗi đang tồn tại, không có nghĩa lỗi đã sửa.
- ESLint: không thể chạy đầy đủ; import config lỗi thiếu `@eslint/js`.
- `npm audit`: 14 package bị cảnh báo (10 high, 3 moderate, 1 low), không đồng nhất với số lỗ hổng khai thác được trong ứng dụng.
- Không có cấu hình Supabase local; không đọc/ghi database production, không gọi Gemini thật. Chưa chạy UI/E2E, test SQL trên PostgreSQL hoặc kiểm tra chính sách đang áp dụng ở production. Hook runner offline không thay cho React DOM/browser test.
- Không sửa mã ứng dụng, SQL, dependency hay tự tạo/push tag. Chỉ tạo bằng chứng/báo cáo và auto-log backlog theo skill.

## Tổng hợp theo tier

| Tier | Trạng thái | Số vấn đề |
|---|---|---:|
| 1 — Trạng thái dự án | Cần đồng bộ ROADMAP/checkpoint | 2 |
| 2 — Tài liệu | Setup sai backend, changelog cũ | 2 |
| 3 — Mã nguồn và stack | Có lỗi dữ liệu, bảo mật, editor, RSVP/AI | 16 |

README/package đồng nhất 2.2.0; có nhiều brainstorm session hợp lệ. Không có HANDOFF/ARCHITECTURE để đối chiếu tương ứng. Không có bằng chứng đủ để gắn cờ execute-first/docs-later; không suy diễn từ ngày timestamp.

## Tier 3

### A01 — CRITICAL — PIN chỉ bảo vệ giao diện; SQL cho phép khách ẩn danh truy cập dữ liệu riêng

**Vị trí:** [supabase-fix-public-invitations.sql:34](../supabase-fix-public-invitations.sql#L34), [supabase-fix-public-invitations.sql:50](../supabase-fix-public-invitations.sql#L50), [supabase-migration.sql:180](../supabase-migration.sql#L180), [components/PasswordGate.tsx:49](../components/PasswordGate.tsx#L49).

Các policy FOR ALL TO anon WITH CHECK (true) và Anon read user_data không ràng buộc chủ sở hữu. Màn hình PIN tin cờ sessionStorage và không tạo phiên Supabase Auth. Nếu áp dụng các policy này với grants API thông thường, người không biết PIN vẫn có thể đọc, sửa hoặc xóa dữ liệu qua API. Policy public read responses còn công khai cả RSVP/điện thoại khi API có quyền SELECT. Đây là kết luận về mã/SQL được cung cấp, chưa xác nhận cấu hình database production.

**Bằng chứng:** Đọc toàn bộ hai SQL, PasswordGate và constants; đối chiếu tài liệu Supabase RLS/PostgreSQL. Không thực hiện truy cập database thật.

**Hướng xử lý:** Thiết lập danh tính được xác thực tại server/Supabase Auth; giới hạn dữ liệu riêng theo auth.uid(); chỉ công khai projection thiệp và lời chúc cần thiết. Test deny cho anon đối với dữ liệu chủ sở hữu và số điện thoại.

### A02 — HIGH — SQL migration có thứ tự phụ thuộc khiến bootstrap database mới thất bại

**Vị trí:** [supabase-migration.sql:49](../supabase-migration.sql#L49), [supabase-migration.sql:63](../supabase-migration.sql#L63), [supabase-fix-public-invitations.sql:43](../supabase-fix-public-invitations.sql#L43), [supabase-fix-public-invitations.sql:46](../supabase-fix-public-invitations.sql#L46).

Migration tạo policy truy vấn plan_shares trước khi tạo bảng đó. Trên database trống, CREATE POLICY không thể phân giải relation. Script fix còn ALTER TYPE user_data.id/profiles.id trước khi gỡ policy phụ thuộc các cột này; PostgreSQL chặn đổi kiểu cột được policy tham chiếu. Việc chuyển UUID sang TEXT cũng cần đồng bộ các biểu thức auth.uid() = id, không chỉ đổi kiểu một phía.

**Bằng chứng:** Phân tích thứ tự DDL và các policy phụ thuộc. Chưa chạy migration trên PostgreSQL/Supabase thử nghiệm.

**Hướng xử lý:** Tạo tất cả bảng trước policy; gỡ/tạo lại policy theo thứ tự phù hợp khi cần đổi kiểu; thống nhất kiểu khóa; kiểm thử cài mới và nâng cấp trên database dùng một lần.

### A03 — HIGH — Script sửa public invitations tái tạo bảng mà không bảo tồn thiệp hiện có

**Vị trí:** [supabase-fix-public-invitations.sql:17](../supabase-fix-public-invitations.sql#L17).

Script dùng DROP TABLE IF EXISTS public_invitations rồi CREATE TABLE, không copy/restore bản ghi. Khi đoạn này được áp dụng thành công lên database đang có thiệp, các thiệp đã xuất bản bị mất. Lỗi khác ở phần cuối script có thể làm rollback nếu toàn bộ được chạy trong một transaction; điều đó không biến phương án DROP/CREATE thành migration bảo tồn dữ liệu.

**Bằng chứng:** Xác nhận trực tiếp lệnh phá hủy bảng và không có thao tác chuyển dữ liệu trong script. Không chạy SQL này.

**Hướng xử lý:** Dùng ALTER TABLE/migration không phá dữ liệu, có backup và transaction rõ ràng; kiểm tra số lượng/nội dung bản ghi trước và sau nâng cấp.

### A04 — HIGH — Lỗi tính năng lưu trang: lần tải cloud lỗi vẫn cho phép ghi đè

**Vị trí:** [store/useStore.ts:604](../store/useStore.ts#L604), [store/useStore.ts:627](../store/useStore.ts#L627), [store/useStore.ts:170](../store/useStore.ts#L170), [services/cloudService.ts:108](../services/cloudService.ts#L108).

loadUserDataFromCloud trả null cho cả lỗi truy vấn và không có dữ liệu. loadFromCloud luôn bật isCloudLoaded trong finally. Trên thiết bị mới, nếu lần đọc lỗi rồi kết nối hồi phục, chỉnh một trường làm triggerCloudSync ghi toàn bộ dữ liệu mặc định/cũ lên bản ghi thật. Không có version/dirty-field hoặc phân biệt read-error với empty-success để bảo vệ dữ liệu.

**Bằng chứng:** Tái hiện offline A04: lần đọc trả null, isCloudLoaded=true, thay đổi invitation dẫn đến một full-data save.

**Hướng xử lý:** Tách trạng thái tải thành success/empty/error; giữ khóa ghi khi chưa xác minh dữ liệu remote; retry đọc trước khi merge và dùng phiên bản/dirty fields cho xung đột.

### A05 — HIGH — RSVP luôn gửi selected_event_ids nhưng schema không có cột này

**Vị trí:** [services/cloudService.ts:175](../services/cloudService.ts#L175), [supabase-migration.sql:164](../supabase-migration.sql#L164), [services/cloudService.ts:149](../services/cloudService.ts#L149).

submitRSVP luôn gửi selected_event_ids, kể cả sự kiện đơn (giá trị null). Không có migration nào trong repo bổ sung cột này. Database cài theo repo sẽ từ chối INSERT do cột thiếu. Ngay cả khi database đã được vá thủ công, mapResponseRow cũng không trả selected_event_ids nên owner không nhận đủ lựa chọn sự kiện.

**Bằng chứng:** Tái hiện offline A05 bằng payload thực của service; đối chiếu tất cả SQL và mapper. Response PGRST204 trong harness là lỗi giả lập phù hợp với contract, không phải lỗi lấy từ production.

**Hướng xử lý:** Bổ sung migration cho selected_event_ids và mapping DTO/UI đọc lại; kiểm thử gửi và đọc đủ dữ liệu cả RSVP đơn lẫn nhiều sự kiện.

### A06 — HIGH — Lỗi tính năng lưu trang: báo thành công khi ghi cloud hoặc RSVP thất bại

**Vị trí:** [services/cloudService.ts:90](../services/cloudService.ts#L90), [components/invitation/editor/InvitationEditorPage.tsx:100](../components/invitation/editor/InvitationEditorPage.tsx#L100), [components/invitation/PublicInvitationView.tsx:95](../components/invitation/PublicInvitationView.tsx#L95), [components/invitation/PublicInvitationView.tsx:546](../components/invitation/PublicInvitationView.tsx#L546), [components/invitation/PublicInvitationView.tsx:553](../components/invitation/PublicInvitationView.tsx#L553).

saveUserDataToCloud bắt lỗi và resolve undefined; nút Lưu báo thành công ngay khi cập nhật store, trước request cloud. RSVP/Wish gọi service không await kết quả, modal chuyển submitted=true dù service trả false. loadFromCloud cũng không phát lỗi lên PasswordGate nên cảnh báo cloudWarning không phản ánh lỗi tải thật. Người dùng nhận tín hiệu thành công trong khi dữ liệu chưa đến nơi.

**Bằng chứng:** Hai tái hiện offline A06: database write giả lập bị từ chối nhưng service vẫn resolve; RSVP modal vẫn hiện màn hình cảm ơn khi callback trả false.

**Hướng xử lý:** Trả Result có trạng thái lỗi rõ ràng, await request; phân biệt Đã lưu cục bộ/Đang đồng bộ/Đã lưu cloud/Lỗi. Cho phép retry RSVP/Wish và giữ nguyên dữ liệu form khi thất bại.

### A07 — HIGH — Backup bỏ thiệp và quy trình; khôi phục chính backup đó đặt chúng về mặc định

**Vị trí:** [components/SettingsPage.tsx:47](../components/SettingsPage.tsx#L47), [store/useStore.ts:392](../store/useStore.ts#L392).

handleExportData chỉ xuất guests, budgetItems, fengShuiProfile, fengShuiResults. Không xuất invitation, procedures hay ngày cưới. importData mặc định invitation và procedures khi thiếu các trường này rồi kích hoạt sync. Vì vậy vòng Xuất backup → Nhập lại làm mất thiết kế thiệp/quy trình hiện có và có thể đẩy bản mặc định lên cloud.

**Bằng chứng:** Tái hiện offline A07 với các trường mà exporter thực tế tạo: sau import, tên chú rể tùy chỉnh bị thay bằng giá trị mẫu. Field exporter được đối chiếu trực tiếp với mã nguồn.

**Hướng xử lý:** Định nghĩa schema backup có version chứa đủ dữ liệu người dùng; validate toàn bộ trước khi ghi; hỗ trợ backup cũ bằng merge an toàn và bảo đảm round-trip giữ nguyên dữ liệu.

### A08 — MEDIUM — Undo/Redo bị xóa sau mỗi lần editor tự lưu

**Vị trí:** [components/invitation/editor/InvitationEditorPage.tsx:29](../components/invitation/editor/InvitationEditorPage.tsx#L29), [components/invitation/editor/InvitationEditorPage.tsx:69](../components/invitation/editor/InvitationEditorPage.tsx#L69), [store/useStore.ts:416](../store/useStore.ts#L416).

editorLastWriteRef lưu object A của history. updateInvitation luôn tạo object B bằng spread. Effect kiểm tra reference thấy B khác A và nhầm đó là cập nhật từ bên ngoài, gọi reset(invitation), xóa past/future sau debounce 500ms. Undo chỉ có cơ hội hoạt động trước khi autosave chạy.

**Bằng chứng:** Tái hiện offline A08 bằng hook history và component editor thực, với hook runner tối thiểu: canUndo=true sau sửa rồi false sau flush autosave. Chưa xác minh bằng React DOM trong trình duyệt.

**Hướng xử lý:** Đánh dấu origin/revision cho update thay vì so reference đã bị clone, hoặc giữ identity cho dữ liệu tự lưu; kiểm thử Undo/Redo sau nhiều vòng autosave.

### A09 — MEDIUM — Ẩn section và kéo đổi thứ tự chỉ cập nhật sidebar, không cập nhật thiệp

**Vị trí:** [components/invitation/editor/EditorLeftSidebar.tsx:112](../components/invitation/editor/EditorLeftSidebar.tsx#L112), [components/invitation/editor/EditorLeftSidebar.tsx:119](../components/invitation/editor/EditorLeftSidebar.tsx#L119), [components/invitation/InvitationPreview.tsx:681](../components/invitation/InvitationPreview.tsx#L681).

Sidebar ghi sectionOrder và sectionVisibility. InvitationPreview render sections theo JSX cố định, không đọc hai field này. Vì editor và thiệp công khai cùng dùng Preview, thứ tự và trạng thái ẩn đã lưu không được áp dụng ở cả hai nơi.

**Bằng chứng:** Tái hiện offline A09: hero=false và footer đứng đầu sectionOrder nhưng cây JSX vẫn có hero và không bắt đầu bằng footer.

**Hướng xử lý:** Dùng chung section registry/render pipeline, filter theo visibility và map theo order; quy định mặc định/migration cho section mới và test cả editor lẫn public view.

### A10 — MEDIUM — Các trường InlineRichText không còn sửa trực tiếp trên canvas

**Vị trí:** [components/invitation/InlineRichText.tsx:35](../components/invitation/InlineRichText.tsx#L35), [components/invitation/InlineRichText.tsx:47](../components/invitation/InlineRichText.tsx#L47), [components/invitation/InvitationPreview.tsx:988](../components/invitation/InvitationPreview.tsx#L988).

InlineRichText khai báo props field/ec/onFieldEdit nhưng implementation chỉ destructure value/tagName/className/style và luôn trả phần tử chỉ đọc. Các trường tên, danh xưng, lời mời, cha mẹ và nhiều trường khác vẫn truyền ec vào component này nên không có contentEditable hoặc callback lưu chỉnh sửa. Form context panel vẫn có thể sửa một số trường; lỗi nằm ở thao tác trực tiếp trên canvas.

**Bằng chứng:** Tái hiện offline A10 trên component thực: truyền ec.onFieldEdit nhưng output không có contentEditable hoặc onBlur.

**Hướng xử lý:** Khôi phục nhánh editor và bảo toàn selection/IME, sanitize nhánh public; test thao tác gõ, blur và tải lại cho các trường chính.

### A11 — MEDIUM — API key lưu trong Cài đặt không được dùng cho các luồng AI chính

**Vị trí:** [services/aiService.ts:123](../services/aiService.ts#L123), [services/aiService.ts:129](../services/aiService.ts#L129), [components/SettingsPage.tsx:200](../components/SettingsPage.tsx#L200).

Cài đặt validate custom key rồi lưu settings.geminiApiKey. generateAIContent nhận user nhưng bỏ qua cả user và key đã lưu, gọi callGeminiDirect không truyền customApiKey. Chat AI, tư vấn và báo cáo địa phương dùng env key; nếu không có env key thì vẫn báo thiếu key dù màn hình cài đặt vừa kết nối thành công.

**Bằng chứng:** Tái hiện offline A11: custom key trong store là audit-custom-key nhưng GoogleGenAI được khởi tạo với audit-env-key.

**Hướng xử lý:** Định nghĩa một cơ chế chọn key thống nhất theo cấu hình/quyền sử dụng; test trường hợp chỉ có key người dùng và trường hợp có cả key hệ thống. Kết hợp thiết kế server ở A14.

### A12 — MEDIUM — Ngày cưới trong Cài đặt khác nguồn ngày cưới được lưu và tải cloud

**Vị trí:** [components/SettingsPage.tsx:163](../components/SettingsPage.tsx#L163), [store/useStore.ts:177](../store/useStore.ts#L177), [store/useStore.ts:613](../store/useStore.ts#L613), [components/CommandCenter.tsx:230](../components/CommandCenter.tsx#L230).

Cài đặt ghi user.weddingDate; triggerCloudSync ghi weddingDate từ invitation.date. loadFromCloud không nạp cloudData.weddingDate vào user. Dashboard lại ưu tiên user.weddingDate hơn invitation.date nên có thể lệch ngày hiển thị với thiệp và lệch giữa các thiết bị.

**Bằng chứng:** Tái hiện offline A12: chọn user.weddingDate=2028-12-01 nhưng payload cloud ghi ngày khác.

**Hướng xử lý:** Chọn một nguồn ngày cưới chuẩn và dùng cho settings, invitation, dashboard, deadlines và cloud; migration và round-trip qua thiết bị sạch phải giữ cùng ngày.

### A13 — MEDIUM — Import RSVP nhóm nhiều người chỉ tạo một khách trong kế hoạch

**Vị trí:** [components/GuestManager.tsx:43](../components/GuestManager.tsx#L43), [components/GuestManager.tsx:59](../components/GuestManager.tsx#L59), [components/GuestManager.tsx:446](../components/GuestManager.tsx#L446).

RSVP hiển thị guestCount và tab RSVP cộng đúng tổng người. Nhưng handleImportRsvp tạo đúng một Guest và luôn childrenCount=0, không lưu guestCount. Một gia đình xác nhận 5 người được đưa vào danh sách lập kế hoạch thành 1 người, làm sai dự toán khách/số bàn. Không nên coi tất cả người đi cùng là trẻ em chỉ để sửa số đếm.

**Bằng chứng:** Tái hiện offline A13 chạy initializer handleImportRsvp trích trực tiếp từ AST: guestCount=5 cho ra 1 + childrenCount = 1.

**Hướng xử lý:** Mô hình hóa partySize/adults/children và sourceRsvpId rõ ràng; giữ số người khi import, cho sửa và chống nhập trùng bằng ID nguồn.

### A14 — HIGH — Gemini system key được đóng gói trong JavaScript công khai khi build có cấu hình key

**Vị trí:** [services/aiService.ts:59](../services/aiService.ts#L59), [services/aiService.ts:139](../services/aiService.ts#L139), [vite.config.ts:23](../vite.config.ts#L23).

Dùng VITE_GEMINI_API_KEY trong frontend và define process.env.API_KEY/GEMINI_API_KEY làm key xuất hiện trong client bundle. PIN không che nội dung static assets. Khi deploy có key thật, người tải bundle có thể lấy key và tiêu thụ quota theo giới hạn của key đó. Phiên audit không có key thật và không khẳng định đã có người lạm dụng.

**Bằng chứng:** Build in-memory với chuỗi giả AUDIT_DUMMY_KEY_DO_NOT_USE, write=false/publicDir=false: xác nhận chuỗi nằm trong output chunk. Đối chiếu tài liệu Vite về VITE_*.

**Hướng xử lý:** Đưa key hệ thống vào backend/Edge Function có xác thực và giới hạn sử dụng; frontend gọi proxy. Đánh giá/rotate key đã từng nằm trong bundle nếu có, theo cấu hình triển khai thực.

### A15 — MEDIUM — Lockfile có 14 package bị npm audit cảnh báo

**Vị trí:** [package-lock.json:1](../package-lock.json#L1), [package.json:1](../package.json#L1).

npm audit tại 2026-11-03 báo 14 package: 10 high, 3 moderate, 1 low. Bao gồm vite, pptxgenjs/image-size, protobufjs, ws, dompurify và chuỗi công cụ build. Đây là số package bị ảnh hưởng, không phải 14 lỗ hổng ứng dụng đã chứng minh khai thác; nhiều advisory đòi hỏi đường chạy hoặc input cụ thể, một số chỉ liên quan dev server/Node.

**Bằng chứng:** Hai lượt npm audit nhất quán về tổng số; danh sách/version được lưu trong dependency-summary.json. Chưa xác minh exploitability của từng advisory trong bundle thực.

**Hướng xử lý:** Phân loại runtime/dev và đường chạy, chọn bản vá tương thích, kiểm thử build/tính năng trước cập nhật; tránh npm audit fix --force thiếu đánh giá.

### A16 — MEDIUM — Kiểm tra chất lượng chưa được nối vào build và cấu hình ESLint thiếu dependencies

**Vị trí:** [package.json:6](../package.json#L6), [eslint.config.js:1](../eslint.config.js#L1), [tsconfig.json:2](../tsconfig.json#L2).

scripts chỉ có dev/build/preview, không có typecheck/lint/test. Build chỉ chạy vite build, không kiểm tra kiểu. eslint.config.js import @eslint/js, globals, eslint-plugin-react-hooks, eslint-plugin-react-refresh, typescript-eslint nhưng manifest không khai báo chúng và không có ESLint local; import config hiện lỗi ERR_MODULE_NOT_FOUND. TypeScript hiện chạy độc lập thành công, nên không có kết luận mã đang có lỗi type.

**Bằng chứng:** npx --no-install tsc --noEmit exit 0; import eslint.config.js báo thiếu @eslint/js; kiểm tra manifest. Vite docs xác nhận transpile không thay typecheck.

**Hướng xử lý:** Bổ sung quality scripts/dependencies và CI typecheck/lint/build; thêm kiểm tra hành vi cho các lỗi được xác nhận. Nâng strictness theo lộ trình thay vì thay cờ hàng loạt.

## Tier 1

### S01 — MEDIUM — ROADMAP và trạng thái phase/tracker không nhất quán

**Vị trí:** [.viepilot/ROADMAP.md:73](../.viepilot/ROADMAP.md#L73), [.viepilot/ROADMAP.md:78](../.viepilot/ROADMAP.md#L78), [.viepilot/TRACKER.md:22](../.viepilot/TRACKER.md#L22).

Canvas Phase 1 đánh COMPLETE nhưng 12 task trong ROADMAP vẫn TODO, trái với PHASE-STATE và TRACKER đánh done. ROADMAP dừng ở version 2.1.0 và chưa phản ánh milestone invitation parity 2.2.0 trong tracker/phase-3. Không có HANDOFF.json: không thể kiểm tra resume state; thiếu HANDOFF tự nó không được tính thành lỗi.

**Bằng chứng:** Đối chiếu trực tiếp ba PHASE-STATE, ROADMAP và TRACKER. Không có đủ bằng chứng để kết luận vi phạm thứ tự doc-first hay trạng thái chuyển task trong quá khứ.

**Hướng xử lý:** Đồng bộ trạng thái task và milestone với bằng chứng triển khai, ghi rõ code-complete và pending database migration; giữ lịch sử quyết định.

### S02 — LOW — Phase hoàn tất chưa có tag checkpoint tương ứng

**Vị trí:** [.viepilot/phases/canvas-phase-1/PHASE-STATE.md:4](../.viepilot/phases/canvas-phase-1/PHASE-STATE.md#L4), [.viepilot/phases/phase-3/PHASE-STATE.md:3](../.viepilot/phases/phase-3/PHASE-STATE.md#L3).

Git tag local và git ls-remote --tags origin đều rỗng trong khi Canvas Phase 1 và invitation Phase 3 được đánh complete. Thiếu checkpoint để truy vết/rollback theo phase. Phase 2 đang pending SQL nên không bị coi là đã hoàn tất triển khai.

**Bằng chứng:** Kiểm tra cả tag local và remote; đối chiếu phase-state.

**Hướng xử lý:** Xác định đúng commit hoàn tất từng phase và quy ước tag theo milestone để tránh trùng phase number; chỉ tạo/push tag sau khi xác minh commit, không tự gắn vào HEAD hiện tại.

## Tier 2

### D01 — MEDIUM — Hướng dẫn cài đặt vẫn yêu cầu Appwrite trong khi mã nguồn dùng Supabase

**Vị trí:** [SETUP.md:3](../SETUP.md#L3), [SETUP.md:296](../SETUP.md#L296), [lib/supabase.ts:3](../lib/supabase.ts#L3), [lib/supabase.ts:10](../lib/supabase.ts#L10).

SETUP hướng dẫn tạo Appwrite và VITE_APPWRITE_*. Mã thực tế cần VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY. Làm đúng hướng dẫn không cung cấp cấu hình Supabase; createClient được gọi ở module scope sẽ ném lỗi khi thiếu URL/key. Repo không có .env.example và máy audit chưa có .env.local, nên chưa kiểm chứng UI hay backend thật.

**Bằng chứng:** Đối chiếu SETUP, lib/supabase.ts và yêu cầu của Supabase SDK cài trong node_modules. README và package version cùng là 2.2.0.

**Hướng xử lý:** Viết lại setup Supabase, schema/storage/RLS và hướng dẫn thiết lập biến môi trường; cung cấp .env.example chỉ có placeholder; giải thích rõ mô hình Auth/PIN sau khi xử lý A01.

### D02 — LOW — CHANGELOG chưa ghi phiên bản 2.2.0 và các thay đổi cuối tháng 6

**Vị trí:** [CHANGELOG.md:5](../CHANGELOG.md#L5), [package.json:4](../package.json#L4).

Entry mới nhất là v2.1.0 ngày 2026-06-15 trong khi manifest/README là 2.2.0. Git có các thay đổi ngày 26–30/06 về tính năng RSVP, audio, sửa bug và đồng bộ phiên bản chưa được phản ánh ở entry release mới.

**Bằng chứng:** Đối chiếu manifest, README, changelog và git log 12 commit gần nhất. Không đánh cờ URL cấu hình mẫu hợp lệ như lỗi placeholder.

**Hướng xử lý:** Thêm changelog 2.2.0/Unreleased theo đúng commit thực, nêu migration và giới hạn còn tồn tại.

## Thứ tự xử lý đề xuất

1. A01/A14: khóa quyền dữ liệu riêng và bảo vệ key hệ thống; kiểm tra cấu hình production thực trước khi kết luận mức phơi lộ.
2. A02/A03/A05: chuẩn hóa migration không phá dữ liệu và contract RSVP; thử trên database dùng một lần trước khi áp dụng.
3. A04/A06/A07: bảo vệ dữ liệu khi đọc lỗi, phản ánh trạng thái đồng bộ thật, backup đầy đủ.
4. A08–A13: sửa editor, nguồn ngày cưới, key cá nhân và số người RSVP; bổ sung test hành vi.
5. A15/A16 và Tier 1/2: cập nhật có kiểm soát dependency/quality gates/tài liệu, rồi kiểm chứng browser với backend thử nghiệm.

## Guardrails cho vp-auto

Contract máy đọc được: [guardrails.json](audit/guardrails.json).

- React/Zustand: không dùng object identity đã clone để nhận diện origin; Undo phải sống qua autosave; render order/visibility từ cùng schema với editor.
- Dữ liệu: lỗi đọc remote phải khác empty-success; không ghi full default sau read-error; có concurrency/version hoặc merge chính xác. Backup/export/import phải giữ nguyên dữ liệu qua round-trip.
- Supabase/PostgreSQL: Auth/RLS tại server; anon chỉ nhận projection công khai; migration phải chạy từ database trống và bảo tồn dữ liệu khi nâng cấp; payload/DTO khớp schema.
- AI/Vite: không đặt system secret vào VITE_*; dùng backend có xác thực/quota; lựa chọn key người dùng phải được kiểm tra nhất quán.
- Validation: tsc + lint + build + test hành vi; thử thành công/lỗi/network chậm; E2E bằng dự án Supabase thử nghiệm. Không dùng live database để thử xóa/sửa.

## Nguồn tham chiếu chính thức

- Supabase: RLS kết hợp Auth, vai trò anon/authenticated và auth.uid(): [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security). Dùng đối chiếu A01, không suy ra policy production đã áp dụng.
- PostgreSQL: policy dùng USING cho hàng hiện có và WITH CHECK cho dữ liệu mới; kiểm tra phạm vi ALL/SELECT/UPDATE: [CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html).
- Vite: biến VITE_* được đưa vào client bundle, không dùng chứa key bí mật; khuyến nghị backend để bảo vệ secrets: [Env Variables and Modes](https://vite.dev/guide/env-and-mode).
- Vite: build TypeScript là transpilation, cần chạy typecheck riêng: [Features — Transpile Only](https://vite.dev/guide/features.html#transpile-only).

Cache stack React/Vite/Supabase/PostgreSQL phù hợp không có ở thư mục stack cache hiện tại; audit dùng các nguồn chính thức trên làm fallback.

## Backlog

Mỗi phát hiện Axx/Sxx/Dxx có mã độc lập trong báo cáo. Auto-log kiểm tra request đang mở và gộp theo title/file overlap theo quy tắc skill; một request có thể chứa nhiều phát hiện. Xem [autolog-index.json](audit/autolog-index.json) để ánh xạ. Việc ghi backlog không đồng nghĩa đã triển khai bản sửa.
