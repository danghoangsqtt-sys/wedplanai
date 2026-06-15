# Brainstorm: Debug Logging & Observability
**Date:** 2026-06-15
**Status:** Completed
**Topic:** Thêm structured debug logging để dễ quan sát và phân tích lỗi

---

## Context

- Hiện có **40 `console.*` calls** rải rác trong 14 files, không có cấu trúc
- `cloudService.ts` chiếm phần lớn (17 calls) nhưng format không nhất quán
- Không có namespace, không có log level, không dễ filter trong DevTools
- Sau chuỗi debug session hôm nay (upload, wedding date, PGRST205), user cần observability tốt hơn

## Requirements

| # | Câu hỏi | Lựa chọn |
|---|---------|----------|
| 1 | Mục tiêu | C — Cả dev lẫn production |
| 2 | Output | A — Browser DevTools console |
| 3 | Scope | A+B — Errors/warnings + user actions + performance |
| 4 | Production | B — Giữ log ở cả dev và prod |

---

## Design: Structured Logger (`lib/logger.ts`)

### Kiến trúc

```
lib/
  logger.ts          ← createLogger factory + pre-built loggers
services/
  cloudService.ts    ← cloudLog.*
  aiService.ts       ← aiLog.*
  geminiService.ts   ← aiLog.*
store/
  useStore.ts        ← storeLog.*
components/invitation/
  InvitationManager.tsx ← uploadLog.*, uiLog.*
```

### Logger Factory

```typescript
// lib/logger.ts
type Level = 'debug' | 'info' | 'warn' | 'error';

const NS_COLORS: Record<string, string> = {
  cloud:  '#6366f1',  // indigo
  store:  '#0ea5e9',  // sky
  upload: '#f59e0b',  // amber
  ai:     '#10b981',  // emerald
  ui:     '#ec4899',  // pink
  perf:   '#8b5cf6',  // violet
};

export function createLogger(namespace: string) {
  const color = NS_COLORS[namespace] ?? '#6b7280';
  const ns = `%c[${namespace}]`;
  const nsStyle = `color:${color};font-weight:bold`;
  const fmt = (level: Level) => {
    const s = { debug: '#9ca3af', info: '#3b82f6', warn: '#f59e0b', error: '#ef4444' }[level];
    return `color:${s};font-weight:bold`;
  };
  return {
    debug:    (msg: string, ...a: any[]) => console.debug(ns+' '+msg, nsStyle, ...a),
    info:     (msg: string, ...a: any[]) => console.info(ns+' '+msg, nsStyle, ...a),
    warn:     (msg: string, ...a: any[]) => console.warn(ns+' '+msg, nsStyle, ...a),
    error:    (msg: string, ...a: any[]) => console.error(ns+' '+msg, nsStyle, ...a),
    time:     (label: string) => console.time(`[${namespace}] ${label}`),
    timeEnd:  (label: string) => console.timeEnd(`[${namespace}] ${label}`),
    group:    (label: string) => console.groupCollapsed(ns+' '+label, nsStyle),
    groupEnd: () => console.groupEnd(),
  };
}

// Pre-built loggers — import trực tiếp từ các module
export const cloudLog  = createLogger('cloud');
export const storeLog  = createLogger('store');
export const uploadLog = createLogger('upload');
export const aiLog     = createLogger('ai');
export const uiLog     = createLogger('ui');
```

### Namespace & màu sắc trong DevTools

| Namespace | Màu | Dùng cho |
|-----------|-----|---------|
| `[cloud]` | Indigo | cloudService: sync, RSVP, profile |
| `[store]` | Sky | useStore: cloud sync trigger, mutations |
| `[upload]` | Amber | Image upload flow (cover, gallery, love story) |
| `[ai]` | Emerald | AI service calls + timing |
| `[ui]` | Pink | User actions: navigate section, publish, export QR |

---

## Instrumentation Plan

### Layer 1 — cloudService.ts (`cloudLog`)

Thay toàn bộ `console.error/warn` bằng `cloudLog.error/warn`. Thêm:
- `cloudLog.info('sync start', { uid })` trước mỗi cloud operation
- `cloudLog.time` / `cloudLog.timeEnd` bao quanh upload + sync
- `cloudLog.group` cho batch operations

