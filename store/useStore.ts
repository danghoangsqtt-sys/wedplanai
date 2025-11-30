
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, AppSettings, Guest, BudgetItem, TaskStatus, Notification, NotificationType } from '../types';
import { CoupleProfile, HarmonyResult, AuspiciousDate } from '../types/fengshui';
import { saveUserDataToCloud, loadUserDataFromCloud, syncUserProfile, getUserPublicProfile } from '../services/cloudService';
import { fetchAllProfiles, fetchAnalyticsData, AdminAnalytics } from '../services/adminService';
import { INITIAL_GUESTS, INITIAL_BUDGET_ITEMS, DEFAULT_GUEST_USER, INITIAL_USERS } from '../data/initialData';
import { db } from '../lib/firebase';
import { doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';

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
  isSyncing: boolean;
  
  // Feng Shui Data
  fengShuiProfile: CoupleProfile | null;
  fengShuiResults: {
    harmony: HarmonyResult | null;
    dates: AuspiciousDate[];
  };

  // User Management
  users: UserProfile[];

  // Actions
  login: (user: UserProfile) => Promise<void>;
  logout: () => void;
  setOpenAiKey: (key: string) => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
  // Admin Actions
  fetchAdminData: () => Promise<void>;
  addUser: (user: UserProfile) => Promise<void>;
  updateUser: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  deleteUser: (uid: string) => Promise<void>;
  refreshUserProfile: () => Promise<void>; // NEW: Sync status from cloud

  // Data Actions
  addGuest: (guest: Guest) => void;
  removeGuest: (id: string) => void;
  updateGuest: (guest: Guest) => void; 
  
  addBudgetItem: (item: BudgetItem) => void;
  updateBudgetItem: (id: string, field: keyof BudgetItem, value: any) => void;
  deleteBudgetItem: (id: string) => void;
  setBudgetItems: (items: BudgetItem[]) => void; 
  
  // Advanced Actions
  recalculateDeadlines: (weddingDateStr: string) => void;
  resetData: () => void;
  importData: (data: any) => void;

  // Feng Shui Actions
  updateFengShuiProfile: (profile: CoupleProfile) => void;
  setFengShuiResults: (harmony: HarmonyResult | null, dates: AuspiciousDate[]) => void;

  // Notification Actions
  addNotification: (type: NotificationType, message: string, duration?: number) => void;
  removeNotification: (id: string) => void;
}

let syncTimeout: ReturnType<typeof setTimeout>;

