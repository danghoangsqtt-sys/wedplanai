# Brainstorm — Invitation Design Upgrade (frontend-design audit)
Date: 2026-06-15
Skill applied: frontend-design

---

## Context

Audit the existing 6-theme thiệp cưới against the `frontend-design` principles:
- Bold, intentional aesthetic (not generic AI slop)
- Distinctive typography — avoid Inter/Roboto/Arial/system fonts
- Texture & atmosphere — not flat solid backgrounds
- Motion — staggered reveals, well-orchestrated moments, hover delight
- Spatial composition — unexpected layouts, asymmetry, overlap

---

## Current State — Gap Analysis

### ❌ Typography violations
| Theme | Violation |
|---|---|
| modern | Uses `Inter` + `Public Sans` — explicitly in frontend-design NEVER list |
| all themes | Couple name `clamp(1.5rem, 7vw, 2.2rem)` — too small for the hero moment |
| all themes | `iv-amp` (&) is just smaller italic — missed dramatic design opportunity |
| all themes | Section title weight/size identical across all 6 themes (no personality) |

### ❌ Backgrounds — all flat
- Every `.iv-sec` uses flat `--t-surface` or `--t-surface-dim` solid color
- No grain overlay, no pattern, no gradient mesh anywhere except hero photo overlay
- Cards have a background color but no visual depth (shadow is minimal)

### ❌ Motion — basic & uniform
- `.rv` scroll reveal: all elements reveal identically, no stagger per section
- Hero: zero entrance animation — names just appear
- Cards/buttons: no hover microinteractions
- `ivFloat` petals: all same emoji, could be richer

### ❌ No per-theme signature moments
- Traditional, Royal, Modern, Romantic, Garden, Indochine all follow the same layout structure
- Nothing truly UNFORGETTABLE distinguishes one theme from another visually beyond color/font

---

## Proposed Upgrades — Ranked by Impact

### P1 — Typography (highest impact, easiest to ship)

**A. Replace modern theme fonts**
- REMOVE: `Inter`, `Public Sans`
- ADD: `Cinzel` (display, regal geometric) + `DM Sans` (body, contemporary)
- Add to Google Fonts import: `family=Cinzel:wght@400;600&family=DM+Sans:wght@400;500;600`

**B. Couple names — dramatically larger in hero**
- Change `iv-couple` from `clamp(1.5rem, 7vw, 2.2rem)` → `clamp(2rem, 9vw, 3rem)`
- Each theme can override via `.iv-theme-X .iv-couple { font-size: ... }`
- Royal: `clamp(2.2rem, 10vw, 3.5rem)` + font-weight 400 (Playfair italic grandeur)

**C. "&" ampersand as design centrepiece**
- `iv-amp` → `font-size: 0.75em` (not 0.6em), `font-style: italic`, animated shimmer (Royal only)
- Or swap emoji: use `✦` or `—` character for modern/garden themes

**D. Per-theme section title personalities**
```css
/* Traditional: double underline with red rule */
.iv-theme-traditional .iv-sec-title::after {
  content: ''; display: block; width: 60px; height: 2px;
  background: var(--t-primary); margin: 8px auto 0;
}

/* Royal: all-caps tracking + gold border-bottom */
.iv-theme-royal .iv-sec-title {
  letter-spacing: 0.2em; text-transform: uppercase; font-size: clamp(1rem, 5vw, 1.3rem);
  border-bottom: 1px solid var(--t-accent); padding-bottom: 12px;
}

/* Romantic: script section titles */
.iv-theme-romantic .iv-sec-title { font-family: var(--t-font-script); font-weight: 400; font-size: clamp(1.8rem, 8vw, 2.5rem); }

/* Modern: geometric uppercase */
.iv-theme-modern .iv-sec-title { letter-spacing: 0.12em; text-transform: uppercase; font-size: 1rem; font-weight: 600; }

/* Garden: soft weight, larger */
.iv-theme-garden .iv-sec-title { font-weight: 400; font-size: clamp(1.6rem, 7vw, 2rem); }

/* Indochine: art-deco caps + jade underline */
.iv-theme-indochine .iv-sec-title {
  letter-spacing: 0.18em; text-transform: uppercase; font-size: clamp(1rem, 4.5vw, 1.25rem);
  border-bottom: 2px solid var(--t-accent); padding-bottom: 8px;
}
```

---

### P2 — Grain texture & atmosphere (very high visual impact, ~20 lines CSS)

**Add paper-grain overlay to all themes:**
```css
.iv-root::before {
  content: '';
  position: fixed; inset: 0; z-index: 9999;
  pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}
```

