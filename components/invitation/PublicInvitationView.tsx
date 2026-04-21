
import React, { useEffect, useState, useRef } from 'react';
import { loadPublicInvitation } from '../../services/cloudService';
import { InvitationData, GuestWish } from '../../types';
import InvitationPreview from './InvitationPreview';
import { Loader2, AlertCircle, MailOpen, Volume2, VolumeX, Heart, Mail, X, CheckCircle2, Send, Users, MessageCircle } from 'lucide-react';

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
                            ? 'Chúng tôi rất vui khi biết bạn sẽ đến tham dự!'
                            : 'Cảm ơn bạn đã phản hồi. Chúc bạn sức khoẻ!'}
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
                <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Họ tên *</label>
                        <input
                            className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-rose-400 outline-none"
                            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Nguyễn Văn A" required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Số điện thoại</label>
                        <input
                            className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-rose-400 outline-none"
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
                                    className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${form.attending === opt.v ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
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
                                className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-rose-400 outline-none bg-white"
                                value={form.guests} onChange={e => setForm(f => ({ ...f, guests: e.target.value }))}>
                                {['1', '2', '3', '4', '5+'].map(n => <option key={n} value={n}>{n} người</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ghi chú (tùy chọn)</label>
                        <textarea
                            className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-rose-400 outline-none resize-none h-16"
                            value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                            placeholder="Dị ứng thức ăn, yêu cầu đặc biệt..."
                        />
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-rose-300/50 transition-all flex items-center justify-center gap-2">
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
                            className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-amber-400 outline-none"
                            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Nguyễn Văn A" required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Lời chúc *</label>
                        <textarea
                            className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-amber-400 outline-none resize-none h-28"
                            value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                            placeholder="Chúc cô dâu chú rể trăm năm hạnh phúc, sớm có con ..."
                            maxLength={300} required
                        />
                        <p className="text-[10px] text-gray-400 mt-1 text-right">{form.message.length}/300</p>
                    </div>
                    <button type="submit" className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-amber-300/50 transition-all flex items-center justify-center gap-2">
                        <Heart className="w-4 h-4 fill-current" /> Gửi lời chúc
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- FLOATING HEARTS BACKGROUND ---
const FloatingHearts: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <span className="absolute text-white/15 select-none text-sm  bottom-[-20px] left-[8%]  invite-fh-1">❤</span>
        <span className="absolute text-white/15 select-none text-xl  bottom-[-20px] left-[17%] invite-fh-2">❤</span>
        <span className="absolute text-white/15 select-none text-xs  bottom-[-20px] left-[29%] invite-fh-3">❤</span>
        <span className="absolute text-white/15 select-none text-lg  bottom-[-20px] left-[44%] invite-fh-4">❤</span>
        <span className="absolute text-white/15 select-none text-sm  bottom-[-20px] left-[57%] invite-fh-5">❤</span>
        <span className="absolute text-white/15 select-none text-xl  bottom-[-20px] left-[68%] invite-fh-6">❤</span>
        <span className="absolute text-white/15 select-none text-xs  bottom-[-20px] left-[76%] invite-fh-7">❤</span>
        <span className="absolute text-white/15 select-none text-sm  bottom-[-20px] left-[85%] invite-fh-8">❤</span>
    </div>
);

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

    // --- LOADING ---
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100">
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');`}</style>
                <div className="relative mb-6">
                    <Heart className="w-14 h-14 text-rose-300 animate-ping absolute inset-0" />
                    <Heart className="w-14 h-14 text-rose-500 relative fill-current animate-pulse" />
                </div>
                <p className="text-rose-400 font-medium text-[11px] tracking-[0.4em] uppercase">Đang tải thiệp cưới...</p>
            </div>
        );
    }

    // --- ERROR ---
    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 p-6 text-center">
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl max-w-sm w-full border border-rose-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Không thể xem thiệp</h1>
                    <p className="text-gray-500 mb-6 text-sm leading-relaxed">{error}</p>
                    <a href="/" className="block bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-full font-bold hover:opacity-90 transition-opacity text-sm shadow-lg shadow-rose-200">
                        Về trang chủ WedPlan AI
                    </a>
                </div>
            </div>
        );
    }

    // --- WELCOME / ENVELOPE SCREEN ---
    if (!isOpened) {
        const wDate = data.date && !isNaN(new Date(data.date).getTime())
            ? new Date(data.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            : null;

        return (
            <div className="invite-welcome-bg fixed inset-0 z-50 overflow-hidden flex items-center justify-center">
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');`}</style>

                {/* Animated background orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                    <div className="absolute rounded-full bg-white/10 blur-3xl animate-pulse invite-orb-1" />
                    <div className="absolute rounded-full bg-white/10 blur-3xl animate-pulse invite-orb-2" />
                    <div className="absolute rounded-full bg-white/10 blur-3xl animate-pulse invite-orb-3" />
                    <div className="absolute rounded-full bg-white/10 blur-3xl animate-pulse invite-orb-4" />
                </div>

                {/* Floating hearts */}
                <FloatingHearts />

                {/* Decorative corner petals */}
                <div className="absolute top-6 left-6 text-white/20 text-3xl pointer-events-none select-none">✿</div>
                <div className="absolute top-6 right-6 text-white/20 text-3xl pointer-events-none select-none">✿</div>
                <div className="absolute bottom-16 left-6 text-white/15 text-2xl pointer-events-none select-none">✦</div>
                <div className="absolute bottom-16 right-6 text-white/15 text-2xl pointer-events-none select-none">✦</div>

                {/* Main card content */}
                <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-xs w-full animate-envelope-pop">

                    {/* Envelope icon */}
                    <div className="mb-8 relative">
                        <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 shadow-2xl">
                            <Mail className="w-11 h-11 text-white drop-shadow-lg" />
                        </div>
                        <Heart className="w-6 h-6 text-white fill-current absolute -top-1 -right-1 animate-bounce drop-shadow-md" />
                        <Heart className="w-4 h-4 text-pink-200 fill-current absolute bottom-1 -left-2 animate-bounce drop-shadow-md invite-heart-secondary" />
                    </div>

                    {/* Tagline */}
                    <p className="text-[10px] uppercase tracking-[0.45em] text-white/60 font-light mb-5">
                        ✦ &nbsp; Thiệp Cưới Trân Trọng &nbsp; ✦
                    </p>

                    {/* Names */}
                    {(data.groomName || data.brideName) ? (
                        <div className="mb-3">
                            <p className="text-white/50 text-[10px] uppercase tracking-[0.3em] mb-2">Chúng tôi trân trọng mời bạn</p>
                            <div className="font-handwriting text-5xl text-white leading-tight drop-shadow-lg">
                                {data.groomName}
                            </div>
                            <div className="text-white/50 text-xl my-1 font-light tracking-widest">&amp;</div>
                            <div className="font-handwriting text-5xl text-white leading-tight drop-shadow-lg">
                                {data.brideName}
                            </div>
                        </div>
                    ) : (
                        <p className="text-3xl text-white font-light mb-4 tracking-wide">Thiệp Mời Của Bạn</p>
                    )}

                    {/* Date */}
                    {wDate && (
                        <p className="text-[11px] tracking-[0.35em] text-white/60 uppercase mt-3 mb-1">
                            {wDate}
                        </p>
                    )}

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6 w-full">
                        <div className="flex-1 h-px bg-white/20" />
                        <span className="text-white/40 text-sm">❧</span>
                        <div className="flex-1 h-px bg-white/20" />
                    </div>

                    {/* CTA Button */}
                    <button
                        type="button"
                        onClick={handleOpenInvite}
                        className="relative w-full overflow-hidden bg-white text-rose-600 py-4 px-8 rounded-2xl font-bold text-base shadow-2xl shadow-rose-900/30 flex items-center justify-center gap-3 active:scale-95 transition-transform group"
                    >
                        <MailOpen className="w-5 h-5 group-active:rotate-12 transition-transform flex-shrink-0" />
                        <span>Mở Thiệp Ngay</span>
                        {/* Shimmer on load */}
                        <div className="absolute inset-0 animate-shimmer rounded-2xl pointer-events-none" />
                    </button>

                    <p className="mt-8 text-[9px] text-white/30 uppercase tracking-[0.35em]">Powered by WedPlan AI</p>
                </div>
            </div>
        );
    }

    // Merge server wishes + local wishes
    const allWishes = [...localWishes, ...(data.guestWishes || [])];
    const invitationWithWishes: InvitationData = { ...data, guestWishes: allWishes };

    const hasActions = data.rsvpEnabled || data.guestbookEnabled;

    return (
        <div className="min-h-screen bg-[#f0f0f0] flex justify-center relative">

            {/* Desktop subtle background pattern */}
            <div className="invite-desktop-pattern hidden lg:block fixed inset-0 pointer-events-none" aria-hidden />

            {/* Invitation content */}
            <div className={`w-full max-w-md bg-white shadow-2xl min-h-screen relative ${hasActions ? 'pb-20' : ''}`}>
                <InvitationPreview
                    data={invitationWithWishes}
                    onRSVP={() => setShowRSVP(true)}
                    onGuestbook={() => setShowGuestbook(true)}
                />
            </div>

            {/* Sticky bottom action bar */}
            {hasActions && (
                <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
                    <div className="w-full max-w-md pointer-events-auto">
                        <div className="mx-3 mb-3 bg-white/90 backdrop-blur-xl rounded-2xl border border-rose-100 shadow-2xl shadow-black/15 px-3 py-2.5 flex items-center gap-2">

                            {/* Music toggle */}
                            {data.musicUrl && (
                                <button
                                    type="button"
                                    onClick={toggleMusic}
                                    className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isPlaying ? 'bg-rose-50 text-rose-500' : 'bg-gray-100 text-gray-400'}`}
                                    title={isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
                                    aria-label={isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
                                >
                                    {isPlaying
                                        ? <Volume2 className="w-5 h-5 animate-pulse" />
                                        : <VolumeX className="w-5 h-5" />
                                    }
                                </button>
                            )}

                            {/* RSVP */}
                            {data.rsvpEnabled && (
                                <button
                                    type="button"
                                    onClick={() => setShowRSVP(true)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-rose-300/40 active:scale-95 transition-all"
                                >
                                    <Send className="w-4 h-4 flex-shrink-0" />
                                    <span>Xác nhận tham dự</span>
                                </button>
                            )}

                            {/* Guestbook */}
                            {data.guestbookEnabled && (
                                <button
                                    type="button"
                                    onClick={() => setShowGuestbook(true)}
                                    className={`flex items-center justify-center gap-1.5 border-2 border-rose-200 text-rose-500 font-bold text-sm rounded-xl active:scale-95 transition-all hover:bg-rose-50 ${data.rsvpEnabled ? 'px-3 py-2.5 flex-shrink-0' : 'flex-1 py-2.5'}`}
                                >
                                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                                    {!data.rsvpEnabled && <span>Gửi lời chúc</span>}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Music button when no action bar */}
            {!hasActions && data.musicUrl && (
                <button
                    type="button"
                    onClick={toggleMusic}
                    className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center text-rose-600 hover:scale-110 transition-transform border border-rose-100"
                    title={isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
                    aria-label={isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
                >
                    {isPlaying ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
                </button>
            )}

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
