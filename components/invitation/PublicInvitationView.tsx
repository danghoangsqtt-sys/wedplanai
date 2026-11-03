
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { loadPublicInvitation, submitRSVP, submitWish, loadPublicWishes } from '../../services/cloudService';
import { InvitationData, GuestWish } from '../../types';
import InvitationPreview from './InvitationPreview';
import { newUuid } from '../../lib/ids';
import { sanitizeAudioUrl } from '../../lib/sanitize';
import { Loader2, AlertCircle, MailOpen, Volume2, VolumeX, Heart, Mail, X, CheckCircle2, Send, Users, MessageCircle, Music } from 'lucide-react';

// Strip HTML tags — used for plain text contexts (titles, buttons, labels)
const stripHtml = (html: string): string => html ? html.replace(/<[^>]*>?/gm, '') : '';

// Sanitize and render HTML safely — used for rich-text fields (names, messages)
// Allows safe inline tags (b, i, em, strong, span, br) only.
const SAFE_TAGS = /^(b|strong|i|em|u|s|br|span)$/i;
const sanitizeHtml = (html: string): string => {
    if (!html) return '';
    // Fast path: no tags present
    if (!html.includes('<')) return html;
    try {
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        const walker = document.createTreeWalker(tpl.content, NodeFilter.SHOW_ELEMENT);
        const toRemove: Element[] = [];
        let node = walker.nextNode() as Element | null;
        while (node) {
            if (!SAFE_TAGS.test(node.tagName)) {
                toRemove.push(node);
            } else {
                // BUG-011 fix: strip ALL attributes (including style) to prevent CSS injection
                Array.from(node.attributes).forEach(attr => {
                    node!.removeAttribute(attr.name);
                });
            }
            node = walker.nextNode() as Element | null;
        }
        toRemove.forEach(el => {
            el.parentNode?.replaceChild(document.createTextNode(el.textContent || ''), el);
        });
        const div = document.createElement('div');
        div.appendChild(tpl.content.cloneNode(true));
        return div.innerHTML;
    } catch {
        return stripHtml(html);
    }
};

// Convenience: render a rich-text field as a span with safe inner HTML
const RichField: React.FC<{ value: string; className?: string; style?: React.CSSProperties }> = ({ value, className, style }) => (
    <span className={className} style={style} dangerouslySetInnerHTML={{ __html: sanitizeHtml(value || '') }} />
);