**Per-theme subtle section backgrounds:**
| Theme | Section BG enhancement |
|---|---|
| Traditional | Red diagonal hatching at opacity 0.03 via SVG `pattern` |
| Royal | Golden dot grid at opacity 0.04 |
| Romantic | Scattered small heart shapes, opacity 0.05 |
| Garden | Leaf/organic dots, soft sage tint |
| Modern | Faint geometric grid lines, blue-grey |
| Indochine | Diamond lattice from Vietnamese tile pattern |

**Depth on cards:**
```css
.iv-event-card, .iv-venue-card, .iv-qr-card {
  box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04);
  transition: box-shadow 0.25s, transform 0.25s;
}
.iv-event-card:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
```

---

### P3 — Motion — stagger + hero entrance

**Staggered scroll reveal (per section):**
```css
.rv:nth-child(1) { transition-delay: 0ms; }
.rv:nth-child(2) { transition-delay: 80ms; }
.rv:nth-child(3) { transition-delay: 160ms; }
.rv:nth-child(4) { transition-delay: 240ms; }
/* etc */
```

**Hero name entrance animation:**
```css
@keyframes heroNameIn {
  from { opacity: 0; transform: translateY(32px) skewY(1.5deg); }
  to   { opacity: 1; transform: translateY(0) skewY(0deg); }
}
.iv-couple { animation: heroNameIn 1.2s cubic-bezier(.23,1,.32,1) 0.3s both; }
.iv-date-badge { animation: heroNameIn 1.2s cubic-bezier(.23,1,.32,1) 0.55s both; }
```

**Royal — gold shimmer on couple names:**
```css
@keyframes goldShimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.iv-theme-royal .iv-couple {
  background: linear-gradient(90deg, #c2a14d, #f0d87e, #c2a14d, #f0d87e);
  background-size: 300% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: goldShimmer 5s linear infinite;
}
```

**Button hover ring:**
```css
@keyframes ripple { to { transform: scale(2); opacity: 0; } }
.iv-rsvp-btn { position: relative; overflow: hidden; }
.iv-rsvp-btn::after {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  background: radial-gradient(circle, white 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s;
}
.iv-rsvp-btn:hover::after { opacity: 0.15; }
```

---

### P4 — Per-theme signature elements (the "unforgettable" factor)

| Theme | Signature Element |
|---|---|
| Traditional | SVG corner ornaments (4 red/gold Chinese-style corner brackets) on `.iv-hero-body` |
| Royal | Gold foil shimmer on couple names (see P3); double-frame on `.iv-qr-card` / `.iv-venue-card` |
| Romantic | Larger, varied petal SVG (not emoji) for FloatingEffect — soft pink/blush |
| Modern | Geometric line accent on section titles: thin horizontal bar left-aligned |
| Garden | Watermark leaf SVG at 8% opacity behind `.iv-sec-alt` |
| Indochine | Lotus diamond grid via `background-image: repeating-linear-gradient` |

---

## Phases

### Phase 1 — Typography & Motion (NOW — 1-2 hours, zero risk)
- [ ] Replace Inter/Public Sans in modern theme → Cinzel + DM Sans
- [ ] Scale up couple name font size (all themes)
- [ ] Per-theme `.iv-sec-title` personality overrides
- [ ] Hero entrance animation (`heroNameIn`)
- [ ] Staggered scroll reveal `transition-delay` by child index
- [ ] Card hover transform + shadow
- [ ] Royal gold shimmer on couple names
- [ ] Button hover micro-interaction

### Phase 2 — Texture & Atmosphere (1-2 hours)
- [ ] Grain overlay (`iv-root::before`)
- [ ] Per-theme section background patterns (SVG data-URI)
- [ ] Card depth shadows upgrade

### Phase 3 — Per-theme signature elements (2-3 hours)
- [ ] Traditional corner ornaments
- [ ] Romantic petal SVG upgrade
- [ ] Garden leaf watermark
- [ ] Indochine diamond lattice
- [ ] Modern geometric line accent

---

## Open Questions
1. Grain overlay — light (opacity 0.02) or visible (0.04)? → default 0.025
2. Gold shimmer on Royal names — subtle auto-play or only on hover? → auto-play subtle
3. Modern theme: lean into blue corporate → or pivot to something bolder (charcoal + neon)?
4. Add Google Fonts: Cinzel — load weight? 400+600 only

---

## Decisions Confirmed
- Keep all 6 templates (no deletion)
- All upgrades additive (no breaking changes to current data structure)
- font-family changes via THEME_VARS + Google Fonts `@import` update
- Zero new dependencies (all CSS-only)
- No changes to InvitationEditorPage / EditorContextPanel (purely InvitationPreview.tsx CSS)
