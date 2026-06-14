import React, { useMemo, useEffect, useState, useRef } from 'react';
import { InvitationData, LoveStoryEvent, GuestWish, WeddingEvent } from '../../types';
import { MapPin, Calendar, Clock, Heart, Quote, CreditCard } from 'lucide-react';

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

        // Small delay to ensure DOM is ready
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

// --- DECORATIVE ELEMENTS ---
const TemplateDecor: React.FC<{ templateId: string; position: 'corners' | 'divider' }> = ({ templateId, position }) => {
    const decors: any = {
        floral: {
            corners: (
                <>
                    <div className="absolute top-0 left-0 text-5xl opacity-20 pointer-events-none -translate-x-4 -translate-y-4">🌸</div>
                    <div className="absolute top-0 right-0 text-5xl opacity-20 pointer-events-none translate-x-4 -translate-y-4">🌸</div>
                    <div className="absolute bottom-0 left-0 text-5xl opacity-20 pointer-events-none -translate-x-4 translate-y-4">🌷</div>
                    <div className="absolute bottom-0 right-0 text-5xl opacity-20 pointer-events-none translate-x-4 translate-y-4">🌷</div>
                </>
            ),
            divider: <div className="flex justify-center gap-2 py-2 opacity-40"><span>🌿</span><span>✿</span><span>🌿</span></div>
        },
        romantic: {
            corners: (
                <>
                    <div className="absolute top-4 left-4 text-3xl opacity-20 pointer-events-none">💕</div>
                    <div className="absolute top-4 right-4 text-3xl opacity-20 pointer-events-none">💕</div>
                </>
            ),
            divider: <div className="flex justify-center gap-2 py-2 opacity-30"><span>♥</span><span className="text-[10px] mt-1">⋆</span><span>♥</span></div>
        },
        luxury: {
            corners: (
                <>
                    <div className="absolute top-4 left-4 text-3xl opacity-30 pointer-events-none text-yellow-500">⚜</div>
                    <div className="absolute top-4 right-4 text-3xl opacity-30 pointer-events-none text-yellow-500">⚜</div>
                    <div className="absolute bottom-4 left-4 text-3xl opacity-30 pointer-events-none text-yellow-500 rotate-180">⚜</div>
                    <div className="absolute bottom-4 right-4 text-3xl opacity-30 pointer-events-none text-yellow-500 rotate-180">⚜</div>
                </>
            ),
            divider: <div className="flex justify-center gap-2 py-2 opacity-40 text-yellow-500"><span>✦</span><span className="text-xs mt-1">◆</span><span>✦</span></div>
        },
        vintage: {
            corners: (
                <>
                    <div className="absolute top-2 left-2 w-16 h-16 border-t-2 border-l-2 border-[#A0845C] opacity-50 pointer-events-none"></div>
                    <div className="absolute top-2 right-2 w-16 h-16 border-t-2 border-r-2 border-[#A0845C] opacity-50 pointer-events-none"></div>
                    <div className="absolute bottom-2 left-2 w-16 h-16 border-b-2 border-l-2 border-[#A0845C] opacity-50 pointer-events-none"></div>
                    <div className="absolute bottom-2 right-2 w-16 h-16 border-b-2 border-r-2 border-[#A0845C] opacity-50 pointer-events-none"></div>
                </>
            ),
            divider: <div className="flex justify-center py-2 opacity-40 text-[#A0845C] tracking-[0.5em]">— ✦ —</div>
        },
        traditional: {
            corners: (
                <>
                    <div className="absolute top-3 left-3 w-12 h-12 border-t-4 border-l-4 border-double border-[#C9A24D] opacity-80 pointer-events-none"></div>
                    <div className="absolute top-3 right-3 w-12 h-12 border-t-4 border-r-4 border-double border-[#C9A24D] opacity-80 pointer-events-none"></div>
                    <div className="absolute bottom-3 left-3 w-12 h-12 border-b-4 border-l-4 border-double border-[#C9A24D] opacity-80 pointer-events-none"></div>
                    <div className="absolute bottom-3 right-3 w-12 h-12 border-b-4 border-r-4 border-double border-[#C9A24D] opacity-80 pointer-events-none"></div>
                </>
            ),
            divider: <div className="w-24 h-0.5 bg-[#C9A24D]/60 mx-auto my-2"></div>
        },
        garden: {
            corners: (
                <>
                    <div className="absolute top-0 left-0 text-4xl opacity-30 pointer-events-none -translate-x-2 -translate-y-2">🌿</div>
                    <div className="absolute top-0 right-0 text-4xl opacity-30 pointer-events-none translate-x-2 -translate-y-2 scale-x-[-1]">🌿</div>
                </>
            ),
            divider: <div className="flex justify-center gap-2 py-2 opacity-40"><span>🍃</span><span>✿</span><span>🍃</span></div>
        },
        minimalist: {
            corners: null,
            divider: <div className="w-16 h-px bg-current mx-auto my-2 opacity-20"></div>
        },
        modern: {
            corners: null,
            divider: <div className="flex items-center justify-center gap-3 py-2 opacity-30"><span className="w-12 h-px bg-current"></span><span className="text-[10px]">◇</span><span className="w-12 h-px bg-current"></span></div>
        }
    };
    return decors[templateId]?.[position] || null;
};

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
    useScrollReveal(data); // Initialize animations

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

    // Style Mapping for Unified Layout
    const getStyles = () => {
        switch (templateId) {
            case 'luxury': return { title: "font-['Cinzel',serif]", body: "font-['Inter',sans-serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-stone-900', text: 'text-stone-200', accent: 'text-yellow-400 text-shadow-sm', accentBg: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' };
            case 'traditional': return { title: "font-['Playfair_Display',serif]", body: "font-['Merriweather',serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-[#FFF6E5]', text: 'text-[#9B1C1C]', accent: 'text-[#C9A24D]', accentBg: 'bg-[#9B1C1C] text-[#FFF6E5] border-[#C9A24D]' };
            case 'vintage': return { title: "font-['Cinzel',serif]", body: "font-['Merriweather',serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-[#F5EED8]', text: 'text-[#5C4A1E]', accent: 'text-[#A0845C]', accentBg: 'bg-[#7B5C2A] text-[#FDF6E3] border-[#A0845C]' };
            case 'floral': return { title: "font-['Playfair_Display',serif]", body: "font-['Inter',sans-serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-pink-50/50', text: 'text-gray-700', accent: 'text-pink-500', accentBg: 'bg-pink-500 text-white border-pink-200' };
            case 'romantic': return { title: "font-['Playfair_Display',serif]", body: "font-['Inter',sans-serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-rose-50/50', text: 'text-rose-900', accent: 'text-rose-500', accentBg: 'bg-rose-500 text-white border-rose-200' };
            case 'garden': return { title: "font-['Playfair_Display',serif]", body: "font-['Inter',sans-serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-emerald-50/30', text: 'text-emerald-950', accent: 'text-emerald-600', accentBg: 'bg-emerald-600 text-white border-emerald-200' };
            case 'minimalist': return { title: "font-['Montserrat',sans-serif]", body: "font-['Montserrat',sans-serif]", script: "font-['Montserrat',sans-serif]", bg: 'bg-white', text: 'text-gray-900', accent: 'text-gray-900', accentBg: 'bg-gray-900 text-white border-gray-900' };
            default: // modern
                return { title: "font-['Montserrat',sans-serif]", body: "font-['Inter',sans-serif]", script: "font-['Great_Vibes',cursive]", bg: 'bg-white', text: 'text-slate-800', accent: 'text-rose-500', accentBg: 'bg-rose-500 text-white border-rose-200' };
        }
    };
    const s = getStyles();
    const isDark = templateId === 'luxury';

    return (
        <div className={`w-full overflow-x-hidden relative ${s.bg} ${s.text} ${s.body}`}>
            {/* Fonts Import */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Montserrat:wght@300;400;500;600&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap');
                .text-shadow-sm { text-shadow: 0 2px 4px rgba(0,0,0,0.3); }
                .text-shadow-lg { text-shadow: 0 4px 12px rgba(0,0,0,0.5); }
                .glass-card { background: ${isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)'}; backdrop-filter: blur(8px); }
            `}</style>

            {/* Global Petal/Floating Effects */}
            {petalEffect && petalEffect !== 'none' && <FloatingEffect type={petalEffect} />}

            {/* 1. HERO SECTION */}
            <section className="relative w-full h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
                <TemplateDecor templateId={templateId} position="corners" />
                {couplePhoto ? (
                    <div className="absolute inset-0 z-0">
                        <img src={couplePhoto} alt="Couple" className="w-full h-full object-cover object-center" />
                        <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-stone-900 via-stone-900/60 to-black/30' : 'from-white via-white/40 to-transparent'}`}></div>
                    </div>
                ) : (
                    <div className="absolute inset-0 z-0 flex items-center justify-center opacity-5">
                        <Heart className="w-64 h-64" />
                    </div>
                )}

                <div className="relative z-10 w-full px-6 flex flex-col items-center text-center mt-12">
                    <div className="reveal">
                        <p className={`text-[10px] uppercase tracking-[0.4em] mb-4 opacity-80 font-bold ${couplePhoto && !isDark ? 'text-gray-800' : ''}`}>Trân Trọng Kính Mời</p>
                        <StickerDecor emoji={headerSticker} size="text-4xl" className="mb-2" />
                    </div>

                    <div className="reveal delay-200">
                        <h1 className={`${s.script} text-5xl sm:text-6xl lg:text-7xl leading-tight ${s.accent} mb-1 drop-shadow-md px-2 break-words`}>{groomName || 'Chú Rể'}</h1>
                        <span className={`${s.title} text-xl opacity-60 my-2 block ${couplePhoto && !isDark ? 'text-gray-800' : ''}`}>&amp;</span>
                        <h1 className={`${s.script} text-5xl sm:text-6xl lg:text-7xl leading-tight ${s.accent} mt-1 drop-shadow-md px-2 break-words`}>{brideName || 'Cô Dâu'}</h1>
                    </div>

                    <div className="reveal delay-400 mt-6 w-full max-w-xs">
                        {dividerSticker ? <StickerDecor emoji={dividerSticker} size="text-2xl" className="my-2" /> : <TemplateDecor templateId={templateId} position="divider" />}
                        <div className={`${s.title} mt-4 tracking-widest uppercase font-bold flex flex-col items-center gap-2 ${couplePhoto && !isDark ? 'text-gray-800' : ''}`}>
                            <span className="text-base">{isValidDate ? `${day} . ${String(month).padStart(2,'0')} . ${year}` : '-- . -- . ----'}</span>
                            <span className="text-[10px] opacity-70 tracking-[0.3em] font-normal">{dayName} {time && `· ${time}`}</span>
                            {lunarDate && <span className="text-[10px] opacity-60 mt-1 capitalize font-normal italic">({lunarDate})</span>}
                        </div>
                    </div>

                    <div className="reveal delay-500 absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
                        <span className="text-[9px] uppercase tracking-widest opacity-50 mb-1">Kéo xuống</span>
                        <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* 2. INVITATION MESSAGE & FAMILY */}
            <section className="py-16 px-6 text-center relative z-10 glass-card mx-4 rounded-3xl shadow-xl -mt-6">
                <div className="reveal-zoom max-w-lg mx-auto">
                    <Quote className={`w-8 h-8 mx-auto mb-4 opacity-20 ${s.accent}`} />
                    <h2 className={`${s.title} text-sm font-bold mb-6 uppercase tracking-[0.2em] opacity-80`}>Lời Mời Trân Trọng</h2>
                    <p className={`${s.body} text-sm leading-relaxed opacity-90 italic mb-8 px-4`}>
                        "{wishes || 'Sự hiện diện của quý vị là niềm vinh hạnh lớn nhất cho gia đình chúng tôi.'}"
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-xs mt-8 border-t border-current pt-8 opacity-90" style={{ borderColor: 'var(--tw-border-opacity, 0.2)' }}>
                        <div className="border-r border-current" style={{ borderColor: 'inherit' }}>
                            <strong className={`${s.title} text-[10px] uppercase tracking-wider block mb-3 ${s.accent}`}>Nhà Trai</strong>
                            <p className="mb-1 leading-relaxed">Ông: {groomParents?.father || '...'}</p>
                            <p className="leading-relaxed">Bà: {groomParents?.mother || '...'}</p>
                        </div>
                        <div>
                            <strong className={`${s.title} text-[10px] uppercase tracking-wider block mb-3 ${s.accent}`}>Nhà Gái</strong>
                            <p className="mb-1 leading-relaxed">Ông: {brideParents?.father || '...'}</p>
                            <p className="leading-relaxed">Bà: {brideParents?.mother || '...'}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. COUNTDOWN */}
            {countdownEnabled && date && !timeLeft.passed && (
                <section className="py-16 px-6 text-center reveal">
                    <h3 className={`${s.title} text-xs uppercase tracking-[0.3em] mb-8 opacity-70`}>Đếm Ngược Ngày Vui</h3>
                    <div className="flex justify-center gap-3 sm:gap-6">
                        {[
                            { label: 'Ngày', value: timeLeft.days },
                            { label: 'Giờ', value: timeLeft.hours },
                            { label: 'Phút', value: timeLeft.minutes },
                            { label: 'Giây', value: timeLeft.seconds },
                        ].map((item, i) => (
                            <div key={item.label} className="flex flex-col items-center">
                                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border shadow-lg glass-card ${isDark ? 'border-stone-700' : 'border-white'}`}>
                                    <span className={`${s.title} text-2xl sm:text-3xl font-bold ${s.accent} animate-countdown tabular-nums`}>
                                        {String(item.value).padStart(2, '0')}
                                    </span>
                                </div>
                                <span className="text-[9px] uppercase tracking-wider mt-3 opacity-60 font-bold">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 4. EVENTS TIMELINE */}
            {events && events.length > 0 && (
                <section className="py-16 px-6">
                    <div className="reveal text-center mb-10">
                        <h3 className={`${s.title} text-xs uppercase tracking-[0.3em] opacity-70 mb-2`}>Chương Trình</h3>
                        <h2 className={`${s.script} text-4xl ${s.accent}`}>Sự Kiện</h2>
                    </div>

                    <div className="max-w-md mx-auto space-y-6">
                        {events.map((evt, idx) => (
                            <div key={evt.id} className={`reveal-left delay-${(idx % 3 + 1) * 100} glass-card p-5 rounded-2xl border shadow-sm ${isDark ? 'border-stone-700' : 'border-white'}`}>
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-full flex-shrink-0 flex flex-col items-center justify-center border-2 shadow-inner ${s.accentBg}`}>
                                        <span className="text-xs font-bold">{evt.time.split(':')[0]}</span>
                                        <span className="text-[8px] opacity-80 -mt-1">{evt.time.split(':')[1]}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className={`${s.title} font-bold text-sm uppercase tracking-wider mb-1 ${s.accent}`}>{evt.title}</h4>
                                        <p className="text-[11px] font-bold opacity-80 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(evt.date).toLocaleDateString('vi-VN')}</p>
                                        <p className="text-[11px] opacity-80 mb-2 flex items-start gap-1"><MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" /> <span className="leading-tight">{evt.location}</span></p>
                                        {evt.description && <p className="text-[11px] opacity-70 italic leading-relaxed bg-black/5 p-2 rounded">{evt.description}</p>}
                                        
                                        <div className="mt-3 text-[10px]">
                                            <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evt.title)}&dates=${evt.date.replace(/-/g,'')}T${evt.time.replace(':','')}00Z/${evt.date.replace(/-/g,'')}T${String(parseInt(evt.time)+2).padStart(2,'0')}${evt.time.split(':')[1]}00Z&location=${encodeURIComponent(evt.location)}`} 
                                               target="_blank" rel="noopener noreferrer"
                                               className="inline-flex items-center gap-1 text-blue-500 hover:underline font-bold">
                                                <Calendar className="w-3 h-3" /> Thêm vào Lịch Google
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 5. LOCATION & MAP (If single location provided outside events) */}
            {(location || address) && (!events || events.length === 0) && (
                <section className="py-16 px-6 text-center reveal-zoom">
                    <h3 className={`${s.title} text-xs uppercase tracking-[0.3em] mb-4 opacity-70`}>Địa Điểm Tổ Chức</h3>
                    <div className={`glass-card p-6 rounded-2xl border shadow-lg max-w-sm mx-auto ${isDark ? 'border-stone-700' : 'border-white'}`}>
                        <p className={`${s.title} font-bold text-lg mb-2 ${s.accent}`}>{location}</p>
                        <p className="text-sm opacity-80 mb-6 px-4">{address}</p>
                        {mapLink && (
                            <a href={mapLink} target="_blank" rel="noopener noreferrer" 
                               className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold text-xs tracking-wider uppercase transition-transform active:scale-95 shadow-md ${s.accentBg}`}>
                                <MapPin className="w-4 h-4" /> Xem Bản Đồ
                            </a>
                        )}
                    </div>
                </section>
            )}

            {/* 6. PHOTO GALLERY */}
            {galleryImages && galleryImages.length > 0 && (
                <section className="py-16 px-2 sm:px-6">
                    <div className="reveal text-center mb-8">
                        <h3 className={`${s.title} text-xs uppercase tracking-[0.3em] opacity-70 mb-2`}>Album Ảnh</h3>
                        <h2 className={`${s.script} text-4xl ${s.accent}`}>Khoảnh Khắc</h2>
                    </div>
                    
                    {/* Masonry-like Grid */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 max-w-2xl mx-auto">
                        {galleryImages.map((img, i) => (
                            <div key={i} className={`reveal-zoom delay-${(i % 4) * 100} rounded-xl overflow-hidden shadow-sm relative group ${i % 3 === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-[4/5]'}`}>
                                <img src={img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Gallery" loading="lazy" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 7. LOVE STORY */}
            {loveStory && loveStory.length > 0 && (
                <section className="py-16 px-6">
                    <div className="reveal text-center mb-10">
                        <h3 className={`${s.title} text-xs uppercase tracking-[0.3em] opacity-70 mb-2`}>Câu Chuyện Tình Yêu</h3>
                        <h2 className={`${s.script} text-4xl ${s.accent}`}>Our Story</h2>
                    </div>

                    <div className="relative max-w-sm mx-auto">
                        <div className="absolute left-[15px] top-4 bottom-4 w-px bg-current opacity-20"></div>
                        {loveStory.map((evt, idx) => (
                            <div key={evt.id} className={`reveal-right delay-${(idx % 3) * 100} relative pl-10 mb-8`}>
                                <div className={`absolute left-0 top-1 w-8 h-8 rounded-full border-4 flex items-center justify-center ${s.bg} border-current`} style={{ borderColor: 'inherit' }}>
                                    <Heart className={`w-3 h-3 fill-current ${s.accent}`} />
                                </div>
                                <div className={`glass-card p-4 rounded-2xl border shadow-sm ${isDark ? 'border-stone-700' : 'border-white'}`}>
                                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-60 bg-current/10 px-2 py-0.5 rounded">{evt.date}</span>
                                    <h4 className={`${s.title} font-bold text-sm mt-2 mb-1 ${s.accent}`}>{evt.title}</h4>
                                    <p className="text-xs opacity-80 leading-relaxed">{evt.description}</p>
                                    {evt.photo && (
                                        <img src={evt.photo} alt={evt.title} className="w-full h-32 object-cover rounded-xl mt-3 shadow-sm" loading="lazy" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 8. BANKING / GIFT */}
            {vietQrUrl && (
                <section className="py-16 px-6 text-center reveal-zoom">
                    <h3 className={`${s.title} text-xs uppercase tracking-[0.3em] mb-2 opacity-70`}>Hộp Mừng Cưới</h3>
                    <h2 className={`${s.script} text-4xl mb-8 ${s.accent}`}>Gửi Lời Chúc Mừng</h2>
                    
                    <div className={`glass-card p-6 rounded-3xl border shadow-lg max-w-xs mx-auto ${isDark ? 'border-stone-700' : 'border-white'}`}>
                        <div className="bg-white p-3 rounded-2xl shadow-inner mb-4 inline-block">
                            <img src={vietQrUrl} alt="QR Code" className="w-40 h-40 object-contain" />
                        </div>
                        <div className="text-center">
                            <p className="text-xs uppercase tracking-widest opacity-60 mb-1">{bankInfo?.bankId}</p>
                            <p className={`font-mono text-lg font-bold tracking-wider mb-1 ${s.accent}`}>{bankInfo?.accountNumber}</p>
                            <p className="font-bold text-sm uppercase">{bankInfo?.accountName}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* 9. RSVP & GUESTBOOK */}
            <section className="py-16 px-6 text-center bg-black/5">
                <div className="reveal">
                    {dividerSticker ? <StickerDecor emoji={dividerSticker} size="text-2xl" className="mb-4" /> : <TemplateDecor templateId={templateId} position="divider" />}
                    <h2 className={`${s.script} text-4xl mb-6 mt-4 ${s.accent}`}>Tham Dự & Lưu Bút</h2>
                </div>

                <div className="max-w-sm mx-auto space-y-4">
                    {rsvpEnabled && (
                        <div className="reveal-left delay-100">
                            <button onClick={onRSVP} className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wider uppercase shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-2 ${s.accentBg}`}>
                                Xác Nhận Tham Dự
                            </button>
                            {rsvpDeadline && <p className="text-[10px] opacity-60 mt-2">Vui lòng phản hồi trước: {new Date(rsvpDeadline).toLocaleDateString('vi-VN')}</p>}
                        </div>
                    )}
                    
                    {guestbookEnabled && (
                        <div className="reveal-right delay-200 mt-6">
                            <button onClick={onGuestbook} className="w-full py-4 rounded-2xl font-bold text-sm tracking-wider uppercase border-2 shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2 hover:bg-black/5" style={{ borderColor: 'currentColor' }}>
                                Gửi Lời Chúc
                            </button>
                        </div>
                    )}
                </div>

                {guestbookEnabled && guestWishes && guestWishes.length > 0 && (
                    <div className="mt-12 max-w-md mx-auto text-left space-y-3">
                        <h4 className={`${s.title} text-xs uppercase tracking-widest text-center mb-6 opacity-60`}>Lời chúc từ mọi người</h4>
                        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {guestWishes.map(w => (
                                <div key={w.id} className={`glass-card p-4 rounded-xl border shadow-sm mb-3 reveal ${isDark ? 'border-stone-700' : 'border-white'}`}>
                                    <p className="font-bold text-sm mb-1">{w.name}</p>
                                    <p className="text-xs opacity-80 leading-relaxed italic">"{w.message}"</p>
                                    <p className="text-[9px] opacity-40 mt-2">{new Date(w.createdAt).toLocaleDateString('vi-VN')}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* FOOTER */}
            <footer className="py-12 text-center opacity-40">
                <StickerDecor emoji={footerSticker} size="text-2xl" className="mb-4" />
                <p className={`${s.script} text-2xl mb-2`}>{groomName} &amp; {brideName}</p>
                <p className="text-[8px] uppercase tracking-[0.4em] font-bold">WEDPLAN AI</p>
            </footer>

            {/* Spacer for sticky bottom bar in PublicView */}
            <div className="h-24"></div>
        </div>
    );
};

export default InvitationPreview;
