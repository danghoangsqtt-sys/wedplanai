# Brainstorm Session — Tạo Thiệp Cưới Canvas Editor (Rebuild v2)

**Date:** 2026-06-15
**Type:** Feature Rebuild (UX/Architecture)
**Trigger:** `/vp-brainstorm` — "đập đi xây lại toàn bộ tính năng tạo thiệp, làm giống namtay.vn/themes/22/edit"
**Reference:** https://namtay.vn/themes, https://namtay.vn/themes/22/edit

---

## Problem Statement

Tính năng thiệp cưới hiện tại (`InvitationManager.tsx` + `InvitationPreview.tsx`) có UX kém:
- **9 accordion sections** trong sidebar form → người dùng mù mờ thiệp trông thế nào khi đang điền
- **Preview là read-only** — khung điện thoại bên phải không tương tác được
- **Form field density** — GENERAL section có 6+ input, FAMILY section 4 input rời rạc
- **Không trực quan** — người dùng phải đóng/mở section mới thấy kết quả; feedback loop dài

Mục tiêu: **Rebuild sang Canvas-First Editor** — người dùng click thẳng vào thiệp để chỉnh, giống Canva / namtay.vn / thiep.vn.

---

## Reference Research: Canvas Wedding Invitation Editors

### namtay.vn Pattern (inferred từ URL + product category)
- **Top bar:** Logo | Template picker | Undo/Redo | Preview | Share/Download
- **Left sidebar:** Icon strip thu gọn — Add section (+), Style (🎨), Photos (📷), Effects (✨), Settings (⚙️)
- **Center canvas:** Phone-frame invitation scrollable. Mỗi section là block click-được
- **Context panel:** Slide ra bên phải (hoặc floating toolbar) khi click element
- **Edit mode:** Double-click → inline text editing

### Pattern chung (Canva / Visme / Wix Editor)
- Click 1 lần = chọn section (highlight border + drag handle)
- Click 2 lần = edit nội dung (text input overlay)
- Floating toolbar trên section khi selected: Delete | Duplicate | Move Up/Down
- Left panel: danh sách block types có thể thêm vào canvas
- Right panel (context): properties của element đang chọn (màu, font, ảnh, padding)

---

## Decisions

| # | Quyết định | Lý do |
|---|---|---|
| D1 | **Canvas-first editor** — Preview IS editor | Trực quan, feedback ngay tức thì, giống namtay.vn |
| D2 | **Inline text editing** — click thẳng trên canvas | Không cần mở panel riêng cho text đơn giản |
| D3 | **@dnd-kit/core** cho section reordering | Library hiện đại nhất cho React DnD, accessible, touch support |
| D4 | **Drag-to-reorder sections** tự do | Người dùng muốn linh hoạt sắp xếp Gallery/Events/Love Story |
| D5 | **Expand 10-12 templates** | 6 template cũ + 6 mới: vintage, minimalist, boho, luxury-gold, blossom, zen |
| D6 | **Giữ QR Code** — VietQR + html2canvas export | Người dùng ưng ý, không thay đổi |
| D7 | **Giữ Photo Positioning** — drag + zoom slider | Feature tốt, giữ nguyên trong context panel |
| D8 | **Giữ InvitationData schema** (mở rộng thêm `sectionOrder`) | Backward compatible với Supabase cloud sync |
| D9 | **Left icon sidebar** (thu gọn) + **context panel** (slide-in phải) | Maximize canvas space |
| D10 | **Tách PublicInvitationView** không đổi | Public view đã hoạt động tốt |

---

## Architecture mới

### Layout Editor

```
┌──────────────────────────────────────────────────────────┐
│  [← Thoát]  [Undo][Redo]  [Template]  [Preview] [Share] │  ← Top bar
├────┬─────────────────────────────────────┬───────────────┤
│    │                                     │               │
│ 🎨 │      ┌─────────────────────┐        │  Context      │
│ 📷 │      │   📱 Phone Frame    │        │  Panel        │
│ ➕ │      │   (Invitation       │        │  (slide-in    │
│ ⚙️ │      │    Canvas)          │        │   khi chọn    │
│    │      │                     │        │   element)    │
│ L  │      │  [Section 1]        │        │               │
│ e  │      │  [Section 2]        │        │               │
│ f  │      │  [Section 3]        │        │               │
│ t  │      │   ⋮                 │        │               │
│    │      └─────────────────────┘        │               │
│ S  │                                     │               │
│ i  │  ← Canvas scroll area              │               │
│ d  │                                     └───────────────┤
│ e  │                                                      │
│ b  │                                                      │
│ a  │                                                      │
│ r  │                                                      │
└────┴──────────────────────────────────────────────────────┘
```

### Components Architecture

