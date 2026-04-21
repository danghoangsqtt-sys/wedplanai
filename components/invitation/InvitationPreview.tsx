
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { InvitationData, LoveStoryEvent, GuestWish } from '../../types';
import { MapPin, Calendar, Clock, Heart, Navigation, Quote, Sparkles, Camera } from 'lucide-react';

interface InvitationPreviewProps {
    data: InvitationData;
    onRSVP?: () => void;
    onGuestbook?: () => void;
}

// --- PETAL / HEART / SPARKLE EFFECT ---
const FloatingEffect: React.FC<{ type: 'petals' | 'hearts' | 'sparkles' }> = ({ type }) => {
    const items = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: `${5 + (i * 7) % 90}%`,
        duration: `${3 + (i * 0.7) % 4}s`,
        delay: `${(i * 0.4) % 5}s`,
        drift: `${-60 + (i * 9) % 120}px`,
        size: `${14 + (i * 3) % 14}px`,
    })), []);

    const emoji = type === 'hearts' ? '❤' : type === 'sparkles' ? '✦' : '✿';
    const animClass = type === 'hearts' ? 'animate-heart-float' : type === 'sparkles' ? 'animate-sparkle-float' : 'animate-petal-fall';
    const color = type === 'hearts' ? '#f43f5e' : type === 'sparkles' ? '#f59e0b' : '#fb7185';

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-40" aria-hidden>
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
                    } as React.CSSProperties}
                >
                    {emoji}
                </span>
            ))}
        </div>
    );
};

