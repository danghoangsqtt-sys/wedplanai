
import React, { useEffect, useState, useRef } from 'react';
import { loadPublicInvitation } from '../../services/cloudService';
import { InvitationData, GuestWish } from '../../types';
import InvitationPreview from './InvitationPreview';
import { Loader2, AlertCircle, MailOpen, Volume2, VolumeX, Heart, Mail, X, CheckCircle2, Send, Users } from 'lucide-react';

// --- RSVP MODAL ---
interface RSVPModalProps {
    groomName: string;
    brideName: string;
    onClose: () => void;
}
const RSVPModal: React.FC<RSVPModalProps> = ({ groomName, brideName, onClose }) => {
    const [form, setForm] = useState({ name: '', phone: '', guests: '1', attending: 'yes', note: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-fadeIn">
                    <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-rose-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Cảm ơn bạn! 🎉</h3>
                    <p className="text-gray-500 text-sm mb-2">
                        {form.attending === 'yes'
                            ? `Chúng tôi rất vui khi biết bạn sẽ đến tham dự!`
                            : 'Cảm ơn bạn đã phản hồi. Chúc bạn sức khoẻ!'
                        }
                    </p>
                    <p className="text-rose-500 font-bold text-base mb-6">{groomName} & {brideName}</p>
                    <button type="button" onClick={onClose} className="w-full bg-rose-500 text-white py-3 rounded-xl font-bold hover:bg-rose-600 transition-colors">
                        Đóng
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm animate-slideInFromBottom">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                        <h3 className="font-bold text-gray-800">Xác nhận tham dự</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{groomName} & {brideName}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Đóng">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Họ tên *</label>
                        <input
                            className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-400 outline-none"
                            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Nguyễn Văn A" required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Số điện thoại</label>
                        <input
                            className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-400 outline-none"
                            value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            placeholder="0912 345 678" type="tel"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Bạn có tham dự không?</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[{ v: 'yes', l: '🎉 Tôi sẽ đến' }, { v: 'no', l: '😢 Tôi không thể' }].map(opt => (
                                <button
                                    type="button" key={opt.v}
                                    onClick={() => setForm(f => ({ ...f, attending: opt.v }))}
                                    className={`p-2.5 rounded-xl border-2 text-sm font-bold transition-all ${form.attending === opt.v ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                >
                                    {opt.l}
                                </button>
                            ))}
                        </div>
                    </div>
                    {form.attending === 'yes' && (
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1">
                                <Users className="w-3 h-3" /> Số người tham dự
                            </label>
                            <select
                                title="Số người tham dự"
                                aria-label="Số người tham dự"
                                className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-400 outline-none bg-white"
                                value={form.guests} onChange={e => setForm(f => ({ ...f, guests: e.target.value }))}>
                                {['1', '2', '3', '4', '5+'].map(n => <option key={n} value={n}>{n} người</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ghi chú (tùy chọn)</label>
                        <textarea
                            className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:border-rose-400 outline-none resize-none h-16"
                            value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                            placeholder="Dị ứng thức ăn, yêu cầu đặc biệt..."
                        />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-rose-300/50 transition-all flex items-center justify-center gap-2">
                        <Send className="w-4 h-4" /> Gửi xác nhận
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- GUESTBOOK MODAL ---
interface GuestbookModalProps {
    groomName: string;
    brideName: string;
    onClose: () => void;
    onSubmit: (wish: GuestWish) => void;
}
const GuestbookModal: React.FC<GuestbookModalProps> = ({ groomName, brideName, onClose, onSubmit }) => {
    const [form, setForm] = useState({ name: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.message.trim()) return;
        const wish: GuestWish = {
            id: `wish-${Date.now()}`,
            name: form.name.trim(),
            message: form.message.trim(),
            createdAt: new Date().toISOString(),
        };
        onSubmit(wish);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-fadeIn">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-amber-500 fill-current" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Lời chúc đã gửi! 💌</h3>
                    <p className="text-gray-500 text-sm mb-6">Cảm ơn bạn đã gửi lời chúc đến <strong className="text-rose-500">{groomName} & {brideName}</strong>. Chúc cô dâu chú rể trăm năm hạnh phúc!</p>
                    <button type="button" onClick={onClose} className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-colors">
                        Đóng
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-sm animate-slideInFromBottom">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                        <h3 className="font-bold text-gray-800">Gửi lời chúc mừng 💌</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{groomName} & {brideName}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label="Đóng">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tên của bạn *</label>
                        <input
                            className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:border-amber-400 outline-none"
                            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Nguyễn Văn A" required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Lời chúc *</label>
                        <textarea
                            className="w-full p-2.5 rounded-xl border border-gray-200 text-sm focus:border-amber-400 outline-none resize-none h-28"
                            value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                            placeholder="Chúc cô dâu chú rể trăm năm hạnh phúc, sớm có con ..."
                            maxLength={300} required
                        />
                        <p className="text-[10px] text-gray-400 mt-1 text-right">{form.message.length}/300</p>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-amber-300/50 transition-all flex items-center justify-center gap-2">
                        <Heart className="w-4 h-4 fill-current" /> Gửi lời chúc
                    </button>
                </form>
            </div>
        </div>
    );
};

// =====================================================================
// MAIN PUBLIC VIEW
// =====================================================================
const PublicInvitationView: React.FC = () => {
    const [data, setData] = useState<InvitationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOpened, setIsOpened] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showRSVP, setShowRSVP] = useState(false);
    const [showGuestbook, setShowGuestbook] = useState(false);
    const [localWishes, setLocalWishes] = useState<GuestWish[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('uid');

        if (!uid) {
            setError("Đường dẫn không hợp lệ. Thiếu mã định danh (UID).");
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const inviteData = await loadPublicInvitation(uid);
                if (inviteData) {
                    setData(inviteData);
                    // Load any locally stored wishes for this invitation
                    try {
                        const stored = localStorage.getItem(`wishes_${uid}`);
                        if (stored) setLocalWishes(JSON.parse(stored));
                    } catch { /* ignore */ }
                } else {
                    setError("Không tìm thấy thiệp mời này hoặc thiệp chưa được tạo.");
                }
            } catch {
                setError("Có lỗi xảy ra khi tải thiệp.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleOpenInvite = () => {
        setIsOpened(true);
        if (data?.musicUrl) {
            if (!audioRef.current) {
                audioRef.current = new Audio(data.musicUrl);
                audioRef.current.loop = true;
            }
            audioRef.current.play().catch(() => {/* autoplay blocked */});
            setIsPlaying(true);
        }
    };

    const toggleMusic = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => {/* blocked */});
        }
        setIsPlaying(!isPlaying);
    };

    const handleWishSubmit = (wish: GuestWish) => {
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('uid') || 'unknown';
        const updated = [wish, ...localWishes];
        setLocalWishes(updated);
        try {
            localStorage.setItem(`wishes_${uid}`, JSON.stringify(updated));
        } catch { /* storage full */ }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDF2F8]">
                <div className="relative">
                    <Heart className="w-12 h-12 text-rose-500 animate-ping absolute top-0 left-0 opacity-20" />
                    <Heart className="w-12 h-12 text-rose-500 animate-pulse relative z-10" />
                </div>
                <p className="text-rose-400 font-medium mt-4 text-xs tracking-[0.3em] uppercase">Loading Invitation...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Không thể xem thiệp</h1>
                    <p className="text-gray-500 mb-6 text-sm">{error}</p>
                    <a href="/" className="bg-rose-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-rose-700 transition-colors text-sm shadow-lg shadow-rose-200">
                        Về trang chủ WedPlan AI
                    </a>
                </div>
            </div>
        );
    }

    // --- WELCOME SCREEN (ENVELOPE) ---
    if (!isOpened) {
        return (
            <div className="fixed inset-0 bg-[#FDF2F8] flex items-center justify-center p-4 z-50 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-200/20 blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-200/20 blur-3xl animate-pulse delay-700"></div>

                <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center border border-rose-100 relative overflow-hidden group hover:scale-105 transition-transform duration-500">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 via-pink-500 to-rose-400"></div>

                    <div className="mb-8 mt-4 relative">
                        <div className="w-28 h-28 bg-rose-50 rounded-full flex items-center justify-center mx-auto shadow-inner group-hover:bg-rose-100 transition-colors">
                            <Mail className="w-12 h-12 text-rose-500" />
                        </div>
                        <Heart className="w-6 h-6 text-pink-500 absolute top-0 right-[25%] animate-bounce fill-current" style={{ animationDelay: '0.1s' }} />
                    </div>

                    <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">Thiệp Hồng Trao Tay</h2>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                        Trân trọng kính mời bạn đến tham dự lễ thành hôn của chúng tôi<br />
                        <strong className="text-rose-600 text-lg font-serif block mt-2">{data.groomName} & {data.brideName}</strong>
                    </p>

                    <button
                        type="button"
                        onClick={handleOpenInvite}
                        className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:shadow-rose-300/50 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <MailOpen className="w-5 h-5" />
                        <span>Mở Thiệp Ngay</span>
                    </button>

                    <p className="mt-6 text-[9px] text-gray-400 uppercase tracking-widest font-bold">Powered by WedPlan AI</p>
                </div>
            </div>
        );
    }

    // Merge server wishes + local wishes
    const allWishes = [...localWishes, ...(data.guestWishes || [])];
    const invitationWithWishes: InvitationData = { ...data, guestWishes: allWishes };

    return (
        <div className="min-h-screen bg-gray-200 flex justify-center relative">
            {/* Music Control */}
            {data.musicUrl && (
                <button
                    type="button"
                    onClick={toggleMusic}
                    className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-rose-600 hover:scale-110 transition-transform border border-rose-200"
                    title={isPlaying ? "Tắt nhạc" : "Bật nhạc"}
                    aria-label={isPlaying ? "Tắt nhạc" : "Bật nhạc"}
                >
                    {isPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6 text-gray-400" />}
                </button>
            )}

            <div className="w-full max-w-md bg-white shadow-2xl min-h-screen relative">
                <InvitationPreview
                    data={invitationWithWishes}
                    onRSVP={() => setShowRSVP(true)}
                    onGuestbook={() => setShowGuestbook(true)}
                />
            </div>

            {/* Modals */}
            {showRSVP && (
                <RSVPModal
                    groomName={data.groomName}
                    brideName={data.brideName}
                    onClose={() => setShowRSVP(false)}
                />
            )}
            {showGuestbook && (
                <GuestbookModal
                    groomName={data.groomName}
                    brideName={data.brideName}
                    onClose={() => setShowGuestbook(false)}
                    onSubmit={handleWishSubmit}
                />
            )}
        </div>
    );
};

export default PublicInvitationView;
