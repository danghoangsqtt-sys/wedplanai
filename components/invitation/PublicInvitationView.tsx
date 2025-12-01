
import React, { useEffect, useState, useRef } from 'react';
import { loadPublicInvitation } from '../../services/cloudService';
import { InvitationData } from '../../types';
import {
    MapPin, Clock, Heart, Check,
    Navigation, Gift, Copy, ChevronDown
} from 'lucide-react';

interface Props {
    uid: string;
}

// --- ANIMATION COMPONENTS ---

const FallingHearts = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className="absolute animate-heart-fall"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: '-10%',
                        width: `${Math.random() * 20 + 10}px`,
                        height: `${Math.random() * 20 + 10}px`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${Math.random() * 5 + 8}s`,
                        opacity: 0.6
                    }}
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="text-rose-300/60 w-full h-full transform">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </div>
            ))}
            <style>{`
                @keyframes heart-fall {
                    0% { transform: translateY(0) rotate(0deg) translateX(0); opacity: 0; }
                    10% { opacity: 0.8; }
                    100% { transform: translateY(110vh) rotate(360deg) translateX(50px); opacity: 0; }
                }
                .animate-heart-fall {
                    animation-name: heart-fall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </div>
    );
};

const ScrollReveal = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const FloralCorner = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
    const classes = {
        tl: 'top-0 left-0 -translate-x-1/4 -translate-y-1/4 rotate-0',
        tr: 'top-0 right-0 translate-x-1/4 -translate-y-1/4 rotate-90',
        bl: 'bottom-0 left-0 -translate-x-1/4 translate-y-1/4 -rotate-90',
        br: 'bottom-0 right-0 translate-x-1/4 translate-y-1/4 rotate-180'
    };

    return (
        <div className={`absolute w-40 h-40 md:w-56 md:h-56 pointer-events-none z-10 opacity-80 mix-blend-multiply ${classes[position]}`}>
            <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-rose-200">
                <path d="M20 20C50 20 80 40 100 80C120 40 150 20 180 20" stroke="currentColor" strokeWidth="2" className="text-rose-300" />
                <path d="M20 20C20 50 40 80 80 100C40 120 20 150 20 180" stroke="currentColor" strokeWidth="2" className="text-rose-300" />
                <circle cx="20" cy="20" r="8" fill="currentColor" className="text-rose-300" />
                <path d="M100 80C110 110 140 130 180 130" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" className="text-rose-200" />
                <path d="M80 100C110 110 130 140 130 180" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" className="text-rose-200" />
                {/* Leaves */}
                <path d="M40 40 Q 60 20 70 50 Q 50 70 40 40" fill="currentColor" className="text-rose-100" />
                <path d="M40 40 Q 20 60 50 70 Q 70 50 40 40" fill="currentColor" className="text-rose-100" />
            </svg>
        </div>
    );
};

