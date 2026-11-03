import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RSVPModal, GuestbookModal } from '../components/invitation/PublicInvitationView';

describe('guest form acknowledgements',()=>{
  it('shows success only after the RSVP acknowledgement arrives',async()=>{
    let resolve!:(value:boolean)=>void;
    const onSubmit=vi.fn<(payload:Parameters<React.ComponentProps<typeof RSVPModal>['onSubmit']>[0])=>Promise<boolean>>(()=>new Promise<boolean>(r=>{resolve=r;}));
    render(<RSVPModal groomName="Groom" brideName="Bride" onClose={()=>{}} onSubmit={onSubmit}/>);
    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'),{target:{value:'Audit Family'}});
    fireEvent.change(screen.getByLabelText('Số người tham dự'),{target:{value:'5+'}});
    fireEvent.click(screen.getByRole('button',{name:/Xác nhận \/ Confirm/}));
    expect(screen.getByRole('button',{name:/Đang gửi/})).toBeDisabled();
    expect(screen.queryByText(/Cảm ơn bạn/)).not.toBeInTheDocument();
    await act(async()=>resolve(true));await screen.findByText(/Cảm ơn bạn/);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({name:'Audit Family',guestCount:5});
  });
  it('keeps the RSVP and reuses its stable ID on a failed retry',async()=>{
    const onSubmit=vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    render(<RSVPModal groomName="Groom" brideName="Bride" onClose={()=>{}} onSubmit={onSubmit}/>);
    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'),{target:{value:'Audit Guest'}});
    fireEvent.click(screen.getByRole('button',{name:/Xác nhận \/ Confirm/}));
    await screen.findByRole('alert');expect(screen.getByPlaceholderText('Nguyễn Văn A')).toHaveValue('Audit Guest');
    expect(screen.queryByText(/Cảm ơn bạn/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:/Xác nhận \/ Confirm/}));await screen.findByText(/Cảm ơn bạn/);
    expect(onSubmit.mock.calls[0][0].id).toBe(onSubmit.mock.calls[1][0].id);
  });
  it('retains a wish after failure and submits its optional email privately',async()=>{
    const onSubmit=vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    render(<GuestbookModal groomName="Groom" brideName="Bride" showEmail onClose={()=>{}} onSubmit={onSubmit}/>);
    fireEvent.change(screen.getByPlaceholderText('Nguyễn Văn A'),{target:{value:'A Friend'}});
    fireEvent.change(screen.getByPlaceholderText('email@...'),{target:{value:'friend@example.test'}});
    const textarea=screen.getByRole('textbox',{name:'Lời chúc'});
    fireEvent.change(textarea,{target:{value:'Congratulations!'}});
    fireEvent.click(screen.getByRole('button',{name:/GỬI LỜI CHÚC/}));await screen.findByRole('alert');
    expect(textarea).toHaveValue('Congratulations!');
    fireEvent.click(screen.getByRole('button',{name:/GỬI LỜI CHÚC/}));
    await waitFor(()=>expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onSubmit.mock.calls[0][0]).toMatchObject({email:'friend@example.test',message:'Congratulations!'});
    expect(onSubmit.mock.calls[0][0].id).toBe(onSubmit.mock.calls[1][0].id);
  });
});
