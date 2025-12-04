import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { InvitationData, BankInfo, WeddingEvent } from '../../types';
import InvitationPreview from './InvitationPreview';
import {
    Palette, MapPin, Calendar, Heart, QrCode, Download, Share2,
    Save, Type, Image as ImageIcon, ExternalLink,
    ChevronDown, ChevronUp, Check, Music, Layers, Smartphone, Eye, Layout, Sparkles, Upload, Users, List, Plus, Trash2, Clock
} from 'lucide-react';
import html2canvas from 'html2canvas';

// Bank list for suggestions (shortened)
const BANKS = [
    { id: 'MB', name: 'MBBank' }, { id: 'VCB', name: 'Vietcombank' },
    { id: 'TCB', name: 'Techcombank' }, { id: 'ICB', name: 'VietinBank' },
    { id: 'BIDV', name: 'BIDV' }, { id: 'ACB', name: 'ACB' },
    { id: 'VPB', name: 'VPBank' }, { id: 'TPB', name: 'TPBank' },
];

const TEMPLATES = [
    { id: 'modern', name: 'Hiện Đại (Modern)', color: 'bg-white border-gray-200' },
    { id: 'luxury', name: 'Sang Trọng (Luxury)', color: 'bg-stone-900 border-yellow-600 text-white' },
    { id: 'traditional', name: 'Truyền Thống', color: 'bg-red-50 border-red-300' },
    { id: 'floral', name: 'Hoa Nhẹ Nhàng', color: 'bg-pink-50 border-pink-200' },
];

