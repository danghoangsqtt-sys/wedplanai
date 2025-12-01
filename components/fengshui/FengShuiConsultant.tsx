import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { analyzeCompatibility, findAuspiciousDates } from '../../services/fengShuiService';
import { checkGuestIPLimit, incrementGuestIPUsage } from '../../services/cloudService';
import { getZodiacSymbol } from '../../utils/fengShuiUtils';
import { CoupleProfile, ElementKey } from '../../types/fengshui';
import {
   Heart, Calendar, Moon, Sun, Sparkles,
   ArrowRight, Loader2, Check, Share2, Star, Clock, Info,
   Flame, Droplets, Mountain, Wind, Coins, ArrowLeftRight,
   Hash, Zap, Lock, Crown, Scroll
} from 'lucide-react';

// --- HELPER: ELEMENT VISUALS ---
const getElementConfig = (key: ElementKey | undefined) => {
   switch (key) {
      case 'KIM': return { label: 'Kim', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-300', icon: Coins };
      case 'MOC': return { label: 'Mộc', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Wind };
      case 'THUY': return { label: 'Thủy', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Droplets };
      case 'HOA': return { label: 'Hỏa', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: Flame };
      case 'THO': return { label: 'Thổ', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Mountain };
      default: return { label: '?', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-200', icon: Sparkles };
   }
};

// --- COMPONENT: ANCIENT PAPER SCROLL (Sớ Táo Quân) ---
const AncientScroll: React.FC<{ children: React.ReactNode, title: string, icon?: React.ReactNode }> = ({ children, title, icon }) => {
   return (
      <div className="relative w-full max-w-4xl mx-auto my-4 md:my-8 shadow-2xl filter drop-shadow-xl animate-fadeIn">
         {/* Top Roller */}
         <div className="h-6 md:h-8 bg-gradient-to-r from-[#8B4513] via-[#A0522D] to-[#8B4513] rounded-t-lg border-b-4 border-[#5C4033] shadow-md relative z-20 flex items-center justify-center">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 md:w-8 h-8 md:h-10 bg-[#5C4033] rounded-l-md -ml-2 shadow-lg"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 md:w-8 h-8 md:h-10 bg-[#5C4033] rounded-r-md -mr-2 shadow-lg"></div>
            {/* Gold Accent */}
            <div className="w-1/2 h-0.5 md:h-1 bg-[#DAA520] opacity-50 rounded-full"></div>
         </div>

         {/* Main Paper Body - Adjusted padding for mobile */}
         <div className="bg-[#FFF8E7] relative px-4 py-8 md:px-14 md:py-16 min-h-[400px] md:min-h-[500px] border-x-4 md:border-x-8 border-[#F5DEB3]">
            {/* Texture Overlay (Rice Paper) */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Asian Pattern Borders (Corner Accents - Cloud/Dragon motif) */}
            <div className="absolute top-2 left-2 md:top-4 md:left-4 w-12 h-12 md:w-20 md:h-20 opacity-20 pointer-events-none border-t-2 border-l-2 border-[#8B4513] rounded-tl-3xl"></div>
            <div className="absolute top-2 right-2 md:top-4 md:right-4 w-12 h-12 md:w-20 md:h-20 opacity-20 pointer-events-none border-t-2 border-r-2 border-[#8B4513] rounded-tr-3xl"></div>
            <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 w-12 h-12 md:w-20 md:h-20 opacity-20 pointer-events-none border-b-2 border-l-2 border-[#8B4513] rounded-bl-3xl"></div>
            <div className="absolute bottom-2 right-2 md:bottom-4 md:right-4 w-12 h-12 md:w-20 md:h-20 opacity-20 pointer-events-none border-b-2 border-r-2 border-[#8B4513] rounded-br-3xl"></div>

            {/* Content Container */}
            <div className="relative z-10">
               {/* Header Stamp (Chiếu Thư / Sớ) */}
               <div className="flex flex-col items-center justify-center mb-6 md:mb-10 pb-4 md:pb-6 border-b-2 border-double border-[#8B4513]/20 mx-auto max-w-2xl">
                  <div className="text-[#8B4513] mb-2 md:mb-3 p-2 md:p-3 border-2 border-[#8B4513] rounded-full bg-[#FFF8E7] shadow-sm">
                     {icon || <Scroll className="w-6 h-6 md:w-8 md:h-8" />}
                  </div>
                  <h3 className="font-['Merriweather',serif] font-black text-2xl md:text-4xl text-[#8B4513] uppercase tracking-[0.1em] md:tracking-[0.15em] text-center drop-shadow-sm">
                     {title}
                  </h3>
                  <div className="flex items-center gap-2 mt-3 md:mt-4 opacity-70">
                     <span className="h-[1px] w-8 md:w-12 bg-[#8B4513]"></span>
                     <span className="text-[#8B4513] text-[10px] md:text-xs font-['Merriweather',serif] italic">Phụng Thiên Thừa Vận</span>
                     <span className="h-[1px] w-8 md:w-12 bg-[#8B4513]"></span>
                  </div>
               </div>

               {/* Body Text */}
               <div className="font-['Merriweather',serif] text-[#3E2723]">
                  {children}
               </div>

               {/* Footer Seal */}
               <div className="mt-8 md:mt-12 flex justify-end opacity-80">
                  <div className="w-16 h-16 md:w-24 md:h-24 border-4 border-red-700 rounded-lg flex items-center justify-center rotate-[-15deg] mask-image-grunge">
                     <div className="text-red-700 font-['Merriweather',serif] font-bold text-center text-[10px] md:text-xs leading-tight uppercase border-2 border-red-700 p-0.5 md:p-1 m-0.5 md:m-1">
                        Thiên<br />Định<br />Nhân<br />Duyên
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Bottom Roller */}
         <div className="h-6 md:h-8 bg-gradient-to-r from-[#8B4513] via-[#A0522D] to-[#8B4513] rounded-b-lg border-t-4 border-[#5C4033] shadow-md relative z-20 flex items-center justify-center">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 md:w-10 h-8 md:h-10 bg-[#5C4033] rounded-full -ml-3 shadow-lg border-r-2 border-[#3E2723]"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 md:w-10 h-8 md:h-10 bg-[#5C4033] rounded-full -mr-3 shadow-lg border-l-2 border-[#3E2723]"></div>
            {/* Tassel */}
            <div className="absolute right-0 -mr-2 top-4 md:top-6 w-1 h-12 md:h-16 bg-red-800"></div>
         </div>
      </div>
   );
};

// --- HELPER: MARKDOWN RENDERER (Optimized) ---
const MarkdownRenderer = ({ content }: { content: string }) => {
   if (!content) return null;

   const parseInline = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
         if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold text-[#8B4513]">{part.slice(2, -2)}</strong>;
         }
         return part;
      });
   };

   return (
      <div className="space-y-6 md:space-y-8 text-[#2C241B] font-['Merriweather',serif] text-base md:text-xl leading-relaxed md:leading-loose text-justify">
         {content.split('\n').map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return null;

            // H1, H2, H3 Headers -> Styled as Imperial Decree sections
            if (trimmed.startsWith('### ')) {
               return (
                  <div key={index} className="mt-8 md:mt-10 mb-4 md:mb-6 text-center">
                     <h4 className="text-lg md:text-2xl font-bold text-[#C0392B] inline-block relative px-4 md:px-8 py-1 md:py-2 border-y-2 border-[#C0392B]/30 uppercase tracking-widest">
                        {parseInline(trimmed.substring(4))}
                     </h4>
                  </div>
               );
            }
            if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
               return (
                  <h3 key={index} className="text-xl md:text-3xl font-bold text-[#8B4513] mt-8 md:mt-12 mb-4 md:mb-6 text-center underline decoration-wavy decoration-[#C0392B]/50 underline-offset-8">
                     {parseInline(trimmed.replace(/^#+\s/, ''))}
                  </h3>
               );
            }

            // List Items -> Styled as bullet points
            if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
               return (
                  <div key={index} className="flex gap-2 md:gap-4 pl-2 md:pl-10 my-2 md:my-3 group">
                     <span className="mt-2 w-1.5 h-1.5 md:w-2 md:h-2 rotate-45 bg-[#C0392B] shrink-0 block group-hover:bg-[#8B4513] transition-colors"></span>
                     <div className="flex-1 text-sm md:text-lg">{parseInline(trimmed.substring(2))}</div>
                  </div>
               );
            }

            // Standard Paragraph -> High readability
            return <p key={index} className="indent-6 md:indent-12 text-sm md:text-xl">{parseInline(trimmed)}</p>;
         })}
      </div>
   );
};

