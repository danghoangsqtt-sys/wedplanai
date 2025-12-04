
import React, { useMemo, useState, useEffect } from 'react';
import { DashboardStats, UserProfile, TaskStatus, GuestGroup } from '../types';
import { useStore } from '../store/useStore';
import {
  Users, Cloud, CloudOff,
  Calendar, ArrowRight, DollarSign,
  Clock, Sparkles, Check, Gift, Heart, RefreshCw,
  Plus, ListTodo, UserPlus, TrendingUp, AlertCircle, Briefcase
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

interface DashboardProps {
  stats: DashboardStats;
  user: UserProfile;
  isSyncing: boolean;
  setActiveTab: (tab: any) => void;
}

// --- DATA: LOVE QUOTES ---
const LOVE_QUOTES = [
  "Hạnh phúc là hành trình, không phải là đích đến.",
  "Trăm năm tình viên mãn, bạc đầu nghĩa phu thê.",
  "Hôn nhân là cuộc hành trình dài nhất mà bạn sẽ đi cùng một người bạn đồng hành.",
  "Yêu không phải là nhìn nhau, mà là cùng nhau nhìn về một hướng.",
  "Được ai đó yêu sâu sắc sẽ mang lại cho bạn sức mạnh.",
  "Hạnh phúc trong hôn nhân hoàn toàn là vấn đề may mắn... và rất nhiều sự nỗ lực.",
  "Một cuộc hôn nhân hạnh phúc là cuộc trò chuyện dài mà dường như luôn quá ngắn.",
  "Tình yêu không làm thế giới quay tròn. Tình yêu là những gì làm cho chuyến đi đáng giá.",
  "Nơi nào có tình yêu, nơi đó có sự sống.",
  "Hôn nhân không phải là tìm một người hoàn hảo, mà là học cách nhìn một người không hoàn hảo một cách hoàn hảo."
];

// --- CUSTOM TOOLTIP FOR CHARTS ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 border border-gray-100 rounded-xl shadow-xl z-50 text-sm">
        {label && <p className="font-bold text-gray-400 uppercase mb-2 tracking-wider text-[10px]">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color || entry.payload.fill }} />
            <p className="font-semibold text-gray-700">
              {entry.name}: <span className="font-mono font-bold text-gray-900">{new Intl.NumberFormat('vi-VN').format(entry.value || 0)}</span>
              {entry.name === 'Tỉ lệ' ? '%' : ''}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ stats, user, isSyncing, setActiveTab }) => {
  const { guests, budgetItems, updateBudgetItem } = useStore();
  const [quote, setQuote] = useState(LOVE_QUOTES[0]);

  // Randomize quote on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * LOVE_QUOTES.length);
    setQuote(LOVE_QUOTES[randomIndex]);
  }, []);

  const handleNewQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * LOVE_QUOTES.length);
    } while (LOVE_QUOTES[newIndex] === quote);
    setQuote(LOVE_QUOTES[newIndex]);
  };

  // --- 1. Data Processing ---
  const pieData = useMemo(() => [
    { name: 'Nhà Trai', value: guests.filter(g => g.group === GuestGroup.GROOM).length, color: '#3B82F6' }, // Blue
    { name: 'Nhà Gái', value: guests.filter(g => g.group === GuestGroup.BRIDE).length, color: '#EC4899' }, // Pink
    { name: 'Bạn Bè', value: guests.filter(g => g.group === GuestGroup.FRIEND).length, color: '#F59E0B' }, // Amber
    { name: 'Đồng Nghiệp', value: guests.filter(g => g.group === GuestGroup.WORK).length, color: '#8B5CF6' }, // Violet
  ].filter(d => d.value > 0), [guests]);

  const barData = useMemo(() => {
    const groups: Record<string, { name: string, duKien: number, thucTe: number }> = {};
    budgetItems.forEach(item => {
      if (!groups[item.category]) groups[item.category] = { name: item.category, duKien: 0, thucTe: 0 };
      groups[item.category].duKien += item.estimatedCost;
      groups[item.category].thucTe += item.actualCost;
    });
    return Object.values(groups)
      .sort((a, b) => b.duKien - a.duKien)
      .slice(0, 5); // Top 5 categories
  }, [budgetItems]);

  const urgentTasks = useMemo(() => {
    return budgetItems
      .filter(i => i.status !== TaskStatus.DONE && i.status !== TaskStatus.PAID)
      .sort((a, b) => {
         if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
         if (a.deadline) return -1;
         if (b.deadline) return 1;
         return b.estimatedCost - a.estimatedCost;
      })
      .slice(0, 5);
  }, [budgetItems]);

  const countdownData = useMemo(() => {
    if (!user.weddingDate) return null;
    const weddingDate = new Date(user.weddingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    weddingDate.setHours(0, 0, 0, 0);
    const diffTime = weddingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
       days: diffDays,
       dateStr: weddingDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
  }, [user.weddingDate]);

  const handleQuickComplete = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (confirm("Đánh dấu công việc này là đã xong?")) {
        updateBudgetItem(itemId, 'status', TaskStatus.DONE);
    }
  };

  const fmtShortMoney = (amount: number) => {
    if (amount >= 1000000000) return (amount / 1000000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tỷ';
    if (amount >= 1000000) return (amount / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' tr';
    return amount.toLocaleString('vi-VN');
  };

  const getDayGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Chào buổi sáng";
      if (hour < 18) return "Chào buổi chiều";
      return "Buổi tối an lành";
  };

  // --- 2. Render Components ---

  return (
    <div className="pb-24 animate-fadeIn w-full">
      
      {/* HEADER ROW - Optimized for Desktop & Mobile */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3 md:gap-4 mb-5 md:mb-8">
        <div>
           <div className="text-gray-500 font-medium text-xs md:text-sm flex items-center gap-2 mb-1">
              <span className="bg-white px-2 py-0.5 rounded text-[10px] md:text-xs font-bold shadow-sm border border-gray-100 uppercase tracking-wide">
                {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
              </span>
              <span>{getDayGreeting()}</span>
           </div>
           <h1 className="text-xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-2 font-serif-display">
              {user.displayName} <span className="animate-wave origin-bottom-right inline-block">👋</span>
           </h1>
        </div>
        
        {/* Cloud Status */}
        <div className={`
            flex items-center justify-center px-3 py-1.5 md:px-4 md:py-2 rounded-xl border transition-all shadow-sm bg-white self-start md:self-auto
            ${user.enableCloudStorage ? 'border-sky-200 text-sky-700' : 'border-gray-200 text-gray-600'}
        `}>
            {isSyncing ? <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4 animate-spin mr-1.5 md:mr-2"/> : (user.enableCloudStorage ? <Cloud className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 text-sky-500"/> : <CloudOff className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 text-gray-400"/>)}
            <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] md:text-[10px] uppercase font-bold tracking-wider opacity-60">Trạng thái</span>
                <span className="text-[10px] md:text-xs font-bold">{user.enableCloudStorage ? "Đã đồng bộ Cloud" : "Lưu trữ cục bộ"}</span>
            </div>
        </div>
      </div>

      {/* MAIN GRID LAYOUT (BENTO GRID STYLE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
         
         {/* LEFT COLUMN (8 cols) */}
         <div className="lg:col-span-8 space-y-4 md:space-y-6">
             
             {/* 1. HERO CARD (Countdown) */}
             <div className="relative overflow-hidden rounded-2xl md:rounded-[2rem] bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 text-white shadow-xl shadow-rose-200/50 group h-auto min-h-[220px] md:h-[280px] flex flex-col justify-center transition-all">
                {/* Dynamic Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay"
                     style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
                ></div>
                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-[-30px] left-[-30px] w-48 h-48 bg-rose-300 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative z-10 p-5 md:px-8 md:py-6 h-full flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                      <div className="bg-white/20 backdrop-blur-md px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-white/20 shadow-sm">
                        <Heart className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current animate-pulse" /> 
                        {countdownData ? 'Ngày Chung Đôi' : 'Xin Chào'}
                      </div>
                      <button 
                        onClick={handleNewQuote}
                        className="text-white/70 hover:text-white transition-colors bg-black/10 hover:bg-black/20 p-1.5 md:p-2 rounded-full backdrop-blur-sm active:scale-90"
                        title="Đổi câu nói khác"
                      >
                        <RefreshCw className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center text-center py-2 md:py-0">
                      {countdownData ? (
                        <>
                            <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none drop-shadow-sm font-serif-display">
                              {Math.abs(countdownData.days)}
                            </h2>
                            <p className="text-rose-100 font-medium text-sm md:text-xl mt-1 tracking-wide opacity-90 uppercase">
                              Ngày nữa về chung một nhà
                            </p>
                            <p className="text-white/60 text-xs md:text-sm font-mono mt-1 md:mt-2">{countdownData.dateStr}</p>
                        </>
                      ) : (
                        <div className="text-center">
                            <h2 className="text-xl md:text-3xl font-bold mb-3 md:mb-4 font-serif-display">Hãy bắt đầu kế hoạch của bạn</h2>
                            <button 
                              onClick={() => setActiveTab('settings')}
                              className="bg-white text-rose-700 px-4 py-2 md:px-6 md:py-3 rounded-xl font-bold hover:bg-rose-50 transition-all shadow-lg active:scale-95 inline-flex items-center gap-2 text-xs md:text-base"
                            >
                              <Calendar className="w-4 h-4 md:w-5 md:h-5" /> Chọn ngày cưới ngay
                            </button>
                        </div>
                      )}
                  </div>

                  <div className="text-center px-2 md:px-4">
                       <p className="text-xs md:text-base text-rose-50 font-serif italic line-clamp-2 md:line-clamp-1 opacity-90">
                        "{quote}"
                      </p>
                  </div>
                </div>
             </div>

             {/* 2. STATS ROW (Budget & Guest Summary) */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                 
                 {/* Budget Card */}
                 <div onClick={() => setActiveTab('budget')} className="group bg-white p-4 md:p-6 rounded-2xl md:rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                       <DollarSign className="w-24 h-24 md:w-32 md:h-32 text-gray-900" />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                       <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                          <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                       </div>
                       <div>
                          <h3 className="font-bold text-gray-800 text-base md:text-lg">Ngân Sách</h3>
                          <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wide">Tài chính</p>
                       </div>
                    </div>

                    <div className="space-y-3 md:space-y-4 relative z-10">
                        <div>
                           <div className="flex justify-between items-baseline mb-1">
                              <span className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{fmtShortMoney(stats.totalBudget)}</span>
                              <span className={`text-[10px] md:text-xs font-bold px-2 py-1 rounded-full ${stats.totalActual > stats.totalBudget ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {stats.totalBudget > 0 ? ((stats.totalActual/stats.totalBudget)*100).toFixed(0) : 0}%
                              </span>
                           </div>
                           <div className="w-full h-2 md:h-3 bg-gray-100 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${stats.totalActual > stats.totalBudget ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${stats.totalBudget > 0 ? Math.min((stats.totalActual/stats.totalBudget)*100, 100) : 0}%` }}
                                 ></div>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 md:gap-4 pt-1 md:pt-2">
                           <div className="bg-gray-50 rounded-xl p-2.5 md:p-3 border border-gray-100">
                              <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase mb-0.5 md:mb-1">Thực tế chi</p>
                              <p className={`font-bold text-sm md:text-lg ${stats.totalActual > stats.totalBudget ? 'text-red-600' : 'text-emerald-600'}`}>{fmtShortMoney(stats.totalActual)}</p>
                           </div>
                           <div className="bg-gray-50 rounded-xl p-2.5 md:p-3 border border-gray-100">
                              <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase mb-0.5 md:mb-1">Còn lại</p>
                              <p className="font-bold text-sm md:text-lg text-gray-800">{fmtShortMoney(stats.totalBudget - stats.totalActual)}</p>
                           </div>
                        </div>
                    </div>
                 </div>

                 {/* Guest Card */}
                 <div onClick={() => setActiveTab('guests')} className="group bg-white p-4 md:p-6 rounded-2xl md:rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                       <Users className="w-24 h-24 md:w-32 md:h-32 text-blue-900" />
                    </div>

                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                       <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                          <Users className="w-4 h-4 md:w-5 md:h-5" />
                       </div>
                       <div>
                          <h3 className="font-bold text-gray-800 text-base md:text-lg">Khách Mời</h3>
                          <p className="text-[10px] md:text-xs text-gray-400 font-medium uppercase tracking-wide">Danh sách</p>
                       </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-4 md:mb-6">
                       <span className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{stats.totalGuests}</span>
                       <span className="text-xs md:text-sm font-bold text-gray-400 uppercase">Người</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 relative z-10">
                        <div className="flex items-center gap-2 md:gap-3 bg-gray-50 p-2.5 md:p-3 rounded-xl border border-gray-100">
                           <div className="bg-green-100 p-1 md:p-1.5 rounded-lg text-green-600"><Check className="w-3.5 h-3.5 md:w-4 md:h-4" /></div>
                           <div>
                              <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase">Xác nhận</p>
                              <p className="font-bold text-gray-800 text-sm md:text-base">{stats.confirmedGuests}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 bg-gray-50 p-2.5 md:p-3 rounded-xl border border-gray-100">
                           <div className="bg-amber-100 p-1 md:p-1.5 rounded-lg text-amber-600"><Gift className="w-3.5 h-3.5 md:w-4 md:h-4" /></div>
                           <div>
                              <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase">Tiền mừng</p>
                              <p className="font-bold text-gray-800 text-xs md:text-sm">{fmtShortMoney(stats.expectedGiftMoney)}</p>
                           </div>
                        </div>
                    </div>
                 </div>
             </div>

             {/* 3. EXPENSE CHART (Bar Chart) */}
             <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[1.5rem] border border-gray-100 shadow-sm h-[280px] md:h-[320px] flex flex-col">
                 <div className="flex justify-between items-center mb-4 md:mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                           <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-base md:text-lg">Chi Tiêu Top 5</h3>
                    </div>
                 </div>
                 <div className="flex-1 w-full text-xs">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }} barGap={4} barCategoryGap="20%">
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6"/>
                           <XAxis type="number" hide />
                           <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={100} 
                              tick={{fontSize: 10, fill: '#6B7280', fontWeight: 600}} 
                              axisLine={false} 
                              tickLine={false} 
                           />
                           <Tooltip content={<CustomTooltip />} cursor={{fill: '#FFF1F2', radius: 8}} />
                           <Bar 
                              dataKey="duKien" 
                              name="Dự kiến" 
                              fill="#E5E7EB" 
                              radius={[0, 4, 4, 0]} 
                              barSize={10} 
                           />
                           <Bar 
                              dataKey="thucTe" 
                              name="Thực tế" 
                              fill="#F43F5E" 
                              radius={[0, 4, 4, 0]} 
                              barSize={10} 
                           />
                        </BarChart>
                     </ResponsiveContainer>
                 </div>
             </div>
         </div>

         {/* RIGHT COLUMN (4 cols) */}
         <div className="lg:col-span-4 space-y-4 md:space-y-6">
             
             {/* 4. GUEST CHART (Pie) */}
             <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col h-[260px] md:h-[300px]">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                       <Users className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-gray-800 text-base">Cơ Cấu Khách</h3>
                 </div>
                 <div className="flex-1 relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={70}
                              paddingAngle={5}
                              dataKey="value"
                              cornerRadius={6}
                              stroke="none"
                           >
                              {pieData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                           </Pie>
                           <Tooltip content={<CustomTooltip />} />
                           <Legend iconType="circle" iconSize={8} layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '10px', fontWeight: 600, color: '#9CA3AF', paddingTop: '10px'}}/>
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                        <span className="text-2xl md:text-3xl font-black text-gray-800 leading-none">{stats.totalGuests}</span>
                        <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase">Tổng</span>
                     </div>
                 </div>
             </div>

             {/* 5. URGENT TASKS */}
             <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col min-h-[300px] md:min-h-[350px]">
                <div className="flex justify-between items-center mb-3 md:mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                         <AlertCircle className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-gray-800 text-base">Cần Làm Gấp</h3>
                   </div>
                   <button onClick={() => setActiveTab('budget')} className="text-[10px] md:text-xs font-bold text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-md transition-colors">
                      Xem hết
                   </button>
                </div>
                
                <div className="flex-1 space-y-2 md:space-y-3 overflow-y-auto pr-1 custom-scrollbar max-h-[300px] md:max-h-[400px]">
                   {urgentTasks.length > 0 ? (
                      urgentTasks.map(task => (
                         <div 
                            key={task.id} 
                            className="group bg-gray-50 hover:bg-white p-3 rounded-xl border border-transparent hover:border-rose-200 hover:shadow-sm transition-all cursor-pointer relative flex gap-3 items-start"
                         >
                            <button 
                               onClick={(e) => handleQuickComplete(e, task.id)}
                               className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center text-transparent hover:border-green-500 hover:bg-green-50 hover:text-green-600 transition-all flex-shrink-0"
                               title="Hoàn thành"
                            >
                               <Check className="w-3 h-3" />
                            </button>
                            <div className="flex-1 min-w-0" onClick={() => setActiveTab('budget')}>
                               <h4 className="text-xs md:text-sm font-bold text-gray-700 truncate group-hover:text-rose-600 transition-colors leading-tight mb-1">{task.itemName}</h4>
                               <div className="flex items-center gap-2">
                                  {task.deadline && (
                                     <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${new Date(task.deadline) < new Date() ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                        <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" />
                                        {new Date(task.deadline).toLocaleDateString('vi-VN', {day: 'numeric', month: 'numeric'})}
                                     </span>
                                  )}
                                  <span className="text-[9px] md:text-[10px] text-gray-500 font-medium bg-white border border-gray-200 px-1.5 py-0.5 rounded truncate max-w-[70px] md:max-w-[80px]">{task.category}</span>
                               </div>
                            </div>
                            <div className="text-right">
                               <span className="text-[10px] md:text-xs font-bold text-gray-900 block">{fmtShortMoney(task.estimatedCost)}</span>
                            </div>
                         </div>
                      ))
                   ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-8">
                         <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-full flex items-center justify-center mb-2">
                            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                         </div>
                         <p className="text-gray-800 font-bold text-sm">Tuyệt vời!</p>
                         <p className="text-xs text-gray-400">Không có việc quá hạn.</p>
                      </div>
                   )}
                </div>
             </div>

             {/* 6. AI PROMO CARD */}
             <div onClick={() => setActiveTab('ai')} className="bg-gradient-to-r from-violet-600 to-indigo-700 rounded-2xl md:rounded-[1.5rem] p-4 md:p-6 text-white shadow-lg shadow-indigo-200 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-20 p-4 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                    <Sparkles className="w-24 h-24 md:w-32 md:h-32" />
                </div>
                <div className="relative z-10 flex flex-col gap-3 md:gap-4">
                   <div className="flex items-center justify-between">
                      <div className="bg-white/20 p-1.5 md:p-2 rounded-lg backdrop-blur-sm shadow-inner">
                         <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <span className="text-[9px] md:text-[10px] font-bold bg-white/20 px-2 py-1 rounded text-white/90">BETA</span>
                   </div>
                   
                   <div>
                      <p className="text-[10px] md:text-xs font-bold opacity-80 uppercase tracking-wider mb-1">Trợ lý AI</p>
                      <p className="text-lg md:text-xl font-bold leading-tight">Bạn cần lời khuyên<br/>về kế hoạch cưới?</p>
                   </div>

                   <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold bg-white/10 w-fit px-3 py-2 rounded-lg hover:bg-white/20 transition-colors">
                     Hỏi ngay <ArrowRight className="w-3 h-3" />
                   </div>
                </div>
             </div>

         </div>
      </div>
    </div>
  );
};

export default Dashboard;
