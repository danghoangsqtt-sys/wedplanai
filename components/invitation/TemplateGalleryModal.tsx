import React, { useState } from 'react';
import { X, Search, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

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
}

const TemplateGalleryModal: React.FC<Props> = ({ isOpen, onClose, currentTemplateId, onSelectTemplate }) => {
    const [activeFilter, setActiveFilter] = useState('Tất cả');
    const [searchQuery, setSearchQuery] = useState('');

    if (!isOpen) return null;

    const filteredTemplates = TEMPLATES_DATA.filter(t => {
        const matchesFilter = activeFilter === 'Tất cả' || t.tags.includes(activeFilter) || 
            (activeFilter === 'Cổ điển' && t.id === 'traditional') ||
            (activeFilter === 'Hiện đại' && t.id === 'modern') ||
            (activeFilter === 'Sang trọng' && (t.id === 'royal' || t.id === 'modern'));
            
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[32px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-slideUp">
                
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            Khám Phá Kho Mẫu Thiệp
                            <Sparkles className="w-6 h-6 text-rose-500" />
                        </h2>
                        <p className="text-gray-500 mt-1">Chọn một thiết kế hoàn hảo để bắt đầu câu chuyện của bạn.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-12 h-12 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-8 py-4 bg-gray-50/50 flex flex-col md:flex-row gap-4 justify-between items-center border-b border-gray-100">
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
                        {FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                                    activeFilter === f 
                                    ? 'bg-gray-900 text-white shadow-md' 
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm phong cách..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition-shadow bg-white"
                        />
                    </div>
                </div>

                {/* Gallery Grid */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30 scrollbar-thin scrollbar-thumb-gray-200">
                    {filteredTemplates.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Search className="w-12 h-12 mb-4 opacity-50" />
                            <p>Không tìm thấy mẫu thiệp phù hợp.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredTemplates.map(template => {
                                const isSelected = currentTemplateId === template.id;
                                
                                return (
                                    <div key={template.id} className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col">
                                        
                                        {/* Image Container */}
                                        <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                                            <img 
                                                src={template.image} 
                                                alt={template.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                            
                                            {/* Badges */}
                                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                {template.isNew && (
                                                    <span className="bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                                                        Mới
                                                    </span>
                                                )}
                                                {template.isPremium && (
                                                    <span className="bg-amber-400 text-amber-900 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3" /> Premium
                                                    </span>
                                                )}
                                            </div>

                                            {/* Hover Overlay */}
                                            <div className={`absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center ${isSelected ? 'opacity-0 hidden' : ''}`}>
                                                <button 
                                                    onClick={() => {
                                                        onSelectTemplate(template.id);
                                                        onClose();
                                                    }}
                                                    className="bg-white text-gray-900 font-bold px-8 py-3 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                                                >
                                                    Dùng mẫu này <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Selected Overlay */}
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-rose-500/10 border-4 border-rose-500 flex items-center justify-center">
                                                    <div className="bg-white text-rose-600 font-bold px-6 py-2 rounded-full shadow-lg flex items-center gap-2">
                                                        <CheckCircle2 className="w-5 h-5" /> Đang sử dụng
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-xl font-bold text-gray-900">{template.name}</h3>
                                            </div>
                                            <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                                                {template.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {template.tags.map(tag => (
                                                    <span key={tag} className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
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
            </div>
        </div>
    );
};

export default TemplateGalleryModal;
