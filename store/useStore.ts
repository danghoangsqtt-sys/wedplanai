import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, AppSettings, Guest, BudgetItem, TaskStatus, Notification, NotificationType, WeddingRegion, ProcedureStep, InvitationData, LocalMarketReport, SharedPlan } from '../types';
import { CoupleProfile, HarmonyResult, AuspiciousDate } from '../types/fengshui';
import { saveUserDataToCloud, loadUserDataFromCloud } from '../services/cloudService';
import { storeLog } from '../lib/logger';
import { getMySharedPlan, createShareInvite, joinPlanByCode, revokeShare, leavePlan } from '../services/sharingService';
import { INITIAL_GUESTS, INITIAL_BUDGET_ITEMS, DEFAULT_GUEST_USER, INITIAL_USERS, INITIAL_INVITATION } from '../data/initialData';
import { WEDDING_PROCEDURES } from '../data/wedding-procedures';
import { supabase, TABLES } from '../lib/supabase';
import { OWNER_UID } from '../lib/constants';
import { restoreBackup } from '../lib/backup';
import { guestPartySize } from '../lib/guestStats';
import type { MilestoneTaskStore } from '../types';
import { isMilestoneTaskStore, readLegacyMilestoneTasks } from '../lib/milestoneTasks';

export interface GuestUsage {
  fengShuiCount: number;
  aiChatCount: number;
  speechCount: number;
}

const makeId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Assigns unique IDs to any budget items that are missing one or have duplicates.
const sanitizeBudgetIds = (items: BudgetItem[]): BudgetItem[] => {
  const seen = new Set<string>();
  return items.map(item => {
    if (!item.id || seen.has(item.id)) {
      return { ...item, id: makeId() };
    }
    seen.add(item.id);
    return item;
  });
};

// Removed DEFAULT_INVITATION in favor of INITIAL_INVITATION from initialData.ts

interface AppState {
  user: UserProfile | null;
  settings: AppSettings;

  notifications: Notification[];

  // Set to true only after loadFromCloud() verifies a successful read.
  // triggerCloudSync blocks writes until this is true, preventing INITIAL_INVITATION
  // from accidentally overwriting real cloud data during app startup.
  isCloudLoaded: boolean;
  cloudRevision: string | null;
  hasUnsyncedChanges: boolean;
  localEditVersion: number;
  syncStatus: 'idle' | 'local' | 'loading' | 'pending' | 'saving' | 'saved' | 'error' | 'conflict';
  isLocalOnly: boolean;
  enableLocalMode: () => void;
  syncError: string | null;

  // App Data
  guests: Guest[];
  budgetItems: BudgetItem[];
  procedures: Record<WeddingRegion, ProcedureStep[]>;
  milestoneTasks: MilestoneTaskStore;
  setMilestoneTasks: (tasks: MilestoneTaskStore) => void;
  isSyncing: boolean;

  // Feng Shui Data
  fengShuiProfile: CoupleProfile | null;
  fengShuiResults: {
    harmony: HarmonyResult | null;
    dates: AuspiciousDate[];
  };

  // Invitation Data
  invitation: InvitationData;

  // User Management
  users: UserProfile[];

  // Guest Usage Tracking
  guestUsage: GuestUsage;

  // Local Market Intelligence
  localProvince: string;
  localDistrict: string;
  localMarketReport: LocalMarketReport | null;
  setLocalProvince: (province: string) => void;
  setLocalDistrict: (district: string) => void;
  setLocalMarketReport: (report: LocalMarketReport | null) => void;

