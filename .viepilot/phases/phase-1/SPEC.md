# Phase 1 SPEC — Password Gate + Cloud Auto-Save

## Overview
Thêm bảo vệ PIN và kích hoạt Supabase sync cho WedPlan AI (personal tool).

## Context Kỹ Thuật
- `triggerCloudSync(get)` đã được gọi trong **mọi mutation** trong store — chỉ cần implement function body
- `saveUserDataToCloud(uid, data)` và `loadUserDataFromCloud(uid)` đã sẵn sàng trong `services/cloudService.ts`
- Không có auth system → dùng fixed OWNER_UID hardcoded

---

## Task 1.1 — `lib/constants.ts`

**Tạo file mới:**
```typescript
// SHA-256 hash của PIN (không lưu plain text)
export const PIN_HASH = '<sha256-of-pin>';

// Fixed owner UID — duy nhất 1 user, không cần auth
export const OWNER_UID = '<uuid-v4>';

// Session storage key
export const SESSION_UNLOCKED_KEY = 'wedplan_unlocked';
```

**Lưu ý:** Generate `OWNER_UID` = `crypto.randomUUID()` chạy 1 lần, hardcode vào.
`PIN_HASH` = SHA-256 của PIN người dùng yêu cầu.

---

## Task 1.2 — `components/PasswordGate.tsx`

**Component mới — full-screen PIN entry:**
- State: `pin` (string), `error` (boolean), `isLoading` (boolean)
- On mount: check `sessionStorage.getItem(SESSION_UNLOCKED_KEY)` → nếu `'true'` → bypass (show children)
- On submit:
  1. Hash input PIN bằng `crypto.subtle.digest('SHA-256', ...)`
  2. So sánh với `PIN_HASH`
  3. Nếu đúng: `sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true')` → gọi `onUnlock()`
  4. Nếu sai: set error, clear input
- UI: centered card, wedding theme (rose gradient), input type="password", shake animation khi sai

**Props:**
```typescript
interface PasswordGateProps {
  children: React.ReactNode;
  onUnlock: () => Promise<void>; // gọi loadFromCloud sau unlock
}
```

---

## Task 1.3 — `App.tsx` (thay đổi nhỏ)

**Thêm:**
```tsx
import PasswordGate from './components/PasswordGate';
// ...
const loadFromCloud = useStore(s => s.loadFromCloud);
// ...
return (
  <PasswordGate onUnlock={loadFromCloud}>
    {/* ... existing app content ... */}
  </PasswordGate>
);
```

---

## Task 1.4 — `store/useStore.ts` — implement `triggerCloudSync`

**Thay thế:**
```typescript
// TRƯỚC:
const triggerCloudSync = (_get: () => AppState) => {
  // Cloud sync disabled — app uses localStorage only
};

// SAU:
const triggerCloudSync = (get: () => AppState) => {
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    const state = get();
    const { guests, budgetItems, procedures, fengShuiProfile, fengShuiResults, invitation, settings } = state;
    try {
      await saveUserDataToCloud(OWNER_UID, {
        guests,
        budgetItems,
        procedures,
        fengShuiProfile: fengShuiProfile ?? undefined,
        fengShuiResults: fengShuiResults ?? undefined,
        invitation,
        weddingDate: settings?.weddingDate ?? null,
      });
    } catch (e) {
      console.warn('Cloud sync failed (will retry on next change):', e);
    }
  }, 2000); // 2s debounce
};
```

**Import thêm:**
```typescript
import { OWNER_UID } from '../lib/constants';
```

---

## Task 1.5 + 1.6 — `store/useStore.ts` — thêm `loadFromCloud` action

**Thêm vào `AppState` interface:**
```typescript
loadFromCloud: () => Promise<void>;
isSyncing: boolean; // đã có sẵn
```

**Implement trong store:**
```typescript
loadFromCloud: async () => {
  set({ isSyncing: true });
  try {
    const cloudData = await loadUserDataFromCloud(OWNER_UID);
    if (cloudData) {
      set({
        guests: cloudData.guests ?? get().guests,
        budgetItems: sanitizeBudgetIds(cloudData.budgetItems ?? get().budgetItems),
        procedures: cloudData.procedures ?? get().procedures,
        fengShuiProfile: cloudData.fengShuiProfile ?? get().fengShuiProfile,
        fengShuiResults: cloudData.fengShuiResults ?? get().fengShuiResults,
        invitation: cloudData.invitation ?? get().invitation,
      });
    }
  } catch (e) {
    console.warn('Load from cloud failed, using local data:', e);
  } finally {
    set({ isSyncing: false });
  }
},
```

---

## Files Changed
```
lib/constants.ts              [NEW]
components/PasswordGate.tsx   [NEW]
App.tsx                       [MODIFY — small]
store/useStore.ts             [MODIFY — triggerCloudSync + loadFromCloud]
```

## Không thay đổi
- `services/cloudService.ts` — dùng nguyên
- `lib/supabase.ts` — dùng nguyên
- Tất cả components khác
