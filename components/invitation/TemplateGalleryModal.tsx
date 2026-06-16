import React, { useState, useMemo } from 'react';
import { X, Search, Sparkles, CheckCircle2, ChevronRight, Eye } from 'lucide-react';
import { InvitationData } from '../../types';
import InvitationPreview from './InvitationPreview';

interface TemplateDef {
    id: 'traditional' | 'romantic' | 'modern' | 'royal' | 'garden' | 'indochine';
    name: string;
    description: string;
    image: string;
    tags: string[];
    isPremium?: boolean;
    isNew?: boolean;
}

const TEMPLATES_DATA: TemplateDef[] = [
    {
        id: 'traditional',
        name: 'Truyền Thống',
        description: 'Tôn vinh giá trị văn hóa với sắc đỏ may mắn và họa tiết cổ điển sang trọng.',
        image: '/templates/traditional.png',
        tags: ['Cổ điển', 'Việt Nam', 'Thanh lịch'],
        isPremium: true
    },
    {
        id: 'romantic',
        name: 'Lãng Mạn',
        description: 'Ngọt ngào và bay bổng với tông màu pastel cùng họa tiết hoa lá màu nước.',
        image: '/templates/romantic.png',
        tags: ['Màu nước', 'Ngọt ngào', 'Floral'],
        isNew: true
    },
    {
        id: 'modern',
        name: 'Hiện Đại',
        description: 'Thiết kế tối giản, tinh tế với những đường nét hình học và typography phá cách.',
        image: '/templates/modern.png',
        tags: ['Tối giản', 'Sang trọng', 'Typography']
    },
    {
        id: 'royal',
        name: 'Royal Elegance',
        description: 'Phong cách hoàng gia châu Âu với tone xanh navy, vàng kim và logo huy hiệu.',
        image: '/templates/royal.png',
        tags: ['Hoàng gia', 'Luxury', 'Classic'],
        isPremium: true
    },
    {
        id: 'garden',
        name: 'Garden Romance',
        description: 'Hòa mình vào thiên nhiên với concept khu vườn cổ tích, mộc mạc mà tinh khôi.',
        image: '/templates/garden.png',
        tags: ['Botanical', 'Rustic', 'Nhẹ nhàng']
    },
    {
        id: 'indochine',
        name: 'Indochine',
        description: 'Nét hoài cổ đậm chất Đông Dương, kết hợp giữa vẻ đẹp Á Đông và kiến trúc Pháp.',
        image: '/templates/indochine.png',
        tags: ['Hoài cổ', 'Đông Dương', 'Nghệ thuật'],
        isNew: true
    }
];

const FILTERS = ['Tất cả', 'Cổ điển', 'Hiện đại', 'Tối giản', 'Floral', 'Hoài cổ', 'Sang trọng'];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentTemplateId: string;
    onSelectTemplate: (id: string) => void;
    currentData?: InvitationData;
}

