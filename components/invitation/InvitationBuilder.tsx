import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
    Heart, Calendar, MapPin, CreditCard, Image as ImageIcon,
    Share2, Download, Eye, QrCode, Upload, Save, Check, Info
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BankInfo } from '../../types';

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
    const { invitation, updateInvitation, user, addNotification } = useStore();
    const [activeTab, setActiveTab] = useState<'INFO' | 'BANK' | 'DESIGN'>('INFO');
    const [isUploading, setIsUploading] = useState(false);
    const marketingCardRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial load check
    useEffect(() => {
        if (!invitation.groomName && user?.displayName) {
            // Pre-fill if empty
            updateInvitation({ groomName: user.displayName }); // Just a guess, user can change
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Ảnh quá lớn (>5MB). Vui lòng chọn ảnh nhỏ hơn.");
            return;
        }

        if (!storage) {
            alert("Chưa cấu hình Storage. Vui lòng liên hệ Admin.");
            return;
        }

        setIsUploading(true);
        try {
            const storageRef = ref(storage, `invitations/${user!.uid}/${file.name}_${Date.now()}`);
            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);
            updateInvitation({ coverImage: url });
            addNotification('SUCCESS', 'Đã tải ảnh lên thành công!');
        } catch (error: any) {
            console.error("Upload failed", error);
            alert("Lỗi upload: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const downloadMarketingCard = async () => {
        if (!marketingCardRef.current) return;
        try {
            const canvas = await html2canvas(marketingCardRef.current, {
                useCORS: true, // Quan trọng để load ảnh từ domain khác (firebase)
                scale: 2 // High resolution
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

    // Public Link
    const publicLink = `${window.location.origin}/?view=invitation&uid=${user?.uid}`;

    // Bank QR URL (VietQR API)
    const bankQrUrl = `https://img.vietqr.io/image/${invitation.bankInfo.bankId}-${invitation.bankInfo.accountNumber}-${invitation.bankInfo.template}.png?accountName=${encodeURIComponent(invitation.bankInfo.accountName)}`;

    return (
        <div className="h-full flex flex-col bg-[#FDF2F8]">
            {/* Header */}
            <div className="p-4 md:p-6 bg-white border-b border-rose-100 flex justify-between items-center sticky top-0 z-20 shadow-sm">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Heart className="w-6 h-6 text-rose-500 fill-current animate-pulse" />
                        Thiệp Mời Online
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Tạo thiệp, QR mừng cưới & chia sẻ ngay.</p>
                </div>
                <div className="flex gap-2">
                    <a
                        href={publicLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-sm font-bold hover:bg-rose-50 transition-colors"
                    >
                        <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Xem thử</span>
                    </a>
                    <button
                        onClick={downloadMarketingCard}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 shadow-md transition-colors"
                    >
                        <Download className="w-4 h-4" /> <span className="hidden sm:inline">Tải ảnh Marketing</span>
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
                        <button onClick={() => setActiveTab('DESIGN')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'DESIGN' ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Hình Ảnh</button>
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
                            <div className="space-y-4 animate-fadeIn">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Ảnh Cưới / Ảnh Bìa</label>
                                    <div
                                        className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {invitation.coverImage ? (
                                            <div className="relative aspect-[3/4] w-full max-w-[200px] mx-auto rounded-lg overflow-hidden shadow-sm">
                                                <img src={invitation.coverImage} className="w-full h-full object-cover" alt="Cover" />
                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                    <Upload className="w-6 h-6 text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-8 text-gray-400">
                                                <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                                                <p className="text-sm">Nhấn để tải ảnh lên</p>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        {isUploading && <p className="text-xs text-rose-500 mt-2 font-bold animate-pulse">Đang tải lên...</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Màu chủ đạo</label>
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
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2 text-center">Xem trước Card Marketing</h3>

                        {/* MARKETING CARD NODE - Captured by html2canvas */}
                        <div
                            ref={marketingCardRef}
                            className="w-[320px] sm:w-[350px] bg-white rounded-2xl overflow-hidden shadow-2xl relative flex flex-col"
                            style={{ minHeight: '550px' }}
                        >
                            {/* Background Image Area */}
                            <div className="h-[350px] relative bg-gray-200">
                                {invitation.coverImage ? (
                                    <img src={invitation.coverImage} className="w-full h-full object-cover" alt="Wedding" crossOrigin="anonymous" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                                        <ImageIcon className="w-12 h-12 mb-2" />
                                        <span>Chưa có ảnh bìa</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

                                <div className="absolute bottom-4 left-0 w-full text-center text-white px-4">
                                    <p className="font-serif-display italic text-lg opacity-90 mb-1">Save the Date</p>
                                    <h2 className="font-serif-display text-3xl font-bold leading-tight">
                                        {invitation.groomName || 'Chú Rể'}
                                        <span className="text-rose-400 mx-2">&</span>
                                        {invitation.brideName || 'Cô Dâu'}
                                    </h2>
                                    <p className="mt-2 text-sm font-medium uppercase tracking-widest opacity-80">
                                        {invitation.date ? new Date(invitation.date).toLocaleDateString('vi-VN') : 'DD/MM/YYYY'}
                                    </p>
                                </div>
                            </div>

                            {/* Info & QR Area */}
                            <div className="flex-1 bg-white p-5 flex flex-col items-center justify-between text-center relative">
                                {/* Decorative Circles */}
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

                                <p className="text-xs text-gray-400 font-medium">Quét mã để xem thiệp & bản đồ</p>

                                <div className="w-full border-t border-gray-100 mt-4 pt-3 flex items-center justify-between">
                                    <span className="font-serif-display font-bold text-rose-600 text-lg">WedPlan AI</span>
                                    <span className="text-[10px] text-gray-400">wedplanai.io.vn</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-gray-400 max-w-xs text-center mt-2">
                        * Mẹo: Tải ảnh này về và đăng lên Story Facebook/Instagram hoặc gửi Zalo cho bạn bè.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default InvitationBuilder;