import { isMilestoneTaskStore } from '../lib/milestoneTasks';
import { supabase, TABLES } from '../lib/supabase';
import { Guest, BudgetItem, UserProfile, ProcedureStep, WeddingRegion, InvitationData } from '../types';
import { CoupleProfile, HarmonyResult, AuspiciousDate } from '../types/fengshui';
import { cloudLog, uploadLog } from '../lib/logger';
import { isValidUid } from '../lib/sanitize';
import { newUuid } from '../lib/ids';

export interface UserCloudData {
  guests: Guest[];
  budgetItems: BudgetItem[];
  procedures?: Record<WeddingRegion, ProcedureStep[]>;
  milestoneTasks?: import('../types').MilestoneTaskStore;
  fengShuiProfile?: CoupleProfile;
  fengShuiResults?: {
    harmony: HarmonyResult | null;
    dates: AuspiciousDate[];
  };
  invitation?: InvitationData;
  weddingDate?: string | null;
  lastUpdated: number;
  revision: string | null;
}

// --- UTILS ---

export const getPublicIP = async (): Promise<string | null> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch (err) {
    cloudLog.warn('getPublicIP failed', err);
    return null;
  }
};

// --- CORE DATA SYNC ---

export const saveUserDataToCloud = async (
  uid: string,
  data: Omit<UserCloudData, 'lastUpdated' | 'revision'>,
  expectedRevision: string | null = null,
): Promise<string> => {
  if (!isValidUid(uid) || !Array.isArray(data.guests) || !Array.isArray(data.budgetItems)) {
    throw new Error('Invalid plan data');
  }
  // The database commits private data and its public invitation in one transaction.
  const { data: revision, error } = await supabase.rpc('save_plan', {
    plan_uid: uid, plan_data: data, expected_updated_at: expectedRevision,
  });
  if (error) { cloudLog.error('save failed', error); throw error; }
  if (typeof revision !== 'string') throw new Error('Missing cloud acknowledgement');
  return revision;
};

export const loadUserDataFromCloud = async (uid: string): Promise<UserCloudData | null> => {
  if (!isValidUid(uid)) throw new Error('Invalid plan identifier');
  const { data: doc, error } = await supabase.from(TABLES.USER_DATA)
    .select('id,guests,budget_items,procedures,milestone_tasks,fengshui_profile,fengshui_results,invitation,wedding_date,last_updated')
    .eq('id', uid).maybeSingle();
  // null means a successful empty read only. A failed read must lock cloud writes.
  if (error) { cloudLog.error('load failed', error); throw error; }
  if (!doc) return null;
  if (!Array.isArray(doc.guests) || !Array.isArray(doc.budget_items)) throw new Error('Invalid cloud data');
  if (doc.milestone_tasks != null && !isMilestoneTaskStore(doc.milestone_tasks)) throw new Error('Invalid cloud milestones');
  return {
    guests: doc.guests, budgetItems: doc.budget_items,
    procedures: doc.procedures ?? undefined,
    milestoneTasks: doc.milestone_tasks ?? undefined,
    fengShuiProfile: doc.fengshui_profile ?? undefined,
    fengShuiResults: doc.fengshui_results ?? undefined,
    invitation: doc.invitation ?? undefined,
    weddingDate: doc.wedding_date ?? null,
    lastUpdated: new Date(doc.last_updated).getTime(),
    revision: doc.last_updated ?? null,
  };
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
  selectedEventIds?: string[];
  email?: string | null;
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
  selectedEventIds: row.selected_event_ids ?? [],
  email: row.email ?? null,
});

export const submitRSVP = async (
  uid: string,
  payload: { id?:string; name: string; phone?: string; attending: string; guestCount?: number | null; message?: string; selectedEventIds?: string[] }
): Promise<boolean> => {
  if (!isValidUid(uid) || !payload.name?.trim()) return false;
  try {
    const { data: accepted, error } = await supabase.rpc('submit_invitation_response', { response: {
      id: payload.id || newUuid(),
      uid,
      kind: 'rsvp',
      name: payload.name,
      phone: payload.phone ?? null,
      attending: payload.attending ?? null,
      guest_count: payload.guestCount ?? null,
      message: payload.message ?? null,
      selected_event_ids: payload.selectedEventIds ?? null,
    }});
    if (error) throw error;
    return accepted === true;
  } catch (e) {
    cloudLog.warn('submitRSVP failed (table may not be migrated yet)', e);
    return false;
  }
};

export const submitWish = async (
  uid: string,
  wish: { id?:string; name: string; message: string; email?:string }
): Promise<boolean> => {
  if (!isValidUid(uid) || !wish.name?.trim() || !wish.message?.trim()) return false;
  try {
    const { data: accepted, error } = await supabase.rpc('submit_invitation_response', { response: {
      id: wish.id || newUuid(),
      uid,
      kind: 'wish',
      name: wish.name,
      message: wish.message,
      email: wish.email || null,
    }});
    if (error) throw error;
    return accepted === true;
  } catch (e) {
    cloudLog.warn('submitWish failed (table may not be migrated yet)', e);
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
    cloudLog.warn('loadInvitationResponses failed (table may not be migrated yet)', e);
    throw e;
  }
};

