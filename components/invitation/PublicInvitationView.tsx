
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { loadPublicInvitation, submitRSVP, submitWish, loadInvitationResponses } from '../../services/cloudService';
import { InvitationData, GuestWish } from '../../types';
import InvitationPreview from './InvitationPreview';
import { Loader2, AlertCircle, MailOpen, Volume2, VolumeX, Heart, Mail, X, CheckCircle2, Send, Users, MessageCircle, Music } from 'lucide-react';

// --- RSVP MODAL ---
interface RSVPModalProps {
    groomName: string;
    brideName: string;
    inviteData?: InvitationData;
    onClose: () => void;
    onSubmit: (payload: { name: string; phone?: string; attending: string; guestCount?: number | null; message?: string; selectedEventIds?: string[] }) => void;
}
const RSVPModal: React.FC<RSVPModalProps> = ({ groomName, brideName, inviteData, onClose, onSubmit }) => {
    const [form, setForm] = useState({ name: '', phone: '', guests: '1', attending: 'yes', note: '' });
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const isMultiEvent = !!(inviteData?.rsvpMultiEvent);

    // Build event list: use rsvpEventSelections if configured, else fallback to events[]
    const eventOptions: { id: string; label: string }[] = (() => {
        if (inviteData?.rsvpEventSelections && inviteData.rsvpEventSelections.length > 0) {
            return inviteData.rsvpEventSelections.map(s => ({ id: s.eventId, label: s.eventTitle }));
        }
        if (inviteData?.events && inviteData.events.length > 0) {
            return inviteData.events.map(ev => ({ id: ev.id || ev.title, label: ev.title }));
        }
        return [];
    })();

    const toggleEvent = (id: string) => {
        setSelectedEvents(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;
        const attending = isMultiEvent ? (selectedEvents.length > 0 ? 'yes' : 'no') : form.attending;
        const guestCount = attending === 'yes' ? (parseInt(form.guests, 10) || null) : null;
        onSubmit({
            name: form.name.trim(),
            phone: form.phone.trim() || undefined,
            attending,
            guestCount,
            message: form.note.trim() || undefined,
            selectedEventIds: isMultiEvent ? selectedEvents : undefined,
        });
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
                        {(isMultiEvent ? selectedEvents.length > 0 : form.attending === 'yes')
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

                    {/* ── Multi-event event selection (A&Q style) ── */}
                    {isMultiEvent && eventOptions.length > 0 ? (
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Chọn sự kiện tham dự</label>
                            <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                                {eventOptions.map(ev => (
                                    <label key={ev.id} className="flex items-center gap-3 cursor-pointer group">
                                        <div
                                            onClick={() => toggleEvent(ev.id)}
                                            className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer
                                                ${selectedEvents.includes(ev.id)
                                                    ? 'border-rose-500 bg-rose-500'
                                                    : 'border-gray-300 bg-white group-hover:border-rose-300'}`}
                                        >
                                            {selectedEvents.includes(ev.id) && (
                                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <span
                                            className={`text-sm font-medium uppercase tracking-wide transition-colors ${selectedEvents.includes(ev.id) ? 'text-rose-700' : 'text-gray-600'}`}
                                            onClick={() => toggleEvent(ev.id)}
                                        >
                                            {ev.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Standard yes/no toggle */
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
                    )}

                    {(isMultiEvent ? selectedEvents.length > 0 : form.attending === 'yes') && (
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
                        <Send className="w-4 h-4" /> Xác nhận / Confirm
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
    showEmail?: boolean;
    onClose: () => void;
    onSubmit: (wish: GuestWish) => void;
}
const GuestbookModal: React.FC<GuestbookModalProps> = ({ groomName, brideName, showEmail, onClose, onSubmit }) => {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
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
                    {/* Name + Email row */}
                    <div className={showEmail ? 'grid grid-cols-2 gap-3' : ''}>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tên của bạn *</label>
                            <input
                                className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-amber-400 outline-none"
                                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Nguyễn Văn A" required
                            />
                        </div>
                        {showEmail && (
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">E-mail</label>
                                <input
                                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-amber-400 outline-none"
                                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="email@..." type="email"
                                />
                            </div>
                        )}
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
                        <Heart className="w-4 h-4 fill-current" /> GỬI LỜI CHÚC
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
    const [cloudWishes, setCloudWishes] = useState<GuestWish[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Stable random positions for petals/sparkles — prevents re-randomizing on each render
    const petalData = useMemo(() => {
        const emojis = ['🌸', '🩷', '💮', '✿', '❀', '🪷'];
        return Array.from({ length: 20 }, (_, i) => ({
            emoji: emojis[i % emojis.length],
            left: Math.random() * 100,
            dur: 6 + Math.random() * 8,
            delay: Math.random() * 10,
            drift: -40 + Math.random() * 80,
            spin: 360 + Math.random() * 720,
            size: 10 + Math.random() * 14,
        }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sparkleData = useMemo(() =>
        Array.from({ length: 15 }, () => ({
            left: 5 + Math.random() * 90,
            top: 5 + Math.random() * 90,
            fontSize: 6 + Math.random() * 10,
            dur: 2 + Math.random() * 4,
            delay: Math.random() * 5,
        }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    , []);

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
                // 1. Try cloud first
                let inviteData = await loadPublicInvitation(uid);

                // 2. Fallback: localStorage mirror (set by updateInvitation in no-auth mode)
                if (!inviteData) {
                    try {
                        const cached = localStorage.getItem(`wedplan_pub_inv_${uid}`);
                        if (cached) {
                            inviteData = JSON.parse(cached);
                        }
                    } catch { /* ignore */ }
                }

                if (inviteData) {
                    setData(inviteData);
                    try {
                        const stored = localStorage.getItem(`wishes_${uid}`);
                        if (stored) setLocalWishes(JSON.parse(stored));
                    } catch { /* ignore */ }
                    // Load wishes other guests submitted (from the cloud)
                    try {
                        const { wishes } = await loadInvitationResponses(uid);
                        setCloudWishes(wishes.map(w => ({ id: w.id, name: w.name, message: w.message ?? '', createdAt: w.createdAt })));
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
        // Persist to cloud so the couple (and other guests) actually receive it
        submitWish(uid, { name: wish.name, message: wish.message });
    };

    const handleRSVPSubmit = (payload: { name: string; phone?: string; attending: string; guestCount?: number | null; message?: string; selectedEventIds?: string[] }) => {
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('uid') || 'unknown';
        // Persist to cloud so the couple receives the RSVP (including multi-event selections)
        submitRSVP(uid, payload);
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
            <div className="fixed inset-0 z-50 overflow-hidden">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');

                    /* Falling petals */
                    @keyframes petalDrift {
                        0% { transform: translateY(-10vh) translateX(0) rotate(0deg) scale(0.8); opacity: 0; }
                        10% { opacity: 1; }
                        90% { opacity: 0.8; }
                        100% { transform: translateY(110vh) translateX(var(--drift, 60px)) rotate(var(--spin, 720deg)) scale(0.4); opacity: 0; }
                    }
                    .petal { 
                        position: absolute; top: -5%; pointer-events: none; 
                        animation: petalDrift var(--dur, 8s) var(--delay, 0s) linear infinite;
                    }

                    /* Sparkle twinkle */
                    @keyframes twinkle {
                        0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
                        50% { opacity: 1; transform: scale(1) rotate(180deg); }
                    }
                    .sparkle {
                        position: absolute; pointer-events: none;
                        animation: twinkle var(--dur, 3s) var(--delay, 0s) ease-in-out infinite;
                    }

                    /* Envelope 3D flip */
                    @keyframes envelopeOpen {
                        0% { transform: perspective(800px) rotateX(0deg) scale(1); }
                        40% { transform: perspective(800px) rotateX(-25deg) scale(1.05); }
                        70% { transform: perspective(800px) rotateX(-15deg) scale(1.02) translateY(-20px); }
                        100% { transform: perspective(800px) rotateX(0deg) scale(0.8) translateY(-60px); opacity: 0; }
                    }
                    .envelope-opening {
                        animation: envelopeOpen 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                    }

                    /* Envelope flap animation */
                    @keyframes flapOpen {
                        0% { transform: rotateX(0deg); }
                        100% { transform: rotateX(-180deg); }
                    }
                    .flap-opening {
                        animation: flapOpen 0.6s ease-in-out forwards;
                        transform-origin: top center;
                    }

                    /* Content reveal */
                    @keyframes contentReveal {
                        0% { opacity: 0; transform: scale(0.9) translateY(30px); filter: blur(10px); }
                        100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
                    }
                    .content-reveal { animation: contentReveal 0.8s 0.6s ease-out forwards; opacity: 0; }

                    /* Pulse ring */
                    @keyframes pulseRing {
                        0% { transform: scale(1); opacity: 0.4; }
                        100% { transform: scale(2.5); opacity: 0; }
                    }
                    .pulse-ring { animation: pulseRing 2s ease-out infinite; }

                    /* Gentle float */
                    @keyframes gentleFloat {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-8px); }
                    }
                    .gentle-float { animation: gentleFloat 3s ease-in-out infinite; }

                    /* Golden glow */
                    @keyframes goldenGlow {
                        0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.2), 0 0 40px rgba(251, 191, 36, 0.1); }
                        50% { box-shadow: 0 0 30px rgba(251, 191, 36, 0.4), 0 0 60px rgba(251, 191, 36, 0.2); }
                    }
                    .golden-glow { animation: goldenGlow 2s ease-in-out infinite; }
                `}</style>

                {/* Gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-pink-600 to-rose-800" />

                {/* Animated background orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                    <div className="absolute w-[400px] h-[400px] rounded-full bg-white/8 blur-3xl animate-pulse" style={{ top: '-10%', left: '-10%', animationDuration: '4s' }} />
                    <div className="absolute w-[300px] h-[300px] rounded-full bg-pink-300/10 blur-3xl animate-pulse" style={{ top: '50%', right: '-5%', animationDuration: '5s', animationDelay: '1s' }} />
                    <div className="absolute w-[250px] h-[250px] rounded-full bg-rose-300/10 blur-3xl animate-pulse" style={{ bottom: '-5%', left: '20%', animationDuration: '6s', animationDelay: '2s' }} />
                </div>

                {/* Falling petals */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                    {petalData.map((p, i) => (
                            <span
                                key={i}
                                className="petal select-none"
                                style={{
                                    left: `${p.left}%`,
                                    fontSize: `${p.size}px`,
                                    '--dur': `${p.dur}s`,
                                    '--delay': `${p.delay}s`,
                                    '--drift': `${p.drift}px`,
                                    '--spin': `${p.spin}deg`,
                                    opacity: 0.7,
                                } as React.CSSProperties}
                            >
                                {p.emoji}
                            </span>
                        ))}
                </div>

                {/* Sparkles */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                    {sparkleData.map((s, i) => (
                        <span
                            key={`s${i}`}
                            className="sparkle text-white select-none"
                            style={{
                                left: `${s.left}%`,
                                top: `${s.top}%`,
                                fontSize: `${s.fontSize}px`,
                                '--dur': `${s.dur}s`,
                                '--delay': `${s.delay}s`,
                            } as React.CSSProperties}
                        >
                            ✦
                        </span>
                    ))}
                </div>

                {/* Floating hearts */}
                <FloatingHearts />

                {/* Decorative corners */}
                <div className="absolute top-6 left-6 text-white/15 text-4xl pointer-events-none select-none" style={{ fontFamily: 'serif' }}>❦</div>
                <div className="absolute top-6 right-6 text-white/15 text-4xl pointer-events-none select-none" style={{ fontFamily: 'serif', transform: 'scaleX(-1)' }}>❦</div>
                <div className="absolute bottom-20 left-6 text-white/10 text-2xl pointer-events-none select-none">✧</div>
                <div className="absolute bottom-20 right-6 text-white/10 text-2xl pointer-events-none select-none">✧</div>

                {/* Main envelope card */}
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
                    <div className={`flex flex-col items-center text-center max-w-xs w-full ${isOpened ? 'envelope-opening' : 'animate-envelope-pop'}`}>

                        {/* Envelope with 3D effect */}
                        <div className="mb-8 relative gentle-float">
                            {/* Pulse rings behind */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-24 h-24 rounded-full border-2 border-white/20 pulse-ring" />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-24 h-24 rounded-full border-2 border-white/15 pulse-ring" style={{ animationDelay: '0.7s' }} />
                            </div>

                            {/* Envelope body */}
                            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-white/25 to-white/10 backdrop-blur-md flex items-center justify-center border-2 border-white/30 shadow-2xl golden-glow relative overflow-hidden">
                                {/* Envelope flap (triangle) */}
                                <div className="absolute top-0 left-0 right-0 h-[45%] overflow-hidden">
                                    <div className="w-0 h-0 mx-auto" style={{
                                        borderLeft: '56px solid transparent',
                                        borderRight: '56px solid transparent',
                                        borderTop: '40px solid rgba(255,255,255,0.15)',
                                    }} />
                                </div>
                                <Mail className="w-12 h-12 text-white drop-shadow-lg relative z-10" />
                            </div>

                            {/* Floating hearts around envelope */}
                            <Heart className="w-6 h-6 text-white fill-current absolute -top-2 -right-3 animate-bounce drop-shadow-lg" style={{ animationDuration: '2s' }} />
                            <Heart className="w-4 h-4 text-pink-200 fill-current absolute bottom-0 -left-3 animate-bounce drop-shadow-md" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }} />
                            <span className="absolute -top-1 -left-2 text-lg animate-pulse select-none">✨</span>
                            <span className="absolute -bottom-2 -right-2 text-sm animate-pulse select-none" style={{ animationDelay: '1s' }}>✨</span>
                        </div>

                        {/* Tagline */}
                        <p className="text-[10px] uppercase tracking-[0.5em] text-white/50 font-light mb-5 select-none">
                            ✦ &nbsp; Thiệp Cưới Trân Trọng &nbsp; ✦
                        </p>

                        {/* Names */}
                        {(data.groomName || data.brideName) ? (
                            <div className="mb-4">
                                <p className="text-white/40 text-[10px] uppercase tracking-[0.35em] mb-3">Trân trọng kính mời</p>
                                <div className="font-handwriting text-5xl sm:text-6xl text-white leading-tight drop-shadow-lg">
                                    {data.groomName}
                                </div>
                                <div className="text-white/40 text-2xl my-2 font-light tracking-widest select-none">&amp;</div>
                                <div className="font-handwriting text-5xl sm:text-6xl text-white leading-tight drop-shadow-lg">
                                    {data.brideName}
                                </div>
                            </div>
                        ) : (
                            <p className="text-3xl text-white font-light mb-4 tracking-wide">Thiệp Mời Của Bạn</p>
                        )}

                        {/* Date */}
                        {wDate && (
                            <div className="flex items-center gap-2 mt-2 mb-1">
                                <div className="w-8 h-px bg-white/30" />
                                <p className="text-[11px] tracking-[0.35em] text-white/60 uppercase font-medium">
                                    {wDate}
                                </p>
                                <div className="w-8 h-px bg-white/30" />
                            </div>
                        )}

                        {/* Ornamental divider */}
                        <div className="flex items-center gap-3 my-6 w-full">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                            <span className="text-white/30 text-lg select-none">❧</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                        </div>

                        {/* CTA Button */}
                        <button
                            type="button"
                            onClick={handleOpenInvite}
                            className="relative w-full overflow-hidden bg-white text-rose-600 py-4 px-8 rounded-2xl font-bold text-base shadow-2xl shadow-rose-900/40 flex items-center justify-center gap-3 active:scale-95 transition-all group hover:shadow-rose-900/50"
                        >
                            <MailOpen className="w-5 h-5 group-hover:rotate-12 group-active:rotate-[-12deg] transition-transform flex-shrink-0" />
                            <span>Mở Thiệp Ngay</span>
                            {/* Shimmer effect */}
                            <div className="absolute inset-0 animate-shimmer rounded-2xl pointer-events-none" />
                        </button>

                        {/* Music hint */}
                        {data.musicUrl && (
                            <p className="mt-4 text-[9px] text-white/35 flex items-center gap-1.5">
                                <Volume2 className="w-3 h-3" />
                                <span>Nhạc nền sẽ phát khi bạn mở thiệp</span>
                            </p>
                        )}

                        <p className="mt-6 text-[8px] text-white/20 uppercase tracking-[0.4em] select-none">Powered by WedPlan AI</p>
                    </div>
                </div>
            </div>
        );
    }

    // Merge cloud wishes + this-device wishes + any legacy embedded wishes, deduped by id
    const wishMap = new Map<string, GuestWish>();
    [...localWishes, ...cloudWishes, ...(data.guestWishes || [])].forEach(w => {
        if (w && w.id && !wishMap.has(w.id)) wishMap.set(w.id, w);
    });
    const allWishes = Array.from(wishMap.values()).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    const invitationWithWishes: InvitationData = { ...data, guestWishes: allWishes };

    const hasActions = data.rsvpEnabled || data.guestbookEnabled;

    return (
        <div className="min-h-[100dvh] bg-[#f0f0f0] flex justify-center relative">

            {/* Desktop subtle background pattern */}
            <div className="invite-desktop-pattern hidden lg:block fixed inset-0 pointer-events-none" aria-hidden />

            {/* Invitation content */}
            <div className={`w-full max-w-[1024px] bg-white shadow-2xl min-h-[100dvh] relative ${hasActions ? 'pb-20' : ''}`}>
                <InvitationPreview
                    data={invitationWithWishes}
                    onRSVP={() => setShowRSVP(true)}
                    onGuestbook={() => setShowGuestbook(true)}
                />
            </div>

            {/* Sticky bottom action bar */}
            {hasActions && (
                <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
                    <div className="w-full max-w-[1024px] pointer-events-auto">
                        <div className="mx-3 mb-3 bg-white/90 backdrop-blur-xl rounded-2xl border border-rose-100 shadow-2xl shadow-black/15 px-3 py-2.5 flex items-center gap-2">

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

            {/* Floating Vinyl Background Music Player */}
            {data.musicUrl && (
                <div className="fixed top-6 right-4 lg:right-6 z-[60]">
                    <div className="relative">
                        {/* Floating Music Notes */}
                        {isPlaying && (
                            <>
                                <div className="absolute -top-2 -left-4 animate-float-music-note pointer-events-none text-rose-400">
                                    <Music className="w-3 h-3 fill-current" />
                                </div>
                                <div className="absolute -top-4 left-4 animate-float-music-note-delayed pointer-events-none text-pink-400">
                                    <Music className="w-4 h-4 fill-current" />
                                </div>
                            </>
                        )}
                        
                        {/* Vinyl Disc */}
                        <div 
                            className={`w-12 h-12 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.15)] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 ${isPlaying ? 'animate-spin-slow' : ''}`}
                            style={{ background: 'radial-gradient(circle at center, #111 0%, #333 40%, #111 80%, #000 100%)' }}
                            onClick={toggleMusic}
                            title={isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
                            aria-label={isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}
                        >
                            {/* Center Label */}
                            <div className="w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center z-10 border-2 border-gray-800"></div>
                            
                            {/* Vinyl grooves */}
                            <div className="absolute inset-1 border border-white/5 rounded-full pointer-events-none" />
                            <div className="absolute inset-2 border border-white/10 rounded-full pointer-events-none" />
                            <div className="absolute inset-3 border border-white/5 rounded-full pointer-events-none" />
                            
                            {/* Paused Overlay */}
                            {!isPlaying && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-[1px]">
                                    <VolumeX className="w-4 h-4 text-white/90" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showRSVP && (
                <RSVPModal
                    groomName={data.groomName}
                    brideName={data.brideName}
                    inviteData={data}
                    onClose={() => setShowRSVP(false)}
                    onSubmit={handleRSVPSubmit}
                />
            )}
            {showGuestbook && (
                <GuestbookModal
                    groomName={data.groomName}
                    brideName={data.brideName}
                    showEmail={!!data.guestbookEmailEnabled}
                    onClose={() => setShowGuestbook(false)}
                    onSubmit={handleWishSubmit}
                />
            )}
        </div>
    );
};

export default PublicInvitationView;
