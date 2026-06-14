---
name: Timeless Heritage
colors:
  surface: '#fdf8f6'
  surface-dim: '#ddd9d7'
  surface-bright: '#fdf8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3f1'
  surface-container: '#f1edeb'
  surface-container-high: '#ebe7e5'
  surface-container-highest: '#e5e2e0'
  on-surface: '#1c1b1b'
  on-surface-variant: '#58413b'
  inverse-surface: '#31302f'
  inverse-on-surface: '#f4f0ee'
  outline: '#8c716a'
  outline-variant: '#e0bfb7'
  surface-tint: '#aa3613'
  primary: '#7c1d00'
  on-primary: '#ffffff'
  primary-container: '#a12f0c'
  on-primary-container: '#ffbfae'
  inverse-primary: '#ffb5a1'
  secondary: '#6e5c41'
  on-secondary: '#ffffff'
  secondary-container: '#f8dfbc'
  on-secondary-container: '#746146'
  tertiary: '#4d3d34'
  on-tertiary: '#ffffff'
  tertiary-container: '#66544a'
  on-tertiary-container: '#e2c9bd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb5a1'
  on-primary-fixed: '#3b0900'
  on-primary-fixed-variant: '#882000'
  secondary-fixed: '#f8dfbc'
  secondary-fixed-dim: '#dbc3a2'
  on-secondary-fixed: '#261905'
  on-secondary-fixed-variant: '#55442b'
  tertiary-fixed: '#f7ded1'
  tertiary-fixed-dim: '#dac2b5'
  on-tertiary-fixed: '#261911'
  on-tertiary-fixed-variant: '#54433a'
  background: '#fdf8f6'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e0'
  deep-earth: '#61564F'
  rose-gold: '#EFCB84'
  ink-charcoal: '#2A2626'
typography:
  display-script:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  body-md:
    fontFamily: Source Serif 4
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
  countdown-num:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '400'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-margin: 2rem
  section-gap: 4rem
  element-gap: 1rem
  gutter: 1.5rem
---

## Brand & Style

This design system is crafted for digital wedding invitations that honor the elegance of traditional Vietnamese ceremonies while embracing modern mobile accessibility. The aesthetic is **Sophisticated, Romantic, and Editorial**, characterized by a harmonious blend of calligraphic flourishes and structured serif typography.

The design style leans into **Tactile Minimalism**. It avoids the flatness of modern SaaS interfaces in favor of subtle paper textures, soft shadows that mimic the depth of layered cardstock, and organic floral motifs. The user experience should feel like receiving a high-end physical envelope—intimate, celebratory, and intentionally paced. All layouts are prioritized for a vertical, mobile-first scroll, mirroring the physical proportions of a traditional tall wedding invitation card.

## Colors

The palette is rooted in a warm, organic spectrum that reflects heritage and celebratory warmth. 

- **Primary (Heritage Red):** A deep, muted cinnabar used for names and primary call-to-actions. It signifies joy and traditional luck in Vietnamese culture.
- **Secondary & Tertiary (Warm Tones):** Soft creams and light beiges serve as the "paper" foundation, providing a low-contrast, easy-reading experience.
- **Rose Gold Accents:** Used sparingly for ornamental elements, borders, and highlights to add a sense of luxury.
- **Deep Brown & Charcoal:** Reserved strictly for long-form body text and small labels to ensure legibility without the harshness of pure black.

## Typography

Typography is the primary vehicle for the brand’s "Sophisticated" personality. 

- **Display & Headlines:** Use *Playfair Display* for its high-contrast, elegant serifs. For the names of the couple, use the Italic variant to mimic the fluidity of calligraphy.
- **Body Text:** *Source Serif 4* provides a grounded, literary feel that is highly readable on mobile screens for event descriptions and venue details.
- **Labels:** *Be Vietnam Pro* is used for functional elements (form labels, dates, secondary navigation) to provide a clean, modern counterpoint to the decorative serif styles.

Always maintain generous line-height to ensure the text feels "airy" and expensive.

## Layout & Spacing

The layout follows a **Fixed-Width Mobile Column** approach (max 480px) even on desktop, centered to resemble a physical card. 

- **Vertical Rhythm:** Use significant white space (section-gap) between blocks like "Our Story," "Gallery," and "RSVP" to allow the floral illustrations to breathe.
- **Padding:** Maintain a minimum 32px (2rem) margin on the left and right of the viewport to prevent text from touching screen edges.
- **Alignment:** Central alignment is preferred for headlines and short descriptive text to reinforce the formal invitation aesthetic. Long-form body text should be left-aligned for legibility.

## Elevation & Depth

This design system avoids heavy drop shadows. Depth is achieved through **Tonal Layering** and **Subtle Diffusion**:

- **Surfaces:** Use a slight inner-glow on cards to suggest the thickness of heavy-weight paper.
- **Floating Elements:** Floral illustrations should have a very soft, high-spread shadow (#000000 at 5% opacity) to appear as if they are resting lightly on the card.
- **Glassmorphism:** Reserved only for sticky navigation or countdown overlays, using a heavy backdrop blur (20px) and a semi-transparent #FBF7F5 background to maintain the "creamy" feel.

## Shapes

The shape language is primarily **Soft (0.25rem)**. While modern apps often use high-radius corners, this design system uses subtle rounding to maintain the crisp, cut-edge look of high-quality stationery.

- **Image Frames:** Use "Soft" rounding for gallery thumbnails.
- **Interactive Elements:** Buttons should be either perfectly rectangular (0px) for a brutalist-elegant look or have a very slight 4px radius. 
- **Containers:** Background cards for RSVP forms should use `rounded-lg` (8px) to feel distinct from the page background.

## Components

### Countdown Timer
- **Style:** Minimalist. Numbers in `countdown-num` (Playfair Display) with `label-sm` text below each unit.
- **Separator:** Use a subtle vertical line or a rose-gold dot between units.

### Buttons
- **Primary:** Background in #A12F0C, text in #FBF7F5. No border. High-padding (16px 32px).
- **Secondary:** Transparent background with a 1px border in #D9C1A0.

### Photo Gallery
- **Layout:** Alternating asymmetrical grid. Some images landscape, some portrait.
- **Details:** Use a 1px rose-gold border frame around featured images.

### RSVP Form
- **Inputs:** Underline-only style (border-bottom: 1px solid #D9C1A0) rather than full boxes to maintain a "written" feel. 
- **Labels:** Floating `label-sm` that appears above the line when typing.

### Event Details
- **Icons:** Thin-stroke, minimalist floral or wedding-themed icons in #A12F0C.
- **Structure:** Date, Time, and Location stacked vertically with a "Map" link styled as a text-button with an underline.