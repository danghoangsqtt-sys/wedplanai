import React, { useState, useRef, useEffect } from 'react';
import { Undo2, Redo2, ChevronLeft, Monitor, Smartphone, RotateCcw, Music, Minus, Plus } from 'lucide-react';
import { InvitationData } from '../../../types';

const COLOR_GROUPS: { label: string; colors: string[] }[] = [
    { label: 'Cổ điển', colors: ['#7c1d00', '#9b2948', '#8b0000', '#800020', '#a52a2a', '#c41e3a'] },
    { label: 'Hồng & Pastel', colors: ['#be185d', '#e11d48', '#f472b6', '#f9a8d4', '#fda4af', '#fecdd3'] },
    { label: 'Vàng & Nâu', colors: ['#92400e', '#b45309', '#c2a14d', '#d4a853', '#a8896c', '#7a5c3e'] },
    { label: 'Xanh lá', colors: ['#14532d', '#166534', '#3f5e43', '#4ade80', '#86efac', '#0f766e'] },
    { label: 'Xanh dương', colors: ['#1e2c54', '#094cb2', '#1d4ed8', '#3b82f6', '#60a5fa', '#7dd3fc'] },
    { label: 'Tím & Đặc biệt', colors: ['#581c87', '#6b21a8', '#7c3aed', '#a78bfa', '#a8442a', '#c25636'] },
    { label: 'Trung tính', colors: ['#000000', '#1a1a1a', '#374151', '#6b7280', '#9ca3af', '#d1d5db'] },
];

const TITLE_FONTS = [
    { id: 'Playfair Display', label: 'Playfair Display' },
    { id: 'EB Garamond', label: 'EB Garamond' },
    { id: 'Great Vibes', label: 'Great Vibes' },
    { id: 'Cormorant Garamond', label: 'Cormorant Garamond' },
    { id: 'Cinzel', label: 'Cinzel' },
    { id: 'Libre Baskerville', label: 'Libre Baskerville' },
    { id: 'Lora', label: 'Lora' },
    { id: 'Noto Serif', label: 'Noto Serif' },
    { id: 'Spectral', label: 'Spectral' },
    { id: 'Crimson Pro', label: 'Crimson Pro' },
];

const BODY_FONTS = [
    { id: 'Source Serif 4', label: 'Source Serif 4' },
    { id: 'Be Vietnam Pro', label: 'Be Vietnam Pro' },
    { id: 'DM Sans', label: 'DM Sans' },
    { id: 'Fahkwang', label: 'Fahkwang' },
    { id: 'Nunito', label: 'Nunito' },
    { id: 'Quicksand', label: 'Quicksand' },
    { id: 'Josefin Sans', label: 'Josefin Sans' },
    { id: 'Mulish', label: 'Mulish' },
];

const TITLE_SIZE_MIN = 1.5;
const TITLE_SIZE_MAX = 4.5;
const TITLE_SIZE_STEP = 0.25;
const TITLE_SIZE_DEFAULT = 2.5;

const BODY_SIZE_MIN = 12;
const BODY_SIZE_MAX = 22;
const BODY_SIZE_STEP = 1;
const BODY_SIZE_DEFAULT = 14;

interface EditorTopBarProps {
    data: InvitationData;
    canUndo: boolean;
    canRedo: boolean;
    previewMode: 'desktop' | 'mobile' | false;
    onUndo: () => void;
    onRedo: () => void;
    onSetPreview: (mode: 'desktop' | 'mobile' | false) => void;
    onSave: () => void;
    onBack: () => void;
    onReset: () => void;
    onChange: (patch: Partial<InvitationData>) => void;
}

// ─── Shared click-outside hook ───
const useClickOutside = (ref: React.RefObject<HTMLElement | null>, open: boolean, onClose: () => void) => {
    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open, ref, onClose]);
};

