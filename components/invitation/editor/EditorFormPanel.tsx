import React, { useState } from 'react';
import { 
    ChevronDown, ChevronUp, Upload, Trash2, Plus, GripVertical, Image as ImageIcon, MapPin, Clock, Calendar, Music2 
} from 'lucide-react';
import { InvitationData, WeddingEvent } from '../../../types';
import { uploadInvitationImage } from '../../../services/cloudService';
import { useStore } from '../../../store/useStore';
import { MUSIC_OPTIONS } from '../../../lib/invitation-constants';
import { compressImage } from '../../../lib/imageUtils';
import { PhotoPositionEditor } from './PhotoPositionEditor';

interface EditorFormPanelProps {
    data: InvitationData;
    onChange: (patch: Partial<InvitationData>) => void;
    selectedSection?: string | null;
}

const EditorFormPanel: React.FC<EditorFormPanelProps> = ({ data, onChange, selectedSection }) => {
    const { user } = useStore();
    const [expandedSection, setExpandedSection] = useState<string | null>('basicInfo');
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const heroInputRef = React.useRef<HTMLInputElement>(null);
    const galleryLinkRef = React.useRef<HTMLInputElement>(null);

    const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []) as File[];
        e.target.value = '';
        const file = files[0];
        if (!file || !user?.uid) return;
        if (file.size > 2 * 1048576) { alert('Ảnh quá lớn (tối đa 2MB)'); return; }
        setUploadingField('hero');
        try {
            const url = await uploadInvitationImage(file, user.uid);
            onChange({ couplePhoto: url, photoConfig: { scale: 1, x: 50, y: 50 } });
        } catch (err) {
            console.error('cover upload failed', err);
            alert('Tải ảnh lên thất bại. Vui lòng thử lại.');
        } finally { setUploadingField(null); }
    };

    React.useEffect(() => {
        if (selectedSection) {
            // Map preview section IDs to form accordion IDs
            const sectionMap: Record<string, string> = {
                'hero': 'basicInfo',
                'family': 'familyInfo',
                'venue': 'party',
                'events': 'timeline',
                'loveStory': 'opening', // Fallback
                'gallery': 'gallery',
                'bank': 'bank',
                'rsvp': 'rsvp',
                'guestbook': 'guestbook'
            };
            
            const formSection = sectionMap[selectedSection] || selectedSection;
            setExpandedSection(formSection);
            
            // Scroll the element into view if needed
            setTimeout(() => {
                const el = document.getElementById(`accordion-${formSection}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    // Optional visual highlight blink
                    el.classList.add('bg-rose-50');
                    setTimeout(() => el.classList.remove('bg-rose-50'), 600);
                }
            }, 100);
        }
    }, [selectedSection]);

    const toggleSection = (section: string) => {
        setExpandedSection(prev => prev === section ? null : section);
    };



    const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []) as File[];
        if (files.length === 0) return;

        if (!user) {
            alert('Không tìm thấy thông tin người dùng. Vui lòng tải lại trang.');
            return;
        }

        // Validate file types before starting (MIME type check — handles HEIC/HEIF etc.)
        const invalidFiles = files.filter(f => !f.type.startsWith('image/'));
        if (invalidFiles.length > 0) {
            alert(`Tệp không hợp lệ: ${invalidFiles.map(f => f.name).join(', ')}\nChỉ chấp nhận định dạng ảnh.`);
            e.target.value = '';
            return;
        }

        setUploadingField('galleryImages');
        try {
            const newUrls = await Promise.all(
                files.map(async (file) => {
                    const compressedFile = await compressImage(file, 1.5, 1500);
                    return uploadInvitationImage(compressedFile, user.uid);
                })
            );
            onChange({ galleryImages: [...(data.galleryImages || []), ...newUrls] });
        } catch (error) {
            console.error('Lỗi upload ảnh thư viện:', error);
            const msg = error instanceof Error ? error.message : 'Lỗi không xác định';
            alert(`Tải ảnh thất bại: ${msg}\n\nGợi ý: Thử thêm ảnh qua Link URL thay vì tải lên.`);
        } finally {
            setUploadingField(null);
            e.target.value = '';
        }
    };

    const handleEventChange = (index: number, field: keyof WeddingEvent, value: string) => {
        const events = [...(data.events || [])];
        events[index] = { ...events[index], [field]: value };
        onChange({ events });
    };

    const addEvent = () => {
        const events = [...(data.events || [])];
        events.push({
            id: `ev-${Date.now()}`,
            title: 'Sự kiện mới',
            time: '18:00',
            date: data.date || '',
            location: data.location || ''
        });
        onChange({ events });
    };

    const removeEvent = (index: number) => {
        const events = [...(data.events || [])];
        events.splice(index, 1);
        onChange({ events });
    };

    const AccordionHeader = ({ title, id, icon: Icon }: { title: string; id: string; icon?: any }) => (
        <button 
            id={`accordion-${id}`}
            onClick={() => toggleSection(id)}
            className="flex items-center justify-between w-full px-4 py-3 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
        >
            <div className="flex items-center gap-2 text-gray-800 font-medium text-sm">
                {Icon && <Icon size={16} className="text-gray-500" />}
                {title}
            </div>
            {expandedSection === id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
    );

    return (
        <div className="w-[420px] bg-gray-50 border-r border-gray-200 flex flex-col h-full overflow-y-auto shrink-0 shadow-sm custom-scrollbar">
            <div className="p-4 bg-white border-b border-gray-200 shrink-0 sticky top-0 z-10">
                <h2 className="text-base font-semibold text-gray-800">Chỉnh Sửa Thông Tin</h2>
                <p className="text-xs text-gray-500 mt-1">Cập nhật thông tin chi tiết cho thiệp cưới</p>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* 1. Thông tin cơ bản */}
                <div className="bg-white mb-2 border-b border-gray-200">
                    <AccordionHeader title="Thông tin cơ bản" id="basicInfo" />
                    {expandedSection === 'basicInfo' && (
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Danh xưng chú rể</label>
                                    <input 
                                        type="text" 
                                        value={data.groomTitle || ''} 
                                        onChange={e => onChange({ groomTitle: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        placeholder="Trưởng Nam"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Danh xưng cô dâu</label>
                                    <input 
                                        type="text" 
                                        value={data.brideTitle || ''} 
                                        onChange={e => onChange({ brideTitle: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        placeholder="Út Nữ"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Họ tên chú rể</label>
                                    <input 
                                        type="text" 
                                        value={data.groomName || ''} 
                                        onChange={e => onChange({ groomName: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        placeholder="VD: Nguyễn Thế Bảo"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Họ tên cô dâu</label>
                                    <input 
                                        type="text" 
                                        value={data.brideName || ''} 
                                        onChange={e => onChange({ brideName: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        placeholder="VD: Trần Ngọc Ánh"
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Tên ngắn chú rể</label>
                                    <input 
                                        type="text" 
                                        value={data.groomShortName || ''} 
                                        onChange={e => onChange({ groomShortName: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        placeholder="Thế Bảo"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Tên ngắn cô dâu</label>
                                    <input 
                                        type="text" 
                                        value={data.brideShortName || ''} 
                                        onChange={e => onChange({ brideShortName: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        placeholder="Ngọc Ánh"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-600">Thứ tự hiển thị</label>
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button 
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${data.displayOrder !== 'bride_first' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
                                        onClick={() => onChange({ displayOrder: 'groom_first' })}
                                    >Nhà trai trước</button>
                                    <button 
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${data.displayOrder === 'bride_first' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}
                                        onClick={() => onChange({ displayOrder: 'bride_first' })}
                                    >Nhà gái trước</button>
                                </div>
                            </div>
                            
                            {/* Thời gian & Địa điểm (cơ bản) */}
                            <div className="pt-4 mt-2 border-t border-gray-100 space-y-4">
                                <div className="text-xs font-semibold text-gray-700">Thời gian & Địa điểm cưới</div>
                                
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-gray-600 flex items-center gap-1"><Calendar size={12}/> Ngày tổ chức</label>
                                    <input 
                                        type="date" 
                                        value={data.date || ''} 
                                        onChange={e => onChange({ date: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-gray-600 flex items-center gap-1"><Clock size={12}/> Đón khách</label>
                                        <input 
                                            type="time" 
                                            value={data.receptionTime || ''} 
                                            onChange={e => onChange({ receptionTime: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-gray-600 flex items-center gap-1"><Clock size={12}/> Khai tiệc</label>
                                        <input 
                                            type="time" 
                                            value={data.time || ''} 
                                            onChange={e => onChange({ time: e.target.value })}
                                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-gray-600 flex items-center gap-1"><MapPin size={12}/> Tên Nhà Hàng / Địa điểm</label>
                                    <input 
                                        type="text" 
                                        value={data.location || ''} 
                                        onChange={e => onChange({ location: e.target.value })}
                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        placeholder="Ví dụ: Trống Đồng Palace"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-gray-600 flex items-center gap-1"><MapPin size={12}/> Địa chỉ chi tiết</label>
                                    <textarea 
                                        value={data.address || ''} 
                                        onChange={e => onChange({ address: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none h-16"
                                        placeholder="Ví dụ: Số 123 Đường ABC..."
                                    />
                                </div>
                            </div>

                            {/* Khối Ảnh Bìa */}
                            <div className="pt-4 mt-2 border-t border-gray-100 space-y-4">
                                <div className="text-xs font-semibold text-gray-700">Ảnh Bìa</div>
                                {data.couplePhoto ? (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-medium text-gray-600">Hoặc thay ảnh bằng URL (Link ảnh)</label>
                                            <input 
                                                type="text" 
                                                value={data.couplePhoto} 
                                                onChange={e => onChange({ couplePhoto: e.target.value })}
                                                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <PhotoPositionEditor
                                            src={data.couplePhoto}
                                            config={data.photoConfig ?? { scale: 1, x: 50, y: 50 }}
                                            onChange={c => onChange({ photoConfig: c })}
                                            onRemove={() => onChange({ couplePhoto: undefined, photoConfig: undefined, heroOverlayOpacity: undefined })}
                                        />
                                        <div className="space-y-1 pt-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-[10px] font-medium text-gray-600">Độ mờ nền ảnh (Tự động mờ từ dưới lên)</label>
                                                <span className="text-[10px] text-gray-400">{data.heroOverlayOpacity ?? 0}%</span>
                                            </div>
                                            <input 
                                                type="range" 
                                                min="0" max="80" step="5"
                                                value={data.heroOverlayOpacity ?? 0} 
                                                onChange={e => onChange({ heroOverlayOpacity: parseInt(e.target.value) })}
                                                className="w-full accent-rose-500"
                                            />
                                            <p className="text-[9px] text-gray-400 italic">Tăng độ mờ sẽ làm ảnh phủ thêm lớp sương mù trắng để làm nổi bật chữ nội dung (đặc biệt ở viền dưới của ảnh).</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => heroInputRef.current?.click()}
                                            disabled={uploadingField === 'hero'}
                                            className="w-full py-6 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-400 hover:border-rose-300 hover:text-rose-400 transition-colors flex flex-col items-center gap-2"
                                        >
                                            <Upload size={20} />
                                            {uploadingField === 'hero' ? 'Đang tải lên...' : 'Tải ảnh bìa lên'}
                                        </button>
                                        <input ref={heroInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroUpload} />
                                        
                                        <div className="flex items-center gap-2 my-2">
                                            <div className="flex-1 h-px bg-gray-200"></div>
                                            <span className="text-[10px] text-gray-400 font-medium">HOẶC NHẬP URL</span>
                                            <div className="flex-1 h-px bg-gray-200"></div>
                                        </div>

                                        <div className="space-y-1">
                                            <input 
                                                type="text" 
                                                value={data.couplePhoto || ''} 
                                                onChange={e => onChange({ couplePhoto: e.target.value })}
                                                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                                                placeholder="Nhập URL ảnh bìa (VD: https://...)"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                        </div>
                    )}
                </div>

                {/* 2. Thông tin gia đình */}
                <div className="bg-white mb-2 border-b border-gray-200">
                    <AccordionHeader title="Thông tin gia đình" id="familyInfo" />
                    {expandedSection === 'familyInfo' && (
                        <div className="p-4 space-y-6">
                            {/* Nhà trai */}
                            <div className="space-y-4">
                                <div className="text-xs font-semibold text-gray-500 border-b border-gray-100 pb-1">Nhà trai</div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-gray-600">Danh xưng</label>
                                    <input 
                                        type="text" 
                                        value={data.groomParents?.title || 'Ông Bà'} 
                                        onChange={e => onChange({ groomParents: { ...data.groomParents, title: e.target.value, father: data.groomParents?.father||'', mother: data.groomParents?.mother||'' } })}
                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-gray-600">Ông</label>
                                        <input 
                                            type="text" 
                                            value={data.groomParents?.father || ''} 
                                            onChange={e => onChange({ groomParents: { ...data.groomParents, father: e.target.value, mother: data.groomParents?.mother||'' } })}
                                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                            placeholder="Tên bố"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-gray-600">Bà</label>
                                        <input 
                                            type="text" 
                                            value={data.groomParents?.mother || ''} 
                                            onChange={e => onChange({ groomParents: { ...data.groomParents, mother: e.target.value, father: data.groomParents?.father||'' } })}
                                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                            placeholder="Tên mẹ"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-gray-600">Địa chỉ nhà trai</label>
                                    <textarea 
                                        value={data.groomParents?.address || ''} 
                                        onChange={e => onChange({ groomParents: { ...data.groomParents, address: e.target.value, father: data.groomParents?.father||'', mother: data.groomParents?.mother||'' } })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none h-16"
                                        placeholder="Địa chỉ nhà trai..."
                                    />
                                </div>
                            </div>

                            {/* Nhà gái */}
                            <div className="space-y-4">
                                <div className="text-xs font-semibold text-gray-500 border-b border-gray-100 pb-1">Nhà gái</div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-gray-600">Danh xưng</label>
                                    <input 
                                        type="text" 
                                        value={data.brideParents?.title || 'Ông Bà'} 
                                        onChange={e => onChange({ brideParents: { ...data.brideParents, title: e.target.value, father: data.brideParents?.father||'', mother: data.brideParents?.mother||'' } })}
                                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-gray-600">Ông</label>
                                        <input 
                                            type="text" 
                                            value={data.brideParents?.father || ''} 
                                            onChange={e => onChange({ brideParents: { ...data.brideParents, father: e.target.value, mother: data.brideParents?.mother||'' } })}
                                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                            placeholder="Tên bố"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-medium text-gray-600">Bà</label>
                                        <input 
                                            type="text" 
                                            value={data.brideParents?.mother || ''} 
                                            onChange={e => onChange({ brideParents: { ...data.brideParents, mother: e.target.value, father: data.brideParents?.father||'' } })}
                                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                            placeholder="Tên mẹ"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-gray-600">Địa chỉ nhà gái</label>
                                    <textarea 
                                        value={data.brideParents?.address || ''} 
                                        onChange={e => onChange({ brideParents: { ...data.brideParents, address: e.target.value, father: data.brideParents?.father||'', mother: data.brideParents?.mother||'' } })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none h-16"
                                        placeholder="Địa chỉ nhà gái..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Lời mở đầu thiệp */}
                <div className="bg-white mb-2 border-b border-gray-200">
                    <AccordionHeader title="Lời mở đầu thiệp" id="opening" />
                    {expandedSection === 'opening' && (
                        <div className="p-4 space-y-2">
                            <label className="text-[10px] font-medium text-gray-600">Câu mở đầu (để trống nếu không muốn hiện)</label>
                            <textarea
                                value={data.openingMessage ?? ''}
                                onChange={e => onChange({ openingMessage: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none h-20 text-center"
                                placeholder="TRÂN TRỌNG BÁO TIN&#10;LỄ THÀNH HÔN CỦA CON CHÚNG TÔI"
                            />
                        </div>
                    )}
                </div>

                {/* 4. Tiệc cưới */}
                <div className="bg-white mb-2 border-b border-gray-200">
                    <AccordionHeader title="Tiệc cưới" id="party" />
                    {expandedSection === 'party' && (
                        <div className="p-4 space-y-4">
                            <div className="flex gap-4 mb-2">
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="partyType" 
                                        checked={data.partyType !== 'announcement'} 
                                        onChange={() => onChange({ partyType: 'wedding' })}
                                        className="text-rose-500 focus:ring-rose-500" 
                                    />
                                    Tiệc cưới
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="partyType" 
                                        checked={data.partyType === 'announcement'} 
                                        onChange={() => onChange({ partyType: 'announcement' })}
                                        className="text-rose-500 focus:ring-rose-500" 
                                    />
                                    Tiệc báo hỷ
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <label className="text-sm font-medium text-gray-700">Đồng hồ đếm ngược</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={data.countdownEnabled !== false} onChange={e => onChange({ countdownEnabled: e.target.checked })} />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                <label className="text-sm font-medium text-gray-700">Bản đồ</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={data.mapEnabled !== false} onChange={e => onChange({ mapEnabled: e.target.checked })} />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                                </label>
                            </div>
                            
                            {data.mapEnabled !== false && (
                                <div className="space-y-1 pb-2">
                                    <label className="text-[10px] font-medium text-gray-600 flex items-center gap-1"><MapPin size={12}/> Link / Mã nhúng Google Maps</label>
                                    <textarea 
                                        value={data.mapLink || ''} 
                                        onChange={e => {
                                            let val = e.target.value;
                                            if (val.includes('<iframe') && val.includes('src="')) {
                                                const match = val.match(/src="([^"]+)"/);
                                                if (match) val = match[1];
                                            }
                                            onChange({ mapLink: val });
                                        }}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none h-16"
                                        placeholder='Dán link hoặc thẻ <iframe> từ Google Maps...'
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 5. Lịch trình ngày cưới */}
                <div className="bg-white mb-8 border-b border-gray-200">
                    <AccordionHeader title="Lịch trình ngày cưới" id="timeline" />
                    {expandedSection === 'timeline' && (
                        <div className="p-4 space-y-3 bg-gray-50">
                            {data.events?.map((ev, i) => (
                                <div key={ev.id} className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm space-y-2 relative group">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-[10px] font-semibold text-gray-400 uppercase">Hoạt động {i + 1}</div>
                                        <button 
                                            onClick={() => removeEvent(i)}
                                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                                            title="Xóa"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex gap-2 items-center">
                                            <div className="w-1/3">
                                                <label className="text-[10px] text-gray-500 mb-1 block">Giờ</label>
                                                <input 
                                                    type="time" 
                                                    value={ev.time} 
                                                    onChange={e => handleEventChange(i, 'time', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                                />
                                            </div>
                                            <div className="w-2/3">
                                                <label className="text-[10px] text-gray-500 mb-1 block">Nội dung</label>
                                                <input 
                                                    type="text" 
                                                    value={ev.title} 
                                                    onChange={e => handleEventChange(i, 'title', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                                    placeholder="VD: Đón khách"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <div className="w-1/2">
                                                <label className="text-[10px] text-gray-500 mb-1 block">Ngày</label>
                                                <input 
                                                    type="date" 
                                                    value={ev.date || ''} 
                                                    onChange={e => handleEventChange(i, 'date', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                                />
                                            </div>
                                            <div className="w-1/2">
                                                <label className="text-[10px] text-gray-500 mb-1 block">Vị trí / Tầng sảnh</label>
                                                <input 
                                                    type="text" 
                                                    value={ev.location || ''} 
                                                    onChange={e => handleEventChange(i, 'location', e.target.value)}
                                                    className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                                    placeholder="Sảnh Đón Khách..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <button 
                                onClick={addEvent}
                                className="w-full flex items-center justify-center gap-1.5 py-2.5 mt-2 bg-white border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-rose-300 hover:text-rose-500 transition-colors"
                            >
                                <Plus size={16} /> Thêm hoạt động
                            </button>
                        </div>
                    )}
                </div>

                {/* 6. Thư viện ảnh */}
                <div className="bg-white mb-2 border-b border-gray-200">
                    <AccordionHeader title="Thư viện ảnh" id="gallery" />
                    {expandedSection === 'gallery' && (
                        <div className="p-4 space-y-4 bg-gray-50">
                            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                                <button className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${data.galleryStyle === 'grid' || !data.galleryStyle ? 'bg-gray-100 text-gray-800' : 'text-gray-500'}`} onClick={() => onChange({ galleryStyle: 'grid' })}>Lưới</button>
                                <button className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${data.galleryStyle === 'collage' ? 'bg-gray-100 text-gray-800' : 'text-gray-500'}`} onClick={() => onChange({ galleryStyle: 'collage' })}>Ghép ảnh</button>
                                <button className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${data.galleryStyle === '3d' ? 'bg-gray-100 text-gray-800' : 'text-gray-500'}`} onClick={() => onChange({ galleryStyle: '3d' })}>3D</button>
                            </div>
                            
                            <div className="space-y-3">
                                {/* Thêm bằng link */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-medium text-gray-600 flex items-center gap-1">
                                        <ImageIcon size={12} /> Thêm ảnh qua Link
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            ref={galleryLinkRef}
                                            type="text"
                                            className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                            placeholder="Dán link ảnh tại đây..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const val = galleryLinkRef.current?.value.trim();
                                                    if (val) {
                                                        onChange({ galleryImages: [...(data.galleryImages || []), val] });
                                                        if (galleryLinkRef.current) galleryLinkRef.current.value = '';
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                const val = galleryLinkRef.current?.value.trim();
                                                if (val) {
                                                    onChange({ galleryImages: [...(data.galleryImages || []), val] });
                                                    if (galleryLinkRef.current) galleryLinkRef.current.value = '';
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-rose-500 text-white rounded-lg text-sm hover:bg-rose-600 transition-colors whitespace-nowrap"
                                        >
                                            Thêm
                                        </button>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                    <span className="text-[10px] text-gray-400 uppercase">Hoặc</span>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                {/* Tải ảnh lên */}
                                <label className="flex items-center justify-center gap-2 w-full py-2 bg-white border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-rose-500 hover:border-rose-300 transition-colors cursor-pointer">
                                    {uploadingField === 'galleryImages' ? (
                                        <span className="text-sm flex items-center gap-2"><Upload size={16} className="animate-bounce" /> Đang tải ảnh...</span>
                                    ) : (
                                        <>
                                            <Upload size={16} />
                                            <span className="text-sm font-medium">Tải ảnh từ thiết bị</span>
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryUpload} />
                                        </>
                                    )}
                                </label>
                            </div>

                            <div className="text-xs font-medium text-gray-600 mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
                                <span>Đã chọn <strong className="text-rose-500">{(data.galleryImages || []).length}</strong> ảnh</span>
                                {(data.galleryImages || []).length > 0 && (
                                    <button 
                                        onClick={() => onChange({ galleryImages: [] })}
                                        className="text-red-500 hover:text-red-600 transition-colors text-[10px] uppercase font-bold"
                                    >Xoá tất cả</button>
                                )}
                            </div>

                            {/* Danh sách ảnh đã chọn */}
                            {(data.galleryImages || []).length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                                    {data.galleryImages!.map((img, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden group bg-gray-100 border border-gray-200">
                                            <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                                            <button 
                                                onClick={() => {
                                                    const newArr = [...data.galleryImages!];
                                                    newArr.splice(i, 1);
                                                    onChange({ galleryImages: newArr });
                                                }}
                                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                            >
                                                <Trash2 size={16} className="text-white hover:text-red-400 transition-colors bg-black/30 p-1.5 rounded-full" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 7. Lời cảm ơn */}
                <div className="bg-white mb-2 border-b border-gray-200">
                    <AccordionHeader title="Lời cảm ơn" id="thankyou" />
                    {expandedSection === 'thankyou' && (
                        <div className="p-4 space-y-2">
                            <label className="text-[10px] font-medium text-gray-600">Lời cảm ơn (để trống nếu không muốn hiện)</label>
                            <textarea
                                value={data.thankYouMessage ?? ''}
                                onChange={e => onChange({ thankYouMessage: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none h-20"
                                placeholder="Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!"
                            />
                        </div>
                    )}
                </div>

                {/* 8. Nhạc nền */}
                <div className="bg-white mb-2 border-b border-gray-200">
                    <AccordionHeader title="Nhạc nền" id="music" />
                    {expandedSection === 'music' && (
                        <div className="p-4 space-y-4 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                <Music2 size={24} />
                            </div>
                            <div className="text-sm text-gray-500">
                                {data.musicUrl ? MUSIC_OPTIONS.find(m => m.url === data.musicUrl)?.label || 'Đã chọn nhạc' : 'Chưa chọn nhạc nền'}
                            </div>
                            <select 
                                value={data.musicUrl || ''} 
                                onChange={e => onChange({ musicUrl: e.target.value })}
                                className="w-full px-3 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium focus:outline-none"
                            >
                                <option value="">🎵 Chọn nhạc...</option>
                                {MUSIC_OPTIONS.map(m => (
                                    <option key={m.url} value={m.url} className="bg-white text-gray-800">{m.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* 9. Phong bì */}
                <div className="bg-white mb-2 border-b border-gray-200">
                    <AccordionHeader title="Phong bì" id="envelope" />
                    {expandedSection === 'envelope' && (
                        <div className="p-4 space-y-2">
                            <label className="text-[10px] font-medium text-gray-600">Lời mời (hiển thị trên phong bì)</label>
                            <input
                                type="text"
                                value={data.envelopeMessage ?? ''}
                                onChange={e => onChange({ envelopeMessage: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                                placeholder="Thân Mời"
                            />
                        </div>
                    )}
                </div>

                {/* 10. Xác nhận tham dự (RSVP) */}
                <div className="bg-white mb-2 border-b border-gray-200">
                    <AccordionHeader title="Xác nhận tham dự" id="rsvp" />
                    {expandedSection === 'rsvp' && (
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Khách mời xác nhận trực tiếp</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={data.rsvpEnabled !== false} onChange={e => onChange({ rsvpEnabled: e.target.checked })} />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* 11. Sổ lưu bút */}
                <div className="bg-white mb-2 border-b border-gray-200">
                    <AccordionHeader title="Sổ lưu bút" id="guestbook" />
                    {expandedSection === 'guestbook' && (
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                <label className="text-sm font-medium text-gray-700">Hiển thị sổ lưu bút</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={data.guestbookEnabled !== false} onChange={e => onChange({ guestbookEnabled: e.target.checked })} />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                                </label>
                            </div>
                            <div className="text-center text-xs text-gray-400 py-4">
                                Chưa có lời nhắn nào
                            </div>
                        </div>
                    )}
                </div>

                {/* 12. Tài khoản ngân hàng */}
                <div className="bg-white mb-2 border-b border-gray-200">
                    <AccordionHeader title="Tài khoản ngân hàng" id="bank" />
                    {expandedSection === 'bank' && (
                        <div className="p-4 space-y-4">
                            <div className="text-center text-xs text-gray-400 py-1">
                                Cài đặt tài khoản nhận mừng cưới (QR VietQR)
                            </div>
                            
                            {(data.bankAccounts || (data.bankInfo?.bankId ? [data.bankInfo] : [])).map((acc, index) => (
                                <div key={index} className="p-3 border border-gray-200 rounded-lg space-y-3 relative group bg-gray-50">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-xs font-semibold text-gray-500 uppercase">Tài khoản {index + 1}</div>
                                        <button 
                                            onClick={() => {
                                                const list = [...(data.bankAccounts || [data.bankInfo])];
                                                list.splice(index, 1);
                                                onChange({ bankAccounts: list });
                                            }}
                                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                                            title="Xóa"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <input 
                                        className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-rose-400 focus:outline-none" 
                                        placeholder="Tiêu đề (VD: Mừng cưới Chú Rể)" 
                                        value={acc.title || ''} 
                                        onChange={e => {
                                            const list = [...(data.bankAccounts || [data.bankInfo])];
                                            list[index] = { ...list[index], title: e.target.value };
                                            onChange({ bankAccounts: list });
                                        }}
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-gray-500">Mã Ngân hàng (VD: VCB, MB)</label>
                                            <input 
                                                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-rose-400 focus:outline-none uppercase mt-1" 
                                                placeholder="VD: VCB" 
                                                value={acc.bankId || ''} 
                                                onChange={e => {
                                                    const list = [...(data.bankAccounts || [data.bankInfo])];
                                                    list[index] = { ...list[index], bankId: e.target.value };
                                                    onChange({ bankAccounts: list });
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500">Số tài khoản</label>
                                            <input 
                                                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-rose-400 focus:outline-none mt-1" 
                                                placeholder="VD: 190365..." 
                                                value={acc.accountNumber || ''} 
                                                onChange={e => {
                                                    const list = [...(data.bankAccounts || [data.bankInfo])];
                                                    list[index] = { ...list[index], accountNumber: e.target.value };
                                                    onChange({ bankAccounts: list });
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500">Tên chủ tài khoản</label>
                                        <input 
                                            className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-1 focus:ring-rose-400 focus:outline-none uppercase mt-1" 
                                            placeholder="NGUYEN VAN A" 
                                            value={acc.accountName || ''} 
                                            onChange={e => {
                                                const list = [...(data.bankAccounts || [data.bankInfo])];
                                                list[index] = { ...list[index], accountName: e.target.value.toUpperCase() };
                                                onChange({ bankAccounts: list });
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                            <button 
                                onClick={() => {
                                    const list = [...(data.bankAccounts || (data.bankInfo?.bankId ? [data.bankInfo] : []))];
                                    list.push({ bankId: '', accountNumber: '', accountName: '', title: '' });
                                    onChange({ bankAccounts: list });
                                }}
                                className="w-full py-2 border border-rose-300 text-rose-500 rounded-lg text-sm font-medium hover:bg-rose-50 transition-colors flex items-center justify-center gap-1"
                            >
                                <Plus size={16} /> Thêm tài khoản
                            </button>
                        </div>
                    )}
                </div>

                {/* 13. Dress Code */}
                <div className="bg-white mb-8 border-b border-gray-200">
                    <AccordionHeader title="Dress Code" id="dresscode" />
                    {expandedSection === 'dresscode' && (
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Hiển thị Dress Code</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={data.dressCodeEnabled === true} onChange={e => onChange({ dressCodeEnabled: e.target.checked })} />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                                </label>
                            </div>
                            {data.dressCodeEnabled && (
                                <>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">Lời nhắn</label>
                                        <textarea
                                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-400 resize-none"
                                            rows={2}
                                            placeholder="Gợi ý trang phục cho khách mời..."
                                            value={data.dressCodeMessage || ''}
                                            onChange={e => onChange({ dressCodeMessage: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-2 block">Màu sắc gợi ý</label>
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
                                                    >×</button>
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
                            <p className="text-[10px] text-gray-500">Bật để gợi ý trang phục cho khách mời theo màu sắc chủ đạo của tiệc cưới.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default EditorFormPanel;
