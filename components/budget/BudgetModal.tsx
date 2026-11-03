import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export const budgetInput='mt-1 block w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100';
export const budgetPrimary='rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50';
export const budgetSecondary='rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50';
export default function BudgetModal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children?:React.ReactNode;wide?:boolean}){
  const ref=useRef<HTMLDialogElement>(null),titleId=useId();
  useEffect(()=>{
    const element=ref.current;if(element?.showModal)element.showModal();else element?.setAttribute('open','');
    element?.querySelector<HTMLInputElement>('input:not([type=checkbox]):not([type=hidden])')?.focus();
    return()=>{if(element?.open)element.close?.();};
  },[]);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={e=>{e.preventDefault();onClose();}} className={`m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] overflow-y-auto rounded-2xl border-0 bg-white p-0 text-gray-800 shadow-2xl backdrop:bg-slate-950/40 ${wide?'max-w-4xl':'max-w-2xl'}`}>
    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-white px-5 py-4"><h2 id={titleId} className="text-lg font-bold">{title}</h2><button type="button" aria-label={`Đóng ${title.toLowerCase()}`} onClick={onClose} className="rounded-full p-2 hover:bg-gray-100"><X className="h-5 w-5"/></button></div>
    {children}
  </dialog>;
}
