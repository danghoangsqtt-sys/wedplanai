import React, { useState } from 'react';
import { 
    ChevronDown, ChevronUp, Upload, Trash2, Plus, GripVertical, Image as ImageIcon, MapPin, Clock, Calendar, Music2 
} from 'lucide-react';
import { InvitationData, WeddingEvent } from '../../../types';
import { uploadInvitationImage } from '../../../services/cloudService';
import { useStore } from '../../../store/useStore';

const MUSIC_OPTIONS = [
    { url: '/audio/canon-in-d.mp3', label: 'Canon in D – Pachelbel (Cổ điển)' },
    { url: '/audio/wedding-march.mp3', label: 'Wedding March – Mendelssohn (Hành khúc)' },
    { url: '/audio/a thousand years.mp3', label: 'A Thousand Years (Christina Perri)' },
    { url: '/audio/Chăm Em Một Đời.mp3', label: 'Chăm Em Một Đời' },
    { url: '/audio/Die With A Smile.mp3', label: 'Die With A Smile' },
    { url: '/audio/Em Đồng Ý (I Do).mp3', label: 'Em Đồng Ý (I Do)' },
    { url: '/audio/In Your Eyes.mp3', label: 'In Your Eyes' },
    { url: '/audio/Lover (First Dance Remix).mp3', label: 'Lover (First Dance Remix)' },
    { url: '/audio/Lễ Đường.mp3', label: 'Lễ Đường' },
    { url: '/audio/Marry You.mp3', label: 'Marry You (Bruno Mars)' },
    { url: '/audio/Ngày Này, Người Con Gái Này.mp3', label: 'Ngày Này, Người Con Gái Này' },
    { url: '/audio/Ordinary (Wedding Version).mp3', label: 'Ordinary (Wedding Version)' },
    { url: '/audio/Summertime (Imanbek Remix).mp3', label: 'Summertime (Imanbek Remix)' },
    { url: '/audio/The Most Beautiful Bride In The World.mp3', label: 'The Most Beautiful Bride In The World' },
    { url: '/audio/một đời.mp3', label: 'Một Đời' },
    { url: '/audio/50 Năm Về Sau (Nghĩ Đến Ngày Chúng Ta Sẽ Già).mp3', label: '50 Năm Về Sau' },
];

interface EditorFormPanelProps {
    data: InvitationData;
    onChange: (patch: Partial<InvitationData>) => void;
}

