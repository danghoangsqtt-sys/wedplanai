# Logging Phase 1 SPEC — Core Logger + Cloud + Upload + Store

**Source:** `docs/brainstorm/session-2026-06-15-debug-logging.md`
**Status:** Ready to implement

## Overview

Thêm structured logging vào các layer quan trọng nhất. Mục tiêu: thay thế 40 `console.*` calls thô bằng namespaced logger có màu, dễ filter trong Chrome DevTools.

## Logger đã tạo

`lib/logger.ts` — **DONE**. Export sẵn: `cloudLog`, `storeLog`, `uploadLog`, `aiLog`, `uiLog`.

---

## Task L1.1 — Instrument `services/cloudService.ts`

**Import:**
```ts
import { cloudLog, uploadLog } from '../lib/logger';
```

**Thay thế toàn bộ console calls:**

| Dòng hiện tại | Thay bằng |
|---|---|
| `console.warn('getPublicIP failed:', err)` | `cloudLog.warn('getPublicIP failed', err)` |
| `console.warn('Error syncing public invitation:', invError)` | `cloudLog.warn('sync public invitation failed', invError)` |
| `console.error('Error saving to cloud:', error)` | `cloudLog.error('save to cloud failed', error)` |
| `console.error('Error loading from cloud:', error)` | `cloudLog.error('load from cloud failed', error)` |
| `console.warn('submitRSVP failed...')` | `cloudLog.warn('submitRSVP failed', e)` |
| `console.warn('submitWish failed...')` | `cloudLog.warn('submitWish failed', e)` |
| `console.warn('loadInvitationResponses failed...')` | `cloudLog.warn('loadInvitationResponses failed', e)` |
| `console.error('Error loading public invitation:')` | `cloudLog.error('load public invitation failed', error)` |
| `console.error('Error syncing profile:')` | `cloudLog.error('sync profile failed', error)` |
| `console.error('Error fetching public profile:')` | `cloudLog.error('fetch public profile failed', error)` |
| `console.warn('updateLastSeen silent fail:')` | `cloudLog.warn('updateLastSeen failed', err)` |
| `console.warn('Analytics error:')` | `cloudLog.warn('analytics event failed', error)` |
| `console.warn('checkGuestIPUsage error:')` | `cloudLog.warn('checkGuestIPUsage failed', err)` |
| `console.warn('Increment IP Usage failed:')` | `cloudLog.warn('incrementIPUsage failed', error)` |

**Thêm info + timing vào `uploadInvitationImage`:**
```ts
export const uploadInvitationImage = async (file: File, uid: string): Promise<string> => {
  uploadLog.info('start', { name: file.name, sizeMB: +(file.size / 1048576).toFixed(2), type: file.type });
  uploadLog.time('upload');
  // ... (existing validation) ...
  const { error } = await supabase.storage.from('invitation_assets').upload(...);
  if (error) {
    uploadLog.timeEnd('upload');
    uploadLog.error('failed', { name: file.name, error });
    throw error;
  }
  uploadLog.timeEnd('upload');
  const { data } = supabase.storage.from('invitation_assets').getPublicUrl(filePath);
  uploadLog.info('success', { url: data.publicUrl });
  return data.publicUrl;
};
```

**Thêm info + timing vào `saveUserDataToCloud` / `loadUserDataFromCloud`:**
```ts
cloudLog.info('save start', { uid });
cloudLog.time('cloud-save');
// ... operation ...
cloudLog.timeEnd('cloud-save');
cloudLog.info('save complete', { uid });
```

---

## Task L1.2 — Instrument upload handlers (`InvitationManager.tsx`)

**Import:**
```ts
import { uploadLog, uiLog } from '../../lib/logger';
```

**`handleCoverUpload`:**
```ts
uploadLog.info('cover start', { name: file.name, sizeMB: +(file.size/1048576).toFixed(2) });
// on success:
uploadLog.info('cover success', { url });
// on error (trong catch):
uploadLog.error('cover failed', { error: err?.message });
```

**`handleAddGalleryImagesUpload`:**
```ts
uploadLog.group(`gallery upload (${fileArray.length} files)`);
// on success:
uploadLog.info('gallery success', { count: urls.length });
uploadLog.groupEnd();
// on error:
uploadLog.error('gallery failed', { error: err?.message });
uploadLog.groupEnd();
```

**Love Story inline handler:**
```ts
uploadLog.info('love story start', { name: file.name });
// on success:
uploadLog.info('love story success', { url });
// on error:
uploadLog.error('love story failed', { error: err?.message });
```

---

## Task L1.3 — Instrument `store/useStore.ts`

**Import:**
```ts
import { storeLog } from '../lib/logger';
```

**Cloud sync trigger:**
```ts
// Trước khi gọi triggerCloudSync / saveUserDataToCloud:
storeLog.info('cloud sync triggered', { uid });

// Khi skip vì cloud disabled:
storeLog.warn('cloud sync skipped', { reason: 'cloud_disabled' });

// recalculateDeadlines:
storeLog.info('recalculate deadlines', { date, itemCount: items.length });
```

---

## Acceptance Criteria

- [ ] Filter `[cloud]` trong DevTools → chỉ thấy cloud logs với màu indigo
- [ ] Filter `[upload]` → thấy upload start, timing, success/error với màu amber
- [ ] Filter `[store]` → thấy cloud sync triggers với màu sky
- [ ] Upload ảnh → DevTools hiển thị `[upload] start {name, sizeMB}`, `[upload] 26ms`, `[upload] success {url}`
- [ ] Upload thất bại → `[upload] error {message}` hiện trước alert box
- [ ] 0 TypeScript errors sau khi instrument

## Verification

```bash
npx tsc --noEmit
```
