
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, AppSettings, Guest, BudgetItem, TaskStatus, Notification, NotificationType, WeddingRegion, ProcedureStep, InvitationData } from '../types';
import { CoupleProfile, HarmonyResult, AuspiciousDate } from '../types/fengshui';
import { saveUserDataToCloud, loadUserDataFromCloud, syncUserProfile, getUserPublicProfile } from '../services/cloudService';
import { fetchAllProfiles, fetchAnalyticsData, AdminAnalytics } from '../services/adminService';
import { INITIAL_GUESTS, INITIAL_BUDGET_ITEMS, DEFAULT_GUEST_USER, INITIAL_USERS } from '../data/initialData';
import { WEDDING_PROCEDURES } from '../data/wedding-procedures';
import { db } from '../lib/firebase';
import * as Firestore from 'firebase/firestore';

// Destructure from namespace import to avoid "no exported member" errors in strict environments
const { doc, updateDoc, deleteDoc, setDoc } = Firestore;

export interface GuestUsage {
  fengShuiCount: number;
  aiChatCount: number;
  speechCount: number;
}

interface AppState {
  user: UserProfile | null;
  settings: AppSettings;

  // Real Admin Data
  adminUsers: UserProfile[];
  adminStats: AdminAnalytics | null;

  notifications: Notification[];

  // App Data (Now in Store)
  guests: Guest[];
  budgetItems: BudgetItem[];
  procedures: Record<WeddingRegion, ProcedureStep[]>;
  invitation: InvitationData; // NEW: Invitation State
  isSyncing: boolean;

  // Feng Shui Data
  fengShuiProfile: CoupleProfile | null;
  fengShuiResults: {
    harmony: HarmonyResult | null;
    dates: AuspiciousDate[];
  };

  // User Management
  users: UserProfile[];

  // Guest Usage Tracking
  guestUsage: GuestUsage;

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

  // Invitation Actions
  updateInvitation: (data: Partial<InvitationData>) => void;

  // Advanced Actions
  recalculateDeadlines: (weddingDateStr: string) => void;
  resetData: () => void;
  importData: (data: any) => void;

  // Feng Shui Actions
  updateFengShuiProfile: (profile: CoupleProfile) => void;
  setFengShuiResults: (harmony: HarmonyResult | null, dates: AuspiciousDate[]) => void;

  // Usage Actions
  incrementGuestFengShui: () => void;
  incrementGuestAiChat: () => void;
  incrementGuestSpeech: () => void;
  resetGuestUsage: () => void;

