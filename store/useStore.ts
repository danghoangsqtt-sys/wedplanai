import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, AppSettings, Guest, BudgetItem, TaskStatus, Notification, NotificationType, WeddingRegion, ProcedureStep, InvitationData, LocalMarketReport, SharedPlan } from '../types';
import { CoupleProfile, HarmonyResult, AuspiciousDate } from '../types/fengshui';
import { saveUserDataToCloud, loadUserDataFromCloud, syncUserProfile, getUserPublicProfile } from '../services/cloudService';
import { fetchAllProfiles, fetchAnalyticsData, AdminAnalytics } from '../services/adminService';
import { getMySharedPlan, createShareInvite, joinPlanByCode, revokeShare, leavePlan } from '../services/sharingService';
import { INITIAL_GUESTS, INITIAL_BUDGET_ITEMS, DEFAULT_GUEST_USER, INITIAL_USERS } from '../data/initialData';
import { WEDDING_PROCEDURES } from '../data/wedding-procedures';
import { account, databases, DB_ID, COLLECTIONS } from '../lib/appwrite';

export interface GuestUsage {
  fengShuiCount: number;
  aiChatCount: number;
  speechCount: number;
}

const DEFAULT_INVITATION: InvitationData = {
  templateId: 'luxury',
  groomName: '',
  brideName: '',
  groomParents: { father: '', mother: '' },
  brideParents: { father: '', mother: '' },
  date: '',
  lunarDate: '',
  time: '10:30',
  location: '',
  address: '',
  wishes: 'Rất hân hạnh được đón tiếp quý khách!',
  themeColor: '#e11d48',
  bankInfo: { bankId: '', accountNumber: '', accountName: '' },
  couplePhoto: '',
  galleryImages: [],
  musicUrl: '',
  photoConfig: { scale: 1, x: 0, y: 0 },
  events: []
};

interface AppState {
  user: UserProfile | null;
  settings: AppSettings;

  // Real Admin Data
  adminUsers: UserProfile[];
  adminStats: AdminAnalytics | null;

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
  logout: () => void;
  setGeminiApiKey: (key: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Admin Actions
  fetchAdminData: () => Promise<void>;
  addUser: (user: UserProfile) => Promise<void>;
  updateUser: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>;

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
  syncTimeout = setTimeout(() => {
    // Re-read state at save time to capture all mutations within the debounce window
    const state = get();
    const effectiveUid = getEffectiveUidFromState(state);
    if (state.user?.enableCloudStorage && effectiveUid) {
      saveUserDataToCloud(effectiveUid, {
        guests: state.guests,
        budgetItems: state.budgetItems,
        procedures: state.procedures,
        fengShuiProfile: state.fengShuiProfile || undefined,
        fengShuiResults: state.fengShuiResults || undefined,
        invitation: state.invitation,
        weddingDate: state.user?.weddingDate || null,
      });
    }
  }, 2000); // Debounce 2s
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
      adminUsers: [],
      adminStats: null,
      guests: INITIAL_GUESTS,
      budgetItems: INITIAL_BUDGET_ITEMS,
      procedures: WEDDING_PROCEDURES,
      isSyncing: false,
      fengShuiProfile: null,
      fengShuiResults: { harmony: null, dates: [] },
      notifications: [],
      users: INITIAL_USERS,
      guestUsage: { fengShuiCount: 0, aiChatCount: 0, speechCount: 0 },
      invitation: DEFAULT_INVITATION,
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
        set({ user, isSyncing: true });
        get().addNotification('SUCCESS', `Chào mừng ${user.displayName} đã quay trở lại!`);
        await syncUserProfile(user);

        // Check shared plans
        try {
          const shared = await getMySharedPlan(user.uid);
          if (shared) {
            set({ sharedPlan: shared.plan, isSharedPlanOwner: shared.role === 'owner' });
          }
        } catch { /* silent */ }

        if (user.enableCloudStorage) {
          const effectiveUid = getEffectiveUidFromState(get());
          const cloudData = await loadUserDataFromCloud(effectiveUid || user.uid);
          if (cloudData) {
            // If partner in shared plan, also load owner's weddingDate
            const isPartner = get().sharedPlan?.status === 'active' && !get().isSharedPlanOwner;
            set({
              guests: cloudData.guests,
              budgetItems: cloudData.budgetItems,
              procedures: cloudData.procedures || WEDDING_PROCEDURES,
              fengShuiProfile: cloudData.fengShuiProfile || null,
              fengShuiResults: cloudData.fengShuiResults || { harmony: null, dates: [] },
              invitation: cloudData.invitation || DEFAULT_INVITATION,
              isSyncing: false,
              ...(isPartner && cloudData.weddingDate ? {
                user: { ...get().user!, weddingDate: cloudData.weddingDate }
              } : {})
            });
            const shared = get().sharedPlan;
            if (shared?.status === 'active') {
              get().addNotification('INFO', `Đã đồng bộ kế hoạch chung với ${get().isSharedPlanOwner ? shared.partnerEmail : shared.ownerName}.`);
            } else {
              get().addNotification('INFO', 'Đã đồng bộ dữ liệu từ đám mây.');
            }
            return;
          }
        }
        set({ isSyncing: false });
      },

