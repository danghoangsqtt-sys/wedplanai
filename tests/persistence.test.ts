import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({load:vi.fn(),save:vi.fn()}));
vi.mock('../services/cloudService',()=>({loadUserDataFromCloud:mocks.load,saveUserDataToCloud:mocks.save}));
vi.mock('../lib/supabase',()=>({supabase:{auth:{signOut:vi.fn().mockResolvedValue({error:null})}},TABLES:{}}));
import { useStore } from '../store/useStore';
import { INITIAL_INVITATION } from '../data/initialData';

function remote(revision='r1') { return {guests:[],budgetItems:[],invitation:{...INITIAL_INVITATION,groomName:'Remote',date:'2028-12-01'},revision,lastUpdated:1}; }
beforeEach(()=>{
  vi.useFakeTimers(); useStore.setState(useStore.getInitialState(),true);
  mocks.load.mockResolvedValue(null); mocks.save.mockResolvedValue('r2');
});
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();});
describe('cloud synchronization durability',()=>{
  it('does not authorize any write after a failed initial read',async()=>{
    mocks.load.mockRejectedValue(new Error('offline'));
    await expect(useStore.getState().loadFromCloud()).rejects.toThrow('offline');
    useStore.getState().updateInvitation({groomName:'Local edit'});
    await vi.advanceTimersByTimeAsync(2500);
    expect(useStore.getState().isCloudLoaded).toBe(false);
    expect(useStore.getState().hasUnsyncedChanges).toBe(true);
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it('allows an acknowledged initial empty read and records the returned revision',async()=>{
    await useStore.getState().loadFromCloud();
    useStore.getState().updateInvitation({groomName:'Changed'});
    await useStore.getState().syncToCloud();
    expect(mocks.save.mock.calls[0][2]).toBeNull();
    expect(useStore.getState()).toMatchObject({cloudRevision:'r2',hasUnsyncedChanges:false,syncStatus:'saved'});
  });
  it('keeps dirty data on failure and clears it only after a successful retry',async()=>{
    await useStore.getState().loadFromCloud();useStore.getState().updateInvitation({groomName:'Keep me'});
    mocks.save.mockRejectedValueOnce(new Error('failed write'));
    await expect(useStore.getState().syncToCloud()).rejects.toThrow();
    expect(useStore.getState()).toMatchObject({hasUnsyncedChanges:true,syncStatus:'error'});
    await useStore.getState().syncToCloud();
    expect(useStore.getState().hasUnsyncedChanges).toBe(false);
  });
  it('serializes edits made during a save using the acknowledged revision',async()=>{
    await useStore.getState().loadFromCloud();
    let resolve!:(value:string)=>void;
    mocks.save.mockImplementationOnce(()=>new Promise<string>(r=>{resolve=r;}));
    useStore.getState().updateInvitation({groomName:'First'}); const saving=useStore.getState().syncToCloud();
    useStore.getState().updateInvitation({groomName:'Second'});
    resolve('r1'); await saving;
    expect(mocks.save).toHaveBeenCalledTimes(2);
    expect(mocks.save.mock.calls[1][1].invitation.groomName).toBe('Second');
    expect(mocks.save.mock.calls[1][2]).toBe('r1');
  });
  it('preserves unsynced local data when a reload sees the same remote revision',async()=>{
    useStore.setState({cloudRevision:'r1',hasUnsyncedChanges:true,invitation:{...INITIAL_INVITATION,groomName:'Local pending'}});
    mocks.load.mockResolvedValue(remote());await useStore.getState().loadFromCloud();
    expect(useStore.getState().invitation.groomName).toBe('Local pending');
    expect(useStore.getState().hasUnsyncedChanges).toBe(true);
  });
  it('requires an explicit choice before replacing dirty data from another revision',async()=>{
    useStore.setState({cloudRevision:'r0',hasUnsyncedChanges:true,invitation:{...INITIAL_INVITATION,groomName:'Local pending'}});
    mocks.load.mockResolvedValue(remote());await expect(useStore.getState().loadFromCloud()).rejects.toThrow(/backup/);
    expect(useStore.getState()).toMatchObject({isCloudLoaded:false,syncStatus:'conflict'});
    expect(useStore.getState().invitation.groomName).toBe('Local pending');
    await useStore.getState().loadFromCloud({discardLocalChanges:true});
    expect(useStore.getState().invitation.groomName).toBe('Remote');expect(useStore.getState().hasUnsyncedChanges).toBe(false);
  });
  it('uses the same wedding date for settings, invitation, save and a clean reload',async()=>{
    await useStore.getState().loadFromCloud();
    await useStore.getState().updateUser(useStore.getState().user!.uid,{weddingDate:'2028-12-01'});
    expect(useStore.getState().invitation.date).toBe('2028-12-01');
    await useStore.getState().syncToCloud();expect(mocks.save.mock.calls[0][1].weddingDate).toBe('2028-12-01');
    mocks.load.mockResolvedValue(remote());await useStore.getState().loadFromCloud();
    expect(useStore.getState().user!.weddingDate).toBe(useStore.getState().invitation.date);
  });
  it('does not dirty an unchanged invitation during editor mount/unmount',async()=>{
    await useStore.getState().loadFromCloud();useStore.getState().updateInvitation({...useStore.getState().invitation});
    expect(useStore.getState().hasUnsyncedChanges).toBe(false);
  });
});
