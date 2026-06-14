import { supabase, TABLES } from '../lib/supabase';
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
  weddingDate?: string | null;
  lastUpdated: number;
}

// --- UTILS ---

export const getPublicIP = async (): Promise<string | null> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch (err) {
    console.warn('getPublicIP failed:', err);
    return null;
  }
};

// --- CORE DATA SYNC ---

export const saveUserDataToCloud = async (
  uid: string,
  data: Omit<UserCloudData, 'lastUpdated'>
) => {
  try {
    // Ensure profile row exists (FK: user_data.id → profiles.id)
    await supabase
      .from(TABLES.PROFILES)
      .upsert(
        { id: uid, last_seen: new Date().toISOString() },
        { onConflict: 'id', ignoreDuplicates: true }
      );

    const payload = {
      id: uid,
      guests: data.guests,
      budget_items: data.budgetItems,
      procedures: data.procedures ?? {},
      fengshui_profile: data.fengShuiProfile ?? null,
      fengshui_results: data.fengShuiResults ?? { harmony: null, dates: [] },
      invitation: data.invitation ?? null,
      wedding_date: data.weddingDate ?? null,
      last_updated: new Date().toISOString(),
    };

    const { error } = await supabase
      .from(TABLES.USER_DATA)
      .upsert(payload, { onConflict: 'id' });

    if (error) throw error;

    // Also sync public invitation if present
    if (data.invitation) {
      const { error: invError } = await supabase
        .from(TABLES.PUBLIC_INVITATIONS)
        .upsert({
          uid,
          invitation_json: data.invitation,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'uid' });

      if (invError) console.warn('Error syncing public invitation:', invError);
    }

    updateLastActive(uid);
  } catch (error) {
    console.error('Error saving to cloud:', error);
  }
};

export const loadUserDataFromCloud = async (uid: string): Promise<UserCloudData | null> => {
  try {
    const { data: doc, error } = await supabase
      .from(TABLES.USER_DATA)
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) {
      console.error('Error loading from cloud:', error);
      return null;
    }
    if (!doc) return null;

    return {
      guests: doc.guests ?? [],
      budgetItems: doc.budget_items ?? [],
      procedures: doc.procedures ?? undefined,
      fengShuiProfile: doc.fengshui_profile ?? undefined,
      fengShuiResults: doc.fengshui_results ?? undefined,
      invitation: doc.invitation ?? undefined,
      weddingDate: doc.wedding_date ?? null,
      lastUpdated: new Date(doc.last_updated).getTime(),
    };
  } catch (e) {
    console.error('Error loading from cloud:', e);
    return null;
  }
};

// --- INVITATION RESPONSES (RSVP + GUESTBOOK) ---
// Requires Supabase table `invitation_responses` (see docs/brainstorm/session-2026-06-15-invitation-upgrade.md).
// All functions degrade gracefully: if the table/RLS is not set up yet, they catch and return safe defaults
// (never crash the public invitation page).

export interface InvitationResponse {
  id: string;
  uid: string;
  kind: 'rsvp' | 'wish';
  name: string;
  phone?: string | null;
  attending?: string | null;   // 'yes' | 'no' (rsvp only)
  guestCount?: number | null;  // rsvp only
  message?: string | null;     // rsvp note / wish content
  createdAt: string;
}

const mapResponseRow = (row: any): InvitationResponse => ({
  id: row.id,
  uid: row.uid,
  kind: row.kind,
  name: row.name,
  phone: row.phone ?? null,
  attending: row.attending ?? null,
  guestCount: row.guest_count ?? null,
  message: row.message ?? null,
  createdAt: row.created_at,
});

export const submitRSVP = async (
  uid: string,
  payload: { name: string; phone?: string; attending: string; guestCount?: number | null; message?: string }
): Promise<boolean> => {
  try {
    const { error } = await supabase.from(TABLES.INVITATION_RESPONSES).insert({
      uid,
      kind: 'rsvp',
      name: payload.name,
      phone: payload.phone ?? null,
      attending: payload.attending ?? null,
      guest_count: payload.guestCount ?? null,
      message: payload.message ?? null,
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('submitRSVP failed (table may not be migrated yet):', e);
    return false;
  }
};

export const submitWish = async (
  uid: string,
  wish: { name: string; message: string }
): Promise<boolean> => {
  try {
    const { error } = await supabase.from(TABLES.INVITATION_RESPONSES).insert({
      uid,
      kind: 'wish',
      name: wish.name,
      message: wish.message,
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('submitWish failed (table may not be migrated yet):', e);
    return false;
  }
};

export const loadInvitationResponses = async (
  uid: string
): Promise<{ rsvps: InvitationResponse[]; wishes: InvitationResponse[] }> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.INVITATION_RESPONSES)
      .select('*')
      .eq('uid', uid)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = (data ?? []).map(mapResponseRow);
    return {
      rsvps: rows.filter(r => r.kind === 'rsvp'),
      wishes: rows.filter(r => r.kind === 'wish'),
    };
  } catch (e) {
    console.warn('loadInvitationResponses failed (table may not be migrated yet):', e);
    return { rsvps: [], wishes: [] };
  }
};

export const loadPublicInvitation = async (uid: string): Promise<InvitationData | null> => {
  try {
    const { data: doc, error } = await supabase
      .from(TABLES.PUBLIC_INVITATIONS)
      .select('invitation_json')
      .eq('uid', uid)
      .maybeSingle();

    if (error) {
      console.error('Error loading public invitation:', error);
      return null;
    }
    if (!doc) return null;

    return (doc.invitation_json as InvitationData) ?? null;
  } catch (e) {
    console.error('Error loading public invitation:', e);
    return null;
  }
};

// --- STORAGE SYNC ---
export const uploadInvitationImage = async (file: File, uid: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    // Validate extension
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt || '')) {
        throw new Error('Định dạng ảnh không hợp lệ (chỉ hỗ trợ jpg, png, webp, gif)');
    }
    const fileName = `${uid}_${Date.now()}.${fileExt}`;
    const filePath = `${uid}/${fileName}`;

    const { error } = await supabase.storage
      .from('invitation_assets')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (error) throw error;

    const { data } = supabase.storage
      .from('invitation_assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

// --- PROFILE SYNC ---

export const syncUserProfile = async (user: UserProfile) => {
  try {
    const { error } = await supabase
      .from(TABLES.PROFILES)
      .upsert({
        id: user.uid,
        email: user.email,
        display_name: user.displayName,
        photo_url: user.photoURL || '',
        role: user.role,
        is_active: user.isActive,
        ...(user.joinedAt ? { joined_at: user.joinedAt } : {}),
        last_seen: new Date().toISOString(),
        enable_cloud_storage: user.enableCloudStorage,
        allow_custom_api_key: user.allowCustomApiKey,
      }, { onConflict: 'id' });

    if (error) throw error;
  } catch (error) {
    console.error('Error syncing profile:', error);
  }
};

export const getUserPublicProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const { data: doc, error } = await supabase
      .from(TABLES.PROFILES)
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) {
      console.error('Error fetching public profile:', error);
      return null;
    }
    if (!doc) return null;

    return {
      uid: doc.id,
      email: doc.email,
      displayName: doc.display_name,
      photoURL: doc.photo_url,
      role: doc.role,
      isActive: doc.is_active,
      joinedAt: doc.joined_at,
      enableCloudStorage: doc.enable_cloud_storage,
      allowCustomApiKey: doc.allow_custom_api_key,
    } as UserProfile;
  } catch (e) {
    console.error('Error fetching public profile:', e);
    return null;
  }
};

