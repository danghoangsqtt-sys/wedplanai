# Brainstorm: Full Inline Rich Text Editing
**Date:** 2026-06-18
**Status:** Completed → Implementing

## Problem
Chỉ một số ít text field trong thiệp cưới có thể chỉnh sửa trực tiếp (click → toolbar B/I/U/font/size/màu).
Các section: cha mẹ hai họ, kính mời, địa điểm, trang phục... vẫn hiển thị tĩnh.

## Decisions
| Câu hỏi | Quyết định |
|---------|-----------|
| Mức độ edit | Toàn bộ InlineRichText (click vào bất kỳ text nào) |
| Lưu trữ style | Có — lưu vào Supabase cùng invitation data |
| Rollout | Tất cả cùng lúc |

## Fields hiện đã có InlineRichText
- openingMessage, brideName, groomName, brideTitle, groomTitle
- brideShortName, groomShortName, date, location (hero badge), wishes
- events[i].{time, date, title, location}

## Fields cần thêm vào InvitationData type
- `inviteSectionTitle?: string` — "Trân Trọng Kính Mời"
- `inviteMessage?: string` — đoạn text kính mời (tách khỏi openingMessage)
- `venueSectionTitle?: string` — "Tiệc cưới được tổ chức tại"
- `familySideGroom?: string` — nhãn "Nhà Trai"
- `familySideBride?: string` — nhãn "Nhà Gái"

## Fields đã có trong type, cần bọc InlineRichText
- groomParents.{title, father, mother} / brideParents.{title, father, mother}
- location (venue section — đã có richEditProps, cần đổi sang InlineRichText)
- dressCodeMessage (đã có richEditProps)

## Architecture Note
handleFieldEdit đã hỗ trợ dot notation → groomParents.father hoạt động mà
không cần thay đổi core logic.

## Phases
### Phase 1 (this session)
- Thêm 5 field mới vào InvitationData type
- Bọc toàn bộ static text trong InvitationPreview.tsx bằng InlineRichText
- Test trong preview
