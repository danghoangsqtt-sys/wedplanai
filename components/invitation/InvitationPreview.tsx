
import React, { useMemo } from 'react';
import { InvitationData } from '../../types';
import { MapPin, Calendar, Clock, Heart, Music, Navigation, Quote, Camera, Flower2, Sparkles, ScrollText, CheckCircle2 } from 'lucide-react';

interface InvitationPreviewProps {
    data: InvitationData;
}

const InvitationPreview: React.FC<InvitationPreviewProps> = ({ data }) => {
    const {
        templateId, groomName, brideName, groomParents, brideParents, date, lunarDate, time,
        location, address, mapLink, wishes, themeColor,
        bankInfo, couplePhoto, galleryImages, events
    } = data;

    const vietQrUrl = useMemo(() => {
        if (!bankInfo.bankId || !bankInfo.accountNumber) return '';
        const template = bankInfo.qrTemplate || 'compact2';
        // Remove addInfo to make QR cleaner, user can add message when transferring
        return `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNumber}-${template}.png`;
    }, [bankInfo]);

    const weddingDate = new Date(date);
    const day = weddingDate.getDate();
    const month = weddingDate.getMonth() + 1;
    const year = weddingDate.getFullYear();
    const dayName = weddingDate.toLocaleDateString('vi-VN', { weekday: 'long' });

    // --- TRADITIONAL TEMPLATE RENDERER ---
    if (templateId === 'traditional') {
        return (
            <div className="w-full min-h-[800px] bg-[#FFF6E5] text-[#9B1C1C] flex flex-col items-center py-12 px-6 relative font-serif">
                <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Merriweather:wght@400;700&family=Great+Vibes&display=swap');
          .traditional-card {
            border: 4px double #C9A24D;
            padding: 30px 20px;
            width: 100%;
            max-width: 450px;
            background: #FFFBF0;
            box-shadow: 0 10px 30px rgba(155, 28, 28, 0.1);
            position: relative;
            text-align: center;
          }
          .corner-tl, .corner-tr, .corner-bl, .corner-br {
            position: absolute;
            width: 40px;
            height: 40px;
            border-color: #9B1C1C;
            border-style: solid;
          }
          .corner-tl { top: 10px; left: 10px; border-width: 2px 0 0 2px; }
          .corner-tr { top: 10px; right: 10px; border-width: 2px 2px 0 0; }
          .corner-bl { bottom: 10px; left: 10px; border-width: 0 0 2px 2px; }
          .corner-br { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; }
        `}</style>

                <div className="traditional-card font-merriweather">
                    <div className="corner-tl"></div><div className="corner-tr"></div>
                    <div className="corner-bl"></div><div className="corner-br"></div>

                    <h1 className="text-3xl font-bold uppercase tracking-widest mb-6 text-[#9B1C1C] font-serif-display pb-2 inline-block">
                        Lễ Thành Hôn
                    </h1>

                    <div className="flex flex-col items-center justify-center mb-4">
                        <span className="font-handwriting text-5xl text-[#9B1C1C] mb-2">{groomName || 'Chú Rể'}</span>
                        <span className="text-[#C9A24D] text-2xl">❤</span>
                        <span className="font-handwriting text-5xl text-[#9B1C1C] mt-2">{brideName || 'Cô Dâu'}</span>
                    </div>

                    <p className="text-lg font-serif italic mb-8 text-[#5C4033]">
                        {groomName && brideName ? `${groomName} & ${brideName}` : 'Sánh duyên cùng'}
                    </p>

                    {/* DYNAMIC EVENT RENDERING FOR TRADITIONAL STYLE */}
                    {events && events.length > 0 ? (
                        <div className="space-y-8 mb-8 text-[#5C4033]">
                            <div className="w-24 h-0.5 bg-[#C9A24D]/40 mx-auto"></div>
                            {events.map((evt, idx) => (
                                <div key={evt.id} className="leading-relaxed px-4">
                                    <h3 className="text-[#9B1C1C] font-bold uppercase tracking-wider text-sm mb-2 font-serif-display">
                                        {evt.title}
                                    </h3>
                                    <p className="font-merriweather text-sm md:text-base italic opacity-95 text-justify md:text-center">
                                        {evt.description || `${evt.title} diễn ra vào hồi ${evt.time} tại ${evt.location}`}
                                    </p>
                                </div>
                            ))}
                            <div className="w-24 h-0.5 bg-[#C9A24D]/40 mx-auto"></div>
                        </div>
                    ) : (
                        <div className="text-base font-merriweather mb-8 leading-relaxed text-[#5C4033]">
                            Hôn lễ được cử hành vào hồi<br />
                            <strong className="text-xl text-[#9B1C1C] block my-2 font-bold uppercase">{time}, {dayName}</strong>
                            <span className="text-2xl font-bold block my-2 tracking-widest text-[#9B1C1C]">{day} · {month} · {year}</span>
                            {lunarDate && <span className="block text-sm opacity-80 italic font-serif">({lunarDate})</span>}
                        </div>
                    )}

                    {/* MAIN LOCATION & MAP BUTTON (Always Visible) */}
                    {(location || address) && (
                        <div className="mb-8">
                            <p className="text-base uppercase tracking-widest text-[#9B1C1C] mb-2 font-bold font-serif-display">Tại</p>
                            <p className="text-lg font-bold text-[#1F2937]">{location}</p>
                            <p className="text-sm opacity-80 mt-1 mb-3">{address}</p>

                            {mapLink && (
                                <a
                                    href={mapLink}
                                    target="_blank"
                                    className="inline-flex items-center gap-2 bg-[#9B1C1C] text-[#FFF6E5] px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#7B1212] transition-all shadow-sm border border-[#C9A24D]"
                                >
                                    <MapPin className="w-3 h-3" /> Bản đồ
                                </a>
                            )}
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

                    <p className="text-sm italic leading-relaxed px-4 opacity-90 font-serif">
                        Trân trọng kính mời Quý vị tới dự lễ thành hôn<br />
                        Sự hiện diện của Quý vị là niềm vinh hạnh cho gia đình chúng tôi
                    </p>

                    {/* QR Gift Section for Traditional */}
                    {vietQrUrl && (
                        <div className="mt-8 pt-6 border-t border-[#C9A24D]/30">
                            <div className="w-32 h-32 mx-auto bg-white p-2 border border-[#C9A24D] shadow-inner mb-2">
                                <img src={vietQrUrl} alt="QR" className="w-full h-full object-contain" />
                            </div>
                            <p className="text-xs font-bold uppercase text-[#C9A24D]">Mừng cưới / Gửi lời chúc</p>
                        </div>
                    )}
                </div>

                {/* Footer Branding */}
                <div className="mt-8 text-center opacity-60 text-xs font-serif italic">
                    <p className="flex items-center justify-center gap-1 font-bold">WEDPLAN AI — wedplanai.io.vn</p>
                </div>
            </div>
        );
    }

    // --- OTHER TEMPLATES ---
    const getTemplateStyles = () => {
        switch (templateId) {
            case 'luxury':
                return {
                    fontTitle: "font-['Cinzel',serif]",
                    fontBody: "font-['Inter',sans-serif]",
                    fontScript: "font-['Great_Vibes',cursive]",
                    bg: 'bg-stone-900',
                    textMain: 'text-stone-200',
                    textAccent: 'text-yellow-500',
                    container: 'border-x-8 border-stone-800',
                    ornament: 'opacity-20',
                    divider: 'bg-yellow-500/50'
                };
            case 'floral':
                return {
                    fontTitle: "font-['Playfair_Display',serif]",
                    fontBody: "font-['Inter',sans-serif]",
                    fontScript: "font-['Great_Vibes',cursive]",
                    bg: 'bg-pink-50',
                    textMain: 'text-gray-700',
                    textAccent: 'text-pink-500',
                    container: '',
                    ornament: 'text-pink-300',
                    divider: 'bg-pink-200'
                };
            default: // Modern
                return {
                    fontTitle: "font-['Montserrat',sans-serif]",
                    fontBody: "font-['Inter',sans-serif]",
                    fontScript: "font-['Great_Vibes',cursive]",
                    bg: 'bg-white',
                    textMain: 'text-slate-800',
                    textAccent: 'text-rose-500',
                    container: '',
                    ornament: 'text-slate-200',
                    divider: 'bg-slate-200'
                };
        }
    };

    const s = getTemplateStyles();

    return (
        <div className={`w-full min-h-[800px] ${s.bg} ${s.textMain} ${s.container} relative flex flex-col shadow-2xl overflow-hidden`}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Montserrat:wght@300;400;600&display=swap');
        .font-great-vibes { font-family: 'Great Vibes', cursive; }
      `}</style>

            {/* --- HERO SECTION --- */}
            <section className="relative h-[80vh] flex flex-col items-center justify-center p-6 text-center">
                {/* Background Image */}
                {couplePhoto ? (
                    <div className="absolute inset-0 z-0">
                        <img src={couplePhoto} alt="Couple" className="w-full h-full object-cover" />
                        <div className={`absolute inset-0 bg-gradient-to-t ${templateId === 'luxury' ? 'from-stone-900 via-stone-900/60' : 'from-white/90 via-white/40'} to-transparent`}></div>
                    </div>
                ) : (
                    <div className={`absolute inset-0 z-0 flex items-center justify-center opacity-10 ${s.textAccent}`}>
                        <Heart className="w-64 h-64 animate-pulse" />
                    </div>
                )}

                {/* Content */}
                <div className="relative z-10 animate-fade-in-up">
                    <p className={`uppercase tracking-[0.3em] text-xs md:text-sm mb-4 opacity-90 ${s.fontBody}`}>Trân trọng báo tin vui</p>

                    <div className={`flex flex-col items-center gap-2 ${templateId === 'luxury' ? 'text-yellow-100' : 'text-gray-900'}`}>
                        <h1 className={`${s.fontScript} text-5xl md:text-7xl leading-tight ${s.textAccent}`}>
                            {groomName || 'Chú Rể'}
                        </h1>
                        <span className={`${s.fontScript} text-2xl opacity-80`}>&</span>
                        <h1 className={`${s.fontScript} text-5xl md:text-7xl leading-tight ${s.textAccent}`}>
                            {brideName || 'Cô Dâu'}
                        </h1>
                    </div>

                    <div className={`w-24 h-0.5 mx-auto my-6 ${s.divider}`}></div>

                    <div className={`${s.fontTitle} text-xl md:text-3xl tracking-wide uppercase font-bold flex items-center gap-3 justify-center`}>
                        <span>{day}</span>
                        <span className="text-xs align-top opacity-70">Tháng</span>
                        <span>{month}</span>
                        <span className="text-xs align-top opacity-70">Năm</span>
                        <span>{year}</span>
                    </div>

                    <div className="mt-4 flex flex-col items-center">
                        <p className={`${s.fontBody} text-xs md:text-sm font-bold uppercase tracking-widest`}>
                            {location || 'Tên nhà hàng / Tư gia'}
                        </p>
                        <p className={`${s.fontBody} text-[10px] md:text-xs mt-1 opacity-80 max-w-xs mx-auto`}>
                            {address}
                        </p>

                        {/* HERO NAVIGATION BUTTON */}
                        {mapLink && (
                            <a
                                href={mapLink}
                                target="_blank"
                                className={`mt-3 inline-flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 uppercase tracking-wider ${templateId === 'luxury' ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black' : 'border-rose-500 text-rose-500 hover:bg-rose-50'}`}
                            >
                                <MapPin className="w-3 h-3" /> Bản đồ
                            </a>
                        )}
                    </div>
                </div>
            </section>

            {/* --- INVITATION TEXT --- */}
            <section className="py-16 px-8 text-center relative">
                <Quote className={`w-12 h-12 mx-auto mb-6 opacity-20 ${s.textAccent}`} />
                <h2 className={`${s.fontTitle} text-2xl font-bold mb-6 uppercase tracking-wider`}>Lời Mời Trân Trọng</h2>
                <p className={`${s.fontBody} text-sm md:text-base leading-loose opacity-80 max-w-lg mx-auto mb-8`}>
                    "Yêu nhau chẳng quản lầm than, mấy núi cũng trèo, mấy sông cũng lội, mấy đèo cũng qua."<br /><br />
                    Hân hạnh kính mời quý khách đến dự buổi tiệc chung vui cùng gia đình chúng tôi.
                    Sự hiện diện của quý vị là lời chúc phúc quý giá nhất cho tình yêu của chúng tôi.
                </p>

                <div className={`p-6 rounded-xl border ${s.divider} bg-opacity-10 bg-white/50 backdrop-blur-sm max-w-md mx-auto`}>
                    <p className={`${s.fontScript} text-xl md:text-2xl ${s.textAccent}`}>
                        "{wishes || 'Rất hân hạnh được đón tiếp'}"
                    </p>
                </div>
            </section>

            {/* --- TIMELINE BOX (MODERN/LUXURY/FLORAL) --- */}
            <section className="py-12 px-4">
                {events && events.length > 0 ? (
                    <div className="max-w-md mx-auto space-y-4">
                        <h3 className={`${s.fontTitle} text-xl text-center font-bold mb-6 uppercase tracking-wide`}>Chương trình lễ</h3>
                        {events.map((evt) => (
                            <div key={evt.id} className={`rounded-xl overflow-hidden shadow-md ${templateId === 'luxury' ? 'bg-stone-800 border border-stone-700' : 'bg-white border border-gray-100'} p-4 flex gap-4 items-start`}>
                                <div className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] ${s.bg} ${s.textAccent} border ${s.divider}`}>
                                    <span className="text-lg font-bold">{evt.time}</span>
                                    <Clock className="w-3 h-3 opacity-60" />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold uppercase text-sm ${s.textAccent}`}>{evt.title}</h4>
                                    <p className={`text-xs opacity-70 mt-1 mb-2 ${s.fontBody} italic`}>{evt.date} {evt.lunarDate ? `(${evt.lunarDate})` : ''}</p>
                                    <p className={`${s.fontBody} text-xs opacity-90 leading-tight`}>{evt.description || `Tại ${evt.location}`}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={`max-w-sm mx-auto rounded-2xl overflow-hidden shadow-xl ${templateId === 'luxury' ? 'bg-stone-800 border border-stone-700' : 'bg-white border border-gray-100'}`}>
                        <div className={`p-4 text-center ${s.bg} ${s.textAccent} border-b ${s.divider}`}>
                            <Calendar className="w-8 h-8 mx-auto mb-2" />
                            <p className={`${s.fontBody} uppercase text-xs font-bold tracking-widest`}>{dayName}</p>
                        </div>
                        <div className="p-8 text-center space-y-6">
                            <div>
                                <p className="text-xs opacity-60 uppercase tracking-wide mb-1">Đón khách</p>
                                <p className={`${s.fontTitle} text-2xl font-bold`}>{time}</p>
                                {lunarDate && <p className="text-xs opacity-60 mt-1">({lunarDate})</p>}
                            </div>
                            <div className={`w-full h-px ${s.divider} opacity-30`}></div>
                            <div>
                                <p className="text-xs opacity-60 uppercase tracking-wide mb-1">Địa điểm</p>
                                <p className="font-bold text-sm mb-1">{location}</p>
                                <p className="text-xs opacity-80 mb-4">{address}</p>
                                {mapLink && (
                                    <a
                                        href={mapLink}
                                        target="_blank"
                                        className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${templateId === 'luxury' ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black' : 'border-rose-500 text-rose-500 hover:bg-rose-50'}`}
                                    >
                                        <MapPin className="w-3 h-3" /> Chỉ đường đến đây
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* --- GALLERY (Grid) --- */}
            {galleryImages && galleryImages.length > 0 && (
                <section className="py-12 px-2">
                    <h3 className={`${s.fontScript} text-4xl text-center mb-8 ${s.textAccent}`}>Khoảnh Khắc</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {galleryImages.map((img, i) => (
                            <div key={i} className={`rounded-lg overflow-hidden shadow-sm aspect-square ${i === 0 ? 'col-span-2 aspect-[2/1]' : ''}`}>
                                <img src={img} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* --- GIFT BOX --- */}
            {vietQrUrl && (
                <section className="py-16 px-6 text-center">
                    <div className={`inline-block p-8 rounded-3xl ${templateId === 'luxury' ? 'bg-stone-800' : 'bg-white'} shadow-2xl relative`}>
                        <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center ${s.bg} shadow-lg ring-4 ring-opacity-50 ring-white`}>
                            <Heart className={`w-6 h-6 ${s.textAccent} fill-current`} />
                        </div>
                        <h3 className={`${s.fontTitle} text-lg font-bold mb-4 mt-2 uppercase tracking-wide`}>Gửi Lời Chúc</h3>

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

            {/* --- BRANDING FOOTER (ADS) --- */}
            <footer className="py-8 bg-black text-white text-center border-t border-gray-800">
                <div className="opacity-80 mb-2">
                    <span className={`${s.fontScript} text-2xl`}>{groomName}</span>
                    <span className="mx-2 text-rose-500">&hearts;</span>
                    <span className={`${s.fontScript} text-2xl`}>{brideName}</span>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-4">Thank you for coming</p>

                {/* WEDPLAN AI BRANDING */}
                <div className="mt-6 pt-4 border-t border-gray-800 inline-block px-8">
                    <p className="text-[10px] text-gray-400 mb-1">Thiệp cưới được tạo bởi</p>
                    <a href="https://wedplanai.io.vn" target="_blank" className="font-bold text-sm tracking-wider flex items-center justify-center gap-1.5 hover:text-rose-400 transition-colors">
                        <Sparkles className="w-3 h-3 text-rose-500" />
                        WEDPLAN AI <span className="font-normal opacity-50 text-[10px]">(wedplanai.io.vn)</span>
                    </a>
                </div>
            </footer>
        </div>
    );
};

export default InvitationPreview;