```
InvitationEditorV2/
├── InvitationEditorPage.tsx      ← Root layout (top bar + sidebar + canvas + panel)
├── EditorTopBar.tsx              ← Undo/Redo, Template picker, Preview, Share
├── EditorLeftSidebar.tsx         ← Icon strip: Add Section, Style, Photos, Settings
├── AddSectionPanel.tsx           ← Panel slide-in: danh sách block types
├── EditorCanvas.tsx              ← Phone frame + DnD SortableContext + sections
├── sections/
│   ├── HeroSection.tsx           ← Cover photo + couple names + date (always first)
│   ├── FamilySection.tsx         ← Parents info (groom + bride)
│   ├── EventsSection.tsx         ← Ceremony schedule (add/edit events)
│   ├── GallerySection.tsx        ← Photo album grid
│   ├── LoveStorySection.tsx      ← Timeline cards
│   ├── CountdownSection.tsx      ← Countdown timer
│   ├── BankSection.tsx           ← VietQR + banking info (giữ nguyên)
│   ├── RSVPSection.tsx           ← RSVP form toggle
│   ├── GuestbookSection.tsx      ← Guestbook toggle
│   └── FooterSection.tsx         ← Stickers + closing text
├── context-panels/
│   ├── TextContextPanel.tsx      ← Font, size, color, alignment
│   ├── PhotoContextPanel.tsx     ← Upload, reposition (giữ PhotoPositionEditor)
│   ├── ColorContextPanel.tsx     ← Theme color, background
│   ├── EventContextPanel.tsx     ← Add/edit/delete events
│   └── BankContextPanel.tsx     ← Bank form + QR preview (giữ nguyên)
├── SectionWrapper.tsx            ← HOC: DnD sortable + selected state + drag handle
├── InlineTextEditor.tsx          ← contentEditable overlay on canvas
└── InvitationPreviewV2.tsx       ← Read-only renderer (dùng cho PublicView + export)
```

### Data Model Changes

```typescript
interface InvitationData {
  // Existing fields (unchanged) ...
  
  // NEW: section order + visibility
  sectionOrder?: SectionId[]  // ['hero', 'family', 'events', 'gallery', 'love_story', 'bank', 'footer']
  sectionVisibility?: Record<SectionId, boolean>
  
  // NEW: per-section layout options
  heroLayout?: 'fullbleed' | 'split' | 'overlay'  // Hero section variants
  galleryLayout?: 'grid' | 'masonry' | 'carousel'
}

type SectionId = 'hero' | 'family' | 'events' | 'gallery' | 'love_story' 
               | 'countdown' | 'bank' | 'rsvp' | 'guestbook' | 'footer'
```

---

## UX Interaction Flows

### Flow 1: Chỉnh tên cô dâu chú rể
1. User mở editor → thấy thiệp với tên mặc định "Tên Chú Rể & Tên Cô Dâu"
2. User click vào tên trên canvas
3. → `InlineTextEditor` overlay xuất hiện ngay vị trí đó
4. → User gõ tên, `InvitationData` update real-time
5. Click out hoặc nhấn Enter → save, overlay đóng

### Flow 2: Đổi ảnh bìa
1. User click vào vùng ảnh Hero section trên canvas
2. → Section được chọn (border highlight)
3. → `PhotoContextPanel` slide-in từ phải
4. Panel hiện: Upload ảnh | Reposition (PhotoPositionEditor) | Remove
5. Upload xong → canvas cập nhật ngay

### Flow 3: Thêm section mới
1. User click icon ➕ trong left sidebar
2. → `AddSectionPanel` slide-in từ trái
3. Panel hiện grid các block types: Events, Gallery, Love Story, Countdown, etc.
4. User click chọn block type
5. → Section mới được thêm vào cuối canvas (có thể drag để reorder)

### Flow 4: Reorder sections
1. User hover vào section → thấy drag handle (⠿) ở top-left
2. User drag handle, section nổi lên với shadow
3. Kéo lên/xuống → các section khác slide để nhường chỗ (@dnd-kit)
4. Drop → `sectionOrder` array update → canvas re-render

### Flow 5: Chỉnh template
1. User click icon 🎨 trong left sidebar (hoặc "Template" button top bar)
2. → Panel hiện 10-12 template thumbnails
3. User click template → Preview ngay trong canvas (no page reload)
4. User confirm → InvitationData.templateId update

---

## 10-12 Templates Plan

### Giữ lại (6 cũ, CSS rebuild):
1. **traditional** — đỏ/vàng truyền thống, font serif
2. **romantic** — hồng/trắng, font script cursive
3. **modern** — đen/trắng, font sans-serif geometric
4. **royal** — navy/gold, double-frame flourish (đã fix trong v1.1.0)
5. **garden** — xanh lá/pastel, floral elements
6. **indochine** — nâu/beige, pattern Đông Dương

### Thêm mới (6 template):
7. **vintage** — nâu sepia, paper texture, retro typography
8. **minimalist** — trắng tinh, typography lớn, tối giản tuyệt đối
9. **boho** — earth tones, watercolor elements, pampas grass feel
10. **luxury-gold** — đen tuyền + gold foil effect, ultra-premium
11. **blossom** — hoa anh đào/hoa cưới, spring palette
12. **zen** — trắng/xám/thiên lam, bamboo/ink brush feel, phong cách Á Đông tối giản