const triggerCloudSync = (get: () => AppState) => {
  const { user, guests, budgetItems, fengShuiProfile, fengShuiResults } = get();
  if (user?.enableCloudStorage) {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      saveUserDataToCloud(user.uid, { 
        guests, 
        budgetItems,
        fengShuiProfile: fengShuiProfile || undefined,
        fengShuiResults: fengShuiResults || undefined
      });
    }, 2000); // Debounce 2s
  }
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initialize with DEFAULT_GUEST_USER if no user exists in storage
      user: DEFAULT_GUEST_USER,
      settings: { 
        openaiApiKey: '',
        currency: 'VND',
        themeMode: 'light',
        enableNotifications: true
      },
      adminUsers: [],
      adminStats: null,
      guests: INITIAL_GUESTS,
      budgetItems: INITIAL_BUDGET_ITEMS,
      isSyncing: false,
      fengShuiProfile: null,
      fengShuiResults: { harmony: null, dates: [] },
      notifications: [],
      users: INITIAL_USERS,

      login: async (user) => {
        set({ user, isSyncing: true });
        
        get().addNotification('SUCCESS', `Chào mừng ${user.displayName} đã quay trở lại!`);

        // 1. Sync public profile for Admin visibility
        await syncUserProfile(user);

        // 2. Load data from Cloud if enabled
        if (user.enableCloudStorage) {
          const cloudData = await loadUserDataFromCloud(user.uid);
          if (cloudData) {
            set({ 
              guests: cloudData.guests, 
              budgetItems: cloudData.budgetItems,
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
           fengShuiProfile: null, 
           fengShuiResults: { harmony: null, dates: [] } 
        });
        get().addNotification('INFO', 'Đã đăng xuất thành công.');
      },
      
      setOpenAiKey: (key) => set((state) => ({ settings: { ...state.settings, openaiApiKey: key } })),
      
      updateSettings: (newSettings) => set((state) => ({ settings: { ...state.settings, ...newSettings } })),

      // --- Real Admin Actions ---
      fetchAdminData: async () => {
        const users = await fetchAllProfiles();
        const stats = await fetchAnalyticsData();
        set({ adminUsers: users, adminStats: stats });
      },

      addUser: async (newUser) => {
         // In real app, create via Admin SDK. Here we just add to public_profiles
         await syncUserProfile(newUser);
         // Refresh list
         const users = await fetchAllProfiles();
         set((state) => ({ 
           adminUsers: users,
           users: [...state.users, newUser]
         }));
         get().addNotification('SUCCESS', 'Đã thêm người dùng mới.');
      },
      
      updateUser: async (uid, data) => {
        // 1. Update Firestore FIRST. If this fails, throw error so UI knows.
        if (db) {
            try {
                const userRef = doc(db, "public_profiles", uid);
                // Use setDoc with merge: true. 
                // This is safer than updateDoc because it creates the document if it doesn't exist (e.g. initial sync failed).
                await setDoc(userRef, data, { merge: true });
            } catch (e: any) { 
                console.error("Update User Error (Firestore):", e);
                // Re-throw to allow component to handle alert
                throw new Error("Lỗi cập nhật quyền trên Cloud: " + e.message); 
            }
        }

        // 2. Optimistic update for local state (Only if Firestore didn't throw)
        const currentUser = get().user;
        if (currentUser && currentUser.uid === uid) {
           set({ user: { ...currentUser, ...data } });
        }

        // Refresh list in state
        const updatedAdminUsers = get().adminUsers.map(u => u.uid === uid ? { ...u, ...data } : u);
        const updatedUsers = get().users.map(u => u.uid === uid ? { ...u, ...data } : u);
        set({ adminUsers: updatedAdminUsers, users: updatedUsers });
      },
      
      deleteUser: async (uid) => {
        if (db) {
            try {
                await deleteDoc(doc(db, "public_profiles", uid));
                await deleteDoc(doc(db, "userData", uid)); // Delete actual data
            } catch(e) { console.error(e); }
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
                // Update local status with cloud status
                set((state) => ({
                    user: {
                        ...state.user!, // Keep existing local fields
                        isActive: cloudProfile.isActive, // Sync these important fields
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

      // --- Data Actions with Sync Trigger ---

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
             
             return {
                 ...item,
                 deadline: deadlineDate.toISOString().split('T')[0]
             };
          });
          
          return { budgetItems: newItems };
        });
        
        get().addNotification('SUCCESS', 'Đã cập nhật lại hạn chót công việc.');
        triggerCloudSync(get);
      },

      // --- Advanced Actions ---
      resetData: () => {
         set({
            guests: INITIAL_GUESTS,
            budgetItems: INITIAL_BUDGET_ITEMS,
            fengShuiProfile: null,
            fengShuiResults: { harmony: null, dates: [] }
         });
         get().addNotification('WARNING', 'Dữ liệu đã được đặt lại về mặc định.');
      },
      
      importData: (data: any) => {
         set({
            guests: data.guests || [],
            budgetItems: data.budgetItems || [],
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

      // --- Notification Implementation ---
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
      name: 'wedplan-storage-v6',
      partialize: (state) => ({ 
        settings: state.settings,
        user: state.user,
        guests: state.guests, 
        budgetItems: state.budgetItems,
        fengShuiProfile: state.fengShuiProfile,
        fengShuiResults: state.fengShuiResults,
        users: state.users
      }),
    }
  )
);
