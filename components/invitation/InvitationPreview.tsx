import React, { useMemo, useEffect, useState } from 'react';
import { InvitationData, LoveStoryEvent, GuestWish, WeddingEvent } from '../../types';
import { MapPin, Calendar, Clock, Heart, Quote, CreditCard, ChevronDown, Gift, Send, BookOpen, Camera, MessageCircle } from 'lucide-react';

interface InvitationPreviewProps {
    data: InvitationData;
    onRSVP?: () => void;
    onGuestbook?: () => void;
}

// --- HOOK: SCROLL REVEAL ---
const useScrollReveal = (data: any) => {
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

        const timeout = setTimeout(() => {
            document.querySelectorAll('.reveal, .reveal-zoom, .reveal-left, .reveal-right').forEach(el => observer.observe(el));
        }, 100);

        return () => {
            clearTimeout(timeout);
            observer.disconnect();
        };
    }, [data]);
};

// --- EFFECT: PETALS/HEARTS/SPARKLES ---
const FloatingEffect: React.FC<{ type: 'petals' | 'hearts' | 'sparkles' }> = ({ type }) => {
    const items = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        duration: `${4 + Math.random() * 4}s`,
        delay: `${Math.random() * 5}s`,
        drift: `${-50 + Math.random() * 100}px`,
        size: `${14 + Math.random() * 10}px`,
    })), []);

    const emoji = type === 'hearts' ? '❤' : type === 'sparkles' ? '✦' : '✿';
    const animClass = type === 'hearts' ? 'animate-heart-float' : type === 'sparkles' ? 'animate-sparkle-float' : 'animate-petal-fall';
    const color = type === 'hearts' ? '#f43f5e' : type === 'sparkles' ? '#f59e0b' : '#fb7185';

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
            {items.map(p => (
                <span
                    key={p.id}
                    className={animClass}
                    style={{
                        position: 'absolute',
                        top: '-30px',
                        left: p.left,
                        fontSize: p.size,
                        color,
                        '--petal-duration': p.duration,
                        '--petal-delay': p.delay,
                        '--petal-drift': p.drift,
                        opacity: 0.7
                    } as React.CSSProperties}
                >
                    {emoji}
                </span>
            ))}
        </div>
    );
};

// --- ORNAMENTAL DIVIDER ---
const OrnamentalDivider: React.FC<{ templateId: string; className?: string }> = ({ templateId, className = '' }) => {
    const isDark = templateId === 'luxury';
    return (
        <div className={`flex items-center justify-center gap-3 py-4 ${className}`}>
            <div className={`w-12 sm:w-20 h-px ${isDark ? 'bg-yellow-500/40' : 'bg-current opacity-15'}`}></div>
            <span className={`text-xs ${isDark ? 'text-yellow-500/60' : 'opacity-25'}`}>✦</span>
            <div className={`w-12 sm:w-20 h-px ${isDark ? 'bg-yellow-500/40' : 'bg-current opacity-15'}`}></div>
        </div>
    );
};

// --- SECTION HEADER ---
const SectionHeader: React.FC<{ subtitle: string; title: string; s: any; className?: string }> = ({ subtitle, title, s, className = '' }) => (
    <div className={`text-center mb-10 ${className}`}>
        <p className={`${s.title} text-[10px] sm:text-xs uppercase tracking-[0.3em] opacity-60 mb-3 font-semibold`}>{subtitle}</p>
        <h2 className={`${s.script} text-3xl sm:text-4xl ${s.accent}`}>{title}</h2>
    </div>
);

// --- STICKER DECOR ---
const StickerDecor: React.FC<{ emoji?: string; size?: string; className?: string }> = ({ emoji, size = 'text-3xl', className = '' }) => {
    if (!emoji) return null;
    return (
        <div className={`flex items-center justify-center select-none pointer-events-none ${className}`} aria-hidden>
            <span className={`${size} animate-pulse`} style={{ animationDuration: '3s' }}>{emoji}</span>
        </div>
    );
};