  // Notification Actions
  addNotification: (type: NotificationType, message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
}

let syncTimeout: ReturnType<typeof setTimeout>;

const DEFAULT_INVITATION: InvitationData = {
  templateId: 'classic_1',
  groomName: '',
  brideName: '',
  date: '',
  time: '',
  location: '',
  address: '',
  mapLink: '',
  bankInfo: {
    bankId: '',
    accountNumber: '',
    accountName: '',
    template: 'qr_code'
  },
  wishes: 'Trân trọng kính mời bạn đến chung vui cùng gia đình chúng tôi.',
  galleryImages: [], // Initialize empty gallery
  inputFaces: { groom: null, bride: null },
  imageConfig: { scale: 1, x: 0, y: 0 },
  themeColor: '#e11d48'
};

const triggerCloudSync = (get: () => AppState) => {
  const { user, guests, budgetItems, fengShuiProfile, fengShuiResults, procedures, invitation } = get();
  if (user?.enableCloudStorage) {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      saveUserDataToCloud(user.uid, {
        guests,
        budgetItems,
        procedures,
        invitation,
        fengShuiProfile: fengShuiProfile || undefined,
        fengShuiResults: fengShuiResults || undefined
      });
    }, 2000); // Debounce 2s
  }
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
      invitation: DEFAULT_INVITATION,
      isSyncing: false,
      fengShuiProfile: null,
      fengShuiResults: { harmony: null, dates: [] },
      notifications: [],
      users: INITIAL_USERS,
      guestUsage: { fengShuiCount: 0, aiChatCount: 0, speechCount: 0 },

      login: async (user) => {
        set({ user, isSyncing: true });
        get().addNotification('SUCCESS', `Chào mừng ${user.displayName} đã quay trở lại!`);
        await syncUserProfile(user);

        if (user.enableCloudStorage) {
          const cloudData = await loadUserDataFromCloud(user.uid);
          if (cloudData) {
            set({
              guests: cloudData.guests,
              budgetItems: cloudData.budgetItems,
              procedures: cloudData.procedures || WEDDING_PROCEDURES,
              invitation: cloudData.invitation || DEFAULT_INVITATION,
              fengShuiProfile: cloudData.fengShuiProfile || null,
              fengShuiResults: cloudData.fengShuiResults || { harmony: null, dates: [] },
              isSyncing: false
            });
            get().addNotification('INFO', 'Đã đồng bộ dữ liệu từ đám mây.');
            return;
          }
        }
        set({ isSyncing: false });
      },

      logout: () => {
        set({
          user: DEFAULT_GUEST_USER,
          guests: INITIAL_GUESTS,
          budgetItems: INITIAL_BUDGET_ITEMS,
          procedures: WEDDING_PROCEDURES,
          invitation: DEFAULT_INVITATION,
          fengShuiProfile: null,
          fengShuiResults: { harmony: null, dates: [] },
          guestUsage: { fengShuiCount: 0, aiChatCount: 0, speechCount: 0 }
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
        if (db) {
          try {
            const userRef = doc(db, "public_profiles", uid);
            await setDoc(userRef, data, { merge: true });
          } catch (e: any) {
            console.error("Update User Error (Firestore):", e);
            throw new Error("Lỗi cập nhật quyền trên Cloud: " + e.message);
          }
        }
        const currentUser = get().user;
        if (currentUser && currentUser.uid === uid) {
          set({ user: { ...currentUser, ...data } });
        }
        const updatedAdminUsers = get().adminUsers.map(u => u.uid === uid ? { ...u, ...data } : u);
        const updatedUsers = get().users.map(u => u.uid === uid ? { ...u, ...data } : u);
        set({ adminUsers: updatedAdminUsers, users: updatedUsers });
      },

      deleteUser: async (uid) => {
        if (db) {
          try {
            await deleteDoc(doc(db, "public_profiles", uid));
            await deleteDoc(doc(db, "userData", uid));
          } catch (e) { console.error(e); }
        }
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

      // Invitation Actions
      updateInvitation: (data) => {
        set((state) => ({ invitation: { ...state.invitation, ...data } }));
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
          invitation: DEFAULT_INVITATION,
          fengShuiProfile: null,
          fengShuiResults: { harmony: null, dates: [] }
        });
        get().addNotification('WARNING', 'Dữ liệu đã được đặt lại về mặc định.');
      },

      importData: (data: any) => {
        set({
          guests: data.guests || [],
          budgetItems: data.budgetItems || [],
          procedures: data.procedures || WEDDING_PROCEDURES,
          invitation: data.invitation || DEFAULT_INVITATION,
          fengShuiProfile: data.fengShuiProfile || null,
          fengShuiResults: data.fengShuiResults || { harmony: null, dates: [] }
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

      addNotification: (type, message, duration = 3000) => {
        const id = Date.now().toString();
        set((state) => ({ notifications: [...state.notifications, { id, type, message, duration }] }));
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
      name: 'wedplan-storage-v9', // Increment version
      partialize: (state) => ({
        settings: state.settings,
        user: state.user,
        guests: state.guests,
        budgetItems: state.budgetItems,
        procedures: state.procedures,
        invitation: state.invitation,
        fengShuiProfile: state.fengShuiProfile,
        fengShuiResults: state.fengShuiResults,
        users: state.users,
        guestUsage: state.guestUsage
      }),
    }
  )
);
