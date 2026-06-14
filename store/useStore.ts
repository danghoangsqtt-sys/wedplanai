import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, AppSettings, Guest, BudgetItem, TaskStatus, Notification, NotificationType, WeddingRegion, ProcedureStep, InvitationData, LocalMarketReport, SharedPlan } from '../types';
import { CoupleProfile, HarmonyResult, AuspiciousDate } from '../types/fengshui';
import { saveUserDataToCloud, loadUserDataFromCloud } from '../services/cloudService';
import { getMySharedPlan, createShareInvite, joinPlanByCode, revokeShare, leavePlan } from '../services/sharingService';
import { INITIAL_GUESTS, INITIAL_BUDGET_ITEMS, DEFAULT_GUEST_USER, INITIAL_USERS, INITIAL_INVITATION } from '../data/initialData';
import { WEDDING_PROCEDURES } from '../data/wedding-procedures';
import { supabase, TABLES } from '../lib/supabase';
import { OWNER_UID } from '../lib/constants';

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

  // App Data
  guests: Guest[];
  budgetItems: BudgetItem[];
  procedures: Record<WeddingRegion, ProcedureStep[]>;
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
  loadFromCloud: () => Promise<void>;
}

let syncTimeout: ReturnType<typeof setTimeout>;
let pollInterval: ReturnType<typeof setInterval> | null = null;

const getEffectiveUidFromState = (state: AppState): string | null => {
  if (!state.user) return null;
  if (state.sharedPlan?.status === 'active' && !state.isSharedPlanOwner) {
    return state.sharedPlan.ownerUid; // Partner saves to owner's document
  }
  return state.user.uid;
};

const triggerCloudSync = (get: () => AppState) => {
  clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    const state = get();
    try {
      await saveUserDataToCloud(OWNER_UID, {
        guests: state.guests,
        budgetItems: state.budgetItems,
        procedures: state.procedures,
        fengShuiProfile: state.fengShuiProfile ?? undefined,
        fengShuiResults: state.fengShuiResults ?? undefined,
        invitation: state.invitation,
        weddingDate: state.invitation?.date ?? null,
      });
    } catch (e) {
      console.warn('Cloud sync failed (will retry on next change):', e);
    }
  }, 2000);
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
      isSyncing: false,
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
        // Simply reset to default state — no cloud operations
        set({
          user: DEFAULT_GUEST_USER,
          guestUsage: { fengShuiCount: 0, aiChatCount: 0, speechCount: 0 },
          sharedPlan: null,
          isSharedPlanOwner: false,
        });
      },

      setGeminiApiKey: (key) => set((state) => ({ settings: { ...state.settings, geminiApiKey: key } })),

      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      updateUser: async (uid, data) => {
        const currentUser = get().user;
        if (currentUser && currentUser.uid === uid) {
          set({ user: { ...currentUser, ...data } });
        }
        const updatedUsers = get().users.map(u => u.uid === uid ? { ...u, ...data } : u);
        set({ users: updatedUsers });
        // Trigger cloud sync to persist profile changes
        triggerCloudSync(get);
      },

      addGuest: (guest) => {
        set((state) => ({ guests: [...state.guests, guest] }));
        get().addNotification('SUCCESS', 'Đã thêm khách mời mới.');
        triggerCloudSync(get);
      },

      removeGuest: (id) => {
        set((state) => ({ guests: state.guests.filter(g => g.id !== id) }));
        get().addNotification('INFO', 'Đã xóa khách mời.');
        triggerCloudSync(get);
      },

      updateGuest: (updatedGuest) => {
        set((state) => ({ guests: state.guests.map(g => g.id === updatedGuest.id ? updatedGuest : g) }));
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
          fengShuiProfile: null,
          fengShuiResults: { harmony: null, dates: [] },
          invitation: INITIAL_INVITATION
        });
        get().addNotification('WARNING', 'Dữ liệu đã được đặt lại về mặc định.');
      },

      importData: (data: any) => {
        set({
          guests: data.guests || [],
          budgetItems: sanitizeBudgetIds(data.budgetItems || []),
          procedures: data.procedures || WEDDING_PROCEDURES,
          fengShuiProfile: data.fengShuiProfile || null,
          fengShuiResults: data.fengShuiResults || { harmony: null, dates: [] },
          invitation: data.invitation || INITIAL_INVITATION
        });
        get().addNotification('SUCCESS', 'Khôi phục dữ liệu thành công.');
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
        set((state) => ({ invitation: { ...state.invitation, ...data } }));
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
          console.error('Init shared plan error:', e);
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
        try {
          const effectiveUid = getEffectiveUidFromState(get());
          if (!effectiveUid) return;
          const cloudData = await loadUserDataFromCloud(effectiveUid);
          if (cloudData) {
            set({
              guests: cloudData.guests,
              budgetItems: sanitizeBudgetIds(cloudData.budgetItems),
              procedures: cloudData.procedures || WEDDING_PROCEDURES,
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
          console.error('Shared plan polling error:', e);
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

      loadFromCloud: async () => {
        set({ isSyncing: true });
        try {
          const cloudData = await loadUserDataFromCloud(OWNER_UID);
          if (cloudData) {
            // Smart merge: only overwrite invitation if cloud has real data
            const cloudInvitation = cloudData.invitation;
            const hasRealInvitation = cloudInvitation && cloudInvitation.groomName && cloudInvitation.groomName.trim() !== '';

            set({
              guests: cloudData.guests ?? get().guests,
              budgetItems: sanitizeBudgetIds(cloudData.budgetItems ?? get().budgetItems),
              procedures: cloudData.procedures ?? get().procedures,
              fengShuiProfile: cloudData.fengShuiProfile ?? get().fengShuiProfile,
              fengShuiResults: cloudData.fengShuiResults ?? get().fengShuiResults,
              invitation: hasRealInvitation ? cloudInvitation : get().invitation,
            });
          }
        } catch (e) {
          console.warn('Load from cloud failed, using local data:', e);
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'wedplan-storage-v14',
      partialize: (state) => ({
        settings: state.settings,
        user: state.user,
        guests: state.guests,
        budgetItems: state.budgetItems,
        procedures: state.procedures,
        fengShuiProfile: state.fengShuiProfile,
        fengShuiResults: state.fengShuiResults,
        invitation: state.invitation,
        users: state.users,
        guestUsage: state.guestUsage,
        localProvince: state.localProvince,
        localDistrict: state.localDistrict,
        localMarketReport: state.localMarketReport,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.budgetItems = sanitizeBudgetIds(state.budgetItems);
      },
    }
  )
);