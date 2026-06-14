import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { InvitationData, LoveStoryEvent, GuestWish, WeddingEvent } from '../../types';
import { MapPin, Calendar, Clock, Heart, Gift, Send, Camera, MessageCircle, ChevronDown, X, Volume2, VolumeX } from 'lucide-react';

interface InvitationPreviewProps {
    data: InvitationData;
    onRSVP?: () => void;
    onGuestbook?: () => void;
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
        '--t-accent': '#EFCB84',
        '--t-outline': '#e0bfb7',
        '--t-card-bg': '#ffffff',
        '--t-hero-overlay': 'linear-gradient(to top, rgba(253,248,246,0.95) 0%, rgba(253,248,246,0.6) 35%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.25) 100%)',
        '--t-font-display': "'Playfair Display', serif",
        '--t-font-body': "'Source Serif 4', serif",
        '--t-font-label': "'Be Vietnam Pro', sans-serif",
        '--t-font-script': "'Playfair Display', serif",
        '--t-hero-rounded': '0',
        '--t-card-radius': '12px',
        '--t-card-border': 'rgba(224,191,183,0.3)',
        '--t-section-radius': '0',
    },
    romantic: {
        '--t-primary': '#9b2948',
        '--t-primary-container': '#c7365f',
        '--t-surface': '#fff0f3',
        '--t-surface-dim': '#fce4e8',
        '--t-on-surface': '#2a1f21',
        '--t-on-surface-variant': '#6d4c55',
        '--t-accent': '#EFCB84',
        '--t-outline': '#e8b4c0',
        '--t-card-bg': 'rgba(255,255,255,0.7)',
        '--t-hero-overlay': 'linear-gradient(to top, rgba(255,240,243,0.95) 0%, rgba(255,240,243,0.5) 35%, rgba(0,0,0,0.1) 65%, rgba(0,0,0,0.2) 100%)',
        '--t-font-display': "'Great Vibes', cursive",
        '--t-font-body': "'Source Serif 4', serif",
        '--t-font-label': "'Be Vietnam Pro', sans-serif",
        '--t-font-script': "'Great Vibes', cursive",
        '--t-hero-rounded': '0 0 3rem 3rem',
        '--t-card-radius': '2rem',
        '--t-card-border': 'rgba(255,255,255,0.6)',
        '--t-section-radius': '3rem',
    },
    modern: {
        '--t-primary': '#094cb2',
        '--t-primary-container': '#3366cc',
        '--t-surface': '#faf9fa',
        '--t-surface-dim': '#efedee',
        '--t-on-surface': '#1b1c1d',
        '--t-on-surface-variant': '#434653',
        '--t-accent': '#b1c5ff',
        '--t-outline': '#c3c6d5',
        '--t-card-bg': '#ffffff',
        '--t-hero-overlay': 'linear-gradient(to top, rgba(250,249,250,0.95) 0%, rgba(250,249,250,0.5) 40%, rgba(0,0,0,0.05) 70%, rgba(0,0,0,0.15) 100%)',
        '--t-font-display': "'Noto Serif', serif",
        '--t-font-body': "'Inter', sans-serif",
        '--t-font-label': "'Public Sans', sans-serif",
        '--t-font-script': "'Noto Serif', serif",
        '--t-hero-rounded': '0 0 1.5rem 1.5rem',
        '--t-card-radius': '16px',
        '--t-card-border': 'rgba(195,198,213,0.2)',
        '--t-section-radius': '0',
    },
    royal: {
        '--t-primary': '#6b4423',
        '--t-primary-container': '#8a5a30',
        '--t-surface': '#f5f0eb',
        '--t-surface-dim': '#ece5dd',
        '--t-on-surface': '#1e1b18',
        '--t-on-surface-variant': '#4d4237',
        '--t-accent': '#c9a96e',
        '--t-outline': '#d4c4b0',
        '--t-card-bg': '#ffffff',
        '--t-hero-overlay': 'linear-gradient(to top, rgba(245,240,235,0.95) 0%, rgba(245,240,235,0.5) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.35) 100%)',
        '--t-font-display': "'Playfair Display', serif",
        '--t-font-body': "'Source Serif 4', serif",
        '--t-font-label': "'Be Vietnam Pro', sans-serif",
        '--t-font-script': "'Playfair Display', serif",
        '--t-hero-rounded': '0',
        '--t-card-radius': '8px',
        '--t-card-border': 'rgba(212,196,176,0.4)',
        '--t-section-radius': '0',
    },
};

