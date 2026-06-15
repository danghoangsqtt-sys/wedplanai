import React, { useState } from 'react';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext, sortableKeyboardCoordinates,
    useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Layers, Palette, Plus, GripVertical, Eye, EyeOff,
    Layout, Image as ImgIcon, Users, MapPin, Music2, CalendarDays, Camera,
    Heart, QrCode, Send, BookOpen, Crown,
} from 'lucide-react';
import { InvitationData, SectionId, DEFAULT_SECTION_ORDER } from '../../../types';

const SECTION_META: Record<SectionId, { label: string; icon: React.ReactNode; alwaysOn?: boolean }> = {
    hero:      { label: 'Bìa Thiệp',        icon: <Crown size={14} />,      alwaysOn: true },
    family:    { label: 'Cha Mẹ Hai Bên',   icon: <Users size={14} /> },
    venue:     { label: 'Địa Điểm',          icon: <MapPin size={14} /> },
    events:    { label: 'Chương Trình',       icon: <CalendarDays size={14} /> },
    loveStory: { label: 'Chuyện Tình Yêu',   icon: <Heart size={14} /> },
    gallery:   { label: 'Album Ảnh',          icon: <Camera size={14} /> },
    bank:      { label: 'Mừng Cưới / QR',    icon: <QrCode size={14} /> },
    rsvp:      { label: 'RSVP',               icon: <Send size={14} /> },
    guestbook: { label: 'Sổ Lưu Bút',        icon: <BookOpen size={14} /> },
};

interface SortableSectionRowProps {
    id: SectionId;
    isVisible: boolean;
    isSelected: boolean;
    onClick: () => void;
    onToggleVisibility: () => void;
}

const SortableSectionRow: React.FC<SortableSectionRowProps> = ({
    id, isVisible, isSelected, onClick, onToggleVisibility,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const meta = SECTION_META[id];
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
                isSelected ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'hover:bg-gray-50 text-gray-700'
            } ${!isVisible ? 'opacity-40' : ''}`}
            onClick={onClick}
        >
            <button
                {...attributes}
                {...listeners}
                className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0"
                onClick={e => e.stopPropagation()}
                aria-label="Kéo để sắp xếp"
            >
                <GripVertical size={14} />
            </button>
            <span className="shrink-0 text-current opacity-70">{meta.icon}</span>
            <span className="flex-1 text-xs font-medium truncate">{meta.label}</span>
            {!meta.alwaysOn && (
                <button
                    onClick={e => { e.stopPropagation(); onToggleVisibility(); }}
                    className="shrink-0 text-gray-300 hover:text-gray-600 transition-colors"
                    title={isVisible ? 'Ẩn section' : 'Hiện section'}
                >
                    {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
            )}
        </div>
    );
};

type SidebarTab = 'sections' | 'style' | 'add';

interface EditorLeftSidebarProps {
    data: InvitationData;
    selectedSection: string | null;
    onSectionClick: (id: SectionId) => void;
    onChange: (patch: Partial<InvitationData>) => void;
}

const EditorLeftSidebar: React.FC<EditorLeftSidebarProps> = ({
    data, selectedSection, onSectionClick, onChange,
}) => {
    const [activeTab, setActiveTab] = useState<SidebarTab | null>('sections');

    const sectionOrder = (data.sectionOrder ?? DEFAULT_SECTION_ORDER) as SectionId[];
    const visibility = data.sectionVisibility ?? {};

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        const oldIndex = sectionOrder.indexOf(active.id as SectionId);
        const newIndex = sectionOrder.indexOf(over.id as SectionId);
        if (oldIndex !== -1 && newIndex !== -1) {
            onChange({ sectionOrder: arrayMove(sectionOrder, oldIndex, newIndex) });
        }
    };

    const toggleVisibility = (id: SectionId) => {
        const newVis = { ...visibility, [id]: visibility[id] === false ? true : false };
        onChange({ sectionVisibility: newVis });
    };

    const isVisible = (id: SectionId) => visibility[id] !== false;

    const ICON_TABS = [
        { id: 'sections' as SidebarTab, icon: <Layers size={18} />, label: 'Sections' },
        { id: 'style' as SidebarTab, icon: <Palette size={18} />, label: 'Style' },
        { id: 'add' as SidebarTab, icon: <Plus size={18} />, label: 'Thêm' },
    ];

    const THEME_COLORS = [
        '#c2a14d', '#ec4899', '#e11d48', '#7c1d00', '#1e2c54', '#3f5e43',
        '#a8442a', '#7c3aed', '#0284c7', '#0f766e', '#d97706', '#475569',
    ];

    return (
        <div className="flex h-full shrink-0">
            {/* Icon strip */}
            <div className="w-12 flex flex-col items-center py-3 gap-1 border-r border-gray-100 bg-gray-50">
                {ICON_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
                        title={tab.label}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${
                            activeTab === tab.id
                                ? 'bg-rose-100 text-rose-600 ring-1 ring-rose-200'
                                : 'text-gray-500 hover:bg-white hover:text-gray-700'
                        }`}
                    >
                        {tab.icon}
                    </button>
                ))}
            </div>

            {/* Expand panel */}
            {activeTab && (
                <div className="w-52 border-r border-gray-100 bg-white overflow-y-auto">
                    {activeTab === 'sections' && (
                        <div className="p-2">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1.5">Các Section</p>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
                                    {sectionOrder.map(id => (
                                        <SortableSectionRow
                                            key={id}
                                            id={id}
                                            isVisible={isVisible(id)}
                                            isSelected={selectedSection === id}
                                            onClick={() => onSectionClick(id)}
                                            onToggleVisibility={() => toggleVisibility(id)}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {activeTab === 'style' && (
                        <div className="p-3 space-y-4">
                            <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Màu Nhấn</p>
                                <div className="grid grid-cols-6 gap-1.5">
                                    {THEME_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => onChange({ themeColor: color })}
                                            style={{ backgroundColor: color }}
                                            className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${
                                                data.themeColor === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''
                                            }`}
                                            aria-label={color}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="color"
                                    value={data.themeColor || '#c2a14d'}
                                    onChange={e => onChange({ themeColor: e.target.value })}
                                    className="mt-2 w-full h-8 rounded-lg border border-gray-200 cursor-pointer"
                                    title="Chọn màu tùy chỉnh"
                                />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Hiệu Ứng Rơi</p>
                                {(['none', 'petals', 'hearts', 'sparkles'] as const).map(ef => (
                                    <button
                                        key={ef}
                                        onClick={() => onChange({ petalEffect: ef })}
                                        className={`w-full text-left px-2 py-1 text-xs rounded-lg mb-0.5 transition-colors ${
                                            (data.petalEffect ?? 'none') === ef
                                                ? 'bg-rose-50 text-rose-700 font-medium'
                                                : 'hover:bg-gray-50 text-gray-600'
                                        }`}
                                    >
                                        {{ none: '✕ Không có', petals: '✿ Cánh hoa', hearts: '❤ Trái tim', sparkles: '✦ Sao nhấp nháy' }[ef]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'add' && (
                        <div className="p-2">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1.5">Thêm Section</p>
                            <p className="text-xs text-gray-400 px-2 py-1">Bật/tắt section trong tab Sections ↑</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EditorLeftSidebar;
