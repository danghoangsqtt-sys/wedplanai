import { databases, DB_ID, COLLECTIONS, ID, Permission, Role } from '../lib/appwrite';
import { Guest, BudgetItem, UserProfile, ProcedureStep, WeddingRegion, InvitationData } from '../types';
import { CoupleProfile, HarmonyResult, AuspiciousDate } from '../types/fengshui';

export interface UserCloudData {
  guests: Guest[];
  budgetItems: BudgetItem[];
  procedures?: Record<WeddingRegion, ProcedureStep[]>;
  fengShuiProfile?: CoupleProfile;
  fengShuiResults?: {
    harmony: HarmonyResult | null;
    dates: AuspiciousDate[];
  };
  invitation?: InvitationData;
  weddingDate?: string | null; // Owner's wedding date for shared plan partners
  lastUpdated: number;
}

// --- UTILS ---

export const getPublicIP = async (): Promise<string | null> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch {
    return null;
  }
};

// Upsert: try update first, create on 404
async function upsert(
  collectionId: string,
  docId: string,
  data: Record<string, any>,
  permissions?: string[]
) {
  try {
    await databases.updateDocument(DB_ID, collectionId, docId, data);
  } catch (e: any) {
    if (e.code === 404) {
      await databases.createDocument(DB_ID, collectionId, docId, data, permissions);
    } else {
      throw e;
    }
  }
}

// --- CORE DATA SYNC ---

export const saveUserDataToCloud = async (
  uid: string,
  data: Omit<UserCloudData, 'lastUpdated'>
) => {
  try {
    await upsert(
      COLLECTIONS.USER_DATA,
      uid,
      {
        userId: uid,
        guests_json: JSON.stringify(data.guests),
        budget_json: JSON.stringify(data.budgetItems),
        procedures_json: JSON.stringify(data.procedures ?? {}),
        fengshui_json: JSON.stringify(data.fengShuiProfile ?? null),
        results_json: JSON.stringify(data.fengShuiResults ?? { harmony: null, dates: [] }),
        invitation_json: JSON.stringify(data.invitation ?? {}),
        weddingDate: data.weddingDate || '',
        lastUpdated: Date.now(),
      },
      [
        Permission.read(Role.user(uid)),
        Permission.update(Role.user(uid)),
        Permission.delete(Role.user(uid)),
      ]
    );

    if (data.invitation) {
      await upsert(
        COLLECTIONS.PUBLIC_INVITATIONS,
        uid,
        { uid, invitation_json: JSON.stringify(data.invitation) },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(uid)),
          Permission.delete(Role.user(uid)),
        ]
      );
    }

    updateLastActive(uid);
  } catch (error) {
    console.error('Error saving to cloud:', error);
  }
};

function safeJsonParse<T>(json: string | undefined | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) ?? fallback;
  } catch {
    console.warn('Failed to parse JSON from cloud, using fallback:', json?.slice(0, 80));
    return fallback;
  }
}

export const loadUserDataFromCloud = async (uid: string): Promise<UserCloudData | null> => {
  try {
    const doc = await databases.getDocument(DB_ID, COLLECTIONS.USER_DATA, uid);
    return {
      guests: safeJsonParse(doc.guests_json, []),
      budgetItems: safeJsonParse(doc.budget_json, []),
      procedures: safeJsonParse(doc.procedures_json, undefined),
      fengShuiProfile: safeJsonParse(doc.fengshui_json, undefined),
      fengShuiResults: safeJsonParse(doc.results_json, undefined),
      invitation: safeJsonParse(doc.invitation_json, undefined),
      weddingDate: doc.weddingDate || null,
      lastUpdated: doc.lastUpdated,
    };
  } catch (e: any) {
    if (e.code !== 404) console.error('Error loading from cloud:', e);
    return null;
  }
};

export const loadPublicInvitation = async (uid: string): Promise<InvitationData | null> => {
  try {
    const doc = await databases.getDocument(DB_ID, COLLECTIONS.PUBLIC_INVITATIONS, uid);
    return JSON.parse(doc.invitation_json || 'null');
  } catch (e: any) {
    if (e.code !== 404) console.error('Error loading public invitation:', e);
    return null;
  }
};

