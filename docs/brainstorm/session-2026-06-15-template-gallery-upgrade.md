# Brainstorm Session — Template Gallery & "Mở Thiệp" Animation Upgrade

**Date:** 2026-06-15
**Type:** Feature Upgrade (UX/Visual)
**Trigger:** `/vp-brainstorm` — "nâng cấp thiệp cưới chuyên nghiệp hơn, gallery mẫu thiệp + hiệu ứng mở thiệp"
**Reference:** https://chungdoi.com/mau-thiep, https://chungdoi.com/mau-thiep/hoa-moc-xanh/demo

---

## Problem Statement

Trải nghiệm chọn mẫu thiệp hiện tại quá đơn giản:
- **6 mẫu thiệp** hiển thị dạng small cards trong InvitationManager sidebar
- **Không có preview demo** — người dùng chỉ thấy tên + emoji, không thấy thiệp thật
- **Không có hiệu ứng mở thiệp** — thiệp public view hiện thẳng, không có opening animation
- **Không phân loại** — không có tags, categories, filter
- **Thiếu "wow factor"** — so với chungdoi.com, trải nghiệm thiếu chuyên nghiệp

---

## Feature 1: Template Gallery Page

### Tham khảo chungdoi.com/mau-thiep
- Grid cards responsive (2-3 cols mobile, 3-4 cols desktop)
- Mỗi card: thumbnail ảnh đại diện, tên mẫu, tags phân loại, badge "Mới"
- Click card → Modal popup lớn (50% viewport): ảnh preview bên trái, thông tin bên phải
- Modal info: tên mẫu, mô tả ngắn, tags, danh sách tính năng (icon + text), 2 nút CTA

### Thiết kế cho WedPlan

**Gallery Layout:**
```
┌──────────────────────────────────────────────┐
│  Mẫu Thiệp Cưới                   [Filter▾] │
│  Chọn mẫu thiệp yêu thích để bắt đầu       │
├──────────────────────────────────────────────┤
│  [Tag: Tất cả] [Truyền thống] [Hiện đại]    │
│  [Hoa Mộc] [Sang trọng] [Tối giản] [Lãng mạn]│
├──────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │ 📷      │ │ 📷      │ │ 📷      │        │
│  │ thumb   │ │ thumb   │ │ thumb   │        │
│  │         │ │  [Mới]  │ │         │        │
│  ├─────────┤ ├─────────┤ ├─────────┤        │
│  │ Truyền  │ │ Hoa Mộc │ │ Hiện    │        │
│  │ Thống   │ │ Xanh    │ │ Đại     │        │
│  │ [🏮][♥] │ │ [🌿][♥]│ │ [✦][♥] │        │
│  └─────────┘ └─────────┘ └─────────┘        │
│       ... more cards ...                      │
└──────────────────────────────────────────────┘
```

**Template Detail Modal:**
```
┌──────────────────────────────────────────────┐
│                                         [X]  │
│  ┌──────────────┐  Hoa Mộc - Xanh           │
│  │              │                            │
│  │  Preview     │  Hoa mộc watercolor với    │
│  │  Image       │  tông xanh lá thanh nhã    │
│  │  (phone      │                            │
│  │   mockup)    │  [Hoa Mộc] [Hoa] [Rustic] │
│  │              │                            │
│  │              │  Tính năng:                │
│  │              │  ✓ Tùy chỉnh nội dung     │
│  │              │  ✓ Ảnh không giới hạn      │
│  │              │  ✓ Google Maps             │
│  │              │  ✓ Xác nhận tham dự (RSVP)│
│  │              │  ✓ Nhận lời chúc           │
│  └──────────────┘  ✓ QR chuyển khoản        │
│                                              │
│  [   + Tạo thiệp   ] [ 👁 Xem demo ]       │
└──────────────────────────────────────────────┘
```

### Templates mở rộng (6 hiện tại + 8 mới = 14 mẫu)

| # | ID | Tên | Category | Color Scheme | Mới? |
|---|-----|------|----------|-------------|------|
| 1 | traditional | Truyền Thống | Truyền thống | Đỏ + vàng gold | - |
| 2 | romantic | Lãng Mạn | Lãng mạn | Hồng + vàng | - |
| 3 | modern | Hiện Đại | Hiện đại | Xanh dương + trắng | - |
| 4 | royal | Royal Elegance | Sang trọng | Navy + vàng gold | - |
| 5 | garden | Garden Romance | Hoa Mộc | Xanh lá + kem | - |
| 6 | indochine | Indochine | Truyền thống | Đỏ gạch + xanh ngọc | - |
| 7 | blossom | Anh Đào | Lãng mạn | Hồng nhạt + trắng | Mới |
| 8 | vintage | Vintage Rose | Lãng mạn | Dusty rose + cream | Mới |
| 9 | minimalist | Tối Giản | Tối giản | B&W + accent | Mới |
| 10 | boho | Boho Greenery | Hoa Mộc | Sage green + earth | Mới |
| 11 | luxury-gold | Hoàng Kim | Sang trọng | Đen + vàng gold | Mới |
| 12 | watercolor | Watercolor Dream | Hoa Mộc | Pastel multi | Mới |
| 13 | zen | Thiền Định | Tối giản | Xám + trắng | Mới |
| 14 | chibi | Chibi Cute | Dễ thương | Hồng + cam | Mới |

