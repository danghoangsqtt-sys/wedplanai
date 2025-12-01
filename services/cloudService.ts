
import * as Firestore from "firebase/firestore";
import { db } from "../lib/firebase";
import { Guest, BudgetItem, UserProfile, ProcedureStep, WeddingRegion, InvitationData } from "../types";
import { CoupleProfile, HarmonyResult, AuspiciousDate } from "../types/fengshui";

const { doc, setDoc, getDoc, collection, addDoc, query, where, getDocs, limit, orderBy, increment } = Firestore;

export interface UserCloudData {
  guests: Guest[];
  budgetItems: BudgetItem[];
  procedures?: Record<WeddingRegion, ProcedureStep[]>;
  invitation?: InvitationData; // NEW
  fengShuiProfile?: CoupleProfile;
  fengShuiResults?: {
    harmony: HarmonyResult | null;
    dates: AuspiciousDate[];
  };
  lastUpdated: number;
}

// --- UTILS ---

export const getPublicIP = async (): Promise<string | null> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn("Failed to get public IP:", error);
    return null;
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

// --- NEW: Load specific data for Public View (Invitation) ---
export const loadPublicInvitation = async (uid: string): Promise<InvitationData | null> => {
  if (!db) return null;
  try {
    const userDocRef = doc(db, "userData", uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as UserCloudData;
      return data.invitation || null;
    }
    return null;
  } catch (e) {
    console.error("Load Public Invitation Failed:", e);
    return null;
  }
};


// --- ADMIN & ANALYTICS HELPERS ---

export const syncUserProfile = async (user: UserProfile) => {
  if (!db) return;
  try {
    const profileRef = doc(db, "public_profiles", user.uid);
    await setDoc(profileRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: user.role,
      isActive: user.isActive,
      ...(user.joinedAt ? { joinedAt: user.joinedAt } : {}),
      lastSeen: Date.now(),
      enableCloudStorage: user.enableCloudStorage,
      allowCustomApiKey: user.allowCustomApiKey
    }, { merge: true });
  } catch (error: any) {
    if (error.code !== 'permission-denied') {
      console.error("Error syncing profile:", error);
    }
  }
};

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

export const logAppVisit = async (uid?: string) => {
  if (!db) return;
  try {
    const sessionKey = `last_visit_${new Date().toDateString()}`;
    const hasLoggedToday = sessionStorage.getItem(sessionKey);

    if (!hasLoggedToday) {
      const ip = await getPublicIP();
      const referrer = document.referrer || 'direct';

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
    if (error.code === 'permission-denied') {
      console.warn("Analytics: Firestore permissions missing. Visit not logged.");
    } else {
      console.error("Analytics error:", error);
    }
  }
};

export const checkGuestIPLimit = async (
  feature: 'fengShuiCount' | 'aiChatCount' | 'speechCount',
  maxLimit: number
): Promise<boolean> => {
  if (!db) return false;

  try {
    const ip = await getPublicIP();
    if (!ip) return false;

    const docRef = doc(db, "guest_usage", ip);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const currentCount = data[feature] || 0;
      return currentCount >= maxLimit;
    }

    return false;
  } catch (error) {
    console.warn("Check IP Limit failed:", error);
    return false;
  }
};

export const incrementGuestIPUsage = async (
  feature: 'fengShuiCount' | 'aiChatCount' | 'speechCount'
): Promise<void> => {
  if (!db) return;

  try {
    const ip = await getPublicIP();
    if (!ip) return;

    const docRef = doc(db, "guest_usage", ip);

    await setDoc(docRef, {
      [feature]: increment(1),
      lastUpdated: Date.now(),
      ip: ip
    }, { merge: true });

  } catch (error) {
    console.warn("Increment IP Usage failed:", error);
  }
};
