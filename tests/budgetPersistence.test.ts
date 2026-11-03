import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({save:vi.fn(),load:vi.fn()}));
vi.mock('../services/cloudService',()=>({saveUserDataToCloud:mocks.save,loadUserDataFromCloud:mocks.load}));
import { useStore } from '../store/useStore';
import { recordBudgetPayment } from '../lib/budgetPayments';
import { createBackup, restoreBackup } from '../lib/backup';
import { TaskStatus, type BudgetItem } from '../types';
const row:BudgetItem={id:'b1',itemName:'Nhà hàng',category:'Tiệc',side:'BOTH',assignee:'',status:TaskStatus.PENDING,estimatedCost:120000000,actualCost:0,agreedCost:110000000,payments:[],paymentSchedule:[{id:'final',label:'Quyết toán',amount:110000000,offsetDays:3}]};
beforeEach(()=>{vi.useFakeTimers();useStore.setState({...useStore.getInitialState(),budgetItems:[structuredClone(row)]},true);mocks.save.mockResolvedValue('r2');mocks.load.mockResolvedValue(null);});
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();});
describe('financial data preservation',()=>{
 it('stores local payments before Save resolves and keeps them across rehydration',async()=>{
  useStore.getState().enableLocalMode();useStore.getState().mutateBudgetItem('b1',item=>recordBudgetPayment(item,{id:'p1',kind:'deposit',amount:30000000,paidAt:'2026-11-03'},'2026-12-20'));
  await useStore.getState().syncToCloud();const stored=localStorage.getItem('wedplan-storage-v14')!;
  useStore.setState(useStore.getInitialState(),true);localStorage.setItem('wedplan-storage-v14',stored);await useStore.persist.rehydrate();
  expect(useStore.getState().budgetItems[0].payments![0].amount).toBe(30000000);expect(mocks.save).not.toHaveBeenCalled();
 });
 it('passes complete financial metadata through acknowledged cloud saves and failed retries',async()=>{
  useStore.setState({isCloudLoaded:true,cloudRevision:'r1'});useStore.getState().mutateBudgetItem('b1',item=>recordBudgetPayment(item,{id:'p1',kind:'deposit',amount:30000000,paidAt:'2026-11-03'},'2026-12-20'));
  mocks.save.mockRejectedValueOnce(new Error('offline'));await expect(useStore.getState().syncToCloud()).rejects.toThrow();expect(useStore.getState().hasUnsyncedChanges).toBe(true);
  await useStore.getState().syncToCloud();expect(mocks.save.mock.calls[1][1].budgetItems[0].payments[0]).toMatchObject({id:'p1',amount:30000000});expect(mocks.save.mock.calls[1][2]).toBe('r1');
 });
 it('round-trips history in backup and rejects bad allocation without changing store',()=>{
  const state=useStore.getState(),backup=createBackup(state);expect(restoreBackup(JSON.parse(JSON.stringify(backup)),state).budgetItems).toEqual(state.budgetItems);
  const invalid={...backup,budgetItems:[{...row,payments:[{id:'bad',kind:'payment',amount:1,paidAt:'2026-11-03',allocations:[{scheduleId:'missing',amount:1}]}]}]};
  expect(()=>useStore.getState().importData(invalid)).toThrow();expect(useStore.getState().budgetItems).toEqual([row]);
 });
 it('mutates the current item and never discards a newly added payment while editing metadata',()=>{
  useStore.getState().mutateBudgetItem('b1',item=>recordBudgetPayment(item,{id:'p1',kind:'deposit',amount:30000000,paidAt:'2026-11-03'},'2026-12-20'));
  useStore.getState().mutateBudgetItem('b1',item=>({...item,supplierName:'Updated supplier'}));expect(useStore.getState().budgetItems[0].payments).toHaveLength(1);
  const saved=useStore.getState().budgetItems;expect(()=>useStore.getState().mutateBudgetItem('b1',item=>({...item,agreedCost:-1}))).toThrow();expect(useStore.getState().budgetItems).toBe(saved);
 });
});