// --- VALIDATION HELPERS ---

// 1. Tính tuổi chính xác
const calculateAge = (dob: string): number => {
   const birthDate = new Date(dob);
   const today = new Date();
   let age = today.getFullYear() - birthDate.getFullYear();
   const m = today.getMonth() - birthDate.getMonth();
   if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
   }
   return age;
};

// 2. Kiểm tra tên hợp lệ
const isValidName = (name: string): boolean => {
   const trimmed = name.trim();
   if (trimmed.length < 2 || trimmed.length > 50) return false;
   const vietnameseNameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/;
   const isGibberish = /(.)\1{2,}/.test(trimmed);
   return vietnameseNameRegex.test(trimmed) && !isGibberish;
};

interface FengShuiConsultantProps {
   isRestricted?: boolean;
}

const FengShuiConsultant: React.FC<FengShuiConsultantProps> = ({ isRestricted = false }) => {
   const {
      user, updateUser,
      fengShuiProfile, fengShuiResults,
      updateFengShuiProfile, setFengShuiResults, recalculateDeadlines,
      guestUsage, incrementGuestFengShui
   } = useStore();

   const [activeTab, setActiveTab] = useState<'PROFILE' | 'HARMONY' | 'COMBINED' | 'DATES'>('PROFILE');
   const [loading, setLoading] = useState(false);
   const [copied, setCopied] = useState(false);

   const [formData, setFormData] = useState<CoupleProfile>(fengShuiProfile || {
      groomName: '', groomDob: '', groomTime: '',
      brideName: '', brideDob: '', brideTime: '',
      desiredPeriod: ''
   });

   const handleInputChange = (field: keyof CoupleProfile, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
   };

   const handleAnalyze = async () => {
      setLoading(true);

      if (isRestricted) {
         const isOverLimit = await checkGuestIPLimit('fengShuiCount', 1);
         if (isOverLimit) {
            alert("✨ Bạn đã dùng hết lượt xem thử miễn phí. Để mở khóa trọn đời và xem CHI TIẾT NGÀY CƯỚI ĐẸP NHẤT, hãy kích hoạt tài khoản ngay!");
            setLoading(false);
            return;
         }
      }

      if (!formData.groomName || !formData.groomDob || !formData.brideName || !formData.brideDob) {
         alert("Vui lòng nhập đầy đủ Họ tên và Ngày sinh của cả hai!");
         setLoading(false);
         return;
      }

      if (!isValidName(formData.groomName) || !isValidName(formData.brideName)) {
         alert("Tên không hợp lệ. Vui lòng nhập tên thật, không chứa số hoặc ký tự đặc biệt.");
         setLoading(false);
         return;
      }

      const groomAge = calculateAge(formData.groomDob);
      const brideAge = calculateAge(formData.brideDob);
      const currentYear = new Date().getFullYear();

      if (new Date(formData.groomDob).getFullYear() > currentYear || new Date(formData.brideDob).getFullYear() > currentYear) {
         alert("Năm sinh không hợp lệ!");
         setLoading(false);
         return;
      }

      if (groomAge < 20 || brideAge < 18) {
         alert("Chưa đủ tuổi kết hôn theo luật Hôn nhân & Gia đình Việt Nam.");
         setLoading(false);
         return;
      }

      updateFengShuiProfile(formData);

      try {
         const result = await analyzeCompatibility(formData);
         setFengShuiResults(result, fengShuiResults.dates);

         if (isRestricted) {
            await incrementGuestIPUsage('fengShuiCount');
            incrementGuestFengShui();
         }

         setActiveTab('HARMONY');
      } catch (error: any) {
         alert(error.message);
      } finally {
         setLoading(false);
      }
   };

   const handleFindDates = async () => {
      if (isRestricted) {
         alert("🔒 Tính năng VIP: Xem ngày lành tháng tốt chỉ dành cho thành viên chính thức.");
         return;
      }

      if (!formData.desiredPeriod) {
         alert("Vui lòng nhập khoảng thời gian mong muốn (Ví dụ: Tháng 10/2024)");
         return;
      }

      setLoading(true);
      try {
         const dates = await findAuspiciousDates(formData);
         setFengShuiResults(fengShuiResults.harmony, dates);
         setActiveTab('DATES');
      } catch (error: any) {
         alert(error.message);
      } finally {
         setLoading(false);
      }
   };

   const handleSelectDate = (dateStr: string) => {
      if (confirm(`Bạn muốn chọn ngày ${dateStr} làm ngày cưới chính thức?`)) {
         if (user) {
            updateUser(user.uid, { weddingDate: dateStr, showCountdown: true });
            recalculateDeadlines(dateStr);
            alert(`Đã đồng bộ thời gian thành công!`);
         }
      }
   };

   const handleCopyAnalysis = () => {
      if (!fengShuiResults.harmony) return;
      const text = `🔮 KẾT QUẢ PHONG THỦY\nChồng: ${formData.groomName}\nVợ: ${formData.brideName}\nKết luận: ${fengShuiResults.harmony.summary}\n\n${fengShuiResults.harmony.detailedAnalysis}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
   };

   const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-emerald-600 border-emerald-500 bg-emerald-50';
      if (score >= 50) return 'text-amber-600 border-amber-500 bg-amber-50';
      return 'text-red-600 border-red-500 bg-red-50';
   };

   return (
      <div className="flex flex-col h-full bg-[#FCFAF5] overflow-y-auto font-sans relative">
         {/* 1. PHẦN CỐ ĐỊNH (Header + Tabs) */}
         <div className="flex-shrink-0 z-20 bg-white shadow-sm sticky top-0">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 text-amber-50 p-3 md:p-6 flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>
               <Sparkles className="w-5 h-5 md:w-8 md:h-8 mb-1 md:mb-2 animate-pulse text-yellow-400 relative z-10" />
               <h1 className="text-lg md:text-2xl font-bold uppercase tracking-[0.2em] font-serif text-yellow-50 relative z-10 text-center">Phong Thủy AI</h1>
               <p className="text-[9px] md:text-xs text-yellow-200/80 font-serif italic mt-0.5 md:mt-1 relative z-10">Hòa Hợp Âm Dương • Vạn Sự Như Ý</p>
            </div>

            {/* RESTRICTED BANNER */}
            {isRestricted && (
               <div className="bg-amber-100 border-y border-amber-200 px-3 py-1.5 md:px-4 md:py-2 flex items-center justify-center text-xs md:text-sm font-bold text-amber-900 gap-2">
                  <Crown className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600" />
                  <span>
                     Dùng thử: còn <span className="text-red-600 text-sm md:text-base">{Math.max(0, 1 - guestUsage.fengShuiCount)}</span> lượt.
                  </span>
               </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex justify-start md:justify-center border-b border-amber-100 overflow-x-auto no-scrollbar bg-[#FCFAF5]">
               <button onClick={() => setActiveTab('PROFILE')} className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'PROFILE' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Hồ Sơ</button>
               <button onClick={() => setActiveTab('HARMONY')} disabled={!fengShuiResults.harmony} className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'HARMONY' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-gray-500 disabled:opacity-50'}`}>Luận Tuổi</button>
               <button onClick={() => setActiveTab('COMBINED')} disabled={!fengShuiResults.harmony?.combinedAnalysis} className={`px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === 'COMBINED' ? 'border-purple-600 text-purple-700 bg-purple-50' : 'border-transparent text-gray-500 disabled:opacity-50'}`}>Đa Chiều</button>
               <button
                  onClick={() => {
                     if (isRestricted) {
                        alert("🔒 Tính năng VIP: Xem ngày lành tháng tốt chỉ dành cho thành viên chính thức.");
                        return;
                     }
                     setActiveTab('DATES');
                  }}
                  disabled={!isRestricted && !fengShuiResults.dates.length}
                  className={`
                     px-4 md:px-6 py-2 md:py-3 text-xs md:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-1
                     ${activeTab === 'DATES' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-gray-500'}
                     ${isRestricted ? 'opacity-70 cursor-not-allowed bg-gray-50' : 'disabled:opacity-50'}
                  `}
               >
                  {isRestricted && <Lock className="w-3 h-3 text-gray-400" />}
                  Ngày Lành
               </button>
            </div>
         </div>

         {/* 2. PHẦN NỘI DUNG CUỘN */}
         <div className="flex-1 overflow-y-auto p-3 md:p-8 relative z-10">
            <div className="max-w-4xl mx-auto">

               {/* --- TAB 1: PROFILE --- */}
               {activeTab === 'PROFILE' && (
                  <div className="space-y-4 md:space-y-6 animate-fadeIn">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-md transition-all">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                           <div className="relative z-10">
                              <div className="flex items-center gap-3 mb-4 md:mb-6">
                                 <div className="bg-blue-600 text-white p-2 md:p-2.5 rounded-full shadow-lg shadow-blue-200"><Moon className="w-4 h-4 md:w-5 md:h-5" /></div>
                                 <div><h3 className="font-bold text-gray-800 text-base md:text-lg">Chú Rể</h3><p className="text-[10px] md:text-xs text-blue-500 font-bold uppercase tracking-wider">Dương Nam</p></div>
                              </div>
                              <div className="space-y-3 md:space-y-4">
                                 <div><label className="text-xs font-bold text-gray-400 uppercase">Họ và tên</label><input className="w-full mt-1 p-2 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none font-medium text-gray-800 text-sm" value={formData.groomName} onChange={e => handleInputChange('groomName', e.target.value)} placeholder="Nhập họ tên..." /></div>
                                 <div className="grid grid-cols-2 gap-2 md:gap-3">
                                    <div><label className="text-xs font-bold text-gray-400 uppercase">Ngày sinh (DL)</label><input type="date" className="w-full mt-1 p-2 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm" value={formData.groomDob} onChange={e => handleInputChange('groomDob', e.target.value)} /></div>
                                    <div><label className="text-xs font-bold text-gray-400 uppercase">Giờ sinh</label><input type="time" className="w-full mt-1 p-2 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none text-sm" value={formData.groomTime} onChange={e => handleInputChange('groomTime', e.target.value)} /></div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-pink-100 relative overflow-hidden group hover:shadow-md transition-all">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                           <div className="relative z-10">
                              <div className="flex items-center gap-3 mb-4 md:mb-6">
                                 <div className="bg-pink-600 text-white p-2 md:p-2.5 rounded-full shadow-lg shadow-pink-200"><Sun className="w-4 h-4 md:w-5 md:h-5" /></div>
                                 <div><h3 className="font-bold text-gray-800 text-base md:text-lg">Cô Dâu</h3><p className="text-[10px] md:text-xs text-pink-500 font-bold uppercase tracking-wider">Âm Nữ</p></div>
                              </div>
                              <div className="space-y-3 md:space-y-4">
                                 <div><label className="text-xs font-bold text-gray-400 uppercase">Họ và tên</label><input className="w-full mt-1 p-2 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-pink-500 outline-none font-medium text-gray-800 text-sm" value={formData.brideName} onChange={e => handleInputChange('brideName', e.target.value)} placeholder="Nhập họ tên..." /></div>
                                 <div className="grid grid-cols-2 gap-2 md:gap-3">
                                    <div><label className="text-xs font-bold text-gray-400 uppercase">Ngày sinh (DL)</label><input type="date" className="w-full mt-1 p-2 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-pink-500 outline-none text-sm" value={formData.brideDob} onChange={e => handleInputChange('brideDob', e.target.value)} /></div>
                                    <div><label className="text-xs font-bold text-gray-400 uppercase">Giờ sinh</label><input type="time" className="w-full mt-1 p-2 md:p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-pink-500 outline-none text-sm" value={formData.brideTime} onChange={e => handleInputChange('brideTime', e.target.value)} /></div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="flex justify-center pt-4 md:pt-6 pb-10">
                        <button onClick={handleAnalyze} disabled={loading} className="bg-red-700 hover:bg-red-800 text-yellow-50 px-8 md:px-10 py-3 md:py-4 rounded-full font-bold shadow-lg shadow-red-200 flex items-center gap-2 md:gap-3 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden text-sm md:text-base">
                           <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                           {loading ? (<><Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /><span>Thầy đang gieo quẻ...</span></>) : (<><Sparkles className="w-4 h-4 md:w-5 md:h-5 text-yellow-300" /><span className="tracking-wide">Luận Giải Duyên Phận</span></>)}
                        </button>
                     </div>
                  </div>
               )}

               {/* --- TAB 2: HARMONY (TỬ VI ĐÔNG PHƯƠNG) --- */}
               {activeTab === 'HARMONY' && fengShuiResults.harmony && (
                  <div className="space-y-6 animate-fadeIn pb-10">
                     <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
                        <div className="bg-amber-50/50 p-4 border-b border-amber-100 flex justify-between items-center">
                           <h3 className="font-bold text-amber-900 flex items-center gap-2 text-sm md:text-base"><Star className="w-4 h-4 md:w-5 md:h-5 text-amber-500 fill-current" /> Tổng Quan</h3>
                           <span className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold border ${fengShuiResults.harmony.conflictStatus === 'SINH' ? 'bg-green-100 text-green-700 border-green-200' : fengShuiResults.harmony.conflictStatus === 'KHAC' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                              {fengShuiResults.harmony.conflictStatus === 'SINH' ? 'TƯƠNG SINH' : fengShuiResults.harmony.conflictStatus === 'KHAC' ? 'TƯƠNG KHẮC' : 'BÌNH HÒA'}
                           </span>
                        </div>
                        <div className="p-4 md:p-8 flex flex-col md:flex-row items-center justify-around gap-6 md:gap-8">
                           {(() => {
                              const g = getElementConfig(fengShuiResults.harmony.groomElementKey);
                              return (
                                 <div className="text-center group">
                                    <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center border-4 ${g.border} ${g.bg} mb-2 md:mb-3 shadow-sm group-hover:scale-105 transition-transform`}>
                                       <g.icon className={`w-6 h-6 md:w-10 md:h-10 ${g.color}`} />
                                    </div>
                                    <p className="font-bold text-gray-800 text-base md:text-lg">{fengShuiResults.harmony.groomLunar}</p>
                                    <p className={`text-xs md:text-sm font-medium ${g.color}`}>{fengShuiResults.harmony.groomElement}</p>
                                 </div>
                              );
                           })()}

                           <div className="flex flex-col items-center justify-center">
                              <div className={`w-20 md:w-32 h-1 rounded-full ${fengShuiResults.harmony.conflictStatus === 'SINH' ? 'bg-green-200' : fengShuiResults.harmony.conflictStatus === 'KHAC' ? 'bg-red-200' : 'bg-gray-200'} relative`}>
                                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1.5 md:p-2 rounded-full border shadow-sm ${fengShuiResults.harmony.conflictStatus === 'SINH' ? 'border-green-200 text-green-600' : fengShuiResults.harmony.conflictStatus === 'KHAC' ? 'border-red-200 text-red-600' : 'border-gray-200 text-gray-400'}`}>
                                    <ArrowLeftRight className="w-4 h-4 md:w-5 md:h-5" />
                                 </div>
                              </div>
                              <p className="text-[10px] md:text-xs font-bold text-gray-400 mt-2 md:mt-3 uppercase tracking-wider">Tương tác</p>
                           </div>

                           {(() => {
                              const b = getElementConfig(fengShuiResults.harmony.brideElementKey);
                              return (
                                 <div className="text-center group">
                                    <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center border-4 ${b.border} ${b.bg} mb-2 md:mb-3 shadow-sm group-hover:scale-105 transition-transform`}>
                                       <b.icon className={`w-6 h-6 md:w-10 md:h-10 ${b.color}`} />
                                    </div>
                                    <p className="font-bold text-gray-800 text-base md:text-lg">{fengShuiResults.harmony.brideLunar}</p>
                                    <p className={`text-xs md:text-sm font-medium ${b.color}`}>{fengShuiResults.harmony.brideElement}</p>
                                 </div>
                              );
                           })()}
                        </div>

                        <div className="bg-gray-50 p-3 md:p-4 border-t border-gray-100 flex items-center justify-center gap-2 md:gap-4 flex-wrap">
                           <span className="text-xs md:text-sm font-bold text-gray-500 uppercase">Điểm số:</span>
                           {(() => {
                              const rawScore = fengShuiResults.harmony.score;
                              const displayScore = rawScore <= 10 ? Math.round(rawScore * 10) : rawScore;
                              return (
                                 <div className={`text-2xl md:text-3xl font-black ${getScoreColor(displayScore).split(' ')[0]}`}>
                                    {displayScore}/100
                                 </div>
                              );
                           })()}
                           <span className="text-xs md:text-sm font-medium text-gray-600 text-center">({fengShuiResults.harmony.summary})</span>
                        </div>
                     </div>

                     {/* --- ANCIENT SCROLL: DETAILED ANALYSIS --- */}
                     <div className="relative">
                        <div className="absolute right-0 top-0 mt-4 md:mt-8 mr-2 md:mr-4 z-30">
                           <button onClick={handleCopyAnalysis} className="bg-white/80 hover:bg-white text-amber-700 p-2 rounded-full shadow-sm border border-amber-200 transition-colors" title="Sao chép kết quả">
                              {copied ? <Check className="w-4 h-4 md:w-5 md:h-5 text-green-600" /> : <Share2 className="w-4 h-4 md:w-5 md:h-5" />}
                           </button>
                        </div>
                        <AncientScroll title="Lời Phán" icon={<Sparkles className="w-6 h-6 md:w-8 md:h-8" />}>
                           <MarkdownRenderer content={fengShuiResults.harmony.detailedAnalysis} />
                        </AncientScroll>
                     </div>

                     {/* CTA: Tìm Ngày */}
                     <div className="bg-gradient-to-r from-red-50 to-amber-50 rounded-2xl border border-red-100 p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 md:gap-6">
                        <div className="bg-white p-2 md:p-3 rounded-full shadow-sm text-red-500"><Calendar className="w-6 h-6 md:w-8 md:h-8" /></div>
                        <div className="flex-1 text-center md:text-left"><h4 className="font-bold text-gray-800 text-base md:text-lg">Đã xem tuổi, hãy chọn ngày lành!</h4><p className="text-xs md:text-sm text-gray-600">Thầy sẽ tìm cho hai bạn 5 ngày đại cát để tổ chức hôn lễ.</p></div>
                        <div className="flex flex-col w-full md:w-auto gap-2">
                           <input className="p-2.5 md:p-3 rounded-lg border border-red-200 outline-none focus:border-red-500 text-sm w-full md:w-64" placeholder="Ví dụ: Tháng 12/2024" value={formData.desiredPeriod} onChange={e => handleInputChange('desiredPeriod', e.target.value)} />
                           <button
                              onClick={handleFindDates}
                              disabled={loading}
                              className={`w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 md:py-3 px-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 text-sm md:text-base ${isRestricted ? 'cursor-not-allowed opacity-80' : ''}`}
                           >
                              {isRestricted && <Lock className="w-4 h-4" />}
                              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Tìm Ngày Cưới
                           </button>
                        </div>
                     </div>
                  </div>
               )}

               {/* --- TAB 3: COMBINED (THẦN SỐ & HOÀNG ĐẠO) --- */}
               {activeTab === 'COMBINED' && fengShuiResults.harmony?.combinedAnalysis && (
                  <div className="space-y-6 animate-fadeIn pb-10">
                     <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg text-white p-4 md:p-6">
                        <h3 className="text-lg md:text-xl font-bold flex items-center gap-2 mb-4">
                           <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-300" />
                           Giao Thoa Đông - Tây
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                           <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                              <div className="flex items-center gap-2 mb-2 font-bold text-purple-100 uppercase text-xs tracking-wider border-b border-white/20 pb-2"><Moon className="w-4 h-4" /> CHỒNG</div>
                              <div className="flex justify-between items-center mb-2">
                                 <span className="text-xs md:text-sm opacity-80">Hoàng Đạo:</span>
                                 <span className="font-bold text-base md:text-lg flex items-center gap-2">
                                    <span className="text-xl md:text-2xl leading-none">{getZodiacSymbol(fengShuiResults.harmony.combinedAnalysis.groomZodiac)}</span>
                                    {fengShuiResults.harmony.combinedAnalysis.groomZodiac}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-xs md:text-sm opacity-80">Số Chủ Đạo:</span>
                                 <span className="font-bold text-xl md:text-2xl bg-white text-purple-600 w-8 h-8 flex items-center justify-center rounded-full shadow-lg">
                                    {fengShuiResults.harmony.combinedAnalysis.groomLifePath}
                                 </span>
                              </div>
                           </div>
                           <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                              <div className="flex items-center gap-2 mb-2 font-bold text-purple-100 uppercase text-xs tracking-wider border-b border-white/20 pb-2"><Sun className="w-4 h-4" /> VỢ</div>
                              <div className="flex justify-between items-center mb-2">
                                 <span className="text-xs md:text-sm opacity-80">Hoàng Đạo:</span>
                                 <span className="font-bold text-base md:text-lg flex items-center gap-2">
                                    <span className="text-xl md:text-2xl leading-none">{getZodiacSymbol(fengShuiResults.harmony.combinedAnalysis.brideZodiac)}</span>
                                    {fengShuiResults.harmony.combinedAnalysis.brideZodiac}
                                 </span>
                              </div>
                              <div className="flex justify-between items-center">
                                 <span className="text-xs md:text-sm opacity-80">Số Chủ Đạo:</span>
                                 <span className="font-bold text-xl md:text-2xl bg-white text-indigo-700 w-8 h-8 flex items-center justify-center rounded-full shadow-lg">
                                    {fengShuiResults.harmony.combinedAnalysis.brideLifePath}
                                 </span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* --- ANCIENT SCROLL: SYNTHESIS --- */}
                     <AncientScroll title="Tổng Hợp" icon={<Hash className="w-6 h-6 md:w-8 md:h-8" />}>
                        <MarkdownRenderer content={fengShuiResults.harmony.combinedAnalysis.synthesis} />
                     </AncientScroll>
                  </div>
               )}

               {/* --- TAB 4: DATES --- */}
               {activeTab === 'DATES' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn pb-10">
                     {fengShuiResults.dates.map((date, idx) => (
                        <div key={idx} className="bg-white rounded-xl border border-amber-100 p-0 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group flex flex-col">
                           <div className="h-2 bg-gradient-to-r from-red-500 to-amber-500"></div>
                           <div className="p-4 md:p-5 flex-1">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="text-center border border-gray-100 rounded-lg p-2 bg-gray-50 min-w-[60px] md:min-w-[70px]">
                                    <span className="block text-xs text-gray-400 font-bold uppercase">{date.solarDate.split('-')[1]}</span>
                                    <span className="block text-2xl md:text-3xl font-black text-gray-800">{date.solarDate.split('-')[2]}</span>
                                    <span className="block text-[10px] text-gray-400 font-bold">{date.solarDate.split('-')[0]}</span>
                                 </div>
                                 <div className="flex-1 ml-4">
                                    <h4 className="font-bold text-gray-800 text-base md:text-lg flex items-center gap-2">{date.lunarDate}</h4>
                                    <span className={`inline-flex items-center gap-1 text-[10px] md:text-xs px-2 py-0.5 rounded-full font-bold mt-1 ${date.suitability === 'VERY_HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                       {date.suitability === 'VERY_HIGH' ? <Star className="w-3 h-3 fill-current" /> : <Check className="w-3 h-3" />}
                                       {date.dayName}
                                    </span>
                                 </div>
                              </div>
                              <div className="space-y-3 mb-4">
                                 <div className="flex gap-3"><Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /><p className="text-sm text-gray-600 leading-snug">{date.reason}</p></div>
                                 <div className="flex gap-3"><Clock className="w-4 h-4 text-green-500 mt-0.5 shrink-0" /><p className="text-sm text-gray-600"><span className="font-bold text-gray-700">Giờ đẹp:</span> {date.timeSlots}</p></div>
                              </div>
                           </div>
                           <div className="p-3 md:p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                              <button onClick={() => handleSelectDate(date.solarDate)} className="w-full py-2 md:py-2.5 bg-white border border-gray-300 hover:border-red-500 hover:text-red-600 text-gray-600 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                                 Chọn ngày này <ArrowRight className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};

export default FengShuiConsultant;