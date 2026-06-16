import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Copy, Share2, ExternalLink, Check } from 'lucide-react';
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

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
    const { getEffectiveUid, invitation } = useStore();
    const uid = getEffectiveUid();
    const shareUrl = `https://${SITE_NAME}/?view=invitation&uid=${uid}`;
    const qrContainerRef = useRef<HTMLDivElement>(null);
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);

    if (!isOpen) return null;

    const groomShort = invitation?.groomShortName || invitation?.groomName || '';
    const brideShort = invitation?.brideShortName || invitation?.brideName || '';
    const coupleLabel = groomShort && brideShort ? `${groomShort} & ${brideShort}` : '';
    const weddingDate = invitation?.date
        ? new Date(invitation.date + 'T00:00:00').toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
          })
        : '';

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

        const CARD_W = 440;
        const CARD_H = coupleLabel ? 560 : 480;
        const SCALE = 2;
        const canvas = document.createElement('canvas');
        canvas.width = CARD_W * SCALE;
        canvas.height = CARD_H * SCALE;
        const ctx = canvas.getContext('2d');
        if (!ctx) { setDownloading(false); return; }
        ctx.scale(SCALE, SCALE);

        // Gradient background
        const grad = ctx.createLinearGradient(0, 0, 0, CARD_H);
        grad.addColorStop(0, '#fff1f2');
        grad.addColorStop(1, '#fce7f3');
        ctx.fillStyle = grad;
        roundRectPath(ctx, 0, 0, CARD_W, CARD_H, 20);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(190,24,93,0.18)';
        ctx.lineWidth = 2;
        roundRectPath(ctx, 10, 10, CARD_W - 20, CARD_H - 20, 14);
        ctx.stroke();

        // Site name at top
        ctx.textAlign = 'center';
        ctx.font = 'bold 15px Arial, sans-serif';
        ctx.fillStyle = '#be185d';
        ctx.fillText(SITE_NAME.toUpperCase(), CARD_W / 2, 50);

        let yOffset = 70;

        // Couple names
        if (coupleLabel) {
            ctx.font = 'italic bold 26px Georgia, serif';
            ctx.fillStyle = '#9b2948';
            ctx.fillText(coupleLabel, CARD_W / 2, yOffset + 28);
            yOffset += 52;
        }

        // Wedding date
        if (weddingDate) {
            ctx.font = '13px Arial, sans-serif';
            ctx.fillStyle = '#9ca3af';
            ctx.fillText(weddingDate, CARD_W / 2, yOffset + 16);
            yOffset += 30;
        }

        yOffset += 10;

        // QR code SVG → image
        const svgData = new XMLSerializer().serializeToString(svgEl);
        const svgB64 = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));

        await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
                const QR_SIZE = 240;
                const QR_X = (CARD_W - QR_SIZE) / 2;
                // White background for QR
                ctx.fillStyle = '#ffffff';
                roundRectPath(ctx, QR_X - 12, yOffset - 12, QR_SIZE + 24, QR_SIZE + 24, 12);
                ctx.fill();
                ctx.drawImage(img, QR_X, yOffset, QR_SIZE, QR_SIZE);
                yOffset += QR_SIZE + 24;

                // Divider
                ctx.strokeStyle = 'rgba(190,24,93,0.15)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(60, yOffset + 12);
                ctx.lineTo(CARD_W - 60, yOffset + 12);
                ctx.stroke();
                yOffset += 28;

                // "Scan to view invitation"
                ctx.font = '13px Arial, sans-serif';
                ctx.fillStyle = '#6b7280';
                ctx.fillText('Quét mã QR để xem thiệp cưới trực tuyến', CARD_W / 2, yOffset + 16);
                yOffset += 34;

                ctx.font = 'bold 14px Arial, sans-serif';
                ctx.fillStyle = '#be185d';
                ctx.fillText('🌸  ' + SITE_NAME + '  🌸', CARD_W / 2, yOffset + 16);

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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
                style={{ animation: 'fadeInScale 0.2s ease-out' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50">
                    <div className="flex items-center gap-2">
                        <Share2 size={16} className="text-rose-500" />
                        <h3 className="font-semibold text-gray-800 text-sm">Chia sẻ Thiệp Cưới</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/70 rounded-full transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 flex flex-col items-center gap-4">
                    {/* QR Card */}
                    <div className="w-full bg-gradient-to-b from-rose-50 to-pink-50 rounded-2xl border border-rose-100 p-5 flex flex-col items-center gap-3 shadow-inner">
                        {/* Brand */}
                        <div className="text-center">
                            <div className="text-[10px] font-bold tracking-[0.2em] text-rose-400 uppercase">
                                {SITE_NAME}
                            </div>
                            {coupleLabel && (
                                <div
                                    className="text-[17px] font-semibold text-rose-800 mt-0.5 italic"
                                    style={{ fontFamily: "'Playfair Display', 'EB Garamond', Georgia, serif" }}
                                >
                                    {coupleLabel}
                                </div>
                            )}
                            {weddingDate && (
                                <div className="text-[11px] text-gray-400 mt-0.5">{weddingDate}</div>
                            )}
                        </div>

                        {/* QR Code */}
                        <div ref={qrContainerRef} className="p-3 bg-white rounded-2xl shadow-sm">
                            <QRCodeSVG
                                value={shareUrl}
                                size={192}
                                bgColor="#ffffff"
                                fgColor="#be185d"
                                level="H"
                                marginSize={1}
                                imageSettings={{
                                    src: HEART_SVG_B64,
                                    height: 36,
                                    width: 36,
                                    excavate: true,
                                }}
                            />
                        </div>

                        <div className="text-[11px] text-gray-400 text-center">
                            Quét mã để xem thiệp cưới trực tuyến
                        </div>
                    </div>

                    {/* URL display */}
                    <div
                        className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={handleCopy}
                        title="Nhấp để sao chép"
                    >
                        <ExternalLink size={13} className="text-rose-400 shrink-0" />
                        <span className="flex-1 text-[11px] text-gray-500 truncate font-mono">{shareUrl}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="w-full flex gap-2.5">
                        <button
                            onClick={handleCopy}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 border font-medium text-sm rounded-xl transition-all ${
                                copied
                                    ? 'bg-green-50 border-green-300 text-green-700'
                                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                            }`}
                        >
                            {copied ? (
                                <><Check size={15} /> Đã sao chép</>
                            ) : (
                                <><Copy size={15} /> Sao chép Link</>
                            )}
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-medium text-sm rounded-xl transition-colors shadow-sm shadow-rose-200"
                        >
                            <Download size={15} />
                            {downloading ? 'Đang tạo...' : 'Tải QR PNG'}
                        </button>
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
