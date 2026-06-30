import React, { useRef, useState, useEffect } from 'react';
import {
    X, Upload, Trash2, Plus, RefreshCw, Music2,
    ChevronDown, ChevronUp, Eye, Smile, MapPin, Lightbulb, Pencil, ImageIcon
} from 'lucide-react';
import { InvitationData, BankInfo, WeddingEvent, LoveStoryEvent, SectionId } from '../../../types';
import { useStore } from '../../../store/useStore';
import { uploadInvitationImage } from '../../../services/cloudService';
import { uploadLog } from '../../../lib/logger';

const MAX_FILE_MB = 2;

import { BANKS, MUSIC_OPTIONS } from '../../../lib/invitation-constants';

const STICKER_GROUPS = {
    'Cặp Đôi': ['💑', '👫', '💏', '🤵', '👰', '💍', '🥂', '🎊'],
    'Hoa': ['🌸', '🌺', '🌹', '🌷', '💐', '🌻', '🌼', '🪷'],
    'Tim': ['❤️', '💕', '💖', '💗', '💝', '🥰', '😍', '💞'],
    'Tiệc Cưới': ['✨', '🎉', '🥳', '🎀', '🎁', '🕊️', '🦋', '🌟'],
};

import { PhotoPositionEditor } from './PhotoPositionEditor';

const stripHtml = (html: string) => html ? html.replace(/<[^>]*>?/gm, '') : '';

const resolveImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return url;
    const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
    return url;
};

/* ── SECTION PANEL LABEL ── */
const PanelLabel: React.FC<{ label: string }> = ({ label }) => (
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</p>
);

/* ── PANEL INPUT ── */
const PInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white ${props.className || ''}`}
    />
);

const PTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white resize-none ${props.className || ''}`}
    />
);

/* ══════════════════════════════
   SECTION PANELS
══════════════════════════════ */

