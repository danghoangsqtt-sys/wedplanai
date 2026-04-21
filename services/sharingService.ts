import { databases, DB_ID, COLLECTIONS, ID, Query, Permission, Role } from '../lib/appwrite';
import { SharedPlan, UserProfile } from '../types';

// --- CODE GENERATOR ---

function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I,O,0,1 to avoid confusion
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WED-${code}`;
}

// --- PARSE DOCUMENT ---

function docToSharedPlan(doc: any): SharedPlan {
  return {
    id: doc.$id,
    ownerUid: doc.ownerUid,
    ownerEmail: doc.ownerEmail,
    ownerName: doc.ownerName || '',
    partnerUid: doc.partnerUid || undefined,
    partnerEmail: doc.partnerEmail || undefined,
    shareCode: doc.shareCode,
    status: doc.status,
    createdAt: doc.createdAt,
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

  const doc = await databases.createDocument(
    DB_ID,
    COLLECTIONS.PLAN_SHARES,
    ID.unique(),
    {
      ownerUid: owner.uid,
      ownerEmail: owner.email || '',
      ownerName: owner.displayName || '',
      shareCode,
      status: 'pending',
      createdAt: Date.now(),
    },
    [
      Permission.read(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.user(owner.uid)),
    ]
  );

  return docToSharedPlan(doc);
}

// --- JOIN PLAN ---

export async function joinPlanByCode(
  code: string,
  partner: UserProfile
): Promise<SharedPlan> {
  const normalizedCode = code.trim().toUpperCase();

  // Find the plan share document by code
  const result = await databases.listDocuments(
    DB_ID,
    COLLECTIONS.PLAN_SHARES,
    [Query.equal('shareCode', normalizedCode)]
  );

  if (result.total === 0) {
    throw new Error('Mã mời không tồn tại. Vui lòng kiểm tra lại.');
  }

  const doc = result.documents[0];

  if (doc.status === 'revoked') {
    throw new Error('Mã mời này đã bị hủy bởi chủ kế hoạch.');
  }

  if (doc.status === 'active' && doc.partnerUid && doc.partnerUid !== partner.uid) {
    throw new Error('Kế hoạch này đã có người tham gia.');
  }

  if (doc.ownerUid === partner.uid) {
    throw new Error('Bạn không thể tham gia kế hoạch của chính mình.');
  }

  // Update the document to add partner
  const updated = await databases.updateDocument(
    DB_ID,
    COLLECTIONS.PLAN_SHARES,
    doc.$id,
    {
      partnerUid: partner.uid,
      partnerEmail: partner.email || '',
      status: 'active',
    }
  );

  // Update user_data permissions to allow partner access
  try {
    await databases.updateDocument(
      DB_ID,
      COLLECTIONS.USER_DATA,
      doc.ownerUid,
      {}, // no data change, just permissions
      [
        Permission.read(Role.user(doc.ownerUid)),
        Permission.update(Role.user(doc.ownerUid)),
        Permission.delete(Role.user(doc.ownerUid)),
        Permission.read(Role.user(partner.uid)),
        Permission.update(Role.user(partner.uid)),
      ]
    );
  } catch (e) {
    console.warn('Could not update user_data permissions (doc may not exist yet):', e);
  }

  return docToSharedPlan(updated);
}

// --- QUERY PLANS ---

export async function getSharedPlanAsOwner(uid: string): Promise<SharedPlan | null> {
  try {
    const result = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.PLAN_SHARES,
      [
        Query.equal('ownerUid', uid),
        Query.notEqual('status', 'revoked'),
        Query.orderDesc('createdAt'),
        Query.limit(1),
      ]
    );
    return result.total > 0 ? docToSharedPlan(result.documents[0]) : null;
  } catch {
    return null;
  }
}

export async function getSharedPlanAsPartner(uid: string): Promise<SharedPlan | null> {
  try {
    const result = await databases.listDocuments(
      DB_ID,
      COLLECTIONS.PLAN_SHARES,
      [
        Query.equal('partnerUid', uid),
        Query.equal('status', 'active'),
        Query.orderDesc('createdAt'),
        Query.limit(1),
      ]
    );
    return result.total > 0 ? docToSharedPlan(result.documents[0]) : null;
  } catch {
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
  await databases.updateDocument(
    DB_ID,
    COLLECTIONS.PLAN_SHARES,
    planId,
    { status: 'revoked' }
  );
}

export async function leavePlan(planId: string, partnerUid: string, ownerUid: string): Promise<void> {
  // Remove partner from plan
  await databases.updateDocument(
    DB_ID,
    COLLECTIONS.PLAN_SHARES,
    planId,
    {
      partnerUid: '',
      partnerEmail: '',
      status: 'pending', // Reset to pending so owner can re-invite
    }
  );

  // Remove partner permissions from user_data
  try {
    await databases.updateDocument(
      DB_ID,
      COLLECTIONS.USER_DATA,
      ownerUid,
      {},
      [
        Permission.read(Role.user(ownerUid)),
        Permission.update(Role.user(ownerUid)),
        Permission.delete(Role.user(ownerUid)),
      ]
    );
  } catch {
    // Silent — doc may not exist
  }
}