// --- MAIN COMPONENT ---
const InvitationPreview: React.FC<InvitationPreviewProps> = ({ data, onRSVP, onGuestbook }) => {
    useScrollReveal(data);

    const {
        templateId = 'modern', groomName, brideName, groomParents, brideParents, date, lunarDate, time,
        location, address, mapLink, wishes, themeColor,
        bankInfo, couplePhoto, galleryImages, events,
        loveStory, rsvpEnabled, rsvpDeadline, guestbookEnabled,
        countdownEnabled, petalEffect, guestWishes,
        headerSticker, dividerSticker, footerSticker,
    } = data;

    const vietQrUrl = useMemo(() => {
        if (!bankInfo?.bankId || !bankInfo?.accountNumber) return '';
        return `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNumber}-compact2.png`;
    }, [bankInfo]);

    const weddingDate = new Date(date || '');
    const isValidDate = Boolean(date) && !isNaN(weddingDate.getTime());
    const day = isValidDate ? weddingDate.getDate() : '--';
    const month = isValidDate ? weddingDate.getMonth() + 1 : '--';
    const year = isValidDate ? weddingDate.getFullYear() : '----';
    const dayName = isValidDate ? weddingDate.toLocaleDateString('vi-VN', { weekday: 'long' }) : 'Ngày';

    // Countdown logic
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, passed: false });
    useEffect(() => {
        if (!countdownEnabled || !isValidDate) return;
        const target = new Date(`${date}T${time || '10:00'}:00`).getTime();
        const interval = setInterval(() => {
            const diff = target - Date.now();
            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, passed: true });
                clearInterval(interval);
            } else {
                setTimeLeft({
                    days: Math.floor(diff / 86400000),
                    hours: Math.floor((diff % 86400000) / 3600000),
                    minutes: Math.floor((diff % 3600000) / 60000),
                    seconds: Math.floor((diff % 60000) / 1000),
                    passed: false
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [date, time, countdownEnabled, isValidDate]);

    // Lightbox state
    const [lightboxImg, setLightboxImg] = useState<string | null>(null);

    // Style Mapping
    const getStyles = () => {
        switch (templateId) {
            case 'luxury': return { title: "font-['Cinzel',serif]", body: "font-['Inter',sans-serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-stone-900', text: 'text-stone-200', accent: 'text-yellow-400', accentBg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', accentColor: '#facc15', cardBg: 'bg-stone-800/60', cardBorder: 'border-stone-700/50', sectionAlt: 'bg-stone-800/30' };
            case 'traditional': return { title: "font-['Playfair_Display',serif]", body: "font-['Merriweather',serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-[#FFF6E5]', text: 'text-[#9B1C1C]', accent: 'text-[#9B1C1C]', accentBg: 'bg-[#9B1C1C] text-[#FFF6E5] border-[#C9A24D]', accentColor: '#9B1C1C', cardBg: 'bg-white/60', cardBorder: 'border-[#C9A24D]/20', sectionAlt: 'bg-[#F5ECD5]/50' };
            case 'vintage': return { title: "font-['Cinzel',serif]", body: "font-['Merriweather',serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-[#F5EED8]', text: 'text-[#5C4A1E]', accent: 'text-[#7B5C2A]', accentBg: 'bg-[#7B5C2A] text-[#FDF6E3] border-[#A0845C]', accentColor: '#7B5C2A', cardBg: 'bg-white/50', cardBorder: 'border-[#A0845C]/20', sectionAlt: 'bg-[#EDE4CC]/40' };
            case 'floral': return { title: "font-['Playfair_Display',serif]", body: "font-['Inter',sans-serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-pink-50/50', text: 'text-gray-700', accent: 'text-pink-600', accentBg: 'bg-pink-500 text-white border-pink-200', accentColor: '#db2777', cardBg: 'bg-white/70', cardBorder: 'border-pink-200/40', sectionAlt: 'bg-pink-50/60' };
            case 'romantic': return { title: "font-['Playfair_Display',serif]", body: "font-['Inter',sans-serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-rose-50/50', text: 'text-rose-900', accent: 'text-rose-600', accentBg: 'bg-rose-500 text-white border-rose-200', accentColor: '#e11d48', cardBg: 'bg-white/70', cardBorder: 'border-rose-200/40', sectionAlt: 'bg-rose-50/60' };
            case 'garden': return { title: "font-['Playfair_Display',serif]", body: "font-['Inter',sans-serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-emerald-50/30', text: 'text-emerald-950', accent: 'text-emerald-700', accentBg: 'bg-emerald-600 text-white border-emerald-200', accentColor: '#047857', cardBg: 'bg-white/60', cardBorder: 'border-emerald-200/30', sectionAlt: 'bg-emerald-50/40' };
            case 'minimalist': return { title: "font-['Montserrat',sans-serif]", body: "font-['Montserrat',sans-serif]", script: "font-['Montserrat',sans-serif]", bg: 'bg-white', text: 'text-gray-900', accent: 'text-gray-900', accentBg: 'bg-gray-900 text-white border-gray-900', accentColor: '#111827', cardBg: 'bg-gray-50/80', cardBorder: 'border-gray-200/50', sectionAlt: 'bg-gray-50/60' };
            default: // modern
                return { title: "font-['Playfair_Display',serif]", body: "font-['Inter',sans-serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-[#fdf8f6]', text: 'text-[#2A2626]', accent: 'text-[#7c1d00]', accentBg: 'bg-[#a12f0c] text-white border-[#a12f0c]', accentColor: '#7c1d00', cardBg: 'bg-white/70', cardBorder: 'border-[#e0bfb7]/30', sectionAlt: 'bg-[#f7f3f1]' };
        }
    };
    const s = getStyles();
    const isDark = templateId === 'luxury';

    return (
        <div className={`w-full overflow-x-hidden relative ${s.bg} ${s.text} ${s.body}`}>
            {/* Fonts Import */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@300;400;500;600&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Be+Vietnam+Pro:wght@400;500&display=swap');
                .text-shadow-elegant { text-shadow: 0 2px 10px rgba(0,0,0,0.3); }
                .text-shadow-hero { text-shadow: 0 4px 20px rgba(0,0,0,0.4); }
                .glass-card-v2 {
                    background: ${isDark ? 'rgba(28,25,23,0.7)' : 'rgba(253,248,246,0.85)'};
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                }
                .inner-glow { box-shadow: inset 0 0 30px ${isDark ? 'rgba(250,204,21,0.03)' : 'rgba(255,255,255,0.5)'}; }
                .floral-shadow { box-shadow: 0 4px 30px rgba(0,0,0,0.06); }
                .countdown-circle {
                    background: ${isDark ? 'rgba(28,25,23,0.8)' : 'rgba(255,255,255,0.9)'};
                    box-shadow: 0 8px 32px rgba(0,0,0,0.08), inset 0 0 20px ${isDark ? 'rgba(250,204,21,0.05)' : 'rgba(0,0,0,0.02)'};
                }
                .event-connector {
                    background: linear-gradient(to bottom, transparent, ${s.accentColor}40, transparent);
                }
                @keyframes gentle-float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                .animate-gentle-float { animation: gentle-float 3s ease-in-out infinite; }
            `}</style>

            {/* Global Petal/Floating Effects */}
            {petalEffect && petalEffect !== 'none' && <FloatingEffect type={petalEffect} />}

            {/* ============================== */}
            {/* 1. HERO SECTION                */}
            {/* ============================== */}
            <section className="relative w-full h-[100dvh] flex items-end justify-center overflow-hidden">
                {/* Background */}
                {couplePhoto ? (
                    <div className="absolute inset-0 z-0">
                        <img src={couplePhoto} alt="Couple" className="w-full h-full object-cover object-center" />
                        <div className={`absolute inset-0 ${isDark
                            ? 'bg-gradient-to-t from-stone-900 via-stone-900/50 to-black/20'
                            : 'bg-gradient-to-t from-black/70 via-black/20 to-transparent'
                            }`}></div>
                    </div>
                ) : (
                    <div className="absolute inset-0 z-0">
                        <div className={`w-full h-full ${isDark ? 'bg-stone-900' : 'bg-gradient-to-b from-[#f7f3f1] via-[#fdf8f6] to-[#f7f3f1]'}`}></div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
                            <Heart className="w-80 h-80" />
                        </div>
                    </div>
                )}

                {/* Hero Content — positioned at bottom like reference */}
                <div className="relative z-10 w-full px-6 pb-16 flex flex-col items-center text-center">
                    <div className="reveal">
                        <StickerDecor emoji={headerSticker} size="text-3xl" className="mb-3" />
                        <p className={`text-[10px] sm:text-[11px] uppercase tracking-[0.4em] mb-4 font-semibold ${couplePhoto ? 'text-white/80' : `opacity-60`}`}>
                            Trân Trọng Kính Mời
                        </p>
                    </div>

                    <div className="reveal delay-200">
                        {/* Names — controlled size, never overflow */}
                        <h1 className={`${s.script} leading-[1.15] mb-1 ${couplePhoto ? 'text-white text-shadow-hero' : s.accent}`}
                            style={{ fontSize: 'clamp(2rem, 10vw, 3.5rem)' }}>
                            {groomName || 'Chú Rể'}
                        </h1>
                        <span className={`${s.title} text-lg block my-2 ${couplePhoto ? 'text-[#EFCB84] text-shadow-elegant' : 'opacity-50'}`}>&amp;</span>
                        <h1 className={`${s.script} leading-[1.15] ${couplePhoto ? 'text-white text-shadow-hero' : s.accent}`}
                            style={{ fontSize: 'clamp(2rem, 10vw, 3.5rem)' }}>
                            {brideName || 'Cô Dâu'}
                        </h1>
                    </div>

                    <div className="reveal delay-400 mt-6 w-full max-w-xs">
                        <div className={`flex items-center justify-center gap-3 text-[11px] sm:text-xs tracking-[0.2em] uppercase font-medium ${couplePhoto ? 'text-white/90' : 'opacity-70'}`}>
                            <span>{isValidDate ? `${String(day).padStart(2,'0')}.${String(month).padStart(2,'0')}.${year}` : '-- . -- . ----'}</span>
                            {(location || address) && <>
                                <span className={`w-1 h-1 rounded-full ${couplePhoto ? 'bg-[#EFCB84]' : 'bg-current opacity-40'}`}></span>
                                <span className="truncate max-w-[140px]">{location || address}</span>
                            </>}
                        </div>
                        {lunarDate && <p className={`text-[10px] mt-2 italic ${couplePhoto ? 'text-white/60' : 'opacity-50'}`}>({lunarDate})</p>}
                    </div>

                    {/* Scroll indicator */}
                    <div className="reveal delay-500 mt-10 flex flex-col items-center animate-bounce">
                        <ChevronDown className={`w-6 h-6 ${couplePhoto ? 'text-white/50' : 'opacity-30'}`} />
                    </div>
                </div>
            </section>

            {/* ============================== */}
            {/* 2. INVITATION MESSAGE & FAMILY */}
            {/* ============================== */}
            <section className={`py-14 sm:py-20 px-6 text-center relative z-10 ${s.sectionAlt} inner-glow`}>
                <div className="reveal-zoom max-w-md mx-auto">
                    <OrnamentalDivider templateId={templateId} className="mb-6" />

                    <p className={`${s.title} text-[10px] sm:text-xs uppercase tracking-[0.3em] opacity-60 mb-6 font-semibold`}>Lời Mời Trân Trọng</p>

                    <p className={`${s.body} text-sm sm:text-base leading-relaxed opacity-85 italic px-4 mb-10`}>
                        "{wishes || 'Sự hiện diện của quý vị là niềm vinh hạnh lớn nhất cho gia đình chúng tôi.'}"
                    </p>

                    {/* Family Info — Card style */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                        <div className={`glass-card-v2 rounded-2xl p-5 border ${s.cardBorder} floral-shadow`}>
                            <p className={`${s.title} text-[10px] uppercase tracking-[0.2em] ${s.accent} font-bold mb-3`}>Nhà Trai</p>
                            <p className="text-sm opacity-80 leading-relaxed">Ông: {groomParents?.father || '...'}</p>
                            <p className="text-sm opacity-80 leading-relaxed">Bà: {groomParents?.mother || '...'}</p>
                        </div>
                        <div className={`glass-card-v2 rounded-2xl p-5 border ${s.cardBorder} floral-shadow`}>
                            <p className={`${s.title} text-[10px] uppercase tracking-[0.2em] ${s.accent} font-bold mb-3`}>Nhà Gái</p>
                            <p className="text-sm opacity-80 leading-relaxed">Ông: {brideParents?.father || '...'}</p>
                            <p className="text-sm opacity-80 leading-relaxed">Bà: {brideParents?.mother || '...'}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================== */}
            {/* 3. COUNTDOWN                   */}
            {/* ============================== */}
            {countdownEnabled && date && !timeLeft.passed && (
                <section className="py-14 sm:py-20 px-6 text-center reveal">
                    <SectionHeader subtitle="Đếm Ngược" title="Ngày Trọng Đại" s={s} />
                    <div className="flex justify-center gap-3 sm:gap-5">
                        {[
                            { label: 'Ngày', value: timeLeft.days },
                            { label: 'Giờ', value: timeLeft.hours },
                            { label: 'Phút', value: timeLeft.minutes },
                            { label: 'Giây', value: timeLeft.seconds },
                        ].map((item) => (
                            <div key={item.label} className="flex flex-col items-center">
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full countdown-circle flex items-center justify-center border ${s.cardBorder} transition-all`}>
                                    <span className={`${s.title} text-xl sm:text-2xl font-bold ${s.accent} tabular-nums`}>
                                        {String(item.value).padStart(2, '0')}
                                    </span>
                                </div>
                                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider mt-3 opacity-50 font-semibold">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ============================== */}
            {/* 4. EVENTS TIMELINE             */}
            {/* ============================== */}
            {events && events.length > 0 && (
                <section className={`py-14 sm:py-20 px-6 ${s.sectionAlt}`}>
                    <div className="reveal">
                        <SectionHeader subtitle="Chương Trình" title="Sự Kiện" s={s} />
                    </div>

                    <div className="max-w-md mx-auto space-y-0">
                        {events.map((evt, idx) => (
                            <React.Fragment key={evt.id}>
                                <div className="reveal-left flex flex-col items-center text-center relative py-2">
                                    {/* Event Icon Circle */}
                                    <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-4 border-2 floral-shadow ${s.accentBg}`}>
                                        {idx === 0
                                            ? <Heart className="w-5 h-5 fill-current" />
                                            : <Gift className="w-5 h-5" />
                                        }
                                    </div>

                                    {/* Event Details */}
                                    <h4 className={`${s.title} text-lg sm:text-xl font-semibold mb-2`}>{evt.title}</h4>
                                    <p className={`text-[11px] sm:text-xs ${s.accent} tracking-[0.15em] uppercase font-semibold mb-3`}>
                                        {evt.time} — {evt.date.split('-').reverse().join(' | ')}
                                    </p>
                                    <p className="text-sm opacity-75 mb-1 px-4 leading-relaxed">{evt.location}</p>
                                    {evt.description && <p className="text-xs opacity-60 italic mt-1 px-6">{evt.description}</p>}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 mt-4">
                                        {mapLink && (
                                            <a href={mapLink} target="_blank" rel="noopener noreferrer"
                                                className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-bold border transition-all active:scale-95 ${s.accentBg} rounded-sm`}>
                                                <MapPin className="w-3.5 h-3.5" /> Chỉ Đường
                                            </a>
                                        )}
                                        <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evt.title)}&dates=${evt.date.replace(/-/g, '')}T${evt.time.replace(':', '')}00Z/${evt.date.replace(/-/g, '')}T${String(parseInt(evt.time) + 2).padStart(2, '0')}${evt.time.split(':')[1]}00Z&location=${encodeURIComponent(evt.location)}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-bold border rounded-sm transition-all active:scale-95 ${isDark ? 'border-stone-600 text-stone-300 hover:bg-stone-700' : 'border-current/20 hover:bg-black/5'}`}>
                                            <Calendar className="w-3.5 h-3.5" /> Lưu Lịch
                                        </a>
                                    </div>
                                </div>

                                {/* Connector Line between events */}
                                {idx < events.length - 1 && (
                                    <div className="flex justify-center py-3">
                                        <div className="w-px h-12 event-connector"></div>
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </section>
            )}

            {/* ============================== */}
            {/* 5. LOCATION (Fallback)         */}
            {/* ============================== */}
            {(location || address) && (!events || events.length === 0) && (
                <section className="py-14 sm:py-20 px-6 text-center reveal-zoom">
                    <SectionHeader subtitle="Địa Điểm" title="Tổ Chức" s={s} />
                    <div className={`glass-card-v2 p-6 sm:p-8 rounded-2xl border floral-shadow max-w-sm mx-auto ${s.cardBorder}`}>
                        <p className={`${s.title} font-bold text-lg mb-2 ${s.accent}`}>{location}</p>
                        <p className="text-sm opacity-75 mb-6 px-4">{address}</p>
                        {mapLink && (
                            <a href={mapLink} target="_blank" rel="noopener noreferrer"
                                className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-[11px] tracking-[0.15em] uppercase transition-all active:scale-95 shadow-md ${s.accentBg} rounded-sm`}>
                                <MapPin className="w-4 h-4" /> Xem Bản Đồ
                            </a>
                        )}
                    </div>
                </section>
            )}

            {/* ============================== */}
            {/* 6. PHOTO GALLERY (Bento Grid)  */}
            {/* ============================== */}
            {galleryImages && galleryImages.length > 0 && (
                <section className="py-14 sm:py-20 px-2 sm:px-6">
                    <div className="reveal">
                        <SectionHeader subtitle="Album Ảnh" title="Khoảnh Khắc" s={s} />
                    </div>

                    {/* Bento Grid like reference */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-2xl mx-auto">
                        {galleryImages.map((img, i) => (
                            <div
                                key={i}
                                className={`reveal-zoom overflow-hidden relative group cursor-pointer floral-shadow ${i === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-[3/4]'} rounded-lg sm:rounded-xl`}
                                onClick={() => setLightboxImg(img)}
                            >
                                <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={`Ảnh ${i + 1}`} loading="lazy" />
                                {/* Subtle hover overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                    <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Lightbox */}
            {lightboxImg && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fadeIn" onClick={() => setLightboxImg(null)}>
                    <img src={lightboxImg} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" alt="Lightbox" />
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white text-3xl font-light transition-colors" onClick={() => setLightboxImg(null)}>✕</button>
                </div>
            )}

            {/* ============================== */}
            {/* 7. LOVE STORY (Timeline)       */}
            {/* ============================== */}
            {loveStory && loveStory.length > 0 && (
                <section className={`py-14 sm:py-20 px-6 ${s.sectionAlt} inner-glow`}>
                    <div className="reveal">
                        <SectionHeader subtitle="Câu Chuyện Tình Yêu" title="Our Story" s={s} />
                    </div>

                    <div className="relative max-w-sm mx-auto">
                        {/* Center timeline line */}
                        <div className="absolute left-[15px] top-4 bottom-4 w-px bg-current opacity-10"></div>

                        {loveStory.map((evt, idx) => (
                            <div key={evt.id} className={`reveal-right relative pl-10 mb-8 last:mb-0`}>
                                {/* Timeline dot */}
                                <div className={`absolute left-0 top-2 w-8 h-8 rounded-full flex items-center justify-center ${s.bg} border-2 ${isDark ? 'border-yellow-500/40' : 'border-current/20'}`}>
                                    <Heart className={`w-3 h-3 fill-current ${s.accent}`} />
                                </div>

                                {/* Content card */}
                                <div className={`glass-card-v2 p-4 sm:p-5 rounded-2xl border ${s.cardBorder} floral-shadow`}>
                                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider opacity-50 px-2 py-0.5 rounded mb-2 ${isDark ? 'bg-stone-700' : 'bg-black/5'}`}>
                                        {evt.date}
                                    </span>
                                    <h4 className={`${s.title} font-bold text-sm sm:text-base mt-1 mb-1.5 ${s.accent}`}>{evt.title}</h4>
                                    <p className="text-xs sm:text-sm opacity-75 leading-relaxed">{evt.description}</p>
                                    {evt.photo && (
                                        <div className="mt-3 rounded-xl overflow-hidden floral-shadow cursor-pointer" onClick={() => setLightboxImg(evt.photo!)}>
                                            <img src={evt.photo} alt={evt.title} className="w-full h-32 sm:h-40 object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ============================== */}
            {/* 8. BANKING / GIFT              */}
            {/* ============================== */}
            {vietQrUrl && (
                <section className="py-14 sm:py-20 px-6 text-center reveal-zoom">
                    <SectionHeader subtitle="Hộp Mừng Cưới" title="Gửi Lời Chúc Mừng" s={s} />

                    <div className={`glass-card-v2 p-6 sm:p-8 rounded-2xl border floral-shadow max-w-xs mx-auto ${s.cardBorder}`}>
                        <div className="bg-white p-3 rounded-xl shadow-inner mb-5 inline-block">
                            <img src={vietQrUrl} alt="QR Code" className="w-36 h-36 sm:w-44 sm:h-44 object-contain" />
                        </div>
                        <div className="text-center space-y-1.5">
                            <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-semibold">{bankInfo?.bankId}</p>
                            <p className={`font-mono text-lg sm:text-xl font-bold tracking-wider ${s.accent}`}>{bankInfo?.accountNumber}</p>
                            <p className="font-bold text-sm uppercase tracking-wide">{bankInfo?.accountName}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* ============================== */}
            {/* 9. RSVP & GUESTBOOK            */}
            {/* ============================== */}
            <section className={`py-14 sm:py-20 px-6 text-center ${s.sectionAlt}`}>
                <div className="reveal">
                    <OrnamentalDivider templateId={templateId} className="mb-4" />
                    <SectionHeader subtitle="Xác Nhận" title="Tham Dự & Lưu Bút" s={s} className="mb-8" />
                </div>

                <div className="max-w-sm mx-auto space-y-4">
                    {rsvpEnabled && (
                        <div className="reveal-left">
                            <button onClick={onRSVP}
                                className={`w-full py-4 font-bold text-[11px] sm:text-xs tracking-[0.2em] uppercase shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-2 rounded-sm ${s.accentBg}`}>
                                <Send className="w-4 h-4" /> Xác Nhận Tham Dự
                            </button>
                            {rsvpDeadline && <p className="text-[10px] opacity-50 mt-2">Vui lòng phản hồi trước: {new Date(rsvpDeadline).toLocaleDateString('vi-VN')}</p>}
                        </div>
                    )}

                    {guestbookEnabled && (
                        <div className="reveal-right mt-4">
                            <button onClick={onGuestbook}
                                className={`w-full py-4 font-bold text-[11px] sm:text-xs tracking-[0.2em] uppercase border-2 shadow-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2 rounded-sm ${isDark ? 'border-stone-600 text-stone-300 hover:bg-stone-800' : 'border-current/20 hover:bg-black/5'}`}>
                                <MessageCircle className="w-4 h-4" /> Gửi Lời Chúc
                            </button>
                        </div>
                    )}
                </div>

                {/* Guest Wishes Display */}
                {guestbookEnabled && guestWishes && guestWishes.length > 0 && (
                    <div className="mt-12 max-w-md mx-auto text-left space-y-3">
                        <h4 className={`${s.title} text-[10px] sm:text-xs uppercase tracking-[0.2em] text-center mb-6 opacity-50 font-semibold`}>Lời chúc từ mọi người</h4>
                        <div className="max-h-[320px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                            {guestWishes.map(w => (
                                <div key={w.id} className={`glass-card-v2 p-4 rounded-xl border ${s.cardBorder} floral-shadow reveal`}>
                                    <p className="font-bold text-sm mb-1">{w.name}</p>
                                    <p className="text-xs opacity-75 leading-relaxed italic">"{w.message}"</p>
                                    <p className="text-[9px] opacity-35 mt-2">{new Date(w.createdAt).toLocaleDateString('vi-VN')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* ============================== */}
            {/* FOOTER                         */}
            {/* ============================== */}
            <footer className="py-12 sm:py-16 text-center">
                <StickerDecor emoji={footerSticker} size="text-2xl" className="mb-4" />
                <OrnamentalDivider templateId={templateId} className="mb-4" />
                <p className={`${s.script} text-2xl sm:text-3xl mb-3 ${s.accent}`}>{groomName} &amp; {brideName}</p>
                <p className="text-[8px] uppercase tracking-[0.5em] font-semibold opacity-30">WEDPLAN AI</p>
            </footer>

            {/* Spacer for sticky bottom bar in PublicView */}
            <div className="h-24"></div>
        </div>
    );
};

export default InvitationPreview;
