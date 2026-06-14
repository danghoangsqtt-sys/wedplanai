import { supabase, TABLES } from '../lib/supabase';
import { SharedPlan, UserProfile } from '../types';

// --- CODE GENERATOR (FIX H4: 6 chars instead of 4) ---

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I,O,0,1 to avoid confusion
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WED-${code}`;
}

// --- PARSE ROW ---

function rowToSharedPlan(row: any): SharedPlan {
  return {
    id: row.id,
    ownerUid: row.owner_uid,
    ownerEmail: row.owner_email || '',
    ownerName: row.owner_name || '',
    partnerUid: row.partner_uid || undefined,
    partnerEmail: row.partner_email || undefined,
    shareCode: row.share_code,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
  };
}

// --- CREATE INVITE ---

export async function createShareInvite(owner: UserProfile): Promise<SharedPlan> {
  // Check if owner already has an active/pending share
  const existing = await getSharedPlanAsOwner(owner.uid);
  if (existing && (existing.status === 'active' || existing.status === 'pending')) {
    return existing; // Return existing invite instead of creating duplicate
  }

  const shareCode = generateShareCode();

  const { data: row, error } = await supabase
    .from(TABLES.PLAN_SHARES)
    .insert({
      owner_uid: owner.uid,
      owner_email: owner.email || '',
      owner_name: owner.displayName || '',
      share_code: shareCode,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToSharedPlan(row);
}

// --- JOIN PLAN ---

const SHARE_CODE_PATTERN = /^WED-[A-Z2-9]{4,6}$/;

export async function joinPlanByCode(
  code: string,
  partner: UserProfile
): Promise<SharedPlan> {
  const normalizedCode = code.trim().toUpperCase();

  if (!SHARE_CODE_PATTERN.test(normalizedCode)) {
    throw new Error('Mã mời không hợp lệ. Định dạng đúng: WED-XXXXXX (4-6 ký tự chữ/số).');
  }

  // Find the plan share document by code
  const { data: rows, error } = await supabase
    .from(TABLES.PLAN_SHARES)
    .select('*')
    .eq('share_code', normalizedCode);

  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) {
    throw new Error('Mã mời không tồn tại. Vui lòng kiểm tra lại.');
  }

  const doc = rows[0];

  if (doc.status === 'revoked') {
    throw new Error('Mã mời này đã bị hủy bởi chủ kế hoạch.');
  }

  if (doc.status === 'active' && doc.partner_uid && doc.partner_uid !== partner.uid) {
    throw new Error('Kế hoạch này đã có người tham gia.');
  }

  if (doc.owner_uid === partner.uid) {
    throw new Error('Bạn không thể tham gia kế hoạch của chính mình.');
  }

  // Update the document to add partner
  const { data: updated, error: updateErr } = await supabase
    .from(TABLES.PLAN_SHARES)
    .update({
      partner_uid: partner.uid,
      partner_email: partner.email || '',
      status: 'active',
    })
    .eq('id', doc.id)
    .select()
    .single();

  if (updateErr) throw new Error(updateErr.message);

  return rowToSharedPlan(updated);
}

// --- QUERY PLANS ---

export async function getSharedPlanAsOwner(uid: string): Promise<SharedPlan | null> {
  try {
    const { data: rows, error } = await supabase
      .from(TABLES.PLAN_SHARES)
      .select('*')
      .eq('owner_uid', uid)
      .neq('status', 'revoked')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return rows && rows.length > 0 ? rowToSharedPlan(rows[0]) : null;
  } catch (err) {
    console.warn('getSharedPlanAsOwner error:', err);
    return null;
  }
}

export async function getSharedPlanAsPartner(uid: string): Promise<SharedPlan | null> {
  try {
    const { data: rows, error } = await supabase
      .from(TABLES.PLAN_SHARES)
      .select('*')
      .eq('partner_uid', uid)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    return rows && rows.length > 0 ? rowToSharedPlan(rows[0]) : null;
  } catch (err) {
    console.warn('getSharedPlanAsPartner error:', err);
    return null;
  }
}

/** Get the shared plan for this user (either as owner or partner) */
export async function getMySharedPlan(uid: string): Promise<{ plan: SharedPlan; role: 'owner' | 'partner' } | null> {
  // Check as owner first
  const asOwner = await getSharedPlanAsOwner(uid);
  if (asOwner) return { plan: asOwner, role: 'owner' };

  // Then as partner
  const asPartner = await getSharedPlanAsPartner(uid);
  if (asPartner) return { plan: asPartner, role: 'partner' };

  return null;
}

// --- REVOKE / LEAVE ---

export async function revokeShare(planId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.PLAN_SHARES)
    .update({ status: 'revoked' })
    .eq('id', planId);

  if (error) throw new Error(error.message);
}

export async function leavePlan(planId: string, _partnerUid: string, _ownerUid: string): Promise<void> {
  // Remove partner from plan
  const { error } = await supabase
    .from(TABLES.PLAN_SHARES)
    .update({
      partner_uid: null,
      partner_email: '',
      status: 'pending', // Reset to pending so owner can re-invite
    })
    .eq('id', planId);

  if (error) throw new Error(error.message);
  // Note: RLS handles data access — no need to manually update permissions
}
