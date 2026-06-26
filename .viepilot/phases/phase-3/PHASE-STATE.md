# Phase 3 — Theme Parity + Orphan Theme Resolution

**Status:** ✅ COMPLETE
**Started:** 2026-06-15
**Completed:** 2026-06-26
**Plan source:** `docs/brainstorm/session-2026-06-15-invitation-upgrade.md` → Phase 3

## Objective
Nâng layout thiệp gần mockup `public/theme/*` hơn (bento gallery, glass/frame cards) + cho 2 mockup mồ côi (garden_romance, indochine) một "home" thật trong app.

## Paths
- `types.ts` — mở rộng `InvitationData.templateId` thêm `'garden' | 'indochine'`
- `components/invitation/InvitationPreview.tsx` — thêm 2 entry THEME_VARS
- `components/invitation/InvitationManager.tsx` — thêm 2 nút TEMPLATES

## Verification
- `npx tsc --noEmit` → 0 errors ✅
- `npx vite build` → pass ✅

## Completed (2026-06-26 vp-auto session)
Additional Wedding Invite Parity features implemented:
- ✅ Scroll slice animation system (`.rv`/`.rv-on` CSS + IntersectionObserver)
- ✅ Calendar Section (Vietnamese calendar with wedding date highlight)
- ✅ Couple Profile Section (circular photo + bio + "Xem thêm" toggle)
- ✅ Multi-event RSVP checkboxes (A&Q reference style)
- ✅ Guestbook email field (conditional via `guestbookEmailEnabled`)
- ✅ Add-to-Calendar button for each event (Google Calendar + .ics)
- ✅ New `SectionId` values: `calendar`, `coupleProfile`, `opening`
- ✅ `PANEL_TITLES` and `SECTION_META` updated in editor sidebar
- ✅ `CoupleProfile`, `RSVPEventSelection` interfaces in `types.ts`