const TemplateGalleryModal: React.FC<Props> = ({ isOpen, onClose, currentTemplateId, onSelectTemplate, currentData }) => {
    const [activeFilter, setActiveFilter] = useState('Tất cả');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewId, setPreviewId] = useState<string | null>(null);

    const filteredTemplates = useMemo(() => {
        if (!isOpen) return [];
        return TEMPLATES_DATA.filter(t => {
            const matchesFilter = activeFilter === 'Tất cả' || t.tags.includes(activeFilter) ||
                (activeFilter === 'Cổ điển' && t.id === 'traditional') ||
                (activeFilter === 'Hiện đại' && t.id === 'modern') ||
                (activeFilter === 'Sang trọng' && (t.id === 'royal' || t.id === 'modern'));
            const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            return matchesFilter && matchesSearch;
        });
    }, [isOpen, activeFilter, searchQuery]);

    if (!isOpen) return null;

    const previewTemplate = previewId ? TEMPLATES_DATA.find(t => t.id === previewId) : null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-6xl h-[92vh] rounded-[28px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-slideUp">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white/90 backdrop-blur sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            Khám Phá Kho Mẫu Thiệp
                            <Sparkles className="w-5 h-5 text-rose-500" />
                        </h2>
                        <p className="text-gray-500 text-sm mt-0.5">Chọn thiết kế hoàn hảo cho ngày trọng đại của bạn</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-8 py-3 bg-gray-50/60 flex flex-col md:flex-row gap-3 justify-between items-center border-b border-gray-100">
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 hide-scrollbar">
                        {FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                    activeFilter === f
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm phong cách..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-shadow bg-white"
                        />
                    </div>
                </div>

                {/* Gallery Grid or Preview */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                    {previewTemplate && currentData ? (
                        /* ── LIVE PREVIEW MODE ── */
                        <div className="p-6">
                            <button
                                onClick={() => setPreviewId(null)}
                                className="mb-4 text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
                            >
                                ← Quay lại danh sách mẫu
                            </button>
                            <div className="flex gap-6 items-start">
                                <div className="flex-1 min-w-0">
                                    <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden" style={{ maxHeight: 'calc(92vh - 200px)', overflowY: 'auto' }}>
                                        <InvitationPreview data={{ ...currentData, templateId: previewTemplate.id }} />
                                    </div>
                                </div>
                                <div className="w-72 shrink-0 sticky top-0 pt-2">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{previewTemplate.name}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed mb-4">{previewTemplate.description}</p>
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {previewTemplate.tags.map(tag => (
                                            <span key={tag} className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    {currentTemplateId === previewTemplate.id ? (
                                        <div className="flex items-center gap-2 justify-center py-3 px-6 rounded-full bg-green-50 text-green-700 font-semibold text-sm border border-green-200">
                                            <CheckCircle2 className="w-4 h-4" /> Đang sử dụng
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { onSelectTemplate(previewTemplate.id); onClose(); }}
                                            className="w-full py-3 px-6 rounded-full bg-gray-900 text-white font-semibold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
                                        >
                                            Dùng mẫu này <ChevronRight className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ── GRID MODE ── */
                        <div className="p-6">
                            {filteredTemplates.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                                    <Search className="w-10 h-10 mb-3 opacity-50" />
                                    <p className="text-sm">Không tìm thấy mẫu thiệp phù hợp.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredTemplates.map(template => {
                                        const isSelected = currentTemplateId === template.id;

                                        return (
                                            <div key={template.id} className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col">

                                                {/* Image Container */}
                                                <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                                                    <img
                                                        src={template.image}
                                                        alt={template.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                        loading="lazy"
                                                    />

                                                    {/* Badges */}
                                                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                                                        {template.isNew && (
                                                            <span className="bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                                                                Mới
                                                            </span>
                                                        )}
                                                        {template.isPremium && (
                                                            <span className="bg-amber-400 text-amber-900 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                                                <Sparkles className="w-3 h-3" /> Premium
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Hover Overlay */}
                                                    {!isSelected && (
                                                        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
                                                            <button
                                                                onClick={() => { onSelectTemplate(template.id); onClose(); }}
                                                                className="bg-white text-gray-900 font-bold px-6 py-2.5 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center gap-2 text-sm"
                                                            >
                                                                Dùng mẫu này <ChevronRight className="w-4 h-4" />
                                                            </button>
                                                            {currentData && (
                                                                <button
                                                                    onClick={() => setPreviewId(template.id)}
                                                                    className="bg-white/20 text-white font-medium px-5 py-2 rounded-full hover:bg-white/30 transition-colors flex items-center gap-2 text-sm backdrop-blur-sm"
                                                                >
                                                                    <Eye className="w-4 h-4" /> Xem trước với dữ liệu của bạn
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Selected Overlay */}
                                                    {isSelected && (
                                                        <div className="absolute inset-0 bg-emerald-500/10 border-[3px] border-emerald-500 flex items-center justify-center">
                                                            <div className="bg-white text-emerald-600 font-bold px-5 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm">
                                                                <CheckCircle2 className="w-4 h-4" /> Đang sử dụng
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{template.name}</h3>
                                                    <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1">
                                                        {template.description}
                                                    </p>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {template.tags.map(tag => (
                                                            <span key={tag} className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TemplateGalleryModal;
