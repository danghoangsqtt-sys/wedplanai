import { InlineRichText } from './InlineRichText';
import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { InvitationData, LoveStoryEvent, GuestWish, WeddingEvent, SectionId } from '../../types';
import { MapPin, Calendar, Clock, Heart, Gift, Send, Camera, MessageCircle, ChevronDown, ChevronLeft, ChevronRight, X, Volume2, VolumeX, Navigation, Bold, Italic, Underline, Strikethrough, Palette, Type } from 'lucide-react';
import { sanitizeMapUrl, sanitizeAudioUrl } from '../../lib/sanitize';

export interface EditorConfig {
    selectedSection?: string;
    onSectionClick?: (sectionId: string) => void;
    onFieldEdit?: (field: string, value: string) => void;
}

const stripHtml = (html: string) => html ? html.replace(/<[^>]*>?/gm, '') : '';

interface InvitationPreviewProps {
    data: InvitationData;
    onRSVP?: () => void;
    onGuestbook?: () => void;
    editorConfig?: EditorConfig;
    hideAudio?: boolean; // When true, suppress built-in music button (parent manages audio)
}

/* ============================================================
   THEME CONFIG — Each template maps to CSS custom properties
   ============================================================ */
const DRESS_CODE_PALETTES: Record<string, string[]> = {
    traditional: ['#7c1d00', '#c79a4b', '#f5e6d3', '#2c1810', '#ffffff'],
    romantic:    ['#9b2948', '#e0a96d', '#fce4e8', '#6d4c55', '#ffffff'],
    modern:      ['#094cb2', '#1b1c1d', '#eef1f6', '#7c8aa5', '#ffffff'],
    royal:       ['#1e2c54', '#c2a14d', '#f8f5ee', '#2e4078', '#ffffff'],
    garden:      ['#3f5e43', '#c08a5e', '#e7ece0', '#557a52', '#ffffff'],
    indochine:   ['#a8442a', '#4e8d6e', '#efe4d3', '#5c4a3c', '#ffffff'],
};

const THEME_VARS: Record<string, Record<string, string>> = {
    traditional: {
        '--t-primary': '#7c1d00',
        '--t-primary-container': '#a12f0c',
        '--t-surface': '#fdf8f6',
        '--t-surface-dim': '#f1edeb',
        '--t-on-surface': '#1c1b1b',
        '--t-on-surface-variant': '#58413b',
        '--t-accent': '#c79a4b',
        '--t-outline': '#e0bfb7',
        '--t-card-bg': '#ffffff',
        '--t-hero-overlay': 'linear-gradient(to top, rgba(253,248,246,0.96) 0%, rgba(253,248,246,0.62) 35%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.28) 100%)',
        '--t-font-display': "'Playfair Display', serif",
        '--t-font-body': "'Source Serif 4', serif",
        '--t-font-label': "'Be Vietnam Pro', sans-serif",
        '--t-font-script': "'Playfair Display', serif",
        '--t-hero-rounded': '0',
        '--t-card-radius': '12px',
        '--t-card-border': 'rgba(224,191,183,0.4)',
        '--t-section-radius': '0',
    },
    romantic: {
        '--t-primary': '#9b2948',
        '--t-primary-container': '#c7365f',
        '--t-surface': '#fff0f3',
        '--t-surface-dim': '#fce4e8',
        '--t-on-surface': '#2a1f21',
        '--t-on-surface-variant': '#6d4c55',
        '--t-accent': '#e0a96d',
        '--t-outline': '#e8b4c0',
        '--t-card-bg': 'rgba(255,255,255,0.72)',
        '--t-hero-overlay': 'linear-gradient(to top, rgba(255,240,243,0.96) 0%, rgba(255,240,243,0.5) 35%, rgba(0,0,0,0.1) 65%, rgba(0,0,0,0.22) 100%)',
        '--t-font-display': "'Great Vibes', cursive",
        '--t-font-body': "'Source Serif 4', serif",
        '--t-font-label': "'Be Vietnam Pro', sans-serif",
        '--t-font-script': "'Great Vibes', cursive",
        '--t-hero-rounded': '0 0 3rem 3rem',
        '--t-card-radius': '2rem',
        '--t-card-border': 'rgba(255,255,255,0.7)',
        '--t-section-radius': '3rem',
    },
    modern: {
        '--t-primary': '#094cb2',
        '--t-primary-container': '#3366cc',
        '--t-surface': '#faf9fa',
        '--t-surface-dim': '#eef1f6',
        '--t-on-surface': '#1b1c1d',
        '--t-on-surface-variant': '#434653',
        '--t-accent': '#7c8aa5',
        '--t-outline': '#c3c6d5',
        '--t-card-bg': '#ffffff',
        '--t-hero-overlay': 'linear-gradient(to top, rgba(250,249,250,0.96) 0%, rgba(250,249,250,0.5) 40%, rgba(0,0,0,0.05) 70%, rgba(0,0,0,0.16) 100%)',
        '--t-font-display': "'Cinzel', serif",
        '--t-font-body': "'DM Sans', sans-serif",
        '--t-font-label': "'DM Sans', sans-serif",
        '--t-font-script': "'Cinzel', serif",
        '--t-hero-rounded': '0 0 1.5rem 1.5rem',
        '--t-card-radius': '16px',
        '--t-card-border': 'rgba(195,198,213,0.35)',
        '--t-section-radius': '0',
    },
    royal: {
        '--t-primary': '#1e2c54',
        '--t-primary-container': '#2e4078',
        '--t-surface': '#f8f5ee',
        '--t-surface-dim': '#efe9da',
        '--t-on-surface': '#1a1f2e',
        '--t-on-surface-variant': '#4a4538',
        '--t-accent': '#c2a14d',
        '--t-outline': '#d8c9a3',
        '--t-card-bg': '#fffdf8',
        '--t-hero-overlay': 'linear-gradient(to top, rgba(248,245,238,0.96) 0%, rgba(248,245,238,0.5) 35%, rgba(0,0,0,0.22) 65%, rgba(0,0,0,0.5) 100%)',
        '--t-font-display': "'Playfair Display', serif",
        '--t-font-body': "'Source Serif 4', serif",
        '--t-font-label': "'Be Vietnam Pro', sans-serif",
        '--t-font-script': "'Playfair Display', serif",
        '--t-hero-rounded': '0',
        '--t-card-radius': '4px',
        '--t-card-border': 'rgba(194,161,77,0.45)',
        '--t-section-radius': '0',
    },
    garden: {
        '--t-primary': '#3f5e43',
        '--t-primary-container': '#557a52',
        '--t-surface': '#f4f6ef',
        '--t-surface-dim': '#e7ece0',
        '--t-on-surface': '#1f261d',
        '--t-on-surface-variant': '#4a5547',
        '--t-accent': '#c08a5e',
        '--t-outline': '#cdd6c4',
        '--t-card-bg': '#ffffff',
        '--t-hero-overlay': 'linear-gradient(to top, rgba(244,246,239,0.96) 0%, rgba(244,246,239,0.5) 38%, rgba(0,0,0,0.08) 70%, rgba(0,0,0,0.22) 100%)',
        '--t-font-display': "'Playfair Display', serif",
        '--t-font-body': "'Source Serif 4', serif",
        '--t-font-label': "'Be Vietnam Pro', sans-serif",
        '--t-font-script': "'Great Vibes', cursive",
        '--t-hero-rounded': '0 0 2.5rem 2.5rem',
        '--t-card-radius': '1.25rem',
        '--t-card-border': 'rgba(205,214,196,0.6)',
        '--t-section-radius': '2.5rem',
    },
    indochine: {
        '--t-primary': '#a8442a',
        '--t-primary-container': '#c25636',
        '--t-surface': '#f8f1e7',
        '--t-surface-dim': '#efe4d3',
        '--t-on-surface': '#2a201a',
        '--t-on-surface-variant': '#5c4a3c',
        '--t-accent': '#4e8d6e',
        '--t-outline': '#dcc9b0',
        '--t-card-bg': '#fffaf2',
        '--t-hero-overlay': 'linear-gradient(to top, rgba(248,241,231,0.96) 0%, rgba(248,241,231,0.5) 35%, rgba(0,0,0,0.18) 66%, rgba(0,0,0,0.42) 100%)',
        '--t-font-display': "'Playfair Display', serif",
        '--t-font-body': "'Source Serif 4', serif",
        '--t-font-label': "'Be Vietnam Pro', sans-serif",
        '--t-font-script': "'Playfair Display', serif",
        '--t-hero-rounded': '0',
        '--t-card-radius': '2px',
        '--t-card-border': 'rgba(78,141,110,0.4)',
        '--t-section-radius': '0',
    },
};

// ─── GOOGLE DRIVE URL RESOLVER ───
const resolveImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return url;
    const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
    return url;
};

// ─── SCROLL REVEAL HOOK ───
// Re-observes only when the SET of sections changes (lightweight key),
// not on every keystroke into the invitation data.
const useScrollReveal = (revealKey: string) => {
    useEffect(() => {
        const obs = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('rv-on'); }),
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );
        const t = setTimeout(() => document.querySelectorAll('.rv:not(.rv-on)').forEach(el => obs.observe(el)), 80);
        return () => { clearTimeout(t); obs.disconnect(); };
    }, [revealKey]);
};

// ─── FLOATING PETALS / HEARTS ───
const FloatingEffect: React.FC<{ type: 'petals' | 'hearts' | 'sparkles' }> = ({ type }) => {
    const items = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        dur: `${5 + Math.random() * 5}s`,
        delay: `${Math.random() * 6}s`,
        drift: `${-40 + Math.random() * 80}px`,
        size: `${12 + Math.random() * 8}px`,
    })), []);
    const emoji = type === 'hearts' ? '❤' : type === 'sparkles' ? '✦' : '✿';
    const color = type === 'hearts' ? '#e11d48' : type === 'sparkles' ? 'var(--t-accent)' : '#f9a8d4';
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-[30]" aria-hidden>
            {items.map(p => (
                <span key={p.id} className="iv-float" style={{
                    position: 'absolute', top: '-24px', left: p.left, fontSize: p.size, color,
                    '--fd': p.dur, '--fdl': p.delay, '--fdr': p.drift, opacity: 0.6,
                } as React.CSSProperties}>{emoji}</span>
            ))}
        </div>
    );
};

// ─── ORNAMENTAL DIVIDER ───
const Divider: React.FC<{ className?: string; glyph?: string }> = ({ className = '', glyph }) => (
    <div className={`flex items-center justify-center gap-3 py-5 ${className}`}>
        <div className="w-16 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--t-accent), transparent)' }} />
        <span className="text-base leading-none" style={{ color: 'var(--t-accent)' }}>{glyph || '✦'}</span>
        <div className="w-16 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--t-accent), transparent)' }} />
    </div>
);