const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const target = new Date(targetDate).getTime();
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = target - now;

            if (distance < 0) {
                clearInterval(interval);
            } else {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    return (
        <div className="flex justify-center gap-3 md:gap-4 text-center">
            {[
                { label: 'Ngày', value: timeLeft.days },
                { label: 'Giờ', value: timeLeft.hours },
                { label: 'Phút', value: timeLeft.minutes },
                { label: 'Giây', value: timeLeft.seconds }
            ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-rose-100 flex items-center justify-center mb-2 transform hover:scale-105 transition-transform">
                        <span className="text-xl md:text-2xl font-bold text-rose-600 font-be-vietnam">{String(item.value).padStart(2, '0')}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-500 font-be-vietnam font-bold">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

const PublicInvitationView: React.FC<Props> = ({ uid }) => {
    const [invitation, setInvitation] = useState<InvitationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchInv = async () => {
            if (!uid) return;
            try {
                const data = await loadPublicInvitation(uid);
                setInvitation(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInv();
    }, [uid]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#FDF2F8]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mb-4"></div>
                <div className="text-rose-400 font-handwriting text-2xl animate-pulse">Loading Love...</div>
            </div>
        );
    }

    if (!invitation || !invitation.groomName) {
        return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-be-vietnam">Thiệp mời chưa được tạo hoặc không tồn tại.</div>;
    }

    const bankQrUrl = invitation.bankInfo.bankId
        ? `https://img.vietqr.io/image/${invitation.bankInfo.bankId}-${invitation.bankInfo.accountNumber}-compact.png?accountName=${encodeURIComponent(invitation.bankInfo.accountName)}`
        : null;

    const handleCopyBank = () => {
        navigator.clipboard.writeText(invitation.bankInfo.accountNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#FFFBF7] font-sans pb-0 relative overflow-x-hidden flex justify-center">
            {/* Background Texture */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23e11d48\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}></div>

            <FallingHearts />

            {/* MAIN CARD CONTAINER */}
            <div className="w-full max-w-[480px] bg-white relative z-10 shadow-2xl min-h-screen flex flex-col md:my-8 md:rounded-[2rem] overflow-hidden md:border-[8px] md:border-white ring-1 ring-black/5">

                {/* 1. HERO SECTION (FULL SCREEN) */}
                <div className="relative h-[80vh] md:h-[700px] overflow-hidden flex flex-col">
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                        {invitation.couplePhoto ? (
                            <img
                                src={invitation.couplePhoto}
                                className="w-full h-full object-cover"
                                style={{
                                    transform: `scale(${invitation.photoConfig?.scale || 1}) translate(${invitation.photoConfig?.x || 0}%, ${invitation.photoConfig?.y || 0}%)`
                                }}
                                alt="Couple"
                            />
                        ) : (
                            <div className="w-full h-full bg-rose-50 flex items-center justify-center">
                                <Heart className="w-20 h-20 text-white animate-pulse" />
                            </div>
                        )}
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    </div>

                    {/* Content Overlay */}
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-between py-12 px-6 text-center">
                        <div className="animate-fadeDown bg-white/20 backdrop-blur-md px-4 py-1 rounded-full border border-white/20">
                            <p className="text-white font-be-vietnam text-xs font-bold uppercase tracking-[0.2em]">Save The Date</p>
                        </div>

                        <div className="space-y-4 animate-scaleUp">
                            <h1 className="text-5xl md:text-6xl font-handwriting text-white drop-shadow-lg leading-tight">
                                {invitation.groomName} <br />
                                <span className="text-3xl font-serif text-rose-200 block my-2">&</span>
                                {invitation.brideName}
                            </h1>
                            <div className="inline-block border-t border-b border-white/60 py-2 px-8 mt-4 backdrop-blur-sm">
                                <p className="text-white font-be-vietnam text-sm md:text-base tracking-[0.2em] font-bold uppercase">
                                    {invitation.date ? new Date(invitation.date).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' }) : 'Coming Soon'}
                                </p>
                            </div>
                        </div>

                        <div className="animate-bounce">
                            <ChevronDown className="w-8 h-8 text-white/80" />
                        </div>
                    </div>
                </div>

                {/* 2. INTRO & MESSAGE */}
                <div className="bg-white px-6 py-16 text-center relative overflow-hidden">
                    <FloralCorner position="tl" />
                    <FloralCorner position="tr" />

                    <ScrollReveal>
                        <div className="mb-8 relative z-20">
                            <span className="text-rose-500 font-handwriting text-4xl block mb-2">Lời Ngỏ</span>
                            <h2 className="text-xl font-be-vietnam font-bold text-gray-800 uppercase tracking-wide">Trân trọng kính mời</h2>
                        </div>

                        <div className="relative z-20">
                            <p className="text-gray-600 font-be-vietnam leading-loose text-sm md:text-base max-w-sm mx-auto px-4 italic">
                                "{invitation.wishes}"
                            </p>
                        </div>

                        <div className="mt-10 flex justify-center items-center gap-4 text-rose-300 relative z-20">
                            <div className="h-px w-16 bg-rose-200"></div>
                            <Heart className="w-5 h-5 fill-current animate-pulse" />
                            <div className="h-px w-16 bg-rose-200"></div>
                        </div>
                    </ScrollReveal>
                </div>

                {/* 3. COUNTDOWN & TIMELINE */}
                <div className="bg-[#FAF7F2] px-6 py-16 border-y border-stone-100 relative">
                    <ScrollReveal>
                        <div className="text-center mb-10">
                            <h3 className="font-be-vietnam text-xl font-bold text-gray-800 uppercase mb-2 tracking-wide">Cùng đếm ngược</h3>
                            <p className="text-gray-500 font-handwriting text-2xl text-rose-500">Hạnh phúc sắp bắt đầu</p>
                        </div>

                        {invitation.date && <CountdownTimer targetDate={`${invitation.date}T${invitation.time || '00:00'}`} />}
                    </ScrollReveal>

                    <div className="mt-16 space-y-6 relative z-10">
                        <ScrollReveal delay={200}>
                            <div className="bg-white p-6 rounded-2xl shadow-lg shadow-rose-100/50 border border-white relative overflow-hidden group hover:shadow-xl transition-shadow">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-400"></div>
                                <div className="flex items-start gap-5">
                                    <div className="bg-rose-50 p-3 rounded-full text-rose-500 shrink-0 border border-rose-100">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-be-vietnam font-bold text-lg text-gray-800 uppercase tracking-wide">Hôn Lễ</h4>
                                        <p className="text-rose-500 font-bold text-2xl mt-1 font-be-vietnam">{invitation.time}</p>
                                        <p className="text-gray-500 text-sm mt-1 font-be-vietnam font-medium uppercase">
                                            {invitation.date ? new Date(invitation.date).toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={400}>
                            <div className="bg-white p-6 rounded-2xl shadow-lg shadow-blue-100/50 border border-white relative overflow-hidden group hover:shadow-xl transition-shadow">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-400"></div>
                                <div className="flex items-start gap-5">
                                    <div className="bg-blue-50 p-3 rounded-full text-blue-500 shrink-0 border border-blue-100">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-be-vietnam font-bold text-lg text-gray-800 uppercase tracking-wide">Địa Điểm</h4>
                                        <p className="text-gray-800 font-bold text-base mt-2 font-be-vietnam">{invitation.location}</p>
                                        <p className="text-gray-600 text-sm mt-1 font-be-vietnam leading-relaxed">{invitation.address}</p>

                                        {invitation.mapLink && (
                                            <a
                                                href={invitation.mapLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-700 transition-colors shadow-lg shadow-gray-300/50"
                                            >
                                                <Navigation className="w-3 h-3" /> Chỉ đường
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                </div>

                {/* 4. BANKING / GIFT */}
                {bankQrUrl && (
                    <div className="bg-white px-6 py-16 relative overflow-hidden">
                        <FloralCorner position="bl" />
                        <FloralCorner position="br" />

                        <ScrollReveal>
                            <div className="text-center mb-10 relative z-20">
                                <div className="w-16 h-16 mx-auto bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-4 border border-rose-100 shadow-sm">
                                    <Gift className="w-8 h-8 animate-bounce" />
                                </div>
                                <h3 className="font-be-vietnam text-xl font-bold text-gray-800 uppercase tracking-wide">Hộp Mừng Cưới</h3>
                                <p className="text-gray-500 text-sm mt-2 font-be-vietnam">Gửi gắm tình cảm đến cô dâu chú rể</p>
                            </div>

                            <div className="relative max-w-sm mx-auto perspective-1000 z-20">
                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-2xl border border-slate-700 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-be-vietnam">Ngân hàng</p>
                                            <p className="font-bold text-xl tracking-wide font-be-vietnam">{invitation.bankInfo.bankId}</p>
                                        </div>
                                        <div className="bg-white p-1.5 rounded-lg shadow-lg">
                                            <img src={bankQrUrl} className="w-20 h-20 rounded object-contain" alt="QR" />
                                        </div>
                                    </div>

                                    <div className="space-y-6 font-be-vietnam">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Số tài khoản</p>
                                            <div className="flex items-center gap-3">
                                                <p className="font-mono text-2xl tracking-widest text-emerald-400 font-bold">{invitation.bankInfo.accountNumber}</p>
                                                <button onClick={handleCopyBank} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white active:scale-95" title="Copy">
                                                    {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-white/10">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">Chủ tài khoản</p>
                                            <p className="font-bold uppercase tracking-wider text-base">{invitation.bankInfo.accountName}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>
                )}

                {/* 5. FOOTER */}
                <div className="bg-[#FAF7F2] py-10 text-center border-t border-stone-200 mt-auto relative z-20">
                    <div className="flex items-center justify-center gap-2 mb-3 font-handwriting text-3xl text-rose-500">
                        <span>Thank You</span>
                        <Heart className="w-5 h-5 fill-current animate-pulse" />
                    </div>
                    <p className="text-xs text-gray-400 font-be-vietnam uppercase tracking-widest">
                        Created with love by <span className="font-bold text-gray-600">WedPlan AI</span>
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes fadeDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fadeDown { animation: fadeDown 1s ease-out forwards; }
                .animate-scaleUp { animation: scaleUp 1s ease-out 0.3s forwards; opacity: 0; }
                
                /* Font Overrides */
                .font-handwriting { font-family: 'Great Vibes', cursive; }
                .font-be-vietnam { font-family: 'Be Vietnam Pro', sans-serif; }
            `}</style>
        </div>
    );
};

export default PublicInvitationView;