// --- COUNTDOWN TIMER ---
const CountdownTimer: React.FC<{ date: string; time: string; fontTitle: string; textAccent: string; divider: string }> = ({ date, time, fontTitle, textAccent, divider }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, passed: false });

    useEffect(() => {
        if (!date) return;
        const target = new Date(`${date}T${time || '10:00'}:00`);
        const update = () => {
            const diff = target.getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, passed: true });
                return;
            }
            setTimeLeft({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                minutes: Math.floor((diff % 3600000) / 60000),
                seconds: Math.floor((diff % 60000) / 1000),
                passed: false,
            });
        };
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [date, time]);

    const units = [
        { v: timeLeft.days, l: 'Ngày' },
        { v: timeLeft.hours, l: 'Giờ' },
        { v: timeLeft.minutes, l: 'Phút' },
        { v: timeLeft.seconds, l: 'Giây' },
    ];

    return (
        <section className="py-8 px-4 text-center">
            <div className={`w-8 h-px mx-auto mb-4 ${divider}`}></div>
            <h3 className={`${fontTitle} text-sm uppercase tracking-[0.3em] mb-8 opacity-70`}>
                {timeLeft.passed ? 'Đã cử hành hôn lễ' : 'Đếm Ngược Đến Ngày Vui'}
            </h3>
            {!timeLeft.passed && (
                <div className="flex justify-center gap-3 md:gap-5">
                    {units.map(({ v, l }) => (
                        <div key={l} className="flex flex-col items-center">
                            <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center shadow-lg border ${divider} bg-white/60 backdrop-blur-sm`}>
                                <span className={`${fontTitle} text-2xl md:text-3xl font-bold ${textAccent} animate-countdown tabular-nums`}>
                                    {v.toString().padStart(2, '0')}
                                </span>
                            </div>
                            <span className="text-[10px] uppercase tracking-wider mt-2 opacity-60">{l}</span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

// --- ADD TO CALENDAR BUTTONS ---
const AddToCalendar: React.FC<{ event: { title: string; date: string; time: string; location: string; description?: string }; groomName: string; brideName: string }> = ({ event, groomName, brideName }) => {
    const title = `${event.title} - ${groomName} & ${brideName}`;
    const dateStr = event.date.replace(/-/g, '');
    const [hh, mm] = (event.time || '10:00').split(':');
    const startDT = `${dateStr}T${hh}${mm}00`;
    const endHH = String(Math.min(parseInt(hh) + 3, 23)).padStart(2, '0');
    const endDT = `${dateStr}T${endHH}${mm}00`;
    const desc = event.description || `${event.title} - ${event.location}`;

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startDT}/${endDT}&location=${encodeURIComponent(event.location)}&details=${encodeURIComponent(desc)}`;
    const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(title)}&startdt=${event.date}T${event.time}&enddt=${event.date}T${endHH}:${mm}&location=${encodeURIComponent(event.location)}&body=${encodeURIComponent(desc)}`;
    const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${title}\nDTSTART:${startDT}\nDTEND:${endDT}\nLOCATION:${event.location}\nDESCRIPTION:${desc}\nEND:VEVENT\nEND:VCALENDAR`;

    return (
        <div className="flex flex-wrap gap-1.5 mt-3">
            <a href={googleUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                <Calendar className="w-3 h-3" /> Google
            </a>
            <a href={outlookUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 hover:bg-sky-200 transition-colors">
                <Calendar className="w-3 h-3" /> Outlook
            </a>
            <a href={`data:text/calendar;charset=utf8,${encodeURIComponent(icsData)}`} download={`${event.title}.ics`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                <Calendar className="w-3 h-3" /> Apple/iCal
            </a>
        </div>
    );
};

// --- LOVE STORY TIMELINE ---
const LoveStorySection: React.FC<{ events: LoveStoryEvent[]; fontTitle: string; fontScript: string; fontBody: string; textAccent: string; divider: string; bg: string }> = (props) => {
    const { events, fontTitle, fontScript, textAccent, divider, bg } = props;
    if (!events.length) return null;
    return (
        <section className="py-8 px-4">
            <div className={`w-8 h-px mx-auto mb-4 ${divider}`}></div>
            <h3 className={`${fontTitle} text-sm uppercase tracking-[0.3em] mb-2 text-center opacity-70`}>Câu Chuyện Tình Yêu</h3>
            <p className={`${fontScript} text-2xl text-center mb-8 ${textAccent}`}>Our Story</p>
            <div className="relative max-w-sm mx-auto">
                <div className={`absolute left-1/2 top-0 bottom-0 w-px opacity-30`} style={{ background: 'currentColor' }}></div>
                {events.map((evt, idx) => (
                    <div key={evt.id} className={`flex items-start mb-10 gap-4 ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                        <div className={`flex-1 ${idx % 2 === 0 ? 'text-right pr-4' : 'text-left pl-4'}`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wider opacity-60`}>{evt.date}</span>
                            <p className="font-bold text-sm mt-0.5">{evt.title}</p>
                            <p className="text-xs opacity-70 mt-1 leading-relaxed">{evt.description}</p>
                            {evt.photo && (
                                <img src={evt.photo} alt={evt.title} className="w-20 h-16 object-cover rounded-lg mt-2 shadow-sm inline-block" />
                            )}
                        </div>
                        <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center z-10 shadow-md mt-1`} style={{ background: 'white', border: '2px solid currentColor' }}>
                            <Heart className={`w-2.5 h-2.5 ${textAccent} fill-current`} />
                        </div>
                        <div className="flex-1"></div>
                    </div>
                ))}
            </div>
        </section>
    );
};

// --- GUESTBOOK PREVIEW ---
const GuestbookSection: React.FC<{ wishes: GuestWish[]; fontTitle: string; fontScript: string; textAccent: string; divider: string; onGuestbook?: () => void }> = ({ wishes, fontTitle, fontScript, textAccent, divider, onGuestbook }) => (
    <section className="py-8 px-6 text-center">
        <div className={`w-8 h-px mx-auto mb-4 ${divider}`}></div>
        <h3 className={`${fontTitle} text-sm uppercase tracking-[0.3em] mb-2 opacity-70`}>Sổ Lưu Bút</h3>
        <p className={`${fontScript} text-2xl mb-6 ${textAccent}`}>Guestbook</p>
        {wishes.length > 0 ? (
            <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {wishes.map(w => (
                    <div key={w.id} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-left shadow-sm border border-white">
                        <p className="font-bold text-sm">{w.name}</p>
                        <p className="text-xs opacity-80 mt-1 italic">"{w.message}"</p>
                        <p className="text-[10px] opacity-40 mt-1">{new Date(w.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                ))}
            </div>
        ) : (
            <p className="text-sm opacity-50 mb-6">Hãy là người đầu tiên gửi lời chúc! 💌</p>
        )}
        <button
            type="button"
            onClick={onGuestbook}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 font-bold text-sm transition-all hover:scale-105 active:scale-95"
            style={{ borderColor: 'currentColor' }}
        >
            <Heart className="w-4 h-4 fill-current" /> Gửi Lời Chúc Mừng
        </button>
    </section>
);

// --- RSVP SECTION ---
const RSVPSection: React.FC<{ deadline?: string; fontTitle: string; fontScript: string; textAccent: string; divider: string; bg: string; onRSVP?: () => void }> = ({ deadline, fontTitle, fontScript, textAccent, divider, onRSVP }) => (
    <section className="py-8 px-6 text-center">
        <div className={`w-8 h-px mx-auto mb-4 ${divider}`}></div>
        <h3 className={`${fontTitle} text-sm uppercase tracking-[0.3em] mb-2 opacity-70`}>Xác Nhận Tham Dự</h3>
        <p className={`${fontScript} text-2xl mb-4 ${textAccent}`}>RSVP</p>
        {deadline && (
            <p className="text-xs opacity-60 mb-6">Vui lòng xác nhận trước ngày <strong>{new Date(deadline).toLocaleDateString('vi-VN')}</strong></p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
                type="button"
                onClick={onRSVP}
                className={`inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-sm text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${textAccent.replace('text-', 'bg-')}`}
                style={{ background: 'var(--theme-color, #e11d48)' }}
            >
                🎉 Tôi Sẽ Tham Dự
            </button>
            <button
                type="button"
                onClick={onRSVP}
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold text-sm border-2 opacity-70 transition-all hover:scale-105 active:scale-95"
                style={{ borderColor: 'currentColor' }}
            >
                😢 Tôi Không Thể Đến
            </button>
        </div>
    </section>
);

// =====================================================================
// MAIN COMPONENT
// =====================================================================
const InvitationPreview: React.FC<InvitationPreviewProps> = ({ data, onRSVP, onGuestbook }) => {
    const {
        templateId, groomName, brideName, groomParents, brideParents, date, lunarDate, time,
        location, address, mapLink, wishes, themeColor,
        bankInfo, couplePhoto, galleryImages, events,
        loveStory, rsvpEnabled, rsvpDeadline, guestbookEnabled,
        countdownEnabled, petalEffect, guestWishes,
    } = data;

    const vietQrUrl = useMemo(() => {
        if (!bankInfo.bankId || !bankInfo.accountNumber) return '';
        return `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNumber}-compact2.png`;
    }, [bankInfo]);

    const weddingDate = new Date(date);
    const isValidDate = Boolean(date) && !isNaN(weddingDate.getTime());
    const day     = isValidDate ? weddingDate.getDate()              : '--';
    const month   = isValidDate ? weddingDate.getMonth() + 1        : '--';
    const year    = isValidDate ? weddingDate.getFullYear()          : '----';
    const dayName = isValidDate ? weddingDate.toLocaleDateString('vi-VN', { weekday: 'long' }) : '';

    // --- TRADITIONAL TEMPLATE ---
    if (templateId === 'traditional') {
        return (
            <div className="w-full min-h-[800px] bg-[#FFF6E5] text-[#9B1C1C] flex flex-col items-center py-12 px-6 relative font-serif">
                {petalEffect && petalEffect !== 'none' && <FloatingEffect type={petalEffect} />}
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Great+Vibes&display=swap');
          .traditional-card { border: 4px double #C9A24D; padding: 30px 20px; width: 100%; max-width: 450px; background: #FFFBF0; box-shadow: 0 10px 30px rgba(155,28,28,0.1); position: relative; text-align: center; }
          .corner-tl, .corner-tr, .corner-bl, .corner-br { position: absolute; width: 40px; height: 40px; border-color: #9B1C1C; border-style: solid; }
          .corner-tl { top:10px; left:10px; border-width: 2px 0 0 2px; }
          .corner-tr { top:10px; right:10px; border-width: 2px 2px 0 0; }
          .corner-bl { bottom:10px; left:10px; border-width: 0 0 2px 2px; }
          .corner-br { bottom:10px; right:10px; border-width: 0 2px 2px 0; }
        `}</style>
                <div className="traditional-card font-merriweather">
                    <div className="corner-tl"></div><div className="corner-tr"></div>
                    <div className="corner-bl"></div><div className="corner-br"></div>
                    <p className="font-cinzel text-xs uppercase tracking-[0.35em] mb-4 opacity-60">Trân Trọng Kính Mời</p>
                    <div className="flex flex-col items-center justify-center mb-4">
                        <span className="font-handwriting text-4xl text-[#9B1C1C] mb-1 leading-tight break-words max-w-full px-2 text-center">{groomName || 'Chú Rể'}</span>
                        <span className="text-[#C9A24D] text-xl my-1">❧ ❤ ❧</span>
                        <span className="font-handwriting text-4xl text-[#9B1C1C] mt-1 leading-tight break-words max-w-full px-2 text-center">{brideName || 'Cô Dâu'}</span>
                    </div>
                    <div className="w-16 h-px bg-[#C9A24D]/60 mx-auto mb-4"></div>
                    <p className="text-sm font-merriweather italic mb-6 text-[#5C4033]">Kính mời đến dự lễ thành hôn</p>
                    {events && events.length > 0 ? (
                        <div className="space-y-8 mb-8 text-[#5C4033]">
                            <div className="w-24 h-0.5 bg-[#C9A24D]/40 mx-auto"></div>
                            {events.map(evt => (
                                <div key={evt.id} className="leading-relaxed px-4">
                                    <h3 className="text-[#9B1C1C] font-bold uppercase tracking-wider text-sm mb-2 font-serif-display">{evt.title}</h3>
                                    <p className="font-merriweather text-sm italic opacity-95 text-justify">{evt.description || `${evt.title} diễn ra vào hồi ${evt.time} tại ${evt.location}`}</p>
                                    <AddToCalendar event={evt} groomName={groomName} brideName={brideName} />
                                </div>
                            ))}
                            <div className="w-24 h-0.5 bg-[#C9A24D]/40 mx-auto"></div>
                        </div>
                    ) : (
                        <div className="text-base font-merriweather mb-8 leading-relaxed text-[#5C4033]">
                            Hôn lễ được cử hành vào hồi<br />
                            <strong className="text-base text-[#9B1C1C] block my-2 font-bold uppercase">{time}, {dayName}</strong>
                            <span className="text-lg font-bold block my-2 tracking-widest text-[#9B1C1C]">{day} · {month} · {year}</span>
                            {lunarDate && <span className="block text-sm opacity-80 italic font-serif">({lunarDate})</span>}
                        </div>
                    )}
                    {(location || address) && (
                        <div className="mb-8">
                            <p className="text-base uppercase tracking-widest text-[#9B1C1C] mb-2 font-bold font-serif-display">Tại</p>
                            <p className="text-sm font-bold text-[#1F2937]">{location}</p>
                            <p className="text-xs opacity-80 mt-1 mb-3">{address}</p>
                            {mapLink && <a href={mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#9B1C1C] text-[#FFF6E5] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#7B1212] transition-all shadow-sm border border-[#C9A24D]"><MapPin className="w-3 h-3" /> Bản đồ</a>}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm text-left mb-8 px-2 font-serif border-t border-[#C9A24D]/30 pt-4">
                        <div className="border-r border-[#C9A24D]/30 pr-2 text-center">
                            <strong className="block text-[#9B1C1C] mb-2 uppercase text-xs tracking-wider font-bold">Nhà Trai</strong>
                            <p className="leading-snug mb-1">Ông: {groomParents?.father || '...'}</p>
                            <p className="leading-snug">Bà: {groomParents?.mother || '...'}</p>
                        </div>
                        <div className="pl-2 text-center">
                            <strong className="block text-[#9B1C1C] mb-2 uppercase text-xs tracking-wider font-bold">Nhà Gái</strong>
                            <p className="leading-snug mb-1">Ông: {brideParents?.father || '...'}</p>
                            <p className="leading-snug">Bà: {brideParents?.mother || '...'}</p>
                        </div>
                    </div>
                    <p className="text-sm italic leading-relaxed px-4 opacity-90 font-serif">Trân trọng kính mời Quý vị tới dự lễ thành hôn<br />Sự hiện diện của Quý vị là niềm vinh hạnh cho gia đình chúng tôi</p>
                    {vietQrUrl && (
                        <div className="mt-8 pt-6 border-t border-[#C9A24D]/30">
                            <div className="w-32 h-32 mx-auto bg-white p-2 border border-[#C9A24D] shadow-inner mb-2">
                                <img src={vietQrUrl} alt="QR" className="w-full h-full object-contain" />
                            </div>
                            <p className="text-xs font-bold uppercase text-[#C9A24D]">Mừng cưới / Gửi lời chúc</p>
                        </div>
                    )}
                </div>

                {/* Extra sections for traditional */}
                {countdownEnabled && date && <CountdownTimer date={date} time={time} fontTitle="font-cinzel" textAccent="text-[#9B1C1C]" divider="bg-[#C9A24D]" />}
                {loveStory && loveStory.length > 0 && <LoveStorySection events={loveStory} fontTitle="font-cinzel" fontScript="font-handwriting" fontBody="font-merriweather" textAccent="text-[#9B1C1C]" divider="bg-[#C9A24D]" bg="bg-[#FFF6E5]" />}
                {rsvpEnabled && <RSVPSection deadline={rsvpDeadline} fontTitle="font-cinzel" fontScript="font-handwriting" textAccent="text-[#9B1C1C]" divider="bg-[#C9A24D]" bg="bg-[#FFF6E5]" onRSVP={onRSVP} />}
                {guestbookEnabled && <GuestbookSection wishes={guestWishes || []} fontTitle="font-cinzel" fontScript="font-handwriting" textAccent="text-[#9B1C1C]" divider="bg-[#C9A24D]" onGuestbook={onGuestbook} />}

                <div className="mt-8 text-center opacity-60 text-xs font-serif italic">
                    <p className="flex items-center justify-center gap-1 font-bold">WEDPLAN AI — wedplanai.io.vn</p>
                </div>
            </div>
        );
    }

    // --- VINTAGE TEMPLATE ---
    if (templateId === 'vintage') {
        return (
            <div className="w-full min-h-[800px] bg-[#F5EED8] text-[#5C4A1E] flex flex-col relative overflow-hidden">
                {petalEffect && petalEffect !== 'none' && <FloatingEffect type={petalEffect} />}
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Merriweather:ital,wght@0,400;1,400&family=Great+Vibes&display=swap');
          .vintage-border { border: 3px solid #A0845C; outline: 1px solid #A0845C; outline-offset: -8px; }
          .vintage-ornament { color: #A0845C; opacity: 0.4; font-size: 2rem; letter-spacing: 0.5rem; }
        `}</style>

                {/* Vintage texture overlay */}
                <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #5C4A1E 0px, transparent 1px, transparent 8px)' }}></div>

                {/* HERO */}
                <section className="relative flex flex-col items-center justify-center px-6 py-10 text-center vintage-border m-4">
                    <p className="vintage-ornament mb-3">— ✦ —</p>
                    <p className="font-cinzel text-[10px] uppercase tracking-[0.4em] mb-4 opacity-60">Trân trọng kính mời</p>
                    {couplePhoto && (
                        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#A0845C] shadow-xl mb-4 mx-auto">
                            <img src={couplePhoto} alt="Couple" className="w-full h-full object-cover sepia-[0.3]" />
                        </div>
                    )}
                    <h1 className="font-handwriting text-4xl text-[#7B5C2A] mb-1 leading-tight break-words max-w-full text-center">{groomName || 'Chú Rể'}</h1>
                    <p className="vintage-ornament text-xl my-1">✦</p>
                    <h1 className="font-handwriting text-4xl text-[#7B5C2A] mb-4 leading-tight break-words max-w-full text-center">{brideName || 'Cô Dâu'}</h1>
                    <div className="w-24 h-px bg-[#A0845C] mx-auto mb-3"></div>
                    <p className="font-cinzel text-sm font-bold tracking-widest">{isValidDate ? `${day} / ${String(month).padStart(2,'0')} / ${year}` : '— / — / ——'}</p>
                    {lunarDate && <p className="font-merriweather text-xs italic mt-1 opacity-70">({lunarDate})</p>}
                    <p className="vintage-ornament mt-3">— ✦ —</p>
                </section>

                {/* INVITATION TEXT */}
                <section className="py-8 px-8 text-center">
                    <Quote className="w-8 h-8 mx-auto mb-3 opacity-20 text-[#7B5C2A]" />
                    <p className="font-merriweather italic text-sm leading-loose opacity-90 max-w-xs mx-auto">"{wishes || 'Trân trọng kính mời quý vị đến chung vui cùng gia đình chúng tôi.'}"</p>
                </section>

                {/* EVENTS */}
                {events && events.length > 0 && (
                    <section className="py-8 px-6">
                        <h3 className="font-cinzel text-sm uppercase tracking-[0.3em] text-center mb-8 opacity-70">Chương Trình Lễ</h3>
                        <div className="space-y-4 max-w-sm mx-auto">
                            {events.map(evt => (
                                <div key={evt.id} className="border border-[#A0845C]/40 rounded-lg p-4 bg-[#FDF6E3]">
                                    <p className="font-cinzel font-bold text-sm text-[#7B5C2A] uppercase mb-1">{evt.title}</p>
                                    <p className="text-xs opacity-70 font-merriweather italic mb-2">{evt.time} · {evt.location}</p>
                                    {evt.description && <p className="text-xs opacity-80 leading-relaxed">{evt.description}</p>}
                                    <AddToCalendar event={evt} groomName={groomName} brideName={brideName} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Parents */}
                <section className="py-8 px-8 border-t border-[#A0845C]/30">
                    <div className="grid grid-cols-2 gap-6 text-center text-sm max-w-sm mx-auto">
                        <div>
                            <strong className="font-cinzel text-xs uppercase tracking-wider text-[#7B5C2A] block mb-2">Nhà Trai</strong>
                            <p className="opacity-80">Ông: {groomParents?.father || '...'}</p>
                            <p className="opacity-80">Bà: {groomParents?.mother || '...'}</p>
                        </div>
                        <div>
                            <strong className="font-cinzel text-xs uppercase tracking-wider text-[#7B5C2A] block mb-2">Nhà Gái</strong>
                            <p className="opacity-80">Ông: {brideParents?.father || '...'}</p>
                            <p className="opacity-80">Bà: {brideParents?.mother || '...'}</p>
                        </div>
                    </div>
                </section>

                {/* Location */}
                {location && (
                    <section className="py-8 px-6 text-center">
                        <p className="font-cinzel text-xs uppercase tracking-[0.3em] opacity-60 mb-2">Địa Điểm Tổ Chức</p>
                        <p className="font-bold text-lg">{location}</p>
                        <p className="text-sm opacity-70 mt-1">{address}</p>
                        {mapLink && <a href={mapLink} target="_blank" className="mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#A0845C] text-[#7B5C2A] text-xs font-bold hover:bg-[#A0845C]/10 transition-colors"><MapPin className="w-3 h-3" /> Xem bản đồ</a>}
                    </section>
                )}

                {countdownEnabled && date && <CountdownTimer date={date} time={time} fontTitle="font-cinzel" textAccent="text-[#7B5C2A]" divider="bg-[#A0845C]" />}
                {galleryImages && galleryImages.length > 0 && (
                    <section className="py-8 px-2">
                        <h3 className="font-cinzel text-sm uppercase tracking-[0.3em] text-center mb-6 opacity-60">Khoảnh Khắc</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {galleryImages.map((img, i) => (
                                <div key={i} className={`overflow-hidden border-2 border-[#A0845C]/30 ${i === 0 ? 'col-span-2 aspect-[2/1]' : 'aspect-square'}`}>
                                    <img src={img} className="w-full h-full object-cover sepia-[0.2]" alt="" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                {vietQrUrl && (
                    <section className="py-12 px-6 text-center">
                        <p className="font-cinzel text-xs uppercase tracking-[0.3em] opacity-60 mb-4">Mừng Cưới</p>
                        <div className="inline-block p-4 border-2 border-[#A0845C]/40 bg-[#FDF6E3]">
                            <img src={vietQrUrl} alt="QR" className="w-36 h-36 object-contain" />
                        </div>
                        <div className="mt-3 text-sm"><p className="font-bold">{bankInfo.bankId} · {bankInfo.accountNumber}</p><p className="font-cinzel text-xs uppercase opacity-70">{bankInfo.accountName}</p></div>
                    </section>
                )}
                {loveStory && loveStory.length > 0 && <LoveStorySection events={loveStory} fontTitle="font-cinzel" fontScript="font-handwriting" fontBody="font-merriweather" textAccent="text-[#7B5C2A]" divider="bg-[#A0845C]" bg="bg-[#F5EED8]" />}
                {rsvpEnabled && <RSVPSection deadline={rsvpDeadline} fontTitle="font-cinzel" fontScript="font-handwriting" textAccent="text-[#7B5C2A]" divider="bg-[#A0845C]" bg="bg-[#F5EED8]" onRSVP={onRSVP} />}
                {guestbookEnabled && <GuestbookSection wishes={guestWishes || []} fontTitle="font-cinzel" fontScript="font-handwriting" textAccent="text-[#7B5C2A]" divider="bg-[#A0845C]" onGuestbook={onGuestbook} />}

                <footer className="py-8 text-center border-t border-[#A0845C]/30">
                    <p className="vintage-ornament text-xl mb-2">— ✦ —</p>
                    <p className="font-handwriting text-2xl text-[#7B5C2A]">{groomName} & {brideName}</p>
                    <p className="font-cinzel text-[9px] uppercase tracking-[0.3em] opacity-40 mt-4">WEDPLAN AI · wedplanai.io.vn</p>
                </footer>
            </div>
        );
    }

    // --- STYLE MAP for modern / luxury / floral / romantic / minimalist / garden ---
    const getTemplateStyles = () => {
        switch (templateId) {
            case 'luxury':
                return { fontTitle: "font-['Cinzel',serif]", fontBody: "font-['Inter',sans-serif]", fontScript: "font-['Great_Vibes',cursive]", bg: 'bg-stone-900', textMain: 'text-stone-200', textAccent: 'text-yellow-400', container: 'border-x-8 border-stone-800', ornament: 'opacity-20', divider: 'bg-yellow-500/50', heroBg: 'from-stone-900 via-stone-900/60', cardBg: 'bg-stone-800 border-stone-700' };
            case 'floral':
                return { fontTitle: "font-['Playfair_Display',serif]", fontBody: "font-['Inter',sans-serif]", fontScript: "font-['Great_Vibes',cursive]", bg: 'bg-pink-50', textMain: 'text-gray-700', textAccent: 'text-pink-500', container: '', ornament: 'text-pink-300', divider: 'bg-pink-200', heroBg: 'from-white/90 via-white/40', cardBg: 'bg-white border-gray-100' };
            case 'romantic':
                return { fontTitle: "font-['Playfair_Display',serif]", fontBody: "font-['Inter',sans-serif]", fontScript: "font-['Great_Vibes',cursive]", bg: 'bg-rose-50', textMain: 'text-rose-900', textAccent: 'text-rose-500', container: '', ornament: 'text-rose-200', divider: 'bg-rose-300', heroBg: 'from-rose-100/90 via-rose-50/60', cardBg: 'bg-white border-rose-100' };
            case 'minimalist':
                return { fontTitle: "font-['Montserrat',sans-serif]", fontBody: "font-['Montserrat',sans-serif]", fontScript: "font-['Montserrat',sans-serif]", bg: 'bg-white', textMain: 'text-gray-900', textAccent: 'text-gray-900', container: '', ornament: 'text-gray-100', divider: 'bg-gray-900', heroBg: 'from-black/60 via-black/20', cardBg: 'bg-gray-50 border-gray-200' };
            case 'garden':
                return { fontTitle: "font-['Playfair_Display',serif]", fontBody: "font-['Inter',sans-serif]", fontScript: "font-['Great_Vibes',cursive]", bg: 'bg-emerald-50', textMain: 'text-emerald-900', textAccent: 'text-emerald-600', container: '', ornament: 'text-emerald-200', divider: 'bg-emerald-300', heroBg: 'from-emerald-900/70 via-emerald-800/30', cardBg: 'bg-white border-emerald-100' };
            default: // modern
                return { fontTitle: "font-['Montserrat',sans-serif]", fontBody: "font-['Inter',sans-serif]", fontScript: "font-['Great_Vibes',cursive]", bg: 'bg-white', textMain: 'text-slate-800', textAccent: 'text-rose-500', container: '', ornament: 'text-slate-200', divider: 'bg-slate-200', heroBg: 'from-white/90 via-white/40', cardBg: 'bg-white border-gray-100' };
        }
    };

    const s = getTemplateStyles();

    // Minimalist renders differently
    const isMinimalist = templateId === 'minimalist';

    return (
        <div className={`w-full min-h-[800px] ${s.bg} ${s.textMain} ${s.container} relative flex flex-col shadow-2xl overflow-hidden`}>
            {petalEffect && petalEffect !== 'none' && <FloatingEffect type={petalEffect} />}
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;400;600&display=swap');
      `}</style>

            {/* --- HERO --- */}
            <section className={`relative ${isMinimalist ? 'h-[440px]' : 'h-[420px]'} flex flex-col items-center justify-center p-6 text-center overflow-hidden`}>
                {couplePhoto ? (
                    <div className="absolute inset-0 z-0">
                        <img src={couplePhoto} alt="Couple" className={`w-full h-full object-cover ${isMinimalist ? 'grayscale' : ''}`} />
                        <div className={`absolute inset-0 bg-gradient-to-t ${s.heroBg} to-transparent`}></div>
                    </div>
                ) : (
                    <div className={`absolute inset-0 z-0 flex items-center justify-center opacity-5`}>
                        <Heart className="w-64 h-64" />
                    </div>
                )}

                <div className="relative z-10 w-full px-4">
                    {isMinimalist ? (
                        <>
                            <p className="text-[9px] uppercase tracking-[0.5em] mb-6 opacity-50">Wedding Invitation</p>
                            <h1 className={`${s.fontTitle} text-2xl font-extralight tracking-[0.15em] mb-3 break-words`} style={{ color: couplePhoto ? 'white' : 'inherit' }}>{groomName || 'Groom'}</h1>
                            <div className="w-8 h-px bg-current mx-auto my-3 opacity-30"></div>
                            <h1 className={`${s.fontTitle} text-2xl font-extralight tracking-[0.15em] mb-5 break-words`} style={{ color: couplePhoto ? 'white' : 'inherit' }}>{brideName || 'Bride'}</h1>
                            <p className="text-[10px] tracking-[0.35em] uppercase opacity-50" style={{ color: couplePhoto ? 'white' : 'inherit' }}>
                                {isValidDate ? `${String(day).padStart(2,'0')}.${String(month).padStart(2,'0')}.${year}` : '-- . -- . ----'}
                            </p>
                        </>
                    ) : (
                        <>
                            <p className={`uppercase tracking-[0.3em] text-[10px] mb-3 opacity-80 ${s.fontBody}`}>Trân trọng báo tin vui</p>
                            <div className={`flex flex-col items-center gap-1 ${templateId === 'luxury' ? 'text-yellow-100' : ''}`}>
                                <h1 className={`${s.fontScript} text-4xl leading-tight ${s.textAccent} break-words max-w-full text-center`}>{groomName || 'Chú Rể'}</h1>
                                <span className={`${s.fontScript} text-xl opacity-60 my-0.5`}>&</span>
                                <h1 className={`${s.fontScript} text-4xl leading-tight ${s.textAccent} break-words max-w-full text-center`}>{brideName || 'Cô Dâu'}</h1>
                            </div>
                            <div className={`w-16 h-px mx-auto my-4 ${s.divider}`}></div>
                            <div className={`${s.fontTitle} text-base tracking-widest uppercase font-bold flex items-center gap-2 justify-center`}>
                                {isValidDate ? (
                                    <><span>{day}</span><span className="text-[9px] opacity-60">Tháng</span><span>{month}</span><span className="text-[9px] opacity-60">Năm</span><span>{year}</span></>
                                ) : (
                                    <span className="opacity-40 text-sm">Ngày cưới</span>
                                )}
                            </div>
                            {(location || address) && (
                                <div className="mt-3 flex flex-col items-center">
                                    <p className={`${s.fontBody} text-[10px] font-bold uppercase tracking-wider opacity-80 text-center`}>{location}</p>
                                    {mapLink && (
                                        <a href={mapLink} target="_blank" rel="noopener noreferrer"
                                            className={`mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 uppercase tracking-wider ${templateId === 'luxury' ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black' : `border-current ${s.textAccent} hover:opacity-80`}`}>
                                            <MapPin className="w-3 h-3" /> Bản đồ
                                        </a>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* --- COUNTDOWN --- */}
            {countdownEnabled && date && <CountdownTimer date={date} time={time} fontTitle={s.fontTitle} textAccent={s.textAccent} divider={s.divider} />}

            {/* --- INVITATION TEXT --- */}
            {!isMinimalist && (
                <section className="py-10 px-6 text-center relative">
                    <Quote className={`w-8 h-8 mx-auto mb-4 opacity-20 ${s.textAccent}`} />
                    <h2 className={`${s.fontTitle} text-sm font-bold mb-4 uppercase tracking-wider`}>Lời Mời Trân Trọng</h2>
                    <div className={`p-5 rounded-xl border ${s.divider} bg-white/30 backdrop-blur-sm max-w-sm mx-auto`}>
                        <p className={`${s.fontScript} text-base leading-relaxed ${s.textAccent}`}>"{wishes || 'Rất hân hạnh được đón tiếp'}"</p>
                    </div>
                </section>
            )}
            {isMinimalist && (
                <section className="py-12 px-8 text-center">
                    <p className={`${s.fontTitle} text-xs uppercase tracking-[0.4em] mb-6 opacity-40`}>— Invitation —</p>
                    <p className="text-sm leading-loose opacity-70 max-w-xs mx-auto">{wishes || 'Trân trọng kính mời quý vị đến dự lễ thành hôn.'}</p>
                    <div className="w-8 h-px bg-current mx-auto mt-6 opacity-30"></div>
                </section>
            )}

            {/* --- EVENTS / TIMELINE --- */}
            <section className="py-8 px-4">
                {events && events.length > 0 ? (
                    <div className="max-w-md mx-auto space-y-4">
                        <h3 className={`${s.fontTitle} text-sm uppercase tracking-[0.3em] text-center mb-8 opacity-70`}>Chương Trình</h3>
                        {events.map(evt => (
                            <div key={evt.id} className={`rounded-xl overflow-hidden shadow-md ${s.cardBg} border p-4 flex gap-4 items-start`}>
                                <div className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[56px] border ${s.divider} ${isMinimalist ? 'bg-gray-100' : `${s.bg}`}`}>
                                    <span className={`text-sm font-bold ${s.textAccent} ${s.fontTitle} tabular-nums`}>{evt.time}</span>
                                    <Clock className={`w-3 h-3 opacity-40 mt-0.5`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-bold uppercase text-sm ${s.textAccent} ${s.fontTitle}`}>{evt.title}</h4>
                                    <p className={`text-xs opacity-60 mt-0.5 mb-1 ${s.fontBody}`}>{evt.date}{evt.lunarDate ? ` (${evt.lunarDate})` : ''}</p>
                                    <p className={`${s.fontBody} text-xs opacity-80 leading-tight`}>{evt.description || `Tại ${evt.location}`}</p>
                                    <AddToCalendar event={evt} groomName={groomName} brideName={brideName} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={`max-w-sm mx-auto rounded-2xl overflow-hidden shadow-xl ${s.cardBg} border`}>
                        <div className={`p-4 text-center border-b ${s.divider}`}>
                            <Calendar className={`w-8 h-8 mx-auto mb-2 ${s.textAccent}`} />
                            <p className={`${s.fontBody} uppercase text-xs font-bold tracking-widest`}>{dayName}</p>
                        </div>
                        <div className="p-8 text-center space-y-6">
                            <div>
                                <p className="text-xs opacity-60 uppercase tracking-wide mb-1">Đón khách</p>
                                <p className={`${s.fontTitle} text-lg font-bold`}>{time}</p>
                                {lunarDate && <p className="text-xs opacity-60 mt-1">({lunarDate})</p>}
                            </div>
                            <div className={`w-full h-px ${s.divider} opacity-30`}></div>
                            <div>
                                <p className="text-xs opacity-60 uppercase tracking-wide mb-1">Địa điểm</p>
                                <p className="font-bold text-sm mb-1">{location}</p>
                                <p className="text-xs opacity-80 mb-4">{address}</p>
                                {mapLink && (
                                    <a href={mapLink} target="_blank" rel="noopener noreferrer"
                                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${s.textAccent}`}
                                        style={{ borderColor: 'currentColor' }}>
                                        <MapPin className="w-3 h-3" /> Chỉ đường đến đây
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* --- LOVE STORY TIMELINE --- */}
            {loveStory && loveStory.length > 0 && (
                <LoveStorySection events={loveStory} fontTitle={s.fontTitle} fontScript={s.fontScript} fontBody={s.fontBody} textAccent={s.textAccent} divider={s.divider} bg={s.bg} />
            )}

            {/* --- GALLERY --- */}
            {galleryImages && galleryImages.length > 0 && (
                <section className="py-8 px-2">
                    <h3 className={`${s.fontScript} ${isMinimalist ? `${s.fontTitle} text-base font-light uppercase tracking-widest` : 'text-2xl'} text-center mb-6 ${s.textAccent}`}>
                        {isMinimalist ? 'Gallery' : 'Khoảnh Khắc'}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {galleryImages.map((img, i) => (
                            <div key={i} className={`rounded-lg overflow-hidden shadow-sm aspect-square ${i === 0 ? 'col-span-2 aspect-[2/1]' : ''}`}>
                                <img src={img} className={`w-full h-full object-cover ${isMinimalist ? 'grayscale hover:grayscale-0 transition-all duration-500' : ''}`} alt="" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* --- PARENTS --- */}
            {(groomParents || brideParents) && (
                <section className="py-10 px-8">
                    <div className={`grid grid-cols-2 gap-6 text-center text-sm max-w-sm mx-auto border-t ${s.divider} pt-8`}>
                        <div>
                            <strong className={`block text-xs uppercase tracking-wider ${s.textAccent} mb-2`}>Nhà Trai</strong>
                            <p className="opacity-80">Ông: {groomParents?.father || '...'}</p>
                            <p className="opacity-80">Bà: {groomParents?.mother || '...'}</p>
                        </div>
                        <div>
                            <strong className={`block text-xs uppercase tracking-wider ${s.textAccent} mb-2`}>Nhà Gái</strong>
                            <p className="opacity-80">Ông: {brideParents?.father || '...'}</p>
                            <p className="opacity-80">Bà: {brideParents?.mother || '...'}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* --- GIFT / QR --- */}
            {vietQrUrl && (
                <section className="py-10 px-6 text-center">
                    <div className={`inline-block p-6 rounded-3xl ${s.cardBg} border shadow-2xl relative`}>
                        <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-lg ring-4 ring-white/50`}>
                            <Heart className={`w-6 h-6 ${s.textAccent} fill-current`} />
                        </div>
                        <h3 className={`${s.fontTitle} text-base font-bold mb-4 mt-2 uppercase tracking-wide`}>Gửi Lời Chúc</h3>
                        <div className="bg-white p-2 rounded-xl inline-block mb-4">
                            <img src={vietQrUrl} alt="QR" className="w-40 h-40 object-contain mix-blend-multiply" />
                        </div>
                        <div className="space-y-1 text-sm">
                            <p className="opacity-60 text-xs uppercase">Ngân hàng</p>
                            <p className="font-bold">{bankInfo.bankId}</p>
                            <p className="font-mono text-lg tracking-wider font-bold my-1">{bankInfo.accountNumber}</p>
                            <p className={`text-xs font-bold uppercase ${s.textAccent}`}>{bankInfo.accountName}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* --- RSVP --- */}
            {rsvpEnabled && <RSVPSection deadline={rsvpDeadline} fontTitle={s.fontTitle} fontScript={s.fontScript} textAccent={s.textAccent} divider={s.divider} bg={s.bg} onRSVP={onRSVP} />}

            {/* --- GUESTBOOK --- */}
            {guestbookEnabled && <GuestbookSection wishes={guestWishes || []} fontTitle={s.fontTitle} fontScript={s.fontScript} textAccent={s.textAccent} divider={s.divider} onGuestbook={onGuestbook} />}

            {/* --- FOOTER --- */}
            <footer className="py-8 bg-black text-white text-center border-t border-gray-800">
                <div className="opacity-80 mb-2">
                    <span className={`${s.fontScript} text-2xl`}>{groomName}</span>
                    <span className="mx-2 text-rose-500">&hearts;</span>
                    <span className={`${s.fontScript} text-2xl`}>{brideName}</span>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-4">Thank you for coming</p>
                <div className="mt-4 pt-4 border-t border-gray-800 inline-block px-8">
                    <p className="text-[10px] text-gray-400 mb-1">Thiệp cưới được tạo bởi</p>
                    <a href="https://wedplanai.io.vn" target="_blank" rel="noopener noreferrer" className="font-bold text-sm tracking-wider flex items-center justify-center gap-1.5 hover:text-rose-400 transition-colors">
                        <Sparkles className="w-3 h-3 text-rose-500" />
                        WEDPLAN AI <span className="font-normal opacity-50 text-[10px]">(wedplanai.io.vn)</span>
                    </a>
                </div>
            </footer>
        </div>
    );
};

export default InvitationPreview;
