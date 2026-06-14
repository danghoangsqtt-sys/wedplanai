# Phase 3 — Theme Parity + Orphan Theme Resolution

**Status:** 🔄 IN_PROGRESS
**Started:** 2026-06-15
**Plan source:** `docs/brainstorm/session-2026-06-15-invitation-upgrade.md` → Phase 3

## Objective
Nâng layout thiệp gần mockup `public/theme/*` hơn (bento gallery, glass/frame cards) + cho 2 mockup mồ côi (garden_romance, indochine) một "home" thật trong app (thêm 2 theme).

## Paths
- `types.ts` — mở rộng `InvitationData.templateId` thêm `'garden' | 'indochine'`
- `components/invitation/InvitationPreview.tsx` — thêm 2 entry THEME_VARS, `isGarden`/`isIndochine`, hero-pre + date-badge cho garden, bento gallery (CSS + class theo index), flourish CSS cho 2 theme
- `components/invitation/InvitationManager.tsx` — thêm 2 nút TEMPLATES

## File-Level Plan
1. **types.ts**: union templateId 4 → 6
2. **InvitationPreview.tsx**:
   - THEME_VARS.garden (sage green #3f5e43 + accent taupe), THEME_VARS.indochine (terracotta #a8442a + jade accent #4e8d6e)
   - `isGarden` → hero-pre script "Save the Date" + dùng date-badge
   - Bento: `grid-auto-rows` + `iv-gal-wide`/`iv-gal-tall` theo `bentoClass(i, total)` (chỉ span khi ≥3 ảnh)
   - `.iv-theme-garden` (bo tròn mềm) + `.iv-theme-indochine` (jade art-deco frame)
3. **InvitationManager.tsx**: 2 nút theme (🌿 Garden Romance, 🪷 Indochine)

## Decisions
- **KHÔNG** thêm fixed app-bar/bottom-nav (đè action bar + vinyl nhạc trong PublicInvitationView)
- Bento adaptive: <3 ảnh → grid đều; ≥3 → tile lớn/nhỏ xen kẽ
- 2 theme mới dùng lại layout CSS-var hiện có (low-risk, chỉ khác palette + flourish)

## Verification
- `npx tsc --noEmit` → 0 errors
- `npx vite build` → pass

## Out of scope (future)
- Theme parity 100% với từng mockup (app bar/bottom nav)
- Theme hóa màn hình envelope (đang fixed pink gradient)
