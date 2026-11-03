import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({read:vi.fn(),rpc:vi.fn()}));
vi.mock('../lib/supabase',()=>({supabase:{rpc:mocks.rpc,from:()=>({select:()=>({eq:()=>({maybeSingle:mocks.read})})})},TABLES:{USER_DATA:'user_data'}}));
import { loadUserDataFromCloud, saveUserDataToCloud } from '../services/cloudService';
beforeEach(()=>{mocks.read.mockResolvedValue({data:null,error:null});mocks.rpc.mockResolvedValue({data:'2026-11-03T00:00:00.123456+00:00',error:null});});
describe('real cloud service boundaries',()=>{
  it('distinguishes a failed read from a successful empty read',async()=>{
    expect(await loadUserDataFromCloud('owner-plan')).toBeNull();
    mocks.read.mockResolvedValue({data:null,error:{message:'permission denied'}});
    await expect(loadUserDataFromCloud('owner-plan')).rejects.toMatchObject({message:'permission denied'});
  });
  it('preserves the exact database revision including microseconds',async()=>{
    const revision='2026-11-03T00:00:00.123456+00:00';
    mocks.read.mockResolvedValue({data:{guests:[],budget_items:[],last_updated:revision},error:null});
    expect((await loadUserDataFromCloud('owner-plan'))!.revision).toBe(revision);
  });
  it('uses atomic RPC and propagates write or acknowledgement failures',async()=>{
    const data={guests:[],budgetItems:[]};
    expect(await saveUserDataToCloud('owner-plan',data,'old-revision')).toContain('.123456');
    expect(mocks.rpc).toHaveBeenCalledWith('save_plan',{plan_uid:'owner-plan',plan_data:data,expected_updated_at:'old-revision'});
    mocks.rpc.mockResolvedValueOnce({data:null,error:{message:'network failure'}});
    await expect(saveUserDataToCloud('owner-plan',data)).rejects.toMatchObject({message:'network failure'});
    mocks.rpc.mockResolvedValueOnce({data:null,error:null});
    await expect(saveUserDataToCloud('owner-plan',data)).rejects.toThrow(/acknowledgement/);
  });
});
