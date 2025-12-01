
import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore'; // Just for types, actual fetch is separated
import { loadPublicInvitation } from '../../services/cloudService';
import { InvitationData } from '../../types';
import {
  Calendar, MapPin, Clock, Heart, ArrowRight, Check,
  Navigation, Gift, Copy
} from 'lucide-react';

interface Props {
  uid: string;
}

const PublicInvitationView: React.FC<Props> = ({ uid }) => {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchInv = async () => {
      if (!uid) return;
      try {
        const data = await loadPublicInvitation(uid);
        setInvitation(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInv();
  }, [uid]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-rose-50 text-rose-500"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-current"></div></div>;
  }

  if (!invitation || !invitation.groomName) {
    return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500">Thiệp mời chưa được tạo hoặc không tồn tại.</div>;
  }

  // Colors derived from themeColor or defaults
  const primaryColor = invitation.themeColor || '#e11d48';
  const imgConfig = invitation.imageConfig || { scale: 1, x: 0, y: 0 };

  // Bank QR
  const bankQrUrl = invitation.bankInfo.bankId
    ? `https://img.vietqr.io/image/${invitation.bankInfo.bankId}-${invitation.bankInfo.accountNumber}-compact.png?accountName=${encodeURIComponent(invitation.bankInfo.accountName)}`
    : null;

  const handleCopyBank = () => {
    navigator.clipboard.writeText(invitation.bankInfo.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FDF2F8] font-serif-display pb-10">
      {/* 1. Cover / Hero Section */}
      <div className="relative h-[60vh] md:h-[70vh] bg-gray-900 overflow-hidden">
        {invitation.coverImage ? (
          <img
            src={invitation.coverImage}
            className="w-full h-full object-cover opacity-80 origin-center transition-transform duration-1000"
            alt="Cover"
            style={{
              transform: `scale(${imgConfig.scale}) translate(${imgConfig.x}%, ${imgConfig.y}%)`
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-400 to-pink-600"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>

        <div className="absolute bottom-0 w-full p-8 md:p-12 text-center text-white animate-fade-in-up pointer-events-none">
          <p className="text-lg md:text-xl uppercase tracking-[0.3em] font-light mb-4 opacity-90">Save The Date</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            {invitation.groomName} <span className="text-rose-500">&</span> {invitation.brideName}
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm md:text-base font-sans tracking-widest uppercase opacity-90">
            <span>{new Date(invitation.date).toLocaleDateString('vi-VN', { weekday: 'long' })}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>{new Date(invitation.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-10 relative z-10 space-y-6">

        {/* 2. Invitation Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 text-center border-t-4" style={{ borderColor: primaryColor }}>
          <Heart className="w-10 h-10 mx-auto mb-4 fill-current" style={{ color: primaryColor }} />
          <p className="text-gray-500 font-sans text-sm md:text-base uppercase tracking-wider mb-6">Trân trọng kính mời quý khách đến dự Lễ Thành Hôn</p>

          <p className="font-sans italic text-gray-600 mb-8 px-4 leading-relaxed">"{invitation.wishes}"</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 py-6 border-y border-gray-100">
            <div className="flex flex-col items-center">
              <Clock className="w-6 h-6 mb-2 text-gray-400" />
              <h3 className="font-bold text-lg text-gray-800 uppercase font-sans">Thời gian</h3>
              <p className="text-2xl font-bold mt-1" style={{ color: primaryColor }}>{invitation.time}</p>
              <p className="text-gray-500 font-sans">{new Date(invitation.date).toLocaleDateString('vi-VN')}</p>
            </div>
            <div className="flex flex-col items-center">
              <MapPin className="w-6 h-6 mb-2 text-gray-400" />
              <h3 className="font-bold text-lg text-gray-800 uppercase font-sans">Địa điểm</h3>
              <p className="text-lg font-bold mt-1 text-gray-800">{invitation.location}</p>
              <p className="text-gray-500 font-sans text-sm">{invitation.address}</p>
            </div>
          </div>

          <div className="mt-8">
            {invitation.mapLink && (
              <a
                href={invitation.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold shadow-lg hover:shadow-xl transition-all font-sans transform hover:-translate-y-1"
                style={{ backgroundColor: primaryColor }}
              >
                <Navigation className="w-4 h-4" /> Chỉ đường trên Map
              </a>
            )}
          </div>
        </div>

        {/* 3. Gift Box (Banking) */}
        {bankQrUrl && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-500">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-gray-800 font-sans">Hộp Mừng Cưới</h3>
              <p className="text-sm text-gray-500 mt-1 font-sans">Dành cho người bận rộn</p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
              <div className="p-2 border border-rose-100 rounded-xl bg-white shadow-sm">
                <img src={bankQrUrl} className="w-48 h-auto rounded-lg" alt="QR Banking" />
              </div>
              <div className="text-center md:text-left font-sans">
                <p className="text-sm text-gray-500 mb-1">Ngân hàng</p>
                <p className="font-bold text-gray-800 mb-4">{invitation.bankInfo.bankId}</p>

                <p className="text-sm text-gray-500 mb-1">Chủ tài khoản</p>
                <p className="font-bold text-gray-800 mb-4 uppercase">{invitation.bankInfo.accountName}</p>

                <p className="text-sm text-gray-500 mb-1">Số tài khoản</p>
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <p className="font-mono font-bold text-lg text-rose-600 tracking-wider">{invitation.bankInfo.accountNumber}</p>
                  <button onClick={handleCopyBank} className="text-gray-400 hover:text-gray-600 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copied && <span className="text-xs text-green-600 font-medium">Đã sao chép!</span>}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-8 pb-4">
          <p className="text-xs text-gray-400 font-sans">Thiệp được tạo miễn phí bởi <span className="font-bold text-rose-400">WedPlan AI</span></p>
        </div>
      </div>

      <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 1s ease-out forwards;
                }
            `}</style>
    </div>
  );
};

export default PublicInvitationView;
