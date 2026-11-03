import type { Guest, BudgetItem, ProcedureStep, WeddingRegion, InvitationData } from '../types';
import type { CoupleProfile, HarmonyResult, AuspiciousDate } from '../types/fengshui';
import { isMilestoneTaskStore } from './milestoneTasks';
import { validateBudgetPaymentData } from './budgetPayments';

export interface PlanSnapshot {
  milestoneTasks?: import('../types').MilestoneTaskStore;
  guests:Guest[]; budgetItems:BudgetItem[]; procedures:Record<WeddingRegion,ProcedureStep[]>;
  fengShuiProfile:CoupleProfile|null; fengShuiResults:{harmony:HarmonyResult|null;dates:AuspiciousDate[]};
  invitation:InvitationData;
}
export function createBackup(state:PlanSnapshot) {
  return {schemaVersion:2,appVersion:'2.4.0',exportedAt:new Date().toISOString(),
    guests:state.guests,budgetItems:state.budgetItems,procedures:state.procedures,
    milestoneTasks:state.milestoneTasks,
    fengShuiProfile:state.fengShuiProfile,fengShuiResults:state.fengShuiResults,
    invitation:state.invitation,weddingDate:state.invitation.date||null};
}
function plain(value:unknown):value is Record<string,any> {
  return value!==null && typeof value==='object' && !Array.isArray(value);
}
function safeTree(value:unknown, depth=0):void {
  if(depth>40) throw new Error('Backup có cấu trúc quá sâu.');
  if(typeof value==='number' && !Number.isFinite(value)) throw new Error('Backup chứa số không hợp lệ.');
  if(value && typeof value==='object') for(const [key,entry] of Object.entries(value)) {
    if(['__proto__','prototype','constructor'].includes(key)) throw new Error('Backup chứa thuộc tính không được phép.');
    safeTree(entry,depth+1);
  }
}
function finite(value:unknown) { return typeof value==='number' && Number.isFinite(value) && value>=0; }
function validDate(value:string) {
  if(!value) return true;
  const date=new Date(value+'T00:00:00Z');
  return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
export function restoreBackup(raw:unknown,current:PlanSnapshot):PlanSnapshot {
  if(!plain(raw) || (!Object.hasOwn(raw,'guests') && !Object.hasOwn(raw,'budgetItems'))) throw new Error('Không đúng định dạng backup WedPlan AI.');
  safeTree(raw);
  if(raw.schemaVersion!==undefined && ![1,2].includes(raw.schemaVersion)) throw new Error('Phiên bản backup chưa được hỗ trợ.');
  if(raw.guests!==undefined && (!Array.isArray(raw.guests)||!raw.guests.every((g:any)=>plain(g)&&typeof g.id==='string'&&typeof g.name==='string'&&g.name.length<=100&&[0,50,80,100].includes(g.probability)&&Number.isInteger(g.childrenCount)&&g.childrenCount>=0&&g.childrenCount<=100&&finite(g.redEnvelope)))) throw new Error('Danh sách khách trong backup không hợp lệ.');
  if(raw.guests?.some((g:any)=>g.partySize!==undefined&&(!Number.isInteger(g.partySize)||g.partySize<1+g.childrenCount||g.partySize>100))) throw new Error('Số người trong nhóm khách không hợp lệ.');
  if(raw.guests?.some((g:any)=>[['phone',30],['address',200],['tableName',50],['notes',2000]].some(([key,max])=>g[key]!==undefined&&(typeof g[key]!=='string'||g[key].length>Number(max))) || (g.invitationStatus!==undefined&&!['not_sent','sent'].includes(g.invitationStatus)))) throw new Error('Thông tin khách mời trong backup không hợp lệ.');
  if(raw.budgetItems!==undefined && (!Array.isArray(raw.budgetItems)||!raw.budgetItems.every((b:any)=>plain(b)&&typeof b.itemName==='string'&&typeof b.category==='string'&&finite(b.estimatedCost)&&finite(b.actualCost)))) throw new Error('Ngân sách trong backup không hợp lệ.');
  raw.budgetItems?.forEach(validateBudgetPaymentData);
  if(raw.procedures!==undefined && (!plain(raw.procedures)||!['NORTH','CENTRAL','SOUTH'].every(region=>Array.isArray(raw.procedures[region])))) throw new Error('Quy trình trong backup không hợp lệ.');
  if(raw.milestoneTasks!==undefined && !isMilestoneTaskStore(raw.milestoneTasks)) throw new Error('Lộ trình trong backup không hợp lệ.');
  if(raw.invitation!==undefined) {
    const inv=raw.invitation;
    if(!plain(inv)||typeof inv.groomName!=='string'||typeof inv.brideName!=='string'||typeof inv.date!=='string'||!validDate(inv.date)) throw new Error('Thiệp trong backup không hợp lệ.');
    for(const field of ['events','galleryImages','loveStory','guestWishes','sectionOrder']) if(inv[field]!==undefined&&!Array.isArray(inv[field])) throw new Error('Cấu trúc thiệp không hợp lệ.');
    if(inv.events?.some((event:any)=>!plain(event)||typeof event.title!=='string'||typeof event.date!=='string'||!validDate(event.date)||typeof event.time!=='string')) throw new Error('Sự kiện trong thiệp không hợp lệ.');
    if(inv.galleryImages?.some((image:any)=>typeof image!=='string')) throw new Error('Ảnh trong thiệp không hợp lệ.');
  }
  if(raw.fengShuiProfile!==undefined&&raw.fengShuiProfile!==null&&!plain(raw.fengShuiProfile)) throw new Error('Hồ sơ phong thủy không hợp lệ.');
  if(raw.fengShuiResults!==undefined&&(!plain(raw.fengShuiResults)||!Array.isArray(raw.fengShuiResults.dates))) throw new Error('Kết quả phong thủy không hợp lệ.');
  // Missing fields in older backups preserve the current plan instead of resetting it.
  const next={...current};
  for(const key of ['guests','budgetItems','procedures','milestoneTasks','fengShuiProfile','fengShuiResults','invitation'] as const) {
    if(raw[key]!==undefined) (next as any)[key]=raw[key];
  }
  return next;
}