const InvitationManager: React.FC = () => {
    const { invitation, updateInvitation, user } = useStore();
    const [activeSection, setActiveSection] = useState<'GENERAL' | 'FAMILY' | 'BANK' | 'STYLE' | 'GALLERY' | 'EVENTS'>('GENERAL');
    const [isExporting, setIsExporting] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);
    const coverInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (field: keyof InvitationData, value: any) => {
        updateInvitation({ [field]: value });
    };

    const handleParentChange = (side: 'groomParents' | 'brideParents', role: 'father' | 'mother', value: string) => {
        const currentParents = invitation[side] || { father: '', mother: '' };
        updateInvitation({ [side]: { ...currentParents, [role]: value } });
    };

    const handleBankChange = (field: keyof BankInfo, value: any) => {
        updateInvitation({
            bankInfo: { ...invitation.bankInfo, [field]: value }
        });
    };

    // Cover Photo Upload Handler (Converts to Base64 to fix CORS export issue)
    const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check size (limit to 2MB for performance)
            if (file.size > 2 * 1024 * 1024) {
                alert("Vui lòng chọn ảnh dung lượng dưới 2MB để tối ưu tốc độ.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                handleChange('couplePhoto', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // Gallery Handling
    const handleAddGalleryImage = () => {
        const url = prompt("Nhập đường dẫn ảnh (URL):");
        if (url) {
            const currentGallery = invitation.galleryImages || [];
            handleChange('galleryImages', [...currentGallery, url]);
        }
    };

    const handleRemoveGalleryImage = (index: number) => {
        const currentGallery = invitation.galleryImages || [];
        const newGallery = currentGallery.filter((_, i) => i !== index);
        handleChange('galleryImages', newGallery);
    };

    // --- EVENTS HANDLING ---
    const handleApplyNorthernTemplate = () => {
        if (!invitation.date) {
            alert("Vui lòng chọn ngày cưới ở phần 'Thông tin chính' trước.");
            return;
        }

        const mainDate = new Date(invitation.date);
        const mealDate = new Date(mainDate);
        mealDate.setDate(mainDate.getDate() - 1); // Bữa cơm thân mật thường trước 1 ngày

        const fmtDate = (d: Date) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const fmtWeekday = (d: Date) => d.toLocaleDateString('vi-VN', { weekday: 'long' });

        const dateSolar = fmtDate(mainDate);
        const dateSolarMeal = fmtDate(mealDate);
        const weekday = fmtWeekday(mainDate);
        const dateLunar = invitation.lunarDate || "...";

        // Default structure for Northern Style based on specific template rules
        const northernEvents: WeddingEvent[] = [
            {
                id: 'evt-nap-tai',
                title: 'Lễ Nạp Tài',
                time: '08:30',
                date: invitation.date,
                location: 'Tư gia Nhà Gái',
                description: `Lễ Nạp Tài được cử hành vào hồi 08:30, ${weekday}, ngày ${dateSolar} (tức ngày ${dateLunar}) tại gia đình Nhà Gái.`
            },
            {
                id: 'evt-com-than-mat',
                title: 'Bữa Cơm Thân Mật',
                time: '17:30',
                date: mealDate.toISOString().split('T')[0],
                location: 'Tư gia Nhà Trai',
                description: `Tối dự bữa cơm thân mật chung vui cùng gia đình chúng tôi vào hồi 17:30, ngày ${dateSolarMeal} tại gia đình Nhà Trai.`
            },
            {
                id: 'evt-thanh-hon',
                title: 'Lễ Thành Hôn',
                time: invitation.time || '10:30',
                date: invitation.date,
                location: invitation.location,
                description: `Hôn lễ được cử hành vào hồi ${invitation.time || '10:30'}, ${weekday}, ngày ${dateSolar} (tức ngày ${dateLunar}) tại ${invitation.location}.`
            }
        ];

        handleChange('events', northernEvents);
        // Also auto-switch to Traditional template if not already
        if (invitation.templateId !== 'traditional') {
            handleChange('templateId', 'traditional');
        }
        alert("Đã áp dụng mẫu Lễ Bắc Bộ thành công!\n(Đã tự động tính ngày Bữa Cơm Thân Mật vào hôm trước).");
    };

    const handleUpdateEvent = (index: number, field: keyof WeddingEvent, value: string) => {
        const currentEvents = [...(invitation.events || [])];
        currentEvents[index] = { ...currentEvents[index], [field]: value };
        handleChange('events', currentEvents);
    };

    const handleRemoveEvent = (index: number) => {
        const currentEvents = [...(invitation.events || [])];
        currentEvents.splice(index, 1);
        handleChange('events', currentEvents);
    };

    const handleAddEvent = () => {
        const newEvent: WeddingEvent = {
            id: `evt-${Date.now()}`,
            title: 'Sự kiện mới',
            time: '00:00',
            date: invitation.date,
            location: 'Địa điểm',
            description: 'Mô tả chi tiết...'
        };
        handleChange('events', [...(invitation.events || []), newEvent]);
    };

    const handleDownloadQR = async () => {
        if (!qrRef.current) return;
        setIsExporting(true);

        // Wait a bit to ensure images are rendered if just switched
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            const canvas = await html2canvas(qrRef.current, {
                scale: 3, // High resolution
                backgroundColor: null,
                useCORS: true, // IMPORTANT for external images
                allowTaint: true, // Allow tainted images (might break security but needed for some URLs)
                logging: false,
                ignoreElements: (element) => element.classList.contains('no-export')
            });

            const link = document.createElement('a');
            link.download = `WedPlan_QR_${user?.displayName || 'Invite'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Export Error:", err);
            alert("Lỗi khi tải ảnh. Hãy thử tải ảnh bìa lên trực tiếp thay vì dùng Link URL.");
        } finally {
            setIsExporting(false);
        }
    };

    const publicLink = `${window.location.origin}/?view=invitation&uid=${user?.uid}`;

    const SectionToggle = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveSection(activeSection === id ? null : id)}
            className={`w-full flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors ${activeSection === id ? 'text-rose-600 font-bold bg-rose-50/50 shadow-inner' : 'text-gray-700 font-medium'}`}
        >
            <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${activeSection === id ? 'text-rose-500' : 'text-gray-400'}`} />
                <span>{label}</span>
            </div>
            {activeSection === id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
    );

    return (
        <div className="flex flex-col lg:flex-row h-full bg-gray-100 overflow-hidden font-sans">

            {/* LEFT: EDITOR SIDEBAR */}
            <div className="w-full lg:w-[400px] xl:w-[450px] bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto z-20 shadow-xl scrollbar-thin scrollbar-thumb-gray-200">
                <div className="p-5 border-b border-gray-100 bg-white sticky top-0 z-30 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Layers className="w-6 h-6 text-rose-500" /> Thiết Kế Thiệp
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">Chuyên nghiệp • Hiện đại • Trang trọng</p>
                    </div>
                    <div className="lg:hidden">
                        <a href={publicLink} target="_blank" className="bg-rose-100 text-rose-600 p-2 rounded-lg"><Eye className="w-5 h-5" /></a>
                    </div>
                </div>

                <div className="flex-1 pb-20">
                    {/* SECTION 1: STYLE & TEMPLATES */}
                    <SectionToggle id="STYLE" label="Giao diện & Ảnh bìa" icon={Palette} />
                    {activeSection === 'STYLE' && (
                        <div className="p-5 space-y-6 bg-gray-50 animate-fadeIn">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-1"><Layout className="w-3 h-3" /> Chọn Phong Cách Thiệp</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {TEMPLATES.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => handleChange('templateId', t.id)}
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${invitation.templateId === t.id ? 'border-rose-500 ring-1 ring-rose-200 shadow-md' : 'border-gray-200 hover:border-gray-300'} ${t.color}`}
                                        >
                                            <span className="block text-xs font-bold">{t.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Màu Chủ Đạo (Accent)</label>
                                <div className="flex flex-wrap gap-3">
                                    {[
                                        { hex: '#e11d48', name: 'Rose' },
                                        { hex: '#c084fc', name: 'Purple' },
                                        { hex: '#3b82f6', name: 'Blue' },
                                        { hex: '#10b981', name: 'Emerald' },
                                        { hex: '#f59e0b', name: 'Gold' },
                                        { hex: '#1f2937', name: 'Dark' },
                                        { hex: '#9f1239', name: 'Wine' },
                                        { hex: '#854d0e', name: 'Bronze' }
                                    ].map(color => (
                                        <button key={color.hex} onClick={() => handleChange('themeColor', color.hex)}
                                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 shadow-sm ${invitation.themeColor === color.hex ? 'border-gray-600 scale-110 ring-2 ring-gray-200' : 'border-transparent'}`}
                                            style={{ backgroundColor: color.hex }} title={color.name}>
                                            {invitation.themeColor === color.hex && <Check className="w-5 h-5 text-white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Ảnh Cưới (Cover/Header)</label>

                                {/* File Upload Input Hidden */}
                                <input
                                    type="file"
                                    ref={coverInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleCoverUpload}
                                />

                                <div className="flex gap-2">
                                    <div className="relative group flex-1">
                                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none"
                                            value={invitation.couplePhoto || ''} onChange={e => handleChange('couplePhoto', e.target.value)} placeholder="Nhập URL hoặc tải lên..." />
                                    </div>
                                    <button
                                        onClick={() => coverInputRef.current?.click()}
                                        className="bg-white border border-gray-200 hover:border-rose-300 text-gray-600 hover:text-rose-500 px-3 rounded-lg shadow-sm transition-colors"
                                        title="Tải ảnh từ máy"
                                    >
                                        <Upload className="w-5 h-5" />
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1 italic">* Mẹo: Sử dụng nút tải lên để đảm bảo ảnh hiển thị tốt khi xuất QR.</p>

                                {invitation.couplePhoto && (
                                    <div className="mt-2 w-full h-32 rounded-lg overflow-hidden border border-gray-200 relative group">
                                        <img src={invitation.couplePhoto} className="w-full h-full object-cover" alt="Preview" />
                                        <button
                                            onClick={() => handleChange('couplePhoto', '')}
                                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Nhạc Nền (URL mp3)</label>
                                <div className="relative">
                                    <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none"
                                        value={invitation.musicUrl || ''} onChange={e => handleChange('musicUrl', e.target.value)} placeholder="https://example.com/music.mp3" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 2: GENERAL INFO */}
                    <SectionToggle id="GENERAL" label="Thông tin chính" icon={Type} />
                    {activeSection === 'GENERAL' && (
                        <div className="p-5 space-y-4 bg-gray-50 animate-fadeIn">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tên Chú Rể</label>
                                    <input className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none font-bold"
                                        value={invitation.groomName} onChange={e => handleChange('groomName', e.target.value)} placeholder="Nguyễn Văn A" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tên Cô Dâu</label>
                                    <input className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none font-bold"
                                        value={invitation.brideName} onChange={e => handleChange('brideName', e.target.value)} placeholder="Trần Thị B" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ngày Cưới (Dương)</label>
                                    <input type="date" className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none"
                                        value={invitation.date} onChange={e => handleChange('date', e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Giờ Đón Khách</label>
                                    <input type="time" className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none"
                                        value={invitation.time} onChange={e => handleChange('time', e.target.value)} />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ngày Âm Lịch</label>
                                <input className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none italic"
                                    value={invitation.lunarDate || ''} onChange={e => handleChange('lunarDate', e.target.value)} placeholder="Ví dụ: Ngày 10 tháng 11 năm Ất Tỵ" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tên Nhà Hàng / Tư Gia</label>
                                <input className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none font-bold"
                                    value={invitation.location} onChange={e => handleChange('location', e.target.value)} placeholder="Trung Tâm Tiệc Cưới..." />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Địa chỉ chi tiết</label>
                                <input className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none"
                                    value={invitation.address} onChange={e => handleChange('address', e.target.value)} placeholder="Số 1, Đường..." />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Link Google Maps</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none text-blue-600 underline"
                                        value={invitation.mapLink || ''} onChange={e => handleChange('mapLink', e.target.value)} placeholder="https://maps.google.com/..." />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Lời Mời / Lời Chúc</label>
                                <textarea className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none h-24 resize-none"
                                    value={invitation.wishes} onChange={e => handleChange('wishes', e.target.value)} placeholder="Rất hân hạnh được đón tiếp..." />
                            </div>
                        </div>
                    )}

                    {/* SECTION 2.5: EVENTS (NEW) */}
                    <SectionToggle id="EVENTS" label="Lịch trình & Lễ" icon={List} />
                    {activeSection === 'EVENTS' && (
                        <div className="p-5 space-y-4 bg-gray-50 animate-fadeIn">
                            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg">
                                <h4 className="text-sm font-bold text-rose-800 mb-2">Tạo lịch trình tự động</h4>
                                <button
                                    onClick={handleApplyNorthernTemplate}
                                    className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-3 h-3" /> Áp dụng mẫu Bắc Bộ (3 Lễ)
                                </button>
                                <p className="text-[10px] text-rose-600 mt-2 italic">
                                    Gồm: Lễ Nạp Tài, Bữa Cơm Thân Mật (hôm trước) và Lễ Thành Hôn.
                                </p>
                            </div>

                            <div className="space-y-4">
                                {(invitation.events || []).map((evt, idx) => (
                                    <div key={evt.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm relative">
                                        <button onClick={() => handleRemoveEvent(idx)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </button>

                                        <div className="mb-2 pr-6">
                                            <input
                                                className="font-bold text-sm text-gray-800 w-full outline-none border-b border-transparent focus:border-gray-300"
                                                value={evt.title}
                                                onChange={(e) => handleUpdateEvent(idx, 'title', e.target.value)}
                                                placeholder="Tên sự kiện..."
                                            />
                                        </div>

                                        <div className="flex gap-2 mb-2">
                                            <div className="flex-1 flex items-center bg-gray-50 px-2 rounded">
                                                <Clock className="w-3 h-3 text-gray-400 mr-2" />
                                                <input
                                                    className="bg-transparent text-xs py-1.5 w-full outline-none"
                                                    value={evt.time}
                                                    onChange={(e) => handleUpdateEvent(idx, 'time', e.target.value)}
                                                    placeholder="Giờ..."
                                                />
                                            </div>
                                            <div className="flex-1 flex items-center bg-gray-50 px-2 rounded">
                                                <MapPin className="w-3 h-3 text-gray-400 mr-2" />
                                                <input
                                                    className="bg-transparent text-xs py-1.5 w-full outline-none"
                                                    value={evt.location}
                                                    onChange={(e) => handleUpdateEvent(idx, 'location', e.target.value)}
                                                    placeholder="Địa điểm..."
                                                />
                                            </div>
                                        </div>

                                        <textarea
                                            className="w-full text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 outline-none focus:border-rose-200 resize-none h-16"
                                            value={evt.description}
                                            onChange={(e) => handleUpdateEvent(idx, 'description', e.target.value)}
                                            placeholder="Lời dẫn chi tiết..."
                                        />
                                    </div>
                                ))}

                                <button
                                    onClick={handleAddEvent}
                                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-rose-300 hover:text-rose-500 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                                >
                                    <Plus className="w-3 h-3" /> Thêm sự kiện khác
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SECTION 3: FAMILY INFO */}
                    <SectionToggle id="FAMILY" label="Thông tin gia đình" icon={Users} />
                    {activeSection === 'FAMILY' && (
                        <div className="p-5 space-y-4 bg-gray-50 animate-fadeIn">
                            <div className="border-l-2 border-blue-300 pl-3">
                                <h4 className="text-sm font-bold text-blue-800 mb-2">Nhà Trai</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    <input className="w-full p-2 rounded border border-gray-200 text-sm focus:border-blue-500 outline-none"
                                        value={invitation.groomParents?.father || ''} onChange={e => handleParentChange('groomParents', 'father', e.target.value)} placeholder="Ông: Trần Văn A" />
                                    <input className="w-full p-2 rounded border border-gray-200 text-sm focus:border-blue-500 outline-none"
                                        value={invitation.groomParents?.mother || ''} onChange={e => handleParentChange('groomParents', 'mother', e.target.value)} placeholder="Bà: Nguyễn Thị B" />
                                </div>
                            </div>

                            <div className="border-l-2 border-pink-300 pl-3">
                                <h4 className="text-sm font-bold text-pink-800 mb-2">Nhà Gái</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    <input className="w-full p-2 rounded border border-gray-200 text-sm focus:border-pink-500 outline-none"
                                        value={invitation.brideParents?.father || ''} onChange={e => handleParentChange('brideParents', 'father', e.target.value)} placeholder="Ông: Lê Văn C" />
                                    <input className="w-full p-2 rounded border border-gray-200 text-sm focus:border-pink-500 outline-none"
                                        value={invitation.brideParents?.mother || ''} onChange={e => handleParentChange('brideParents', 'mother', e.target.value)} placeholder="Bà: Phạm Thị D" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECTION 4: GALLERY */}
                    <SectionToggle id="GALLERY" label="Album Ảnh" icon={ImageIcon} />
                    {activeSection === 'GALLERY' && (
                        <div className="p-5 bg-gray-50 animate-fadeIn">
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {(invitation.galleryImages || []).map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                        <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                                        <button onClick={() => handleRemoveGalleryImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="sr-only">Xóa</span>
                                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                                <button onClick={handleAddGalleryImage} className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-rose-400 hover:text-rose-500 transition-colors bg-white">
                                    <ImageIcon className="w-6 h-6 mb-1" />
                                    <span className="text-[10px] font-bold uppercase">Thêm ảnh</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 text-center">Khuyên dùng: Ảnh kích thước dưới 1MB để tải nhanh.</p>
                        </div>
                    )}

                    {/* SECTION 5: BANKING */}
                    <SectionToggle id="BANK" label="Ngân hàng & Mừng cưới" icon={QrCode} />
                    {activeSection === 'BANK' && (
                        <div className="p-5 space-y-4 bg-gray-50 animate-fadeIn">
                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 flex gap-2 items-start">
                                <QrCode className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <p>Mã VietQR sẽ được tạo tự động. Khách mời có thể quét để chuyển khoản chính xác nội dung mừng cưới.</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ngân hàng</label>
                                <select className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none bg-white"
                                    value={invitation.bankInfo.bankId} onChange={e => handleBankChange('bankId', e.target.value)}>
                                    <option value="">-- Chọn ngân hàng --</option>
                                    {BANKS.map(b => <option key={b.id} value={b.id}>{b.name} ({b.id})</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Số tài khoản</label>
                                <input className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none font-mono"
                                    value={invitation.bankInfo.accountNumber} onChange={e => handleBankChange('accountNumber', e.target.value)} placeholder="0123456789" />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tên chủ tài khoản (Viết tắt)</label>
                                <input className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:border-rose-500 outline-none uppercase"
                                    value={invitation.bankInfo.accountName} onChange={e => handleBankChange('accountName', e.target.value)} placeholder="NGUYEN VAN A" />
                            </div>
                        </div>
                    )}
                </div>

                {/* SIDEBAR FOOTER */}
                <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex gap-2">
                        <a
                            href={publicLink}
                            target="_blank"
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-bold transition-all shadow-sm text-sm"
                        >
                            <ExternalLink className="w-4 h-4" /> Xem Thực Tế
                        </a>
                        <button
                            className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-sm"
                            onClick={() => alert("Đã lưu thay đổi!")}
                        >
                            <Save className="w-4 h-4" /> Lưu Thiệp
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT: PREVIEW AREA */}
            <div className="flex-1 bg-slate-100 flex flex-col h-full relative overflow-hidden">
                {/* Top Bar for Desktop */}
                <div className="hidden lg:flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm z-10">
                    <span className="text-sm font-bold text-gray-500 flex items-center gap-2">
                        <Smartphone className="w-4 h-4" /> Xem trước giao diện điện thoại
                    </span>
                    <span className="text-xs text-rose-500 font-medium px-3 py-1 bg-rose-50 rounded-full animate-pulse">
                        Live Preview
                    </span>
                </div>

                {/* Phone Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-start justify-center relative">
                    {/* Phone Frame Mockup */}
                    <div className="w-[375px] h-[812px] bg-black rounded-[3rem] border-[8px] border-black shadow-2xl overflow-hidden relative ring-4 ring-gray-300 shrink-0 my-auto">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-black rounded-b-2xl z-50"></div>
                        <div className="w-full h-full bg-white overflow-y-auto no-scrollbar">
                            <InvitationPreview data={invitation} />
                        </div>
                    </div>
                </div>

                {/* EXPORT QR CARD (Customized for Request) */}
                <div className="absolute top-20 right-8 z-30 hidden xl:block animate-fade-in-left">
                    <div className="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 w-80 backdrop-blur-xl bg-white/95">
                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Download className="w-4 h-4 text-rose-500" /> QR Check-in</h4>

                        {/* --- THE CARD TO BE EXPORTED --- */}
                        <div ref={qrRef} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 relative flex flex-col h-[400px]">
                            {/* Image Background Header */}
                            <div className="h-1/2 relative bg-gray-100 overflow-hidden">
                                {invitation.couplePhoto ? (
                                    <img
                                        src={invitation.couplePhoto}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous" // IMPORTANT FOR HTML2CANVAS
                                        alt="Cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-rose-100 text-rose-300"><Heart className="w-12 h-12 fill-current" /></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-2">
                                    <p className="text-white font-bold text-xs uppercase tracking-widest text-shadow opacity-90">Save The Date</p>
                                </div>
                            </div>

                            {/* QR Code Section */}
                            <div className="h-1/2 bg-white flex flex-col items-center justify-center p-4 relative">
                                {/* QR */}
                                <div className="border-4 border-rose-500 rounded-lg p-1 mb-2 bg-white shadow-md -mt-12 relative z-10">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publicLink)}&color=000000`}
                                        alt="QR Code"
                                        className="w-24 h-24 object-contain"
                                        crossOrigin="anonymous"
                                    />
                                </div>

                                {/* Text: NO NAMES, Just Generic Title as requested */}
                                <h3 className="text-rose-600 font-bold text-lg uppercase tracking-wide mb-1">Thiệp Mời Cưới Online</h3>
                                <p className="text-[10px] text-gray-400 mb-3">Quét mã để xem thiệp & gửi lời chúc</p>

                                {/* Footer Ads */}
                                <div className="mt-auto pt-2 border-t border-gray-100 w-full text-center">
                                    <p className="text-[8px] text-gray-400 font-bold flex items-center justify-center gap-1">
                                        <Sparkles className="w-2 h-2 text-rose-500" /> wedplanai.io.vn
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* ------------------------------- */}

                        <button
                            onClick={handleDownloadQR}
                            disabled={isExporting}
                            className="w-full mt-4 bg-gray-900 hover:bg-black text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                        >
                            {isExporting ? "Đang xử lý..." : "Tải ảnh QR về máy"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvitationManager;