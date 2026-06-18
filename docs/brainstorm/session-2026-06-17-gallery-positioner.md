# Brainstorm Session: Gallery Image Cropper

## Date: 2026-06-17
## Topic: Interactive Cropping/Positioning for Gallery Images

## Context
The user requested to replace the drop-down positioning in the gallery editor with an interactive cropper (similar to the hero image). A pencil icon should be added next to the trash bin for each gallery image, opening a cropper modal to adjust the position and scale visually.

## Proposed Implementation Plan
1. **Extend `InvitationData` types**:
   - `galleryConfigs?: Array<{ scale: number, x: number, y: number } | null>` to store the crop settings for each image.
2. **Update `EditorFormPanel.tsx`**:
   - Add state: `[croppingImageIndex, setCroppingImageIndex] = useState<number | null>(null)`
   - Replace the `<select>` position dropdown with a pencil icon button (`<Pencil size={12} />`).
   - Clicking the pencil opens the `PhotoPositionEditor` for the specific gallery image.
3. **Update `InvitationPreview.tsx`**:
   - Pass `galleryConfigs` instead of `galleryPositions` to `Gallery3DCarousel`.
   - In `Gallery3DCarousel`, Collage, and Grid templates, apply the `style` attribute:
     ```tsx
     style={{
         objectPosition: config ? `${config.x}% ${config.y}%` : '50% 50%',
         transform: config && config.scale !== 1 ? `scale(${config.scale})` : undefined,
         transformOrigin: config ? `${config.x}% ${config.y}%` : 'center'
     }}
     ```

## Phases
- **Phase 1**: Adapt `PhotoPositionEditor` for array items (Gallery) and update UI in `EditorFormPanel`. Replace string `galleryPositions` with `galleryConfigs` logic.