// ─── SCROLL REVEAL HOOK ───
const useScrollReveal = (deps: any) => {
    useEffect(() => {
        const obs = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('rv-on'); }),
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );
        const t = setTimeout(() => document.querySelectorAll('.rv').forEach(el => obs.observe(el)), 80);
        return () => { clearTimeout(t); obs.disconnect(); };
    }, [deps]);
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
const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`flex items-center justify-center gap-3 py-5 ${className}`}>
        <div className="w-16 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--t-accent), transparent)' }} />
        <span className="text-[10px]" style={{ color: 'var(--t-accent)' }}>✦</span>
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
            <button className="absolute top-4 right-4 text-white/80 hover:text-white z-10" onClick={onClose}><X size={28} /></button>
            <img src={images[cur]} alt="" className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
            {images.length > 1 && (
                <div className="absolute bottom-6 flex gap-2">
                    {images.map((_, i) => (
                        <button key={i} className={`w-2 h-2 rounded-full transition-all ${i === cur ? 'bg-white scale-125' : 'bg-white/40'}`}
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

// ════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════════
const InvitationPreview: React.FC<InvitationPreviewProps> = ({ data }) => {
    useScrollReveal(data);
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

    // Feature flags
    const hasCountdown = data.countdownEnabled !== false && data.date;
    const hasEvents = data.events && data.events.length > 0;
    const hasGallery = data.galleryImages && data.galleryImages.length > 0;
    const hasBank = data.bankInfo?.bankId && data.bankInfo?.accountNumber;
    const hasLoveStory = data.loveStory && data.loveStory.length > 0;
    const hasRSVP = data.rsvpEnabled;
    const effectType = data.petalEffect && data.petalEffect !== 'none' ? data.petalEffect : null;
    const groomName = data.groomName || 'Chú Rể';
    const brideName = data.brideName || 'Cô Dâu';
    const tid = data.templateId || 'traditional';
    const isRomantic = tid === 'romantic';
    const isModern = tid === 'modern';

    // Merge theme CSS vars
    const themeStyle = useMemo(() => {
        const vars = THEME_VARS[tid] || THEME_VARS.traditional;
        return vars as React.CSSProperties;
    }, [tid]);

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

            <div className="iv-root" style={themeStyle}>

                {/* ── FLOATING MUSIC BUTTON ── */}
                {data.musicUrl && (
                    <button onClick={toggleAudio} className="iv-music-btn" title={audioPlaying ? 'Tắt nhạc' : 'Bật nhạc'}>
                        {audioPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                )}

                {/* ══════ HERO ══════ */}
                <section className="iv-hero">
                    {effectType && <FloatingEffect type={effectType} />}
                    {data.couplePhoto && (
                        <img src={data.couplePhoto} alt="Ảnh cưới" className="iv-hero-photo"
                            style={data.photoConfig ? {
                                transform: `scale(${data.photoConfig.scale}) translate(${data.photoConfig.x}px, ${data.photoConfig.y}px)`
                            } : undefined}
                        />
                    )}
                    <div className="iv-hero-gradient" />
                    <div className="iv-hero-body rv">
                        {isRomantic ? (
                            <p className="iv-hero-pre" style={{ fontFamily: 'var(--t-font-script)', fontSize: '28px', textTransform: 'none', letterSpacing: 'normal' }}>Happy Wedding</p>
                        ) : isModern ? (
                            <p className="iv-hero-pre">WE ARE GETTING MARRIED</p>
                        ) : (
                            <p className="iv-hero-pre">Lễ Thành Hôn</p>
                        )}

                        <h1 className="iv-couple">
                            <span className="iv-name">{groomName}</span>
                            <span className="iv-amp">&</span>
                            <span className="iv-name">{brideName}</span>
                        </h1>

                        {/* Date badge */}
                        {data.date && (
                            isRomantic || isModern ? (
                                <div className="iv-date-badge">
                                    <span>{shortDate}</span>
                                    {data.address && <><span className="iv-badge-dot" /><span>{data.location || data.address.split(',').pop()?.trim()}</span></>}
                                </div>
                            ) : (
                                <div className="iv-date-line">
                                    <Calendar size={14} /> {fmtDate}
                                    {data.time && <> · <Clock size={14} /> {data.time}</>}
                                </div>
                            )
                        )}

                        {data.lunarDate && <p className="iv-lunar">(Âm lịch: {data.lunarDate})</p>}
                        <p className="iv-wishes-text">{data.wishes}</p>

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

                {/* ══════ CHƯƠNG TRÌNH (Events) ══════ */}
                {hasEvents && (
                    <section className="iv-sec rv">
                        <h2 className="iv-sec-title">Chương Trình</h2>
                        <Divider />
                        <div className="iv-events">
                            {data.events!.map((ev, i) => (
                                <React.Fragment key={i}>
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
                    <section className="iv-sec iv-sec-alt rv">
                        <h2 className="iv-sec-title">{isRomantic ? 'Our Story' : 'Chuyện Tình Yêu'}</h2>
                        <Divider />
                        <div className="iv-timeline">
                            {data.loveStory!.map((ev, i) => (
                                <div key={i} className="iv-tl-item rv" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <div className="iv-tl-dot" />
                                    <div className="iv-tl-card">
                                        <span className="iv-tl-year">{ev.year}</span>
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
                    <section className="iv-sec rv">
                        <h2 className="iv-sec-title"><Camera size={20} className="inline -mt-1 mr-2" />{isRomantic ? 'Album Ảnh Cưới' : 'Khoảnh Khắc'}</h2>
                        <Divider />
                        <div className="iv-gallery">
                            {data.galleryImages!.map((img, i) => (
                                <div key={i} className={`iv-gal-item ${i === 0 ? 'iv-gal-wide' : ''}`} onClick={() => setLbIndex(i)}>
                                    <img src={img} alt={`Ảnh ${i + 1}`} loading="lazy" />
                                    <div className="iv-gal-hover"><Camera size={20} /></div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ══════ MỪNG CƯỚI (Gift) ══════ */}
                {hasBank && (
                    <section className="iv-sec iv-sec-alt rv">
                        <h2 className="iv-sec-title"><Gift size={20} className="inline -mt-1 mr-2" />Mừng Cưới</h2>
                        <Divider />
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
                    <section className="iv-sec rv">
                        <h2 className="iv-sec-title">Xác Nhận Tham Dự</h2>
                        <Divider />
                        {data.rsvpDeadline && <p className="iv-rsvp-deadline">Vui lòng phản hồi trước {data.rsvpDeadline}</p>}
                        <button className="iv-rsvp-btn"><Send size={16} /> Gửi Phản Hồi (RSVP)</button>
                    </section>
                )}

                {/* ══════ GUESTBOOK ══════ */}
                {data.guestbookEnabled && (
                    <section className="iv-sec iv-sec-alt rv">
                        <h2 className="iv-sec-title"><MessageCircle size={20} className="inline -mt-1 mr-2" />Sổ Lưu Bút</h2>
                        <Divider />
                        {data.guestWishes && data.guestWishes.length > 0 ? (
                            <div className="iv-wish-list">
                                {data.guestWishes.map((w, i) => (
                                    <div key={i} className="iv-wish-card rv">
                                        <p className="iv-wish-msg">"{w.message}"</p>
                                        <span className="iv-wish-author">— {w.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="iv-gift-desc">Chưa có lời chúc nào. Hãy là người đầu tiên!</p>
                        )}
                    </section>
                )}

                {/* ══════ FOOTER ══════ */}
                <footer className="iv-footer rv">
                    <p className="iv-footer-names">{groomName} & {brideName}</p>
                    <Divider />
                    <p className="iv-footer-credit">Built with love · WedPlan AI</p>
                </footer>
            </div>

            {/* ══════════════════════════════════════════════════
                SCOPED STYLES — Multi-Theme Design System
            ══════════════════════════════════════════════════ */}
            <style>{`
/* ── Google Fonts ── */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=Be+Vietnam+Pro:wght@400;500;600&family=Great+Vibes&family=Noto+Serif:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600&family=Public+Sans:wght@400;500;600&display=swap');

/* ── ROOT CONTAINER ── */
.iv-root {
    max-width: 480px;
    margin: 0 auto;
    background: var(--t-surface);
    color: var(--t-on-surface);
    position: relative;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    font-family: var(--t-font-body);
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
    font-size: clamp(1.5rem, 7vw, 2.2rem);
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
    font-size: clamp(1.4rem, 6vw, 1.75rem);
    font-weight: 600;
    color: var(--t-primary);
    text-align: center;
    letter-spacing: 0.02em;
    line-height: 1.3;
}

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

/* ── GALLERY ── */
.iv-gallery {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
}
.iv-gal-item {
    position: relative;
    overflow: hidden;
    border-radius: calc(var(--t-card-radius) * 0.7);
    cursor: pointer;
    border: 2px solid color-mix(in srgb, white 80%, transparent);
}
.iv-gal-wide { grid-column: span 2; }
.iv-gal-item img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.5s cubic-bezier(.23,1,.32,1);
}
.iv-gal-item:not(.iv-gal-wide) img { height: 180px; }
.iv-gal-wide img { height: 220px; }
.iv-gal-item:hover img { transform: scale(1.06); }
.iv-gal-hover {
    position: absolute; inset: 0;
    background: color-mix(in srgb, var(--t-primary) 25%, transparent);
    display: flex; align-items: center; justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s;
}
.iv-gal-item:hover .iv-gal-hover { opacity: 1; }

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

/* ── MOBILE POLISH ── */
@media (max-width: 400px) {
    .iv-sec { padding: 2.5rem 1.25rem; }
    .iv-hero-body { padding: 0 1.25rem; }
    .iv-gal-item:not(.iv-gal-wide) img { height: 140px; }
    .iv-gal-wide img { height: 180px; }
}
            `}</style>
        </>
    );
};

export default InvitationPreview;
