import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Copy, Share2, ExternalLink, Check, Heart } from 'lucide-react';
import { useStore } from '../../../store/useStore';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SITE_NAME = 'wedplanai.io.vn';

// Cross-browser rounded rectangle path (ctx.roundRect was added in Chrome 99 / Safari 15.4)
function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// Base64-encoded heart SVG — more reliable than utf8 data URIs inside SVG <image> tags
const HEART_SVG_B64 = 'data:image/svg+xml;base64,' + btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
    '<path fill="#be185d" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' +
    '</svg>'
);

const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

const stripHtml = (html: string) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
};

const resolveImageUrl = (url: string | undefined): string | undefined => {
    if (!url) return url;
    const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
    return url;
};

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
    const { getEffectiveUid, invitation } = useStore();
    const uid = getEffectiveUid();
    const shareUrl = `https://${SITE_NAME}/thiep`;
    const qrContainerRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);

    if (!isOpen) return null;

    const groomShort = stripHtml(invitation?.groomShortName || invitation?.groomName || '');
    const brideShort = stripHtml(invitation?.brideShortName || invitation?.brideName || '');
    const rawDate = stripHtml(invitation?.date || '');
    const weddingDate = rawDate
        ? new Date(rawDate + 'T00:00:00').toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          })
        : '';
    const location = stripHtml(invitation?.location || '');
    const address = stripHtml(invitation?.address || '');
    const photoUrl = resolveImageUrl(invitation?.couplePhoto);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
        } catch {
            const el = document.createElement('textarea');
            el.value = shareUrl;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        useStore.getState().addNotification('SUCCESS', 'Đã sao chép link chia sẻ!');
    };

    const handleDownload = async () => {
        if (!qrContainerRef.current || downloading) return;
        setDownloading(true);

        const svgEl = qrContainerRef.current.querySelector('svg');
        if (!svgEl) { setDownloading(false); return; }

        // Màn hình điện thoại tiêu chuẩn (3:4)
        const CARD_W = 1080;
        const CARD_H = 1440;
        const TOP_H = CARD_H * 0.48; // 48% ảnh cưới
        const QR_SIZE = 360;
        const QR_X = (CARD_W - QR_SIZE) / 2;
        const QR_Y = TOP_H - (QR_SIZE / 2); // Nằm chính giữa ranh giới cắt

        const canvas = document.createElement('canvas');
        canvas.width = CARD_W;
        canvas.height = CARD_H;
        const ctx = canvas.getContext('2d');
        if (!ctx) { setDownloading(false); return; }

        // 1. Draw TOP HALF (Ảnh cưới hoặc Gradient)
        if (photoUrl) {
            try {
                const img = await loadImage(photoUrl);
                const imgRatio = img.width / img.height;
                const targetRatio = CARD_W / TOP_H;
                let sx, sy, sw, sh;
                if (imgRatio > targetRatio) {
                    sh = img.height;
                    sw = img.height * targetRatio;
                    sy = 0;
                    sx = (img.width - sw) / 2;
                } else {
                    sw = img.width;
                    sh = img.width / targetRatio;
                    sx = 0;
                    sy = (img.height - sh) / 2;
                }
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CARD_W, TOP_H);
                
                // Shadow mờ dưới ảnh để nổi QR
                const grad = ctx.createLinearGradient(0, TOP_H - 180, 0, TOP_H);
                grad.addColorStop(0, 'rgba(0,0,0,0)');
                grad.addColorStop(1, 'rgba(0,0,0,0.3)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, TOP_H - 180, CARD_W, 180);
            } catch (err) {
                const grad = ctx.createLinearGradient(0, 0, CARD_W, TOP_H);
                grad.addColorStop(0, '#fce7f3');
                grad.addColorStop(1, '#fbcfe8');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, CARD_W, TOP_H);
            }
        } else {
            const grad = ctx.createLinearGradient(0, 0, CARD_W, TOP_H);
            grad.addColorStop(0, '#fce7f3');
            grad.addColorStop(1, '#fbcfe8');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, CARD_W, TOP_H);
        }

        // 2. Draw BOTTOM HALF (Thông tin)
        const bottomGrad = ctx.createLinearGradient(0, TOP_H, 0, CARD_H);
        bottomGrad.addColorStop(0, '#ffffff');
        bottomGrad.addColorStop(1, '#fff1f2');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, TOP_H, CARD_W, CARD_H - TOP_H);

        // 3. Draw Text In Bottom
        let textY = QR_Y + QR_SIZE + 110;
        
        if (groomShort && brideShort) {
            ctx.textAlign = 'center';
            
            // Measure widths
            ctx.font = 'italic bold 64px "Playfair Display", "Times New Roman", serif';
            const groomWidth = ctx.measureText(groomShort + ' ').width;
            const brideWidth = ctx.measureText(' ' + brideShort).width;
            ctx.font = 'italic bold 44px "Playfair Display", "Times New Roman", serif';
            const ampWidth = ctx.measureText('&').width;
            
            const totalWidth = groomWidth + ampWidth + brideWidth;
            const startX = (CARD_W - totalWidth) / 2;
            
            ctx.fillStyle = '#9b2948';
            ctx.textAlign = 'left';
            
            // Draw groom
            ctx.font = 'italic bold 64px "Playfair Display", "Times New Roman", serif';
            ctx.fillText(groomShort + ' ', startX, textY);
            
            // Draw amp
            ctx.font = 'italic bold 44px "Playfair Display", "Times New Roman", serif';
            ctx.globalAlpha = 0.7;
            ctx.fillText('&', startX + groomWidth, textY - 4); // Slightly raised
            ctx.globalAlpha = 1.0;
            
            // Draw bride
            ctx.font = 'italic bold 64px "Playfair Display", "Times New Roman", serif';
            ctx.fillText(' ' + brideShort, startX + groomWidth + ampWidth, textY);
            
            textY += 45;
        }

        if (weddingDate) {
            ctx.textAlign = 'center';
            ctx.font = '28px "Lora", "Times New Roman", serif';
            ctx.fillStyle = '#6b7280';
            if ('letterSpacing' in ctx) {
                (ctx as any).letterSpacing = '4px';
            }
            ctx.fillText(weddingDate, CARD_W / 2, textY);
            if ('letterSpacing' in ctx) {
                (ctx as any).letterSpacing = '0px';
            }
            textY += 55;
        }

        if (location) {
            ctx.textAlign = 'center';
            ctx.font = 'bold 32px "Playfair Display", "Times New Roman", serif';
            ctx.fillStyle = '#9f1239';
            ctx.fillText(location, CARD_W / 2, textY);
            textY += 40;
        }

        if (address) {
            ctx.textAlign = 'center';
            ctx.font = 'italic 26px "Lora", "Times New Roman", serif';
            ctx.fillStyle = '#6b7280';
            ctx.fillText(address.length > 55 ? address.substring(0, 52) + '...' : address, CARD_W / 2, textY);
        }

        // 4. Draw Footer
        const footerY = CARD_H - 70;
        
        ctx.textAlign = 'center';
        ctx.font = '20px Arial';
        ctx.fillStyle = '#fda4af'; // rose-300
        ctx.fillText('♥', CARD_W / 2, footerY - 30);
        
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(225, 29, 72, 0.2)'; // rose-600/20
        ctx.lineWidth = 1;
        ctx.moveTo(CARD_W / 2 - 180, footerY - 36);
        ctx.lineTo(CARD_W / 2 - 25, footerY - 36);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(CARD_W / 2 + 25, footerY - 36);
        ctx.lineTo(CARD_W / 2 + 180, footerY - 36);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.font = 'italic 24px "Lora", "Times New Roman", serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText('Quét mã để xem thiệp cưới trực tuyến', CARD_W / 2, footerY);

        ctx.font = 'bold 26px "Cinzel", "Times New Roman", serif';
        ctx.fillStyle = '#be185d'; // rose-700
        // Use letter spacing if supported, otherwise just draw
        if ('letterSpacing' in ctx) {
            (ctx as any).letterSpacing = '6px';
        }
        ctx.fillText(SITE_NAME.toUpperCase(), CARD_W / 2, footerY + 35);
        if ('letterSpacing' in ctx) {
            (ctx as any).letterSpacing = '0px';
        }

        // 5. Draw QR Code in Center
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const svgB64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));

        await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
                ctx.shadowColor = 'rgba(159, 18, 57, 0.15)';
                ctx.shadowBlur = 50;
                ctx.shadowOffsetY = 20;
                ctx.fillStyle = '#ffffff';
                roundRectPath(ctx, QR_X - 25, QR_Y - 25, QR_SIZE + 50, QR_SIZE + 50, 40);
                ctx.fill();
                
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetY = 0;

                ctx.strokeStyle = 'rgba(254, 205, 211, 0.5)';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.drawImage(img, QR_X, QR_Y, QR_SIZE, QR_SIZE);

                const pngUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.download = 'QR_ThiepCuoi_' + SITE_NAME + '.png';
                a.href = pngUrl;
                a.click();
                resolve();
            };
            img.onerror = () => resolve();
            img.src = svgB64;
        });

        setDownloading(false);
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[95vh]"
                style={{ animation: 'fadeInScale 0.2s ease-out' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <Share2 size={18} className="text-rose-500" />
                        <h3 className="font-semibold text-gray-800 text-[15px]">Chia sẻ Thiệp Cưới</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto p-5 flex flex-col gap-5 bg-gray-50/50">
                    {/* The Preview Card */}
                    <div className="w-full bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden flex flex-col relative shrink-0 mx-auto max-w-[320px]">
                        
                        {/* Top 45%: Photo */}
                        <div className="h-[200px] w-full relative bg-rose-100">
                            {photoUrl ? (
                                <img src={photoUrl} alt="Couple" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-rose-200 to-pink-300" />
                            )}
                            {/* Soft gradient to blend with QR */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />
                        </div>

                        {/* Bottom 55%: Info */}
                        <div className="min-h-[280px] w-full bg-gradient-to-b from-white to-rose-50/30 pt-[100px] pb-6 px-5 flex flex-col items-center text-center">
                            {(groomShort && brideShort) && (
                                <div
                                    className="text-[22px] font-semibold text-rose-800 italic leading-snug mb-2.5 flex items-center justify-center gap-1.5"
                                    style={{ fontFamily: "'Playfair Display', 'Times New Roman', serif" }}
                                >
                                    <span>{groomShort}</span>
                                    <span className="text-[0.7em] opacity-70">&</span>
                                    <span>{brideShort}</span>
                                </div>
                            )}
                            {weddingDate && (
                                <div className="text-[13px] text-gray-500 tracking-widest mb-4 mt-1" style={{ fontFamily: "'Lora', 'Times New Roman', serif" }}>
                                    {weddingDate}
                                </div>
                            )}
                            {location && (
                                <div className="text-[15px] text-rose-800 font-semibold px-4 mb-2 line-clamp-1" style={{ fontFamily: "'Playfair Display', 'Times New Roman', serif" }}>
                                    {location}
                                </div>
                            )}
                            {address && (
                                <div className="text-[12px] text-gray-500 italic px-4 line-clamp-2 max-w-[280px] leading-relaxed mb-6" style={{ fontFamily: "'Lora', 'Times New Roman', serif" }}>
                                    {address}
                                </div>
                            )}
                            
                            <div className="mt-auto flex flex-col items-center gap-1.5 w-full pb-2 pt-6">
                                <div className="flex items-center justify-center w-full mb-1 opacity-70">
                                    <div className="h-[1px] bg-gradient-to-r from-transparent via-rose-300 to-transparent w-1/4"></div>
                                    <Heart className="w-3.5 h-3.5 text-rose-300 mx-2 fill-current" />
                                    <div className="h-[1px] bg-gradient-to-r from-transparent via-rose-300 to-transparent w-1/4"></div>
                                </div>
                                <div className="text-[12px] italic text-gray-500 tracking-wide mb-1" style={{ fontFamily: "'Lora', 'Times New Roman', serif" }}>
                                    Quét mã để xem thiệp cưới trực tuyến
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-bold tracking-[0.2em] text-rose-700 uppercase" style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}>
                                        {SITE_NAME}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Middle Overlapping QR Code */}
                        <div className="absolute top-[200px] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                            <div ref={qrContainerRef} className="p-2.5 bg-white rounded-2xl shadow-xl shadow-rose-900/10 border border-rose-50">
                                <QRCodeSVG
                                    value={shareUrl}
                                    size={110}
                                    bgColor="#ffffff"
                                    fgColor="#be185d"
                                    level="H"
                                    marginSize={0}
                                    imageSettings={{
                                        src: HEART_SVG_B64,
                                        height: 24,
                                        width: 24,
                                        excavate: true,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="w-full flex flex-col gap-2.5 shrink-0">
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-medium text-sm rounded-xl transition-colors shadow-sm shadow-rose-200"
                        >
                            <Download size={16} />
                            {downloading ? 'Đang tạo ảnh...' : 'Tải QR đẹp (PNG)'}
                        </button>
                        <div className="flex gap-2.5">
                            <button
                                onClick={handleCopy}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 border font-medium text-sm rounded-xl transition-all ${
                                    copied
                                        ? 'bg-green-50 border-green-300 text-green-700'
                                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                                }`}
                            >
                                {copied ? (
                                    <><Check size={15} /> Đã copy</>
                                ) : (
                                    <><Copy size={15} /> Copy Link</>
                                )}
                            </button>
                            <a
                                href={shareUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm rounded-xl transition-all"
                            >
                                <ExternalLink size={15} className="text-rose-400" />
                                Xem thẻ
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95); }
                    to   { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default ShareModal;
