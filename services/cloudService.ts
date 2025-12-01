
import * as Firestore from "firebase/firestore";
import { db } from "../lib/firebase";
import { Guest, BudgetItem, UserProfile, ProcedureStep, WeddingRegion } from "../types";
import { CoupleProfile, HarmonyResult, AuspiciousDate } from "../types/fengshui";

const { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, limit, orderBy, increment } = Firestore;

export interface UserCloudData {
  guests: Guest[];
  budgetItems: BudgetItem[];
  procedures?: Record<WeddingRegion, ProcedureStep[]>; // Added procedures
  fengShuiProfile?: CoupleProfile;
  fengShuiResults?: {
    harmony: HarmonyResult | null;
    dates: AuspiciousDate[];
  };
  lastUpdated: number;
}

// --- UTILS ---

/**
 * Lấy địa chỉ IP Public của người dùng hiện tại
 */
export const getPublicIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn("Failed to get public IP:", error);
    return null; // Fail safe
  }
};

// --- CORE DATA SYNC ---

export const saveUserDataToCloud = async (uid: string, data: Omit<UserCloudData, 'lastUpdated'>) => {
  if (!db) return;

  try {
    const userDocRef = doc(db, "userData", uid);
    await setDoc(userDocRef, {
      ...data,
      lastUpdated: Date.now()
    }, { merge: true });
    // Also update the public profile's last activity
    updateLastActive(uid);
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.warn("Cloud Save skipped: Missing Firestore permissions.");
    } else {
      console.error("Error saving to cloud:", error);
    }
  }
};

export const loadUserDataFromCloud = async (uid: string): Promise<UserCloudData | null> => {
  if (!db) return null;

  try {
    const userDocRef = doc(db, "userData", uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserCloudData;
    } else {
      return null;
    }
  } catch (error: any) {
    if (error.code === 'permission-denied') {
      console.warn("Cloud Load skipped: Missing Firestore permissions.");
    } else {
      console.error("Error loading from cloud:", error);
    }
    return null;
  }
};

// --- ADMIN & ANALYTICS HELPERS ---

// 1. Sync User Profile to a "public_profiles" collection for Admin Listing
export const syncUserProfile = async (user: UserProfile) => {
  if (!db) return;
  try {
    const profileRef = doc(db, "public_profiles", user.uid);
    // Use merge: true to avoid overwriting existing fields like 'joinedAt' if not provided
    await setDoc(profileRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: user.role,
      isActive: user.isActive,
      // Only update these if they exist in the passed object, otherwise preserve
      ...(user.joinedAt ? { joinedAt: user.joinedAt } : {}),
      lastSeen: Date.now(),
      enableCloudStorage: user.enableCloudStorage,
      allowCustomApiKey: user.allowCustomApiKey
    }, { merge: true });
  } catch (error: any) {
    // Suppress permission errors in console to avoid red noise
    if (error.code !== 'permission-denied') {
      console.error("Error syncing profile:", error);
    }
  }
};

// NEW: Get a single user profile from Cloud (to check existence)
export const getUserPublicProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!db) return null;
  try {
    const docRef = doc(db, "public_profiles", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (e: any) {
    if (e.code !== 'permission-denied') {
      console.error("Error fetching public profile:", e);
    }
    return null;
  }
};

const updateLastActive = async (uid: string) => {
  if (!db) return;
  try {
    const profileRef = doc(db, "public_profiles", uid);
    await setDoc(profileRef, { lastSeen: Date.now() }, { merge: true });
  } catch (e) { /* silent fail */ }
};

// 2. Log Visit for Analytics (Updated with IP & Referrer)
export const logAppVisit = async (uid?: string) => {
  if (!db) return;
  try {
    // Check if we logged a visit recently (session based - e.g., 1 hour) to avoid spam
    const sessionKey = `last_visit_${new Date().toDateString()}`;
    const hasLoggedToday = sessionStorage.getItem(sessionKey);

    if (!hasLoggedToday) {
      const ip = await getPublicIP(); // Fetch IP
      const referrer = document.referrer || 'direct'; // Get referrer

      const analyticsRef = collection(db, "analytics_logs");
      await addDoc(analyticsRef, {
        timestamp: Date.now(),
        uid: uid || 'guest',
        page: window.location.pathname,
        userAgent: navigator.userAgent,
        ip: ip || 'unknown',
        referrer: referrer
      });
      sessionStorage.setItem(sessionKey, 'true');
    }
  } catch (error: any) {
    // Suppress permission errors (common if rules not set)
    if (error.code === 'permission-denied') {
      console.warn("Analytics: Firestore permissions missing. Visit not logged.");
    } else {
      console.error("Analytics error:", error);
    }
  }
};

// --- GUEST LIMIT MANAGEMENT BY IP (Cloud-based) ---

/**
 * Kiểm tra xem IP hiện tại đã vượt quá giới hạn sử dụng tính năng chưa.
 * @param feature Tên tính năng ('fengshui', 'ai_chat', 'speech')
 * @param maxLimit Số lần tối đa cho phép
 * @returns true nếu ĐÃ VƯỢT QUÁ giới hạn
 */
export const checkGuestIPLimit = async (
  feature: 'fengShuiCount' | 'aiChatCount' | 'speechCount',
  maxLimit: number
): Promise<boolean> => {
  if (!db) return false; // Không có DB thì thả cửa (hoặc chặn tùy logic, ở đây chọn thả để không lỗi app)

  try {
    const ip = await getPublicIP();
    if (!ip) return false; // Không lấy được IP thì tạm thời cho qua

    const docRef = doc(db, "guest_usage", ip);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const currentCount = data[feature] || 0;
      return currentCount >= maxLimit;
    }

    return false; // Chưa có record -> chưa vượt
  } catch (error) {
    console.warn("Check IP Limit failed:", error);
    return false;
  }
};

/**
 * Tăng biến đếm sử dụng cho IP hiện tại trên Firestore.
 * @param feature Tên tính năng cần tăng
 */
export const incrementGuestIPUsage = async (
  feature: 'fengShuiCount' | 'aiChatCount' | 'speechCount'
): Promise<void> => {
  if (!db) return;

  try {
    const ip = await getPublicIP();
    if (!ip) return;

    const docRef = doc(db, "guest_usage", ip);

    // Dùng setDoc với merge: true và increment(1) để atomic update
    await setDoc(docRef, {
      [feature]: increment(1),
      lastUpdated: Date.now(),
      ip: ip // Lưu lại IP string để dễ query nếu cần
    }, { merge: true });

  } catch (error) {
    console.warn("Increment IP Usage failed:", error);
  }
};
