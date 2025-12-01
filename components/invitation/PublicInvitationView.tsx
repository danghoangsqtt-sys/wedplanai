
import React, { useEffect, useState } from 'react';
import { loadPublicInvitation } from '../../services/cloudService';
import { InvitationData } from '../../types';
import {
    Calendar, MapPin, Clock, Heart, Check,
    Navigation, Gift, Copy, Sparkles
} from 'lucide-react';

interface Props {
    uid: string;
}

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
        return <div className="h-screen flex items-center justify-center bg-rose-50 text-rose-500"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div></div>;
    }

    if (!invitation || !invitation.groomName) {
        return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500">Thiệp mời chưa được tạo hoặc không tồn tại.</div>;
    }

    const primaryColor = invitation.themeColor || '#e11d48';

    const bankQrUrl = invitation.bankInfo.bankId
        ? `https://img.vietqr.io/image/${invitation.bankInfo.bankId}-${invitation.bankInfo.accountNumber}-compact.png?accountName=${encodeURIComponent(invitation.bankInfo.accountName)}`
        : null;

    const handleCopyBank = () => {
        navigator.clipboard.writeText(invitation.bankInfo.accountNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Helper for stickers (with fallback for old data)
    const getAvatarUrl = (seed: string) => `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&scale=120&backgroundColor=transparent`;
    const groomSticker = getAvatarUrl(invitation.sticker?.groom || 'Felix');
    const brideSticker = getAvatarUrl(invitation.sticker?.bride || 'Aneka');

    const isAIMode = invitation.sticker?.mode === 'AI_GEN';
    const stickerPack = invitation.sticker?.stickerPack;

    return (
        <div className="min-h-screen bg-[#FDF2F8] font-serif-display pb-20">
            {/* 1. HERO SECTION (STICKERS) */}
            <div className="relative h-[65vh] md:h-[75vh] w-full bg-gradient-to-b from-white to-[#FDF2F8] flex flex-col items-center justify-center overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#e11d48 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                {/* STICKER DISPLAY: AI vs BASIC */}
                <div className="relative z-10 flex justify-center w-full mt-[-60px]">
                    {isAIMode && stickerPack?.main ? (
                        <div className="relative w-72 h-72 md:w-96 md:h-96 animate-float-slow drop-shadow-2xl">
                            <img src={stickerPack.main} className="w-full h-full object-contain" alt="Couple" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-4 md:gap-10 scale-125 md:scale-150">
                            <div className="relative w-40 h-40 md:w-56 md:h-56 animate-float-slow drop-shadow-2xl">
                                <img src={groomSticker} className="w-full h-full object-contain" alt="Groom" />
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-0">
                                <Heart className="w-16 h-16 md:w-24 md:h-24 fill-current animate-pulse opacity-30" style={{ color: primaryColor }} />
                            </div>
                            <div className="relative w-40 h-40 md:w-56 md:h-56 animate-float-delayed drop-shadow-2xl">
                                <img src={brideSticker} className="w-full h-full object-contain" alt="Bride" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 w-full p-8 pb-12 text-center z-20 animate-fade-in-up bg-gradient-to-t from-[#FDF2F8] via-[#FDF2F8]/80 to-transparent pt-24">
                    <p className="text-lg md:text-xl uppercase tracking-[0.3em] font-light mb-2 text-gray-500 drop-shadow-sm">Save The Date</p>
                    <h1 className="text-4xl md:text-7xl font-bold mb-4 leading-tight drop-shadow-md text-gray-800">
                        {invitation.groomName} <span style={{ color: primaryColor }}>&</span> {invitation.brideName}
                    </h1>
                    <div className="flex items-center justify-center gap-4 text-sm md:text-lg font-sans tracking-widest uppercase opacity-80 text-gray-600">
                        <span>{new Date(invitation.date).toLocaleDateString('vi-VN', { weekday: 'long' })}</span>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                        <span>{new Date(invitation.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 relative z-30 space-y-8">

                {/* 2. Invitation Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 text-center border-t-4" style={{ borderColor: primaryColor }}>
                    <Heart className="w-10 h-10 mx-auto mb-4 fill-current" style={{ color: primaryColor }} />
                    <p className="text-gray-500 font-sans text-sm md:text-base uppercase tracking-wider mb-6">Trân trọng kính mời quý khách đến dự Lễ Thành Hôn</p>

                    <p className="font-sans italic text-gray-600 mb-8 px-4 leading-relaxed text-lg">"{invitation.wishes}"</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 py-6 border-y border-gray-100">
                        <div className="flex flex-col items-center">
                            <Clock className="w-6 h-6 mb-2 text-gray-400" />
                            <h3 className="font-bold text-lg text-gray-800 uppercase font-sans">Thời gian</h3>
                            <p className="text-2xl font-bold mt-1" style={{ color: primaryColor }}>{invitation.time}</p>
                            <p className="text-gray-500 font-sans">{new Date(invitation.date).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <MapPin className="w-6 h-6 mb-2 text-gray-400" />
                            <h3 className="font-bold text-lg text-gray-800 uppercase font-sans">Địa điểm</h3>
                            <p className="text-lg font-bold mt-1 text-gray-800">{invitation.location}</p>
                            <p className="text-gray-500 font-sans text-sm">{invitation.address}</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        {invitation.mapLink && (
                            <a
                                href={invitation.mapLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold shadow-lg hover:shadow-xl transition-all font-sans transform hover:-translate-y-1"
                                style={{ backgroundColor: primaryColor }}
                            >
                                <Navigation className="w-4 h-4" /> Chỉ đường trên Map
                            </a>
                        )}
                    </div>
                </div>

                {/* 3. Sticker Album (Only for AI Mode) */}
                {isAIMode && stickerPack && Object.keys(stickerPack).length > 1 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3 text-purple-500">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-xl text-gray-800 font-sans">Khoảnh Khắc Của Chúng Tôi</h3>
                            <p className="text-sm text-gray-500 mt-1 font-sans">Bộ sưu tập sticker AI</p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(stickerPack).map(([key, url]) => (
                                key !== 'main' && (
                                    <div key={key} className="bg-gray-50 rounded-xl p-2 flex flex-col items-center border border-gray-100 hover:shadow-md transition-all">
                                        <img src={url as string} className="w-full h-32 object-contain" alt={key} />
                                        <span className="text-xs font-bold text-gray-500 uppercase mt-2">{key}</span>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. Gift Box (Banking) */}
                {bankQrUrl && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3" style={{ color: primaryColor }}>
                                <Gift className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-xl text-gray-800 font-sans">Hộp Mừng Cưới</h3>
                            <p className="text-sm text-gray-500 mt-1 font-sans">Dành cho người bận rộn</p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                            <div className="p-2 border border-rose-100 rounded-xl bg-white shadow-sm">
                                <img src={bankQrUrl} className="w-48 h-auto rounded-lg" alt="QR Banking" />
                            </div>
                            <div className="text-center md:text-left font-sans">
                                <p className="text-sm text-gray-500 mb-1">Ngân hàng</p>
                                <p className="font-bold text-gray-800 mb-4">{invitation.bankInfo.bankId}</p>

                                <p className="text-sm text-gray-500 mb-1">Chủ tài khoản</p>
                                <p className="font-bold text-gray-800 mb-4 uppercase">{invitation.bankInfo.accountName}</p>

                                <p className="text-sm text-gray-500 mb-1">Số tài khoản</p>
                                <div className="flex items-center gap-2 justify-center md:justify-start">
                                    <p className="font-mono font-bold text-lg tracking-wider" style={{ color: primaryColor }}>{invitation.bankInfo.accountNumber}</p>
                                    <button onClick={handleCopyBank} className="text-gray-400 hover:text-gray-600 transition-colors">
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                                {copied && <span className="text-xs text-green-600 font-medium">Đã sao chép!</span>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="text-center pt-8 pb-4">
                    <p className="text-xs text-gray-400 font-sans">Thiệp được tạo miễn phí bởi <span className="font-bold" style={{ color: primaryColor }}>WedPlan AI</span></p>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 1s ease-out forwards;
                }
                @keyframes floatSlow {
                    0%, 100% { transform: translateY(0px) rotate(-2deg); }
                    50% { transform: translateY(-15px) rotate(2deg); }
                }
                @keyframes floatDelayed {
                    0%, 100% { transform: translateY(0px) rotate(2deg); }
                    50% { transform: translateY(-15px) rotate(-2deg); }
                }
                .animate-float-slow {
                    animation: floatSlow 6s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: floatDelayed 6s ease-in-out infinite 1s;
                }
            `}</style>
        </div>
    );
};

export default PublicInvitationView;
