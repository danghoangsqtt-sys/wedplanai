import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
    Heart, Download, Eye,
    Info, Image as ImageIcon,
    Move, Upload, Trash2, Maximize, ArrowRightLeft, ArrowUp,
    Palette, Edit3, LayoutTemplate, Search, X
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
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

const FloralCorner = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
    const classes = {
        tl: 'top-0 left-0 -translate-x-1/4 -translate-y-1/4 rotate-0',
        tr: 'top-0 right-0 translate-x-1/4 -translate-y-1/4 rotate-90',
        bl: 'bottom-0 left-0 -translate-x-1/4 translate-y-1/4 -rotate-90',
        br: 'bottom-0 right-0 translate-x-1/4 translate-y-1/4 rotate-180'
    };

    return (
        <div className={`absolute w-32 h-32 pointer-events-none z-10 opacity-60 mix-blend-multiply ${classes[position]}`}>
             <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-rose-200">
                <path d="M20 20C50 20 80 40 100 80C120 40 150 20 180 20" stroke="currentColor" strokeWidth="2" className="text-rose-300"/>
                <path d="M20 20C20 50 40 80 80 100C40 120 20 150 20 180" stroke="currentColor" strokeWidth="2" className="text-rose-300"/>
                <circle cx="20" cy="20" r="8" fill="currentColor" className="text-rose-300"/>
                <path d="M100 80C110 110 140 130 180 130" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" className="text-rose-200"/>
                <path d="M80 100C110 110 130 140 130 180" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" className="text-rose-200"/>
             </svg>
        </div>
    );
};

// Helper để parse ngày giờ chuẩn xác
const parseDate = (dateStr: string) => {
    if (!dateStr) return { day: '01', month: '01', year: '2026', full: '01/01/2026' };
    const parts = dateStr.split('-');
    if (parts.length !== 3) return { day: '01', month: '01', year: '2026', full: '01/01/2026' };
    
    return {
        day: parts[2],
        month: parts[1],
        year: parts[0],
        full: `${parts[2]}/${parts[1]}/${parts[0]}`
    };
};

