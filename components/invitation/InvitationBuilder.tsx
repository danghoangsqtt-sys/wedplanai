import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
    Heart, Download, Eye,
    Info, Palette, Camera, Sparkles,
    ZoomIn, RefreshCw, Wand2, Upload, Trash2, Loader2, Image as ImageIcon
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { BankInfo } from '../../types';
import { storage, auth } from '../../lib/firebase'; // Thêm auth để kiểm tra session
import * as Storage from 'firebase/storage';
import { generateWeddingSticker } from '../../services/aiService';

// Danh sách ngân hàng phổ biến cho VietQR
const BANKS = [
    { id: 'MB', name: 'MB Bank' },
    { id: 'VCB', name: 'Vietcombank' },
    { id: 'ICB', name: 'VietinBank' },
    { id: 'BIDV', name: 'BIDV' },
    { id: 'TCB', name: 'Techcombank' },
    { id: 'VPB', name: 'VPBank' },
    { id: 'ACB', name: 'ACB' },
    { id: 'TPB', name: 'TPBank' },
];

const PRESET_GROOMS = ["Felix", "Aneka", "Jack", "Jerry", "Callum", "Pat", "Oliver", "Leo", "Max", "Sam", "Alex", "Micah", "Nolan"];
const PRESET_BRIDES = ["Molly", "Aneka", "Lilly", "Annie", "Zoe", "Sophia", "Lily", "Mia", "Ruby", "Ella", "Avery", "Sara", "Leah"];

