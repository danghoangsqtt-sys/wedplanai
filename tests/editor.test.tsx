import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../services/cloudService',()=>({loadUserDataFromCloud:vi.fn().mockResolvedValue(null),saveUserDataToCloud:vi.fn().mockResolvedValue('revision')}));
import { InlineRichText } from '../components/invitation/InlineRichText';
import InvitationPreview from '../components/invitation/InvitationPreview';
import InvitationEditorPage from '../components/invitation/editor/InvitationEditorPage';
import { INITIAL_INVITATION } from '../data/initialData';
import { useStore } from '../store/useStore';
import { invitationSectionOrder } from '../lib/invitationSections';
import { sanitizeAudioUrl } from '../lib/sanitize';

beforeEach(()=>{
  vi.useFakeTimers();
  vi.stubGlobal('IntersectionObserver',class {observe(){}unobserve(){}disconnect(){}});
  useStore.setState({...useStore.getInitialState(),invitation:{...INITIAL_INVITATION,templateId:'modern'},isCloudLoaded:true},true);
});
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();});
describe('safe inline editing',()=>{
  it('edits and commits rich text on blur',()=>{
    const edit=vi.fn();render(<InlineRichText field="groomName" value="Before" placeholder="Chú Rể" ec={{onFieldEdit:edit}}/>);
    const field=screen.getByRole('textbox',{name:'Chú Rể'});field.focus();field.innerHTML='<b>After</b>';fireEvent.blur(field);
    expect(edit).toHaveBeenCalledWith('groomName','<b>After</b>');
  });
  it('does not commit incomplete composition',()=>{
    const edit=vi.fn();render(<InlineRichText field="name" value="" ec={{onFieldEdit:edit}}/>);
    const field=screen.getByRole('textbox');field.focus();fireEvent.compositionStart(field);field.textContent='Nguyễn';fireEvent.blur(field);
    expect(edit).not.toHaveBeenCalled();fireEvent.compositionEnd(field);expect(edit).toHaveBeenCalledWith('name','Nguyễn');
  });
  it('keeps supported typography while stripping events, layout overlays and executable tags',()=>{
    const {container}=render(<InlineRichText field="name" value={'<b onclick="alert(1)" style="color:red;position:fixed;inset:0">Safe</b><img src=x onerror="alert(1)"><script>alert(1)</script>'}/>);
    expect(container.querySelector('img,script')).toBeNull();
    expect(container.querySelector('b')).not.toHaveAttribute('onclick');
    expect(container.querySelector('b')).toHaveStyle({color:'rgb(255, 0, 0)'});
    expect(container.querySelector('b')!.style.position).toBe('');
  });
  it('pastes text without inserting executable HTML',()=>{
    const edit=vi.fn();const {container}=render(<InlineRichText field="name" value="" ec={{onFieldEdit:edit}}/>);
    const field=screen.getByRole('textbox');fireEvent.paste(field,{clipboardData:{getData:()=>'<img src=x onerror=alert(1)>'}});fireEvent.blur(field);
    expect(container.querySelector('img')).toBeNull();expect(edit.mock.calls[0][1]).toContain('&lt;img');
  });
});
describe('ordered and visible invitation sections',()=>{
  it.each([false,true])('honors persisted settings in public/editor mode (editor=%s)',editor=>{
    const data={...INITIAL_INVITATION,calendarEnabled:true,date:'2028-12-01',openingMessage:'Welcome',sectionOrder:['calendar','hero','family','opening'] as const,sectionVisibility:{family:false}};
    const {container}=render(<InvitationPreview data={{...data,sectionOrder:[...data.sectionOrder]}} editorConfig={editor?{onFieldEdit(){}}:undefined}/>);
    const ids=Array.from(container.querySelectorAll('.iv-root > [data-sec]')).map(n=>n.getAttribute('data-sec'));
    expect(ids.slice(0,3)).toEqual(['calendar','hero','opening']);expect(ids).not.toContain('family');
  });
  it('normalizes old or malformed section lists without dropping new known sections',()=>{
    const order=invitationSectionOrder({sectionOrder:['hero','hero','unknown'] as any});
    expect(order[0]).toBe('hero');expect(order.filter(x=>x==='hero')).toHaveLength(1);expect(order).toContain('calendar');expect(order).not.toContain('unknown');
  });
  it('does not throw on a malformed encoded audio path',()=>{expect(sanitizeAudioUrl('/audio/%bad%')).toBeNull();});
});
describe('real editor autosave history',()=>{
  it('retains Undo and Redo after its own store snapshots are cloned',async()=>{
    const {container}=render(<InvitationEditorPage/>);
    const field=container.querySelector('[data-field="groomName"]') as HTMLElement;
    expect(field).toBeTruthy();field.focus();const original=field.textContent;field.innerHTML='Edited by guest owner';fireEvent.blur(field);
    await act(async()=>{await vi.advanceTimersByTimeAsync(600);});
    expect(useStore.getState().invitation.groomName).toBe('Edited by guest owner');
    const undo=screen.getByTitle(/Hoàn tác/);expect(undo).not.toBeDisabled();fireEvent.click(undo);
    await act(async()=>{await vi.advanceTimersByTimeAsync(600);});
    expect(useStore.getState().invitation.groomName).toBe(original);
    const redo=screen.getByTitle(/Làm lại/);expect(redo).not.toBeDisabled();fireEvent.click(redo);
    await act(async()=>{await vi.advanceTimersByTimeAsync(600);});
    expect(useStore.getState().invitation.groomName).toBe('Edited by guest owner');
  });
  it('flushes pending edits on pagehide and calls an explicit back action',()=>{
    const back=vi.fn();const {container}=render(<InvitationEditorPage onBack={back}/>);
    const field=container.querySelector('[data-field="groomName"]') as HTMLElement;field.innerHTML='Saved on exit';fireEvent.blur(field);
    fireEvent(window,new Event('pagehide'));expect(useStore.getState().invitation.groomName).toBe('Saved on exit');
    fireEvent.click(screen.getByRole('button',{name:/Quay lại/}));expect(back).toHaveBeenCalled();
  });
});