**Trước:**
```ts
console.error('Error saving to cloud:', error);
```
**Sau:**
```ts
cloudLog.error('save failed', { uid, error });
```

**Upload với timing:**
```ts
uploadLog.info('upload start', { name: file.name, size: file.size, type: file.type });
uploadLog.time('upload');
// ... supabase upload ...
uploadLog.timeEnd('upload');
uploadLog.info('upload success', { url });
```

### Layer 2 — useStore.ts (`storeLog`)

```ts
storeLog.info('cloud sync triggered', { reason: 'invitation_changed' });
storeLog.warn('cloud sync skipped', { reason: 'cloud_disabled' });
storeLog.error('recalculate deadlines failed', { date, error });
```

### Layer 3 — Upload handlers (`uploadLog`)

```ts
// Khi bắt đầu upload
uploadLog.info('cover upload start', { name: file.name, sizeMB: (file.size/1048576).toFixed(2) });

// Khi thành công
uploadLog.info('cover upload success', { url });

// Khi thất bại
uploadLog.error('cover upload failed', { error: err?.message });
```

### Layer 4 — AI services (`aiLog`)

```ts
aiLog.info('prompt sent', { model, promptLength: prompt.length });
aiLog.time('ai-response');
// ... await ai call ...
aiLog.timeEnd('ai-response');
aiLog.info('response received', { tokensEstimate });
```

### Layer 5 — User actions (`uiLog`)

```ts
// Chuyển section trong InvitationManager
uiLog.info('section changed', { from: activeSection, to: newSection });

// Publish invitation
uiLog.info('invitation published', { uid, template: invitation.template });

// Export QR
uiLog.info('qr export triggered');

// Wedding date changed
uiLog.info('wedding date changed', { from: prev, to: next });
```

---

## DevTools Filtering Tips

User có thể filter trong Console tab của Chrome DevTools:

```
[cloud]   ← chỉ xem cloud logs
[upload]  ← chỉ xem upload logs
[ai]      ← chỉ xem AI logs
error     ← chỉ xem errors (dùng level filter dropdown)
```

Hoặc filter nhiều namespace cùng lúc:
```
[cloud] [upload]
```

---

## Phases

### Phase 1 — Core logger + cloud + upload (high value, low risk)
- [ ] Tạo `lib/logger.ts` với `createLogger` factory
- [ ] Instrument `cloudService.ts` → `cloudLog`
- [ ] Instrument upload handlers (cover, gallery, love story) → `uploadLog`
- [ ] Instrument `useStore.ts` cloud sync → `storeLog`

### Phase 2 — AI + User actions
- [ ] Instrument `aiService.ts` / `geminiService.ts` → `aiLog` + timing
- [ ] Instrument key user actions trong `InvitationManager` → `uiLog`
- [ ] Instrument `SettingsPage.tsx` date change → `uiLog`

### Phase 3 — Polish (optional)
- [ ] `console.group` cho batch operations (gallery upload nhiều ảnh)
- [ ] Performance budget warning: nếu upload > 10s → `uploadLog.warn`
- [ ] Log summary khi component unmount (tổng số errors trong session)

---

## Open Questions

- Có cần persist log ra localStorage để xem sau khi reload không? (hiện tại chỉ in-memory)
- Có muốn thêm log filter toggle trong UI (ví dụ: bật/tắt verbose mode)? → Phase 3 nếu cần

---

## Decision Log

| Decision | Rationale |
|----------|-----------|
| Browser console only, không external service | App là personal tool, không cần remote log collection |
| Giữ log ở prod | User muốn quan sát cả prod behavior |
| Namespace colors qua CSS console API | Dễ scan bằng mắt hơn khi có nhiều log |
| Factory pattern `createLogger(ns)` | Dễ thêm namespace mới; không phụ thuộc lib |

## Next Steps

→ `/vp-crystallize` để sinh implementation plan
→ Hoặc implement trực tiếp: tạo `lib/logger.ts` rồi instrument từng layer theo Phase 1