// --- RSVP MODAL ---
interface RSVPModalProps {
    groomName: string;
    brideName: string;
    inviteData?: InvitationData;
    onClose: () => void;
    onSubmit: (payload: { id?:string; name: string; phone?: string; attending: string; guestCount?: number | null; message?: string; selectedEventIds?: string[] }) => Promise<boolean>;
}
export const RSVPModal: React.FC<RSVPModalProps> = ({ groomName, brideName, inviteData, onClose, onSubmit }) => {
    const [form, setForm] = useState({ name: '', phone: '', guests: '1', attending: 'yes', note: '' });
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [submitted, setSubmitted] = useState(false);
    // BUG-005 fix: submitting state to prevent double-tap / spam
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const responseId = useRef(newUuid());
    const inFlight = useRef(false);
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || inFlight.current) return;
        inFlight.current = true; setSubmitError('');
        // BUG-005 fix: set submitting state immediately
        setSubmitting(true);
        const attending = isMultiEvent ? (selectedEvents.length > 0 ? 'yes' : 'no') : form.attending;
        // BUG-014 fix: parse '5+' as 5 (store actual number, not the string)
        const rawGuests = form.guests === '5+' ? '5' : form.guests;
        const guestCount = attending === 'yes' ? (parseInt(rawGuests, 10) || 1) : null;
        try {
        const accepted = await onSubmit({
            id: responseId.current,
            name: form.name.trim(),
            phone: form.phone.trim() || undefined,
            attending,
            guestCount,
            message: (form.note.trim() || (form.guests === '5+' && attending === 'yes' ? '5+ người' : undefined)) || undefined,
            selectedEventIds: isMultiEvent ? selectedEvents : undefined,
        });
        if (!accepted) throw new Error('not acknowledged');
        setSubmitted(true);
        } catch { setSubmitError('Chưa gửi được phản hồi. Nội dung vẫn được giữ, bạn có thể thử lại.'); }
        finally { inFlight.current = false; setSubmitting(false); }
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
                    {submitError && <p role="alert" className="text-sm text-red-600">{submitError}</p>}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Họ tên *</label>
                        <input
                            className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-rose-400 outline-none"
                            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            placeholder="Nguyễn Văn A" aria-label="Họ tên" maxLength={100} required
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Số điện thoại</label>
                        <input
                            className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-rose-400 outline-none"
                            value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                            placeholder="0912 345 678" type="tel" maxLength={30}
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
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-rose-300/50 transition-all flex items-center justify-center gap-2 ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                        <Send className="w-4 h-4" /> {submitting ? 'Đang gửi...' : 'Xác nhận / Confirm'}
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
    onSubmit: (wish: GuestWish & { email?:string }) => Promise<boolean>;
}
export const GuestbookModal: React.FC<GuestbookModalProps> = ({ groomName, brideName, showEmail, onClose, onSubmit }) => {
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const responseId = useRef(newUuid());
    const inFlight = useRef(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.message.trim() || inFlight.current) return;
        inFlight.current = true; setSubmitting(true); setSubmitError('');
        try {
            const accepted = await onSubmit({ id: responseId.current, name: form.name.trim(),
                message: form.message.trim(), createdAt: new Date().toISOString(),
                ...(showEmail && form.email.trim() ? { email: form.email.trim() } : {}) });
            if (!accepted) throw new Error('not acknowledged');
            setSubmitted(true);
        } catch { setSubmitError('Chưa gửi được lời chúc. Nội dung vẫn được giữ, bạn có thể thử lại.'); }
        finally { inFlight.current = false; setSubmitting(false); }
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
                    {submitError && <p role="alert" className="text-sm text-red-600">{submitError}</p>}
                    {/* Name + Email row */}
                    <div className={showEmail ? 'grid grid-cols-2 gap-3' : ''}>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tên của bạn *</label>
                            <input
                                className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-amber-400 outline-none"
                                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Nguyễn Văn A" aria-label="Tên của bạn" maxLength={100} required
                            />
                        </div>
                        {showEmail && (
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">E-mail</label>
                                <input
                                    className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-amber-400 outline-none"
                                    value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    placeholder="email@..." type="email" maxLength={254}
                                />
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Lời chúc *</label>
                        <textarea
                            aria-label="Lời chúc"
                            className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-amber-400 outline-none resize-none h-28"
                            value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                            placeholder="Chúc cô dâu chú rể trăm năm hạnh phúc, sớm có con ..."
                            maxLength={300} required
                        />
                        <p className="text-[10px] text-gray-400 mt-1 text-right">{form.message.length}/300</p>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-amber-300/50 transition-all flex items-center justify-center gap-2">
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
    const isPlayingRef = useRef(false);
    const setPlayingState = (playing: boolean) => {
        isPlayingRef.current = playing;
        setIsPlaying(playing);
    };
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

                if (inviteData) {
                    // Validate musicUrl: if it points to a non-existent file, use a valid default
                    const VALID_AUDIO_PATHS = [
                        '/audio/a thousand years.mp3',
                        '/audio/Chăm Em Một Đời.mp3',
                        '/audio/Em Đồng Ý (I Do).mp3',
                        '/audio/Marry You.mp3',
                        '/audio/Die With A Smile.mp3',
                        '/audio/In Your Eyes.mp3',
                        '/audio/Lover (First Dance Remix).mp3',
                        '/audio/Lễ Đường.mp3',
                        '/audio/Ngày Này, Người Con Gái Này.mp3',
                        '/audio/Ordinary (Wedding Version).mp3',
                        '/audio/Summertime (Imanbek Remix).mp3',
                        '/audio/The Most Beautiful Bride In The World.mp3',
                        '/audio/một đời.mp3',
                        '/audio/50 Năm Về Sau (Nghĩ Đến Ngày Chúng Ta Sẽ Già).mp3',
                    ];
                    if (inviteData.musicUrl && !VALID_AUDIO_PATHS.includes(inviteData.musicUrl) && inviteData.musicUrl.startsWith('/audio/')) {
                        console.warn('[WedPlan] Invalid local musicUrl, using default:', inviteData.musicUrl);
                        inviteData = { ...inviteData, musicUrl: '/audio/a thousand years.mp3' };
                    }
                    setData(inviteData);

                    try {
                        const stored = localStorage.getItem(`wishes_${uid}`);
                        if (stored) setLocalWishes(JSON.parse(stored));
                    } catch { /* ignore */ }
                    // BUG-012 fix: only load wishes when guestbook is enabled
                    if (inviteData.guestbookEnabled) {
                        try {
                            const wishes = await loadPublicWishes(uid);
                            setCloudWishes(wishes.map(w => ({ id: w.id, name: w.name, message: w.message ?? '', createdAt: w.createdAt })));
                        } catch { /* ignore */ }
                    }
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

    // Lazily initialise the Audio element from musicUrl.
    // Returns null if the URL is absent or unsafe.
    const ensureAudio = (): HTMLAudioElement | null => {
        if (audioRef.current) return audioRef.current;
        if (!data?.musicUrl) return null;
        const safeUrl = sanitizeAudioUrl(data.musicUrl);
        if (!safeUrl) {
            console.warn('[WedPlan] Music URL blocked by sanitizer:', data.musicUrl);
            return null;
        }
        const audio = new Audio(safeUrl);
        audio.loop = true;
        audio.volume = 0.65;
        audio.preload = 'auto';
        // Fallback: if the stored URL returns 404 or fails to load, switch to default song
        const DEFAULT_SONG = '/audio/a%20thousand%20years.mp3';
        audio.onerror = () => {
            console.warn('[WedPlan] Primary audio failed, falling back to default song. URL was:', safeUrl);
            if (audioRef.current && audioRef.current.src !== window.location.origin + DEFAULT_SONG) {
                audioRef.current.src = DEFAULT_SONG;
                audioRef.current.load();
                // Use ref to avoid stale closure bug
                if (isPlayingRef.current) {
                    audioRef.current.play()
                        .then(() => setPlayingState(true))
                        .catch(() => {});
                }
            }
        };
        audioRef.current = audio;
        return audio;
    };


    const handleOpenInvite = () => {
        setIsOpened(true);
        if (data?.musicUrl) {
            const audio = ensureAudio();
            if (audio) {
                audio.play()
                    .then(() => setPlayingState(true))
                    .catch((err) => {
                        // Autoplay blocked — user must tap the vinyl button manually
                        console.info('[WedPlan] Autoplay blocked (expected on mobile):', err?.message);
                        // Still mark as "should play" so vinyl shows active state
                        setPlayingState(false);
                    });
            }
        }
    };

    const toggleMusic = () => {
        const audio = ensureAudio();
        if (!audio) return;
        if (isPlaying) {
            audio.pause();
            setPlayingState(false);
        } else {
            audio.play()
                .then(() => setPlayingState(true))
                .catch((err) => console.warn('[WedPlan] play() failed:', err?.message));
        }
    };


    const handleWishSubmit = async (wish: GuestWish & { email?:string }): Promise<boolean> => {
        const uid = new URLSearchParams(window.location.search).get('uid') || '';
        const accepted = await submitWish(uid, { id: wish.id, name: wish.name, message: wish.message, email: wish.email });
        if (!accepted) return false;
        const publicWish:GuestWish = { id:wish.id, name:wish.name, message:wish.message, createdAt:wish.createdAt };
        setLocalWishes(previous => {
            const updated = [publicWish, ...previous.filter(w => w.id !== wish.id)];
            try { localStorage.setItem(`wishes_${uid}`, JSON.stringify(updated)); } catch { /* storage unavailable */ }
            return updated;
        });
        return true;
    };
    const handleRSVPSubmit = (payload: { id?:string; name:string; phone?:string; attending:string; guestCount?:number|null; message?:string; selectedEventIds?:string[] }):Promise<boolean> => {
        const uid = new URLSearchParams(window.location.search).get('uid') || '';
        return submitRSVP(uid, payload);
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

        const hasPhoto = !!data.couplePhoto;

        return (
            <div className="fixed inset-0 z-50 overflow-hidden">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

                    /* ═══════════════════════════════════════════════════
                       ENVELOPE SCREEN — BRIGHT RED & CHERRY BLOSSOM
                    ═══════════════════════════════════════════════════ */

                    /* ── Page background: pure white ── */
                    .eb-bg {
                        position: fixed; inset: 0;
                        background: #ffffff;
                    }

                    /* ── Blurred couple photo backdrop (bright, not dark) ── */
                    .eb-bg-photo {
                        position: absolute; inset: 0;
                        background-size: cover; background-position: center;
                        filter: blur(30px) brightness(0.85) saturate(0.9);
                        transform: scale(1.06);
                    }

                    /* ── Light white overlay on photo (keeps it bright) ── */
                    .eb-bg-overlay {
                        position: absolute; inset: 0;
                        background: linear-gradient(160deg,
                            rgba(255,255,255,0.55) 0%,
                            rgba(255,240,245,0.35) 50%,
                            rgba(255,255,255,0.5) 100%
                        );
                    }

                    /* ── Soft orbs ── */
                    .eb-orb-white {
                        position: absolute; border-radius: 50%;
                        pointer-events: none; filter: blur(80px);
                    }

                    /* ── Falling red hearts ── */
                    @keyframes eb-heart {
                        0%   { transform: translateY(-8vh) translateX(0) rotate(0deg) scale(1); opacity: 0; }
                        8%   { opacity: 1; }
                        50%  { transform: translateY(50vh) translateX(var(--drift,30px)) rotate(var(--spin,180deg)) scale(var(--s2,1.1)); }
                        92%  { opacity: 0.7; }
                        100% { transform: translateY(108vh) translateX(var(--drift,50px)) rotate(var(--spin,360deg)) scale(0.8); opacity: 0; }
                    }
                    .eb-heart {
                        position: absolute; top: -5%;
                        pointer-events: none;
                        animation: eb-heart var(--dur,9s) var(--delay,0s) linear infinite;
                        color: #E8000D;
                        filter: drop-shadow(0 2px 6px rgba(232,0,13,0.45));
                    }

                    /* ── Red sparkle ── */
                    @keyframes eb-twinkle {
                        0%,100% { opacity:0; transform:scale(0.3) rotate(0deg); }
                        50%     { opacity:0.9; transform:scale(1) rotate(180deg); }
                    }
                    .eb-sparkle {
                        position:absolute; pointer-events:none;
                        animation: eb-twinkle var(--dur,3s) var(--delay,0s) ease-in-out infinite;
                        color: #E8000D;
                        filter: drop-shadow(0 1px 4px rgba(232,0,13,0.4));
                    }

                    /* ── Card float ── */
                    @keyframes eb-float {
                        0%,100% { transform: translateY(0px) rotate(0deg); }
                        33%     { transform: translateY(-7px) rotate(0.25deg); }
                        66%     { transform: translateY(-11px) rotate(-0.25deg); }
                    }
                    .eb-float { animation: eb-float 5s ease-in-out infinite; }

                    /* ── Card entry ── */
                    @keyframes eb-in {
                        0%   { opacity:0; transform: translateY(36px) scale(0.94); }
                        100% { opacity:1; transform: translateY(0) scale(1); }
                    }
                    .eb-card { animation: eb-in 0.85s 0.1s cubic-bezier(0.22,1,0.36,1) both; }

                    /* ── Staggered content ── */
                    @keyframes eb-fade {
                        0%   { opacity:0; transform: translateY(12px); }
                        100% { opacity:1; transform: translateY(0); }
                    }
                    .eb-1 { animation: eb-fade 0.65s 0.35s ease-out both; }
                    .eb-2 { animation: eb-fade 0.65s 0.5s ease-out both; }
                    .eb-3 { animation: eb-fade 0.65s 0.65s ease-out both; }
                    .eb-4 { animation: eb-fade 0.65s 0.8s ease-out both; }
                    .eb-5 { animation: eb-fade 0.65s 0.95s ease-out both; }

                    /* ── Pulse rings ── */
                    @keyframes eb-ring {
                        0%   { transform: scale(1); opacity: 0.55; }
                        100% { transform: scale(2.8); opacity: 0; }
                    }
                    .eb-ring { animation: eb-ring 2.6s ease-out infinite; border-radius: 50%; }

                    /* ── Button shimmer ── */
                    @keyframes eb-shimmer {
                        0%   { left: -60%; }
                        100% { left: 140%; }
                    }
                    .eb-btn { position: relative; overflow: hidden; cursor: pointer; }
                    .eb-btn::after {
                        content: ''; position: absolute;
                        top: 0; left: -60%; width: 40%; height: 100%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
                        transform: skewX(-15deg);
                        animation: eb-shimmer 2.8s 1.0s ease-in-out infinite;
                    }

                    /* ── Envelope icon bounce ── */
                    @keyframes eb-bounce-icon {
                        0%,100% { transform: translateY(0) scale(1); }
                        40%     { transform: translateY(-5px) scale(1.06); }
                        70%     { transform: translateY(2px) scale(0.97); }
                    }
                    .eb-icon-bounce { animation: eb-bounce-icon 3s ease-in-out infinite; }

                    /* ── Divider — red tint ── */
                    .eb-divider {
                        height: 1px;
                        background: linear-gradient(90deg, transparent, rgba(200,0,10,0.3), transparent);
                    }

                    /* ── Name font — DARK RED, BOLD, HIGH CONTRAST ── */
                    .eb-name {
                        font-family: 'Great Vibes', cursive;
                        white-space: nowrap;
                        line-height: 1.2;
                        display: block;
                        color: #7B0000;
                        -webkit-text-stroke: 0.5px #5a0000;
                        text-shadow:
                            /* Strong white halo for contrast against pink bg */
                            0 0 8px rgba(255,255,255,1),
                            0 0 16px rgba(255,255,255,0.9),
                            2px 0 0 rgba(255,255,255,0.8),
                            -2px 0 0 rgba(255,255,255,0.8),
                            0 2px 0 rgba(255,255,255,0.8),
                            0 -2px 0 rgba(255,255,255,0.8),
                            /* Red glow underneath */
                            0 4px 16px rgba(139,0,0,0.4),
                            0 8px 32px rgba(139,0,0,0.2);
                        paint-order: stroke fill;
                    }
                    .eb-name-photo {
                        font-family: 'Great Vibes', cursive;
                        white-space: nowrap;
                        line-height: 1.2;
                        display: block;
                        color: #6B0000;
                        -webkit-text-stroke: 0.5px #4a0000;
                        text-shadow:
                            0 0 10px rgba(255,255,255,0.95),
                            0 0 20px rgba(255,255,255,0.8),
                            2px 0 0 rgba(255,255,255,0.7),
                            -2px 0 0 rgba(255,255,255,0.7),
                            0 4px 16px rgba(139,0,0,0.35);
                    }
                    .eb-label {
                        font-family: 'Cormorant Garamond', 'Times New Roman', serif;
                        letter-spacing: 0.22em;
                        font-weight: 700;
                    }

                    /* ── Corner floral pulse ── */
                    @keyframes eb-corner-pulse {
                        0%,100% { opacity: 0.4; transform: scale(1); }
                        50%     { opacity: 0.9; transform: scale(1.12); }
                    }
                    .eb-corner { animation: eb-corner-pulse 4s ease-in-out infinite; }
                `}</style>

                {/* ── Page Background: pure white ── */}
                <div className="eb-bg" />
                {hasPhoto && (
                    <>
                        <div className="eb-bg-photo" style={{ backgroundImage: `url(${data.couplePhoto})` }} />
                        <div className="eb-bg-overlay" />
                    </>
                )}

                {/* White/pink soft orbs — always shown for brightness */}
                <div className="eb-orb-white" style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(242,189,214,0.38) 0%, transparent 70%)', top: '-20%', left: '-15%' }} aria-hidden />
                <div className="eb-orb-white" style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(242,205,223,0.3) 0%, transparent 70%)', bottom: '-15%', right: '-12%' }} aria-hidden />
                <div className="eb-orb-white" style={{ width: 350, height: 350, background: 'radial-gradient(circle, rgba(232,0,13,0.06) 0%, transparent 70%)', top: '30%', right: '5%' }} aria-hidden />
                <div className="eb-orb-white" style={{ width: 280, height: 280, background: 'radial-gradient(circle, rgba(255,182,193,0.3) 0%, transparent 70%)', top: '60%', left: '3%' }} aria-hidden />

                {/* Petals */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                    {petalData.map((p, i) => (
                        <span
                            key={i}
                            className="eb-heart select-none"
                            style={{
                                left: `${p.left}%`,
                                fontSize: `${p.size * 0.7}px`,
                                '--dur': `${p.dur}s`,
                                '--delay': `${p.delay}s`,
                                '--drift': `${p.drift}px`,
                                '--spin': `${p.spin}deg`,
                                '--s2': `${0.9 + Math.random() * 0.3}`,
                                opacity: hasPhoto ? 0.7 : 0.85,
                            } as React.CSSProperties}
                        >
                            ❤
                        </span>
                    ))}
                </div>

                {/* ── Red sparkle stars ── */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
                    {sparkleData.map((s, i) => (
                        <span
                            key={`s${i}`}
                            className="eb-sparkle select-none"
                            style={{
                                left: `${s.left}%`,
                                top: `${s.top}%`,
                                fontSize: `${s.fontSize * 0.9}px`,
                                '--dur': `${s.dur}s`,
                                '--delay': `${s.delay}s`,
                            } as React.CSSProperties}
                        >
                            ✦
                        </span>
                    ))}
                </div>

                {/* ── Corner florals (red) ── */}
                <div className="absolute top-5 left-5 pointer-events-none select-none eb-corner" style={{ color: 'rgba(232,0,13,0.35)', fontSize: '2rem', fontFamily: 'serif' }} aria-hidden>❦</div>
                <div className="absolute top-5 right-5 pointer-events-none select-none eb-corner" style={{ color: 'rgba(232,0,13,0.35)', fontSize: '2rem', fontFamily: 'serif', transform: 'scaleX(-1)', animationDelay: '1.5s' }} aria-hidden>❦</div>
                <div className="absolute bottom-5 left-5 pointer-events-none select-none eb-corner" style={{ color: 'rgba(242,189,214,0.6)', fontSize: '1.4rem', animationDelay: '0.8s' }} aria-hidden>✿</div>
                <div className="absolute bottom-5 right-5 pointer-events-none select-none eb-corner" style={{ color: 'rgba(242,189,214,0.6)', fontSize: '1.4rem', animationDelay: '2.2s' }} aria-hidden>✿</div>

                {/* ── Main card ── */}
                <div className="relative z-10 flex items-center justify-center min-h-screen px-5 py-8">
                    <div
                        className="eb-card eb-float w-full flex flex-col items-center text-center"
                        style={{
                            maxWidth: 390,
                            /* Cherry blossom pink — always bright, regardless of photo */
                            background: 'linear-gradient(160deg, #F2CEDF 0%, #F2BDD6 38%, #F29BC4 75%, rgba(242,119,187,0.5) 100%)',
                            backdropFilter: hasPhoto ? 'blur(16px) saturate(1.5)' : 'blur(4px)',
                            WebkitBackdropFilter: hasPhoto ? 'blur(16px) saturate(1.5)' : 'blur(4px)',
                            border: '2px solid rgba(255,255,255,0.7)',
                            borderRadius: 32,
                            padding: '40px 36px 36px',
                            boxShadow: '0 24px 80px rgba(200,0,10,0.18), 0 8px 40px rgba(242,155,196,0.55), 0 2px 0 rgba(255,255,255,0.9) inset',
                        }}
                    >
                        {/* ── Red envelope icon ── */}
                        <div className="mb-6 relative eb-1 eb-icon-bounce">
                            {/* Pulse rings — red */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-20 h-20 eb-ring" style={{ border: '1.5px solid rgba(232,0,13,0.4)' }} />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-20 h-20 eb-ring" style={{ border: '1.5px solid rgba(232,0,13,0.22)', animationDelay: '0.9s' }} />
                            </div>

                            {/* Envelope box — vivid red */}
                            <div
                                className="w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden"
                                style={{
                                    background: hasPhoto
                                        ? 'linear-gradient(135deg, rgba(232,0,13,0.85), rgba(180,0,10,0.75))'
                                        : 'linear-gradient(135deg, #FF1A1A 0%, #E8000D 55%, #BB0008 100%)',
                                    border: '2px solid rgba(255,255,255,0.5)',
                                    boxShadow: '0 8px 32px rgba(200,0,10,0.55), 0 3px 12px rgba(0,0,0,0.2), 0 1px 0 rgba(255,150,150,0.5) inset',
                                }}
                            >
                                <Mail
                                    className="w-9 h-9 relative z-10"
                                    style={{ color: '#ffffff', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
                                />
                            </div>

                            {/* Red heart badge */}
                            <Heart
                                className="absolute -top-2 -right-2 w-5 h-5 fill-current"
                                style={{
                                    color: '#E8000D',
                                    filter: 'drop-shadow(0 2px 6px rgba(232,0,13,0.65))',
                                    animation: 'pulse 1.8s ease-in-out infinite',
                                }}
                            />
                        </div>

                        {/* ── Greeting label ── */}

                        {/* ── Names ── */}
                        {(data.groomName || data.brideName) ? (
                            <div className="eb-2 mb-1 w-full">
                                <p className="eb-label mb-4" style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 700,
                                    color: '#111111',
                                    letterSpacing: '0.18em',
                                    textShadow: '0 1px 0 rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.7)',
                                    lineHeight: 1.6,
                                }}>TRÂN TRỌNG KÍNH MỜI QUÝ VỊ KHÁCH QUÝ</p>

                                    <div style={{ fontSize: 'clamp(1.7rem, 9vw, 2.5rem)' }}>
                                        <span className={hasPhoto ? 'eb-name-photo' : 'eb-name'}>
                                            <RichField value={data.groomName} />
                                        </span>
                                        <span
                                            className="block my-0.5 select-none"
                                            style={{
                                                fontFamily: 'Cormorant Garamond, serif',
                                                fontStyle: 'italic',
                                                fontWeight: 700,
                                                fontSize: '1.1rem',
                                                color: '#1a1a1a',
                                                textShadow: '0 1px 0 rgba(255,255,255,0.8)',
                                            }}
                                        >
                                            &
                                        </span>
                                        <span className={hasPhoto ? 'eb-name-photo' : 'eb-name'}>
                                            <RichField value={data.brideName} />
                                        </span>
                                    </div>
                            </div>
                        ) : (
                            <p className="eb-name eb-2 mb-1" style={{ fontSize: '2rem' }}>Thiệp Mời Của Bạn</p>
                        )}

                        {/* ── Date — large & prominent ── */}
                        {wDate && (
                            <div className="flex items-center gap-3 mt-5 mb-6 eb-3 w-full">
                                <div className="flex-1" style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(139,0,0,0.6), transparent)' }} />
                                <p className="eb-label whitespace-nowrap" style={{
                                    fontSize: '1.05rem',
                                    color: '#7B0000',
                                    textShadow: '0 0 12px rgba(255,255,255,0.9), 0 2px 0 rgba(255,255,255,0.8)',
                                    fontWeight: 800,
                                    letterSpacing: '0.25em',
                                    padding: '4px 12px',
                                }}>
                                    {wDate}
                                </p>
                                <div className="flex-1" style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(139,0,0,0.6), transparent)' }} />
                            </div>
                        )}



                        {/* ── CTA Button — vivid red ── */}
                        <button
                            type="button"
                            onClick={handleOpenInvite}
                            className="eb-btn eb-5 w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl transition-all active:scale-[0.97] hover:brightness-110"
                            style={{
                                background: 'linear-gradient(135deg, #FF1A1A 0%, #E8000D 50%, #CC0000 100%)',
                                color: '#ffffff',
                                fontFamily: 'Cormorant Garamond, serif',
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                letterSpacing: '0.2em',
                                border: '1.5px solid rgba(255,120,120,0.35)',
                                boxShadow: '0 6px 28px rgba(200,0,10,0.55), 0 2px 8px rgba(200,0,10,0.3), 0 1px 0 rgba(255,150,150,0.4) inset',
                            }}
                        >
                            <MailOpen style={{ width: 18, height: 18, flexShrink: 0 }} />
                            <span>MỞ THIỆP NGAY</span>
                        </button>

                        {/* ── WedPlan AI Ad ── */}
                        <p className="mt-4 eb-5 eb-label text-center select-none" style={{
                            fontSize: '0.6rem',
                            color: '#5a0000',
                            textShadow: '0 1px 0 rgba(255,255,255,0.85)',
                            letterSpacing: '0.08em',
                            lineHeight: 1.8,
                        }}>
                            Tạo thiệp cưới của bạn tại{' '}
                            <a
                                href="https://wedplanai.io.vn"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#CC0000',
                                    fontWeight: 700,
                                    textDecoration: 'underline',
                                    textUnderlineOffset: '2px',
                                }}
                            >
                                wedplanai.io.vn
                            </a>
                        </p>
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
                    hideAudio={true}
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
                    groomName={stripHtml(data.groomName)}
                    brideName={stripHtml(data.brideName)}
                    inviteData={data}
                    onClose={() => setShowRSVP(false)}
                    onSubmit={handleRSVPSubmit}
                />
            )}
            {showGuestbook && (
                <GuestbookModal
                    groomName={stripHtml(data.groomName)}
                    brideName={stripHtml(data.brideName)}
                    showEmail={!!data.guestbookEmailEnabled}
                    onClose={() => setShowGuestbook(false)}
                    onSubmit={handleWishSubmit}
                />
            )}
        </div>
    );
};

export default PublicInvitationView;
