import React, { useRef, useState } from 'react';
import { useStore } from '../../store/useStore';
import { newUuid } from '../../lib/ids';
import { formatBudgetMoney, getItemPaymentSummary, proposePaymentAllocation, recordBudgetPayment, todayInBangkok } from '../../lib/budgetPayments';
import BudgetModal, { budgetInput, budgetPrimary, budgetSecondary } from './BudgetModal';

export default function PaymentDialog({itemId,stageId,kind:initialKind='payment',onClose}:{itemId:string;stageId?:string;kind?:'deposit'|'payment';onClose:()=>void}){
  const {budgetItems,invitation,mutateBudgetItem}=useStore(),item=budgetItems.find(i=>i.id===itemId);
  const initialStage=item?getItemPaymentSummary(item,invitation.date).schedule.find(s=>s.id===stageId):undefined;
  const [amount,setAmount]=useState(initialStage?String(initialStage.remaining):''),[kind,setKind]=useState(initialKind),[date,setDate]=useState(todayInBangkok());
  const [preferred,setPreferred]=useState(stageId||''),[note,setNote]=useState(''),[error,setError]=useState('');const busy=useRef(false),id=useRef(newUuid());
  if(!item)return null;
  const stats=getItemPaymentSummary(item,invitation.date);let allocation:ReturnType<typeof proposePaymentAllocation>|null=null;
  try{allocation=proposePaymentAllocation(item,Number(amount),invitation.date,preferred);}catch{/* Incomplete input is not submitted. */}
  const submit=(event:React.FormEvent)=>{
    event.preventDefault();if(busy.current)return;setError('');
    try{
      const current=useStore.getState().budgetItems.find(i=>i.id===itemId);if(!current)throw new Error('Khoản chi không còn tồn tại.');
      const preview=proposePaymentAllocation(current,Number(amount),invitation.date,preferred);
      if(preview.excess>0&&!confirm(`${preview.provisional?'Vượt phần còn dự kiến':'Trả dư cho nhà cung cấp'} ${formatBudgetMoney(preview.excess)}. Vẫn ghi nhận tiền thực đã trả?`))return;
      busy.current=true;mutateBudgetItem(itemId,row=>recordBudgetPayment(row,{id:id.current,kind,amount:Number(amount),paidAt:date,note:note.trim()},invitation.date,preferred));onClose();
    }catch(err){setError(err instanceof Error?err.message:'Không ghi nhận được khoản trả.');}finally{busy.current=false;}
  };
  return <BudgetModal title={initialKind==='deposit'?'Ghi nhận tiền cọc':'Ghi nhận thanh toán'} onClose={onClose}><form onSubmit={submit}>
    <div className="space-y-4 p-5"><p className="text-sm text-gray-500">{item.itemName} · {item.supplierName||'Chưa có nhà cung cấp'}<br/>{stats.provisional?'Còn dự kiến':'Còn phải trả'} <b>{formatBudgetMoney(stats.remaining)}</b></p>
      {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">Loại khoản trả<select value={kind} onChange={e=>setKind(e.target.value as 'deposit'|'payment')} className={budgetInput}><option value="payment">Thanh toán</option><option value="deposit">Tiền cọc</option></select></label><label className="text-sm font-medium">Ngày thực trả<input type="date" required value={date} onChange={e=>setDate(e.target.value)} className={budgetInput}/></label></div>
      <label className="block text-sm font-medium">Số tiền mới thực trả (VNĐ)<input type="number" required min={1} step={1} max={Number.MAX_SAFE_INTEGER} value={amount} onChange={e=>setAmount(e.target.value)} className={budgetInput}/></label>
      <p className="text-xs text-rose-600">{Number(amount)>0?formatBudgetMoney(Number(amount)): 'Chỉ nhập số tiền của lần trả mới; cọc cũ đã có trong lịch sử.'}</p>
      <label className="block text-sm font-medium">Ưu tiên trả vào đợt<select value={preferred} onChange={e=>setPreferred(e.target.value)} className={budgetInput}><option value="">Đợt gần đến hạn nhất</option>{stats.schedule.filter(s=>s.remaining>0).map(s=><option key={s.id} value={s.id}>{s.label} · còn {formatBudgetMoney(s.remaining)}</option>)}</select></label>
      <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3"><h3 className="text-xs font-bold text-gray-600">Phân bổ lần trả này</h3>{allocation? <div className="mt-2 space-y-2">{allocation.allocations.map((a,index)=><p key={index} className="flex justify-between gap-3 text-xs text-gray-600"><span>{a.scheduleId?item.paymentSchedule?.find(s=>s.id===a.scheduleId)?.label:'Phần chưa xếp lịch'}</span><b className="shrink-0">{formatBudgetMoney(a.amount)}</b></p>)}{allocation.excess>0&&<p className="text-xs text-amber-700">{allocation.provisional?'Chưa phân bổ thêm':'Trả dư'}: {formatBudgetMoney(allocation.excess)}; không bù vào nợ đơn vị khác.</p>}</div>:<p className="mt-2 text-xs text-gray-400">Nhập số tiền để xem trước.</p>}</div>
      <label className="block text-sm font-medium">Ghi chú<input maxLength={500} value={note} onChange={e=>setNote(e.target.value)} className={budgetInput}/></label>
    </div><div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white px-5 py-4"><button type="button" onClick={onClose} className={budgetSecondary}>Hủy</button><button type="submit" className={budgetPrimary}>Xác nhận đã trả</button></div>
  </form></BudgetModal>;
}
