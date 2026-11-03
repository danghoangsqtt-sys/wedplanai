import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({responses:vi.fn()}));
vi.mock('../services/cloudService',()=>({loadInvitationResponses:mocks.responses,loadUserDataFromCloud:vi.fn(),saveUserDataToCloud:vi.fn()}));
import GuestManager from '../components/GuestManager';
import { useStore } from '../store/useStore';
import { guestFromRsvp, guestPartySize, guestAdults } from '../lib/guestStats';
import type { InvitationResponse } from '../services/cloudService';
const rsvp:InvitationResponse={id:'rsvp-1',uid:'owner',kind:'rsvp',name:'Audit Family',attending:'yes',guestCount:5,createdAt:'2026-11-03T00:00:00Z'};
beforeEach(()=>{useStore.setState({...useStore.getInitialState(),guests:[]},true);mocks.responses.mockResolvedValue({rsvps:[rsvp],wishes:[]});});
describe('RSVP party size in the guest plan',()=>{
  it('preserves five people without treating companions as children',()=>{
    const guest=guestFromRsvp(rsvp,'guest-id');
    expect(guestPartySize(guest)).toBe(5);expect(guest.childrenCount).toBe(0);expect(guestAdults(guest)).toBe(5);
    expect(guest.redEnvelope).toBe(2500000);
    expect(guestPartySize({...guest,partySize:undefined,childrenCount:2})).toBe(3);
  });
  it('imports the actual row once and retains deduplication after navigation',async()=>{
    const view=render(<GuestManager/>);
    fireEvent.click(screen.getByRole('button',{name:/RSVP Thực Tế/}));
    const importButton=await screen.findByTitle('Thêm vào danh sách khách mời');fireEvent.click(importButton);
    expect(useStore.getState().guests).toHaveLength(1);expect(guestPartySize(useStore.getState().guests[0])).toBe(5);
    view.unmount();render(<GuestManager/>);fireEvent.click(screen.getByRole('button',{name:/RSVP Thực Tế/}));
    await waitFor(()=>expect(screen.getByTitle('Đã thêm vào danh sách')).toBeDisabled());
    expect(useStore.getState().guests).toHaveLength(1);
  });
});