const updateLastActive = async (uid: string) => {
  try {
    await supabase
      .from(TABLES.PROFILES)
      .update({ last_seen: new Date().toISOString() })
      .eq('id', uid);
  } catch (err) { console.warn('updateLastSeen silent fail:', err); }
};

// --- ANALYTICS ---

export const logAppVisit = async (uid?: string) => {
  try {
    const sessionKey = `last_visit_${new Date().toDateString()}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const ip = await getPublicIP();
    const { error } = await supabase
      .from(TABLES.ANALYTICS_LOGS)
      .insert({
        timestamp: Date.now(),
        uid: uid || 'guest',
        page: window.location.pathname,
        user_agent: navigator.userAgent.slice(0, 500),
        ip: ip || 'unknown',
        referrer: (document.referrer || 'direct').slice(0, 500),
      });

    if (error) throw error;
    sessionStorage.setItem(sessionKey, 'true');
  } catch (error) {
    console.warn('Analytics error:', error);
  }
};

// --- GUEST IP LIMITS ---

type FeatureKey = 'feng_shui_count' | 'ai_chat_count' | 'speech_count'
  | 'fengShuiCount' | 'aiChatCount' | 'speechCount';

const normalizeFeature = (f: FeatureKey): 'feng_shui_count' | 'ai_chat_count' | 'speech_count' => {
  const map: Record<string, 'feng_shui_count' | 'ai_chat_count' | 'speech_count'> = {
    fengShuiCount: 'feng_shui_count',
    aiChatCount: 'ai_chat_count',
    speechCount: 'speech_count',
    feng_shui_count: 'feng_shui_count',
    ai_chat_count: 'ai_chat_count',
    speech_count: 'speech_count',
  };
  return map[f] || 'ai_chat_count';
};

export const checkGuestIPLimit = async (
  feature: FeatureKey,
  maxLimit: number
): Promise<boolean> => {
  try {
    const col = normalizeFeature(feature);
    const ip = await getPublicIP();
    if (!ip) return false;
    const ipId = ip.replace(/\./g, '_');

    const { data: doc, error } = await supabase
      .from(TABLES.GUEST_USAGE)
      .select(col)
      .eq('ip_id', ipId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false; // Not found
      return false;
    }

    return (doc[col] || 0) >= maxLimit;
  } catch (err) {
    console.warn('checkGuestIPUsage error:', err);
    return false;
  }
};

export const incrementGuestIPUsage = async (
  feature: FeatureKey
): Promise<void> => {
  try {
    const col = normalizeFeature(feature);
    const ip = await getPublicIP();
    if (!ip) return;
    const ipId = ip.replace(/\./g, '_');

    // Try to fetch existing
    const { data: doc, error: fetchErr } = await supabase
      .from(TABLES.GUEST_USAGE)
      .select('*')
      .eq('ip_id', ipId)
      .single();

    if (fetchErr && fetchErr.code === 'PGRST116') {
      // Not found — create new
      await supabase
        .from(TABLES.GUEST_USAGE)
        .insert({
          ip_id: ipId,
          ip,
          feng_shui_count: col === 'feng_shui_count' ? 1 : 0,
          ai_chat_count: col === 'ai_chat_count' ? 1 : 0,
          speech_count: col === 'speech_count' ? 1 : 0,
          last_updated: new Date().toISOString(),
        });
    } else if (doc) {
      // Existing — increment
      await supabase
        .from(TABLES.GUEST_USAGE)
        .update({
          [col]: (doc[col] || 0) + 1,
          last_updated: new Date().toISOString(),
        })
        .eq('ip_id', ipId);
    }
  } catch (error) {
    console.warn('Increment IP Usage failed:', error);
  }
};