export const loadPublicWishes = async (uid:string):Promise<InvitationResponse[]> => {
  if(!isValidUid(uid)) return [];
  const {data,error}=await supabase.rpc('get_public_wishes',{plan_uid:uid});
  if(error) throw error;
  return (data||[]).map(row=>mapResponseRow({...row,uid,kind:'wish'}));
};

export const loadPublicInvitation = async (uid: string): Promise<InvitationData | null> => {
  if (!isValidUid(uid)) {
    cloudLog.warn('loadPublicInvitation: invalid uid format', { uid });
    return null;
  }
  try {
    const { data: doc, error } = await supabase
      .from(TABLES.PUBLIC_INVITATIONS)
      .select('invitation_json')
      .eq('uid', uid)
      .maybeSingle();

    if (error) {
      cloudLog.error('load public invitation failed', error);
      return null;
    }
    if (!doc) return null;

    return (doc.invitation_json as InvitationData) ?? null;
  } catch (e) {
    cloudLog.error('load public invitation failed', e);
    return null;
  }
};

// --- STORAGE SYNC ---
export const uploadInvitationImage = async (file: File, uid: string): Promise<string> => {
  uploadLog.info('start', { name: file.name, sizeMB: +(file.size / 1048576).toFixed(2), type: file.type });

  // Use MIME type for validation — more reliable than extension (handles HEIC, HEIF, compressed .jpg files etc.)
  if (!file.type.startsWith('image/')) {
    throw new Error(`Định dạng tệp không hợp lệ: "${file.type || file.name}". Chỉ chấp nhận tệp ảnh.`);
  }

  // Derive a safe extension from MIME type, falling back to original extension
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
    'image/gif': 'gif', 'image/avif': 'avif', 'image/heic': 'jpg',
    'image/heif': 'jpg',
  };
  const fileExt = mimeToExt[file.type] ?? (file.name.split('.').pop()?.toLowerCase() || 'jpg');
  const fileName = `${uid}_${Date.now()}.${fileExt}`;
  const filePath = `${uid}/${fileName}`;

  uploadLog.time('upload');
  const { error } = await supabase.storage
    .from('wedkho')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (error) {
    uploadLog.timeEnd('upload');
    uploadLog.error('failed', { name: file.name, error });
    throw error;
  }

  uploadLog.timeEnd('upload');
  const { data } = supabase.storage
    .from('wedkho')
    .getPublicUrl(filePath);

  const url = data.publicUrl;

  // Verify the URL is actually accessible (catches private bucket / RLS issues)
  try {
    const check = await fetch(url, { method: 'HEAD' });
    if (!check.ok) {
      uploadLog.warn('public URL not accessible, falling back to signed URL', { status: check.status, url });
      const { data: signed, error: signErr } = await supabase.storage
        .from('wedkho')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);
      if (signErr || !signed?.signedUrl) {
        uploadLog.error('signed URL fallback failed', signErr);
        throw new Error('Ảnh đã tải lên nhưng không thể tạo đường dẫn truy cập.');
      }
      uploadLog.info('using signed URL', { url: signed.signedUrl });
      return signed.signedUrl;
    }
  } catch (fetchErr) {
    // HEAD check failed (e.g. CORS) — try signed URL as fallback
    uploadLog.warn('HEAD check failed, trying signed URL', fetchErr);
    const { data: signed } = await supabase.storage
      .from('wedkho')
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);
    if (signed?.signedUrl) return signed.signedUrl;
  }

  uploadLog.info('success', { url });
  return url;
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
    cloudLog.error('sync profile failed', error);
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
      cloudLog.error('fetch public profile failed', error);
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
    cloudLog.error('fetch public profile failed', e);
    return null;
  }
};

const updateLastActive = async (uid: string) => {
  try {
    await supabase
      .from(TABLES.PROFILES)
      .update({ last_seen: new Date().toISOString() })
      .eq('id', uid);
  } catch (err) { cloudLog.warn('updateLastSeen failed', err); }
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
    cloudLog.warn('analytics event failed', error);
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

    // BUG-009 fix: use maybeSingle() to avoid PGRST116 error for new IP (not found → null, not error)
    const { data: doc, error } = await supabase
      .from(TABLES.GUEST_USAGE)
      .select(col)
      .eq('ip_id', ipId)
      .maybeSingle();

    if (error) {
      return false;
    }
    if (!doc) return false; // new IP → under limit

    return (doc[col] || 0) >= maxLimit;
  } catch (err) {
    cloudLog.warn('checkGuestIPUsage failed', err);
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
    cloudLog.warn('incrementIPUsage failed', error);
  }
};

