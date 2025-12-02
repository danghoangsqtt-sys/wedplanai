
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
    Heart, Download, Eye,
    Info, Image as ImageIcon,
    Move, Upload, Trash2, Maximize, ArrowRightLeft, ArrowUp,
    Palette, Edit3, LayoutTemplate, FileText, Loader2
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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
    const [mobileView, setMobileView] = useState<'EDIT' | 'PREVIEW'>('EDIT');
    const [previewScale, setPreviewScale] = useState(1);
    const [isExporting, setIsExporting] = useState(false);
    
    const marketingCardRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial load check & Resize Listener
    useEffect(() => {
        if (!invitation.groomName && user?.displayName) {
            updateInvitation({ groomName: user.displayName });
        }
        if (!invitation.photoConfig) {
            updateInvitation({
                photoConfig: { scale: 1, x: 0, y: 0 }
            });
        }

        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 1024) {
                // Mobile scaling logic
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

    // --- CORE EXPORT LOGIC (FIXED ALIGNMENT) ---
    const generateImage = async (): Promise<string | null> => {
        if (!marketingCardRef.current) return null;

        // 1. Tạo một container tạm thời, ẩn đi, để render bản sao
        // Điều này giúp tránh việc 'transform: scale()' của giao diện làm lệch ảnh chụp
        const originalElement = marketingCardRef.current;
        const clone = originalElement.cloneNode(true) as HTMLElement;
        
        // Setup container cho bản sao (Reset transform, cố định kích thước)
        const exportContainer = document.createElement('div');
        exportContainer.style.position = 'absolute';
        exportContainer.style.top = '-9999px';
        exportContainer.style.left = '-9999px';
        exportContainer.style.width = '375px'; // Kích thước gốc của thiệp
        exportContainer.style.height = '667px';
        exportContainer.style.zIndex = '-1';
        exportContainer.appendChild(clone);
        document.body.appendChild(exportContainer);

        try {
            // 2. Chụp ảnh từ bản sao sạch
            const canvas = await html2canvas(clone, {
                useCORS: true,
                scale: 3, // High quality (3x)
                backgroundColor: null,
                logging: false,
                allowTaint: true,
                width: 375,
                height: 667,
                scrollX: 0,
                scrollY: 0,
                x: 0,
                y: 0
            });

            // Cleanup
            document.body.removeChild(exportContainer);
            return canvas.toDataURL('image/png', 1.0);
        } catch (err) {
            console.error(err);
            if (document.body.contains(exportContainer)) {
                document.body.removeChild(exportContainer);
            }
            return null;
        }
    };

    const handleExportPDF = async () => {
        setIsExporting(true);
        // Chuyển sang Preview mode nếu đang ở Edit mobile để đảm bảo DOM tồn tại (dù mình dùng clone nhưng cần ref gốc)
        if (window.innerWidth < 1024 && mobileView === 'EDIT') {
            setMobileView('PREVIEW');
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        try {
            const imgData = await generateImage();
            if (!imgData) throw new Error("Không thể tạo hình ảnh.");

            // Tạo PDF kích thước A5 hoặc Custom phù hợp với tỉ lệ điện thoại
            // Kích thước thiệp 375x667 ~ tỉ lệ 9:16
            // A4 là 210x297mm. Ta sẽ set kích thước PDF vừa khít ảnh để share đẹp nhất
            const pdfWidth = 100; // mm
            const pdfHeight = (667/375) * 100; // Tính chiều cao tương ứng tỉ lệ

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Thiep_Cuoi_${user?.displayName || 'WedPlan'}.pdf`);
            
            addNotification('SUCCESS', 'Đã xuất file PDF thành công!');
        } catch (err: any) {
            console.error(err);
            alert("Lỗi xuất PDF: " + err.message);
        } finally {
            setIsExporting(false);
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
                photoConfig: { scale: 1, x: 0, y: 0 } 
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
            <div className="px-4 py-3 md:px-6 md:py-4 bg-white border-b border-rose-100 flex justify-between items-center sticky top-0 z-20 shadow-sm flex-shrink-0">
                <div className="flex-1 min-w-0 mr-2">
                    <h1 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2 truncate">
                        <Heart className="w-5 h-5 text-rose-500 fill-current animate-pulse flex-shrink-0" />
                        <span className="truncate hidden sm:inline">Thiết Kế Thiệp Online</span>
                        <span className="truncate sm:hidden">Thiệp Online</span>
                    </h1>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <a
                        href={publicLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors"
                    >
                        <Eye className="w-4 h-4" /> <span className="hidden md:inline">Xem Demo</span>
                    </a>
                    <button
                        onClick={handleExportPDF}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 shadow-md transition-colors disabled:opacity-70"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileText className="w-4 h-4" />} 
                        <span className="hidden sm:inline">Xuất PDF</span>
                        <span className="sm:hidden">Lưu</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                
                {/* LEFT: Controls (Scrollable) */}
                <div className={`w-full lg:w-[450px] xl:w-[500px] bg-white border-r border-rose-100 flex flex-col h-full z-10 ${mobileView === 'PREVIEW' ? 'hidden lg:flex' : 'flex'}`}>
                    {/* Tabs */}
                    <div className="flex border-b border-gray-100 flex-shrink-0 bg-gray-50/50">
                        <button onClick={() => setActiveTab('INFO')} className={`flex-1 py-3 text-xs md:text-sm font-bold border-b-2 transition-colors ${activeTab === 'INFO' ? 'border-rose-500 text-rose-600 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}>Thông Tin</button>
                        <button onClick={() => setActiveTab('BANK')} className={`flex-1 py-3 text-xs md:text-sm font-bold border-b-2 transition-colors ${activeTab === 'BANK' ? 'border-rose-500 text-rose-600 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}>Ngân Hàng</button>
                        <button onClick={() => setActiveTab('PHOTO')} className={`flex-1 py-3 text-xs md:text-sm font-bold border-b-2 flex items-center justify-center gap-1 transition-colors ${activeTab === 'PHOTO' ? 'border-rose-500 text-rose-600 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}>
                            <ImageIcon className="w-3.5 h-3.5" /> Ảnh Cưới
                        </button>
                    </div>

                    {/* Scrollable Form Area */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-24 lg:pb-10 custom-scrollbar">

                        {activeTab === 'INFO' && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Chú Rể</label>
                                        <input className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm font-be-vietnam bg-gray-50 focus:bg-white transition-colors" value={invitation.groomName} onChange={e => handleInputChange('groomName', e.target.value)} placeholder="Tên Chú Rể" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Cô Dâu</label>
                                        <input className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm font-be-vietnam bg-gray-50 focus:bg-white transition-colors" value={invitation.brideName} onChange={e => handleInputChange('brideName', e.target.value)} placeholder="Tên Cô Dâu" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Ngày Cưới</label>
                                        <input type="date" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm bg-gray-50 focus:bg-white" value={invitation.date} onChange={e => handleInputChange('date', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Giờ Đón Khách</label>
                                        <input type="time" className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm bg-gray-50 focus:bg-white" value={invitation.time} onChange={e => handleInputChange('time', e.target.value)} />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Địa điểm</label>
                                    <input className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm font-be-vietnam bg-gray-50 focus:bg-white" value={invitation.location} onChange={e => handleInputChange('location', e.target.value)} placeholder="VD: Trung tâm tiệc cưới White Palace" />
                                </div>

                                <div>
                                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Địa chỉ chi tiết</label>
                                    <textarea rows={2} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm resize-none font-be-vietnam bg-gray-50 focus:bg-white" value={invitation.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="Số 123 Đường ABC, Phường XYZ..." />
                                </div>

                                <div>
                                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Link Bản Đồ (Google Maps)</label>
                                    <input className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm font-be-vietnam text-blue-600 bg-blue-50/50" value={invitation.mapLink || ''} onChange={e => handleInputChange('mapLink', e.target.value)} placeholder="https://maps.app.goo.gl/..." />
                                    <p className="text-[10px] text-gray-400 mt-1 italic">Dán link chia sẻ từ Google Maps để hiện nút chỉ đường.</p>
                                </div>

                                <div>
                                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Lời Nhắn</label>
                                    <textarea rows={3} className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm resize-none font-be-vietnam bg-gray-50 focus:bg-white" value={invitation.wishes} onChange={e => handleInputChange('wishes', e.target.value)} />
                                </div>

                                <div className="pt-4 border-t border-gray-100">
                                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Palette className="w-3 h-3" /> Màu chủ đạo</label>
                                    <div className="flex gap-3">
                                        {['#e11d48', '#db2777', '#7c3aed', '#059669', '#d97706', '#1e293b'].map(color => (
                                            <button
                                                key={color}
                                                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${invitation.themeColor === color ? 'border-gray-600 scale-110 shadow-md ring-2 ring-gray-100' : 'border-transparent'}`}
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
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700 flex items-start gap-2">
                                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Thông tin này sẽ tạo mã QR tự động giúp khách mời chuyển khoản dễ dàng.</span>
                                </div>

                                <div>
                                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Ngân hàng</label>
                                    <select
                                        className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm bg-gray-50 focus:bg-white"
                                        value={invitation.bankInfo.bankId}
                                        onChange={e => handleBankChange('bankId', e.target.value)}
                                    >
                                        <option value="">-- Chọn ngân hàng --</option>
                                        {BANKS.map(b => <option key={b.id} value={b.id}>{b.name} ({b.id})</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Số tài khoản</label>
                                    <input className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm font-mono bg-gray-50 focus:bg-white" value={invitation.bankInfo.accountNumber} onChange={e => handleBankChange('accountNumber', e.target.value)} placeholder="0123456789" />
                                </div>

                                <div>
                                    <label className="text-[10px] md:text-xs font-bold text-gray-500 uppercase">Tên chủ tài khoản (Không dấu)</label>
                                    <input className="w-full mt-1 p-2.5 border border-gray-200 rounded-lg focus:border-rose-500 outline-none text-sm uppercase bg-gray-50 focus:bg-white" value={invitation.bankInfo.accountName} onChange={e => handleBankChange('accountName', e.target.value.toUpperCase())} placeholder="NGUYEN VAN A" />
                                </div>
                            </div>
                        )}

                        {activeTab === 'PHOTO' && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* UPLOAD BUTTON */}
                                <div
                                    className="border-2 border-dashed border-rose-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all group bg-gray-50/50"
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
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                                <span>Thu nhỏ</span>
                                                <span className="font-bold flex items-center gap-1 text-gray-800"><Maximize className="w-3 h-3" /> Zoom ({invitation.photoConfig?.scale || 1}x)</span>
                                            </div>
                                            <input
                                                type="range" min="1" max="3" step="0.1"
                                                className="w-full accent-rose-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                value={invitation.photoConfig?.scale || 1}
                                                onChange={(e) => handlePhotoConfigChange('scale', parseFloat(e.target.value))}
                                            />
                                        </div>

                                        {/* X POSITION SLIDER */}
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                                <span>Trái</span>
                                                <span className="font-bold flex items-center gap-1 text-gray-800"><ArrowRightLeft className="w-3 h-3" /> Ngang</span>
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
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="flex justify-between text-xs text-gray-500 mb-2">
                                                <span>Lên</span>
                                                <span className="font-bold flex items-center gap-1 text-gray-800"><ArrowUp className="w-3 h-3" /> Dọc</span>
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

                {/* RIGHT: Preview (Fixed Desktop Layout) */}
                <div className={`flex-1 bg-gray-100/50 relative overflow-hidden flex flex-col items-center justify-center min-h-[calc(100vh-64px)] ${mobileView === 'EDIT' ? 'hidden lg:flex' : 'flex'}`}>
                    
                    {/* Background Pattern for Laptop View */}
                    <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #e11d48 1px, transparent 0)`, backgroundSize: '40px 40px' }}></div>
                    
                    {/* Scale Wrapper for Mobile */}
                    <div 
                        className="bg-white p-2 rounded-[2.5rem] shadow-2xl mb-4 border-[8px] border-gray-900 origin-center transition-transform duration-300 relative z-10"
                        style={{ 
                            transform: `scale(${previewScale})`,
                        }}
                    >
                        {/* Status Bar Mockup */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20"></div>

                        {/* CARD PREVIEW CONTAINER (Standard Mobile 375x667) */}
                        <div
                            ref={marketingCardRef}
                            className="w-[375px] bg-white relative flex flex-col overflow-hidden rounded-[2rem]"
                            style={{ height: '667px' }}
                        >
                            {/* Photo Area - Top 55% */}
                            <div className="h-[370px] w-full relative overflow-hidden bg-gray-100 border-b border-rose-50">
                                {invitation.couplePhoto ? (
                                    /* Use div background for correct export rendering */
                                    <div 
                                        className="w-full h-full bg-cover bg-no-repeat bg-center"
                                        style={{
                                            backgroundImage: `url(${invitation.couplePhoto})`,
                                            transform: `scale(${invitation.photoConfig?.scale || 1}) translate(${invitation.photoConfig?.x || 0}px, ${invitation.photoConfig?.y || 0}px)`
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                                        <ImageIcon className="w-16 h-16 mb-2" />
                                        <span className="text-sm font-medium">Chưa có ảnh</span>
                                    </div>
                                )}

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none"></div>

                                {/* Watermark (Top Right) - Perfectly Aligned */}
                                <div className="absolute top-4 right-4 z-20">
                                    <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/50 flex items-center gap-2 shadow-lg">
                                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                                        <span className="text-rose-900 text-[10px] font-bold tracking-wider uppercase font-be-vietnam flex items-center h-full pt-0.5">WedPlan AI</span>
                                    </div>
                                </div>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 px-5 py-4 flex flex-col bg-white relative justify-between">
                                <FloralCorner position="tl" />
                                <FloralCorner position="tr" />
                                
                                {/* Date / Time Display (Clean Style) */}
                                <div className="w-full relative z-10 flex items-center justify-between">
                                     <div className="text-left">
                                         <p className="text-[10px] text-gray-400 uppercase tracking-widest font-be-vietnam font-bold mb-0.5">Save The Date</p>
                                         <div className="text-4xl font-black text-gray-800 font-serif leading-none tracking-tight">
                                            {dateObj.day}
                                         </div>
                                         <div className="text-[10px] font-bold text-rose-500 uppercase font-be-vietnam tracking-wide">
                                            Tháng {dateObj.month}, {dateObj.year}
                                         </div>
                                     </div>
                                     
                                     <div className="h-8 w-px bg-gray-200 mx-4"></div>

                                     <div className="text-right">
                                         <p className="text-[10px] text-gray-400 uppercase tracking-widest font-be-vietnam font-bold mb-0.5">Giờ đón khách</p>
                                         <div className="text-3xl font-black text-rose-600 font-mono leading-none tracking-tight">
                                            {invitation.time || '00:00'}
                                         </div>
                                     </div>
                                </div>

                                {/* Names & Location */}
                                <div className="space-y-1 text-center relative z-10 my-2">
                                     <h2 className="font-['Great_Vibes'] text-5xl text-gray-800 leading-tight">
                                        {invitation.groomName} <span className="text-rose-400 text-3xl font-serif">&</span> {invitation.brideName}
                                     </h2>
                                     <div className="pt-2">
                                        <p className="text-xs font-black text-gray-700 font-be-vietnam uppercase tracking-widest line-clamp-1">
                                            {invitation.location || 'Tên nhà hàng'}
                                        </p>
                                        <p className="text-[10px] text-gray-500 italic mt-0.5 line-clamp-1 px-2">
                                            {invitation.address || 'Địa chỉ tổ chức...'}
                                        </p>
                                     </div>
                                </div>

                                {/* QR & Footer */}
                                <div className="w-full relative z-10">
                                    <div className="flex items-center justify-between bg-white p-2 rounded-xl border-2 border-dashed border-rose-200">
                                         <div className="flex items-center gap-3 text-left">
                                             <div className="bg-rose-50 p-1 rounded-lg">
                                                <QRCodeCanvas value={publicLink} size={48} />
                                             </div>
                                             <div>
                                                 <p className="text-[10px] font-bold text-gray-800 uppercase font-be-vietnam">Mừng cưới</p>
                                                 <p className="text-[9px] text-gray-500 font-be-vietnam">Quét mã QR</p>
                                             </div>
                                         </div>
                                         {/* Footer Branding Aligned */}
                                         <div className="flex flex-col items-end opacity-80 pr-1">
                                             <span className="text-[7px] text-gray-400 font-be-vietnam uppercase tracking-wider font-bold">Powered by</span>
                                             <span className="text-[9px] font-black text-rose-600 font-be-vietnam">WEDPLAN AI</span>
                                         </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 font-medium font-be-vietnam hidden lg:block mt-2">Mẹo: Kéo thả ảnh ở tab "Ảnh Cưới" để căn chỉnh khuôn mặt</p>
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
                @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
                
                .font-merriweather { font-family: 'Merriweather', serif; }
                .font-cinzel { font-family: 'Cinzel', serif; }
                .font-be-vietnam { font-family: 'Be Vietnam Pro', sans-serif; }
                .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
                
                /* Custom Scrollbar for form area */
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e5e7eb; border-radius: 20px; }
            `}</style>
        </div>
    );
};

export default InvitationBuilder;
