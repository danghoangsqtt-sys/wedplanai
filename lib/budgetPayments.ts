import type { BudgetItem, BudgetPayment, BudgetPaymentStage, BudgetPaymentSummary, BudgetPaymentFilter } from '../types';

export const validBudgetDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + 'T12:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
};
export function todayInBangkok(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function shiftBudgetDate(date: string, offset: number): string | null {
  if (!validBudgetDate(date) || !Number.isInteger(offset)) return null;
  const result = new Date(date + 'T12:00:00Z'); result.setUTCDate(result.getUTCDate() + offset);
  const iso = result.toISOString().slice(0,10); return validBudgetDate(iso) ? iso : null;
}
export function paymentOffsetLabel(offset: number): string {
  return offset === 0 ? 'Đúng ngày cưới' : offset < 0 ? `Trước cưới ${-offset} ngày` : `Sau cưới ${offset} ngày`;
}
export function formatBudgetMoney(value: number): string { return new Intl.NumberFormat('vi-VN').format(value) + ' ₫'; }
export function formatBudgetDate(value: string | null): string {
  if (!value || !validBudgetDate(value)) return 'Chưa có ngày cưới';
  return value.split('-').reverse().join('/');
}
const isMoney = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const idValid = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= 128;
const textValid = (v: unknown, max: number) => v === undefined || (typeof v === 'string' && v.length <= max);
const total = <T>(rows: T[], value: (row:T)=>number): number => {
  const result=rows.reduce((n,row)=>n+value(row),0);
  if (!Number.isFinite(result) || Math.abs(result)>Number.MAX_SAFE_INTEGER) throw new Error('Tổng tiền vượt giới hạn số an toàn.');
  return result;
};
export const hasPaymentTracking = (item: BudgetItem) => Array.isArray(item.payments) && Array.isArray(item.paymentSchedule);

/** New extensions are strict; missing fields on legacy items remain untouched. */
export function validateBudgetPaymentData(item: BudgetItem): void {
  if (!item || typeof item !== 'object') throw new Error('Khoản ngân sách không hợp lệ.');
  if (item.agreedCost !== undefined && !isMoney(item.agreedCost)) throw new Error('Giá chốt phải là số nguyên không âm.');
  if (!textValid(item.supplierName,150) || !textValid(item.supplierPhone,30)) throw new Error('Thông tin nhà cung cấp không hợp lệ.');
  if ((item.payments === undefined) !== (item.paymentSchedule === undefined)) throw new Error('Thiếu lịch hoặc lịch sử thanh toán.');
  if (item.payments === undefined) return;
  if (!Array.isArray(item.payments) || !Array.isArray(item.paymentSchedule) || item.payments.length>2000 || item.paymentSchedule.length>200) throw new Error('Lịch thanh toán quá lớn hoặc sai định dạng.');
  const stages=item.paymentSchedule;
  if (new Set(stages.map(s=>s?.id)).size!==stages.length || new Set(item.payments.map(p=>p?.id)).size!==item.payments.length) throw new Error('ID đợt hoặc giao dịch bị trùng.');
  for (const s of stages) {
    if (!s || !idValid(s.id) || typeof s.label!=='string' || !s.label.trim() || s.label.length>100 || !isMoney(s.amount) || s.amount===0 || !Number.isInteger(s.offsetDays) || Math.abs(s.offsetDays)>3650 || (s.settledDueDate!==undefined&&!validBudgetDate(s.settledDueDate))) throw new Error('Đợt thanh toán không hợp lệ.');
  }
  const scheduled=total(stages,s=>s.amount);
  if (scheduled>(item.agreedCost??item.estimatedCost)) throw new Error('Tổng lịch phải trả vượt giá chốt/dự toán. Hãy điều chỉnh các đợt trước.');
  for (const p of item.payments) {
    if (!p || !idValid(p.id) || !['deposit','payment'].includes(p.kind) || !isMoney(p.amount) || !p.amount || !validBudgetDate(p.paidAt) || !textValid(p.note,500) || !Array.isArray(p.allocations) || p.allocations.length>201 || !textValid(p.voidReason,500)) throw new Error('Giao dịch thanh toán không hợp lệ.');
    if (p.voidedAt!==undefined && (typeof p.voidedAt!=='string' || !Number.isFinite(Date.parse(p.voidedAt)) || !p.voidReason?.trim())) throw new Error('Hủy giao dịch cần thời điểm và lý do.');
    const keys=p.allocations.map(a=>a?.scheduleId);
    if (new Set(keys).size!==keys.length) throw new Error('Một giao dịch bị phân bổ lặp vào cùng đợt.');
    for (const a of p.allocations) if (!a || !isMoney(a.amount) || !a.amount || (a.scheduleId!==null&&!stages.some(s=>s.id===a.scheduleId))) throw new Error('Phân bổ thanh toán không hợp lệ.');
    if (total(p.allocations,a=>a.amount)>p.amount) throw new Error('Phân bổ vượt số thực trả.');
  }
  total(item.payments.filter(p=>!p.voidedAt),p=>p.amount);
}

export function getItemPaymentSummary(item: BudgetItem, weddingDate: string, asOf=todayInBangkok()) {
  validateBudgetPaymentData(item);
  const tracked=hasPaymentTracking(item),provisional=!tracked||item.agreedCost===undefined;
  const base=item.agreedCost ?? item.estimatedCost;
  const payments=(item.payments??[]).filter(p=>!p.voidedAt);
  const paid=total(payments,p=>p.amount),deposits=total(payments.filter(p=>p.kind==='deposit'),p=>p.amount);
  const schedule=(item.paymentSchedule??[]).map(s=>({
    ...s,paid:Math.min(s.amount,total(payments,p=>total(p.allocations.filter(a=>a.scheduleId===s.id),a=>a.amount))),
    remaining:0,due:null as string|null,overdue:false,dueSoon:false,creditApplied:0
  }));
  // Unassigned cash pays the unscheduled obligation first. Any remaining credit
  // covers existing stages chronologically, including after voiding an earlier
  // record. Historical allocations/actual dates themselves are never rewritten.
  let credit=Math.max(paid-total(schedule,s=>s.paid),0);
  const unscheduledBase=Math.max(base-total(schedule,s=>s.amount),0);
  const unscheduled=Math.max(unscheduledBase-credit,0); credit=Math.max(credit-unscheduledBase,0);
  const ordered=[...schedule].sort((a,b)=>a.offsetDays-b.offsetDays||a.id.localeCompare(b.id));
  for(const s of ordered){const extra=Math.min(credit,s.amount-s.paid);s.paid+=extra;s.creditApplied=extra;credit-=extra;}
  for(const s of schedule){
    s.remaining=Math.max(s.amount-s.paid,0);
    s.due=s.remaining===0&&s.settledDueDate?s.settledDueDate:shiftBudgetDate(weddingDate,s.offsetDays);
    s.overdue=s.remaining>0&&!!s.due&&s.due<asOf;
    s.dueSoon=s.remaining>0&&!!s.due&&s.due>=asOf&&s.due<=(shiftBudgetDate(asOf,7)??asOf);
  }
  return {item,tracked,provisional,base,paid,deposits,schedule,unscheduled,
    remaining:Math.max(base-paid,0),overpaid:provisional?0:Math.max(paid-base,0),
    before:total(schedule.filter(s=>s.offsetDays<=0),s=>s.remaining),after:total(schedule.filter(s=>s.offsetDays>0),s=>s.remaining),
    overdue:total(schedule.filter(s=>s.overdue),s=>s.remaining),dueSoon:total(schedule.filter(s=>s.dueSoon),s=>s.remaining)};
}
export type ItemPaymentSummary=ReturnType<typeof getItemPaymentSummary>;
export function getBudgetPaymentSummary(items: BudgetItem[], weddingDate: string, asOf=todayInBangkok()): BudgetPaymentSummary {
  const rows=items.map(i=>getItemPaymentSummary(i,weddingDate,asOf)),known=rows.filter(r=>!r.provisional);
  return {estimated:total(items,i=>i.estimatedCost),agreed:total(items,i=>i.agreedCost??0),forecast:total(rows,r=>r.base),
    paid:total(rows,r=>r.paid),deposits:total(rows,r=>r.deposits),remaining:total(known,r=>r.remaining),
    provisionalRemaining:total(rows.filter(r=>r.provisional),r=>r.remaining),overpaid:total(known,r=>r.overpaid),
    before:total(known,r=>r.before),after:total(known,r=>r.after),unscheduled:total(known,r=>r.unscheduled),
    overdue:total(known,r=>r.overdue),dueSoon:total(known,r=>r.dueSoon),
    unreconciledCount:rows.filter(r=>!r.tracked).length,unpricedCount:items.filter(i=>i.agreedCost===undefined).length};
}
export function matchesBudgetFilter(row: ItemPaymentSummary, filter: BudgetPaymentFilter): boolean {
  if(filter==='all')return true;
  if(filter==='unreconciled')return !row.tracked||row.provisional;
  if(filter==='history')return row.paid>0;
  return !row.provisional&&row[filter]>0;
}
export function proposePaymentAllocation(item: BudgetItem,amount: number, weddingDate: string, preferredId?: string) {
  if(!isMoney(amount)||!amount)throw new Error('Số tiền thực trả phải là số nguyên dương.');
  const stats=getItemPaymentSummary(item,weddingDate);let left=amount;
  const allocations:BudgetPayment['allocations']=[];
  const ordered=[...stats.schedule].sort((a,b)=>Number(b.id===preferredId)-Number(a.id===preferredId)||a.offsetDays-b.offsetDays);
  for(const s of ordered){const part=Math.min(left,s.remaining);if(part){allocations.push({scheduleId:s.id,amount:part});left-=part;}}
  const unplanned=Math.min(left,stats.unscheduled);if(unplanned){allocations.push({scheduleId:null,amount:unplanned});left-=unplanned;}
  return {allocations,excess:left,provisional:stats.provisional};
}
function freezeSettled(item:BudgetItem,weddingDate:string):BudgetItem {
  const summary=getItemPaymentSummary(item,weddingDate);
  return {...item,paymentSchedule:item.paymentSchedule?.map(s=>{
    const stage=summary.schedule.find(x=>x.id===s.id)!;
    return stage.remaining===0&&!s.settledDueDate&&stage.due?{...s,settledDueDate:stage.due}:s;
  })};
}
export function recordBudgetPayment(item:BudgetItem,input:Omit<BudgetPayment,'allocations'|'voidedAt'|'voidReason'>,weddingDate:string,preferredId?:string):BudgetItem {
  if(!hasPaymentTracking(item))throw new Error('Hãy đối chiếu số liệu cũ trước khi ghi nhận tiền mới.');
  if(item.payments!.some(p=>p.id===input.id))throw new Error('Giao dịch này đã được ghi nhận.');
  const {allocations}=proposePaymentAllocation(item,input.amount,weddingDate,preferredId);
  const result={...item,payments:[...item.payments!,{...input,allocations}]};validateBudgetPaymentData(result);
  return freezeSettled(result,weddingDate);
}
export function saveBudgetSchedule(item:BudgetItem,stage:BudgetPaymentStage,weddingDate:string):BudgetItem {
  if(!hasPaymentTracking(item))throw new Error('Hãy đối chiếu số liệu trước khi lập lịch.');
  const existing=item.paymentSchedule!.find(s=>s.id===stage.id);
  if(existing&&stage.amount<getItemPaymentSummary(item,weddingDate).schedule.find(s=>s.id===stage.id)!.paid)throw new Error('Số tiền đợt không được nhỏ hơn phần đã trả.');
  const schedule=existing?item.paymentSchedule!.map(s=>s.id===stage.id?{...stage,settledDueDate:s.settledDueDate}:s):[...item.paymentSchedule!,stage];
  let result={...item,paymentSchedule:schedule};
  if(!existing){let left=stage.amount;result={...result,payments:item.payments!.map(p=>{
    if(p.voidedAt)return p;const allocations=p.allocations.map(a=>({...a}));
    const unplanned=allocations.find(a=>a.scheduleId===null);if(unplanned&&left){const moved=Math.min(left,unplanned.amount);unplanned.amount-=moved;allocations.push({scheduleId:stage.id,amount:moved});left-=moved;}
    return {...p,allocations:allocations.filter(a=>a.amount>0)};
  })};}
  validateBudgetPaymentData(result);return freezeSettled(result,weddingDate);
}
export function removeBudgetSchedule(item:BudgetItem,id:string):BudgetItem {
  if(item.payments?.some(p=>p.allocations.some(a=>a.scheduleId===id)))throw new Error('Đợt có lịch sử thanh toán; không thể xóa để bảo toàn đối chiếu.');
  return {...item,paymentSchedule:item.paymentSchedule?.filter(s=>s.id!==id)};
}
export function voidBudgetPayment(item:BudgetItem,id:string,reason:string,now=new Date()):BudgetItem {
  if(!reason.trim()||reason.length>500)throw new Error('Cần nhập lý do hủy (tối đa 500 ký tự).');
  if(!item.payments?.some(p=>p.id===id&&!p.voidedAt))throw new Error('Giao dịch không còn hiệu lực hoặc không tồn tại.');
  const result={...item,payments:item.payments.map(p=>p.id===id?{...p,voidedAt:now.toISOString(),voidReason:reason.trim()}:p)};
  validateBudgetPaymentData(result);return result;
}
