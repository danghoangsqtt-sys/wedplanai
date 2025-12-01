import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { analyzeCompatibility, findAuspiciousDates } from '../../services/fengShuiService';
import { CoupleProfile, ElementKey } from '../../types/fengshui';
import {
   Heart, Calendar, Moon, Sun, Sparkles,
   ArrowRight, Loader2, Check, Share2, Star, Clock, Info,
   Flame, Droplets, Mountain, Wind, Coins, ArrowLeftRight
} from 'lucide-react';

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

const MarkdownRenderer = ({ content }: { content: string }) => {
   if (!content) return null;
   return (
      <div className="space-y-3 text-gray-700 leading-relaxed font-sans text-sm md:text-base whitespace-pre-line">
         {content}
      </div>
   );
};

const FengShuiConsultant: React.FC = () => {
   const { user, updateUser, fengShuiProfile, fengShuiResults, updateFengShuiProfile, setFengShuiResults, recalculateDeadlines } = useStore();
   const [activeTab, setActiveTab] = useState<'PROFILE' | 'HARMONY' | 'DATES'>('PROFILE');
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
      if (!formData.groomDob || !formData.brideDob) {
         alert("Vui lòng nhập đầy đủ ngày sinh!");
         return;
      }
      updateFengShuiProfile(formData);
      setLoading(true);
      try {
         const result = await analyzeCompatibility(formData);
         setFengShuiResults(result, fengShuiResults.dates);
         setActiveTab('HARMONY');
      } catch (error: any) {
         alert(error.message);
      } finally {
         setLoading(false);
      }
   };

   const handleFindDates = async () => {
      if (!formData.desiredPeriod) return alert("Vui lòng nhập thời gian mong muốn!");
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
      if (confirm(`Chọn ngày ${dateStr} làm ngày cưới?`)) {
         if (user) {
            updateUser(user.uid, { weddingDate: dateStr, showCountdown: true });
            recalculateDeadlines(dateStr);
            alert(`Đã cập nhật ngày cưới!`);
         }
      }
   };

   const handleCopyAnalysis = () => {
      if (!fengShuiResults.harmony) return;
      const text = `KẾT QUẢ PHONG THỦY\nChồng: ${formData.groomName}\nVợ: ${formData.brideName}\nKết luận: ${fengShuiResults.harmony.summary}\n\n${fengShuiResults.harmony.detailedAnalysis}`;
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
         <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 text-amber-50 p-6 flex flex-col items-center justify-center relative shadow-lg z-10 shrink-0">
            <Sparkles className="w-8 h-8 mb-2 animate-pulse text-yellow-400" />
            <h1 className="text-2xl font-bold uppercase tracking-[0.2em] font-serif text-yellow-50">Phong Thủy AI</h1>
         </div>

         <div className="flex justify-center bg-white shadow-sm sticky top-0 z-20 border-b border-amber-100">
            <button onClick={() => setActiveTab('PROFILE')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'PROFILE' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-gray-500'}`}>Hồ Sơ</button>
            <button onClick={() => setActiveTab('HARMONY')} disabled={!fengShuiResults.harmony} className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'HARMONY' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-gray-500 disabled:opacity-50'}`}>Luận Tuổi</button>
            <button onClick={() => setActiveTab('DATES')} disabled={!fengShuiResults.dates.length} className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'DATES' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-gray-500 disabled:opacity-50'}`}>Ngày Lành</button>
         </div>

         <div className="max-w-4xl mx-auto w-full p-4 md:p-8 flex-1 z-10 relative">
            {activeTab === 'PROFILE' && (
               <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="bg-blue-600 text-white p-2.5 rounded-full"><Moon className="w-5 h-5" /></div>
                           <div><h3 className="font-bold text-gray-800 text-lg">Chú Rể</h3><p className="text-xs text-blue-500 font-bold uppercase">Dương Nam</p></div>
                        </div>
                        <div className="space-y-4">
                           <input className="w-full p-2.5 bg-gray-50 border rounded-lg" value={formData.groomName} onChange={e => handleInputChange('groomName', e.target.value)} placeholder="Họ tên..." />
                           <div className="grid grid-cols-2 gap-3">
                              <input type="date" className="w-full p-2.5 bg-gray-50 border rounded-lg" value={formData.groomDob} onChange={e => handleInputChange('groomDob', e.target.value)} />
                              <input type="time" className="w-full p-2.5 bg-gray-50 border rounded-lg" value={formData.groomTime} onChange={e => handleInputChange('groomTime', e.target.value)} />
                           </div>
                        </div>
                     </div>
                     <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="bg-pink-600 text-white p-2.5 rounded-full"><Sun className="w-5 h-5" /></div>
                           <div><h3 className="font-bold text-gray-800 text-lg">Cô Dâu</h3><p className="text-xs text-pink-500 font-bold uppercase">Âm Nữ</p></div>
                        </div>
                        <div className="space-y-4">
                           <input className="w-full p-2.5 bg-gray-50 border rounded-lg" value={formData.brideName} onChange={e => handleInputChange('brideName', e.target.value)} placeholder="Họ tên..." />
                           <div className="grid grid-cols-2 gap-3">
                              <input type="date" className="w-full p-2.5 bg-gray-50 border rounded-lg" value={formData.brideDob} onChange={e => handleInputChange('brideDob', e.target.value)} />
                              <input type="time" className="w-full p-2.5 bg-gray-50 border rounded-lg" value={formData.brideTime} onChange={e => handleInputChange('brideTime', e.target.value)} />
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="flex justify-center pt-6">
                     <button onClick={handleAnalyze} disabled={loading} className="bg-red-700 text-yellow-50 px-10 py-4 rounded-full font-bold shadow-lg flex items-center gap-3 disabled:opacity-70">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-yellow-300" />}
                        <span>Luận Giải Duyên Phận</span>
                     </button>
                  </div>
               </div>
            )}

            {activeTab === 'HARMONY' && fengShuiResults.harmony && (
               <div className="space-y-6 animate-fadeIn pb-10">
                  <div className="bg-white rounded-2xl shadow-sm border border-amber-100 overflow-hidden">
                     <div className="bg-amber-50/50 p-4 border-b border-amber-100 flex justify-between items-center">
                        <h3 className="font-bold text-amber-900 flex items-center gap-2"><Star className="w-5 h-5 text-amber-500 fill-current" /> Tổng Quan Ngũ Hành</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${fengShuiResults.harmony.conflictStatus === 'SINH' ? 'bg-green-100 text-green-700 border-green-200' : fengShuiResults.harmony.conflictStatus === 'KHAC' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                           {fengShuiResults.harmony.conflictStatus === 'SINH' ? 'TƯƠNG SINH' : fengShuiResults.harmony.conflictStatus === 'KHAC' ? 'TƯƠNG KHẮC' : 'BÌNH HÒA'}
                        </span>
                     </div>
                     <div className="p-6 flex flex-col md:flex-row items-center justify-around gap-8">
                        {(() => {
                           const g = getElementConfig(fengShuiResults.harmony.groomElementKey);
                           return <div className="text-center"><div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${g.border} ${g.bg} mb-3`}><g.icon className={`w-10 h-10 ${g.color}`} /></div><p className="font-bold text-gray-800">{fengShuiResults.harmony.groomLunar}</p><p className={`text-sm ${g.color}`}>{fengShuiResults.harmony.groomElement}</p></div>;
                        })()}
                        <div className="flex flex-col items-center"><div className="w-32 h-1 bg-gray-200 relative"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full border shadow-sm"><ArrowLeftRight className="w-5 h-5" /></div></div></div>
                        {(() => {
                           const b = getElementConfig(fengShuiResults.harmony.brideElementKey);
                           return <div className="text-center"><div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${b.border} ${b.bg} mb-3`}><b.icon className={`w-10 h-10 ${b.color}`} /></div><p className="font-bold text-gray-800">{fengShuiResults.harmony.brideLunar}</p><p className={`text-sm ${b.color}`}>{fengShuiResults.harmony.brideElement}</p></div>;
                        })()}
                     </div>
                     <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-center gap-4">
                        <span className="text-sm font-bold text-gray-500 uppercase">Điểm số:</span>
                        {(() => {
                           const rawScore = fengShuiResults.harmony.score;
                           const displayScore = rawScore <= 10 ? Math.round(rawScore * 10) : rawScore;
                           return <div className={`text-3xl font-black ${getScoreColor(displayScore).split(' ')[0]}`}>{displayScore}/100</div>;
                        })()}
                        <span className="text-sm font-medium text-gray-600">({fengShuiResults.harmony.summary})</span>
                     </div>
                  </div>
                  <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 relative">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-serif font-bold text-2xl text-red-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-500" /> Lời Phán Của Thầy</h3>
                        <button onClick={handleCopyAnalysis} className="text-gray-400 hover:text-gray-600"><Share2 className="w-5 h-5" /></button>
                     </div>
                     <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-50/50">
                        <MarkdownRenderer content={fengShuiResults.harmony.detailedAnalysis} />
                     </div>
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-amber-50 rounded-2xl border border-red-100 p-6 flex flex-col md:flex-row items-center gap-6">
                     <div className="flex-1 text-center md:text-left"><h4 className="font-bold text-gray-800">Chọn ngày lành!</h4><p className="text-sm text-gray-600">Tìm 5 ngày đại cát để tổ chức hôn lễ.</p></div>
                     <div className="flex flex-col gap-2 w-full md:w-auto">
                        <input className="p-2 border rounded" placeholder="Tháng 12/2024..." value={formData.desiredPeriod} onChange={e => handleInputChange('desiredPeriod', e.target.value)} />
                        <button onClick={handleFindDates} disabled={loading} className="bg-red-600 text-white font-bold py-2 px-6 rounded shadow-md">Tìm Ngày Cưới</button>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'DATES' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                  {fengShuiResults.dates.map((date, idx) => (
                     <div key={idx} className="bg-white rounded-xl border p-5 shadow-sm">
                        <div className="flex justify-between mb-2">
                           <span className="font-bold text-gray-800 text-lg">{date.lunarDate}</span>
                           <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-bold">{date.dayName}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{date.reason}</p>
                        <p className="text-sm text-green-600 font-bold mb-4">Giờ: {date.timeSlots}</p>
                        <button onClick={() => handleSelectDate(date.solarDate)} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded">Chọn ngày này ({date.solarDate})</button>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
};

export default FengShuiConsultant;