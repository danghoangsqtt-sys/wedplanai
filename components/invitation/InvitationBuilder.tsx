
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
    Heart, Download, Eye, Upload, Sparkles,
    Loader2, Info, Image as ImageIcon,
    ZoomIn, ArrowUp, ArrowDown
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { storage, auth } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BankInfo } from '../../types';
import { generateWeddingImages } from '../../services/aiService';

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

const InvitationBuilder: React.FC = () => {
    const { invitation, updateInvitation, user, addNotification, settings } = useStore();
    const [activeTab, setActiveTab] = useState<'INFO' | 'BANK' | 'DESIGN'>('INFO');
    const [isGenerating, setIsGenerating] = useState(false);
    const marketingCardRef = useRef<HTMLDivElement>(null);

    // Inputs for AI
    const [groomFile, setGroomFile] = useState<File | null>(null);
    const [brideFile, setBrideFile] = useState<File | null>(null);

    // Previews for inputs
    const [groomPreview, setGroomPreview] = useState<string | null>(invitation.inputFaces?.groom || null);
    const [bridePreview, setBridePreview] = useState<string | null>(invitation.inputFaces?.bride || null);

    // Initial load check
    useEffect(() => {
        if (!invitation.groomName && user?.displayName) {
            updateInvitation({ groomName: user.displayName });
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

    // Helper: Base64 to Blob
    const base64ToBlob = (base64: string, type = 'image/png') => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type });
    };

    const handleUploadInputFace = async (file: File, type: 'groom' | 'bride') => {
        if (!auth.currentUser || !storage) return;
        try {
            // Upload input face to storage for persistence
            const fileName = `input_${type}_${Date.now()}.jpg`;
            const storageRef = ref(storage, `invitations/faces/${user!.uid}/${fileName}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);

            updateInvitation({
                inputFaces: {
                    ...invitation.inputFaces,
                    [type]: url
                }
            });
        } catch (e) {
            console.error("Upload face error:", e);
        }
    };

    const handleGenerateAIPhotos = async () => {
        if (!groomFile || !brideFile) {
            alert("Vui lòng tải lên ảnh chân dung Chú Rể và Cô Dâu để AI có thể tạo hình!");
            return;
        }

        if (!settings.geminiApiKey) {
            alert("Vui lòng nhập Gemini API Key trong phần Cài Đặt để sử dụng tính năng này.");
            return;
        }

        if (!auth.currentUser) {
            alert("Vui lòng đăng nhập để lưu ảnh.");
            return;
        }

        setIsGenerating(true);
        try {
            // 1. Upload input faces first if strictly needed, but we use local files for AI generation
            await handleUploadInputFace(groomFile, 'groom');
            await handleUploadInputFace(brideFile, 'bride');

            // 2. Generate Images
            const generatedB64s = await generateWeddingImages(groomFile, brideFile, settings.geminiApiKey);

            // 3. Upload Generated Images to Firebase
            if (!storage) throw new Error("Storage not configured");
            const newGalleryUrls: string[] = [];

            for (let i = 0; i < generatedB64s.length; i++) {
                const blob = base64ToBlob(generatedB64s[i], 'image/png');
                const fileName = `generated_${Date.now()}_${i}.png`;
                const storageRef = ref(storage, `invitations/generated/${user!.uid}/${fileName}`);
                const snapshot = await uploadBytes(storageRef, blob, { contentType: 'image/png' });
                const url = await getDownloadURL(snapshot.ref);
                newGalleryUrls.push(url);
            }

            // 4. Update State
            updateInvitation({
                galleryImages: newGalleryUrls
            });
            addNotification('SUCCESS', 'Đã tạo xong 5 ảnh cưới tuyệt đẹp!');

        } catch (error: any) {
            console.error("AI Gen Error:", error);
            alert("Lỗi khi tạo ảnh: " + (error.message || "Vui lòng thử lại sau."));
        } finally {
            setIsGenerating(false);
        }
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
            link.download = `thiep-cuoi-${user!.uid}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            addNotification('SUCCESS', 'Đã tải ảnh thiệp về máy!');
        } catch (err) {
            console.error(err);
            alert("Lỗi khi tạo ảnh. Vui lòng thử lại.");
        }
    };

    const publicLink = `${window.location.origin}/?view=invitation&uid=${user?.uid}`;

    // Gallery for preview (Generated or Placeholders)
    const gallery = invitation.galleryImages && invitation.galleryImages.length > 0
        ? invitation.galleryImages
        : [];

    return (
        <div className="h-full flex flex-col bg-[#FDF2F8]">
            {/* Header */}
            <div className="p-4 md:p-6 bg-white border-b border-rose-100 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Heart className="w-6 h-6 text-rose-500 fill-current animate-pulse" />
                        Thiệp Mời Online
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Tạo thiệp, QR mừng cưới & bộ ảnh AI.</p>
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
                <div className="w-full lg:w-[450px] bg-white border-r border-rose-100 flex flex-col h-full overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        <button onClick={() => setActiveTab('INFO')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'INFO' ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Thông Tin</button>
                        <button onClick={() => setActiveTab('BANK')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'BANK' ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Ngân Hàng</button>
                        <button onClick={() => setActiveTab('DESIGN')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'DESIGN' ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>HÌNH ẢNH</button>
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
                                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2 mb-3">
                                        <Sparkles className="w-4 h-4 text-indigo-500" />
                                        Studio Ảnh Cưới AI
                                    </h3>

                                    <p className="text-xs text-gray-500 mb-3">Tải lên ảnh chân dung rõ mặt của 2 bạn để AI tạo ra 5 bức ảnh cưới lung linh theo nhiều phong cách.</p>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="text-center">
                                            <label className="block w-full aspect-square bg-white border-2 border-dashed border-indigo-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 overflow-hidden relative shadow-sm">
                                                {groomPreview ? (
                                                    <img src={groomPreview} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-gray-400 text-xs p-2">
                                                        <Upload className="w-6 h-6 mx-auto mb-1" />
                                                        Ảnh Chú Rể
                                                    </div>
                                                )}
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) {
                                                        setGroomFile(f);
                                                        setGroomPreview(URL.createObjectURL(f));
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                        <div className="text-center">
                                            <label className="block w-full aspect-square bg-white border-2 border-dashed border-indigo-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 overflow-hidden relative shadow-sm">
                                                {bridePreview ? (
                                                    <img src={bridePreview} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-gray-400 text-xs p-2">
                                                        <Upload className="w-6 h-6 mx-auto mb-1" />
                                                        Ảnh Cô Dâu
                                                    </div>
                                                )}
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                    const f = e.target.files?.[0];
                                                    if (f) {
                                                        setBrideFile(f);
                                                        setBridePreview(URL.createObjectURL(f));
                                                    }
                                                }} />
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleGenerateAIPhotos}
                                        disabled={isGenerating || !groomFile || !brideFile}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                                    >
                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-300" />}
                                        {isGenerating ? "Đang xử lý (30s)..." : "✨ AI Tạo Ảnh Cưới (5 Styles)"}
                                    </button>
                                </div>

                                {/* Gallery Grid Result */}
                                {invitation.galleryImages.length > 0 ? (
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Kết quả (5 Ảnh)</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {invitation.galleryImages.map((url, idx) => (
                                                <div
                                                    key={idx}
                                                    className="aspect-[3/4] rounded-lg overflow-hidden border border-gray-100 shadow-sm relative group"
                                                >
                                                    <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Generated" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-400 text-xs italic">
                                        Chưa có ảnh nào được tạo.
                                    </div>
                                )}

                                {/* Color Picker */}
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Màu chủ đạo thiệp</label>
                                    <div className="flex gap-2">
                                        {['#e11d48', '#db2777', '#7c3aed', '#059669', '#d97706'].map(color => (
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
                            {/* Collage Header (Instead of single image) */}
                            <div className="h-[380px] relative bg-gray-100 overflow-hidden">
                                {gallery.length > 0 ? (
                                    gallery.length >= 3 ? (
                                        <div className="grid grid-cols-2 gap-0.5 h-full">
                                            <div className="relative h-full">
                                                <img src={gallery[0]} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                            </div>
                                            <div className="grid grid-rows-2 gap-0.5 h-full">
                                                <div className="relative h-full">
                                                    <img src={gallery[1]} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                </div>
                                                <div className="relative h-full">
                                                    <img src={gallery[2]} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <img src={gallery[0]} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    )
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-200">
                                        <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                                        <span className="text-xs">Chưa có ảnh AI</span>
                                    </div>
                                )}

                                {/* Overlay Text */}
                                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent text-white">
                                    <p className="font-serif-display italic text-sm opacity-90 mb-1">Save the Date</p>
                                    <h2 className="font-serif-display text-2xl font-bold leading-tight">
                                        {invitation.groomName || 'Chú Rể'}
                                        <span className="text-rose-400 mx-2">&</span>
                                        {invitation.brideName || 'Cô Dâu'}
                                    </h2>
                                    <p className="mt-1 text-xs font-medium uppercase tracking-widest opacity-80">
                                        {invitation.date ? new Date(invitation.date).toLocaleDateString('vi-VN') : 'DD/MM/YYYY'}
                                    </p>
                                </div>
                            </div>

                            {/* Info & QR Area */}
                            <div className="flex-1 bg-white p-5 flex flex-col items-center justify-between text-center relative">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm z-10">
                                    <Heart className="w-6 h-6 text-rose-500 fill-current" />
                                </div>

                                <div className="mt-4 space-y-1">
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">Trân trọng mời bạn đến dự</p>
                                    <h3 className="font-bold text-gray-800 text-lg uppercase">Lễ Thành Hôn</h3>
                                </div>

                                {/* QR Code Container */}
                                <div className="my-3 p-2 border-2 border-rose-100 rounded-xl bg-white shadow-sm">
                                    <QRCodeCanvas
                                        value={publicLink}
                                        size={100}
                                        bgColor={"#ffffff"}
                                        fgColor={invitation.themeColor}
                                        level={"M"}
                                        includeMargin={true}
                                    />
                                </div>

                                <p className="text-[10px] text-gray-400 font-medium">Quét mã để xem Album & Mừng cưới</p>

                                <div className="w-full border-t border-gray-100 mt-4 pt-3 flex items-center justify-between">
                                    <span className="font-serif-display font-bold text-rose-600 text-lg">WedPlan AI</span>
                                    <span className="text-[10px] text-gray-400">wedplanai.io.vn</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvitationBuilder;