const InvitationBuilder: React.FC = () => {
    const { invitation, updateInvitation, user, addNotification } = useStore();
    const [activeTab, setActiveTab] = useState<'INFO' | 'BANK' | 'DESIGN'>('INFO');
    const marketingCardRef = useRef<HTMLDivElement>(null);

    // AI Gen State
    const [generatingAction, setGeneratingAction] = useState<string | null>(null);
    const [promptDesc, setPromptDesc] = useState(invitation.sticker.styleDescription || "Tóc đen, đồ cưới truyền thống Việt Nam, màu đỏ vàng, chibi cute.");
    const groomFileRef = useRef<HTMLInputElement>(null);
    const brideFileRef = useRef<HTMLInputElement>(null);

    // Initial load check
    useEffect(() => {
        if (!invitation.groomName && user?.displayName) {
            updateInvitation({ groomName: user.displayName });
        }
        if (!invitation.sticker) {
            updateInvitation({ sticker: { groom: "Felix", bride: "Aneka", mode: 'BASIC' } });
        }
    }, []);

    const handleInputChange = (field: string, value: any) => {
        updateInvitation({ [field]: value });
    };

    const handleBankChange = (field: keyof BankInfo, value: any) => {
        updateInvitation({
            bankInfo: { ...invitation.bankInfo, [field]: value }
        });
    };

    const handleStickerChange = (type: 'groom' | 'bride', value: string) => {
        updateInvitation({
            sticker: {
                ...invitation.sticker,
                [type]: value,
                mode: 'BASIC'
            }
        });
    };

    const randomizeSticker = (type: 'groom' | 'bride') => {
        const randomSeed = Math.random().toString(36).substring(7);
        handleStickerChange(type, randomSeed);
    };

    const downloadMarketingCard = async () => {
        if (!marketingCardRef.current) return;
        try {
            const canvas = await html2canvas(marketingCardRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: null
            });
            const link = document.createElement('a');
            link.download = `thiep-cuoi-${user!.uid || 'guest'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            addNotification('SUCCESS', 'Đã tải ảnh thiệp về máy!');
        } catch (err) {
            console.error(err);
            alert("Lỗi khi tạo ảnh. Vui lòng thử lại.");
        }
    };

    // --- AI AVATAR LOGIC (ĐÃ NÂNG CẤP) ---

    const handleFaceUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'groom' | 'bride') => {
        const file = e.target.files?.[0];

        // 1. Kiểm tra File & User Local
        if (!file || !user) return;

        // 2. [FIX CRITICAL] Kiểm tra kết nối Firebase thực tế
        if (!auth.currentUser) {
            alert("⚠️ Lỗi phiên đăng nhập: Kết nối đến server bị ngắt quãng.\n\nHãy tải lại trang (F5) hoặc Đăng xuất rồi Đăng nhập lại để khắc phục.");
            return;
        }

        try {
            // [FIX EXTENSION] Lấy đuôi file (ví dụ .png, .jpg) để tránh lỗi định dạng
            const fileExt = file.name.split('.').pop() || 'png';
            const fileName = `${type}_${Date.now()}.${fileExt}`;

            // Sử dụng auth.currentUser.uid để đảm bảo trùng khớp với Rules
            const currentUserId = auth.currentUser.uid;
            const storageRef = Storage.ref(storage, `ai_faces/${currentUserId}/${fileName}`);

            // Thêm metadata để server nhận diện đúng loại file
            const metadata = {
                contentType: file.type,
            };

            // Thực hiện Upload
            addNotification('INFO', 'Đang tải ảnh lên...');
            const snapshot = await Storage.uploadBytes(storageRef, file, metadata);
            const url = await Storage.getDownloadURL(snapshot.ref);

            updateInvitation({
                sticker: {
                    ...invitation.sticker,
                    [`${type}FaceUrl`]: url
                }
            });
            addNotification('SUCCESS', `Đã tải ảnh ${type === 'groom' ? 'Chú Rể' : 'Cô Dâu'} thành công!`);

        } catch (err: any) {
            console.error("Upload Failed:", err);

            // Xử lý thông báo lỗi thân thiện
            if (err.code === 'storage/unauthorized') {
                alert(`⛔ Lỗi quyền truy cập (403 Forbidden)\n\nNguyên nhân: Server từ chối bạn ghi vào thư mục này.\nGiải pháp: Hãy Đăng xuất và Đăng nhập lại tài khoản Google của bạn.`);
            } else if (err.code === 'storage/canceled') {
                addNotification('WARNING', 'Đã hủy tải lên.');
            } else {
                alert(`Lỗi không xác định: ${err.message}`);
            }
        } finally {
            // Reset input để cho phép chọn lại cùng 1 file nếu cần
            if (e.target) e.target.value = '';
        }
    };

    const urlToBase64 = async (url: string): Promise<string | undefined> => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Error converting image:", e);
            return undefined;
        }
    };

    const handleGenerateSticker = async (action: string, actionKey: string) => {
        if (!user || !auth.currentUser) {
            alert("Vui lòng đăng nhập lại để sử dụng tính năng AI.");
            return;
        }

        setGeneratingAction(actionKey);
        try {
            const groomRef = invitation.sticker.groomFaceUrl ? await urlToBase64(invitation.sticker.groomFaceUrl) : undefined;
            const brideRef = invitation.sticker.brideFaceUrl ? await urlToBase64(invitation.sticker.brideFaceUrl) : undefined;

            const base64Image = await generateWeddingSticker(
                user,
                promptDesc,
                action,
                { groom: groomRef, bride: brideRef }
            );

            // Upload kết quả sticker lên Storage
            const res = await fetch(base64Image);
            const blob = await res.blob();

            const currentUserId = auth.currentUser.uid;
            // [FIX EXTENSION] Sticker AI luôn là PNG
            const storageRef = Storage.ref(storage, `ai_stickers/${currentUserId}/${actionKey}_${Date.now()}.png`);

            const metadata = { contentType: 'image/png' };
            const snapshot = await Storage.uploadBytes(storageRef, blob, metadata);
            const downloadUrl = await Storage.getDownloadURL(snapshot.ref);

            updateInvitation({
                sticker: {
                    ...invitation.sticker,
                    mode: 'AI_GEN',
                    styleDescription: promptDesc,
                    stickerPack: {
                        ...invitation.sticker.stickerPack,
                        [actionKey]: downloadUrl,
                        ...(actionKey === 'main' ? { main: downloadUrl } : {})
                    }
                }
            });
            addNotification('SUCCESS', `Đã tạo sticker: ${action}`);

        } catch (err: any) {
            console.error(err);
            alert(`Lỗi tạo ảnh: ${err.message}`);
        } finally {
            setGeneratingAction(null);
        }
    };

    const publicLink = `${window.location.origin}/?view=invitation&uid=${user?.uid || 'guest'}`;
    const getAvatarUrl = (seed: string) => `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&scale=120&backgroundColor=transparent`;

    return (
        <div className="h-full flex flex-col bg-[#FDF2F8]">
            {/* Header */}
            <div className="p-4 md:p-6 bg-white border-b border-rose-100 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Heart className="w-6 h-6 text-rose-500 fill-current animate-pulse" />
                        Thiệp Mời Online
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Tạo thiệp, QR mừng cưới & Sticker cặp đôi.</p>
                </div>
                <div className="flex gap-2">
                    <a
                        href={publicLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-50 transition-colors"
                    >
                        <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Xem trang khách</span>
                    </a>
                    <button
                        onClick={downloadMarketingCard}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 shadow-md transition-colors"
                    >
                        <Download className="w-4 h-4" /> <span className="hidden sm:inline">Tải ảnh thiệp</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                {/* LEFT: Controls */}
                <div className="w-full lg:w-[500px] bg-white border-r border-rose-100 flex flex-col h-full overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        <button onClick={() => setActiveTab('INFO')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'INFO' ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Thông Tin</button>
                        <button onClick={() => setActiveTab('BANK')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'BANK' ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Ngân Hàng</button>
                        <button onClick={() => setActiveTab('DESIGN')} className={`flex-1 py-3 text-sm font-bold border-b-2 flex items-center justify-center gap-1 ${activeTab === 'DESIGN' ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
                            <Sparkles className="w-3.5 h-3.5" /> AVATAR AI
                        </button>
                    </div>

                    {/* Scrollable Form Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">

                        {activeTab === 'INFO' && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Chú Rể</label>
                                        <input className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm" value={invitation.groomName} onChange={e => handleInputChange('groomName', e.target.value)} placeholder="Tên Chú Rể" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Cô Dâu</label>
                                        <input className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm" value={invitation.brideName} onChange={e => handleInputChange('brideName', e.target.value)} placeholder="Tên Cô Dâu" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Ngày Cưới</label>
                                        <input type="date" className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm" value={invitation.date} onChange={e => handleInputChange('date', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Giờ Đón Khách</label>
                                        <input type="time" className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm" value={invitation.time} onChange={e => handleInputChange('time', e.target.value)} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Địa điểm (Tên nhà hàng/Tư gia)</label>
                                    <input className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm" value={invitation.location} onChange={e => handleInputChange('location', e.target.value)} placeholder="VD: Trung tâm tiệc cưới White Palace" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Địa chỉ chi tiết</label>
                                    <textarea rows={2} className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm resize-none" value={invitation.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="Số 123 Đường ABC, Phường XYZ..." />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Link Google Maps</label>
                                    <input className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm" value={invitation.mapLink} onChange={e => handleInputChange('mapLink', e.target.value)} placeholder="https://maps.app.goo.gl/..." />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Lời Nhắn / Lời Mời</label>
                                    <textarea rows={3} className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm resize-none" value={invitation.wishes} onChange={e => handleInputChange('wishes', e.target.value)} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'BANK' && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700">
                                    <Info className="w-4 h-4 inline mr-1" />
                                    Thông tin này sẽ tạo mã QR tự động giúp khách mời chuyển khoản dễ dàng.
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Ngân hàng</label>
                                    <select
                                        className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm bg-white"
                                        value={invitation.bankInfo.bankId}
                                        onChange={e => handleBankChange('bankId', e.target.value)}
                                    >
                                        <option value="">-- Chọn ngân hàng --</option>
                                        {BANKS.map(b => <option key={b.id} value={b.id}>{b.name} ({b.id})</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Số tài khoản</label>
                                    <input className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm font-mono" value={invitation.bankInfo.accountNumber} onChange={e => handleBankChange('accountNumber', e.target.value)} placeholder="0123456789" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Tên chủ tài khoản (Không dấu)</label>
                                    <input className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm uppercase" value={invitation.bankInfo.accountName} onChange={e => handleBankChange('accountName', e.target.value.toUpperCase())} placeholder="NGUYEN VAN A" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'DESIGN' && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* MODE SWITCH */}
                                <div className="flex bg-gray-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => updateInvitation({ sticker: { ...invitation.sticker, mode: 'BASIC' } })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${invitation.sticker.mode === 'BASIC' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        Cơ bản (Icon)
                                    </button>
                                    <button
                                        onClick={() => updateInvitation({ sticker: { ...invitation.sticker, mode: 'AI_GEN' } })}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${invitation.sticker.mode === 'AI_GEN' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        <Sparkles className="w-3 h-3" /> Nâng cao (AI Sticker)
                                    </button>
                                </div>

                                {/* AI MODE CONTENT */}
                                {invitation.sticker.mode === 'AI_GEN' ? (
                                    <div className="space-y-5">
                                        <div className="bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-xl border border-rose-100">
                                            <h4 className="text-sm font-bold text-rose-800 mb-3 flex items-center gap-2"><Camera className="w-4 h-4" /> 1. Upload Khuôn Mặt</h4>
                                            <div className="flex gap-4">
                                                <div className="flex-1 flex flex-col items-center gap-2">
                                                    <div
                                                        className="w-16 h-16 rounded-full bg-white border-2 border-dashed border-rose-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-rose-500 relative"
                                                        onClick={() => groomFileRef.current?.click()}
                                                    >
                                                        {invitation.sticker.groomFaceUrl ? (
                                                            <img src={invitation.sticker.groomFaceUrl} className="w-full h-full object-cover" />
                                                        ) : <Upload className="w-5 h-5 text-rose-300" />}
                                                        <input type="file" ref={groomFileRef} className="hidden" accept="image/*" onChange={(e) => handleFaceUpload(e, 'groom')} />
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-600">Chú Rể</span>
                                                </div>
                                                <div className="flex-1 flex flex-col items-center gap-2">
                                                    <div
                                                        className="w-16 h-16 rounded-full bg-white border-2 border-dashed border-rose-300 flex items-center justify-center overflow-hidden cursor-pointer hover:border-rose-500 relative"
                                                        onClick={() => brideFileRef.current?.click()}
                                                    >
                                                        {invitation.sticker.brideFaceUrl ? (
                                                            <img src={invitation.sticker.brideFaceUrl} className="w-full h-full object-cover" />
                                                        ) : <Upload className="w-5 h-5 text-rose-300" />}
                                                        <input type="file" ref={brideFileRef} className="hidden" accept="image/*" onChange={(e) => handleFaceUpload(e, 'bride')} />
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-600">Cô Dâu</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Palette className="w-4 h-4" /> 2. Mô Tả Phong Cách</h4>
                                            <textarea
                                                className="w-full p-3 rounded-xl border border-gray-200 text-sm focus:border-rose-500 outline-none resize-none bg-gray-50 h-24"
                                                placeholder="VD: Tóc chú rể vuốt ngược, mặc vest đen. Cô dâu tóc dài xoăn nhẹ, váy cưới trắng trễ vai. Phong cách Chibi cute, má hồng."
                                                value={promptDesc}
                                                onChange={(e) => setPromptDesc(e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Wand2 className="w-4 h-4" /> 3. Tạo Sticker Hành Động</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { key: 'main', label: 'Ảnh Chính', prompt: 'Standing together holding hands, romantic' },
                                                    { key: 'kiss', label: 'Hôn nhau', prompt: 'Kissing romantically' },
                                                    { key: 'hug', label: 'Ôm nhau', prompt: 'Hugging tightly, cute' },
                                                    { key: 'dance', label: 'Khiêu vũ', prompt: 'Dancing happily' },
                                                    { key: 'cheers', label: 'Cụng ly', prompt: 'Holding champagne glasses, cheers' },
                                                    { key: 'proposal', label: 'Cầu hôn', prompt: 'Groom kneeling proposing with ring' }
                                                ].map((action) => (
                                                    <div key={action.key} className="relative group">
                                                        <button
                                                            onClick={() => handleGenerateSticker(action.prompt, action.key)}
                                                            disabled={!!generatingAction}
                                                            className="w-full p-3 rounded-xl border border-gray-200 hover:border-rose-400 hover:bg-rose-50 transition-all flex flex-col items-center gap-2 relative overflow-hidden"
                                                        >
                                                            {invitation.sticker.stickerPack?.[action.key as keyof typeof invitation.sticker.stickerPack] ? (
                                                                <img
                                                                    src={invitation.sticker.stickerPack[action.key as keyof typeof invitation.sticker.stickerPack]}
                                                                    className="w-full h-24 object-contain"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-24 bg-gray-50 flex items-center justify-center text-gray-300">
                                                                    <ImageIcon className="w-8 h-8" />
                                                                </div>
                                                            )}
                                                            <span className="text-xs font-bold text-gray-700">{action.label}</span>

                                                            {generatingAction === action.key && (
                                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                                    <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* BASIC MODE CONTENT */
                                    <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2 mb-3">
                                            <Palette className="w-4 h-4 text-indigo-500" />
                                            Chọn Avatar (DiceBear)
                                        </h3>

                                        {/* GROOM SELECTOR */}
                                        <div className="mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Chú Rể</label>
                                                <button onClick={() => randomizeSticker('groom')} className="text-xs text-indigo-600 flex items-center gap-1 hover:underline"><RefreshCw className="w-3 h-3" /> Ngẫu nhiên</button>
                                            </div>
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                {PRESET_GROOMS.map(seed => (
                                                    <div
                                                        key={seed}
                                                        onClick={() => handleStickerChange('groom', seed)}
                                                        className={`w-12 h-12 rounded-full border-2 overflow-hidden flex-shrink-0 cursor-pointer transition-all bg-white ${invitation.sticker?.groom === seed ? 'border-indigo-600 scale-110 shadow-sm' : 'border-transparent hover:border-gray-300'}`}
                                                    >
                                                        <img src={getAvatarUrl(seed)} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* BRIDE SELECTOR */}
                                        <div>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-gray-500 uppercase">Cô Dâu</label>
                                                <button onClick={() => randomizeSticker('bride')} className="text-xs text-rose-600 flex items-center gap-1 hover:underline"><RefreshCw className="w-3 h-3" /> Ngẫu nhiên</button>
                                            </div>
                                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                                {PRESET_BRIDES.map(seed => (
                                                    <div
                                                        key={seed}
                                                        onClick={() => handleStickerChange('bride', seed)}
                                                        className={`w-12 h-12 rounded-full border-2 overflow-hidden flex-shrink-0 cursor-pointer transition-all bg-white ${invitation.sticker?.bride === seed ? 'border-rose-600 scale-110 shadow-sm' : 'border-transparent hover:border-gray-300'}`}
                                                    >
                                                        <img src={getAvatarUrl(seed)} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Color Picker */}
                                <div className="pt-4 border-t border-gray-100">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Màu chủ đạo thiệp</label>
                                    <div className="flex gap-2">
                                        {['#e11d48', '#db2777', '#7c3aed', '#059669', '#d97706', '#1e293b'].map(color => (
                                            <button
                                                key={color}
                                                className={`w-8 h-8 rounded-full border-2 ${invitation.themeColor === color ? 'border-gray-600 scale-110' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => handleInputChange('themeColor', color)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Preview & Marketing Card */}
                <div className="flex-1 bg-gray-100 p-4 md:p-8 overflow-y-auto flex flex-col items-center justify-center min-h-[500px]">
                    <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 text-center">Card Marketing (Ảnh tải về)</h3>

                        {/* MARKETING CARD NODE - Captured by html2canvas */}
                        <div
                            ref={marketingCardRef}
                            className="w-[350px] bg-white rounded-2xl overflow-hidden shadow-2xl relative flex flex-col border border-gray-100"
                            style={{ minHeight: '600px' }}
                        >
                            {/* Sticker Header */}
                            <div className="h-[300px] relative overflow-hidden flex items-center justify-center pt-8" style={{ backgroundColor: invitation.themeColor + '15' }}>

                                {/* DISPLAY LOGIC: AI MODE VS BASIC MODE */}
                                {invitation.sticker.mode === 'AI_GEN' ? (
                                    <div className="relative w-64 h-64 animate-float-slow">
                                        {invitation.sticker.stickerPack?.main ? (
                                            <img src={invitation.sticker.stickerPack.main} className="w-full h-full object-contain drop-shadow-xl" crossOrigin="anonymous" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                <Sparkles className="w-12 h-12 mb-2" />
                                                <span className="text-xs">Chưa tạo sticker AI</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 transform scale-125">
                                        <div className="relative z-10 w-24 h-24 drop-shadow-xl animate-float-slow">
                                            <img src={getAvatarUrl(invitation.sticker?.groom || 'Felix')} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                        </div>
                                        <Heart className="w-8 h-8 fill-current animate-pulse absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-50" style={{ color: invitation.themeColor }} />
                                        <div className="relative z-10 w-24 h-24 drop-shadow-xl animate-float-delayed">
                                            <img src={getAvatarUrl(invitation.sticker?.bride || 'Aneka')} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                        </div>
                                    </div>
                                )}

                                {/* Overlay Text */}
                                <div className="absolute bottom-0 left-0 w-full p-4 text-center">
                                    <p className="font-serif-display italic text-sm opacity-60 mb-1" style={{ color: invitation.themeColor }}>Save the Date</p>
                                    <h2 className="font-serif-display text-2xl font-bold leading-tight text-gray-800">
                                        {invitation.groomName || 'Chú Rể'}
                                        <span className="text-rose-400 mx-2">&</span>
                                        {invitation.brideName || 'Cô Dâu'}
                                    </h2>
                                    <p className="mt-1 text-xs font-medium uppercase tracking-widest opacity-60 text-gray-500">
                                        {invitation.date ? new Date(invitation.date).toLocaleDateString('vi-VN') : 'DD/MM/YYYY'}
                                    </p>
                                </div>
                            </div>

                            {/* Info & QR Area */}
                            <div className="flex-1 bg-white p-5 flex flex-col items-center justify-between text-center relative">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm z-10">
                                    <Heart className="w-6 h-6 fill-current" style={{ color: invitation.themeColor }} />
                                </div>

                                <div className="mt-4 space-y-1">
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Trân trọng mời bạn đến dự</p>
                                    <h3 className="font-bold text-gray-800 text-lg uppercase">Lễ Thành Hôn</h3>
                                </div>

                                {/* QR Code Container */}
                                <div className="my-3 p-2 border-2 border-dashed rounded-xl bg-white shadow-sm" style={{ borderColor: invitation.themeColor + '40' }}>
                                    <QRCodeCanvas
                                        value={publicLink}
                                        size={100}
                                        bgColor={"#ffffff"}
                                        fgColor={invitation.themeColor}
                                        level={"M"}
                                        includeMargin={true}
                                    />
                                </div>

                                <p className="text-[10px] text-gray-400 font-medium">Quét mã để xem Thiệp Online</p>

                                <div className="w-full border-t border-gray-100 mt-4 pt-3 flex items-center justify-between">
                                    <span className="font-serif-display font-bold text-lg" style={{ color: invitation.themeColor }}>WedPlan AI</span>
                                    <span className="text-[10px] text-gray-400">wedplanai.io.vn</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes floatSlow {
                    0%, 100% { transform: translateY(0px) rotate(-2deg); }
                    50% { transform: translateY(-10px) rotate(2deg); }
                }
                @keyframes floatDelayed {
                    0%, 100% { transform: translateY(0px) rotate(2deg); }
                    50% { transform: translateY(-10px) rotate(-2deg); }
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

export default InvitationBuilder;