      logout: () => {
        // Clear polling
        if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
        account.deleteSession('current').catch(() => {});
        set({
          user: DEFAULT_GUEST_USER,
          guests: INITIAL_GUESTS,
          budgetItems: INITIAL_BUDGET_ITEMS,
          procedures: WEDDING_PROCEDURES,
          fengShuiProfile: null,
          fengShuiResults: { harmony: null, dates: [] },
          guestUsage: { fengShuiCount: 0, aiChatCount: 0, speechCount: 0 },
          invitation: DEFAULT_INVITATION,
          sharedPlan: null,
          isSharedPlanOwner: false,
        });
        get().addNotification('INFO', 'Đã đăng xuất thành công.');
      },

      setGeminiApiKey: (key) => set((state) => ({ settings: { ...state.settings, geminiApiKey: key } })),

      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      fetchAdminData: async () => {
        const users = await fetchAllProfiles();
        const stats = await fetchAnalyticsData();
        set({ adminUsers: users, adminStats: stats });
      },

      addUser: async (newUser) => {
        await syncUserProfile(newUser);
        const users = await fetchAllProfiles();
        set((state) => ({
          adminUsers: users,
          users: [...state.users, newUser]
        }));
        get().addNotification('SUCCESS', 'Đã thêm người dùng mới.');
      },

      updateUser: async (uid, data) => {
        // Only send fields that exist in Appwrite public_profiles schema
        const APPWRITE_PROFILE_FIELDS = new Set([
          'uid', 'email', 'displayName', 'photoURL', 'role',
          'isActive', 'joinedAt', 'lastSeen', 'enableCloudStorage', 'allowCustomApiKey'
        ]);
        const cloudData: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
          if (APPWRITE_PROFILE_FIELDS.has(key)) {
            cloudData[key] = value;
          }
        }
        // Only call Appwrite if there are cloud-compatible fields
        if (Object.keys(cloudData).length > 0) {
          try {
            await databases.updateDocument(DB_ID, COLLECTIONS.PUBLIC_PROFILES, uid, cloudData);
          } catch (e: any) {
            console.error('Update User Error:', e);
          }
        }
        // Always update local state with ALL fields (including local-only ones)
        const currentUser = get().user;
        if (currentUser && currentUser.uid === uid) {
          set({ user: { ...currentUser, ...data } });
        }
        const updatedAdminUsers = get().adminUsers.map(u => u.uid === uid ? { ...u, ...data } : u);
        const updatedUsers = get().users.map(u => u.uid === uid ? { ...u, ...data } : u);
        set({ adminUsers: updatedAdminUsers, users: updatedUsers });
      },

      deleteUser: async (uid) => {
        try {
          await databases.deleteDocument(DB_ID, COLLECTIONS.PUBLIC_PROFILES, uid);
          await databases.deleteDocument(DB_ID, COLLECTIONS.USER_DATA, uid).catch(() => {});
        } catch (e) { console.error(e); }
        set((state) => ({
          adminUsers: state.adminUsers.filter(u => u.uid !== uid),
          users: state.users.filter(u => u.uid !== uid)
        }));
        get().addNotification('INFO', 'Đã xóa người dùng.');
      },

      refreshUserProfile: async () => {
        const currentUser = get().user;
        if (!currentUser || currentUser.role === 'GUEST') return;
        try {
          const cloudProfile = await getUserPublicProfile(currentUser.uid);
          if (cloudProfile) {
            set((state) => ({
              user: {
                ...state.user!,
                isActive: cloudProfile.isActive,
                allowCustomApiKey: cloudProfile.allowCustomApiKey,
                enableCloudStorage: cloudProfile.enableCloudStorage,
                role: cloudProfile.role
              }
            }));
          }
        } catch (e) {
          console.error("Failed to refresh user profile", e);
        }
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
          invitation: DEFAULT_INVITATION
        });
        get().addNotification('WARNING', 'Dữ liệu đã được đặt lại về mặc định.');
      },

      importData: (data: any) => {
        set({
          guests: data.guests || [],
          budgetItems: data.budgetItems || [],
          procedures: data.procedures || WEDDING_PROCEDURES,
          fengShuiProfile: data.fengShuiProfile || null,
          fengShuiResults: data.fengShuiResults || { harmony: null, dates: [] },
          invitation: data.invitation || DEFAULT_INVITATION
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
        if (!user || user.role === 'GUEST') return;
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
                budgetItems: cloudData.budgetItems,
                procedures: cloudData.procedures || WEDDING_PROCEDURES,
                fengShuiProfile: cloudData.fengShuiProfile || null,
                fengShuiResults: cloudData.fengShuiResults || { harmony: null, dates: [] },
                invitation: cloudData.invitation || DEFAULT_INVITATION,
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
                budgetItems: ownData.budgetItems,
                procedures: ownData.procedures || WEDDING_PROCEDURES,
                fengShuiProfile: ownData.fengShuiProfile || null,
                fengShuiResults: ownData.fengShuiResults || { harmony: null, dates: [] },
                invitation: ownData.invitation || DEFAULT_INVITATION,
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
              budgetItems: cloudData.budgetItems,
              procedures: cloudData.procedures || WEDDING_PROCEDURES,
              fengShuiProfile: cloudData.fengShuiProfile || null,
              fengShuiResults: cloudData.fengShuiResults || { harmony: null, dates: [] },
              invitation: cloudData.invitation || DEFAULT_INVITATION,
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
      }
    }),
    {
      name: 'wedplan-storage-v10',
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
    }
  )
);