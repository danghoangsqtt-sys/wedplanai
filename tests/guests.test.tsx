import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({responses:vi.fn()}));
vi.mock('../services/cloudService',()=>({loadInvitationResponses:mocks.responses,loadUserDataFromCloud:vi.fn(),saveUserDataToCloud:vi.fn()}));
import GuestManager from '../components/GuestManager';
import { useStore } from '../store/useStore';
import { guestFromRsvp, guestPartySize, guestAdults, normalizeGuest } from '../lib/guestStats';
import { AttendanceProbability, GuestGroup, type Guest } from '../types';
import { toCsv } from '../lib/csv';
import { createBackup, restoreBackup } from '../lib/backup';
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
    fireEvent.click(screen.getByRole('tab',{name:/RSVP Thực Tế/}));
    const importButton=await screen.findByTitle('Thêm vào danh sách khách mời');fireEvent.click(importButton);
    expect(useStore.getState().guests).toHaveLength(1);expect(guestPartySize(useStore.getState().guests[0])).toBe(5);
    view.unmount();render(<GuestManager/>);fireEvent.click(screen.getByRole('tab',{name:/RSVP Thực Tế/}));
    await waitFor(()=>expect(screen.getByTitle('Đã thêm vào danh sách')).toBeDisabled());
    expect(useStore.getState().guests).toHaveLength(1);
  });
});

describe('clear guest records and editing',()=>{
  const family:Guest={id:'family',name:'Gia đình An',group:GuestGroup.GROOM,probability:AttendanceProbability.CONFIRMED,childrenCount:1,partySize:4,redEnvelope:2000000,phone:'0901234567',tableName:'Bàn 01',invitationStatus:'sent',notes:'Ăn chay'};
  it('keeps focus while typing a full name and saves contact, attendance and table information',async()=>{
    useStore.setState({guests:[family]});render(<GuestManager/>);const user=userEvent.setup();
    await user.click(screen.getByRole('button',{name:'Sửa Gia đình An'}));
    const input=screen.getByRole('textbox',{name:'Tên khách / đại diện'});
    await user.clear(input);await user.type(input,'Gia đình Anh Minh');expect(input).toHaveFocus();
    await user.clear(screen.getByRole('textbox',{name:'Số điện thoại'}));await user.type(screen.getByRole('textbox',{name:'Số điện thoại'}),'0987654321');
    await user.clear(screen.getByRole('textbox',{name:'Bàn dự kiến'}));await user.type(screen.getByRole('textbox',{name:'Bàn dự kiến'}),'Bàn 02');
    await user.click(screen.getByRole('button',{name:'Lưu khách mời'}));
    expect(useStore.getState().guests[0]).toMatchObject({name:'Gia đình Anh Minh',phone:'0987654321',tableName:'Bàn 02',partySize:4,childrenCount:1});
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('filters groups, invitation states, attendance and table without confusing people with records',()=>{
    useStore.setState({guests:[family,{...family,id:'other',name:'Bạn Hà',group:GuestGroup.FRIEND,probability:50,partySize:2,childrenCount:0,tableName:undefined,invitationStatus:undefined,notes:undefined,phone:undefined}]});
    render(<GuestManager/>);
    const cards=()=>screen.getAllByRole('article');expect(cards()).toHaveLength(2);
    fireEvent.change(screen.getByRole('combobox',{name:'Lọc gửi thiệp'}),{target:{value:'unknown'}});expect(cards()).toHaveLength(1);expect(cards()[0]).toHaveAccessibleName('Khách: Bạn Hà');
    fireEvent.click(screen.getByRole('button',{name:'Xóa bộ lọc'}));fireEvent.change(screen.getByRole('combobox',{name:'Lọc phản hồi'}),{target:{value:'100'}});expect(cards()[0]).toHaveAccessibleName('Khách: Gia đình An');
    fireEvent.click(screen.getByRole('button',{name:'Xóa bộ lọc'}));fireEvent.change(screen.getByRole('combobox',{name:'Lọc nhóm khách'}),{target:{value:GuestGroup.FRIEND}});expect(cards()[0]).toHaveAccessibleName('Khách: Bạn Hà');
    fireEvent.click(screen.getByRole('button',{name:'Xóa bộ lọc'}));fireEvent.click(within(screen.getByRole('region',{name:'Tổng quan bàn tiệc'})).getByRole('button',{name:/Bàn 01/}));expect(cards()).toHaveLength(1);
    fireEvent.click(screen.getByRole('button',{name:'Xóa bộ lọc'}));fireEvent.change(screen.getByRole('textbox',{name:'Tìm khách mời'}),{target:{value:'an chay'}});expect(cards()).toHaveLength(1);
    expect(screen.getByText('2 hồ sơ / nhóm khách')).toBeInTheDocument();expect(screen.getByText('Đang hiển thị').parentElement).toHaveTextContent('1 hồ sơ · 4 người');
  });
  it('retains detailed fields in backup/import and rejects invalid group sizes and fields',()=>{
    const state={...useStore.getState(),guests:[family]};expect(restoreBackup(createBackup(state),useStore.getState()).guests[0]).toEqual(family);
    expect(()=>normalizeGuest({...family,partySize:1,childrenCount:1})).toThrow();
    expect(()=>normalizeGuest({...family,redEnvelope:-1})).toThrow();
    expect(()=>restoreBackup({guests:[{...family,phone:42}]},state)).toThrow();
    expect(guestFromRsvp({...rsvp,phone:'0901112222',message:'Vegetarian'},'import')).toMatchObject({phone:'0901112222',notes:'Vegetarian',invitationStatus:'sent'});
  });
  it('quotes CSV cells and neutralizes spreadsheet formulas in text',()=>{
    const csv=toCsv([['Tên','Ghi chú','Số người'],['=HYPERLINK("bad")','line1\nline2',4],['+0901234567','a,b',2]]);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');expect(csv).toContain('"\'+0901234567"');expect(csv).toContain('"line1\nline2"');expect(csv).toContain('"4"');
  });
});
