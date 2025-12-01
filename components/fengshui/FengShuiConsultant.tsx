import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { analyzeCompatibility, findAuspiciousDates } from '../../services/fengShuiService';
import { CoupleProfile, ElementKey } from '../../types/fengshui';
import { 
  Heart, Calendar, Moon, Sun, Sparkles, 
  ArrowRight, Loader2, Check, Share2, Star, Clock, Info,
  Flame, Droplets, Mountain, Wind, Coins, ArrowLeftRight
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

// --- HELPER: MARKDOWN RENDERER ---
const MarkdownRenderer = ({ content }: { content: string }) => {
  if (!content) return null;

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-3 text-gray-700 leading-relaxed font-sans text-sm md:text-base">
      {content.split('\n').map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-2" />;

        if (trimmed.startsWith('### ')) return <h4 key={index} className="text-lg font-bold text-amber-800 mt-4 mb-2 font-serif">{parseInline(trimmed.substring(4))}</h4>;
        if (trimmed.startsWith('## ')) return <h3 key={index} className="text-xl font-bold text-amber-900 mt-6 mb-3 border-b border-amber-100 pb-1 font-serif">{parseInline(trimmed.substring(3))}</h3>;
        if (trimmed.startsWith('# ')) return <h2 key={index} className="text-2xl font-bold text-amber-900 mt-8 mb-4 font-serif">{parseInline(trimmed.substring(2))}</h2>;

        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
           return (
             <div key={index} className="flex gap-3 pl-1 md:pl-2">
                <span className="text-amber-500 mt-2 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 block"></span>
                <div className="flex-1">{parseInline(trimmed.substring(2))}</div>
             </div>
           );
        }

        return <p key={index} className="mb-1">{parseInline(trimmed)}</p>;
      })}
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
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
           style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}>
      </div>

      <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 text-amber-50 p-6 flex flex-col items-center justify-center relative shadow-lg z-10 shrink-0">
        <Sparkles className="w-8 h-8 mb-2 animate-pulse text-yellow-400" />
        <h1 className="text-2xl font-bold uppercase tracking-[0.2em] font-serif text-yellow-50">Phong Thủy AI</h1>
        <p className="text-xs text-yellow-200/80 font-serif italic mt-1">Hòa Hợp Âm Dương • Vạn Sự Như Ý</p>
      </div>

      <div className="flex justify-center bg-white shadow-sm sticky top-0 z-20 border-b border-amber-100">
        <button onClick={() => setActiveTab('PROFILE')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'PROFILE' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Hồ Sơ</button>
        <button onClick={() => setActiveTab('HARMONY')} disabled={!fengShuiResults.harmony} className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'HARMONY' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-gray-500 disabled:opacity-50'}`}>Luận Tuổi</button>
        <button onClick={() => setActiveTab('DATES')} disabled={!fengShuiResults.dates.length} className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === 'DATES' ? 'border-red-600 text-red-700 bg-red-50' : 'border-transparent text-gray-500 disabled:opacity-50'}`}>Ngày Lành</button>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-8 flex-1 z-10 relative">
        
        {activeTab === 'PROFILE' && (
          <div className="space-y-6 animate-fadeIn">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden group hover:shadow-md transition-all">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                   <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="bg-blue-600 text-white p-2.5 rounded-full shadow-lg shadow-blue-200"><Moon className="w-5 h-5" /></div>
                         <div><h3 className="font-bold text-gray-800 text-lg">Chú Rể</h3><p className="text-xs text-blue-500 font-bold uppercase tracking-wider">Dương Nam</p></div>
                      </div>
                      <div className="space-y-4">
                         <div><label className="text-xs font-bold text-gray-400 uppercase">Họ và tên</label><input className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none font-medium text-gray-800" value={formData.groomName} onChange={e => handleInputChange('groomName', e.target.value)} placeholder="Nhập họ tên..." /></div>
                         <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Ngày sinh (DL)</label><input type="date" className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none" value={formData.groomDob} onChange={e => handleInputChange('groomDob', e.target.value)}/></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Giờ sinh</label><input type="time" className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-blue-500 outline-none" value={formData.groomTime} onChange={e => handleInputChange('groomTime', e.target.value)}/></div>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100 relative overflow-hidden group hover:shadow-md transition-all">
                   <div className="absolute top-0 right-0 w-24 h-24 bg-pink-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                   <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                         <div className="bg-pink-600 text-white p-2.5 rounded-full shadow-lg shadow-pink-200"><Sun className="w-5 h-5" /></div>
                         <div><h3 className="font-bold text-gray-800 text-lg">Cô Dâu</h3><p className="text-xs text-pink-500 font-bold uppercase tracking-wider">Âm Nữ</p></div>
                      </div>
                      <div className="space-y-4">
                         <div><label className="text-xs font-bold text-gray-400 uppercase">Họ và tên</label><input className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-pink-500 outline-none font-medium text-gray-800" value={formData.brideName} onChange={e => handleInputChange('brideName', e.target.value)} placeholder="Nhập họ tên..." /></div>
                         <div className="grid grid-cols-2 gap-3">
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Ngày sinh (DL)</label><input type="date" className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-pink-500 outline-none" value={formData.brideDob} onChange={e => handleInputChange('brideDob', e.target.value)}/></div>
                            <div><label className="text-xs font-bold text-gray-400 uppercase">Giờ sinh</label><input type="time" className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-pink-500 outline-none" value={formData.brideTime} onChange={e => handleInputChange('brideTime', e.target.value)}/></div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>
             
             <div className="flex justify-center pt-6">
                <button onClick={handleAnalyze} disabled={loading} className="bg-red-700 hover:bg-red-800 text-yellow-50 px-10 py-4 rounded-full font-bold shadow-lg shadow-red-200 flex items-center gap-3 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden">
                   <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                   {loading ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>Thầy đang gieo quẻ...</span></>) : (<><Sparkles className="w-5 h-5 text-yellow-300" /><span className="tracking-wide">Luận Giải Duyên Phận</span></>)}
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
                      {fengShuiResults.harmony.conflictStatus === 'SINH' ? 'TƯƠNG SINH (TỐT)' : fengShuiResults.harmony.conflictStatus === 'KHAC' ? 'TƯƠNG KHẮC (XẤU)' : 'BÌNH HÒA'}
                   </span>
                </div>
                
                <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-around gap-8">
                   {(() => {
                      const g = getElementConfig(fengShuiResults.harmony.groomElementKey);
                      return (
                         <div className="text-center group">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${g.border} ${g.bg} mb-3 shadow-sm group-hover:scale-105 transition-transform`}>
                               <g.icon className={`w-10 h-10 ${g.color}`} />
                            </div>
                            <p className="font-bold text-gray-800 text-lg">{fengShuiResults.harmony.groomLunar}</p>
                            <p className={`text-sm font-medium ${g.color}`}>{fengShuiResults.harmony.groomElement}</p>
                         </div>
                      );
                   })()}

                   <div className="flex flex-col items-center justify-center">
                      <div className={`w-32 h-1 rounded-full ${fengShuiResults.harmony.conflictStatus === 'SINH' ? 'bg-green-200' : fengShuiResults.harmony.conflictStatus === 'KHAC' ? 'bg-red-200' : 'bg-gray-200'} relative`}>
                         <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-full border shadow-sm ${fengShuiResults.harmony.conflictStatus === 'SINH' ? 'border-green-200 text-green-600' : fengShuiResults.harmony.conflictStatus === 'KHAC' ? 'border-red-200 text-red-600' : 'border-gray-200 text-gray-400'}`}>
                            <ArrowLeftRight className="w-5 h-5" />
                         </div>
                      </div>
                      <p className="text-xs font-bold text-gray-400 mt-3 uppercase tracking-wider">Tương tác</p>
                   </div>

                   {(() => {
                      const b = getElementConfig(fengShuiResults.harmony.brideElementKey);
                      return (
                         <div className="text-center group">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${b.border} ${b.bg} mb-3 shadow-sm group-hover:scale-105 transition-transform`}>
                               <b.icon className={`w-10 h-10 ${b.color}`} />
                            </div>
                            <p className="font-bold text-gray-800 text-lg">{fengShuiResults.harmony.brideLunar}</p>
                            <p className={`text-sm font-medium ${b.color}`}>{fengShuiResults.harmony.brideElement}</p>
                         </div>
                      );
                   })()}
                </div>

                {/* Score Bar - SỬA LOGIC HIỂN THỊ ĐIỂM TẠI ĐÂY */}
                <div className="bg-gray-50 p-4 border-t border-gray-100 flex items-center justify-center gap-4">
                   <span className="text-sm font-bold text-gray-500 uppercase">Điểm số:</span>
                   {(() => {
                      // Logic tự động sửa lỗi thang điểm: Nếu điểm <= 10 (ví dụ 7.5), nhân 10 lên thành 75.
                      const rawScore = fengShuiResults.harmony.score;
                      const displayScore = rawScore <= 10 ? Math.round(rawScore * 10) : rawScore;
                      
                      return (
                        <div className={`text-3xl font-black ${getScoreColor(displayScore).split(' ')[0]}`}>
                           {displayScore}/100
                        </div>
                      );
                   })()}
                   <span className="text-sm font-medium text-gray-600">({fengShuiResults.harmony.summary})</span>
                </div>
             </div>

             <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 md:p-8 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-50"></div>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-serif font-bold text-2xl text-red-900 flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-500" /> Lời Phán Của Thầy</h3>
                    <button onClick={handleCopyAnalysis} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-50 rounded-lg transition-colors" title="Sao chép kết quả">
                       {copied ? <Check className="w-5 h-5 text-green-500" /> : <Share2 className="w-5 h-5" />}
                    </button>
                </div>
                <div className="bg-amber-50/30 p-4 md:p-6 rounded-xl border border-amber-50/50">
                   <MarkdownRenderer content={fengShuiResults.harmony.detailedAnalysis} />
                </div>
             </div>

             <div className="bg-gradient-to-r from-red-50 to-amber-50 rounded-2xl border border-red-100 p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="bg-white p-3 rounded-full shadow-sm text-red-500"><Calendar className="w-8 h-8" /></div>
                <div className="flex-1 text-center md:text-left"><h4 className="font-bold text-gray-800 text-lg">Đã xem tuổi, hãy chọn ngày lành!</h4><p className="text-sm text-gray-600">Thầy sẽ tìm cho hai bạn 5 ngày đại cát để tổ chức hôn lễ.</p></div>
                <div className="flex flex-col w-full md:w-auto gap-2">
                   <input className="p-3 rounded-lg border border-red-200 outline-none focus:border-red-500 text-sm w-full md:w-64" placeholder="Ví dụ: Tháng 12/2024" value={formData.desiredPeriod} onChange={e => handleInputChange('desiredPeriod', e.target.value)}/>
                   <button onClick={handleFindDates} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Tìm Ngày Cưới
                   </button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'DATES' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn pb-10">
              {fengShuiResults.dates.map((date, idx) => (
                 <div key={idx} className="bg-white rounded-xl border border-amber-100 p-0 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group flex flex-col">
                    <div className="h-2 bg-gradient-to-r from-red-500 to-amber-500"></div>
                    <div className="p-5 flex-1">
                       <div className="flex justify-between items-start mb-4">
                          <div className="text-center border border-gray-100 rounded-lg p-2 bg-gray-50 min-w-[70px]">
                             <span className="block text-xs text-gray-400 font-bold uppercase">{date.solarDate.split('-')[1]}</span>
                             <span className="block text-3xl font-black text-gray-800">{date.solarDate.split('-')[2]}</span>
                             <span className="block text-[10px] text-gray-400 font-bold">{date.solarDate.split('-')[0]}</span>
                          </div>
                          <div className="flex-1 ml-4">
                             <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">{date.lunarDate}</h4>
                             <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold mt-1 ${date.suitability === 'VERY_HIGH' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
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
                    <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                       <button onClick={() => handleSelectDate(date.solarDate)} className="w-full py-2.5 bg-white border border-gray-300 hover:border-red-500 hover:text-red-600 text-gray-600 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                          Chọn ngày này <ArrowRight className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default FengShuiConsultant;
