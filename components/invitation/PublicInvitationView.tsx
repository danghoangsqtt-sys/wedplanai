
import React, { useEffect, useState, useRef } from 'react';
import { loadPublicInvitation } from '../../services/cloudService';
import { InvitationData } from '../../types';
import InvitationPreview from './InvitationPreview';
import { Loader2, AlertCircle, MailOpen, Music, Volume2, VolumeX, Heart, Mail } from 'lucide-react';

const PublicInvitationView: React.FC = () => {
    const [data, setData] = useState<InvitationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isOpened, setIsOpened] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
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
                } else {
                    setError("Không tìm thấy thiệp mời này hoặc thiệp chưa được tạo.");
                }
            } catch (err) {
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
            audioRef.current.play().catch(e => console.log("Audio play failed", e));
            setIsPlaying(true);
        }
    };

    const toggleMusic = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
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
                {/* Animated Background Elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-200/20 blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-200/20 blur-3xl animate-pulse delay-700"></div>

                <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center border border-rose-100 relative overflow-hidden group hover:scale-105 transition-transform duration-500">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 via-pink-500 to-rose-400"></div>

                    <div className="mb-8 mt-4 relative">
                        <div className="w-28 h-28 bg-rose-50 rounded-full flex items-center justify-center mx-auto shadow-inner group-hover:bg-rose-100 transition-colors">
                            <Mail className="w-12 h-12 text-rose-500" />
                        </div>
                        <Heart className="w-6 h-6 text-pink-500 absolute top-0 right-[25%] animate-bounce delay-100 fill-current" />
                    </div>

                    <h2 className="text-2xl font-serif font-bold text-gray-800 mb-2">Thiệp Hồng Trao Tay</h2>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                        Trân trọng kính mời bạn đến tham dự lễ thành hôn của chúng tôi<br />
                        <strong className="text-rose-600 text-lg font-serif block mt-2">{data.groomName} & {data.brideName}</strong>
                    </p>

                    <button
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

    return (
        <div className="min-h-screen bg-gray-200 flex justify-center relative">
            {/* Music Control */}
            {data.musicUrl && (
                <button
                    onClick={toggleMusic}
                    className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-white/80 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-rose-600 hover:scale-110 transition-transform border border-rose-200"
                    title={isPlaying ? "Tắt nhạc" : "Bật nhạc"}
                >
                    {isPlaying ? <Volume2 className="w-6 h-6 animate-pulse" /> : <VolumeX className="w-6 h-6 text-gray-400" />}
                </button>
            )}

            <div className="w-full max-w-md bg-white shadow-2xl min-h-screen relative">
                <InvitationPreview data={data} />
            </div>
        </div>
    );
};

export default PublicInvitationView;
