import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getUser:vi.fn(), rpc:vi.fn(), signIn:vi.fn(), login:vi.fn(), setState:vi.fn(), listener:null as null|((event:string)=>void) }));
vi.mock('../lib/supabase', () => ({ isSupabaseConfigured:true, supabase:{
  rpc:mocks.rpc, auth:{ getUser:mocks.getUser, signInWithPassword:mocks.signIn,
    onAuthStateChange:(listener: typeof mocks.listener) => { mocks.listener=listener; return {data:{subscription:{unsubscribe:vi.fn()}}}; } },
}}));
vi.mock('../store/useStore', () => ({ useStore:{ getState:() => ({user:{uid:'owner'},login:mocks.login}),setState:mocks.setState } }));
import PasswordGate from '../components/PasswordGate';

beforeEach(() => {
  mocks.getUser.mockResolvedValue({data:{user:null},error:null});
  mocks.rpc.mockResolvedValue({data:false,error:null});
  mocks.login.mockResolvedValue(undefined);
});
describe('authenticated owner gate', () => {
  it('ignores a forged historical browser unlock flag', async () => {
    sessionStorage.setItem('wedplan_unlocked','true');
    const onUnlock=vi.fn(); render(<PasswordGate onUnlock={onUnlock}>PRIVATE</PasswordGate>);
    await screen.findByRole('button',{name:'Đăng nhập'});
    expect(screen.queryByText('PRIVATE')).not.toBeInTheDocument(); expect(onUnlock).not.toHaveBeenCalled();
  });
  it('does not load private data for an authenticated user without database authorization', async () => {
    mocks.getUser.mockResolvedValue({data:{user:{id:'other'}},error:null});
    const onUnlock=vi.fn(); render(<PasswordGate onUnlock={onUnlock}>PRIVATE</PasswordGate>);
    await screen.findByRole('alert'); expect(onUnlock).not.toHaveBeenCalled();
  });
  it('only loads an authorized owner and locks again when signed out', async () => {
    mocks.getUser.mockResolvedValue({data:{user:{id:'owner',email:'owner@example.test'}},error:null});
    mocks.rpc.mockResolvedValue({data:true,error:null});
    const onUnlock=vi.fn().mockResolvedValue(undefined);
    render(<PasswordGate onUnlock={onUnlock}>PRIVATE</PasswordGate>);
    await screen.findByText('PRIVATE'); expect(onUnlock).toHaveBeenCalledTimes(1);
    // React event helper flushes the subscription-driven UI update.
    const event=document.createElement('button'); event.onclick=()=>mocks.listener?.('SIGNED_OUT');
    fireEvent.click(event);
    await waitFor(()=>expect(screen.queryByText('PRIVATE')).not.toBeInTheDocument());
  });
});
