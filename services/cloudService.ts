
import * as Firestore from "firebase/firestore";
import { db } from "../lib/firebase";
import { Guest, BudgetItem, UserProfile } from "../types";
import { CoupleProfile, HarmonyResult, AuspiciousDate } from "../types/fengshui";

const { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, limit, orderBy } = Firestore;

export interface UserCloudData {
  guests: Guest[];
  budgetItems: BudgetItem[];
  fengShuiProfile?: CoupleProfile;
  fengShuiResults?: {
    harmony: HarmonyResult | null;
    dates: AuspiciousDate[];
  };
  lastUpdated: number;
}

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

// 2. Log Visit for Analytics
export const logAppVisit = async (uid?: string) => {
  if (!db) return;
  try {
    // Check if we logged a visit recently (session based - e.g., 1 hour) to avoid spam
    const sessionKey = `last_visit_${new Date().toDateString()}`;
    const hasLoggedToday = sessionStorage.getItem(sessionKey);

    if (!hasLoggedToday) {
      const analyticsRef = collection(db, "analytics_logs");
      await addDoc(analyticsRef, {
        timestamp: Date.now(),
        uid: uid || 'guest',
        page: window.location.pathname,
        userAgent: navigator.userAgent
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