---

## Sections & Features (Rebuild Map)

| Section | Giữ | Thay đổi | Mới |
|---------|-----|----------|-----|
| Hero | ✅ Data | Canvas-clickable, layout variants | heroLayout option |
| Family | ✅ Data | Context panel thay form | — |
| Events | ✅ Data | Inline add/edit trong canvas | — |
| Gallery | ✅ Data | Grid/masonry/carousel layouts | Layout picker |
| Love Story | ✅ Data | Timeline visual cải tiến | — |
| Countdown | ✅ Data | Toggle via section add/remove | — |
| Bank/QR | ✅ **Toàn bộ** | Không đổi gì | — |
| RSVP | ✅ Data | Toggle via section visibility | — |
| Guestbook | ✅ Data | Toggle via section visibility | — |
| Footer/Stickers | ✅ Data | Context panel | — |
| **Section Reorder** | ❌ | — | **MỚI: @dnd-kit** |
| **Inline Text Edit** | ❌ | — | **MỚI: contentEditable overlay** |
| **Context Panels** | ❌ | — | **MỚI: slide-in per element** |
| **Add Section Panel** | ❌ | — | **MỚI: block picker** |
| **Top Bar** | ❌ | — | **MỚI: Undo/Redo/Share** |

---

## Open Questions → Resolved

| # | Câu hỏi | Quyết định |
|---|---------|-----------|
| Q1 | Undo/Redo depth | **immer + history array, 20 steps** — đủ cho use case, tránh memory leak |
| Q2 | Mobile editor | **Desktop-only (≥768px)** — editor đòi hỏi màn hình lớn; public view giữ mobile-first |
| Q3 | Template thumbnail | **Mini render live** trong template picker (iframe/scale transform) — không cần ảnh tĩnh |
| Q4 | Section add limit | **1 per type** — 1 Gallery, 1 Events, etc. Đơn giản, UX sạch hơn |
| Q5 | Export PDF/Image | **QR only** — giữ nguyên html2canvas QR export, không cần export toàn bộ thiệp |
| Q6 | Open questions khác | **/vp-auto tự chọn phương án chuyên nghiệp tối ưu nhất** |

---

## Phases

### Phase 1 — Canvas Editor Core
**Priority:** Rebuild toàn bộ, thay thế InvitationManager.tsx

- [ ] `InvitationEditorPage.tsx` — layout container (TopBar + LeftSidebar + Canvas + ContextPanel)
- [ ] `EditorCanvas.tsx` — Phone frame + dnd-kit SortableContext + section list
- [ ] `SectionWrapper.tsx` — HOC với drag handle + selected state + floating toolbar
- [ ] `InlineTextEditor.tsx` — contentEditable overlay cho text fields
- [ ] Context panels: TextContextPanel, PhotoContextPanel (tích hợp PhotoPositionEditor), ColorContextPanel
- [ ] Sections: HeroSection, FamilySection, EventsSection, GallerySection, LoveStorySection
- [ ] Sections: BankSection (giữ nguyên logic), FooterSection
- [ ] `AddSectionPanel.tsx` — block picker UI
- [ ] `EditorTopBar.tsx` — Undo/Redo (immer), Template picker, Preview toggle
- [ ] Undo/Redo system (immer + useEditorHistory hook)
- [ ] InvitationData migration: thêm `sectionOrder`, `sectionVisibility`
- [ ] 0 TypeScript errors, cloud sync hoạt động

### Phase 2 — Templates Expansion
- [ ] Rebuild CSS cho 6 template cũ (canvas-ready CSS variables)
- [ ] Design + implement 6 template mới (vintage, minimalist, boho, luxury-gold, blossom, zen)
- [ ] Template thumbnail preview (static images hoặc mini-render)
- [ ] Template picker UI trong EditorTopBar

### Phase 3 — Polish & Advanced
- [ ] Keyboard shortcuts: Ctrl+Z/Y (undo/redo), Delete (remove section), Escape (deselect)
- [ ] Mobile preview mode (toggle 375px / 768px frame)
- [ ] Section layout variants (heroLayout, galleryLayout)
- [ ] Export ảnh thiệp (html2canvas toàn bộ canvas)

---

## What's NOT Changing

- `PublicInvitationView.tsx` — public guest view, RSVP, guestbook → **giữ nguyên**
- `InvitationData` interface core fields — backward compatible
- `cloudService.ts` save/load logic — giữ nguyên
- VietQR integration + html2canvas QR export — **giữ nguyên**
- `useStore.ts` invitation slice — giữ nguyên
- Supabase `public_invitations` table + `invitation_assets` bucket

---

## Project Meta Intake (FEAT-009)
Profile binding: already present in `.viepilot/META.md` — skipped.

---

## Status: Completed ✅
**Next:** `/vp-crystallize` hoặc `/vp-evolve` → `/vp-auto` để implement Phase 1