const InvitationBuilder: React.FC = () => {
    const { invitation, updateInvitation, user, addNotification } = useStore();
    const [activeTab, setActiveTab] = useState<'INFO' | 'BANK' | 'PHOTO'>('INFO');
    
    // Mobile View State
    const [mobileView, setMobileView] = useState<'EDIT' | 'PREVIEW'>('EDIT');
    
    // Dynamic Scale for Mobile Preview
    const [previewScale, setPreviewScale] = useState(1);
    
    // Image Modal State
    const [viewingImage, setViewingImage] = useState<{ name: string, url: string | null } | null>(null);

    const marketingCardRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial load check & Resize Listener
    useEffect(() => {
        if (!invitation.groomName && user?.displayName) {
            updateInvitation({ groomName: user.displayName });
        }
        // Set default photo config if missing
        if (!invitation.photoConfig) {
            updateInvitation({
                photoConfig: { scale: 1, x: 0, y: 0 }
            });
        }

        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 1024) {
                // Mobile/Tablet logic: Scale to fit width
                const availableWidth = width - 32; 
                const scale = Math.min(1, availableWidth / 390); 
                setPreviewScale(scale);
            } else {
                setPreviewScale(1);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleInputChange = (field: string, value: any) => {
        updateInvitation({ [field]: value });
    };

    const handleBankChange = (field: keyof BankInfo, value: any) => {
        updateInvitation({
            bankInfo: { ...invitation.bankInfo, [field]: value }
        });
    };

    const handlePhotoConfigChange = (field: 'scale' | 'x' | 'y', value: number) => {
        updateInvitation({
            photoConfig: {
                ...(invitation.photoConfig || { scale: 1, x: 0, y: 0 }),
                [field]: value
            }
        });
    };

    const downloadMarketingCard = async () => {
        if (window.innerWidth < 1024 && mobileView === 'EDIT') {
            setMobileView('PREVIEW');
            setTimeout(() => downloadMarketingCard(), 500);
            return;
        }

        if (!marketingCardRef.current) return;
        
        // Hiển thị thông báo đang xử lý
        const btn = document.getElementById('btn-download');
        const originalText = btn ? btn.innerHTML : '';
        if(btn) btn.innerText = "Đang xử lý...";

        try {
            // Tăng scale lên 4 để ảnh siêu nét
            const canvas = await html2canvas(marketingCardRef.current, {
                useCORS: true,
                scale: 4, 
                backgroundColor: '#ffffff',
                logging: false,
                allowTaint: true,
                imageTimeout: 0,
            });
            
            const link = document.createElement('a');
            link.download = `Thiep-Moi-${invitation.groomName}-${invitation.brideName}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            
            addNotification('SUCCESS', 'Đã tải ảnh chất lượng cao!');
        } catch (err) {
            console.error(err);
            addNotification('ERROR', 'Lỗi khi tạo ảnh. Hãy thử lại.');
        } finally {
            if(btn) btn.innerHTML = originalText;
        }
    };

    // --- LOCAL IMAGE PROCESSING ---
    const resizeAndConvertToBase64 = (file: File, maxWidth: number = 800): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const base64String = await resizeAndConvertToBase64(file, 800);
            updateInvitation({
                couplePhoto: base64String,
                photoConfig: { scale: 1, x: 0, y: 0 } // Reset config on new photo
            });
            addNotification('SUCCESS', 'Đã tải ảnh lên thành công!');
        } catch (err) {
            console.error(err);
            alert("Lỗi xử lý ảnh. Vui lòng thử ảnh khác.");
        }
    };

    const publicLink = `${window.location.origin}/?view=invitation&uid=${user?.uid || 'guest'}`;
    const dateObj = parseDate(invitation.date);

    return (
        <div className="h-full flex flex-col bg-[#FDF2F8] relative">
            {/* Header */}
            <div className="p-3 md:p-6 bg-white border-b border-rose-100 flex justify-between items-center sticky top-0 z-20 shadow-sm flex-shrink-0">
                <div className="flex-1 min-w-0 mr-2">
                    <h1 className="text-lg md:text-2xl font-bold text-gray-800 flex items-center gap-2 truncate">
                        <Heart className="w-5 h-5 md:w-6 md:h-6 text-rose-500 fill-current animate-pulse flex-shrink-0" />
                        <span className="truncate">Thiệp Mời Online</span>
                    </h1>
                    <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 truncate hidden sm:block">Tạo thiệp, QR mừng cưới & Ảnh cưới đẹp.</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <a
                        href={publicLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center w-9 h-9 md:w-auto md:h-auto md:gap-2 md:px-3 md:py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs md:text-sm font-bold hover:bg-rose-50 transition-colors"
                        title="Xem thiệp thực tế"
                    >
                        <Eye className="w-5 h-5" /> <span className="hidden md:inline">Xem thực tế</span>
                    </a>
                    <button
                        id="btn-download"
                        onClick={downloadMarketingCard}
                        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-rose-600 text-white rounded-lg text-xs md:text-sm font-bold hover:bg-rose-700 shadow-md transition-colors"
                    >
                        <Download className="w-4 h-4" /> <span className="hidden sm:inline">Tải ảnh</span>
                        <span className="sm:hidden">Lưu</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row pb-16 lg:pb-0">
                {/* LEFT: Controls */}
                <div className={`w-full lg:w-[500px] bg-white border-r border-rose-100 flex flex-col h-full overflow-hidden ${mobileView === 'PREVIEW' ? 'hidden lg:flex' : 'flex'}`}>
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 flex-shrink-0">
                        <button onClick={() => setActiveTab('INFO')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'INFO' ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Thông Tin</button>
                        <button onClick={() => setActiveTab('BANK')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'BANK' ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>Ngân Hàng</button>
                        <button onClick={() => setActiveTab('PHOTO')} className={`flex-1 py-3 text-sm font-bold border-b-2 flex items-center justify-center gap-1 ${activeTab === 'PHOTO' ? 'border-rose-500 text-rose-600 bg-rose-50' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
                            <ImageIcon className="w-3.5 h-3.5" /> Ảnh Cưới
                        </button>
                    </div>

                    {/* Scrollable Form Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-24 lg:pb-6">

                        {activeTab === 'INFO' && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Chú Rể</label>
                                        <input className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm font-be-vietnam" value={invitation.groomName} onChange={e => handleInputChange('groomName', e.target.value)} placeholder="Tên Chú Rể" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase">Cô Dâu</label>
                                        <input className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm font-be-vietnam" value={invitation.brideName} onChange={e => handleInputChange('brideName', e.target.value)} placeholder="Tên Cô Dâu" />
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
                                    <label className="text-xs font-bold text-gray-500 uppercase">Địa điểm</label>
                                    <input className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm font-be-vietnam" value={invitation.location} onChange={e => handleInputChange('location', e.target.value)} placeholder="VD: Trung tâm tiệc cưới White Palace" />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Địa chỉ chi tiết</label>
                                    <textarea rows={2} className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm resize-none font-be-vietnam" value={invitation.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="Số 123 Đường ABC, Phường XYZ..." />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Link Bản Đồ (Google Maps)</label>
                                    <input className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm font-be-vietnam text-blue-600" value={invitation.mapLink || ''} onChange={e => handleInputChange('mapLink', e.target.value)} placeholder="https://maps.app.goo.gl/..." />
                                    <p className="text-[10px] text-gray-400 mt-1 italic">Dán link chia sẻ từ Google Maps để hiện nút chỉ đường.</p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">Lời Nhắn / Lời Mời</label>
                                    <textarea rows={3} className="w-full mt-1 p-2 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm resize-none font-be-vietnam" value={invitation.wishes} onChange={e => handleInputChange('wishes', e.target.value)} />
                                </div>

                                {/* Color Picker */}
                                <div className="pt-4 border-t border-gray-100">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Palette className="w-3 h-3" /> Màu chủ đạo</label>
                                    <div className="flex gap-2">
                                        {['#e11d48', '#db2777', '#7c3aed', '#059669', '#d97706', '#1e293b'].map(color => (
                                            <button
                                                key={color}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform ${invitation.themeColor === color ? 'border-gray-600 scale-110 shadow-sm' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => handleInputChange('themeColor', color)}
                                            />
                                        ))}
                                    </div>
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

                        {activeTab === 'PHOTO' && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* UPLOAD BUTTON */}
                                <div
                                    className="border-2 border-dashed border-rose-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6 text-rose-500" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-700">Tải ảnh cưới lên</p>
                                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG (Tối đa 5MB)</p>
                                </div>

                                {invitation.couplePhoto && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2"><Move className="w-4 h-4" /> Căn chỉnh vị trí</h4>
                                            <button onClick={() => updateInvitation({ couplePhoto: undefined })} className="text-red-500 text-xs font-bold flex items-center gap-1 hover:underline"><Trash2 className="w-3 h-3" /> Xóa ảnh</button>
                                        </div>

                                        {/* ZOOM SLIDER */}
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Thu nhỏ</span>
                                                <span className="font-bold flex items-center gap-1"><Maximize className="w-3 h-3" /> Phóng to ({invitation.photoConfig?.scale || 1}x)</span>
                                            </div>
                                            <input
                                                type="range" min="1" max="3" step="0.1"
                                                className="w-full accent-rose-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                value={invitation.photoConfig?.scale || 1}
                                                onChange={(e) => handlePhotoConfigChange('scale', parseFloat(e.target.value))}
                                            />
                                        </div>

                                        {/* X POSITION SLIDER */}
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Trái</span>
                                                <span className="font-bold flex items-center gap-1"><ArrowRightLeft className="w-3 h-3" /> Di chuyển Ngang</span>
                                                <span>Phải</span>
                                            </div>
                                            <input
                                                type="range" min="-100" max="100" step="1"
                                                className="w-full accent-rose-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                value={invitation.photoConfig?.x || 0}
                                                onChange={(e) => handlePhotoConfigChange('x', parseFloat(e.target.value))}
                                            />
                                        </div>

                                        {/* Y POSITION SLIDER */}
                                        <div>
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Lên</span>
                                                <span className="font-bold flex items-center gap-1"><ArrowUp className="w-3 h-3" /> Di chuyển Dọc</span>
                                                <span>Xuống</span>
                                            </div>
                                            <input
                                                type="range" min="-100" max="100" step="1"
                                                className="w-full accent-rose-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                value={invitation.photoConfig?.y || 0}
                                                onChange={(e) => handlePhotoConfigChange('y', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Preview */}
                <div className={`flex-1 bg-gray-100 p-4 md:p-8 overflow-y-auto flex flex-col items-center justify-start lg:justify-center min-h-[700px] ${mobileView === 'EDIT' ? 'hidden lg:flex' : 'flex'}`}>
                    
                    {/* Scale Wrapper for Mobile */}
                    <div 
                        className="bg-white p-2 rounded-[2.5rem] shadow-sm mb-4 border-[8px] border-white origin-top transition-transform duration-300"
                        style={{ 
                            transform: `scale(${previewScale})`,
                            marginBottom: previewScale < 1 ? `-${(667 * (1 - previewScale)) - 20}px` : '0px'
                        }}
                    >

                        {/* CARD PREVIEW CONTAINER - PREMIUM LAYOUT */}
                        <div
                            ref={marketingCardRef}
                            className="w-[375px] bg-white relative flex flex-col shadow-2xl overflow-hidden"
                            style={{ height: '667px' }}
                        >
                            {/* 1. PHOTO AREA (Chiếm 60% diện tích) */}
                            <div className="h-[400px] w-full relative overflow-hidden">
                                {invitation.couplePhoto ? (
                                    <div 
                                        className="w-full h-full bg-cover bg-no-repeat bg-center transition-transform duration-300"
                                        style={{
                                            backgroundImage: `url(${invitation.couplePhoto})`,
                                            transform: `scale(${invitation.photoConfig?.scale || 1}) translate(${invitation.photoConfig?.x || 0}px, ${invitation.photoConfig?.y || 0}px)`
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                                        <ImageIcon className="w-16 h-16 mb-2 opacity-50" />
                                        <span className="text-sm font-medium">Chưa có ảnh</span>
                                    </div>
                                )}
                                
                                {/* Lớp phủ gradient nhẹ ở đáy ảnh để làm mềm chuyển tiếp */}
                                <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
                                
                                {/* Brand Badge sang trọng góc trên */}
                                <div className="absolute top-4 right-4"> {/* Đã sửa lỗi tụt logo WEDPLAN AI */}
                                    <div className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg border border-white flex items-center gap-2">
                                        <Heart className="w-3 h-3 text-rose-500 fill-current" />
                                        <span className="text-[10px] font-bold tracking-widest uppercase text-gray-800 export-fix">WEDPLAN AI</span>
                                    </div>
                                </div>
                            </div>

                            {/* 2. CONTENT AREA */}
                            <div className="flex-1 relative z-10 -mt-10 flex flex-col items-center text-center px-6 pb-6">
                                
                                {/* Date Circle */}
                                <div className="bg-white p-1 rounded-full shadow-xl mb-4" style={{ height: '88px', width: '88px' }}> {/* Fix tụt số 18 */}
                                    <div className="h-full w-full rounded-full border border-rose-100 flex flex-col items-center justify-center bg-white shadow-sm">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-0.5 export-fix">Tháng {dateObj.month}</span>
                                        <span className="text-3xl font-serif font-black text-gray-800 leading-none pb-1 export-fix">{dateObj.day}</span>
                                        <span className="text-[10px] text-rose-500 font-bold export-fix">{dateObj.year}</span>
                                    </div>
                                </div>

                                {/* Tên Cô Dâu Chú Rể */}
                                <div className="w-full mb-2">
                                    <h2 className="font-['Great_Vibes'] text-[42px] text-gray-800 leading-normal drop-shadow-sm pb-2 export-fix" style={{ color: invitation.themeColor }}>
                                        {invitation.groomName} <span className="text-2xl text-gray-400 font-serif mx-1">&</span> {invitation.brideName}
                                    </h2>
                                </div>

                                {/* Thông tin tiệc */}
                                <div className="space-y-2 mb-auto w-full">
                                    <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest mb-1 export-fix">
                                        <span className="h-[1px] w-4 bg-rose-200"></span>
                                        SAVE THE DATE
                                        <span className="h-[1px] w-4 bg-rose-200"></span>
                                    </div>
                                    
                                    <p className="text-sm font-bold text-gray-800 uppercase tracking-wide px-4 pb-1 export-fix">
                                        {invitation.location || 'Địa điểm tổ chức'}
                                    </p>
                                    <p className="text-xs text-gray-500 italic px-8 leading-relaxed pb-1 export-fix">
                                        {invitation.address || 'Địa chỉ chi tiết...'}
                                    </p>
                                    <p className="text-sm font-bold text-rose-500 mt-1 pb-1 export-fix">
                                        {invitation.time || '00:00'} • Đón Khách
                                    </p>
                                </div>

                                {/* 3. QR FOOTER - Thiết kế dạng vé mời (Ticket) */}
                                <div className="w-full mt-3">
                                    <div className="bg-gray-50 border border-dashed border-rose-200 rounded-xl p-3 flex items-center gap-4 shadow-inner relative overflow-hidden">
                                        {/* Decoration Circles */}
                                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-r border-rose-200"></div>
                                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-l border-rose-200"></div>

                                        {/* QR Code Container */}
                                        <div className="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100 flex-shrink-0">
                                            <QRCodeCanvas 
                                                value={publicLink} 
                                                size={64}
                                                level={"H"}
                                                includeMargin={false}
                                                fgColor="#374151"
                                            />
                                        </div>

                                        {/* QR Context Text (Sửa lỗi tràn dòng) */}
                                        <div className="flex-1 text-left pr-1"> 
                                            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-0.5 export-fix">Thiệp mời Online</p>
                                            <p className="text-[11px] font-bold text-gray-800 leading-snug export-fix" style={{ maxWidth: '170px' }}>Quét mã để xem bản đồ & gửi lời chúc</p> {/* Đặt Max-width cố định */}
                                            <div className="flex items-center gap-1 text-[9px] text-gray-400 bg-white px-2 py-0.5 rounded-md border border-gray-100 w-fit export-fix mt-1">
                                                <span>👉 wedplan.ai</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Floral Decor (Optional) */}
                                <FloralCorner position="bl" />
                                <FloralCorner position="tr" />
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 font-medium font-be-vietnam hidden lg:block mt-2">Mẹo: Kéo thả ảnh để căn chỉnh vị trí khuôn mặt</p>
                </div>
            </div>

            {/* MOBILE BOTTOM NAVIGATION */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] safe-area-bottom">
                <button 
                    onClick={() => setMobileView('EDIT')}
                    className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors ${mobileView === 'EDIT' ? 'text-rose-600 bg-rose-50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <Edit3 className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase">Nhập thông tin</span>
                </button>
                <div className="w-px bg-gray-200"></div>
                <button 
                    onClick={() => setMobileView('PREVIEW')}
                    className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 transition-colors ${mobileView === 'PREVIEW' ? 'text-rose-600 bg-rose-50' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                    <LayoutTemplate className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase">Xem thiệp</span>
                </button>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Be+Vietnam+Pro:wght@400;500;700&family=Cinzel:wght@400;700&display=swap');
                
                /* FIX LỖI CLIPPING TEXT TRONG HTML2CANVAS */
                /* Cưỡng chế line-height cao hơn cho các font tùy chỉnh */
                .export-fix {
                    /* Đảm bảo chữ không bị cắt và căn chỉnh tốt hơn trong Canvas */
                    line-height: 1.4 !important; 
                }

                .font-merriweather { font-family: 'Merriweather', serif; }
                .font-cinzel { font-family: 'Cinzel', serif; }
                .font-be-vietnam { font-family: 'Be Vietnam Pro', sans-serif; }
                .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
            `}</style>
        </div>
    );
};

export default InvitationBuilder;