### Category Tags
- Tất cả
- Truyền thống (traditional, indochine)
- Hiện đại (modern, minimalist, zen)
- Lãng mạn (romantic, blossom, vintage)
- Hoa Mộc (garden, boho, watercolor)
- Sang trọng (royal, luxury-gold)
- Dễ thương (chibi)

---

## Feature 2: "Mở Thiệp" Animation (Invitation Opening)

### Tham khảo chungdoi.com/mau-thiep/hoa-moc-xanh/demo
- **Stage 1 - Cover:** Background tối (blur hoặc gradient đậm theo theme), card trung tâm chứa tên cô dâu chú rể + ngày + nút "Mở thiệp"
- **Stage 2 - Opening:** Card lật/zoom ra → thiệp scroll xuống tự động
- **Stage 3 - Content:** Các section reveal với stagger animation + particle effects

### Thiết kế cho WedPlan

**Stage 1: Cover Screen**
```
┌─────────────────────────────────┐
│                                 │
│    🍃     (floating leaves)     │
│         🍃                      │
│   ┌─────────────────────┐       │
│   │  ❤                  │       │
│   │                     │       │
│   │   Minh Quân         │       │
│   │      &              │       │
│   │   Thu Hà            │       │
│   │   ──── ❦ ────       │       │
│   │  24 tháng 5, 2026   │       │
│   │                     │       │
│   │   Thân Mời          │       │
│   │                     │       │
│   │  [ Mở thiệp ]      │       │
│   └─────────────────────┘       │
│         🍃                      │
│              🍃                 │
└─────────────────────────────────┘
```

**Opening Animation Sequence:**
1. Cover card tilt nhẹ (3D perspective transform)
2. Card scale up → fade out background
3. Cross-fade vào full invitation content
4. Auto-scroll nhẹ xuống hero section
5. Particle effect tiếp tục chạy throughout

**Particle Effects by Theme:**
| Theme | Particle | Color |
|-------|----------|-------|
| traditional | Pháo hoa mini / confetti | Đỏ + vàng |
| romantic | Cánh hoa rơi | Hồng pastel |
| modern | Geometric shapes / dots | Xanh dương nhạt |
| royal | Sparkle stars | Vàng gold |
| garden | Lá xanh rơi | Xanh lá + nâu |
| indochine | Sen petals | Đỏ gạch + xanh |

### Scroll Reveal Animation
- Mỗi `.iv-section` sử dụng IntersectionObserver (đã có `rv` class)
- Nâng cấp: stagger delay cho child elements (0.1s mỗi element)
- Thêm: subtle parallax cho hero image (scroll speed 0.3x)
- Thêm: counter animation cho countdown numbers

---

## Decisions

| # | Quyết định | Lý do |
|---|---|---|
| D1 | **Template Gallery** là trang riêng (route `/invitation/templates`) | Tách biệt UX chọn mẫu vs editor |
| D2 | **Modal preview** khi click template card | Giống chungdoi.com, không navigate away |
| D3 | **"Mở thiệp" animation** trên PublicInvitationView | Chỉ visitor thấy, editor không bị ảnh hưởng |
| D4 | **CSS-only particles** (không dùng library nặng) | Performance, bundle size nhỏ |
| D5 | **14 templates** (6 cũ + 8 mới) | Đủ đa dạng, không quá nhiều để maintain |
| D6 | **Giữ InvitationData.templateId** mở rộng thêm values | Backward compatible |
| D7 | **Stagger reveal** dùng CSS animation-delay | Không cần JS animation library |
| D8 | **Template thumbnails** là static images (optimized webp) | Fast loading, consistent preview |

---

## Phases

### Phase 1 — Template Gallery + "Mở Thiệp" (Priority)
- [ ] Template Gallery Page component (grid + filter tags)
- [ ] Template Detail Modal (preview + info + CTA buttons)
- [ ] Template thumbnail images (placeholder hoặc generated)
- [ ] "Mở thiệp" cover screen component
- [ ] Opening animation (3D card reveal)
- [ ] Particle effect system (CSS-based, per-theme)
- [ ] Integrate into PublicInvitationView
- [ ] Route `/invitation/templates`

### Phase 2 — Template Expansion
- [ ] 8 template mới: THEME_VARS + CSS overrides
- [ ] Template thumbnail generation
- [ ] Color variation system (1 template → 2-3 color variants)

### Phase 3 — Polish
- [ ] Scroll reveal stagger improvements
- [ ] Parallax hero
- [ ] Counter animations
- [ ] Mobile gesture support (swipe between templates)
- [ ] Template search/filter persistence

---

## Open Questions
1. Template thumbnails: dùng ảnh tĩnh hay render từ component? → **Ảnh tĩnh** cho performance
2. Particle effects: Canvas 2D hay pure CSS? → **CSS @keyframes** cho đơn giản
3. "Mở thiệp" có music auto-play? → Có, trigger sau khi user click "Mở thiệp" (user gesture)
4. Template preview trong modal: iframe hay screenshot? → **Screenshot/thumbnail** cho nhẹ

---

## Action Items
- [x] Research chungdoi.com patterns
- [ ] Tạo prototype HTML với /frontend-design
- [ ] Implement Phase 1
