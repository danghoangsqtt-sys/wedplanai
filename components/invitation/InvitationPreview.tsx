import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { InvitationData, LoveStoryEvent, GuestWish, WeddingEvent } from '../../types';
import { MapPin, Calendar, Clock, Heart, Gift, Send, Camera, MessageCircle, ChevronDown, X, Music, Volume2, VolumeX } from 'lucide-react';

interface InvitationPreviewProps {
    data: InvitationData;
    onRSVP?: () => void;
    onGuestbook?: () => void;
}

/* ============================================================
   DESIGN SYSTEM — Timeless Heritage (Inspired by reference themes)
   ============================================================
   Primary: #7c1d00 (Heritage Red)
   Surface: #fdf8f6 (Warm Cream)
   Rose Gold: #EFCB84
   Deep Earth: #61564F
   Ink Charcoal: #2A2626
   Font: Playfair Display (headlines), Source Serif 4 (body)
   ============================================================ */

// ─── SCROLL REVEAL HOOK ───
const useScrollReveal = (deps: any) => {
    useEffect(() => {
        const obs = new IntersectionObserver(
            entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
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
    const color = type === 'hearts' ? '#e11d48' : type === 'sparkles' ? '#EFCB84' : '#f9a8d4';
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
            {items.map(p => (
                <span key={p.id} className="float-particle" style={{
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
        <div className="w-16 h-px" style={{ background: 'linear-gradient(90deg, transparent, #EFCB84, transparent)' }} />
        <span className="text-[10px]" style={{ color: '#EFCB84' }}>✦</span>
        <div className="w-16 h-px" style={{ background: 'linear-gradient(90deg, transparent, #EFCB84, transparent)' }} />
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

// ─── QR CODE GENERATOR ───
const QRCodeImage: React.FC<{ bankId: string; accountNumber: string; accountName: string; amount?: number }> = ({ bankId, accountNumber, accountName }) => {
    const url = `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png?accountName=${encodeURIComponent(accountName)}`;
    return <img src={url} alt="QR Mừng Cưới" className="w-44 h-44 mx-auto rounded-lg" />;
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

    const hasCountdown = data.countdownEnabled !== false && data.date;
    const hasEvents = data.events && data.events.length > 0;
    const hasGallery = data.galleryImages && data.galleryImages.length > 0;
    const hasBank = data.bankInfo?.bankId && data.bankInfo?.accountNumber;
    const hasLoveStory = data.loveStory && data.loveStory.length > 0;
    const hasRSVP = data.rsvpEnabled;
    const effectType = data.petalEffect && data.petalEffect !== 'none' ? data.petalEffect : null;
    const groomName = data.groomName || 'Chú Rể';
    const brideName = data.brideName || 'Cô Dâu';

    // Format wedding date nicely
    const fmtDate = useMemo(() => {
        if (!data.date) return '';
        try {
            const d = new Date(data.date);
            return d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } catch { return data.date; }
    }, [data.date]);

    return (
        <>
            {lbIndex !== null && data.galleryImages && (
                <Lightbox images={data.galleryImages} index={lbIndex} onClose={() => setLbIndex(null)} />
            )}

            <div className="inv-preview" style={{ fontFamily: "'Source Serif 4', 'Playfair Display', serif" }}>

                {/* ── FLOATING MUSIC BUTTON ── */}
                {data.musicUrl && (
                    <button onClick={toggleAudio} className="inv-music-btn" title={audioPlaying ? 'Tắt nhạc' : 'Bật nhạc'}>
                        {audioPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                )}

                {/* ── HERO SECTION ── */}
                <section className="inv-hero">
                    {effectType && <FloatingEffect type={effectType} />}
                    {data.couplePhoto && (
                        <img src={data.couplePhoto} alt="Ảnh cưới" className="inv-hero-img"
                            style={data.photoConfig ? {
                                transform: `scale(${data.photoConfig.scale}) translate(${data.photoConfig.x}px, ${data.photoConfig.y}px)`
                            } : undefined}
                        />
                    )}
                    <div className="inv-hero-overlay" />
                    <div className="inv-hero-content rv">
                        <p className="inv-label">Lễ Thành Hôn</p>
                        <h1 className="inv-couple-name">{groomName} <span className="inv-ampersand">&</span> {brideName}</h1>
                        {fmtDate && (
                            <p className="inv-date-line">
                                <Calendar size={14} className="inline -mt-0.5" /> {fmtDate}
                                {data.time && <> · <Clock size={14} className="inline -mt-0.5" /> {data.time}</>}
                            </p>
                        )}
                        {data.lunarDate && <p className="inv-lunar">(Âm lịch: {data.lunarDate})</p>}
                        <p className="inv-wishes">{data.wishes}</p>

                        {/* Countdown inside hero */}
                        {hasCountdown && (
                            <div className="inv-countdown-row">
                                <div className="inv-cd-unit"><span className="inv-cd-num">{countdown.d}</span><span className="inv-cd-label">Ngày</span></div>
                                <div className="inv-cd-sep" />
                                <div className="inv-cd-unit"><span className="inv-cd-num">{countdown.h}</span><span className="inv-cd-label">Giờ</span></div>
                                <div className="inv-cd-sep" />
                                <div className="inv-cd-unit"><span className="inv-cd-num">{countdown.m}</span><span className="inv-cd-label">Phút</span></div>
                                <div className="inv-cd-sep" />
                                <div className="inv-cd-unit"><span className="inv-cd-num">{countdown.s}</span><span className="inv-cd-label">Giây</span></div>
                            </div>
                        )}
                        <ChevronDown size={24} className="mx-auto mt-4 animate-bounce opacity-50" style={{ color: '#EFCB84' }} />
                    </div>
                </section>

                {/* ── LOVE STORY ── */}
                {hasLoveStory && (
                    <section className="inv-section rv">
                        <h2 className="inv-section-title">Chuyện Tình Yêu</h2>
                        <Divider />
                        <div className="inv-story-timeline">
                            {data.loveStory!.map((ev, i) => (
                                <div key={i} className="inv-story-item rv" style={{ animationDelay: `${i * 0.1}s` }}>
                                    <div className="inv-story-dot" />
                                    <div className="inv-story-card">
                                        <span className="inv-story-year">{ev.year}</span>
                                        <h4 className="inv-story-heading">{ev.title}</h4>
                                        <p className="inv-story-text">{ev.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── EVENTS / TIMELINE ── */}
                {hasEvents && (
                    <section className="inv-section inv-section-alt rv">
                        <h2 className="inv-section-title">Chương Trình</h2>
                        <Divider />
                        <div className="inv-events">
                            {data.events!.map((ev, i) => (
                                <div key={i} className="inv-event-card rv" style={{ animationDelay: `${i * 0.12}s` }}>
                                    <div className="inv-event-icon">
                                        <Heart size={16} />
                                    </div>
                                    <h4 className="inv-event-name">{ev.title}</h4>
                                    {ev.description && <p className="inv-event-desc">{ev.description}</p>}
                                    <div className="inv-event-meta">
                                        {ev.time && <span><Clock size={13} /> {ev.time}</span>}
                                        {ev.date && <span><Calendar size={13} /> {ev.date}</span>}
                                    </div>
                                    {ev.location && (
                                        <div className="inv-event-meta">
                                            <span><MapPin size={13} /> {ev.location}</span>
                                        </div>
                                    )}
                                    {ev.mapLink && (
                                        <a href={ev.mapLink} target="_blank" rel="noopener noreferrer" className="inv-map-link">
                                            Xem Bản Đồ →
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── GALLERY ── */}
                {hasGallery && (
                    <section className="inv-section rv">
                        <h2 className="inv-section-title"><Camera size={20} className="inline -mt-1 mr-2" />Khoảnh Khắc</h2>
                        <Divider />
                        <div className="inv-gallery">
                            {data.galleryImages!.map((img, i) => (
                                <div
                                    key={i}
                                    className={`inv-gallery-item ${i === 0 ? 'inv-gallery-wide' : ''}`}
                                    onClick={() => setLbIndex(i)}
                                >
                                    <img src={img} alt={`Ảnh ${i + 1}`} loading="lazy" />
                                    <div className="inv-gallery-hover"><Camera size={20} /></div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── GIFT / QR CODE ── */}
                {hasBank && (
                    <section className="inv-section inv-section-alt rv">
                        <h2 className="inv-section-title"><Gift size={20} className="inline -mt-1 mr-2" />Mừng Cưới</h2>
                        <Divider />
                        <p className="inv-gift-text">
                            Sự hiện diện của quý khách là món quà ý nghĩa nhất. Nếu muốn gửi lời chúc phúc, xin vui lòng quét mã QR dưới đây.
                        </p>
                        <div className="inv-qr-card">
                            <QRCodeImage
                                bankId={data.bankInfo.bankId}
                                accountNumber={data.bankInfo.accountNumber}
                                accountName={data.bankInfo.accountName}
                            />
                            <div className="inv-bank-info">
                                <span className="inv-bank-name">{data.bankInfo.bankId.toUpperCase()}</span>
                                <span className="inv-bank-number">{data.bankInfo.accountNumber}</span>
                                <span className="inv-bank-holder">{data.bankInfo.accountName}</span>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── RSVP ── */}
                {hasRSVP && (
                    <section className="inv-section rv">
                        <h2 className="inv-section-title">Xác Nhận Tham Dự</h2>
                        <Divider />
                        {data.rsvpDeadline && <p className="inv-rsvp-deadline">Vui lòng phản hồi trước {data.rsvpDeadline}</p>}
                        <button className="inv-rsvp-btn">
                            <Send size={16} /> Gửi Phản Hồi (RSVP)
                        </button>
                    </section>
                )}

                {/* ── GUESTBOOK ── */}
                {data.guestbookEnabled && (
                    <section className="inv-section inv-section-alt rv">
                        <h2 className="inv-section-title"><MessageCircle size={20} className="inline -mt-1 mr-2" />Sổ Lưu Bút</h2>
                        <Divider />
                        {data.guestWishes && data.guestWishes.length > 0 ? (
                            <div className="inv-wishes-list">
                                {data.guestWishes.map((w, i) => (
                                    <div key={i} className="inv-wish-card rv">
                                        <p className="inv-wish-text">"{w.message}"</p>
                                        <span className="inv-wish-author">— {w.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="inv-gift-text">Chưa có lời chúc nào. Hãy là người đầu tiên!</p>
                        )}
                    </section>
                )}

                {/* ── FOOTER ── */}
                <footer className="inv-footer rv">
                    <p className="inv-footer-names">{groomName} & {brideName}</p>
                    <Divider />
                    <p className="inv-footer-text">Built with love · WedPlan AI</p>
                </footer>

            </div>

            {/* ════════════════════════════════════════════
                SCOPED STYLES — Timeless Heritage Design
            ════════════════════════════════════════════ */}
            <style>{`
/* ── RESET & CONTAINER ── */
.inv-preview {
    --primary: #7c1d00;
    --surface: #fdf8f6;
    --surface-dim: #f1edeb;
    --on-surface: #1c1b1b;
    --on-surface-variant: #58413b;
    --rose-gold: #EFCB84;
    --deep-earth: #61564F;
    --ink: #2A2626;
    --primary-container: #a12f0c;
    --outline-variant: #e0bfb7;

    max-width: 480px;
    margin: 0 auto;
    background: var(--surface);
    color: var(--on-surface);
    position: relative;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
}

/* ── SCROLL REVEAL ── */
.rv {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.7s cubic-bezier(.23,1,.32,1), transform 0.7s cubic-bezier(.23,1,.32,1);
}
.rv.revealed {
    opacity: 1;
    transform: translateY(0);
}

/* ── FLOATING PARTICLES ── */
.float-particle {
    animation: floatDown var(--fd) linear var(--fdl) infinite;
}
@keyframes floatDown {
    0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
    10% { opacity: 0.6; }
    100% { transform: translateY(100vh) translateX(var(--fdr)) rotate(360deg); opacity: 0; }
}

/* ── MUSIC BUTTON ── */
.inv-music-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 100;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--primary);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(124,29,0,0.3);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}
.inv-music-btn:hover { transform: scale(1.1); box-shadow: 0 6px 24px rgba(124,29,0,0.4); }

/* ════════════════════════════════
   HERO
   ════════════════════════════════ */
.inv-hero {
    position: relative;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    padding-bottom: 2.5rem;
    overflow: hidden;
}
.inv-hero-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
}
.inv-hero-overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(
        to top,
        rgba(253,248,246, 0.95) 0%,
        rgba(253,248,246, 0.7) 30%,
        rgba(0,0,0, 0.15) 60%,
        rgba(0,0,0, 0.3) 100%
    );
}
.inv-hero-content {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 0 2rem;
    width: 100%;
}
.inv-label {
    font-family: 'Be Vietnam Pro', sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--primary);
    margin-bottom: 0.75rem;
}
.inv-couple-name {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 10vw, 2.8rem);
    font-weight: 400;
    color: var(--primary);
    line-height: 1.2;
    margin-bottom: 0.75rem;
}
.inv-ampersand {
    font-style: italic;
    color: var(--rose-gold);
    margin: 0 0.3em;
}
.inv-date-line {
    font-family: 'Be Vietnam Pro', sans-serif;
    font-size: 13px;
    color: var(--on-surface-variant);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
}
.inv-lunar {
    font-size: 12px;
    color: var(--deep-earth);
    font-style: italic;
    margin-bottom: 0.75rem;
}
.inv-wishes {
    font-family: 'Source Serif 4', serif;
    font-size: 14px;
    color: var(--on-surface-variant);
    font-style: italic;
    max-width: 320px;
    margin: 0 auto 1.25rem;
    line-height: 1.6;
}

/* ── COUNTDOWN ── */
.inv-countdown-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    background: rgba(253,248,246,0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    padding: 0.85rem 1.25rem;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid rgba(229,226,224,0.5);
    margin-top: 0.5rem;
}
.inv-cd-unit { text-align: center; }
.inv-cd-num {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.75rem, 8vw, 2.25rem);
    font-weight: 400;
    color: var(--primary);
    line-height: 1;
    display: block;
}
.inv-cd-label {
    font-family: 'Be Vietnam Pro', sans-serif;
    font-size: 10px;
    font-weight: 500;
    color: var(--on-surface-variant);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-top: 4px;
    display: block;
}
.inv-cd-sep {
    width: 1px;
    height: 28px;
    background: var(--rose-gold);
    opacity: 0.5;
}

/* ════════════════════════════════
   SECTIONS
   ════════════════════════════════ */
.inv-section {
    padding: 3.5rem 2rem;
}
.inv-section-alt {
    background: var(--surface-dim);
}
.inv-section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.4rem, 6vw, 1.75rem);
    font-weight: 600;
    color: var(--primary);
    text-align: center;
    letter-spacing: 0.02em;
    line-height: 1.3;
}

/* ── LOVE STORY TIMELINE ── */
.inv-story-timeline {
    position: relative;
    padding-left: 24px;
    border-left: 2px solid var(--outline-variant);
    margin-left: 8px;
}
.inv-story-item {
    position: relative;
    padding-bottom: 1.5rem;
}
.inv-story-dot {
    position: absolute;
    left: -31px;
    top: 4px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--primary);
    border: 2px solid var(--surface);
    box-shadow: 0 0 0 3px var(--outline-variant);
}
.inv-story-card {
    padding: 1rem 1.25rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    border: 1px solid rgba(224,191,183,0.3);
}
.inv-story-year {
    font-family: 'Be Vietnam Pro', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: var(--rose-gold);
    letter-spacing: 0.05em;
    text-transform: uppercase;
}
.inv-story-heading {
    font-family: 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 600;
    color: var(--on-surface);
    margin: 4px 0;
}
.inv-story-text {
    font-size: 14px;
    color: var(--on-surface-variant);
    line-height: 1.6;
}

/* ── EVENTS ── */
.inv-events {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
.inv-event-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid rgba(224,191,183,0.3);
    transition: transform 0.3s;
}
.inv-event-card:hover { transform: translateY(-2px); }
.inv-event-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(124,29,0,0.08);
    color: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 0.75rem;
}
.inv-event-name {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 600;
    color: var(--primary);
    margin-bottom: 0.25rem;
}
.inv-event-desc {
    font-size: 14px;
    color: var(--on-surface-variant);
    margin-bottom: 0.75rem;
    line-height: 1.5;
}
.inv-event-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-family: 'Be Vietnam Pro', sans-serif;
    font-size: 13px;
    color: var(--on-surface);
    margin-bottom: 0.25rem;
}
.inv-event-meta span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}
.inv-event-meta svg { color: var(--rose-gold); }
.inv-map-link {
    display: inline-block;
    margin-top: 0.75rem;
    font-family: 'Be Vietnam Pro', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--primary);
    border-bottom: 1px solid var(--primary);
    padding-bottom: 2px;
    transition: color 0.2s;
    text-decoration: none;
}
.inv-map-link:hover { color: var(--primary-container); }

/* ── GALLERY ── */
.inv-gallery {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
}
.inv-gallery-item {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    cursor: pointer;
    border: 1px solid rgba(239,203,132,0.3);
}
.inv-gallery-wide {
    grid-column: span 2;
}
.inv-gallery-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s cubic-bezier(.23,1,.32,1);
}
.inv-gallery-item:not(.inv-gallery-wide) img { height: 180px; }
.inv-gallery-wide img { height: 220px; }
.inv-gallery-item:hover img { transform: scale(1.06); }
.inv-gallery-hover {
    position: absolute;
    inset: 0;
    background: rgba(124,29,0,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.3s;
}
.inv-gallery-item:hover .inv-gallery-hover { opacity: 1; }

/* ── GIFT / QR ── */
.inv-gift-text {
    font-size: 14px;
    color: var(--on-surface-variant);
    text-align: center;
    line-height: 1.7;
    max-width: 340px;
    margin: 0 auto 1.5rem;
}
.inv-qr-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
    border: 1px solid rgba(239,203,132,0.5);
    max-width: 280px;
    margin: 0 auto;
}
.inv-bank-info {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.inv-bank-name {
    font-family: 'Be Vietnam Pro', sans-serif;
    font-size: 11px;
    font-weight: 600;
    color: var(--primary);
    letter-spacing: 0.08em;
    text-transform: uppercase;
}
.inv-bank-number {
    font-family: 'Be Vietnam Pro', sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--on-surface);
    letter-spacing: 0.05em;
}
.inv-bank-holder {
    font-size: 12px;
    color: var(--on-surface-variant);
}

/* ── RSVP ── */
.inv-rsvp-deadline {
    text-align: center;
    font-size: 13px;
    color: var(--on-surface-variant);
    margin-bottom: 1rem;
}
.inv-rsvp-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin: 0 auto;
    background: var(--primary);
    color: white;
    border: none;
    font-family: 'Be Vietnam Pro', sans-serif;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 14px 32px;
    border-radius: 9999px;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s;
    box-shadow: 0 4px 16px rgba(124,29,0,0.25);
}
.inv-rsvp-btn:hover { background: var(--primary-container); transform: translateY(-1px); }

/* ── WISHES ── */
.inv-wishes-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}
.inv-wish-card {
    background: white;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
    border: 1px solid rgba(224,191,183,0.2);
}
.inv-wish-text {
    font-style: italic;
    font-size: 14px;
    color: var(--on-surface);
    line-height: 1.6;
    margin-bottom: 0.5rem;
}
.inv-wish-author {
    font-family: 'Be Vietnam Pro', sans-serif;
    font-size: 12px;
    color: var(--on-surface-variant);
    font-weight: 500;
}

/* ── FOOTER ── */
.inv-footer {
    padding: 2.5rem 2rem;
    text-align: center;
    background: var(--surface-dim);
}
.inv-footer-names {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 600;
    color: var(--primary);
    letter-spacing: 0.02em;
}
.inv-footer-text {
    font-family: 'Be Vietnam Pro', sans-serif;
    font-size: 11px;
    color: var(--on-surface-variant);
    letter-spacing: 0.05em;
}

/* ── MOBILE POLISH ── */
@media (max-width: 400px) {
    .inv-section { padding: 2.5rem 1.25rem; }
    .inv-hero-content { padding: 0 1.25rem; }
    .inv-gallery-item:not(.inv-gallery-wide) img { height: 140px; }
    .inv-gallery-wide img { height: 180px; }
}
            `}</style>
        </>
    );
};

export default InvitationPreview;