// ─── Font Dropdown ───
const FontDropdown: React.FC<{
    label: string;
    value: string;
    options: { id: string; label: string }[];
    onSelect: (id: string) => void;
}> = ({ label, value, options, onSelect }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useClickOutside(ref, open, () => setOpen(false));

    return (
        <div ref={ref} className="relative">
            <div className="text-[10px] text-gray-400 font-medium tracking-wide mb-0.5">{label}</div>
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 min-w-[160px] bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors text-left"
            >
                <span className="flex-1 text-sm text-gray-800 truncate" style={{ fontFamily: `'${value}', serif` }}>
                    {value}
                </span>
                <span className="text-[10px] text-gray-400">▾</span>
            </button>
            {open && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto py-1">
                    {options.map(f => (
                        <button
                            key={f.id}
                            onClick={() => { onSelect(f.id); setOpen(false); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${value === f.id ? 'bg-rose-50 text-rose-700 font-medium' : 'text-gray-700'}`}
                            style={{ fontFamily: `'${f.id}', serif` }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Enhanced Color Picker with grouped palette ───
const ColorPicker: React.FC<{
    label: string;
    value: string | undefined;
    defaultColor: string;
    onSelect: (color: string) => void;
}> = ({ label, value, defaultColor, onSelect }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const current = value || defaultColor;
    useClickOutside(ref, open, () => setOpen(false));

    return (
        <div ref={ref} className="relative">
            <div className="text-[10px] text-gray-400 font-medium tracking-wide mb-0.5">{label}</div>
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 px-2 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
            >
                <div
                    className="w-5 h-5 rounded-full border border-gray-200 shadow-inner"
                    style={{ background: current }}
                />
                <span className="text-[10px] text-gray-400">▾</span>
            </button>
            {open && (
                <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-3 w-[264px]">
                    {COLOR_GROUPS.map(g => (
                        <div key={g.label} className="mb-2 last:mb-0">
                            <div className="text-[10px] text-gray-400 font-medium tracking-wide mb-1">{g.label}</div>
                            <div className="flex flex-wrap gap-1">
                                {g.colors.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => { onSelect(c); setOpen(false); }}
                                        className="w-6 h-6 rounded-full transition-all duration-150 hover:scale-125 hover:shadow-md relative"
                                        style={{ background: c }}
                                        title={c}
                                    >
                                        {current === c && (
                                            <div className="absolute inset-0 rounded-full ring-2 ring-offset-2 ring-blue-500" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 pt-2 mt-1 border-t border-gray-100">
                        <input
                            type="color"
                            value={current}
                            onChange={e => onSelect(e.target.value)}
                            className="w-7 h-7 rounded cursor-pointer border-0 p-0"
                            title="Chọn màu tùy ý"
                        />
                        <input
                            type="text"
                            value={current}
                            onChange={e => {
                                const v = e.target.value;
                                if (/^#[0-9a-fA-F]{6}$/.test(v)) onSelect(v);
                            }}
                            className="flex-1 text-xs text-gray-600 font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-300"
                            maxLength={7}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Font Size Stepper ───
const SizeStepper: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    onChange: (v: number) => void;
}> = ({ label, value, min, max, step, unit, onChange }) => {
    const dec = () => onChange(Math.max(min, +(value - step).toFixed(2)));
    const inc = () => onChange(Math.min(max, +(value + step).toFixed(2)));
    const pct = ((value - min) / (max - min)) * 100;

    return (
        <div className="flex flex-col items-center">
            <div className="text-[10px] text-gray-400 font-medium tracking-wide mb-0.5">{label}</div>
            <div className="flex items-center gap-0.5 bg-gray-50 border border-gray-200 rounded-lg px-1 py-0.5">
                <button
                    onClick={dec}
                    disabled={value <= min}
                    className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20 text-gray-500 transition-colors"
                >
                    <Minus size={12} />
                </button>
                <div className="relative w-14 h-5 flex items-center group cursor-pointer" title={`${value}${unit}`}>
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded-full" />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 h-1 bg-rose-400 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                    />
                    <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={e => onChange(+e.target.value)}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                    />
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-rose-400 rounded-full shadow-sm transition-all pointer-events-none"
                        style={{ left: `calc(${pct}% - 6px)` }}
                    />
                </div>
                <button
                    onClick={inc}
                    disabled={value >= max}
                    className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-20 text-gray-500 transition-colors"
                >
                    <Plus size={12} />
                </button>
                <span className="text-[10px] text-gray-500 font-mono w-9 text-center">{value}{unit}</span>
            </div>
        </div>
    );
};

// ─── Main Top Bar ───
const EditorTopBar: React.FC<EditorTopBarProps> = ({
    data, canUndo, canRedo, previewMode,
    onUndo, onRedo, onSetPreview, onSave, onBack, onReset, onChange,
}) => {
    const currentTitleFont = data.fontTitle || 'Playfair Display';
    const currentBodyFont = data.fontBody || 'Be Vietnam Pro';
    const titleSize = data.titleSize ?? TITLE_SIZE_DEFAULT;
    const bodySize = data.bodySize ?? BODY_SIZE_DEFAULT;

    return (
        <div className="shrink-0 bg-white border-b border-gray-100 z-20 select-none">
            <div className="flex items-center gap-1.5 px-3 h-[52px]">
                {/* Back + History */}
                <button onClick={onBack} className="flex items-center text-rose-500 hover:text-rose-700 transition-colors border border-rose-200 rounded-lg px-2 py-1 hover:bg-rose-50">
                    <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-0.5 ml-1">
                    <button onClick={onReset} title="Đặt lại" className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                        <RotateCcw size={13} />
                    </button>
                    <button onClick={onUndo} disabled={!canUndo} title="Hoàn tác (Ctrl+Z)"
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 text-gray-500 transition-colors">
                        <Undo2 size={14} />
                    </button>
                    <button onClick={onRedo} disabled={!canRedo} title="Làm lại (Ctrl+Y)"
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-20 text-gray-500 transition-colors">
                        <Redo2 size={14} />
                    </button>
                </div>

                <div className="w-px h-7 bg-gray-200 mx-1" />

                {/* Title group: Font + Size + Color */}
                <FontDropdown label="Font tiêu đề" value={currentTitleFont} options={TITLE_FONTS}
                    onSelect={id => onChange({ fontTitle: id })} />
                <SizeStepper label="Cỡ tiêu đề" value={titleSize} min={TITLE_SIZE_MIN} max={TITLE_SIZE_MAX}
                    step={TITLE_SIZE_STEP} unit="rem" onChange={v => onChange({ titleSize: v })} />
                <ColorPicker label="Màu tiêu đề" value={data.titleColor}
                    defaultColor={data.themeColor || '#7c1d00'} onSelect={c => onChange({ titleColor: c })} />

                <div className="w-px h-7 bg-gray-200 mx-1" />

                {/* Body group: Font + Size + Color */}
                <FontDropdown label="Font nội dung" value={currentBodyFont} options={BODY_FONTS}
                    onSelect={id => onChange({ fontBody: id })} />
                <SizeStepper label="Cỡ nội dung" value={bodySize} min={BODY_SIZE_MIN} max={BODY_SIZE_MAX}
                    step={BODY_SIZE_STEP} unit="px" onChange={v => onChange({ bodySize: v })} />
                <ColorPicker label="Màu nội dung" value={data.bodyColor}
                    defaultColor="#1c1b1b" onSelect={c => onChange({ bodyColor: c })} />

                <div className="flex-1" />

                {/* Preview toggle */}
                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => onSetPreview(previewMode === 'desktop' ? false : 'desktop')}
                        className={`p-1.5 transition-colors ${previewMode === 'desktop' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                        title="Xem Desktop"
                    >
                        <Monitor size={15} />
                    </button>
                    <button
                        onClick={() => onSetPreview(previewMode === 'mobile' ? false : 'mobile')}
                        className={`p-1.5 transition-colors ${previewMode === 'mobile' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
                        title="Xem Mobile"
                    >
                        <Smartphone size={15} />
                    </button>
                </div>

                <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors" title="Nhạc nền">
                    <Music size={15} />
                </button>

                <button onClick={onSave}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-sm">
                    Lưu Trang
                </button>
            </div>
        </div>
    );
};

export default EditorTopBar;