const HeroPanel: React.FC<{ data: InvitationData; onChange: (p: Partial<InvitationData>) => void }> = ({ data, onChange }) => {
    const { user } = useStore();
    const [uploading, setUploading] = useState(false);
    const [showStickers, setShowStickers] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []) as File[];
        e.target.value = '';
        const file = files[0];
        if (!file || !user?.uid) return;
        if (file.size > MAX_FILE_MB * 1048576) { alert(`Ảnh quá lớn (tối đa ${MAX_FILE_MB}MB)`); return; }
        setUploading(true);
        try {
            uploadLog.info('cover upload start', { name: file.name });
            const url = await uploadInvitationImage(file, user.uid);
            onChange({ couplePhoto: url, photoConfig: { scale: 1, x: 50, y: 50 } });
        } catch (err) {
            uploadLog.error('cover upload failed', err);
            alert('Tải ảnh lên thất bại. Vui lòng thử lại.');
        } finally { setUploading(false); }
    };

    return (
        <div className="space-y-4">
            {/* Couple names */}
            <div>
                <PanelLabel label="Tên Cặp Đôi" />
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <PInput placeholder="Tên Chú Rể" value={stripHtml(data.groomName || '')} onChange={e => onChange({ groomName: e.target.value })} />
                    <PInput placeholder="Tên Cô Dâu" value={stripHtml(data.brideName || '')} onChange={e => onChange({ brideName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <PInput placeholder="Tên ngắn (vd: Anh Ngọc)" value={stripHtml(data.groomShortName || '')} onChange={e => onChange({ groomShortName: e.target.value })} />
                    <PInput placeholder="Tên ngắn (vd: Diệu Ly)" value={stripHtml(data.brideShortName || '')} onChange={e => onChange({ brideShortName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <PInput placeholder="Danh xưng (vd: Chú Rể)" value={stripHtml(data.groomTitle || '')} onChange={e => onChange({ groomTitle: e.target.value })} />
                    <PInput placeholder="Danh xưng (vd: Cô Dâu)" value={stripHtml(data.brideTitle || '')} onChange={e => onChange({ brideTitle: e.target.value })} />
                </div>
                <div className="mt-2">
                    <PanelLabel label="Thứ tự hiển thị" />
                    <select
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white"
                        value={data.displayOrder || 'groom_first'}
                        onChange={e => onChange({ displayOrder: e.target.value as 'groom_first' | 'bride_first' })}
                    >
                        <option value="groom_first">Nhà trai trước (VD: Anh Ngọc & Diệu Ly)</option>
                        <option value="bride_first">Nhà gái trước (VD: Diệu Ly & Anh Ngọc)</option>
                    </select>
                </div>
            </div>
            {/* Date & time */}
            <div>
                <PanelLabel label="Ngày & Giờ" />
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <PInput type="date" value={data.date || ''} onChange={e => onChange({ date: e.target.value })} />
                    <PInput placeholder="Ngày âm lịch" value={data.lunarDate || ''} onChange={e => onChange({ lunarDate: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <PanelLabel label="Giờ đón khách" />
                        <PInput type="time" value={data.receptionTime || ''} onChange={e => onChange({ receptionTime: e.target.value })} />
                    </div>
                    <div>
                        <PanelLabel label="Giờ khai tiệc" />
                        <PInput type="time" value={data.time || ''} onChange={e => onChange({ time: e.target.value })} />
                    </div>
                </div>
            </div>
            {/* Wishes */}
            <div>
                <PanelLabel label="Lời Mời" />
                <PTextarea rows={2} placeholder="Lời chào mừng khách..." value={data.wishes || ''} onChange={e => onChange({ wishes: e.target.value })} />
            </div>
            {/* Cover photo */}
            <div>
                <PanelLabel label="Ảnh Bìa" />
                {data.couplePhoto ? (
                    <>
                        <PhotoPositionEditor
                            src={resolveImageUrl(data.couplePhoto) || ''}
                            config={data.photoConfig ?? { scale: 1, x: 50, y: 50 }}
                            onChange={c => onChange({ photoConfig: c })}
                            onRemove={() => onChange({ couplePhoto: undefined, photoConfig: undefined, heroOverlayOpacity: undefined })}
                        />
                        <div className="mt-4">
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-[10px] font-medium text-gray-600">Độ mờ nền (Giúp chữ dễ đọc hơn)</label>
                                <span className="text-[10px] text-gray-400">{data.heroOverlayOpacity ?? 0}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="80" 
                                step="5"
                                value={data.heroOverlayOpacity ?? 0} 
                                onChange={e => onChange({ heroOverlayOpacity: parseInt(e.target.value) })}
                                className="w-full accent-rose-500"
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <button
                            onClick={() => inputRef.current?.click()}
                            disabled={uploading}
                            className="w-full py-6 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-rose-300 hover:text-rose-400 transition-colors flex flex-col items-center gap-2"
                        >
                            <Upload size={20} />
                            {uploading ? 'Đang tải lên...' : 'Tải ảnh bìa lên'}
                        </button>
                        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                    </>
                )}
            </div>
            {/* Header sticker */}
            <div>
                <PanelLabel label="Sticker Tiêu Đề" />
                <button
                    onClick={() => setShowStickers(v => !v)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-rose-300 text-left flex items-center justify-between"
                >
                    <span>{data.headerSticker || 'Không có'}</span>
                    {showStickers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showStickers && (
                    <div className="mt-1 border border-gray-100 rounded-lg p-2 space-y-2 max-h-36 overflow-y-auto">
                        <button
                            onClick={() => { onChange({ headerSticker: '' }); setShowStickers(false); }}
                            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                        >✕ Xóa sticker</button>
                        {Object.entries(STICKER_GROUPS).map(([group, emojis]) => (
                            <div key={group}>
                                <p className="text-[10px] text-gray-400 px-1 mb-1">{group}</p>
                                <div className="flex flex-wrap gap-1">
                                    {emojis.map(e => (
                                        <button
                                            key={e}
                                            onClick={() => { onChange({ headerSticker: e }); setShowStickers(false); }}
                                            className={`text-lg p-1 rounded-lg hover:bg-rose-50 transition-colors ${data.headerSticker === e ? 'bg-rose-50 ring-1 ring-rose-200' : ''}`}
                                        >{e}</button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {/* Music */}
            <div>
                <PanelLabel label="Nhạc Nền" />
                <select
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white"
                    value={data.musicUrl || ''}
                    onChange={e => onChange({ musicUrl: e.target.value || undefined })}
                >
                    <option value="">— Không có nhạc —</option>
                    {MUSIC_OPTIONS.map(m => <option key={m.url} value={m.url}>{m.label}</option>)}
                </select>
            </div>
            {/* Countdown toggle */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Đếm ngược ngày cưới</span>
                <button
                    onClick={() => onChange({ countdownEnabled: !data.countdownEnabled })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${data.countdownEnabled !== false ? 'bg-rose-500' : 'bg-gray-200'}`}
                >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${data.countdownEnabled !== false ? 'left-5' : 'left-0.5'}`} />
                </button>
            </div>
        </div>
    );
};

const FamilyPanel: React.FC<{ data: InvitationData; onChange: (p: Partial<InvitationData>) => void }> = ({ data, onChange }) => {
    const gp = data.groomParents ?? { father: '', mother: '' };
    const bp = data.brideParents ?? { father: '', mother: '' };
    return (
        <div className="space-y-4">
            <div>
                <PanelLabel label="Thông Điệp Chung" />
                <div className="space-y-2">
                    <PInput placeholder="Tiêu đề (vd: Trân trọng kính mời)" value={stripHtml(data.inviteSectionTitle || '')} onChange={e => onChange({ inviteSectionTitle: e.target.value })} />
                    <PTextarea rows={2} placeholder="Lời mở đầu (vd: Sự hiện diện của...)" value={stripHtml(data.openingMessage || '')} onChange={e => onChange({ openingMessage: e.target.value })} />
                </div>
            </div>
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <PanelLabel label="Nhà Trai" />
                    <PInput className="py-1 px-2 text-xs w-32" placeholder="Nhãn cột (vd: NHÀ TRAI)" value={stripHtml(data.familySideGroom || '')} onChange={e => onChange({ familySideGroom: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <PInput placeholder="Danh xưng (vd: Ông Bà, Ông, Bà)" value={stripHtml(gp.title || '')} onChange={e => onChange({ groomParents: { ...gp, title: e.target.value } })} />
                    <PInput placeholder="Tên Cha (Bố Chú Rể)" value={stripHtml(gp.father || '')} onChange={e => onChange({ groomParents: { ...gp, father: e.target.value } })} />
                    <PInput placeholder="Tên Mẹ (Mẹ Chú Rể)" value={stripHtml(gp.mother || '')} onChange={e => onChange({ groomParents: { ...gp, mother: e.target.value } })} />
                    <PTextarea rows={2} placeholder="Địa chỉ nhà trai" value={stripHtml(gp.address || '')} onChange={e => onChange({ groomParents: { ...gp, address: e.target.value } })} />
                </div>
            </div>
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <PanelLabel label="Nhà Gái" />
                    <PInput className="py-1 px-2 text-xs w-32" placeholder="Nhãn cột (vd: NHÀ GÁI)" value={stripHtml(data.familySideBride || '')} onChange={e => onChange({ familySideBride: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <PInput placeholder="Danh xưng (vd: Ông Bà, Ông, Bà)" value={stripHtml(bp.title || '')} onChange={e => onChange({ brideParents: { ...bp, title: e.target.value } })} />
                    <PInput placeholder="Tên Cha (Bố Cô Dâu)" value={stripHtml(bp.father || '')} onChange={e => onChange({ brideParents: { ...bp, father: e.target.value } })} />
                    <PInput placeholder="Tên Mẹ (Mẹ Cô Dâu)" value={stripHtml(bp.mother || '')} onChange={e => onChange({ brideParents: { ...bp, mother: e.target.value } })} />
                    <PTextarea rows={2} placeholder="Địa chỉ nhà gái" value={stripHtml(bp.address || '')} onChange={e => onChange({ brideParents: { ...bp, address: e.target.value } })} />
                </div>
            </div>
            <div>
                <PanelLabel label="Sticker Phân Cách" />
                <div className="flex flex-wrap gap-1">
                    {['', '✦', '❦', '◈', '⚜', '❧', '✿', '💕', '💍'].map(s => (
                        <button key={s || 'none'} onClick={() => onChange({ dividerSticker: s || undefined })}
                            className={`px-2 py-1 text-sm rounded-lg border transition-colors ${data.dividerSticker === s ? 'bg-rose-50 border-rose-300' : 'border-gray-200 hover:border-rose-200'}`}
                        >{s || '✕'}</button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const VenuePanel: React.FC<{ data: InvitationData; onChange: (p: Partial<InvitationData>) => void }> = ({ data, onChange }) => (
    <div className="space-y-3">
        <div>
            <PanelLabel label="Tiêu Đề Phần" />
            <PInput placeholder="vd: Địa Điểm Tổ Chức" value={data.venueSectionTitle || ''} onChange={e => onChange({ venueSectionTitle: e.target.value })} />
        </div>
        <div>
            <PanelLabel label="Tên Địa Điểm" />
            <PInput placeholder="vd: Nhà Hàng Tiệc Cưới ABC" value={data.location || ''} onChange={e => onChange({ location: e.target.value })} />
        </div>
        <div>
            <PanelLabel label="Địa Chỉ" />
            <PTextarea rows={2} placeholder="Số nhà, đường, quận/huyện..." value={data.address || ''} onChange={e => onChange({ address: e.target.value })} />
        </div>
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <PanelLabel label="Hiển thị Bản đồ" />
                <button
                    onClick={() => onChange({ mapEnabled: !data.mapEnabled })}
                    className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${data.mapEnabled ? 'bg-rose-500' : 'bg-gray-200'}`}
                >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${data.mapEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                </button>
            </div>
            {data.mapEnabled && (
                <div className="mt-2 relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-rose-400">
                        <MapPin size={14} />
                    </div>
                    <input 
                        className="w-full bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-300 transition-all pl-8"
                        placeholder="https://maps.app.goo.gl/..." 
                        value={data.mapLink || ''} 
                        onChange={e => {
                            let val = e.target.value;
                            if (val.includes('<iframe') && val.includes('src="')) {
                                const match = val.match(/src="([^"]+)"/);
                                if (match && match[1]) {
                                    val = match[1];
                                }
                            }
                            onChange({ mapLink: val });
                        }}
                    />
                    <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-amber-400">
                        <Lightbulb size={14} />
                    </div>
                </div>
            )}
        </div>
    </div>
);

const EventsPanel: React.FC<{ data: InvitationData; onChange: (p: Partial<InvitationData>) => void }> = ({ data, onChange }) => {
    const events = data.events ?? [];
    const updateEvent = (id: string, patch: Partial<WeddingEvent>) => {
        onChange({ events: events.map(ev => ev.id === id ? { ...ev, ...patch } : ev) });
    };
    const addEvent = () => {
        const id = `ev_${Date.now()}`;
        onChange({ events: [...events, { id, title: 'Sự kiện mới', time: '08:00', date: data.date || '', lunarDate: '', location: '' }] });
    };
    const removeEvent = (id: string) => onChange({ events: events.filter(ev => ev.id !== id) });

    return (
        <div className="space-y-3">
            <div>
                <PanelLabel label="Tiêu Đề Phần" />
                <PInput placeholder="vd: Chương Trình Lễ Cưới" value={stripHtml(data.eventsSectionTitle || '')} onChange={e => onChange({ eventsSectionTitle: e.target.value })} />
            </div>
            {events.map(ev => (
                <div key={ev.id} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <PInput className="flex-1 text-sm font-medium" placeholder="Tên sự kiện" value={ev.title} onChange={e => updateEvent(ev.id, { title: e.target.value })} />
                        <button onClick={() => removeEvent(ev.id)} className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <PInput type="date" value={ev.date} onChange={e => updateEvent(ev.id, { date: e.target.value })} />
                        <PInput type="time" value={ev.time} onChange={e => updateEvent(ev.id, { time: e.target.value })} />
                    </div>
                    <PInput placeholder="Địa điểm" value={ev.location} onChange={e => updateEvent(ev.id, { location: e.target.value })} />
                </div>
            ))}
            <button onClick={addEvent} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-rose-300 hover:text-rose-400 flex items-center justify-center gap-1.5 transition-colors">
                <Plus size={14} /> Thêm sự kiện
            </button>
        </div>
    );
};

const GalleryPanel: React.FC<{ data: InvitationData; onChange: (p: Partial<InvitationData>) => void }> = ({ data, onChange }) => {
    const { user } = useStore();
    const [uploading, setUploading] = useState(false);
    const [croppingImageIndex, setCroppingImageIndex] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const galleryLinkRef = useRef<HTMLInputElement>(null);
    const images = data.galleryImages ?? [];
    const configs = data.galleryConfigs ?? [];

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileArray = Array.from(e.target.files ?? []) as File[];
        e.target.value = '';
        if (!fileArray.length || !user?.uid) return;
        const oversized = fileArray.filter(f => f.size > MAX_FILE_MB * 1048576);
        if (oversized.length) { alert(`${oversized.length} ảnh quá lớn (tối đa ${MAX_FILE_MB}MB mỗi ảnh)`); return; }
        setUploading(true);
        uploadLog.group(`gallery upload (${fileArray.length} files)`);
        try {
            const urls = await Promise.all(fileArray.map(f => uploadInvitationImage(f, user.uid)));
            onChange({ galleryImages: [...images, ...urls] });
        } catch (err) {
            uploadLog.error('gallery upload failed', err);
            alert('Tải ảnh lên thất bại. Vui lòng thử lại.');
        } finally {
            uploadLog.groupEnd();
            setUploading(false);
        }
    };

    const removeImage = (idx: number) => {
        const newImgs = [...images];
        newImgs.splice(idx, 1);
        const newCfgs = [...configs];
        if (newCfgs.length > idx) newCfgs.splice(idx, 1);
        onChange({ galleryImages: newImgs, galleryConfigs: newCfgs });
    };

    const handleAddLink = () => {
        let val = galleryLinkRef.current?.value.trim();
        if (val) {
            if (val.includes('drive.google.com/file/d/')) {
                const match = val.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                if (match && match[1]) val = `https://lh3.googleusercontent.com/d/${match[1]}`;
            }
            onChange({ galleryImages: [...images, val] });
            if (galleryLinkRef.current) galleryLinkRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <PanelLabel label="Tiêu Đề Phần" />
                <PInput placeholder="vd: Album Ảnh Cưới" value={data.gallerySectionTitle || ''} onChange={e => onChange({ gallerySectionTitle: e.target.value })} />
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
                <button className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${data.galleryStyle === 'grid' || !data.galleryStyle ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`} onClick={() => onChange({ galleryStyle: 'grid' })}>Lưới</button>
                <button className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${data.galleryStyle === 'collage' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`} onClick={() => onChange({ galleryStyle: 'collage' })}>Ghép ảnh</button>
                <button className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${data.galleryStyle === '3d' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`} onClick={() => onChange({ galleryStyle: '3d' })}>3D</button>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
                <button className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${data.galleryFit !== 'contain' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`} onClick={() => onChange({ galleryFit: 'cover' })}>Lấp đầy (Cắt ảnh)</button>
                <button className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${data.galleryFit === 'contain' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`} onClick={() => onChange({ galleryFit: 'contain' })}>Giữ tỷ lệ</button>
            </div>

            <div className="space-y-1">
                <PanelLabel label="Thêm ảnh qua Link" />
                <div className="flex gap-2">
                    <input
                        ref={galleryLinkRef}
                        type="text"
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                        placeholder="Dán link ảnh..."
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddLink(); }}
                    />
                    <button onClick={handleAddLink} className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600 transition-colors">Thêm</button>
                </div>
            </div>

            <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-rose-300 hover:text-rose-500 flex items-center justify-center gap-2 transition-colors"
            >
                <Upload size={16} />
                {uploading ? 'Đang tải lên...' : 'Tải ảnh từ thiết bị (tối đa 2MB)'}
            </button>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} />

            <div className="grid grid-cols-3 gap-2">
                {images.map((img, i) => {
                    const cfg = configs[i] || { scale: 1, x: 50, y: 50 };
                    return (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden group border border-gray-100 bg-gray-100">
                            <img src={resolveImageUrl(img)} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" loading="lazy"
                                style={{ objectPosition: `${cfg.x}% ${cfg.y}%`, transform: cfg.scale !== 1 ? `scale(${cfg.scale})` : undefined }}
                                onError={e => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).className = 'w-full h-full bg-gray-100 flex items-center justify-center'; }} />
                            
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                                <button onClick={() => setCroppingImageIndex(i)} className="text-white hover:text-blue-400 p-1"><Pencil size={14} /></button>
                                <button onClick={() => removeImage(i)} className="text-white hover:text-red-400 p-1"><Trash2 size={14} /></button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {croppingImageIndex !== null && images[croppingImageIndex] && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800 text-sm">Căn chỉnh vị trí</h3>
                            <button onClick={() => setCroppingImageIndex(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                        </div>
                        <div className="p-4">
                            <PhotoPositionEditor 
                                src={resolveImageUrl(images[croppingImageIndex]) || ''}
                                config={configs[croppingImageIndex] || { scale: 1, x: 50, y: 50 }}
                                onChange={(c) => {
                                    const cfgArr = [...(configs.length ? configs : Array(images.length).fill(null))];
                                    cfgArr[croppingImageIndex] = c;
                                    onChange({ galleryConfigs: cfgArr });
                                }}
                            />
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button onClick={() => setCroppingImageIndex(null)} className="px-5 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600">Xong</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const LoveStoryPanel: React.FC<{ data: InvitationData; onChange: (p: Partial<InvitationData>) => void }> = ({ data, onChange }) => {
    const { user } = useStore();
    const [uploading, setUploading] = useState<string | null>(null);
    const entries = data.loveStory ?? [];

    const update = (id: string, patch: Partial<LoveStoryEvent>) =>
        onChange({ loveStory: entries.map(ev => ev.id === id ? { ...ev, ...patch } : ev) });

    const add = () => {
        const id = `ls_${Date.now()}`;
        onChange({ loveStory: [...entries, { id, date: '', title: '', description: '' }] });
    };

    const remove = (id: string) => onChange({ loveStory: entries.filter(ev => ev.id !== id) });

    const handlePhotoUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []) as File[];
        e.target.value = '';
        const file = files[0];
        if (!file || !user?.uid) return;
        if (file.size > MAX_FILE_MB * 1048576) { alert(`Ảnh quá lớn (tối đa ${MAX_FILE_MB}MB)`); return; }
        setUploading(id);
        try {
            const url = await uploadInvitationImage(file, user.uid);
            update(id, { photo: url });
        } catch (err) {
            uploadLog.error('love story photo failed', err);
            alert('Tải ảnh lên thất bại.');
        } finally { setUploading(null); }
    };

    return (
        <div className="space-y-3">
            {entries.map(ev => {
                const photoInputRef = React.createRef<HTMLInputElement>();
                return (
                    <div key={ev.id} className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50">
                        <div className="flex gap-2">
                            <PInput className="flex-1" placeholder="Thời gian (vd: Tháng 3, 2022)" value={ev.date} onChange={e => update(ev.id, { date: e.target.value })} />
                            <button onClick={() => remove(ev.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                        <PInput placeholder="Tiêu đề" value={ev.title} onChange={e => update(ev.id, { title: e.target.value })} />
                        <PTextarea rows={2} placeholder="Câu chuyện..." value={ev.description} onChange={e => update(ev.id, { description: e.target.value })} />
                        {ev.photo ? (
                            <div className="relative h-20 rounded-lg overflow-hidden">
                                <img src={resolveImageUrl(ev.photo)} alt="Love story" className="w-full h-full object-cover" />
                                <button onClick={() => update(ev.id, { photo: undefined })} className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded-full"><X size={11} /></button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => photoInputRef.current?.click()}
                                    disabled={uploading === ev.id}
                                    className="w-full py-2 text-xs border border-dashed border-gray-200 rounded-lg text-gray-400 hover:border-rose-300 hover:text-rose-400 flex items-center justify-center gap-1"
                                >
                                    <Upload size={12} />{uploading === ev.id ? 'Đang tải...' : 'Thêm ảnh'}
                                </button>
                                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={e => handlePhotoUpload(ev.id, e)} />
                            </>
                        )}
                    </div>
                );
            })}
            <button onClick={add} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-rose-300 hover:text-rose-400 flex items-center justify-center gap-1.5 transition-colors">
                <Plus size={14} /> Thêm kỷ niệm
            </button>
        </div>
    );
};

const BankPanel: React.FC<{ data: InvitationData; onChange: (p: Partial<InvitationData>) => void }> = ({ data, onChange }) => {
    // If bankAccounts is undefined, fallback to a single item from bankInfo or empty
    const accounts = data.bankAccounts || (data.bankInfo?.bankId ? [data.bankInfo] : []);

    const updateAccount = (index: number, patch: Partial<BankInfo>) => {
        const list = [...accounts];
        list[index] = { ...list[index], ...patch };
        onChange({ bankAccounts: list });
    };

    const addAccount = () => {
        onChange({ bankAccounts: [...accounts, { bankId: '', accountNumber: '', accountName: '', title: '' }] });
    };

    const removeAccount = (index: number) => {
        const list = [...accounts];
        list.splice(index, 1);
        onChange({ bankAccounts: list });
    };

    return (
        <div className="space-y-4">
            <div>
                <PanelLabel label="Tiêu Đề Phần" />
                <PInput placeholder="vd: Gửi Quà Mừng" value={data.giftSectionTitle || ''} onChange={e => onChange({ giftSectionTitle: e.target.value })} />
            </div>
            {accounts.map((acc, index) => {
                const qrUrl = acc.bankId && acc.accountNumber
                    ? `https://img.vietqr.io/image/${acc.bankId}-${acc.accountNumber}-compact2.png?accountName=${encodeURIComponent(acc.accountName || '')}`
                    : null;

                return (
                    <div key={index} className="p-3 border border-gray-100 rounded-xl space-y-3 bg-gray-50 relative">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tài khoản {index + 1}</span>
                            <button onClick={() => removeAccount(index)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                        </div>
                        <div>
                            <PanelLabel label="Tiêu Đề (VD: Mừng cưới Chú Rể)" />
                            <PInput placeholder="Tiêu đề" value={acc.title || ''} onChange={e => updateAccount(index, { title: e.target.value })} />
                        </div>
                        <div>
                            <PanelLabel label="Ngân Hàng" />
                            <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white"
                                value={acc.bankId} onChange={e => updateAccount(index, { bankId: e.target.value })}
                            >
                                <option value="">— Chọn ngân hàng —</option>
                                {BANKS.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <PanelLabel label="Số Tài Khoản" />
                            <PInput placeholder="0123456789" value={acc.accountNumber} onChange={e => updateAccount(index, { accountNumber: e.target.value })} />
                        </div>
                        <div>
                            <PanelLabel label="Tên Chủ Tài Khoản" />
                            <PInput placeholder="NGUYEN VAN A" value={acc.accountName} onChange={e => updateAccount(index, { accountName: e.target.value.toUpperCase() })} />
                        </div>
                        {qrUrl && (
                            <div className="bg-white border border-gray-200 rounded-lg p-2 flex flex-col items-center gap-2 mt-2">
                                <p className="text-[10px] text-gray-400 font-medium uppercase">Preview QR</p>
                                <img src={qrUrl} alt="VietQR preview" className="w-32 h-auto rounded-lg" loading="lazy" />
                            </div>
                        )}
                    </div>
                );
            })}
            <button onClick={addAccount} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-rose-300 hover:text-rose-400 flex items-center justify-center gap-1.5 transition-colors">
                <Plus size={14} /> Thêm tài khoản
            </button>
        </div>
    );
};

const RSVPPanel: React.FC<{ data: InvitationData; onChange: (p: Partial<InvitationData>) => void }> = ({ data, onChange }) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Bật RSVP</span>
            <button
                onClick={() => onChange({ rsvpEnabled: !data.rsvpEnabled })}
                className={`w-10 h-5 rounded-full transition-colors relative ${data.rsvpEnabled ? 'bg-rose-500' : 'bg-gray-200'}`}
            >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${data.rsvpEnabled ? 'left-5' : 'left-0.5'}`} />
            </button>
        </div>
        {data.rsvpEnabled && (
            <>
                <div>
                    <PanelLabel label="Tiêu Đề Phần" />
                    <PInput placeholder="vd: Xác Nhận Tham Dự" value={data.rsvpSectionTitle || ''} onChange={e => onChange({ rsvpSectionTitle: e.target.value })} />
                </div>
                <div>
                    <PanelLabel label="Lời Nhắn" />
                    <PTextarea rows={2} placeholder="Sự hiện diện của quý khách..." value={data.rsvpMessage || ''} onChange={e => onChange({ rsvpMessage: e.target.value })} />
                </div>
                <div>
                    <PanelLabel label="Hạn Cuối Phản Hồi" />
                    <PInput type="date" value={data.rsvpDeadline || ''} onChange={e => onChange({ rsvpDeadline: e.target.value })} />
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-700">Cho phép chọn sự kiện tham dự</span>
                    <button
                        onClick={() => onChange({ rsvpMultiEvent: !data.rsvpMultiEvent })}
                        className={`w-8 h-4 rounded-full transition-colors relative ${data.rsvpMultiEvent ? 'bg-rose-500' : 'bg-gray-200'}`}
                    >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${data.rsvpMultiEvent ? 'left-4' : 'left-0.5'}`} />
                    </button>
                </div>
            </>
        )}
    </div>
);

const GuestbookPanel: React.FC<{ data: InvitationData; onChange: (p: Partial<InvitationData>) => void }> = ({ data, onChange }) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Bật Sổ Lưu Bút</span>
            <button
                onClick={() => onChange({ guestbookEnabled: !data.guestbookEnabled })}
                className={`w-10 h-5 rounded-full transition-colors relative ${data.guestbookEnabled ? 'bg-rose-500' : 'bg-gray-200'}`}
            >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${data.guestbookEnabled ? 'left-5' : 'left-0.5'}`} />
            </button>
        </div>
        {data.guestbookEnabled && (
            <>
                <p className="text-xs text-gray-400">Khách có thể để lại lời chúc trên trang thiệp của bạn.</p>
                <div className="mt-2">
                    <PanelLabel label="Tiêu Đề Phần" />
                    <PInput placeholder="vd: Sổ Lưu Bút" value={data.guestbookSectionTitle || ''} onChange={e => onChange({ guestbookSectionTitle: e.target.value })} />
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-700">Hiển thị ô nhập Email</span>
                    <button
                        onClick={() => onChange({ guestbookEmailEnabled: !data.guestbookEmailEnabled })}
                        className={`w-8 h-4 rounded-full transition-colors relative ${data.guestbookEmailEnabled ? 'bg-rose-500' : 'bg-gray-200'}`}
                    >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${data.guestbookEmailEnabled ? 'left-4' : 'left-0.5'}`} />
                    </button>
                </div>
            </>
        )}
    </div>
);

/* ══════════════════════════════
   NEW GLOBAL PANELS
══════════════════════════════ */

const ThankYouPanel: React.FC<{ data: InvitationData; onChange: (p: Partial<InvitationData>) => void }> = ({ data, onChange }) => (
    <div className="space-y-3">
        <PanelLabel label="Lời Cảm Ơn" />
        <PTextarea 
            rows={4} 
            placeholder="Sự hiện diện của quý khách là niềm vinh hạnh..." 
            value={data.thankYouMessage ?? ''} 
            onChange={e => onChange({ thankYouMessage: e.target.value })} 
        />
        <p className="text-[10px] text-gray-400">Để trống nếu không muốn hiển thị lời cảm ơn ở cuối thiệp.</p>
    </div>
);

const EnvelopePanel: React.FC<{ data: InvitationData; onChange: (p: Partial<InvitationData>) => void }> = ({ data, onChange }) => (
    <div className="space-y-3">
        <PanelLabel label="Lời Mời Trên Phong Bì" />
        <PInput 
            placeholder="VD: Thân Mời" 
            value={data.envelopeMessage ?? ''} 
            onChange={e => onChange({ envelopeMessage: e.target.value })} 
        />
    </div>
);

const DressCodePanel: React.FC<{ data: InvitationData; onChange: (p: Partial<InvitationData>) => void }> = ({ data, onChange }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Hiển thị Dress Code</span>
            <button
                onClick={() => onChange({ dressCodeEnabled: !data.dressCodeEnabled })}
                className={`w-10 h-5 rounded-full transition-colors relative ${data.dressCodeEnabled ? 'bg-rose-500' : 'bg-gray-200'}`}
            >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${data.dressCodeEnabled ? 'left-5' : 'left-0.5'}`} />
            </button>
        </div>
        {data.dressCodeEnabled && (
            <>
                <div>
                    <PanelLabel label="Tiêu Đề Phần" />
                    <PInput placeholder="vd: Dress Code" value={data.dressCodeSectionTitle || ''} onChange={e => onChange({ dressCodeSectionTitle: e.target.value })} />
                </div>
                <div>
                    <PanelLabel label="Lời nhắn gợi ý" />
                    <PTextarea 
                        rows={2} 
                        placeholder="Gợi ý trang phục cho khách mời..." 
                        value={data.dressCodeMessage ?? ''} 
                        onChange={e => onChange({ dressCodeMessage: e.target.value })} 
                    />
                </div>
                <div>
                    <PanelLabel label="Màu sắc gợi ý" />
                    <div className="flex flex-wrap gap-2">
                        {(data.dressCodeColors || []).map((c, i) => (
                            <div key={i} className="relative group">
                                <input
                                    type="color"
                                    value={c}
                                    onChange={e => {
                                        const colors = [...(data.dressCodeColors || [])];
                                        colors[i] = e.target.value;
                                        onChange({ dressCodeColors: colors });
                                    }}
                                    className="w-8 h-8 rounded-full border border-gray-200 cursor-pointer p-0"
                                />
                                <button
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gray-500 text-white rounded-full text-[9px] leading-none hidden group-hover:flex items-center justify-center"
                                    onClick={() => {
                                        const colors = [...(data.dressCodeColors || [])];
                                        colors.splice(i, 1);
                                        onChange({ dressCodeColors: colors });
                                    }}
                                >✕</button>
                            </div>
                        ))}
                        {(data.dressCodeColors || []).length < 8 && (
                            <button
                                className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 text-gray-400 text-lg flex items-center justify-center hover:border-rose-400 hover:text-rose-400 transition-colors"
                                onClick={() => onChange({ dressCodeColors: [...(data.dressCodeColors || []), '#cccccc'] })}
                            >+</button>
                        )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Để trống sẽ dùng bảng màu mặc định theo mẫu thiệp.</p>
                </div>
            </>
        )}
    </div>
);

/* ══════════════════════════════
   MAIN CONTEXT PANEL
══════════════════════════════ */

const PANEL_TITLES: Record<string, string> = {
    hero: 'Bìa Thiệp',
    family: 'Cha Mẹ Hai Bên',
    venue: 'Địa Điểm',
    events: 'Chương Trình',
    gallery: 'Album Ảnh',
    bank: 'Mừng Cưới / QR',
    rsvp: 'RSVP',
    guestbook: 'Sổ Lưu Bút',
    calendar: 'Lịch Ngày Cưới',
    opening: 'Lời Ngỏ',
    thankyou: 'Lời Cảm Ơn',
    envelope: 'Phong Bì',
    dresscode: 'Dress Code',
};

interface EditorContextPanelProps {
    selectedSection: string | null;
    data: InvitationData;
    onClose: () => void;
    onChange: (patch: Partial<InvitationData>) => void;
}

const EditorContextPanel: React.FC<EditorContextPanelProps> = ({ selectedSection, data, onClose, onChange }) => {
    const open = selectedSection !== null;

    return (
        <div
            className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${open ? 'w-72' : 'w-0'}`}
        >
            {open && selectedSection && (
                <div className="w-72 h-full flex flex-col border-l border-gray-100 bg-white">
                    {/* Panel header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                        <h3 className="text-sm font-semibold text-gray-800">
                            {PANEL_TITLES[selectedSection as SectionId] ?? selectedSection}
                        </h3>
                        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                    {/* Panel content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {selectedSection === 'hero'          && <HeroPanel data={data} onChange={onChange} />}
                        {selectedSection === 'family'        && <FamilyPanel data={data} onChange={onChange} />}
                        {selectedSection === 'venue'         && <VenuePanel data={data} onChange={onChange} />}
                        {selectedSection === 'events'        && <EventsPanel data={data} onChange={onChange} />}
                        {selectedSection === 'gallery'       && <GalleryPanel data={data} onChange={onChange} />}
                        {selectedSection === 'bank'          && <BankPanel data={data} onChange={onChange} />}
                        {selectedSection === 'rsvp'          && <RSVPPanel data={data} onChange={onChange} />}
                        {selectedSection === 'guestbook'     && <GuestbookPanel data={data} onChange={onChange} />}
                        {selectedSection === 'thankyou'      && <ThankYouPanel data={data} onChange={onChange} />}
                        {selectedSection === 'envelope'      && <EnvelopePanel data={data} onChange={onChange} />}
                        {selectedSection === 'dresscode'     && <DressCodePanel data={data} onChange={onChange} />}
                        {/* Phase-3 sections */}
                        {selectedSection === 'calendar'      && (
                            <div className="space-y-3">
                                <PanelLabel label="Lịch Ngày Cưới" />
                                <p className="text-xs text-gray-400">Lịch tự động tạo từ <strong>Ngày &amp; Giờ</strong> trong phần Bìa Thiệp. Chỉnh sửa ngày trong phần <span className="font-medium text-rose-500">Hero → Ngày &amp; Giờ</span>.</p>
                                <PanelLabel label="Ghi Chú Lịch (tùy chọn)" />
                                <PInput placeholder="VD: Ngày lành tháng tốt..." value={stripHtml(data.calendarNote || '')} onChange={e => onChange({ calendarNote: e.target.value })} />
                            </div>
                        )}
                        {selectedSection === 'opening'       && (
                            <div className="space-y-3">
                                <PanelLabel label="Tiêu Đề Lời Ngỏ" />
                                <PInput placeholder="Lời Ngỏ" value={stripHtml(data.openingTitle || '')} onChange={e => onChange({ openingTitle: e.target.value })} />
                                <PanelLabel label="Nội Dung Lời Ngỏ" />
                                <PTextarea rows={6} placeholder="Lời mở đầu cho thiệp cưới..." value={stripHtml(data.openingMessage || '')} onChange={e => onChange({ openingMessage: e.target.value })} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EditorContextPanel;
