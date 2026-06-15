import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { InvitationData, LoveStoryEvent, GuestWish, WeddingEvent } from '../../types';
import { MapPin, Calendar, Clock, Heart, Gift, Send, Camera, MessageCircle, ChevronDown, X, Volume2, VolumeX, Navigation, Bold, Italic, Underline, Strikethrough } from 'lucide-react';

export interface EditorConfig {
    selectedSection?: string;
    onSectionClick?: (sectionId: string) => void;
    onFieldEdit?: (field: string, value: string) => void;
}

interface InvitationPreviewProps {
    data: InvitationData;
    onRSVP?: () => void;
    onGuestbook?: () => void;
    editorConfig?: EditorConfig;
}

/* ============================================================
   THEME CONFIG — Each template maps to CSS custom properties
   ============================================================ */
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
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
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
    const toolbarRef = useRef<HTMLDivElement>(null);

    const updateToolbar = useCallback(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !sel.rangeCount) { setPos(null); return; }
        const anchor = sel.anchorNode?.parentElement;
        if (!anchor || !containerRef.current?.contains(anchor)) { setPos(null); return; }
        const editable = anchor.closest('[contenteditable="true"]');
        if (!editable) { setPos(null); return; }

        const range = sel.getRangeAt(0);
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

    const exec = (cmd: string) => {
        document.execCommand(cmd, false);
        updateToolbar();
    };

    if (!pos) return null;
    const btns = [
        { cmd: 'bold', icon: <Bold size={15} />, label: 'B' },
        { cmd: 'italic', icon: <Italic size={15} />, label: 'I' },
        { cmd: 'underline', icon: <Underline size={15} />, label: 'U' },
        { cmd: 'strikeThrough', icon: <Strikethrough size={15} />, label: 'S' },
    ];

    return (
        <div
            ref={toolbarRef}
            className="iv-text-toolbar"
            style={{ left: pos.x, top: pos.y }}
            onMouseDown={e => e.preventDefault()}
        >
            <span className="iv-toolbar-label">Sửa văn bản</span>
            <div className="iv-toolbar-sep" />
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
        </div>
    );
};

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
const InvitationPreview: React.FC<InvitationPreviewProps> = ({ data, onRSVP, onGuestbook, editorConfig }) => {
    const ec = editorConfig;
    const rootRef = useRef<HTMLDivElement>(null);
    const secProps = (id: string) => ec ? {
        'data-sec': id,
        onClick: (e: React.MouseEvent) => {
            if ((e.target as HTMLElement).isContentEditable) return;
            e.stopPropagation(); ec.onSectionClick?.(id);
        },
        style: { position: 'relative' as const, cursor: 'pointer',
            outline: ec.selectedSection === id ? '2px solid #ec4899' : undefined,
            outlineOffset: ec.selectedSection === id ? '-2px' : undefined },
    } : {};

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
    const countdown = useCountdown(data.date);
    const [lbIndex, setLbIndex] = useState<number | null>(null);
    const [audioPlaying, setAudioPlaying] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const toggleAudio = useCallback(() => {
        if (!audioRef.current && data.musicUrl) {
            audioRef.current = new Audio(data.musicUrl);
            audioRef.current.loop = true;
        }
        if (audioRef.current) {
            if (audioPlaying) { audioRef.current.pause(); }
            else { audioRef.current.play().catch(() => { }); }
            setAudioPlaying(!audioPlaying);
        }
    }, [audioPlaying, data.musicUrl]);

    const groomName = data.groomName || 'Chú Rể';
    const brideName = data.brideName || 'Cô Dâu';
    const tid = data.templateId || 'traditional';
    const isRomantic = tid === 'romantic';
    const isModern = tid === 'modern';
    const isGarden = tid === 'garden';

    // Feature flags
    const hasCountdown = data.countdownEnabled !== false && data.date;
    const hasEvents = data.events && data.events.length > 0;
    const hasGallery = data.galleryImages && data.galleryImages.length > 0;
    const hasBank = data.bankInfo?.bankId && data.bankInfo?.accountNumber;
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
                {/* Floral Overlays */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-[0.85] mix-blend-multiply" aria-hidden>
                    <img src="/floral-top-left.png" alt="" className="absolute top-0 left-0 w-[85%] max-w-[420px] object-contain opacity-95 -translate-x-4 -translate-y-4" />
                    <img src="/floral-bottom-right.png" alt="" className="absolute bottom-0 right-0 w-[90%] max-w-[460px] object-contain opacity-95 translate-x-4 translate-y-4" />
                </div>

                {ec && <FloatingTextToolbar containerRef={rootRef} />}

                {/* ── FLOATING MUSIC BUTTON ── */}
                {data.musicUrl && (
                    <button onClick={toggleAudio} className="iv-music-btn" title={audioPlaying ? 'Tắt nhạc' : 'Bật nhạc'} aria-label={audioPlaying ? 'Tắt nhạc' : 'Bật nhạc'}>
                        {audioPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                )}

                {/* ══════ HERO ══════ */}
                <section className="iv-hero" {...secProps('hero')}>
                    {effectType && <FloatingEffect type={effectType} />}
                    {data.couplePhoto && (
                        <img src={data.couplePhoto} alt="Ảnh cưới" className="iv-hero-photo"
                            style={data.photoConfig ? {
                                objectPosition: `${data.photoConfig.x}% ${data.photoConfig.y}%`,
                                transform: data.photoConfig.scale !== 1 ? `scale(${data.photoConfig.scale})` : undefined,
                                transformOrigin: `${data.photoConfig.x}% ${data.photoConfig.y}%`,
                            } : undefined}
                        />
                    )}
                    <div className="iv-hero-gradient" />
                    <div className="iv-hero-body rv">
                        {headerSticker && <div className="iv-hero-sticker" aria-hidden>{headerSticker}</div>}

                        {isRomantic ? (
                            <p className="iv-hero-pre" style={{ fontFamily: 'var(--t-font-script)', fontSize: '28px', textTransform: 'none', letterSpacing: 'normal' }}>Happy Wedding</p>
                        ) : isGarden ? (
                            <p className="iv-hero-pre" style={{ fontFamily: 'var(--t-font-script)', fontSize: '28px', textTransform: 'none', letterSpacing: 'normal' }}>Save the Date</p>
                        ) : isModern ? (
                            <p className="iv-hero-pre">WE ARE GETTING MARRIED</p>
                        ) : (
                            <p className="iv-hero-pre">Lễ Thành Hôn</p>
                        )}

                        <h1 className="iv-couple">
                            <span className="iv-name" {...editProps('groomName', 'Chú Rể')}>{groomName}</span>
                            <span className="iv-amp">&</span>
                            <span className="iv-name" {...editProps('brideName', 'Cô Dâu')}>{brideName}</span>
                        </h1>

                        {/* Date badge */}
                        {data.date && (
                            isRomantic || isModern || isGarden ? (
                                <div className="iv-date-badge">
                                    <span>{shortDate}</span>
                                    {(data.location || data.address) && <><span className="iv-badge-dot" /><span>{data.location || data.address.split(',').pop()?.trim()}</span></>}
                                </div>
                            ) : (
                                <div className="iv-date-line">
                                    <Calendar size={14} /> {fmtDate}
                                    {data.time && <> · <Clock size={14} /> {data.time}</>}
                                </div>
                            )
                        )}

                        {data.lunarDate && <p className="iv-lunar">(Âm lịch: {data.lunarDate})</p>}
                        {(data.wishes || ec) && <p className="iv-wishes-text" {...editProps('wishes', 'Lời mời...')}>{data.wishes || (ec ? '' : '')}</p>}

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
                </section>

                {/* ══════ THƯ MỜI — CHA MẸ HAI BÊN ══════ */}
                {hasParents && (
                    <section className="iv-sec iv-invite rv" {...secProps('family')}>
                        <p className="iv-invite-pre">Trân Trọng Kính Mời</p>
                        <Divider glyph={dividerSticker} />
                        <div className="iv-parents">
                            <div className="iv-parent-col">
                                <span className="iv-parent-side">Nhà Trai</span>
                                {gp?.father && <span className="iv-parent-name">{gp.father}</span>}
                                {gp?.mother && <span className="iv-parent-name">{gp.mother}</span>}
                            </div>
                            <div className="iv-parent-divider" aria-hidden>
                                <Heart size={16} />
                            </div>
                            <div className="iv-parent-col">
                                <span className="iv-parent-side">Nhà Gái</span>
                                {bp?.father && <span className="iv-parent-name">{bp.father}</span>}
                                {bp?.mother && <span className="iv-parent-name">{bp.mother}</span>}
                            </div>
                        </div>
                        <p className="iv-invite-line">
                            Trân trọng kính mời quý khách tới dự buổi tiệc chung vui cùng gia đình chúng tôi,
                            nhân lễ thành hôn của hai con
                        </p>
                        <p className="iv-invite-couple">{groomName} &amp; {brideName}</p>
                    </section>
                )}

                {/* ══════ ĐỊA ĐIỂM & THỜI GIAN ══════ */}
                {hasVenue && (
                    <section className="iv-sec iv-sec-alt iv-venue rv" {...secProps('venue')}>
                        <h2 className="iv-sec-title">{isModern ? 'Venue' : 'Địa Điểm Tổ Chức'}</h2>
                        <Divider glyph={dividerSticker} />
                        <div className="iv-venue-card">
                            <div className="iv-venue-icon"><MapPin size={22} /></div>
                            {(data.location || ec) && <p className="iv-venue-name" {...editProps('location', 'Tên địa điểm...')}>{data.location}</p>}
                            {(data.address || ec) && <p className="iv-venue-addr" {...editProps('address', 'Địa chỉ...')}>{data.address}</p>}
                            <div className="iv-venue-meta">
                                {data.date && <span><Calendar size={14} /> {fmtDate}</span>}
                                {data.time && <span><Clock size={14} /> {data.time}</span>}
                            </div>
                            
                            {data.mapLink && (
                                <div className="mt-5 rounded-xl overflow-hidden border border-[var(--t-outline)] shadow-inner group">
                                    {data.mapLink.includes('pb=') || data.mapLink.includes('embed') ? (
                                        <iframe 
                                            src={data.mapLink} 
                                            width="100%" 
                                            height="220" 
                                            style={{ border: 0 }} 
                                            allowFullScreen 
                                            loading="lazy" 
                                            referrerPolicy="no-referrer-when-downgrade"
                                            className="w-full grayscale group-hover:grayscale-0 transition-all duration-500"
                                            title="Google Maps"
                                        />
                                    ) : (
                                        <a href={data.mapLink} target="_blank" rel="noopener noreferrer" className="relative block h-[180px] w-full flex items-center justify-center overflow-hidden" style={{ background: 'var(--t-surface-dim)' }}>
                                            {/* Stylized map placeholder */}
                                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(var(--t-accent) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--t-surface)] to-transparent opacity-80" />
                                            <div className="relative z-10 flex flex-col items-center gap-2 text-[var(--t-primary)] transform group-hover:scale-110 transition-transform">
                                                <div className="w-12 h-12 bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] flex items-center justify-center animate-bounce">
                                                    <MapPin size={24} className="text-rose-500 fill-rose-100" />
                                                </div>
                                                <span className="font-bold text-xs uppercase tracking-widest bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-sm">{isModern ? 'Open Google Maps' : 'Mở Bản Đồ Google'}</span>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ══════ CHƯƠNG TRÌNH (Events) ══════ */}
                {hasEvents && (
                    <section className="iv-sec rv" {...secProps('events')}>
                        <h2 className="iv-sec-title">{isModern ? 'Schedule' : 'Chương Trình'}</h2>
                        <Divider glyph={dividerSticker} />
                        <div className="iv-events">
                            {data.events!.map((ev, i) => (
                                <React.Fragment key={ev.id || i}>
                                    {i > 0 && (
                                        <div className="flex justify-center py-1">
                                            <div className="w-px h-10" style={{ background: 'linear-gradient(to bottom, transparent, var(--t-accent), transparent)' }} />
                                        </div>
                                    )}
                                    <div className="iv-event-card rv" style={{ animationDelay: `${i * 0.12}s` }}>
                                        <div className="iv-event-icon">
                                            {i === 0 ? <Heart size={20} /> : <Gift size={20} />}
                                        </div>
                                        <h4 className="iv-event-name">{ev.title}</h4>
                                        {ev.description && <p className="iv-event-desc">{ev.description}</p>}
                                        <div className="iv-event-meta">
                                            {ev.time && <span><Clock size={13} /> {ev.time}</span>}
                                            {ev.date && <span><Calendar size={13} /> {ev.date}</span>}
                                        </div>
                                        {ev.location && (
                                            <div className="iv-event-meta">
                                                <span><MapPin size={13} /> {ev.location}</span>
                                            </div>
                                        )}
                                        {ev.mapLink && (
                                            <a href={ev.mapLink} target="_blank" rel="noopener noreferrer" className="iv-map-link">
                                                {isModern ? 'View Map →' : 'Xem Bản Đồ →'}
                                            </a>
                                        )}
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>
                    </section>
                )}

                {/* ══════ LOVE STORY ══════ */}
                {hasLoveStory && (
                    <section className="iv-sec iv-sec-alt rv" {...secProps('loveStory')}>
                        <h2 className="iv-sec-title">{isRomantic ? 'Our Story' : isModern ? 'Our Story' : 'Chuyện Tình Yêu'}</h2>
                        <Divider glyph={dividerSticker} />
                        <div className="iv-timeline">
                            {data.loveStory!.map((ev, i) => (
                                <div key={ev.id || i} className="iv-tl-item rv" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <div className="iv-tl-dot" />
                                    <div className="iv-tl-card">
                                        {ev.photo && (
                                            <div className="iv-tl-photo">
                                                <img src={ev.photo} alt={ev.title} loading="lazy" />
                                            </div>
                                        )}
                                        <span className="iv-tl-year">{ev.date}</span>
                                        <h4 className="iv-tl-heading">{ev.title}</h4>
                                        <p className="iv-tl-text">{ev.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ══════ GALLERY ══════ */}
                {hasGallery && (
                    <section className="iv-sec rv" {...secProps('gallery')}>
                        <h2 className="iv-sec-title"><Camera size={20} className="inline -mt-1 mr-2" />{isRomantic ? 'Album Ảnh Cưới' : isModern ? 'Gallery' : 'Khoảnh Khắc'}</h2>
                        <Divider glyph={dividerSticker} />
                        
                        <div className="iv-gallery-slider">
                            {data.galleryImages!.map((img, i) => (
                                <div key={i} className="iv-gal-slide" onClick={() => setLbIndex(i)}>
                                    <img src={img} alt={`Ảnh ${i + 1}`} loading="lazy"
                                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; e.currentTarget.classList.add('iv-gal-broken'); }} />
                                    <div className="iv-gal-hover"><Camera size={24} /></div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex justify-center gap-1.5 mt-4">
                            {data.galleryImages!.map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--t-outline)] opacity-50" />
                            ))}
                        </div>
                    </section>
                )}

                {/* ══════ MỪNG CƯỚI (Gift) ══════ */}
                {hasBank && (
                    <section className="iv-sec iv-sec-alt rv" {...secProps('bank')}>
                        <h2 className="iv-sec-title"><Gift size={20} className="inline -mt-1 mr-2" />Mừng Cưới</h2>
                        <Divider glyph={dividerSticker} />
                        <p className="iv-gift-desc">
                            Sự hiện diện của quý khách là món quà ý nghĩa nhất. Nếu muốn gửi lời chúc phúc, xin vui lòng quét mã QR dưới đây.
                        </p>
                        <div className="iv-qr-card">
                            <QRCodeImage bankId={data.bankInfo.bankId} accountNumber={data.bankInfo.accountNumber} accountName={data.bankInfo.accountName} />
                            <div className="iv-bank-info">
                                <span className="iv-bank-name">{data.bankInfo.bankId.toUpperCase()}</span>
                                <span className="iv-bank-number">{data.bankInfo.accountNumber}</span>
                                <span className="iv-bank-holder">{data.bankInfo.accountName}</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* ══════ RSVP ══════ */}
                {hasRSVP && (
                    <section className="iv-sec rv" {...secProps('rsvp')}>
                        <h2 className="iv-sec-title">{isModern ? 'RSVP' : 'Xác Nhận Tham Dự'}</h2>
                        <Divider glyph={dividerSticker} />
                        <p className="iv-gift-desc">Sự góp mặt của bạn là niềm vinh hạnh của chúng tôi. Vui lòng xác nhận để chúng tôi chuẩn bị chu đáo.</p>
                        {data.rsvpDeadline && <p className="iv-rsvp-deadline">Vui lòng phản hồi trước {data.rsvpDeadline}</p>}
                        <button className="iv-rsvp-btn" onClick={() => onRSVP?.()}><Send size={16} /> Gửi Phản Hồi (RSVP)</button>
                    </section>
                )}

                {/* ══════ GUESTBOOK ══════ */}
                {data.guestbookEnabled && (
                    <section className="iv-sec iv-sec-alt rv" {...secProps('guestbook')}>
                        <h2 className="iv-sec-title"><MessageCircle size={20} className="inline -mt-1 mr-2" />Sổ Lưu Bút</h2>
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

                {/* ══════ FOOTER ══════ */}
                <footer className="iv-footer rv">
                    {footerSticker && <div className="iv-footer-sticker" aria-hidden>{footerSticker}</div>}
                    <p className="iv-footer-names">{groomName} & {brideName}</p>
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
    max-width: 680px;
    margin: 0 auto;
    background: var(--t-surface);
    color: var(--t-on-surface);
    position: relative;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    font-family: var(--t-font-body);
    font-size: var(--t-body-size, 14px);
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
    justify-content: center;
    align-items: center;
    padding: 4rem 0 2.5rem;
    overflow: hidden;
    border-radius: var(--t-hero-rounded);
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
    letter-spacing: 0.15em;
    text-transform: uppercase;
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
.iv-amp {
    font-style: italic;
    color: var(--t-accent);
    font-size: 0.6em;
    margin: 0.15em 0;
    display: block;
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
    gap: 8px;
    font-family: var(--t-font-label);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--t-primary);
    background: color-mix(in srgb, var(--t-surface) 60%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    padding: 8px 20px;
    border-radius: 9999px;
    border: 1px solid color-mix(in srgb, white 50%, transparent);
    margin-bottom: 1rem;
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
    font-size: 14px;
    color: var(--t-on-surface-variant);
    font-style: italic;
    max-width: 320px;
    margin: 0 auto 1.25rem;
    line-height: 1.6;
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
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--t-accent);
    margin-bottom: 6px;
}
.iv-parent-name {
    font-family: var(--t-font-body);
    font-size: 15px;
    color: var(--t-on-surface);
    line-height: 1.5;
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
    font-size: 14px;
    color: var(--t-on-surface-variant);
    line-height: 1.7;
    max-width: 340px;
    margin: 0 auto 0.75rem;
    font-style: italic;
}
.iv-invite-couple {
    font-family: var(--t-font-display);
    font-size: clamp(1.3rem, 6vw, 1.6rem);
    font-weight: 600;
    color: var(--t-primary);
    letter-spacing: 0.02em;
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
    font-size: 14px;
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
    font-size: clamp(1.25rem, 5.5vw, 1.55rem);
}
.iv-theme-royal .iv-hero-pre { letter-spacing: 0.3em; }

/* MODERN — clean uppercase section titles, square accents */
.iv-theme-modern .iv-sec-title {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-weight: 600;
    font-size: clamp(1.1rem, 5vw, 1.4rem);
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
    font-size: clamp(1.2rem, 5.5vw, 1.5rem);
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
.iv-theme-romantic .iv-sec-title {
    font-family: var(--t-font-script);
    font-weight: 400;
    font-size: clamp(2rem, 9vw, 2.6rem);
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
