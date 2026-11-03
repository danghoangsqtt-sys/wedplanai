import { describe, expect, it } from 'vitest';
import { createBackup, restoreBackup } from '../lib/backup';
import { useStore } from '../store/useStore';

describe('versioned complete backups',()=>{
  const state={...useStore.getInitialState(),invitation:{...useStore.getInitialState().invitation,groomName:'My Wedding',date:'2028-12-01'}};
  it('round-trips all plan data without putting credentials in a backup',()=>{
    const exported=JSON.parse(JSON.stringify(createBackup(state)));
    expect(exported).not.toHaveProperty('settings');expect(exported).not.toHaveProperty('user');
    const restored=restoreBackup(exported,useStore.getInitialState());
    for(const key of ['guests','budgetItems','procedures','fengShuiProfile','fengShuiResults','invitation']) expect(restored[key]).toEqual(state[key]);
  });
  it('keeps invitation and procedures omitted by a historical backup',()=>{
    const restored=restoreBackup({guests:[],budgetItems:[]},state);
    expect(restored.invitation).toEqual(state.invitation);expect(restored.procedures).toEqual(state.procedures);
  });
  it('validates the whole input before touching the store',()=>{
    expect(()=>restoreBackup({guests:'not an array',budgetItems:[]},state)).toThrow();
    expect(()=>restoreBackup({guests:[],budgetItems:[{estimatedCost:-1}]},state)).toThrow();
    expect(()=>restoreBackup({guests:[],invitation:{groomName:42}},state)).toThrow();
    expect(()=>restoreBackup(JSON.parse('{"guests":[],"__proto__":{"bad":true}}'),state)).toThrow();
    expect(state.invitation.groomName).toBe('My Wedding');
  });
});
