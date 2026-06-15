import React from 'react';
import { Undo2, Redo2, Eye, EyeOff, Share2, ChevronLeft, Save } from 'lucide-react';
import { InvitationData } from '../../../types';

const TEMPLATES = [
    { id: 'traditional', label: 'Truyền Thống', emoji: '🏮', color: '#7c1d00' },
    { id: 'romantic',    label: 'Lãng Mạn',    emoji: '💕', color: '#9b2948' },
    { id: 'modern',      label: 'Hiện Đại',    emoji: '✦', color: '#094cb2' },
    { id: 'royal',       label: 'Royal',        emoji: '👑', color: '#1e2c54' },
    { id: 'garden',      label: 'Garden',       emoji: '🌿', color: '#3f5e43' },
    { id: 'indochine',   label: 'Indochine',    emoji: '🪷', color: '#a8442a' },
] as const;

interface EditorTopBarProps {
    data: InvitationData;
    canUndo: boolean;
    canRedo: boolean;
    previewMode: boolean;
    onUndo: () => void;
    onRedo: () => void;
    onTogglePreview: () => void;
    onSave: () => void;
    onBack: () => void;
    onChange: (patch: Partial<InvitationData>) => void;
}

const EditorTopBar: React.FC<EditorTopBarProps> = ({
    data, canUndo, canRedo, previewMode,
    onUndo, onRedo, onTogglePreview, onSave, onBack, onChange,
}) => {
    const [showTemplates, setShowTemplates] = React.useState(false);
    const tid = data.templateId || 'traditional';

    return (
        <div className="flex items-center gap-2 px-3 h-12 bg-white border-b border-gray-100 z-20 shrink-0 select-none">
            {/* Back */}
            <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm transition-colors pr-2 border-r border-gray-100">
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Thoát</span>
            </button>

            {/* Template picker */}
            <div className="relative">
                <button
                    onClick={() => setShowTemplates(v => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                >
                    <span>{TEMPLATES.find(t => t.id === tid)?.emoji}</span>
                    <span className="hidden sm:inline">{TEMPLATES.find(t => t.id === tid)?.label}</span>
                    <span className="text-xs text-gray-400">▾</span>
                </button>
                {showTemplates && (
                    <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 p-2 grid grid-cols-3 gap-1 z-50 w-52">
                        {TEMPLATES.map(t => (
                            <button
                                key={t.id}
                                onClick={() => { onChange({ templateId: t.id as InvitationData['templateId'] }); setShowTemplates(false); }}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium transition-all ${tid === t.id ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-300' : 'hover:bg-gray-50 text-gray-700'}`}
                            >
                                <span className="text-xl">{t.emoji}</span>
                                <span className="leading-tight text-center">{t.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-0.5 border-l border-gray-100 pl-2">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Hoàn tác (Ctrl+Z)"
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 transition-colors"
                >
                    <Undo2 size={16} />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="Làm lại (Ctrl+Y)"
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 transition-colors"
                >
                    <Redo2 size={16} />
                </button>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Preview */}
            <button
                onClick={onTogglePreview}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium transition-colors ${previewMode ? 'bg-rose-100 text-rose-700' : 'hover:bg-gray-100 text-gray-600'}`}
                title="Xem trước thiệp"
            >
                {previewMode ? <EyeOff size={15} /> : <Eye size={15} />}
                <span className="hidden sm:inline">{previewMode ? 'Thoát xem' : 'Xem trước'}</span>
            </button>

            {/* Share */}
            <button
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                title="Chia sẻ"
            >
                <Share2 size={15} />
                <span className="hidden sm:inline">Chia sẻ</span>
            </button>

            {/* Save */}
            <button
                onClick={onSave}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-sm"
            >
                <Save size={15} />
                <span>Lưu</span>
            </button>
        </div>
    );
};

export default EditorTopBar;