// ─── COUNTDOWN HOOK ───
const useCountdown = (targetDate: string) => {
    const [diff, setDiff] = useState({ d: 0, h: 0, m: 0, s: 0 });
    useEffect(() => {
        if (!targetDate) return;
        const tick = () => {
            const now = Date.now();
            const target = new Date(targetDate).getTime();
            const ms = Math.max(0, target - now);
            setDiff({
                d: Math.floor(ms / 86400000),
                h: Math.floor((ms % 86400000) / 3600000),
                m: Math.floor((ms % 3600000) / 60000),
                s: Math.floor((ms % 60000) / 1000),
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetDate]);
    return diff;
};

// ─── LIGHTBOX ───
const Lightbox: React.FC<{ images: string[]; index: number; onClose: () => void }> = ({ images, index, onClose }) => {
    const [cur, setCur] = useState(index);
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') setCur(c => (c + 1) % images.length);
            if (e.key === 'ArrowLeft') setCur(c => (c - 1 + images.length) % images.length);
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [images.length, onClose]);
    return (
        <div className="fixed inset-0 z-[999] bg-black/90 flex items-center justify-center" onClick={onClose}>
            <button className="absolute top-4 right-4 text-white/80 hover:text-white z-10" onClick={onClose} aria-label="Đóng"><X size={28} /></button>
            <img src={images[cur]} alt="" className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
            {images.length > 1 && (
                <div className="absolute bottom-6 flex gap-2">
                    {images.map((_, i) => (
                        <button key={i} aria-label={`Ảnh ${i + 1}`} className={`w-2 h-2 rounded-full transition-all ${i === cur ? 'bg-white scale-125' : 'bg-white/40'}`}
                            onClick={e => { e.stopPropagation(); setCur(i); }} />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── QR CODE ───
const QRCodeImage: React.FC<{ bankId: string; accountNumber: string; accountName: string }> = ({ bankId, accountNumber, accountName }) => {
    const url = `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png?accountName=${encodeURIComponent(accountName)}`;
    return <img src={url} alt="QR Mừng Cưới" className="iv-qr-img" />;
};

// ─── BENTO GALLERY TILE PATTERN ───
// Adaptive: <3 images → uniform grid; ≥3 → varied wide/tall tiles for a bento rhythm.
const bentoClass = (i: number, total: number): string => {
    if (total < 3) return '';
    const p = i % 6;
    if (p === 0) return 'iv-gal-wide';
    if (p === 3) return 'iv-gal-tall';
    return '';
};

// ─── FLOATING TEXT TOOLBAR ───
const FloatingTextToolbar: React.FC<{ containerRef: React.RefObject<HTMLDivElement | null> }> = ({ containerRef }) => {
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
    const [active, setActive] = useState<Record<string, boolean>>({});
    const [savedRange, setSavedRange] = useState<Range | null>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);

    const updateToolbar = useCallback(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) { setPos(null); return; }
        const anchor = sel.anchorNode?.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode as HTMLElement;
        if (!anchor || !containerRef.current?.contains(anchor)) { setPos(null); return; }
        const editable = anchor.closest('[contenteditable]');
        if (!editable) { setPos(null); return; }

        const range = sel.getRangeAt(0);
        setSavedRange(range.cloneRange());

        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        setPos({
            x: rect.left + rect.width / 2 - containerRect.left,
            y: rect.top - containerRect.top - 48,
        });
        setActive({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikeThrough: document.queryCommandState('strikeThrough'),
        });
    }, [containerRef]);

    useEffect(() => {
        document.addEventListener('selectionchange', updateToolbar);
        return () => document.removeEventListener('selectionchange', updateToolbar);
    }, [updateToolbar]);

    const exec = (cmd: string, val: string = '') => {
        const sel = window.getSelection();
        if (sel && savedRange) {
            sel.removeAllRanges();
            sel.addRange(savedRange);
        }
        document.execCommand('styleWithCSS', false, 'true');
        document.execCommand(cmd, false, val);
        updateToolbar();
    };

    const applyFontSize = (sizePx: number) => {
        const sel = window.getSelection();
        if (sel && savedRange) {
            sel.removeAllRanges();
            sel.addRange(savedRange);
        }
        if (!sel || !sel.rangeCount) return;

        let range = sel.getRangeAt(0);
        if (range.collapsed) {
            // No text selected — select all content in the focused contenteditable
            const anchor = sel.anchorNode?.nodeType === 3
                ? (sel.anchorNode as Text).parentElement
                : sel.anchorNode as HTMLElement | null;
            const editable = anchor?.closest?.('[contenteditable]');
            if (!editable) return;
            sel.removeAllRanges();
            const allRange = document.createRange();
            allRange.selectNodeContents(editable);
            sel.addRange(allRange);
            if (!sel.rangeCount) return;
            range = sel.getRangeAt(0);
            if (range.collapsed) return;
        }

        const content = range.extractContents();
        const elements = content.querySelectorAll('*');
        elements.forEach(el => {
            if (el instanceof HTMLElement) el.style.fontSize = '';
            if (el.tagName === 'FONT') el.removeAttribute('size');
        });

        const span = document.createElement('span');
        span.style.fontSize = `${sizePx}px`;
        span.appendChild(content);
        range.insertNode(span);
        updateToolbar();
    };

    if (!pos) return null;
    const btns = [
        { cmd: 'bold', icon: <Bold size={15} />, label: 'B' },
        { cmd: 'italic', icon: <Italic size={15} />, label: 'I' },
        { cmd: 'underline', icon: <Underline size={15} />, label: 'U' },
        { cmd: 'strikeThrough', icon: <Strikethrough size={15} />, label: 'S' },
    ];

    const colors = ['#000000', '#ffffff', '#e11d48', '#094cb2', '#1e2c54', '#3f5e43', '#a8442a', '#7c1d00', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#64748b', '#d97706', '#be123c', '#4338ca'];
    const fonts = ['Arial', 'Times New Roman', 'Dancing Script', 'Playfair Display', 'Great Vibes', 'Montserrat', 'Inter', 'Cormorant Garamond'];
    const sizes = [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72];

    return (
        <div
            ref={toolbarRef}
            className="iv-text-toolbar"
            style={{ left: pos.x, top: pos.y }}
            onMouseDown={e => e.preventDefault()}
        >
            <span className="iv-toolbar-label hidden sm:inline">Sửa</span>
            <div className="iv-toolbar-sep hidden sm:block" />
            
            {btns.map(b => (
                <button
                    key={b.cmd}
                    onClick={() => exec(b.cmd)}
                    className={`iv-toolbar-btn ${active[b.cmd] ? 'iv-toolbar-active' : ''}`}
                    title={b.label}
                >
                    {b.icon}
                </button>
            ))}

            <div className="iv-toolbar-sep" />

            {/* Màu chữ */}
            <div className="relative group flex">
                <button className="iv-toolbar-btn" title="Màu chữ">
                    <Palette size={15} />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#1f2937] shadow-xl rounded-lg p-2 hidden group-hover:grid grid-cols-4 gap-1.5 w-36 z-[100] before:content-[''] before:absolute before:-top-2 before:left-0 before:w-full before:h-2">
                    {colors.map(c => (
                        <button 
                            key={c}
                            className="w-6 h-6 rounded-full border border-gray-500 hover:scale-110 transition-transform"
                            style={{ backgroundColor: c }}
                            onMouseDown={e => { e.preventDefault(); exec('foreColor', c); }}
                            title={c}
                        />
                    ))}
                </div>
            </div>

            {/* Phông chữ */}
            <div className="relative group flex">
                <button className="iv-toolbar-btn" title="Phông chữ">
                    <Type size={15} />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#1f2937] shadow-xl rounded-lg py-2 hidden group-hover:flex flex-col w-40 z-[100] before:content-[''] before:absolute before:-top-2 before:left-0 before:w-full before:h-2">
                    {fonts.map(f => (
                        <button 
                            key={f}
                            className="px-3 py-1.5 text-sm text-left hover:bg-gray-700 truncate text-white"
                            style={{ fontFamily: f }}
                            onMouseDown={e => { e.preventDefault(); exec('fontName', f); }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Kích cỡ */}
            <div className="relative group flex">
                <button className="iv-toolbar-btn font-serif font-bold text-sm flex items-center justify-center gap-0.5" title="Kích cỡ chữ">
                    <span>A</span><span className="text-[10px]">a</span>
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-[#1f2937] shadow-xl rounded-lg py-2 hidden group-hover:grid grid-cols-3 gap-1 w-48 z-[100] before:content-[''] before:absolute before:-top-2 before:left-0 before:w-full before:h-2 max-h-[250px] overflow-y-auto">
                    {sizes.map(s => (
                        <button 
                            key={s}
                            className="px-2 py-1.5 text-sm text-center hover:bg-gray-700 text-white rounded"
                            onMouseDown={e => { e.preventDefault(); applyFontSize(s); }}
                        >
                            Cỡ {s}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── 3D CAROUSEL GALLERY ───
const Gallery3DCarousel: React.FC<{ images: string[]; positions?: string[]; configs?: Array<{ scale: number; x: number; y: number } | null>; onImageClick: (idx: number) => void; fit?: 'cover' | 'contain' }> = ({ images, positions, configs, onImageClick, fit = 'cover' }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const next = () => setActiveIndex(prev => Math.min(prev + 1, images.length - 1));
    const prev = () => setActiveIndex(p => Math.max(p - 1, 0));

    return (
        <div className="relative w-full h-[320px] sm:h-[420px] flex items-center justify-center overflow-visible mb-8" style={{ perspective: '1000px' }}>
            <button 
                onClick={(e) => { e.stopPropagation(); prev(); }} 
                disabled={activeIndex === 0}
                className="absolute left-2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous image"
            >
                <ChevronLeft size={20} />
            </button>

            <div className="relative w-48 h-72 sm:w-64 sm:h-96" style={{ transformStyle: 'preserve-3d' }}>
                {images.map((img, i) => {
                    const offset = i - activeIndex;
                    const absOffset = Math.abs(offset);
                    const isActive = offset === 0;
                    
                    let transform = '';
                    let opacity = 1;
                    let zIndex = 10 - absOffset;

                    if (isActive) {
                        transform = 'translateX(0) scale(1) translateZ(0)';
                    } else if (offset < 0) {
                        transform = `translateX(-${40 + absOffset * 30}%) scale(${1 - absOffset * 0.15}) translateZ(-${absOffset * 80}px) rotateY(25deg)`;
                        opacity = Math.max(0, 1 - absOffset * 0.3);
                    } else {
                        transform = `translateX(${40 + absOffset * 30}%) scale(${1 - absOffset * 0.15}) translateZ(-${absOffset * 80}px) rotateY(-25deg)`;
                        opacity = Math.max(0, 1 - absOffset * 0.3);
                    }

                    if (absOffset > 2) opacity = 0; // hide others

                    return (
                        <div 
                            key={i} 
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isActive) onImageClick(i);
                                else setActiveIndex(i);
                            }}
                            className="absolute inset-0 transition-all duration-500 ease-out cursor-pointer rounded-xl overflow-hidden shadow-2xl bg-[var(--t-surface-dim)]"
                            style={{ 
                                transform,
                                opacity,
                                zIndex,
                                visibility: opacity === 0 ? 'hidden' : 'visible'
                            }}
                        >
                            {(() => {
                                const cfg = configs?.[i];
                                const posClass = (!cfg && positions?.[i]) || 'object-center';
                                const style = cfg ? {
                                    objectPosition: `${cfg.x}% ${cfg.y}%`,
                                    transform: cfg.scale !== 1 ? `scale(${cfg.scale})` : undefined,
                                    transformOrigin: `${cfg.x}% ${cfg.y}%`
                                } : undefined;
                                
                                return (
                                    <img 
                                        src={img} 
                                        alt={`Gallery ${i}`} 
                                        className={`w-full h-full ${fit === 'contain' ? 'object-contain bg-black/5' : `object-cover ${cfg ? '' : posClass}`}`} 
                                        style={style}
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; e.currentTarget.parentElement?.classList.add('bg-[var(--t-surface-dim)]'); }} 
                                    />
                                );
                            })()}
                        </div>
                    );
                })}
            </div>

            <button 
                onClick={(e) => { e.stopPropagation(); next(); }} 
                disabled={activeIndex === images.length - 1}
                className="absolute right-2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/30 text-white hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Next image"
            >
                <ChevronRight size={20} />
            </button>
            
            <div className="absolute -bottom-6 text-center text-xs opacity-60 w-full font-medium tracking-widest text-[var(--t-on-surface)]">
                {activeIndex + 1} / {images.length}
            </div>
        </div>
    );
};

// ─── COUPLE PROFILE CARD ───
interface CoupleProfileCardProps {
    label: string;     // 'Chú Rể' | 'Cô Dâu'
    name: string;
    profile: {
        photo?: string;
        fatherName?: string;
        motherName?: string;
        bio?: string;
        bioColor?: string;
        bioExpandable?: boolean;
    };
}
const CoupleProfileCard: React.FC<CoupleProfileCardProps> = ({ label, name, profile }) => {
    const [expanded, setExpanded] = useState(false);
    const bioColor = profile.bioColor || '#4A90D9';
    const BIO_LIMIT = 120;
    const bioText = profile.bio || '';
    const showToggle = profile.bioExpandable && bioText.length > BIO_LIMIT;
    const displayedBio = showToggle && !expanded ? bioText.slice(0, BIO_LIMIT) + '...' : bioText;
    return (
        <div className="rv" style={{ textAlign: 'center', padding: '0 0.5rem' }}>
            {/* Circular photo */}
            {profile.photo && (
                <div style={{
                    width: '160px', height: '160px', borderRadius: '50%', overflow: 'hidden',
                    margin: '0 auto 1rem', border: '3px solid #eee',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}>
                    <img src={profile.photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}
            {/* Role label */}
            <p style={{ fontSize: '0.7rem', color: '#aaa', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                ✦ {label} ✦
            </p>
            {/* Name in display font */}
            <h3 style={{ fontSize: '1.4rem', fontFamily: 'var(--t-font-display)', color: 'var(--t-on-surface)', marginBottom: '0.75rem', fontWeight: 400 }}>{name}</h3>
            {/* Parents */}
            {profile.fatherName && (
                <p style={{ fontSize: '0.82rem', color: '#555', marginBottom: '0.2rem' }}>
                    Con ông: <strong>{profile.fatherName}</strong>
                </p>
            )}
            {profile.motherName && (
                <p style={{ fontSize: '0.82rem', color: '#555', marginBottom: '0.75rem' }}>
                    Con bà: <strong>{profile.motherName}</strong>
                </p>
            )}
            {/* Bio */}
            {bioText && (
                <div>
                    <p style={{ fontSize: '0.88rem', color: bioColor, lineHeight: 1.8, textAlign: 'center', margin: '0 auto', maxWidth: '340px' }}>
                        {displayedBio}
                    </p>
                    {showToggle && (
                        <button
                            onClick={() => setExpanded(e => !e)}
                            style={{ color: '#888', fontSize: '0.8rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.5rem', textDecoration: 'underline' }}
                        >
                            {expanded ? 'Thu gọn' : 'Xem thêm'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── ADD TO CALENDAR BUTTON ───
interface AddToCalendarProps {
    title: string;
    date?: string;          // ISO or dd/MM/yyyy
    time?: string;          // e.g. "18:00"
    location?: string;
}
const AddToCalendarButton: React.FC<AddToCalendarProps> = ({ title, date, time, location }) => {
    const [open, setOpen] = useState(false);

    const buildGoogleUrl = () => {
        if (!date) return '#';
        // parse date: prefer ISO (YYYY-MM-DD), else try dd/MM/yyyy
        let d: Date;
        if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
            d = new Date(date);
        } else {
            const parts = date.replace(/\//g, '-').split('-');
            if (parts.length === 3 && parts[0].length <= 2) {
                d = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
            } else {
                d = new Date(date);
            }
        }
        if (isNaN(d.getTime())) return '#';
        const [h = '0', m = '0'] = (time || '0:00').split(':');
        d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        const endD = new Date(d.getTime() + 2 * 60 * 60 * 1000); // +2h default
        const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: title,
            dates: `${fmt(d)}/${fmt(endD)}`,
            location: location || '',
        });
        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    };

    const buildICS = () => {
        if (!date) return;
        let d: Date;
        if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
            d = new Date(date);
        } else {
            const parts = date.replace(/\//g, '-').split('-');
            if (parts.length === 3 && parts[0].length <= 2) {
                d = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
            } else {
                d = new Date(date);
            }
        }
        if (isNaN(d.getTime())) return;
        const [h = '0', m = '0'] = (time || '0:00').split(':');
        d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
        const endD = new Date(d.getTime() + 2 * 60 * 60 * 1000);
        const fmt = (dt: Date) => dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const ics = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WedPlan AI//VI',
            'BEGIN:VEVENT',
            `UID:${Date.now()}@wedplan.ai`,
            `SUMMARY:${title}`,
            `DTSTART:${fmt(d)}`,
            `DTEND:${fmt(endD)}`,
            location ? `LOCATION:${location}` : '',
            'END:VEVENT', 'END:VCALENDAR',
        ].filter(Boolean).join('\r\n');
        const blob = new Blob([ics], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${title.replace(/\s+/g, '_')}.ics`; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setOpen(false);
    };

    if (!date) return null;

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                title="Thêm vào lịch"
                style={{
                    marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '0.72rem', color: 'var(--t-primary)', fontWeight: 600,
                    background: 'rgba(var(--t-primary-rgb,0,0,0),0.06)',
                    border: '1px solid rgba(var(--t-primary-rgb,0,0,0),0.15)',
                    borderRadius: '20px', padding: '4px 10px', cursor: 'pointer',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    transition: 'background 0.2s',
                }}
            >
                📅 Thêm vào lịch
            </button>
            {open && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, marginTop: '4px',
                    background: '#fff', border: '1px solid #eee', borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '180px', overflow: 'hidden',
                }}>
                    <a
                        href={buildGoogleUrl()} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#333', textDecoration: 'none' }}
                        onClick={() => setOpen(false)}
                    >
                        🗓️ Google Calendar
                    </a>
                    <div style={{ borderTop: '1px solid #f0f0f0' }} />
                    <button
                        type="button"
                        onClick={buildICS}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', fontSize: '0.82rem', color: '#333', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
                    >
                        📥 Tải file .ics
                    </button>
                </div>
            )}
            {open && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />}
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
const InvitationPreview: React.FC<InvitationPreviewProps> = ({ data, onRSVP, onGuestbook, editorConfig, hideAudio }) => {
    const ec = editorConfig;
    const rootRef = useRef<HTMLDivElement>(null);
    const secProps = (id: string, extraStyle?: React.CSSProperties) => {
        const secStyleVars: any = {};
        if (data.sectionStyles && data.sectionStyles[id as SectionId]) {
            const st = data.sectionStyles[id as SectionId]!;
            if (st.fontTitle) secStyleVars['--t-font-display'] = `'${st.fontTitle}', serif`;
            if (st.fontBody) secStyleVars['--t-font-body'] = `'${st.fontBody}', sans-serif`;
            if (st.titleColor) secStyleVars['--t-primary'] = st.titleColor;
            if (st.bodyColor) {
                secStyleVars['--t-on-surface'] = st.bodyColor;
                secStyleVars['--t-on-surface-variant'] = st.bodyColor;
            }
            if (st.titleSize) secStyleVars['--t-title-scale'] = `${st.titleSize}rem`;
            if (st.bodySize) secStyleVars['--t-body-size'] = `${st.bodySize}px`;
        }

        if (!ec) return { style: { ...secStyleVars, ...extraStyle } };

        return {
            'data-sec': id,
            onClick: (e: React.MouseEvent) => {
                if ((e.target as HTMLElement).isContentEditable) return;
                e.stopPropagation(); ec.onSectionClick?.(id);
            },
            style: { 
                ...secStyleVars,
                position: 'relative' as const, cursor: 'pointer',
                outline: ec.selectedSection === id ? '2px solid #ec4899' : undefined,
                outlineOffset: ec.selectedSection === id ? '-2px' : undefined,
                ...extraStyle
            },
        };
    };

    // Inline editable text props — makes text contentEditable in editor mode
    const editProps = (field: string, placeholder?: string) => ec?.onFieldEdit ? {
        contentEditable: true,
        suppressContentEditableWarning: true,
        'data-field': field,
        'data-placeholder': placeholder,
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
        onBlur: (e: React.FocusEvent<HTMLElement>) => {
            const text = e.currentTarget.textContent?.trim() || '';
            ec.onFieldEdit!(field, text);
        },
        onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                (e.target as HTMLElement).blur();
            }
        },
        style: {
            outline: 'none',
            cursor: 'text',
            borderBottom: '2px solid transparent',
            transition: 'border-color 0.2s',
        },
        onFocus: (e: React.FocusEvent<HTMLElement>) => {
            e.currentTarget.style.borderBottomColor = '#3b82f6';
        },
        onBlurCapture: (e: React.FocusEvent<HTMLElement>) => {
            e.currentTarget.style.borderBottomColor = 'transparent';
        },
    } as Record<string, unknown> : {};

    // Inline editable text props (RICH TEXT) — saves HTML content
    const richEditProps = (field: string, placeholder?: string) => ec?.onFieldEdit ? {
        contentEditable: true,
        suppressContentEditableWarning: true,
        'data-field': field,
        'data-placeholder': placeholder,
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
        onBlur: (e: React.FocusEvent<HTMLElement>) => {
            const html = e.currentTarget.innerHTML || '';
            ec.onFieldEdit!(field, html);
        },
        style: {
            outline: 'none',
            cursor: 'text',
            borderBottom: '2px solid transparent',
            transition: 'border-color 0.2s',
        },
        onFocus: (e: React.FocusEvent<HTMLElement>) => {
            e.currentTarget.style.borderBottomColor = '#3b82f6';
        },
        onBlurCapture: (e: React.FocusEvent<HTMLElement>) => {
            e.currentTarget.style.borderBottomColor = 'transparent';
        },
    } as Record<string, unknown> : {};
    const countdown = useCountdown(data.date);
    const [lbIndex, setLbIndex] = useState<number | null>(null);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const safeMapLink = sanitizeMapUrl(data.mapLink);
    const safeMusicUrl = sanitizeAudioUrl(data.musicUrl);

    const toggleAudio = useCallback(() => {
        if (!audioRef.current && safeMusicUrl) {
            audioRef.current = new Audio(safeMusicUrl);
            audioRef.current.loop = true;
        }
        if (audioRef.current) {
            if (audioPlaying) { audioRef.current.pause(); }
            else { audioRef.current.play().catch(() => { }); }
            setAudioPlaying(!audioPlaying);
        }
    }, [audioPlaying, safeMusicUrl]);

    const groomName = data.groomName || 'Chú Rể';
    const brideName = data.brideName || 'Cô Dâu';
    const brideFirst = data.displayOrder === 'bride_first';
    const tid = data.templateId || 'traditional';
    const isRomantic = tid === 'romantic';
    const isModern = tid === 'modern';
    const isGarden = tid === 'garden';
    const isRoyal = tid === 'royal';
    const isIndochine = tid === 'indochine';
    const isTraditional = tid === 'traditional';

    // Feature flags
    const hasCountdown = data.countdownEnabled !== false && data.date;
    const hasEvents = data.events && data.events.length > 0;
    const hasGallery = data.galleryImages && data.galleryImages.length > 0;
    const bankList = data.bankAccounts || (data.bankInfo?.bankId ? [data.bankInfo] : []);
    const hasBank = bankList.length > 0 && bankList.some(b => b.bankId && b.accountNumber);
    const hasLoveStory = data.loveStory && data.loveStory.length > 0;
    const hasRSVP = data.rsvpEnabled;
    const gp = data.groomParents;
    const bp = data.brideParents;
    const hasParents = !!(gp?.father || gp?.mother || bp?.father || bp?.mother);
    const hasVenue = !!(data.location || data.address);
    const effectType = data.petalEffect && data.petalEffect !== 'none' ? data.petalEffect : null;

    // Stickers
    const headerSticker = data.headerSticker?.trim();
    const dividerSticker = data.dividerSticker?.trim();
    const footerSticker = data.footerSticker?.trim();

    // Merge theme CSS vars; let the user's accent color override the template default.
    const themeStyle = useMemo(() => {
        const vars = { ...(THEME_VARS[tid] || THEME_VARS.traditional) };
        if (data.themeColor) vars['--t-accent'] = data.themeColor;
        if (data.fontTitle) vars['--t-font-display'] = `'${data.fontTitle}', serif`;
        if (data.fontBody) vars['--t-font-body'] = `'${data.fontBody}', sans-serif`;
        if (data.titleColor) vars['--t-primary'] = data.titleColor;
        if (data.bodyColor) vars['--t-on-surface'] = data.bodyColor;
        if (data.titleSize) vars['--t-title-scale'] = `${data.titleSize}rem`;
        if (data.bodySize) vars['--t-body-size'] = `${data.bodySize}px`;
        return vars as React.CSSProperties;
    }, [tid, data.themeColor, data.fontTitle, data.fontBody, data.titleColor, data.bodyColor, data.titleSize, data.bodySize]);

    // Lightweight reveal key — re-observe only when the set of sections changes.
    const revealKey = [tid, hasParents, hasVenue, hasEvents, hasLoveStory, hasGallery, hasBank, hasRSVP, !!data.guestbookEnabled, (data.guestWishes || []).length].join('|');
    useScrollReveal(revealKey);

    // Format date
    const fmtDate = useMemo(() => {
        if (!data.date) return '';
        try {
            const d = new Date(data.date);
            return d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } catch { return data.date; }
    }, [data.date]);

    // Short date for romantic/modern badge
    const shortDate = useMemo(() => {
        if (!data.date) return '';
        try {
            const d = new Date(data.date);
            return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
        } catch { return data.date; }
    }, [data.date]);

    return (
        <>
            {lbIndex !== null && data.galleryImages && (
                <Lightbox images={data.galleryImages} index={lbIndex} onClose={() => setLbIndex(null)} />
            )}

            <div ref={rootRef} className={`iv-root iv-theme-${tid}`} style={themeStyle}>

                {ec && <FloatingTextToolbar containerRef={rootRef} />}

                {/* ── FLOATING MUSIC BUTTON ── */}
                {safeMusicUrl && !hideAudio && (
                    <button onClick={toggleAudio} className="iv-music-btn" title={audioPlaying ? 'Tắt nhạc' : 'Bật nhạc'} aria-label={audioPlaying ? 'Tắt nhạc' : 'Bật nhạc'}>
                        {audioPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                )}

                {/* ══════ HERO ══════ */}
                <section className={`iv-hero ${isTraditional || isIndochine || isRoyal ? 'iv-hero-horizontal' : ''}`} {...secProps('hero')}>
                    {effectType && <FloatingEffect type={effectType} />}
                    
                    {/* BỐ CỤC NGANG VÀ VÒM ẢNH (Traditional, Indochine, Royal) */}
                    {(isTraditional || isIndochine || isRoyal) ? (
                        <div className="iv-hero-body rv flex flex-col items-center justify-start h-full pt-16 md:pt-20 relative z-10">
                            {headerSticker && (
                                <div className="iv-hero-sticker absolute top-0 left-0 w-full h-full pointer-events-none z-[-1] opacity-80 overflow-hidden flex items-start" aria-hidden>
                                    <div className="transform scale-125 origin-top-left opacity-60 mix-blend-multiply">
                                        {headerSticker}
                                    </div>
                                </div>
                            )}
                            
                            <p className="iv-hero-pre mb-6 uppercase tracking-[0.4em] text-[10px] md:text-xs font-semibold opacity-70">
                                {isRoyal ? "THE WEDDING CELEBRATION OF" : "WELCOME TO OUR WEDDING"}
                            </p>

                            <div className="iv-couple-row w-full flex items-center justify-center gap-2 md:gap-8 px-2 mb-2 z-10">
                                {/* First Person */}
                                <div className="flex flex-col items-center text-center min-w-0 flex-1">
                                    <InlineRichText tagName="span" field={brideFirst ? 'brideTitle' : 'groomTitle'} placeholder={'Danh xưng'} value={brideFirst ? data.brideTitle : data.groomTitle} ec={ec} className="iv-title mb-2 text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-70 font-sans" />
                                    <InlineRichText tagName="span" field={brideFirst ? 'brideShortName' : 'groomShortName'} placeholder={brideFirst ? 'Tên Cô Dâu' : 'Tên Chú Rể'} value={brideFirst ? (data.brideShortName || brideName) : (data.groomShortName || groomName)} ec={ec} className="iv-name text-[clamp(1.2rem,5.5vw,3rem)] leading-tight text-center break-words" style={{ fontFamily: "var(--t-font-display)" }} />
                                </div>

                                {/* Divider (Hỷ / &) */}
                                <div className="iv-hero-divider text-4xl md:text-6xl opacity-90 mx-1 md:mx-2 translate-y-1 md:translate-y-2 drop-shadow-sm flex-shrink-0" style={{ color: 'var(--t-accent)' }}>
                                    {isRoyal ? '&' : '囍'}
                                </div>

                                {/* Second Person */}
                                <div className="flex flex-col items-center text-center min-w-0 flex-1">
                                    <InlineRichText tagName="span" field={brideFirst ? 'groomTitle' : 'brideTitle'} placeholder={'Danh xưng'} value={brideFirst ? data.groomTitle : data.brideTitle} ec={ec} className="iv-title mb-2 text-[9px] md:text-[10px] tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-70 font-sans" />
                                    <InlineRichText tagName="span" field={brideFirst ? 'groomShortName' : 'brideShortName'} placeholder={brideFirst ? 'Tên Chú Rể' : 'Tên Cô Dâu'} value={brideFirst ? (data.groomShortName || groomName) : (data.brideShortName || brideName)} ec={ec} className="iv-name text-[clamp(1.2rem,5.5vw,3rem)] leading-tight text-center break-words" style={{ fontFamily: "var(--t-font-display)" }} />
                                </div>
                            </div>

                            {/* Arched Text */}
                            <svg viewBox="0 0 320 160" className="w-full max-w-[320px] mx-auto mt-4 mb-[-40px] opacity-80 drop-shadow-sm z-10" style={{ overflow: 'visible' }}>
                                <path id="archCurve" d="M 20,150 A 140,140 0 0,1 300,150" fill="transparent" />
                                <text fill="currentColor" fontSize="11" letterSpacing="0.4em" style={{ fontFamily: "var(--t-font-display)", fontWeight: 600 }}>
                                    <textPath href="#archCurve" startOffset="50%" textAnchor="middle">
                                        ✦ LOVE NEVER FAILS ✦
                                    </textPath>
                                </text>
                            </svg>

                            {/* Arch Photo Mask */}
                            <div className="iv-arch-container w-full max-w-[320px] mx-auto flex-1 relative mb-12 z-10">
                                <div className="iv-arch-mask w-full h-full absolute inset-0 overflow-hidden shadow-2xl" 
                                     style={{ 
                                         borderRadius: '160px 160px 0 0', 
                                         border: '4px solid color-mix(in srgb, var(--t-accent) 40%, transparent)',
                                         boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)'
                                     }}>
                                    {resolveImageUrl(data.couplePhoto) && (
                                        <img src={resolveImageUrl(data.couplePhoto)} alt="Ảnh cưới" className="iv-hero-photo w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                                            style={data.photoConfig ? {
                                                objectPosition: `${data.photoConfig.x}% ${data.photoConfig.y}%`,
                                                transform: data.photoConfig.scale !== 1 ? `scale(${data.photoConfig.scale})` : undefined,
                                            } : undefined}
                                        />
                                    )}
                                    {/* Delicate Gradient Overlay instead of dark multiply */}
                                    {data.couplePhoto && (
                                        <div className="absolute inset-0 z-[1] pointer-events-none" 
                                             style={{ 
                                                 background: `linear-gradient(to top, rgba(0, 0, 0, ${(data.heroOverlayOpacity || 0) / 100}) 0%, transparent 50%)`
                                             }} 
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Floating chevron at bottom */}
                            <ChevronDown size={24} className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce z-20 drop-shadow-md" style={{ color: 'var(--t-accent)', opacity: 0.8 }} />
                        </div>
                    ) : (
                        /* BỐ CỤC PHỦ ẢNH NỀN (Romantic, Modern, Garden) */
                        <>
                            {resolveImageUrl(data.couplePhoto) && (
                                <img src={resolveImageUrl(data.couplePhoto)} alt="Ảnh cưới" className="iv-hero-photo"
                                    style={data.photoConfig ? {
                                        objectPosition: `${data.photoConfig.x}% ${data.photoConfig.y}%`,
                                        transform: data.photoConfig.scale !== 1 ? `scale(${data.photoConfig.scale})` : undefined,
                                        transformOrigin: `${data.photoConfig.x}% ${data.photoConfig.y}%`,
                                    } : undefined}
                                />
                            )}
                            {resolveImageUrl(data.couplePhoto) && (
                                <div 
                                    className="absolute inset-0 z-[1] pointer-events-none transition-colors duration-300" 
                                    style={{ backgroundColor: `rgba(255, 255, 255, ${(data.heroOverlayOpacity || 0) / 100})` }} 
                                />
                            )}
                            <div className="iv-hero-gradient" />
                            <div className="iv-hero-body rv">
                                {headerSticker && <div className="iv-hero-sticker" aria-hidden>{headerSticker}</div>}

                                <InlineRichText tagName="p" field="openingMessage" placeholder="Lời mở đầu" value={data.openingMessage ?? (isRomantic ? 'Happy Wedding' : isGarden ? 'Save the Date' : isModern ? 'WE ARE GETTING MARRIED' : 'LỄ THÀNH HÔN')} ec={ec} className="iv-hero-pre" style={isRomantic || isGarden ? { fontFamily: 'var(--t-font-script)', fontSize: '28px' } : undefined} />

                                <h1 className="iv-couple">
                                    <div className="flex flex-col items-center">
                                        {(brideFirst ? data.brideTitle : data.groomTitle) && (
                                            <InlineRichText tagName="span" field={brideFirst ? 'brideTitle' : 'groomTitle'} placeholder={'Danh xưng'} value={brideFirst ? data.brideTitle! : data.groomTitle!} ec={ec} className="iv-title mb-1 text-[0.35em] opacity-80" />
                                        )}
                                        <InlineRichText tagName="span" field={brideFirst ? 'brideName' : 'groomName'} placeholder={brideFirst ? 'Cô Dâu' : 'Chú Rể'} value={brideFirst ? brideName : groomName} ec={ec} className="iv-name" />
                                    </div>
                                    <span className="iv-amp">&</span>
                                    <div className="flex flex-col items-center">
                                        {(!brideFirst ? data.brideTitle : data.groomTitle) && (
                                            <InlineRichText tagName="span" field={brideFirst ? 'groomTitle' : 'brideTitle'} placeholder={'Danh xưng'} value={brideFirst ? data.groomTitle! : data.brideTitle!} ec={ec} className="iv-title mb-1 text-[0.35em] opacity-80" />
                                        )}
                                        <InlineRichText tagName="span" field={brideFirst ? 'groomName' : 'brideName'} placeholder={brideFirst ? 'Chú Rể' : 'Cô Dâu'} value={brideFirst ? groomName : brideName} ec={ec} className="iv-name" />
                                    </div>
                                </h1>

                                {/* Date badge */}
                                {data.date && (
                                    <div className="iv-date-badge">
                                        <span>📅 {shortDate}</span>
                                        {(data.location || data.address) && <><span className="iv-badge-dot" /><span style={{ maxWidth: '55vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>{data.location || data.address.split(',')[0]?.trim() || ''}</span></>}
                                    </div>
                                )}

                                {data.lunarDate && <p className="iv-lunar">(Âm lịch: {data.lunarDate})</p>}
                                {(data.wishes || ec) && <InlineRichText tagName="p" field={'wishes'} placeholder={'Lời mời...'} value={data.wishes || (ec ? '' : '')} ec={ec} className="iv-wishes-text" />}

                                {/* Countdown */}
                                {hasCountdown && (
                                    <div className="iv-cd-row">
                                        {[
                                            { n: countdown.d, l: 'Ngày' },
                                            { n: countdown.h, l: 'Giờ' },
                                            { n: countdown.m, l: 'Phút' },
                                            { n: countdown.s, l: 'Giây' },
                                        ].map((u, i) => (
                                            <React.Fragment key={u.l}>
                                                {i > 0 && <div className="iv-cd-sep" />}
                                                <div className="iv-cd-unit">
                                                    <span className="iv-cd-num">{u.n}</span>
                                                    <span className="iv-cd-lbl">{u.l}</span>
                                                </div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                                <ChevronDown size={24} className="mx-auto mt-4 animate-bounce" style={{ color: 'var(--t-accent)', opacity: 0.6 }} />
                            </div>
                        </>
                    )}
                </section>

                {/* ══════ THƯ MỜI — CHA MẸ HAI BÊN ══════ */}
                {hasParents && (
                    <section className="iv-sec iv-invite rv" {...secProps('family')}>
                        {/* Tiêu đề với layer nền */}
                        <div className="iv-invite-header">
                            <InlineRichText tagName="p" field="inviteSectionTitle" value={data.inviteSectionTitle || 'Trân Trọng Kính Mời'} ec={ec} className="iv-invite-header-text" />
                        </div>
                        {/* Cha mẹ hai bên */}
                        {(() => {
                            const firstParent = brideFirst ? bp : gp;
                            const secondParent = brideFirst ? gp : bp;
                            const firstKey = brideFirst ? 'brideParents' : 'groomParents';
                            const secondKey = brideFirst ? 'groomParents' : 'brideParents';
                            const firstSideField = brideFirst ? 'familySideBride' : 'familySideGroom';
                            const secondSideField = brideFirst ? 'familySideGroom' : 'familySideBride';
                            const firstSideDefault = brideFirst ? 'Nhà Gái' : 'Nhà Trai';
                            const secondSideDefault = brideFirst ? 'Nhà Trai' : 'Nhà Gái';
                            return (
                                <div className="iv-parents">
                                    <div className="iv-parent-col">
                                        <InlineRichText tagName="span" field={firstSideField} value={data[firstSideField as keyof typeof data] as string || firstSideDefault} ec={ec} className="iv-parent-side" />
                                        {(firstParent?.title || ec) && <InlineRichText tagName="span" field={`${firstKey}.title`} value={firstParent?.title || ''} ec={ec} className="text-[11px] uppercase tracking-widest opacity-80 mb-1.5" />}
                                        {(firstParent?.father || ec) && <InlineRichText tagName="span" field={`${firstKey}.father`} value={firstParent?.father || ''} ec={ec} className="iv-parent-name" />}
                                        {(firstParent?.mother || ec) && <InlineRichText tagName="span" field={`${firstKey}.mother`} value={firstParent?.mother || ''} ec={ec} className="iv-parent-name" />}
                                        {(firstParent?.address || ec) && <InlineRichText tagName="span" field={`${firstKey}.address`} value={firstParent?.address || ''} ec={ec} className="iv-parent-address" />}
                                    </div>
                                    <div className="iv-parent-divider" aria-hidden>
                                        <Heart size={16} />
                                    </div>
                                    <div className="iv-parent-col">
                                        <InlineRichText tagName="span" field={secondSideField} value={data[secondSideField as keyof typeof data] as string || secondSideDefault} ec={ec} className="iv-parent-side" />
                                        {(secondParent?.title || ec) && <InlineRichText tagName="span" field={`${secondKey}.title`} value={secondParent?.title || ''} ec={ec} className="text-[11px] uppercase tracking-widest opacity-80 mb-1.5" />}
                                        {(secondParent?.father || ec) && <InlineRichText tagName="span" field={`${secondKey}.father`} value={secondParent?.father || ''} ec={ec} className="iv-parent-name" />}
                                        {(secondParent?.mother || ec) && <InlineRichText tagName="span" field={`${secondKey}.mother`} value={secondParent?.mother || ''} ec={ec} className="iv-parent-name" />}
                                        {(secondParent?.address || ec) && <InlineRichText tagName="span" field={`${secondKey}.address`} value={secondParent?.address || ''} ec={ec} className="iv-parent-address" />}
                                    </div>
                                </div>
                            );
                        })()}
                        {/* Tên cô dâu & chú rể */}
                        <div className="iv-invite-couple-block">
                            {brideFirst ? (<>
                                <InlineRichText tagName="p" field="brideName" value={data.brideName || ''} ec={ec} className="iv-invite-couple" />
                                {(data.brideTitle || ec) && <InlineRichText tagName="span" field="brideTitle" value={data.brideTitle || ''} ec={ec} className="iv-invite-title" />}
                                <p className="iv-invite-amp">&</p>
                                <InlineRichText tagName="p" field="groomName" value={data.groomName || ''} ec={ec} className="iv-invite-couple" />
                                {(data.groomTitle || ec) && <InlineRichText tagName="span" field="groomTitle" value={data.groomTitle || ''} ec={ec} className="iv-invite-title" />}
                            </>) : (<>
                                <InlineRichText tagName="p" field="groomName" value={data.groomName || ''} ec={ec} className="iv-invite-couple" />
                                {(data.groomTitle || ec) && <InlineRichText tagName="span" field="groomTitle" value={data.groomTitle || ''} ec={ec} className="iv-invite-title" />}
                                <p className="iv-invite-amp">&</p>
                                <InlineRichText tagName="p" field="brideName" value={data.brideName || ''} ec={ec} className="iv-invite-couple" />
                                {(data.brideTitle || ec) && <InlineRichText tagName="span" field="brideTitle" value={data.brideTitle || ''} ec={ec} className="iv-invite-title" />}
                            </>)}
                        </div>
                        {/* Separator giữa tên và lời mời */}
                        <div className="iv-invite-sep" />
                        {/* Lời kính mời + thời gian + ngày tháng — khối thống nhất */}
                        <div className="iv-invite-datetime-block">
                            <InlineRichText tagName="p" field="inviteMessage" value={(data.inviteMessage && data.inviteMessage !== '<br>' ? data.inviteMessage : null) || 'Trân trọng kính mời quý khách tới dự buổi tiệc chung vui cùng gia đình chúng tôi, nhân lễ thành hôn của hai con'} ec={ec} className="iv-invite-line" />
                            {data.time && <p className="iv-invite-time">Vào lúc {data.time}</p>}
                            {data.date && (() => {
                                try {
                                    const d = new Date(data.date);
                                    const dayNames = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
                                    const monthStr = `Tháng ${String(d.getMonth() + 1).padStart(2, '0')}`;
                                    return (<>
                                        <div className="iv-invite-date">
                                            <span>{dayNames[d.getDay()]}</span>
                                            <span className="iv-invite-date-sep">|</span>
                                            <span className="iv-invite-date-num">{d.getDate()}</span>
                                            <span className="iv-invite-date-sep">|</span>
                                            <span>{monthStr}</span>
                                        </div>
                                        <p className="iv-invite-year">{d.getFullYear()}</p>
                                    </>);
                                } catch { return null; }
                            })()}
                            {data.lunarDate && <p className="iv-invite-lunar">(Tức ngày {data.lunarDate})</p>}
                        </div>
                    </section>
                )}

                {/* ══════ ĐỊA ĐIỂM & THỜI GIAN ══════ */}
                {hasVenue && (
                    <section className="iv-sec iv-sec-alt iv-venue rv" {...secProps('venue', { padding: 0 })}>
                        <div style={{ backgroundColor: 'var(--t-primary)', color: 'white', padding: '15px 20px', textAlign: 'center' }}>
                            <InlineRichText tagName="h2" field="venueSectionTitle" value={data.venueSectionTitle || 'Tiệc cưới được tổ chức tại'} ec={ec} style={{ margin: 0, fontFamily: 'var(--t-font-display)', color: 'white', textTransform: 'uppercase', fontSize: '1.3rem', letterSpacing: '1px', fontWeight: 'bold' }} />
                        </div>
                        <div style={{ padding: '30px 20px', textAlign: 'center' }}>
                            {(data.location || data.address || ec) && (
                                <InlineRichText tagName="p" field="location" value={data.location || data.address || ''} ec={ec} style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--t-primary)', marginBottom: '8px' }} />
                            )}
                            <div className="iv-venue-meta" style={{ justifyContent: 'center', marginTop: '16px' }}>
                                {data.date && <span><Calendar size={14} /> {fmtDate}</span>}
                                {data.receptionTime && <span><Clock size={14} /> Đón khách: {data.receptionTime}</span>}
                                {data.time && <span><Clock size={14} /> Khai tiệc: {data.time}</span>}
                            </div>
                            
                            {data.mapEnabled && (
                                (() => {
                                    const rawLink = data.mapLink || '';
                                    let embedUrl = '';
                                    const isUrl = (str: string) => str.trim().startsWith('http');
                                    
                                    if (rawLink.includes('pb=') || rawLink.includes('embed')) {
                                        embedUrl = rawLink;
                                    } else {
                                        // Use just location for the search query to trigger the Google Maps Place Card
                                        // Appending a malformed address often breaks the Place Card and results in a generic map.
                                        const query = stripHtml(data.location || data.address || '');
                                        if (query) {
                                            // Use z=16 to zoom in (phóng to ra)
                                            embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=m&z=16&output=embed&iwloc=Near`;
                                        }
                                    }
                                    
                                    if (embedUrl) {
                                        return (
                                            <div className="mt-8 flex flex-col items-center w-full max-w-4xl mx-auto">
                                                <div className="rounded-xl overflow-hidden shadow-md bg-white relative z-10 w-full">
                                                    <iframe
                                                        src={embedUrl}
                                                        width="100%"
                                                        height="400"
                                                        style={{ border: 0, display: 'block' }}
                                                        allowFullScreen
                                                        loading="lazy"
                                                        referrerPolicy="no-referrer-when-downgrade"
                                                        className="w-full"
                                                        title="Google Maps"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    }

                                    // Fallback to button if we have a rawLink but no address/location to embed
                                    if (rawLink && isUrl(rawLink)) {
                                        return (
                                            <div className="mt-6 rounded-2xl overflow-hidden shadow-md border-2 border-white/40 ring-1 ring-black/5 bg-white relative z-10">
                                                <a href={rawLink} target="_blank" rel="noopener noreferrer" className="relative block h-[180px] w-full flex items-center justify-center overflow-hidden" style={{ background: 'var(--t-surface-dim)' }}>
                                                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(var(--t-accent) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-surface)] to-transparent opacity-80" />
                                                    <div className="relative z-10 flex flex-col items-center gap-2 text-[var(--t-primary)] transform group-hover:scale-110 transition-transform">
                                                        <div className="w-12 h-12 bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-center justify-center animate-bounce">
                                                            <MapPin size={24} className="text-rose-500 fill-rose-100" />
                                                        </div>
                                                        <span className="font-bold text-xs uppercase tracking-widest bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">
                                                            Mở Bản Đồ Google
                                                        </span>
                                                    </div>
                                                </a>
                                            </div>
                                        );
                                    }

                                    return null;
                                })()
                            )}
                        </div>
                    </section>
                )}

                {/* ══════ DRESS CODE ══════ */}
                {data.dressCodeEnabled && (
                    <section className="iv-sec rv">
                        <h2 className="iv-sec-title"><InlineRichText tagName="span" field="dressCodeSectionTitle" value={data.dressCodeSectionTitle || (isModern ? 'Dress Code' : isRoyal ? 'ATTIRE' : 'Trang Phục')} ec={ec} /></h2>
                        <Divider glyph={dividerSticker} />
                        <div className="iv-dresscode">
                            <InlineRichText tagName="p" field="dressCodeMessage" value={data.dressCodeMessage || (isModern ? 'We kindly request our guests to wear formal attire in warm, elegant tones to complement the celebration.' : 'Gia đình xin phép gợi ý quý khách trang phục lịch sự, tông màu ấm áp để tạo nên không gian lễ cưới thật hài hòa và trọn vẹn.')} ec={ec} className="iv-gift-desc" />
                            <div className="iv-dresscode-palette">
                                {(data.dressCodeColors || DRESS_CODE_PALETTES[tid] || DRESS_CODE_PALETTES.traditional).map(c => (
                                    <div key={c} className="iv-dresscode-swatch" style={{ background: c, border: c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#fff' ? '1px solid var(--t-outline)' : 'none' }} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ══════ CHƯƠNG TRÌNH (Events) ══════ */}
                {hasEvents && (
                    <section className="iv-sec rv" {...secProps('timeline', { paddingBottom: '40px' })}>
                        <InlineRichText tagName="h2" field="eventsSectionTitle" value={data.eventsSectionTitle || 'Lịch trình ngày cưới'} ec={ec} style={{ textAlign: 'center', color: 'var(--t-primary)', fontFamily: 'var(--t-font-display)', fontSize: 'calc(var(--t-title-scale, 1.75rem) * 0.8)', fontWeight: 'bold', margin: '0 0 40px 0', textTransform: 'uppercase', letterSpacing: '1px' }} />
                        
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px', margin: '0 auto' }}>
                            {data.events!.map((ev, i) => (
                                <div key={ev.id || i} style={{ display: 'flex', width: '100%', position: 'relative' }}>
                                    <div style={{ width: '40%', textAlign: 'right', paddingRight: '20px', paddingTop: '1px' }}>
                                        <InlineRichText tagName="div" field={`events[${i}].time`} placeholder={'Giờ'} value={ev.time} ec={ec} style={{ color: 'var(--t-primary)', fontSize: '1.05rem', fontWeight: 'bold' }} />
                                        {ev.date && <InlineRichText tagName="div" field={`events[${i}].date`} placeholder={'Ngày'} value={ev.date} ec={ec} style={{ fontSize: '0.8rem', color: 'var(--t-primary)', opacity: 0.8, marginTop: '2px' }} />}
                                    </div>
                                    <div style={{ width: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--t-primary)', zIndex: 2 }} />
                                        {i < data.events!.length - 1 && (
                                            <div style={{ width: '1px', flex: 1, backgroundColor: 'var(--t-primary)', minHeight: '40px', opacity: 0.6, margin: '-2px 0' }} />
                                        )}
                                    </div>
                                    <div style={{ width: '60%', paddingLeft: '20px', paddingBottom: i < data.events!.length - 1 ? '30px' : '0' }}>
                                        <InlineRichText tagName="div" field={`events[${i}].title`} placeholder={'Tên sự kiện'} value={ev.title} ec={ec} style={{ color: 'var(--t-primary)', fontSize: '1.05rem', fontWeight: 500 }} />
                                        {ev.location && <InlineRichText tagName="div" field={`events[${i}].location`} placeholder={'Địa điểm'} value={ev.location} ec={ec} style={{ fontSize: '0.85rem', color: 'var(--t-primary)', opacity: 0.7, marginTop: '4px' }} />}
                                        {!ec && (ev.date || data.date) && (
                                            <AddToCalendarButton
                                                title={ev.title}
                                                date={ev.date || data.date}
                                                time={ev.time}
                                                location={ev.location}
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}



                {/* ══════ GALLERY ══════ */}
                {hasGallery && (
                    <section className="iv-sec rv" {...secProps('gallery')}>
                        <h2 className="iv-sec-title"><Camera size={20} className="inline -mt-1 mr-2" /><InlineRichText tagName="span" field="gallerySectionTitle" value={data.gallerySectionTitle || (isModern ? 'Gallery' : isRoyal ? 'MOMENTS' : isRomantic ? 'Album Ảnh Cưới' : 'Khoảnh Khắc')} ec={ec} /></h2>
                        <Divider glyph={dividerSticker} />
                        
                        {data.galleryStyle === '3d' ? (
                            <Gallery3DCarousel images={data.galleryImages!} positions={data.galleryPositions} configs={data.galleryConfigs} onImageClick={setLbIndex} fit={data.galleryFit} />
                        ) : data.galleryStyle === 'collage' ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full auto-rows-[160px] sm:auto-rows-[200px]">
                                {data.galleryImages!.slice(0, 5).map((img, i) => {
                                    const isLast = i === 4;
                                    const remaining = data.galleryImages!.length - 5;
                                    const cfg = data.galleryConfigs?.[i];
                                    const pos = (!cfg && data.galleryPositions?.[i]) || 'object-center';
                                    const style = cfg ? {
                                        objectPosition: `${cfg.x}% ${cfg.y}%`,
                                        transform: cfg.scale !== 1 ? `scale(${cfg.scale})` : undefined,
                                        transformOrigin: `${cfg.x}% ${cfg.y}%`
                                    } : undefined;
                                    
                                    let spanClass = 'col-span-1 row-span-1';
                                    if (i === 0) spanClass = 'col-span-2 row-span-2 sm:col-span-2 sm:row-span-2';
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            className={`relative overflow-hidden rounded-xl cursor-pointer group shadow-sm ${spanClass}`} 
                                            onClick={() => setLbIndex(i)}
                                        >
                                            <div className="w-full h-full overflow-hidden">
                                                <img 
                                                    src={img} 
                                                    alt={`Ảnh ${i + 1}`} 
                                                    loading="lazy"
                                                    className={`w-full h-full transition-transform duration-700 group-hover:scale-110 ${data.galleryFit === 'contain' ? 'object-contain bg-black/5' : `object-cover ${cfg ? '' : pos}`}`}
                                                    style={style}
                                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; e.currentTarget.classList.add('bg-[var(--t-surface-dim)]'); }} 
                                                />
                                            </div>
                                            {isLast && remaining > 0 ? (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-colors group-hover:bg-black/60 pointer-events-none">
                                                    <span className="text-white text-xl sm:text-2xl font-medium tracking-wider">+{remaining}</span>
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                                                    <Camera size={28} className="text-white opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 duration-300" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
                                {data.galleryImages!.slice(0, 4).map((img, i) => {
                                    const isLast = i === 3;
                                    const remaining = data.galleryImages!.length - 4;
                                    const cfg = data.galleryConfigs?.[i];
                                    const pos = (!cfg && data.galleryPositions?.[i]) || 'object-center';
                                    const style = cfg ? {
                                        objectPosition: `${cfg.x}% ${cfg.y}%`,
                                        transform: cfg.scale !== 1 ? `scale(${cfg.scale})` : undefined,
                                        transformOrigin: `${cfg.x}% ${cfg.y}%`
                                    } : undefined;
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            className="relative overflow-hidden rounded-xl cursor-pointer group shadow-sm aspect-[4/5]" 
                                            onClick={() => setLbIndex(i)}
                                        >
                                            <div className="w-full h-full overflow-hidden">
                                                <img 
                                                    src={img} 
                                                    alt={`Ảnh ${i + 1}`} 
                                                    loading="lazy"
                                                    className={`w-full h-full transition-transform duration-700 group-hover:scale-110 ${data.galleryFit === 'contain' ? 'object-contain bg-black/5' : `object-cover ${cfg ? '' : pos}`}`}
                                                    style={style}
                                                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; e.currentTarget.classList.add('bg-[var(--t-surface-dim)]'); }} 
                                                />
                                            </div>
                                            {isLast && remaining > 0 ? (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center transition-colors group-hover:bg-black/60">
                                                    <span className="text-white text-xl sm:text-2xl font-medium tracking-wider">+{remaining}</span>
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <Camera size={28} className="text-white opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 duration-300" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* ══════ MỪNG CƯỚI (Gift) ══════ */}
                {hasBank && (
                    <section className="iv-sec iv-sec-alt rv" {...secProps('bank')}>
                        <h2 className="iv-sec-title"><Gift size={20} className="inline -mt-1 mr-2" /><InlineRichText tagName="span" field="giftSectionTitle" value={data.giftSectionTitle || 'Mừng Cưới'} ec={ec} /></h2>
                        <Divider glyph={dividerSticker} />
                        <InlineRichText tagName="p" field="envelopeMessage" value={data.envelopeMessage || 'Sự hiện diện của quý khách là món quà ý nghĩa nhất. Nếu muốn gửi lời chúc phúc, xin vui lòng quét mã QR dưới đây.'} ec={ec} className="iv-gift-desc" />
                        
                        <div className={`grid gap-4 ${bankList.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-sm mx-auto'}`}>
                            {bankList.map((bank, index) => {
                                if (!bank.bankId || !bank.accountNumber) return null;
                                return (
                                    <div key={index} className="iv-qr-card flex flex-col items-center">
                                        {bank.title && (
                                            <div className="text-center font-bold text-sm mb-4 uppercase tracking-widest text-[var(--t-primary)] border-b border-[var(--t-outline)] pb-2 w-full">
                                                {bank.title}
                                            </div>
                                        )}
                                        <div className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] flex-shrink-0">
                                            <QRCodeImage bankId={bank.bankId} accountNumber={bank.accountNumber} accountName={bank.accountName} />
                                        </div>
                                        <div className="iv-bank-info mt-4 text-center w-full">
                                            <span className="iv-bank-name block font-semibold text-[var(--t-on-surface)] text-sm">{bank.bankId.toUpperCase()}</span>
                                            <span className="iv-bank-number block text-lg font-medium tracking-widest text-[var(--t-on-surface-variant)] my-1">{bank.accountNumber}</span>
                                            <span className="iv-bank-holder block text-xs font-bold uppercase tracking-wider">{bank.accountName}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ══════ RSVP ══════ */}
                {hasRSVP && (
                    <section className="iv-sec rv" {...secProps('rsvp')}>
                        <InlineRichText tagName="h2" field="rsvpSectionTitle" value={data.rsvpSectionTitle || (isModern ? 'RSVP' : 'Xác Nhận Tham Dự')} ec={ec} className="iv-sec-title" />
                        <Divider glyph={dividerSticker} />
                        <InlineRichText tagName="p" field="rsvpMessage" value={data.rsvpMessage || 'Sự góp mặt của bạn là niềm vinh hạnh của chúng tôi. Vui lòng xác nhận để chúng tôi chuẩn bị chu đáo.'} ec={ec} className="iv-gift-desc" />
                        {data.rsvpDeadline && <p className="iv-rsvp-deadline">Vui lòng phản hồi trước {data.rsvpDeadline}</p>}
                        <button className="iv-rsvp-btn" onClick={() => onRSVP?.()}><Send size={16} /> Gửi Phản Hồi (RSVP)</button>
                    </section>
                )}

                {/* ══════ GUESTBOOK ══════ */}
                {data.guestbookEnabled && (
                    <section className="iv-sec iv-sec-alt rv" {...secProps('guestbook')}>
                        <h2 className="iv-sec-title"><MessageCircle size={20} className="inline -mt-1 mr-2" /><InlineRichText tagName="span" field="guestbookSectionTitle" value={data.guestbookSectionTitle || 'Sổ Lưu Bút'} ec={ec} /></h2>
                        <Divider glyph={dividerSticker} />
                        {data.guestWishes && data.guestWishes.length > 0 ? (
                            <div className="iv-wish-list">
                                {data.guestWishes.map((w, i) => (
                                    <div key={w.id || i} className="iv-wish-card rv">
                                        <p className="iv-wish-msg">"{w.message}"</p>
                                        <span className="iv-wish-author">— {w.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="iv-gift-desc">Chưa có lời chúc nào. Hãy là người đầu tiên!</p>
                        )}
                        <button className="iv-rsvp-btn iv-wish-btn" onClick={() => onGuestbook?.()}><Heart size={16} /> Gửi Lời Chúc</button>
                    </section>
                )}

                {/* ══════ CALENDAR ══════ */}
                {data.calendarEnabled && data.date && (() => {
                    const wDate = new Date(data.date);
                    const wDay = wDate.getDate();
                    const wMonth = wDate.getMonth();
                    const wYear = wDate.getFullYear();
                    const firstDay = new Date(wYear, wMonth, 1).getDay(); // 0=Sun
                    // Vietnamese calendar starts Monday: shift so Mon=0
                    const startOffset = (firstDay === 0 ? 6 : firstDay - 1);
                    const daysInMonth = new Date(wYear, wMonth + 1, 0).getDate();
                    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
                    const cells = Array.from({ length: totalCells }, (_, i) => {
                        const dayNum = i - startOffset + 1;
                        return dayNum >= 1 && dayNum <= daysInMonth ? dayNum : null;
                    });
                    const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
                    const monthName = `THÁNG ${wMonth + 1} / ${wYear}`;
                    return (
                        <section className="iv-sec rv" style={{ background: '#F7F7F7', padding: '2.5rem 1.5rem' }}>
                            <p style={{ textAlign: 'center', fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.2em', color: '#555', marginBottom: '1.5rem', textTransform: 'uppercase' }}>{monthName}</p>
                            <div style={{ maxWidth: '360px', margin: '0 auto' }}>
                                {/* Day headers */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.5rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>
                                    {dayLabels.map(d => (
                                        <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', color: '#888', fontWeight: 500, padding: '0 2px' }}>{d}</div>
                                    ))}
                                </div>
                                {/* Day cells */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                    {cells.map((d, i) => {
                                        const isWedding = d === wDay;
                                        return (
                                            <div key={i} style={{
                                                textAlign: 'center', padding: '6px 2px', fontSize: '0.85rem',
                                                color: isWedding ? '#fff' : d ? '#333' : 'transparent',
                                                background: isWedding ? '#333' : 'transparent',
                                                borderRadius: isWedding ? '50%' : undefined,
                                                width: isWedding ? '32px' : undefined,
                                                height: isWedding ? '32px' : undefined,
                                                lineHeight: isWedding ? '32px' : undefined,
                                                margin: isWedding ? 'auto' : undefined,
                                                fontWeight: isWedding ? 700 : 400,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>{d || ''}</div>
                                        );
                                    })}
                                </div>
                                {/* Divider bottom */}
                                <div style={{ borderBottom: '1px solid #ddd', marginTop: '0.75rem' }} />
                            </div>
                            {data.calendarNote && (
                                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '1rem' }}>{data.calendarNote}</p>
                            )}
                        </section>
                    );
                })()}

                {/* ══════ CÔ DÂU & CHÚ RỂ PROFILES ══════ */}
                {data.coupleProfileEnabled && (data.groomProfile || data.brideProfile) && (() => {
                    const profiles: Array<{ label: string; name: string; profile: NonNullable<typeof data.groomProfile> }> = [];
                    if (data.groomProfile) profiles.push({ label: 'Chú Rể', name: data.groomName || 'Chú Rể', profile: data.groomProfile });
                    if (data.brideProfile) profiles.push({ label: 'Cô Dâu', name: data.brideName || 'Cô Dâu', profile: data.brideProfile });
                    return (
                        <section className="iv-sec rv" {...secProps('coupleProfile')}>
                            <h2 className="iv-sec-title">{data.coupleProfileTitle || 'Cô Dâu & Chú Rể'}</h2>
                            <Divider glyph={dividerSticker} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', maxWidth: '400px', margin: '0 auto' }}>
                                {profiles.map(({ label, name, profile }) => (
                                    <CoupleProfileCard key={label} label={label} name={name} profile={profile} />
                                ))}
                            </div>
                        </section>
                    );
                })()}

                {/* ══════ FOOTER ══════ */}
                <footer className="iv-footer rv">
                    {footerSticker && <div className="iv-footer-sticker" aria-hidden>{footerSticker}</div>}
                    {(data.thankYouMessage || ec) && <InlineRichText tagName="p" field="thankYouMessage" value={data.thankYouMessage || ''} ec={ec} className="iv-thank-you" />}
                    <p className="iv-footer-names">{brideFirst ? `${stripHtml(brideName)} & ${stripHtml(groomName)}` : `${stripHtml(groomName)} & ${stripHtml(brideName)}`}</p>
                    <Divider glyph={dividerSticker} />
                    <p className="iv-footer-credit">Built with love · WedPlan AI</p>
                </footer>

            </div>

            {/* ══════════════════════════════════════════════════
                SCOPED STYLES — Multi-Theme Design System
            ══════════════════════════════════════════════════ */}
            <style>{`
/* ── Google Fonts ── */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Be+Vietnam+Pro:wght@400;500;600&family=Great+Vibes&family=Noto+Serif:ital,wght@0,400;0,600;0,700;1,400&family=Cinzel:wght@400;600&family=DM+Sans:wght@400;500;600&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=Spectral:ital,wght@0,400;0,600;1,400&family=Crimson+Pro:ital,wght@0,400;0,600;1,400&family=Fahkwang:wght@400;500;600&family=Nunito:wght@400;500;600&family=Quicksand:wght@400;500;600&family=Josefin+Sans:wght@400;500;600&family=Mulish:wght@400;500;600&display=swap');

/* ── ROOT CONTAINER ── */
.iv-root {
    max-width: 100%;
    margin: 0 auto;
    background: var(--t-surface);
    color: var(--t-on-surface);
    position: relative;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    font-family: var(--t-font-body);
    font-size: var(--t-body-size, 15px);
    font-weight: 500;
}

/* ── FLOATING TEXT TOOLBAR ── */
.iv-text-toolbar {
    position: absolute;
    z-index: 100;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
    background: #1f2937;
    color: white;
    padding: 4px 8px;
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    white-space: nowrap;
    pointer-events: auto;
}
.iv-text-toolbar::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #1f2937;
}
.iv-toolbar-label {
    font-size: 11px;
    font-weight: 500;
    padding: 0 6px;
    opacity: 0.7;
    font-family: var(--t-font-label);
}
.iv-toolbar-sep {
    width: 1px;
    height: 18px;
    background: rgba(255,255,255,0.2);
    margin: 0 4px;
}
.iv-toolbar-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    border: none;
    background: transparent;
    color: rgba(255,255,255,0.8);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
}
.iv-toolbar-btn:hover {
    background: rgba(255,255,255,0.15);
    color: white;
}
.iv-toolbar-active {
    background: rgba(59,130,246,0.5) !important;
    color: white !important;
}

/* ── INLINE EDIT (contentEditable) ── */
[data-field][contenteditable] {
    outline: none;
    border-radius: 4px;
    transition: box-shadow 0.2s, background 0.2s;
    min-width: 40px;
    cursor: text;
}
[data-field][contenteditable]:hover {
    box-shadow: 0 0 0 2px rgba(59,130,246,0.25);
}
[data-field][contenteditable]:focus {
    box-shadow: 0 0 0 2px rgba(59,130,246,0.5);
    background: rgba(255,255,255,0.15);
}
[data-field][contenteditable]:empty::before {
    content: attr(data-placeholder);
    color: var(--t-on-surface-variant);
    opacity: 0.4;
    pointer-events: none;
    font-style: italic;
}

/* ── SCROLL REVEAL ── */
.rv {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.7s cubic-bezier(.23,1,.32,1), transform 0.7s cubic-bezier(.23,1,.32,1);
}
.rv.rv-on { opacity: 1; transform: translateY(0); }

/* ── FLOATING PARTICLES ── */
.iv-float {
    animation: ivFloat var(--fd) linear var(--fdl) infinite;
}
@keyframes ivFloat {
    0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
    10% { opacity: 0.6; }
    100% { transform: translateY(100vh) translateX(var(--fdr)) rotate(360deg); opacity: 0; }
}

/* ── MUSIC BUTTON ── */
.iv-music-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 100;
    width: 44px; height: 44px;
    border-radius: 50%;
    background: var(--t-primary);
    color: white;
    border: none;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--t-primary) 30%, transparent);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}
.iv-music-btn:hover { transform: scale(1.1); }

/* ════════════════════════
   HERO
   ════════════════════════ */
.iv-hero {
    position: relative;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    padding: 4rem 0 2.5rem;
    overflow: hidden;
    border-radius: var(--t-hero-rounded);
    font-family: var(--t-font-body);
    font-size: var(--t-body-size, 14px);
    color: var(--t-on-surface);
}
/* When no cover photo, reduce hero height */
.iv-hero:not(:has(.iv-hero-photo)) {
    min-height: auto;
    padding: 5rem 0 3rem;
    background: linear-gradient(180deg, var(--t-surface-dim) 0%, var(--t-surface) 100%);
}
.iv-hero-photo {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: cover; z-index: 0;
}
.iv-hero-gradient {
    position: absolute; inset: 0; z-index: 1;
    background: var(--t-hero-overlay);
}
.iv-hero-body {
    position: relative; z-index: 2;
    text-align: center;
    padding: 0 2rem;
    width: 100%;
    /* Protect text readability over any background photo across all templates.
       text-shadow is inherited → cascades to all hero text children. */
    text-shadow: 0 1px 3px rgba(0,0,0,0.35), 0 2px 10px rgba(0,0,0,0.18);
}
.iv-hero-sticker {
    font-size: 40px;
    line-height: 1;
    margin-bottom: 0.5rem;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.28));
    text-shadow: none;
}
.iv-hero-pre {
    font-family: var(--t-font-label);
    font-size: 11px;
    font-weight: 500;
    color: var(--t-primary);
    margin-bottom: 0.75rem;
}
.iv-couple {
    font-family: var(--t-font-display);
    font-size: var(--t-title-scale, clamp(1.5rem, 7vw, 2.2rem));
    font-weight: 400;
    color: var(--t-primary);
    line-height: 1.3;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
}
.iv-name {
    display: block;
}
.iv-title {
    display: block;
    font-family: sans-serif;
}
.iv-amp {
    font-style: italic;
    color: var(--t-accent);
    font-size: 0.6em;
    margin: 0.15em 0;
    display: block;
}

/* Horizontal Layout Specifics */
.iv-hero.iv-hero-horizontal {
    background-color: var(--t-bg) !important;
    min-height: 100dvh !important;
    padding: 0 !important;
}
.iv-hero-horizontal .iv-couple-row {
    font-family: var(--t-font-display);
    font-size: clamp(2rem, 8vw, 3.2rem);
    color: var(--t-primary);
    line-height: 1;
}
.iv-hero-horizontal .iv-hero-divider {
    font-family: serif;
    color: var(--t-accent);
}
.iv-hero-horizontal .iv-hero-body {
    background: none !important;
    padding: 4rem 1rem 0 1rem;
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
}
.iv-hero-horizontal .iv-arch-container {
    min-height: 400px;
    width: 100%;
    margin-top: 1rem;
}

/* Date variants */
.iv-date-line {
    font-family: var(--t-font-label);
    font-size: 13px;
    color: var(--t-on-surface-variant);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
}
.iv-date-badge {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    font-family: var(--t-font-label);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--t-primary);
    background: color-mix(in srgb, var(--t-surface) 60%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 6px 14px;
    border-radius: 9999px;
    border: 1px solid color-mix(in srgb, white 50%, transparent);
    margin-bottom: 1rem;
    max-width: 90vw;
    text-align: center;
    line-height: 1.5;
}
.iv-badge-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--t-accent);
}
.iv-lunar {
    font-size: 12px;
    color: var(--t-on-surface-variant);
    font-style: italic;
    margin-bottom: 0.75rem;
}
.iv-wishes-text {
    font-family: var(--t-font-body);
    font-size: 15px;
    font-weight: 500;
    color: var(--t-on-surface);
    font-style: italic;
    max-width: 320px;
    margin: 0 auto 1.25rem;
    line-height: 1.75;
    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

/* ── COUNTDOWN ── */
.iv-cd-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    background: color-mix(in srgb, var(--t-surface) 85%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 0.85rem 1.25rem;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid color-mix(in srgb, white 50%, transparent);
    margin-top: 0.5rem;
}
.iv-cd-unit { text-align: center; }
.iv-cd-num {
    font-family: var(--t-font-display);
    font-size: clamp(1.75rem, 8vw, 2.25rem);
    font-weight: 400;
    color: var(--t-primary);
    line-height: 1;
    display: block;
}
.iv-cd-lbl {
    font-family: var(--t-font-label);
    font-size: 10px;
    font-weight: 500;
    color: var(--t-on-surface-variant);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-top: 4px;
    display: block;
}
.iv-cd-sep {
    width: 1px; height: 28px;
    background: var(--t-accent);
    opacity: 0.5;
}

/* ════════════════════════
   SECTIONS
   ════════════════════════ */
.iv-sec {
    padding: 3.5rem 2rem;
    font-family: var(--t-font-body);
    font-size: var(--t-body-size, 15px);
    color: var(--t-on-surface);
    font-weight: 500;
}
.iv-sec-alt {
    background: var(--t-surface-dim);
}
.iv-sec-title {
    font-family: var(--t-font-display);
    font-size: calc(var(--t-title-scale, 1.75rem) * 0.72);
    font-weight: 600;
    color: var(--t-primary);
    text-align: center;
    letter-spacing: 0.02em;
    line-height: 1.3;
}

/* ── THƯ MỜI / PARENTS ── */
.iv-invite { text-align: center; }
.iv-invite-pre {
    font-family: var(--t-font-label);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--t-primary);
}
.iv-parents {
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: 0.5rem;
    margin: 0.5rem auto 1.5rem;
    max-width: 380px;
}
.iv-parent-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 0 0.5rem;
}
.iv-parent-side {
    font-family: var(--t-font-label);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--t-primary);
    margin-bottom: 6px;
}
.iv-parent-name {
    font-family: var(--t-font-body);
    font-size: 14px;
    font-weight: 600;
    color: var(--t-on-surface);
    line-height: 1.5;
    text-wrap: balance;
}
.iv-parent-divider {
    display: flex;
    align-items: center;
    color: var(--t-accent);
    position: relative;
}
.iv-parent-divider::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 0; bottom: 0;
    width: 1px;
    background: linear-gradient(to bottom, transparent, var(--t-outline), transparent);
}
.iv-parent-divider svg {
    background: var(--t-surface);
    padding: 2px 0;
    position: relative;
    z-index: 1;
}
.iv-invite .iv-parent-divider svg { background: var(--t-surface); }
.iv-invite-line {
    font-family: var(--t-font-body);
    font-size: 15px;
    color: var(--t-on-surface);
    line-height: 1.8;
    max-width: 340px;
    margin: 0 auto 0.75rem;
    font-weight: 500;
}
.iv-invite-header {
    background: var(--t-primary);
    padding: 14px 2rem;
    margin: -3.5rem -2rem 1.5rem;
    text-align: center;
}
.iv-invite-header-text {
    font-family: var(--t-font-label);
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: white;
    margin: 0;
}
.iv-parent-address {
    font-family: var(--t-font-body);
    font-size: 11px;
    color: var(--t-on-surface-variant);
    opacity: 0.85;
    font-style: italic;
    text-align: center;
    margin-top: 3px;
    line-height: 1.4;
}
.iv-invite-couple-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 1rem 0 0.5rem;
}
.iv-invite-couple {
    font-family: var(--t-font-display);
    font-size: clamp(1.3rem, 6vw, 1.6rem);
    font-weight: 600;
    color: var(--t-primary);
    letter-spacing: 0.02em;
    margin: 0;
}
.iv-invite-title {
    font-family: var(--t-font-label);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--t-accent);
    margin: 2px 0 6px;
    display: block;
}
.iv-invite-amp {
    font-family: var(--t-font-display);
    font-size: 1.4rem;
    font-weight: 400;
    color: var(--t-accent);
    font-style: italic;
    margin: 4px 0;
    line-height: 1;
}
.iv-invite-time {
    font-family: var(--t-font-label);
    font-size: 12px;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--t-on-surface-variant);
    margin: 0.15rem auto 0.1rem;
}
.iv-invite-date {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: var(--t-font-label);
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--t-on-surface);
    margin: 0.1rem 0 0;
}
.iv-invite-date-sep { color: var(--t-accent); opacity: 0.6; }
.iv-invite-date-num {
    font-family: var(--t-font-label);
    font-size: 15px;
    font-weight: 700;
    color: var(--t-primary);
    line-height: 1;
}
.iv-invite-year {
    font-family: var(--t-font-label);
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--t-on-surface);
    letter-spacing: 0.08em;
    margin: 0.15rem 0;
}
.iv-invite-lunar {
    font-family: var(--t-font-body);
    font-size: 12px;
    color: var(--t-on-surface-variant);
    font-style: italic;
    margin-top: 0.25rem;
}
.iv-invite-sep {
    width: 40px;
    height: 1px;
    background: var(--t-accent);
    margin: 0.75rem auto 0.5rem;
    opacity: 0.5;
    border: none;
}
.iv-invite-datetime-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
}

/* ── VENUE ── */
.iv-venue-card {
    background: var(--t-card-bg);
    border-radius: var(--t-card-radius);
    padding: 1.75rem 1.5rem;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid var(--t-card-border);
    max-width: 360px;
    margin: 0 auto;
}
.iv-venue-icon {
    width: 48px; height: 48px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--t-primary) 8%, transparent);
    color: var(--t-primary);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 0.85rem;
}
.iv-venue-name {
    font-family: var(--t-font-display);
    font-size: 19px;
    font-weight: 600;
    color: var(--t-primary);
    margin-bottom: 0.35rem;
    line-height: 1.3;
}
.iv-venue-addr {
    font-size: 14px;
    color: var(--t-on-surface-variant);
    line-height: 1.5;
    margin-bottom: 1rem;
}
.iv-venue-meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-family: var(--t-font-label);
    font-size: 13px;
    color: var(--t-on-surface);
    margin-bottom: 1.25rem;
}
.iv-venue-meta span { display: inline-flex; align-items: center; gap: 6px; }
.iv-venue-meta svg { color: var(--t-accent); }
.iv-venue-map {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--t-font-label);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: white;
    background: var(--t-primary);
    padding: 11px 26px;
    border-radius: 9999px;
    text-decoration: none;
    transition: background 0.2s, transform 0.2s;
    box-shadow: 0 4px 14px color-mix(in srgb, var(--t-primary) 22%, transparent);
}
.iv-venue-map:hover { background: var(--t-primary-container); transform: translateY(-1px); }

/* ── EVENTS ── */
.iv-events {
    display: flex;
    flex-direction: column;
}
.iv-event-card {
    background: var(--t-card-bg);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: var(--t-card-radius);
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid var(--t-card-border);
    transition: transform 0.3s;
}
.iv-event-card:hover { transform: translateY(-2px); }
.iv-event-icon {
    width: 48px; height: 48px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--t-primary) 8%, transparent);
    color: var(--t-primary);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 0.75rem;
}
.iv-event-name {
    font-family: var(--t-font-display);
    font-size: 18px;
    font-weight: 600;
    color: var(--t-primary);
    margin-bottom: 0.25rem;
}
.iv-event-desc {
    font-size: 14px;
    color: var(--t-on-surface-variant);
    margin-bottom: 0.75rem;
    line-height: 1.5;
}
.iv-event-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-family: var(--t-font-label);
    font-size: 13px;
    color: var(--t-on-surface);
    margin-bottom: 0.25rem;
}
.iv-event-meta span { display: inline-flex; align-items: center; gap: 4px; }
.iv-event-meta svg { color: var(--t-accent); }
.iv-map-link {
    display: inline-block;
    margin-top: 0.75rem;
    font-family: var(--t-font-label);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--t-primary);
    border: 1px solid color-mix(in srgb, var(--t-primary) 20%, transparent);
    padding: 10px 24px;
    border-radius: 9999px;
    text-decoration: none;
    transition: all 0.2s;
}
.iv-map-link:hover {
    background: var(--t-primary);
    color: white;
}

/* ── LOVE STORY TIMELINE ── */
.iv-timeline {
    position: relative;
    padding-left: 24px;
    border-left: 2px solid var(--t-outline);
    margin-left: 8px;
}
.iv-tl-item { position: relative; padding-bottom: 1.5rem; }
.iv-tl-dot {
    position: absolute;
    left: -31px; top: 4px;
    width: 12px; height: 12px;
    border-radius: 50%;
    background: var(--t-primary);
    border: 2px solid var(--t-surface);
    box-shadow: 0 0 0 3px var(--t-outline);
}
.iv-tl-card {
    padding: 1rem 1.25rem;
    background: var(--t-card-bg);
    border-radius: var(--t-card-radius);
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    border: 1px solid var(--t-card-border);
    overflow: hidden;
}
.iv-tl-photo {
    margin: -1rem -1.25rem 0.85rem;
    aspect-ratio: 16 / 10;
    overflow: hidden;
}
.iv-tl-photo img {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
}
.iv-tl-year {
    font-family: var(--t-font-label);
    font-size: 11px; font-weight: 600;
    color: var(--t-accent);
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
.iv-tl-heading {
    font-family: var(--t-font-display);
    font-size: 16px; font-weight: 600;
    color: var(--t-on-surface);
    margin: 4px 0;
}
.iv-tl-text {
    font-size: 14px;
    color: var(--t-on-surface-variant);
    line-height: 1.6;
}

/* ── GALLERY (SLIDER) ── */
.iv-gallery-slider {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 16px;
    padding: 10px 0 20px;
    margin: 0 -2rem;
    padding-left: 2rem;
    padding-right: 2rem;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
}
.iv-gallery-slider::-webkit-scrollbar {
    display: none;
}
.iv-gal-slide {
    flex: 0 0 75%;
    max-width: 280px;
    aspect-ratio: 3 / 4;
    scroll-snap-align: center;
    position: relative;
    border-radius: var(--t-card-radius);
    overflow: hidden;
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    transition: transform 0.3s;
    background: var(--t-surface-dim);
}
.iv-gal-slide img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.5s cubic-bezier(.23,1,.32,1);
}
.iv-gal-slide:hover { transform: translateY(-5px); }
.iv-gal-slide:hover img { transform: scale(1.05); }
.iv-gal-hover {
    position: absolute; inset: 0;
    background: color-mix(in srgb, var(--t-primary) 30%, transparent);
    display: flex; align-items: center; justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s;
}
.iv-gal-slide:hover .iv-gal-hover { opacity: 1; }
.iv-gal-broken {
    display: flex; align-items: center; justify-content: center;
}
.iv-gal-broken::after {
    content: '\\1F5BC'; font-size: 2rem; opacity: 0.3; color: var(--t-on-surface);
}

/* ── GIFT / QR ── */
.iv-gift-desc {
    font-size: 1em;
    color: var(--t-on-surface-variant);
    text-align: center;
    line-height: 1.7;
    max-width: 340px;
    margin: 0 auto 1.5rem;
    font-style: italic;
}
.iv-qr-card {
    background: var(--t-card-bg);
    border-radius: var(--t-card-radius);
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid var(--t-card-border);
    max-width: 280px;
    margin: 0 auto;
    position: relative;
}
.iv-qr-img {
    width: 176px; height: 176px;
    margin: 0 auto;
    border-radius: calc(var(--t-card-radius) * 0.8);
}
.iv-bank-info {
    margin-top: 1rem;
    display: flex; flex-direction: column; gap: 2px;
}
.iv-bank-name {
    font-family: var(--t-font-label);
    font-size: 11px; font-weight: 600;
    color: var(--t-primary);
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.iv-bank-number {
    font-family: var(--t-font-label);
    font-size: 15px; font-weight: 600;
    color: var(--t-on-surface);
    letter-spacing: 0.05em;
}
.iv-bank-holder {
    font-size: 12px;
    color: var(--t-on-surface-variant);
}

/* ── RSVP ── */
.iv-rsvp-deadline {
    text-align: center;
    font-size: 13px;
    color: var(--t-on-surface-variant);
    margin-bottom: 1rem;
}
.iv-rsvp-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 0 auto;
    background: var(--t-primary);
    color: white;
    border: none;
    font-family: var(--t-font-label);
    font-size: 12px; font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 14px 32px;
    border-radius: 9999px;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
    box-shadow: 0 4px 16px color-mix(in srgb, var(--t-primary) 25%, transparent);
}
.iv-rsvp-btn:hover { background: var(--t-primary-container); transform: translateY(-1px); }
.iv-wish-btn { margin-top: 1.5rem; }

/* ── GUESTBOOK WISHES ── */
.iv-wish-list { display: flex; flex-direction: column; gap: 0.75rem; }
.iv-wish-card {
    background: var(--t-card-bg);
    border-radius: var(--t-card-radius);
    padding: 1rem 1.25rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    border: 1px solid var(--t-card-border);
}
.iv-wish-msg {
    font-style: italic;
    font-size: 14px;
    color: var(--t-on-surface);
    line-height: 1.6;
    margin-bottom: 0.5rem;
}
.iv-wish-author {
    font-family: var(--t-font-label);
    font-size: 12px;
    color: var(--t-on-surface-variant);
    font-weight: 500;
}

/* ── DRESS CODE ── */
.iv-dresscode {
    text-align: center;
}
.iv-dresscode-palette {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 1.25rem;
}
.iv-dresscode-swatch {
    width: 36px; height: 36px;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.2s;
}
.iv-dresscode-swatch:hover { transform: scale(1.15); }

/* ── THANK YOU ── */
.iv-thank-you {
    font-family: var(--t-font-body);
    font-size: 13px;
    line-height: 1.7;
    color: var(--t-on-surface-variant);
    text-align: center;
    max-width: 380px;
    margin: 0 auto 1rem;
    font-style: italic;
}

/* ── FOOTER ── */
.iv-footer {
    padding: 2.5rem 2rem;
    text-align: center;
    background: var(--t-surface-dim);
}
.iv-footer-sticker {
    font-size: 32px;
    line-height: 1;
    margin-bottom: 0.5rem;
}
.iv-footer-names {
    font-family: var(--t-font-display);
    font-size: 20px; font-weight: 600;
    color: var(--t-primary);
    letter-spacing: 0.02em;
}
.iv-footer-credit {
    font-family: var(--t-font-label);
    font-size: 11px;
    color: var(--t-on-surface-variant);
    letter-spacing: 0.05em;
}

/* ════════════════════════
   PER-THEME FLOURISHES
   ════════════════════════ */
/* ROYAL — gold double-frame & ornamental accents */
.iv-theme-royal .iv-event-card,
.iv-theme-royal .iv-qr-card,
.iv-theme-royal .iv-venue-card {
    border: 1px solid var(--t-accent);
    box-shadow: 0 0 0 4px var(--t-card-bg), 0 0 0 5px color-mix(in srgb, var(--t-accent) 45%, transparent), 0 10px 30px rgba(0,0,0,0.08);
}
.iv-theme-royal .iv-sec-title {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: calc(var(--t-title-scale, 2.15rem) * 0.72);
}
.iv-theme-royal .iv-hero-pre { letter-spacing: 0.3em; }

/* MODERN — clean uppercase section titles, square accents */
.iv-theme-modern .iv-sec-title {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-weight: 600;
    font-size: calc(var(--t-title-scale, 1.95rem) * 0.72);
}
.iv-theme-modern .iv-event-icon,
.iv-theme-modern .iv-venue-icon { border-radius: 12px; }

/* ROMANTIC — softer, larger script titles */
.iv-theme-romantic .iv-sec-title { font-size: calc(var(--t-title-scale, 2.6rem) * 0.72); font-weight: 400; }
.iv-theme-romantic .iv-invite-couple { font-family: var(--t-font-script); font-size: var(--t-title-scale, clamp(2rem, 9vw, 2.5rem)); }

/* TRADITIONAL — refined serif emphasis */
.iv-theme-traditional .iv-sec-title { letter-spacing: 0.04em; }

/* GARDEN — soft botanical, rounded, sage */
.iv-theme-garden .iv-sec-title { font-size: calc(var(--t-title-scale, 2rem) * 0.72); font-weight: 400; }
.iv-theme-garden .iv-event-icon,
.iv-theme-garden .iv-venue-icon { border-radius: 50%; }
.iv-theme-garden .iv-invite-couple { font-family: var(--t-font-script); font-size: var(--t-title-scale, clamp(1.8rem, 8vw, 2.3rem)); }

/* INDOCHINE — jade art-deco frame, crisp uppercase */
.iv-theme-indochine .iv-event-card,
.iv-theme-indochine .iv-qr-card,
.iv-theme-indochine .iv-venue-card {
    border: 1px solid var(--t-accent);
    box-shadow: 0 0 0 3px var(--t-card-bg), 0 0 0 4px color-mix(in srgb, var(--t-accent) 35%, transparent), 0 8px 24px rgba(0,0,0,0.07);
}
.iv-theme-indochine .iv-sec-title {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: calc(var(--t-title-scale, 2.1rem) * 0.72);
}

/* ════════════════════════════════════════════════════════════════
   FRONTEND-DESIGN UPGRADE — Phase 1 + 2 + 3
   ════════════════════════════════════════════════════════════════ */

/* P1A — Hero entrance: couple names slide-skew in */
@keyframes heroNameIn {
    from { opacity: 0; transform: translateY(32px) skewY(2deg); }
    to   { opacity: 1; transform: translateY(0) skewY(0deg); }
}
.iv-couple {
    font-size: var(--t-title-scale, clamp(2rem, 9vw, 3rem));
    line-height: 1.2;
    animation: heroNameIn 1.2s cubic-bezier(.23,1,.32,1) 0.4s both;
}

/* P1B — Scroll reveal stagger inside sections */
.iv-sec > .rv:nth-child(2) { transition-delay: 80ms; }
.iv-sec > .rv:nth-child(3) { transition-delay: 160ms; }
.iv-sec > .rv:nth-child(4) { transition-delay: 240ms; }
.iv-sec > .rv:nth-child(5) { transition-delay: 320ms; }
.iv-sec > .rv:nth-child(n+6) { transition-delay: 400ms; }

/* P1C — Card hover lift */
.iv-event-card, .iv-venue-card {
    transition: transform 0.25s cubic-bezier(.23,1,.32,1), box-shadow 0.25s;
}
.iv-event-card:hover, .iv-venue-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06);
}

/* P1D — Button hover elevation */
.iv-rsvp-btn {
    transition: transform 0.2s, box-shadow 0.2s, filter 0.2s;
}
.iv-rsvp-btn:hover {
    transform: translateY(-2px);
    filter: brightness(1.08);
    box-shadow: 0 6px 20px color-mix(in srgb, var(--t-primary) 35%, transparent);
}

/* P1E — Royal: gold shimmer on couple names */
@keyframes goldShimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
}
.iv-theme-royal .iv-couple {
    background: linear-gradient(105deg, #c2a14d 0%, #f0d87e 28%, #eacc72 50%, #f0d87e 72%, #c2a14d 100%);
    background-size: 300% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: goldShimmer 6s linear infinite, heroNameIn 1.2s cubic-bezier(.23,1,.32,1) 0.4s both;
}

/* P1F — Per-theme section title personalities */
.iv-theme-traditional .iv-sec-title::after {
    content: '';
    display: block;
    width: 48px; height: 2px;
    background: linear-gradient(90deg, transparent, var(--t-accent), transparent);
    margin: 8px auto 0;
}

.iv-theme-modern .iv-sec-title {
    border-bottom: 2px solid var(--t-outline);
    padding-bottom: 10px;
}
.iv-theme-royal .iv-sec-title {
    border-bottom: 1px solid color-mix(in srgb, var(--t-accent) 45%, transparent);
    padding-bottom: 12px;
}
.iv-theme-indochine .iv-sec-title {
    border-bottom: 2px solid var(--t-accent);
    padding-bottom: 8px;
}

/* P2A — Paper grain texture on invitation surface */
.iv-root {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    background-size: 200px 200px;
}

/* P2B — Elevated base card shadows */
.iv-event-card, .iv-venue-card, .iv-qr-card, .iv-wish-card {
    box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04);
}

/* P2C — Per-theme alt-section background patterns */
.iv-theme-traditional .iv-sec-alt {
    background-image: repeating-linear-gradient(
        45deg, transparent, transparent 22px,
        color-mix(in srgb, var(--t-primary) 3.5%, transparent) 22px,
        color-mix(in srgb, var(--t-primary) 3.5%, transparent) 23px
    );
}
.iv-theme-royal .iv-sec-alt {
    background-image: radial-gradient(circle,
        color-mix(in srgb, var(--t-accent) 20%, transparent) 1px, transparent 1px);
    background-size: 20px 20px;
}
.iv-theme-romantic .iv-sec-alt {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Cpath d='M22 11C18 7 11 7 11 13C11 19 22 26 22 26C22 26 33 19 33 13C33 7 26 7 22 11Z' fill='%23e0a96d' opacity='0.09'/%3E%3C/svg%3E");
    background-size: 44px 44px;
}
.iv-theme-garden .iv-sec-alt {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cellipse cx='30' cy='22' rx='9' ry='17' fill='%233f5e43' opacity='0.06' transform='rotate(-35 30 22)'/%3E%3Cellipse cx='30' cy='22' rx='9' ry='17' fill='%233f5e43' opacity='0.05' transform='rotate(35 30 22)'/%3E%3C/svg%3E");
    background-size: 60px 60px;
}
.iv-theme-modern .iv-sec-alt {
    background-image:
        linear-gradient(color-mix(in srgb, var(--t-outline) 30%, transparent) 1px, transparent 1px),
        linear-gradient(90deg, color-mix(in srgb, var(--t-outline) 30%, transparent) 1px, transparent 1px);
    background-size: 30px 30px;
}
.iv-theme-indochine .iv-sec-alt {
    background-image:
        repeating-linear-gradient(45deg, transparent, transparent 13px,
            color-mix(in srgb, var(--t-accent) 7%, transparent) 13px,
            color-mix(in srgb, var(--t-accent) 7%, transparent) 14px),
        repeating-linear-gradient(-45deg, transparent, transparent 13px,
            color-mix(in srgb, var(--t-accent) 5%, transparent) 13px,
            color-mix(in srgb, var(--t-accent) 5%, transparent) 14px);
}

/* P3A — Traditional: corner bracket ornaments on hero */
.iv-theme-traditional .iv-hero-body::before,
.iv-theme-traditional .iv-hero-body::after {
    content: '';
    position: absolute;
    width: 36px; height: 36px;
    border-color: var(--t-primary);
    border-style: solid;
    opacity: 0.4;
}
.iv-theme-traditional .iv-hero-body::before { top: -4px; left: 16px; border-width: 2px 0 0 2px; }
.iv-theme-traditional .iv-hero-body::after  { bottom: -4px; right: 16px; border-width: 0 2px 2px 0; }

/* P3B — Garden: leaf glyph watermark in alt sections */
.iv-theme-garden .iv-sec-alt { position: relative; overflow: hidden; }
.iv-theme-garden .iv-sec-alt::after {
    content: '❧';
    position: absolute; bottom: 0.25rem; right: 1rem;
    font-size: 72px; opacity: 0.04;
    pointer-events: none; z-index: 0;
    color: var(--t-primary); line-height: 1;
    transform: rotate(-15deg);
}

/* P3C — Royal: monogram-style ampersand in hero */
.iv-theme-royal .iv-amp {
    width: 44px; height: 44px;
    border-radius: 50%;
    border: 1.5px solid var(--t-accent);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.5em;
    margin: 0.3em auto;
    background: color-mix(in srgb, var(--t-accent) 8%, transparent);
}

/* P3D — Indochine: geometric art-deco border on venue card */
.iv-theme-indochine .iv-venue-card {
    position: relative;
}
.iv-theme-indochine .iv-venue-card::before {
    content: '';
    position: absolute;
    inset: -4px;
    border: 1px solid color-mix(in srgb, var(--t-accent) 25%, transparent);
    pointer-events: none;
}

/* P3E — Modern: geometric accent line on hero */
.iv-theme-modern .iv-hero-body::before {
    content: '';
    display: block;
    width: 40px; height: 3px;
    background: var(--t-primary);
    margin: 0 auto 1.5rem;
}

/* P3F — Romantic: soft glow behind couple names */
.iv-theme-romantic .iv-couple {
    text-shadow: 0 0 40px color-mix(in srgb, var(--t-primary) 20%, transparent),
                 0 1px 3px rgba(0,0,0,0.2);
}

/* P3G — Dress code swatch labels on hover */
.iv-dresscode-swatch {
    position: relative;
    cursor: default;
}
.iv-dresscode-palette {
    flex-wrap: wrap;
}

/* ── MOBILE POLISH ── */
@media (max-width: 400px) {
    .iv-sec { padding: 2.5rem 1.25rem; }
    .iv-hero-body { padding: 0 1.25rem; }
    .iv-gallery { grid-auto-rows: 96px; }
    .iv-parents { gap: 0.25rem; }
    .iv-parent-name { font-size: 14px; }
}
            `}</style>
        </>
    );
};

export default InvitationPreview;