// --- PROFILE SYNC ---

export const syncUserProfile = async (user: UserProfile) => {
  try {
    await upsert(
      COLLECTIONS.PUBLIC_PROFILES,
      user.uid,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL || '',
        role: user.role,
        isActive: user.isActive,
        ...(user.joinedAt ? { joinedAt: user.joinedAt } : {}),
        lastSeen: Date.now(),
        enableCloudStorage: user.enableCloudStorage,
        allowCustomApiKey: user.allowCustomApiKey,
      },
      [
        Permission.read(Role.any()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
  } catch (error) {
    console.error('Error syncing profile:', error);
  }
};

export const getUserPublicProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const doc = await databases.getDocument(DB_ID, COLLECTIONS.PUBLIC_PROFILES, uid);
    return {
      uid: doc.uid,
      email: doc.email,
      displayName: doc.displayName,
      photoURL: doc.photoURL,
      role: doc.role,
      isActive: doc.isActive,
      joinedAt: doc.joinedAt,
      enableCloudStorage: doc.enableCloudStorage,
      allowCustomApiKey: doc.allowCustomApiKey,
    } as UserProfile;
  } catch (e: any) {
    if (e.code !== 404) console.error('Error fetching public profile:', e);
    return null;
  }
};

const updateLastActive = async (uid: string) => {
  try {
    await databases.updateDocument(DB_ID, COLLECTIONS.PUBLIC_PROFILES, uid, {
      lastSeen: Date.now(),
    });
  } catch { /* silent */ }
};

// --- ANALYTICS ---

export const logAppVisit = async (uid?: string) => {
  try {
    const sessionKey = `last_visit_${new Date().toDateString()}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const ip = await getPublicIP();
    await databases.createDocument(
      DB_ID,
      COLLECTIONS.ANALYTICS_LOGS,
      ID.unique(),
      {
        timestamp: Date.now(),
        uid: uid || 'guest',
        page: window.location.pathname,
        userAgent: navigator.userAgent.slice(0, 500),
        ip: ip || 'unknown',
        referrer: (document.referrer || 'direct').slice(0, 500),
      },
      [Permission.read(Role.users()), Permission.delete(Role.users())]
    );
    sessionStorage.setItem(sessionKey, 'true');
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// --- GUEST IP LIMITS ---

export const checkGuestIPLimit = async (
  feature: 'fengShuiCount' | 'aiChatCount' | 'speechCount',
  maxLimit: number
): Promise<boolean> => {
  try {
    const ip = await getPublicIP();
    if (!ip) return false;
    const ipId = ip.replace(/\./g, '_');
    const doc = await databases.getDocument(DB_ID, COLLECTIONS.GUEST_USAGE, ipId);
    return (doc[feature] || 0) >= maxLimit;
  } catch (e: any) {
    if (e.code === 404) return false;
    return false;
  }
};

export const incrementGuestIPUsage = async (
  feature: 'fengShuiCount' | 'aiChatCount' | 'speechCount'
): Promise<void> => {
  try {
    const ip = await getPublicIP();
    if (!ip) return;
    const ipId = ip.replace(/\./g, '_');
    try {
      const doc = await databases.getDocument(DB_ID, COLLECTIONS.GUEST_USAGE, ipId);
      await databases.updateDocument(DB_ID, COLLECTIONS.GUEST_USAGE, ipId, {
        [feature]: (doc[feature] || 0) + 1,
        lastUpdated: Date.now(),
      });
    } catch (e: any) {
      if (e.code === 404) {
        await databases.createDocument(
          DB_ID,
          COLLECTIONS.GUEST_USAGE,
          ipId,
          {
            ip,
            fengShuiCount: feature === 'fengShuiCount' ? 1 : 0,
            aiChatCount: feature === 'aiChatCount' ? 1 : 0,
            speechCount: feature === 'speechCount' ? 1 : 0,
            lastUpdated: Date.now(),
          },
          [Permission.read(Role.any()), Permission.update(Role.any()), Permission.delete(Role.any())]
        );
      }
    }
  } catch (error) {
    console.warn('Increment IP Usage failed:', error);
  }
};