  // Actions
  login: (user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  setGeminiApiKey: (key: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // User Actions
  updateUser: (uid: string, data: Partial<UserProfile>) => Promise<void>;

  // Data Actions
  addGuest: (guest: Guest) => void;
  removeGuest: (id: string) => void;
  updateGuest: (guest: Guest) => void;

  addBudgetItem: (item: BudgetItem) => void;
  updateBudgetItem: (id: string, field: keyof BudgetItem, value: any) => void;
  deleteBudgetItem: (id: string) => void;
  setBudgetItems: (items: BudgetItem[]) => void;

  // Procedure Actions
  updateProcedure: (region: WeddingRegion, step: ProcedureStep) => void;
  addProcedure: (region: WeddingRegion, step: ProcedureStep) => void;
  deleteProcedure: (region: WeddingRegion, id: string) => void;
  resetProcedures: () => void;

  // Advanced Actions
  recalculateDeadlines: (weddingDateStr: string) => void;
  resetData: () => void;
  importData: (data: any) => void;

  // Feng Shui Actions
  updateFengShuiProfile: (profile: CoupleProfile) => void;
  setFengShuiResults: (harmony: HarmonyResult | null, dates: AuspiciousDate[]) => void;

  // Invitation Actions
  updateInvitation: (data: Partial<InvitationData>) => void;

  // Usage Actions
  incrementGuestFengShui: () => void;
  incrementGuestAiChat: () => void;
  incrementGuestSpeech: () => void;
  resetGuestUsage: () => void;

  // Shared Plan
  sharedPlan: SharedPlan | null;
  isSharedPlanOwner: boolean;
  getEffectiveUid: () => string | null;  // ownerUid if partner, else user.uid

  // Shared Plan Actions
  initSharedPlan: () => Promise<void>;
  createShareInviteAction: () => Promise<SharedPlan | null>;
  joinPlanAction: (code: string) => Promise<void>;
  leavePlanAction: () => Promise<void>;
  revokePlanAction: () => Promise<void>;
  pollSharedData: () => Promise<void>;

  // Notification Actions
  addNotification: (type: NotificationType, message: string, duration?: number) => void;
  removeNotification: (id: string) => void;

  // Cloud Actions
  loadFromCloud: (options?: { discardLocalChanges?: boolean }) => Promise<void>;
  syncToCloud: () => Promise<void>;
}

let syncTimeout: ReturnType<typeof setTimeout>;
let pollInterval: ReturnType<typeof setInterval> | null = null;
let syncPromise: Promise<void> | null = null;
let loadPromise: Promise<void> | null = null;
const messageOf = (error: unknown) => error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Không thể đồng bộ dữ liệu.';
const getEffectiveUidFromState = (state: AppState): string | null => {
  if (!state.user) return null;
  return state.sharedPlan?.status === 'active' && !state.isSharedPlanOwner ? state.sharedPlan.ownerUid : state.user.uid;
};
const triggerCloudSync = (get: () => AppState) => {
  const state = get();
  useStore.setState({ hasUnsyncedChanges: true, localEditVersion: state.localEditVersion + 1,
    syncStatus: state.isLocalOnly ? 'local' : state.isCloudLoaded ? 'pending' : state.syncStatus });
  clearTimeout(syncTimeout);
  if (!get().isCloudLoaded) return;
  syncTimeout = setTimeout(() => { void get().syncToCloud().catch(e => storeLog.warn('autosave pending retry', e)); }, 2000);
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: DEFAULT_GUEST_USER,
      settings: {
        geminiApiKey: '',
        currency: 'VND',
        themeMode: 'light',
        enableNotifications: true
      },
      guests: INITIAL_GUESTS,
      budgetItems: INITIAL_BUDGET_ITEMS,
      procedures: WEDDING_PROCEDURES,
      milestoneTasks: {},
      setMilestoneTasks: (tasks) => {
        if (!isMilestoneTaskStore(tasks) || JSON.stringify(tasks) === JSON.stringify(get().milestoneTasks)) return;
        set({ milestoneTasks: tasks });
        triggerCloudSync(get);
      },
      isSyncing: false,
      isCloudLoaded: false,
      isLocalOnly: false,
      enableLocalMode: () => {
        clearTimeout(syncTimeout);
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
        set({ isLocalOnly: true, isCloudLoaded: false, syncStatus: 'local', syncError: null });
      },
      cloudRevision: null,
      hasUnsyncedChanges: false,
      localEditVersion: 0,
      syncStatus: 'idle',
      syncError: null,
      fengShuiProfile: null,
      fengShuiResults: { harmony: null, dates: [] },
      notifications: [],
      users: INITIAL_USERS,
      guestUsage: { fengShuiCount: 0, aiChatCount: 0, speechCount: 0 },
      invitation: INITIAL_INVITATION,
      localProvince: '',
      localDistrict: '',
      localMarketReport: null,
      sharedPlan: null,
      isSharedPlanOwner: false,

      getEffectiveUid: () => getEffectiveUidFromState(get()),

      setLocalProvince: (province) => set({ localProvince: province }),
      setLocalDistrict: (district) => set({ localDistrict: district }),
      setLocalMarketReport: (report) => set({ localMarketReport: report }),

      login: async (user) => {
        // Simply update user profile — no cloud sync
        set({ user });
      },

      logout: async () => {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) { get().addNotification('ERROR', 'Chưa thể đăng xuất. Vui lòng thử lại.'); return; }
        // Clear any pending cloud sync and shared plan polling before state reset
        clearTimeout(syncTimeout);
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
        // Simply reset to default state — no cloud operations
        set({
          user: DEFAULT_GUEST_USER,
          guestUsage: { fengShuiCount: 0, aiChatCount: 0, speechCount: 0 },
          sharedPlan: null,
          isSharedPlanOwner: false,
          isCloudLoaded: false,
        });
      },

      setGeminiApiKey: (key) => set((state) => ({ settings: { ...state.settings, geminiApiKey: key } })),

      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      updateUser: async (uid, data) => {
        const currentUser = get().user;
        if (currentUser && currentUser.uid === uid) {
          set({ user: { ...currentUser, ...data }, ...('weddingDate' in data ? {
            invitation: { ...get().invitation, date: data.weddingDate || '' }
          } : {}) });
        }
        const updatedUsers = get().users.map(u => u.uid === uid ? { ...u, ...data } : u);
        set({ users: updatedUsers });
        // Trigger cloud sync to persist profile changes
        triggerCloudSync(get);
      },

      addGuest: (guest) => {
        if (!guest.id || !guest.name?.trim()) return;
        const sanitized = { ...guest, name: guest.name.trim().slice(0, 100) };
        set((state) => ({ guests: [...state.guests, sanitized] }));
        get().addNotification('SUCCESS', 'Đã thêm khách mời mới.');
        triggerCloudSync(get);
      },

      removeGuest: (id) => {
        set((state) => ({ guests: state.guests.filter(g => g.id !== id) }));
        get().addNotification('INFO', 'Đã xóa khách mời.');
        triggerCloudSync(get);
      },

      updateGuest: (updatedGuest) => {
        if (!updatedGuest.id || !updatedGuest.name?.trim()) return;
        const base = { ...updatedGuest, childrenCount: Math.min(99, Math.max(0, Math.trunc(Number(updatedGuest.childrenCount) || 0))) };
        const sanitized = { ...base, name: base.name.trim().slice(0, 100), partySize: Math.min(100, guestPartySize(base)) };
        set((state) => ({ guests: state.guests.map(g => g.id === sanitized.id ? sanitized : g) }));
        triggerCloudSync(get);
      },

      addBudgetItem: (item) => {
        set((state) => ({ budgetItems: [...state.budgetItems, item] }));
        get().addNotification('SUCCESS', 'Đã thêm khoản chi mới.');
        triggerCloudSync(get);
      },

      updateBudgetItem: (id, field, value) => {
        set((state) => ({
          budgetItems: state.budgetItems.map(item =>
            item.id === id ? { ...item, [field]: value } : item
          )
        }));
        triggerCloudSync(get);
      },

      deleteBudgetItem: (id) => {
        set((state) => ({ budgetItems: state.budgetItems.filter(i => i.id !== id) }));
        get().addNotification('INFO', 'Đã xóa khoản chi.');
        triggerCloudSync(get);
      },

      setBudgetItems: (items) => {
        set({ budgetItems: items });
        triggerCloudSync(get);
      },

      updateProcedure: (region, step) => {
        set((state) => {
          const regionProcedures = state.procedures[region] || [];
          const newProcedures = regionProcedures.map(p => p.id === step.id ? step : p);
          return {
            procedures: { ...state.procedures, [region]: newProcedures }
          };
        });
        get().addNotification('SUCCESS', 'Đã cập nhật quy trình.');
        triggerCloudSync(get);
      },

      addProcedure: (region, step) => {
        set((state) => {
          const regionProcedures = state.procedures[region] || [];
          return {
            procedures: { ...state.procedures, [region]: [...regionProcedures, step] }
          };
        });
        get().addNotification('SUCCESS', 'Đã thêm quy trình mới.');
        triggerCloudSync(get);
      },

      deleteProcedure: (region, id) => {
        set((state) => {
          const regionProcedures = state.procedures[region] || [];
          return {
            procedures: { ...state.procedures, [region]: regionProcedures.filter(p => p.id !== id) }
          };
        });
        get().addNotification('INFO', 'Đã xóa quy trình.');
        triggerCloudSync(get);
      },

      resetProcedures: () => {
        set({ procedures: WEDDING_PROCEDURES });
        get().addNotification('WARNING', 'Đã khôi phục quy trình mặc định.');
        triggerCloudSync(get);
      },

      recalculateDeadlines: (weddingDateStr) => {
        if (!weddingDateStr) return;
        storeLog.info('recalculate deadlines', { date: weddingDateStr });
        const weddingDate = new Date(weddingDateStr);
        set((state) => {
          const newItems = state.budgetItems.map(item => {
            if (item.status === TaskStatus.DONE || item.status === TaskStatus.PAID) return item;
            let daysBefore = 0;
            const cat = item.category.toLowerCase();
            const name = item.itemName.toLowerCase();
            if (cat.includes('nhà hàng') || cat.includes('tiệc cưới')) {
              if (name.includes('đặt cọc')) daysBefore = 180;
              else if (name.includes('thực đơn') || name.includes('chốt')) daysBefore = 30;
              else daysBefore = 0;
            } else if (cat.includes('ảnh') || cat.includes('phim')) {
              daysBefore = 60;
            } else if (cat.includes('trang phục') || cat.includes('váy') || cat.includes('vest')) {
              daysBefore = 45;
            } else if (cat.includes('nhẫn') || cat.includes('trang sức')) {
              daysBefore = 90;
            } else if (cat.includes('thiệp')) {
              daysBefore = 45;
            } else if (cat.includes('lễ ăn hỏi') || cat.includes('dạm ngõ')) {
              daysBefore = 30;
            } else if (cat.includes('xe') || cat.includes('hoa')) {
              daysBefore = 14;
            } else {
              daysBefore = 7;
            }
            const deadlineDate = new Date(weddingDate);
            deadlineDate.setDate(weddingDate.getDate() - daysBefore);
            return { ...item, deadline: deadlineDate.toISOString().split('T')[0] };
          });
          return { budgetItems: newItems };
        });
        get().addNotification('SUCCESS', 'Đã cập nhật lại hạn chót công việc.');
        triggerCloudSync(get);
      },

      resetData: () => {
        set({
          guests: INITIAL_GUESTS,
          budgetItems: INITIAL_BUDGET_ITEMS,
          procedures: WEDDING_PROCEDURES,
          milestoneTasks: {},
          fengShuiProfile: null,
          fengShuiResults: { harmony: null, dates: [] },
          invitation: INITIAL_INVITATION,
          ...(get().user ? { user: { ...get().user!, weddingDate: INITIAL_INVITATION.date || null } } : {})
        });
        get().addNotification('WARNING', 'Dữ liệu đã được đặt lại về mặc định.');
        // Sync the reset state to cloud so cloud and local stay consistent.
        // Without this, if editor is open its auto-save would race to overwrite cloud anyway.
        triggerCloudSync(get);
      },

      importData: (data: unknown) => {
        const restored = restoreBackup(data, get());
        set({ ...restored, budgetItems: sanitizeBudgetIds(restored.budgetItems),
          ...(get().user ? { user: { ...get().user!, weddingDate: restored.invitation.date || null } } : {}) });
        get().addNotification('SUCCESS', 'Đã khôi phục dữ liệu cục bộ.');
        triggerCloudSync(get);
      },

      updateFengShuiProfile: (profile) => {
        set({ fengShuiProfile: profile });
        triggerCloudSync(get);
      },

      setFengShuiResults: (harmony, dates) => {
        set({ fengShuiResults: { harmony, dates } });
        triggerCloudSync(get);
      },

      updateInvitation: (data) => {
        const merged = { ...get().invitation, ...data };
        if (JSON.stringify(merged) === JSON.stringify(get().invitation)) return;
        set(state => ({ invitation: merged,
          ...(state.user ? { user: { ...state.user, weddingDate: merged.date || null } } : {}) }));
        triggerCloudSync(get);
      },

      incrementGuestFengShui: () => set((state) => ({
        guestUsage: { ...state.guestUsage, fengShuiCount: state.guestUsage.fengShuiCount + 1 }
      })),

      incrementGuestAiChat: () => set((state) => ({
        guestUsage: { ...state.guestUsage, aiChatCount: state.guestUsage.aiChatCount + 1 }
      })),

      incrementGuestSpeech: () => set((state) => ({
        guestUsage: { ...state.guestUsage, speechCount: state.guestUsage.speechCount + 1 }
      })),

      resetGuestUsage: () => set({ guestUsage: { fengShuiCount: 0, aiChatCount: 0, speechCount: 0 } }),

      // --- SHARED PLAN ACTIONS ---

      initSharedPlan: async () => {
        const user = get().user;
        if (!user) return;
        try {
          const result = await getMySharedPlan(user.uid);
          if (result) {
            set({ sharedPlan: result.plan, isSharedPlanOwner: result.role === 'owner' });

            // Start polling if active shared plan
            if (result.plan.status === 'active' && !pollInterval) {
              pollInterval = setInterval(() => {
                get().pollSharedData();
              }, 30000); // Poll every 30s
            }
          }
        } catch (e) {
          storeLog.error('init shared plan failed', e);
        }
      },

      createShareInviteAction: async () => {
        const user = get().user;
        if (!user) return null;
        try {
          const plan = await createShareInvite(user);
          set({ sharedPlan: plan, isSharedPlanOwner: true });
          get().addNotification('SUCCESS', `Đã tạo mã mời: ${plan.shareCode}`);
          return plan;
        } catch (e: any) {
          get().addNotification('ERROR', e.message || 'Lỗi tạo mã mời.');
          return null;
        }
      },

      joinPlanAction: async (code: string) => {
        const user = get().user;
        if (!user) return;
        try {
          const plan = await joinPlanByCode(code, user);
          set({ sharedPlan: plan, isSharedPlanOwner: false });

          // Load owner's data
          if (user.enableCloudStorage) {
            const cloudData = await loadUserDataFromCloud(plan.ownerUid);
            if (cloudData) {
              set({
                guests: cloudData.guests,
                budgetItems: sanitizeBudgetIds(cloudData.budgetItems),
                procedures: cloudData.procedures || WEDDING_PROCEDURES,
                milestoneTasks: cloudData.milestoneTasks ?? {},
                fengShuiProfile: cloudData.fengShuiProfile || null,
                fengShuiResults: cloudData.fengShuiResults || { harmony: null, dates: [] },
                invitation: cloudData.invitation || INITIAL_INVITATION,
                // Sync owner's weddingDate for countdown/timeline
                ...(cloudData.weddingDate ? {
                  user: { ...get().user!, weddingDate: cloudData.weddingDate }
                } : {})
              });
            }
          }

          // Start polling
          if (!pollInterval) {
            pollInterval = setInterval(() => { get().pollSharedData(); }, 30000);
          }

          get().addNotification('SUCCESS', `Đã tham gia kế hoạch cưới của ${plan.ownerName || plan.ownerEmail}!`);
        } catch (e: any) {
          get().addNotification('ERROR', e.message || 'Lỗi tham gia kế hoạch.');
        }
      },

      leavePlanAction: async () => {
        const { sharedPlan, user } = get();
        if (!sharedPlan || !user) return;
        try {
          await leavePlan(sharedPlan.id, user.uid, sharedPlan.ownerUid);
          if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
          set({ sharedPlan: null, isSharedPlanOwner: false });
          // Reset to user's own data
          if (user.enableCloudStorage) {
            const ownData = await loadUserDataFromCloud(user.uid);
            if (ownData) {
              set({
                guests: ownData.guests,
                budgetItems: sanitizeBudgetIds(ownData.budgetItems),
                procedures: ownData.procedures || WEDDING_PROCEDURES,
                milestoneTasks: ownData.milestoneTasks ?? {},
                fengShuiProfile: ownData.fengShuiProfile || null,
                fengShuiResults: ownData.fengShuiResults || { harmony: null, dates: [] },
                invitation: ownData.invitation || INITIAL_INVITATION,
              });
            }
          }
          get().addNotification('INFO', 'Đã rời khỏi kế hoạch chung.');
        } catch (e: any) {
          get().addNotification('ERROR', e.message || 'Lỗi rời kế hoạch.');
        }
      },

      revokePlanAction: async () => {
        const { sharedPlan } = get();
        if (!sharedPlan) return;
        try {
          await revokeShare(sharedPlan.id);
          if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
          set({ sharedPlan: null, isSharedPlanOwner: false });
          get().addNotification('INFO', 'Đã hủy chia sẻ kế hoạch.');
        } catch (e: any) {
          get().addNotification('ERROR', e.message || 'Lỗi hủy chia sẻ.');
        }
      },

      pollSharedData: async () => {
        const { sharedPlan, user, isSharedPlanOwner } = get();
        if (!sharedPlan || sharedPlan.status !== 'active' || !user?.enableCloudStorage) return;
        if (get().hasUnsyncedChanges || get().isSyncing) return;
        const startRevision = get().cloudRevision;
        try {
          const effectiveUid = getEffectiveUidFromState(get());
          if (!effectiveUid) return;
          const cloudData = await loadUserDataFromCloud(effectiveUid);
          if (get().hasUnsyncedChanges || get().isSyncing || get().cloudRevision !== startRevision || get().sharedPlan?.id !== sharedPlan.id) return;
          if (cloudData) {
            set({
              cloudRevision: cloudData.revision,
              guests: cloudData.guests,
              budgetItems: sanitizeBudgetIds(cloudData.budgetItems),
              procedures: cloudData.procedures || WEDDING_PROCEDURES,
              milestoneTasks: cloudData.milestoneTasks ?? get().milestoneTasks,
              fengShuiProfile: cloudData.fengShuiProfile || null,
              fengShuiResults: cloudData.fengShuiResults || { harmony: null, dates: [] },
              invitation: cloudData.invitation || INITIAL_INVITATION,
              // Sync owner's weddingDate for partner
              ...(!isSharedPlanOwner && cloudData.weddingDate ? {
                user: { ...get().user!, weddingDate: cloudData.weddingDate }
              } : {})
            });
          }
        } catch (e) {
          storeLog.error('shared plan polling failed', e);
        }
      },

      addNotification: (type, message, duration = 3000) => {
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        // Deduplicate: skip if same message already visible
        const existing = get().notifications;
        if (existing.some(n => n.message === message)) return;

        // Limit max visible notifications to 5 (remove oldest)
        const MAX_VISIBLE = 5;
        const trimmed = existing.length >= MAX_VISIBLE ? existing.slice(existing.length - MAX_VISIBLE + 1) : existing;

        set({ notifications: [...trimmed, { id, type, message, duration }] });
        if (duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }
      },

      removeNotification: (id) => {
        set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) }));
      },

      syncToCloud: () => {
        clearTimeout(syncTimeout);
        if (get().isLocalOnly) {
          // Zustand persists synchronously. This local write must complete
          // before Save resolves; retain dirty data for future cloud sync.
          set({ syncStatus: 'local' });
          return Promise.resolve();
        }
        if (syncPromise) return syncPromise;
        if (!get().isCloudLoaded) return Promise.reject(new Error('Chưa xác minh dữ liệu cloud. Hãy tải lại trước khi đồng bộ.'));
        syncPromise = (async () => {
          set({ isSyncing: true, syncError: null });
          try {
            while (get().hasUnsyncedChanges && get().isCloudLoaded && !get().isLocalOnly) {
              const snapshot = get();
              set({ syncStatus: 'saving' });
              const revision = await saveUserDataToCloud(getEffectiveUidFromState(snapshot) || OWNER_UID, {
                guests: snapshot.guests, budgetItems: snapshot.budgetItems, procedures: snapshot.procedures,
                milestoneTasks: snapshot.milestoneTasks,
                fengShuiProfile: snapshot.fengShuiProfile ?? undefined, fengShuiResults: snapshot.fengShuiResults,
                invitation: snapshot.invitation, weddingDate: snapshot.invitation.date || null,
              }, snapshot.cloudRevision);
              const unchanged = snapshot.localEditVersion === get().localEditVersion;
              set({ cloudRevision: revision, hasUnsyncedChanges: !unchanged,
                syncStatus: unchanged ? 'saved' : 'pending' });
            }
          } catch (error: unknown) {
            const conflict = !!error && typeof error === 'object' && 'code' in error && ['40001','23505'].includes(String(error.code));
            set({ syncStatus: conflict ? 'conflict' : 'error', syncError: messageOf(error),
              ...(conflict ? { isCloudLoaded: false } : {}) });
            throw error;
          } finally { set({ isSyncing: false }); }
        })().finally(() => { syncPromise = null; });
        return syncPromise;
      },

      loadFromCloud: (options = {}) => {
        if (loadPromise) return loadPromise;
        loadPromise = (async () => {
          // Do not start a read that races an acknowledged write.
          if (syncPromise) await syncPromise.catch(() => {});
          set({ isSyncing: true, isCloudLoaded: false, syncStatus: 'loading', syncError: null });
          try {
            const cloudData = await loadUserDataFromCloud(getEffectiveUidFromState(get()) || OWNER_UID);
            const current = get();
            const remoteRevision = cloudData?.revision ?? null;
            if (current.hasUnsyncedChanges && !options.discardLocalChanges && remoteRevision !== current.cloudRevision) {
              set({ syncStatus: 'conflict' });
              throw new Error('Cloud đã thay đổi trên thiết bị khác. Hãy xuất backup cục bộ trước khi chọn dùng bản cloud.');
            }
            if (cloudData && (!current.hasUnsyncedChanges || options.discardLocalChanges)) {
              const invitation = cloudData.invitation || current.invitation;
              const date = invitation.date || cloudData.weddingDate || '';
              set({ guests: cloudData.guests, budgetItems: sanitizeBudgetIds(cloudData.budgetItems),
                procedures: cloudData.procedures ?? current.procedures,
                milestoneTasks: cloudData.milestoneTasks ?? current.milestoneTasks,
                fengShuiProfile: cloudData.fengShuiProfile ?? null,
                fengShuiResults: cloudData.fengShuiResults ?? { harmony: null, dates: [] },
                invitation: { ...invitation, date },
                ...(current.user ? { user: { ...current.user, weddingDate: date || null } } : {}) });
            }
            const dirty = options.discardLocalChanges ? false : get().hasUnsyncedChanges;
            set({ cloudRevision: remoteRevision, isCloudLoaded: true, hasUnsyncedChanges: dirty,
              syncStatus: dirty ? 'pending' : 'saved', syncError: null });
            // Import browser-only tasks after verifying the remote plan, and
            // never replace an authoritative checklist already on the server.
            if (cloudData?.milestoneTasks === undefined && !Object.keys(get().milestoneTasks).length &&
              !options.discardLocalChanges && getEffectiveUidFromState(get()) === OWNER_UID) {
              const legacy = readLegacyMilestoneTasks();
              if (legacy) get().setMilestoneTasks(legacy);
            }
          } catch (error) {
            set({ isCloudLoaded: false, syncStatus: get().syncStatus === 'conflict' ? 'conflict' : 'error', syncError: messageOf(error) });
            throw error;
          } finally { set({ isSyncing: false }); }
          if (get().hasUnsyncedChanges) {
            clearTimeout(syncTimeout);
            syncTimeout = setTimeout(() => { void get().syncToCloud().catch(e => storeLog.warn('retry save failed', e)); }, 2000);
          }
        })().finally(() => { loadPromise = null; });
        return loadPromise;
      },
    }),
    {
      // IMPORTANT: Never rename this key again. Use `version` + `migrate` for schema changes.
      // Renaming abandons all localStorage data (users lose data until cloud sync restores it).
      name: 'wedplan-storage-v14',
      // Version 1 = first versioned release. Future schema changes: bump version + add migrate case.
      version: 1,
      migrate: (persistedState: unknown, fromVersion: number) => {
        // v0 (unversioned) → v1: no schema changes, just start tracking version
        if (fromVersion === 0) return persistedState;
        // Future: if (fromVersion === 1) { /* migrate v1→v2 */ }
        return persistedState;
      },
      partialize: (state) => ({
        settings: state.settings,
        user: state.user,
        guests: state.guests,
        budgetItems: state.budgetItems,
        procedures: state.procedures,
        milestoneTasks: state.milestoneTasks,
        fengShuiProfile: state.fengShuiProfile,
        fengShuiResults: state.fengShuiResults,
        invitation: state.invitation,
        users: state.users,
        guestUsage: state.guestUsage,
        localProvince: state.localProvince,
        localDistrict: state.localDistrict,
        localMarketReport: state.localMarketReport,
        cloudRevision: state.cloudRevision,
        hasUnsyncedChanges: state.hasUnsyncedChanges,
        // isCloudLoaded intentionally NOT persisted — always starts false on page load
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.budgetItems = sanitizeBudgetIds(state.budgetItems);
        if (!isMilestoneTaskStore(state.milestoneTasks)) state.milestoneTasks = {};
        if (state.user) state.user.weddingDate = state.invitation?.date || null;
        // isCloudLoaded must always start as false — never persist this flag
        state.isCloudLoaded = false;
      },
    }
  )
);