const EditorFormPanel: React.FC<EditorFormPanelProps> = ({ data, onChange }) => {
    const { user } = useStore();
    const [expandedSection, setExpandedSection] = useState<string | null>('basicInfo');
    const [uploadingField, setUploadingField] = useState<string | null>(null);

    const toggleSection = (section: string) => {
        setExpandedSection(prev => prev === section ? null : section);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'groomPhoto' | 'bridePhoto') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('File quá lớn, vui lòng chọn ảnh < 2MB');
            return;
        }

        try {
            if (!user) {
                alert('Vui lòng đăng nhập để tải ảnh lên.');
                return;
            }
            setUploadingField(field);
            const url = await uploadInvitationImage(file, user.uid);
            onChange({ [field]: url });
        } catch (error) {
            console.error('Lỗi upload ảnh:', error);
            alert('Lỗi tải ảnh. Hãy thử lại.');
        } finally {
            setUploadingField(null);
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

                            {/* Ảnh đôi */}
                            <div className="pt-2 border-t border-gray-100">
                                <label className="text-xs font-medium text-gray-600 block mb-2">Ảnh đôi</label>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Ảnh chú rể */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-[10px] text-gray-500">Ảnh chú rể</div>
                                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                                            {data.groomPhoto ? (
                                                <>
                                                    <img src={data.groomPhoto} className="w-full h-full object-cover" alt="Chú rể" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                                        <label className="cursor-pointer bg-white/20 hover:bg-white/40 p-1 rounded-full text-white transition-colors">
                                                            <Upload size={14} />
                                                            <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, 'groomPhoto')} />
                                                        </label>
                                                        <button onClick={() => onChange({ groomPhoto: undefined })} className="bg-red-500/80 hover:bg-red-500 p-1 rounded-full text-white transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                                                    {uploadingField === 'groomPhoto' ? <span className="text-[10px]">Đang tải...</span> : (
                                                        <>
                                                            <ImageIcon size={20} className="mb-1" />
                                                            <span className="text-[10px] text-rose-500 font-medium">Tải lên</span>
                                                        </>
                                                    )}
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, 'groomPhoto')} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                    {/* Ảnh cô dâu */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="text-[10px] text-gray-500">Ảnh cô dâu</div>
                                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                                            {data.bridePhoto ? (
                                                <>
                                                    <img src={data.bridePhoto} className="w-full h-full object-cover" alt="Cô dâu" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                                        <label className="cursor-pointer bg-white/20 hover:bg-white/40 p-1 rounded-full text-white transition-colors">
                                                            <Upload size={14} />
                                                            <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, 'bridePhoto')} />
                                                        </label>
                                                        <button onClick={() => onChange({ bridePhoto: undefined })} className="bg-red-500/80 hover:bg-red-500 p-1 rounded-full text-white transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <label className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                                                    {uploadingField === 'bridePhoto' ? <span className="text-[10px]">Đang tải...</span> : (
                                                        <>
                                                            <ImageIcon size={20} className="mb-1" />
                                                            <span className="text-[10px] text-rose-500 font-medium">Tải lên</span>
                                                        </>
                                                    )}
                                                    <input type="file" className="hidden" accept="image/*" onChange={e => handleUpload(e, 'bridePhoto')} />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>
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
                                value={data.openingMessage || 'TRÂN TRỌNG BÁO TIN\nLỄ THÀNH HÔN CỦA CON CHÚNG TÔI'} 
                                onChange={e => onChange({ openingMessage: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none h-20 text-center"
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

                            <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                <label className="text-sm font-medium text-gray-700">Đồng hồ đếm ngược</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={data.countdownEnabled !== false} onChange={e => onChange({ countdownEnabled: e.target.checked })} />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                                </label>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-medium text-gray-600 flex items-center gap-1"><MapPin size={12}/> Địa chỉ tiệc cưới</label>
                                <textarea 
                                    value={data.address || ''} 
                                    onChange={e => onChange({ address: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none h-16"
                                    placeholder="Ví dụ: Nhà hàng tiệc cưới..."
                                />
                            </div>

                            <div className="flex items-center justify-between py-2 border-t border-gray-100">
                                <label className="text-sm font-medium text-gray-700">Bản đồ</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={data.mapEnabled !== false} onChange={e => onChange({ mapEnabled: e.target.checked })} />
                                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                                </label>
                            </div>
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
                            <div className="text-xs text-gray-500">Thư viện ảnh {(data.galleryImages || []).length} ảnh</div>
                        </div>
                    )}
                </div>

                {/* 7. Lời cảm ơn */}
                <div className="bg-white mb-2 border-b border-gray-200">
                    <AccordionHeader title="Lời cảm ơn" id="thankyou" />
                    {expandedSection === 'thankyou' && (
                        <div className="p-4 space-y-2">
                            <textarea 
                                value={data.thankYouMessage || 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!'} 
                                onChange={e => onChange({ thankYouMessage: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none h-20"
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
                            <label className="text-[10px] font-medium text-gray-600">Lời mời</label>
                            <input 
                                type="text" 
                                value={data.envelopeMessage || 'Thân Mời'} 
                                onChange={e => onChange({ envelopeMessage: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
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
                            <div className="text-center text-xs text-gray-400 py-2">
                                Tính năng quản lý QR ngân hàng
                            </div>
                            <button className="w-full py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                + Thêm tài khoản ngân hàng
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
                            <p className="text-[10px] text-gray-500">Bật để gợi ý trang phục cho khách mời theo màu sắc chủ đạo của tiệc cưới.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default EditorFormPanel;
