
import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { analyzeCompatibility, findAuspiciousDates } from '../../services/fengShuiService';
import { CoupleProfile } from '../../types/fengshui';
import { 
  Heart, Calendar, Moon, Sun, Sparkles, 
  ArrowRight, Loader2, CheckCircle2, Info, Star, Copy, Share2, Check, Clock 
} from 'lucide-react';

const FengShuiConsultant: React.FC = () => {
  const { user, updateUser, fengShuiProfile, fengShuiResults, updateFengShuiProfile, setFengShuiResults, recalculateDeadlines } = useStore();
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'HARMONY' | 'DATES'>('PROFILE');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State
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
      setFengShuiResults(result, fengShuiResults.dates); // Keep old dates if any
      setActiveTab('HARMONY');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFindDates = async () => {
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
    if (confirm(`Bạn muốn chọn ngày ${dateStr} làm ngày cưới chính thức?\n\nHệ thống sẽ:\n1. Cập nhật bộ đếm ngược.\n2. Tự động tính toán lại hạn chót (Deadlines) cho các đầu việc.`)) {
      if (user) {
         // 1. Update Profile Date
         updateUser(user.uid, { 
             weddingDate: dateStr,
             showCountdown: true 
         });
         
         // 2. Sync Timeline (Deadlines)
         recalculateDeadlines(dateStr);

         alert(`Đã đồng bộ thời gian thành công!\nCác công việc đã được tự động gán hạn chót mới.`);
      }
    }
  };

  const handleCopyAnalysis = () => {
    if (!fengShuiResults.harmony) return;
    
    const text = `
🔮 LUẬN GIẢI TÌNH DUYÊN & NGÀY CƯỚI
-----------------------------------
🤵 Chồng: ${formData.groomName} (${fengShuiResults.harmony.groomLunar})
👰 Vợ: ${formData.brideName} (${fengShuiResults.harmony.brideLunar})

❤️ ĐIỂM HÒA HỢP: ${fengShuiResults.harmony.score}/100 - ${fengShuiResults.harmony.summary}

📝 CHI TIẾT:
${fengShuiResults.harmony.detailedAnalysis}

Được phân tích bởi WedPlan AI 🤖
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500 border-green-500';
    if (score >= 50) return 'text-amber-500 border-amber-500';
    return 'text-red-500 border-red-500';
  };

  return (
    <div className="flex flex-col h-full bg-[#FFFBF0] overflow-y-auto">
      {/* Header */}
      <div className="bg-red-800 text-amber-100 p-6 flex flex-col items-center justify-center relative shadow-md">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-scales.png')] opacity-20"></div>
        <Sparkles className="w-8 h-8 mb-2 animate-pulse text-amber-300" />
        <h1 className="text-2xl font-bold uppercase tracking-widest font-serif">Thầy Phong Thủy AI</h1>
        <p className="text-sm opacity-80 font-serif italic">Xem Tuổi • Cung Mệnh • Chọn Ngày Lành</p>
      </div>

      {/* Navigation */}
      <div className="flex justify-center bg-white shadow-sm sticky top-0 z-10">
        <button 
           onClick={() => setActiveTab('PROFILE')}
           className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'PROFILE' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-500'}`}
        >
          Hồ Sơ
        </button>
        <button 
           onClick={() => setActiveTab('HARMONY')}
           disabled={!fengShuiResults.harmony}
           className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'HARMONY' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-500 disabled:opacity-50'}`}
        >
          Luận Tuổi
        </button>
        <button 
           onClick={() => setActiveTab('DATES')}
           disabled={!fengShuiResults.dates.length}
           className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'DATES' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-500 disabled:opacity-50'}`}
        >
          Ngày Tốt
        </button>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-8 flex-1">
        
        {/* --- TAB 1: PROFILE INPUT --- */}
        {activeTab === 'PROFILE' && (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-amber-100">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                {/* Groom */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 mb-2">
                      <div className="bg-blue-100 p-2 rounded-full"><Moon className="w-5 h-5 text-blue-600" /></div>
                      <h3 className="font-bold text-gray-800 text-lg">Thông tin Chú Rể</h3>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ tên</label>
                      <input 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-red-500 outline-none"
                        value={formData.groomName}
                        onChange={e => handleInputChange('groomName', e.target.value)}
                        placeholder="Nguyễn Văn A"
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày sinh (Dương)</label>
                        <input 
                          type="date"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-red-500 outline-none"
                          value={formData.groomDob}
                          onChange={e => handleInputChange('groomDob', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giờ sinh</label>
                        <input 
                          type="time"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-red-500 outline-none"
                          value={formData.groomTime}
                          onChange={e => handleInputChange('groomTime', e.target.value)}
                        />
                      </div>
                   </div>
                </div>

                {/* Decorative Divider */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-red-50 rounded-full items-center justify-center border border-red-100 z-10">
                   <Heart className="w-5 h-5 text-red-500 fill-current" />
                </div>

                {/* Bride */}
                <div className="space-y-4">
                   <div className="flex items-center gap-2 mb-2">
                      <div className="bg-pink-100 p-2 rounded-full"><Sun className="w-5 h-5 text-pink-600" /></div>
                      <h3 className="font-bold text-gray-800 text-lg">Thông tin Cô Dâu</h3>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ tên</label>
                      <input 
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-red-500 outline-none"
                        value={formData.brideName}
                        onChange={e => handleInputChange('brideName', e.target.value)}
                        placeholder="Trần Thị B"
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ngày sinh (Dương)</label>
                        <input 
                          type="date"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-red-500 outline-none"
                          value={formData.brideDob}
                          onChange={e => handleInputChange('brideDob', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giờ sinh</label>
                        <input 
                          type="time"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:border-red-500 outline-none"
                          value={formData.brideTime}
                          onChange={e => handleInputChange('brideTime', e.target.value)}
                        />
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="mt-8 pt-6 border-t border-gray-100">
                <button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full md:w-auto mx-auto flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-70"
                >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-yellow-300" />}
                   Luận Giải Tình Duyên
                </button>
             </div>
          </div>
        )}

        {/* --- TAB 2: HARMONY RESULT --- */}
        {activeTab === 'HARMONY' && fengShuiResults.harmony && (
          <div className="space-y-6 animate-fadeIn">
             {/* Score Card */}
             <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 flex flex-col md:flex-row items-center gap-8">
                <div className={`relative w-40 h-40 rounded-full border-8 flex items-center justify-center flex-shrink-0 ${scoreColor(fengShuiResults.harmony.score)}`}>
                   <div className="text-center">
                      <span className="block text-4xl font-black">{fengShuiResults.harmony.score}</span>
                      <span className="text-xs font-bold uppercase tracking-wider">Điểm hòa hợp</span>
                   </div>
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                   <h2 className="text-2xl font-bold text-gray-800">{fengShuiResults.harmony.summary}</h2>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                         <p className="text-xs text-blue-500 font-bold uppercase">Chồng</p>
                         <p className="font-bold text-gray-800">{fengShuiResults.harmony.groomLunar}</p>
                         <p className="text-sm text-gray-600">{fengShuiResults.harmony.groomElement}</p>
                      </div>
                      <div className="p-3 bg-pink-50 rounded-lg border border-pink-100">
                         <p className="text-xs text-pink-500 font-bold uppercase">Vợ</p>
                         <p className="font-bold text-gray-800">{fengShuiResults.harmony.brideLunar}</p>
                         <p className="text-sm text-gray-600">{fengShuiResults.harmony.brideElement}</p>
                      </div>
                   </div>
                </div>
             </div>

             {/* Detailed Analysis */}
             <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 md:p-8">
                <div className="flex justify-between items-center mb-4 border-b border-amber-100 pb-2">
                    <h3 className="font-serif font-bold text-xl text-red-800">
                      Lời Phán Của Thầy
                    </h3>
                    <button 
                       onClick={handleCopyAnalysis}
                       className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                       }`}
                    >
                       {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                       {copied ? "Đã sao chép!" : "Chia sẻ / Lưu lại"}
                    </button>
                </div>
                
                <div className="prose prose-stone max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                   {fengShuiResults.harmony.detailedAnalysis}
                </div>
                
                {/* Action to Dates */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                   <div className="flex flex-col md:flex-row gap-4 items-center bg-amber-50 p-4 rounded-xl border border-amber-200">
                      <div className="flex-1">
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Khoảng thời gian muốn cưới</label>
                         <input 
                           className="w-full p-2 bg-white border border-amber-200 rounded outline-none placeholder-gray-400"
                           placeholder="Ví dụ: Tháng 12/2024 hoặc Cuối năm 2025"
                           value={formData.desiredPeriod}
                           onChange={e => handleInputChange('desiredPeriod', e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleFindDates()}
                         />
                      </div>
                      <button 
                        onClick={handleFindDates}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold shadow-md flex items-center gap-2 whitespace-nowrap disabled:opacity-70"
                      >
                         {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Calendar className="w-4 h-4" />}
                         Xem Ngày Tốt
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {/* --- TAB 3: DATES --- */}
        {activeTab === 'DATES' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
              {fengShuiResults.dates.map((date, idx) => (
                 <div key={idx} className="bg-white rounded-xl border border-amber-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2">
                       {date.suitability === 'VERY_HIGH' && <Star className="w-5 h-5 text-yellow-400 fill-current" />}
                    </div>
                    
                    <div className="flex items-start gap-4 mb-4">
                       <div className="bg-red-50 text-red-600 rounded-xl p-3 text-center min-w-[70px] border border-red-100">
                          <span className="block text-2xl font-black">{date.solarDate.split('-')[2]}</span>
                          <span className="block text-xs font-bold uppercase">Tháng {date.solarDate.split('-')[1]}</span>
                       </div>
                       <div>
                          <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                             {date.lunarDate}
                          </h4>
                          <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold mt-1">
                             {date.dayName}
                          </span>
                       </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                       <div className="flex items-start gap-2 text-sm text-gray-600">
                          <Info className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                          <p>{date.reason}</p>
                       </div>
                       <div className="flex items-start gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
                          <p><span className="font-bold">Giờ đẹp:</span> {date.timeSlots}</p>
                       </div>
                    </div>

                    <button 
                       onClick={() => handleSelectDate(date.solarDate)}
                       className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                       Chọn ngày này <ArrowRight className="w-4 h-4" />
                    </button>
                 </div>
              ))}
           </div>
        )}

      </div>
    </div>
  );
};

export default FengShuiConsultant;
