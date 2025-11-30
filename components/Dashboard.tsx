
import React, { useMemo, useState, useEffect } from 'react';
import { DashboardStats, UserProfile, TaskStatus, GuestGroup } from '../types';
import { useStore } from '../store/useStore';
import {
  Users, Cloud, CloudOff,
  Calendar, ArrowRight, DollarSign,
  Clock, Sparkles, CheckCircle2,
  Check, Gift, Heart, Quote, RefreshCw
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
  "Được ai đó yêu sâu sắc sẽ mang lại cho bạn sức mạnh, trong khi yêu ai đó sâu sắc sẽ mang lại cho bạn dũng khí.",
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
      <div className="bg-white/95 backdrop-blur-md p-3 border border-gray-100 rounded-xl shadow-xl z-50">
        {label && <p className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
            <p className="text-sm font-semibold text-gray-700">
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

  // --- 2. Render Components ---

  return (
    <div className="space-y-6 md:space-y-8 pb-12 animate-fadeIn">
      
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-2">
        <div>
           <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              Xin chào, <span className="truncate max-w-[150px] md:max-w-xs block">{user.displayName}</span> <span className="animate-wave origin-bottom-right inline-block">👋</span>
           </h1>
           <p className="text-gray-500 font-medium mt-1 text-sm md:text-base">Hôm nay bạn muốn chuẩn bị gì cho ngày trọng đại?</p>
        </div>
        <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${user.enableCloudStorage ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                {isSyncing ? <Cloud className="w-3.5 h-3.5 animate-bounce"/> : (user.enableCloudStorage ? <Cloud className="w-3.5 h-3.5"/> : <CloudOff className="w-3.5 h-3.5"/>)}
                <span>{user.enableCloudStorage ? "Cloud Sync On" : "Local Mode"}</span>
            </div>
        </div>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
         
         {/* 1. HERO CARD (Countdown + Quotes) */}
         <div className="col-span-1 md:col-span-12 lg:col-span-8 relative overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-gradient-to-br from-[#E11D48] via-[#BE123C] to-[#881337] text-white shadow-2xl shadow-rose-200 group">
             
             {/* Dynamic Background Pattern */}
             <div className="absolute inset-0 opacity-10 pointer-events-none">
                 <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                 </svg>
             </div>
             <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white opacity-10 blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
             
             <div className="relative z-10 p-6 md:p-10 flex flex-col justify-between h-full min-h-[280px] md:min-h-[320px]">
                <div className="flex justify-between items-start">
                   <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2">
                      <Heart className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" /> 
                      {countdownData ? 'Save The Date' : 'Welcome'}
                   </div>
                   <button 
                    onClick={handleNewQuote}
                    className="text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-sm"
                    title="Đổi câu nói khác"
                   >
                      <RefreshCw className="w-4 h-4" />
                   </button>
                </div>

                <div className="mt-4 flex-1 flex flex-col justify-center">
                   {countdownData ? (
                      <div className="flex flex-col md:flex-row items-baseline md:items-end gap-2 md:gap-6">
                         <h2 className="text-6xl sm:text-7xl md:text-[8rem] font-black tracking-tighter leading-none drop-shadow-lg">
                            {Math.abs(countdownData.days)}
                         </h2>
                         <div className="pb-2 md:pb-6">
                            <span className="text-2xl md:text-4xl font-bold opacity-90 block">Ngày nữa</span>
                            <span className="text-rose-100 text-sm md:text-lg font-medium opacity-80">Đến ngày {countdownData.dateStr}</span>
                         </div>
                      </div>
                   ) : (
                      <div className="text-center md:text-left">
                         <h2 className="text-3xl md:text-5xl font-black mb-4">Chưa chọn ngày?</h2>
                         <button 
                            onClick={() => setActiveTab('settings')}
                            className="bg-white text-rose-700 px-6 py-2.5 md:px-8 md:py-3 rounded-2xl font-bold hover:bg-rose-50 transition-all shadow-lg active:scale-95 inline-flex items-center gap-2 text-sm md:text-base"
                         >
                            <Calendar className="w-5 h-5" /> Thiết lập ngay
                         </button>
                      </div>
                   )}
                </div>

                <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-white/10 relative">
                   <Quote className="absolute -top-3 left-0 w-6 h-6 text-white/40 fill-current transform -scale-x-100" />
                   <p className="font-serif italic text-base md:text-xl text-rose-50 leading-relaxed pl-8 line-clamp-2 md:line-clamp-3">
                      "{quote}"
                   </p>
                </div>
             </div>
         </div>

         {/* 2. STATS CARDS (Vertical Stack) */}
         <div className="col-span-1 md:col-span-12 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 md:gap-6">
             {/* Total Budget Card */}
             <div onClick={() => setActiveTab('budget')} className="bg-white p-5 md:p-6 rounded-3xl md:rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col justify-center min-h-[200px]">
                <div className="absolute right-0 top-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                   <DollarSign className="w-32 h-32 text-gray-900" />
                </div>
                <div className="relative z-10">
                   <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                         <DollarSign className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">NGÂN SÁCH</span>
                   </div>
                   
                   <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Tổng dự trù</p>
                      <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{fmtShortMoney(stats.totalBudget)}</h3>
                   </div>

                   <div className="mt-4 md:mt-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex justify-between text-xs font-bold mb-2">
                         <span className="text-gray-500">Thực chi: <span className="text-gray-800">{fmtShortMoney(stats.totalActual)}</span></span>
                         <span className={stats.totalActual > stats.totalBudget ? "text-red-500" : "text-emerald-500"}>
                            {stats.totalBudget > 0 ? ((stats.totalActual/stats.totalBudget)*100).toFixed(0) : 0}%
                         </span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                         <div 
                            className={`h-full rounded-full transition-all duration-700 ${stats.totalActual > stats.totalBudget ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-emerald-400 to-emerald-600'}`} 
                            style={{ width: `${stats.totalBudget > 0 ? Math.min((stats.totalActual/stats.totalBudget)*100, 100) : 0}%` }}
                         ></div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Guests Card */}
             <div onClick={() => setActiveTab('guests')} className="bg-white p-5 md:p-6 rounded-3xl md:rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden h-full flex flex-col justify-center min-h-[200px]">
                <div className="absolute right-0 top-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                   <Users className="w-32 h-32 text-blue-900" />
                </div>
                <div className="relative z-10">
                   <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                         <Users className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">KHÁCH MỜI</span>
                   </div>
                   
                   <div className="space-y-1">
                      <p className="text-sm text-gray-500 font-medium">Tổng số khách</p>
                      <h3 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{stats.totalGuests}</h3>
                   </div>
                   
                   <div className="mt-4 md:mt-6 grid grid-cols-2 gap-3">
                       <div className="bg-green-50/50 p-2.5 rounded-xl border border-green-100 flex flex-col items-center justify-center text-center">
                          <span className="text-green-600 font-black text-lg md:text-xl">{stats.confirmedGuests}</span>
                          <span className="text-[10px] font-bold text-green-700 uppercase">Xác nhận</span>
                       </div>
                       <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 flex flex-col items-center justify-center text-center">
                          <span className="text-amber-600 font-black text-lg md:text-xl">{fmtShortMoney(stats.expectedGiftMoney)}</span>
                          <span className="text-[10px] font-bold text-amber-700 uppercase">Mừng</span>
                       </div>
                   </div>
                </div>
             </div>
         </div>

         {/* 3. CHARTS ROW */}
         <div className="col-span-1 md:col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
             {/* Pie Chart */}
             <div className="bg-white p-5 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col min-h-[300px]">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                          <Users className="w-4 h-4" />
                        </div>
                        Cơ Cấu Khách Mời
                    </h3>
                 </div>
                 <div className="h-[200px] md:h-[250px] w-full relative flex-1 min-h-[200px]">
                     <ResponsiveContainer width="99%" height="100%">
                        <PieChart>
                           <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={5}
                              dataKey="value"
                              cornerRadius={8}
                              stroke="none"
                           >
                              {pieData.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                           </Pie>
                           <Tooltip content={<CustomTooltip />} />
                           <Legend iconType="circle" iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '11px', fontWeight: 600, color: '#4B5563'}}/>
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -ml-20">
                        <span className="text-2xl md:text-3xl font-black text-gray-800">{stats.totalGuests}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Khách</span>
                     </div>
                 </div>
             </div>

             {/* Bar Chart */}
             <div className="bg-white p-5 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col min-h-[300px]">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                        <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        Chi Tiêu Theo Nhóm
                    </h3>
                 </div>
                 <div className="h-[200px] md:h-[250px] w-full flex-1 min-h-[200px]">
                     <ResponsiveContainer width="99%" height="100%">
                        <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }} barGap={6} barCategoryGap="20%">
                           <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6"/>
                           <XAxis type="number" hide />
                           <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={90} 
                              tick={{fontSize: 10, fill: '#6B7280', fontWeight: 600}} 
                              axisLine={false} 
                              tickLine={false} 
                           />
                           <Tooltip content={<CustomTooltip />} cursor={{fill: '#FFF1F2', radius: 8}} />
                           <Bar 
                              dataKey="duKien" 
                              name="Dự kiến" 
                              fill="#E5E7EB" 
                              radius={[0, 6, 6, 0]} 
                              barSize={10} 
                           />
                           <Bar 
                              dataKey="thucTe" 
                              name="Thực tế" 
                              fill="#F43F5E" 
                              radius={[0, 6, 6, 0]} 
                              barSize={10} 
                           />
                        </BarChart>
                     </ResponsiveContainer>
                 </div>
             </div>
         </div>

         {/* 4. URGENT TASKS & AI PROMO */}
         <div className="col-span-1 md:col-span-12 lg:col-span-4 flex flex-col gap-4 md:gap-6">
             
             {/* Task List */}
             <div className="bg-white p-5 md:p-6 rounded-3xl md:rounded-[2.5rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col h-full min-h-[300px]">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm md:text-base">
                      <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                         <Clock className="w-4 h-4" />
                      </div>
                      Cần Làm Gấp
                   </h3>
                   <button onClick={() => setActiveTab('budget')} className="text-xs font-bold text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
                      Xem tất cả
                   </button>
                </div>
                
                <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                   {urgentTasks.length > 0 ? (
                      urgentTasks.map(task => (
                         <div 
                            key={task.id} 
                            className="group bg-white p-3 md:p-4 rounded-2xl border border-gray-100 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-100/50 transition-all cursor-pointer relative flex gap-3 items-center"
                            onClick={() => setActiveTab('budget')}
                         >
                            <button 
                               onClick={(e) => handleQuickComplete(e, task.id)}
                               className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-300 hover:border-green-500 hover:bg-green-50 hover:text-green-600 transition-all flex-shrink-0"
                               title="Hoàn thành"
                            >
                               <Check className="w-3.5 h-3.5" />
                            </button>
                            <div className="flex-1 min-w-0">
                               <h4 className="text-sm font-bold text-gray-800 truncate group-hover:text-rose-600 transition-colors">{task.itemName}</h4>
                               <div className="flex items-center gap-2 mt-1">
                                  {task.deadline && (
                                     <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${new Date(task.deadline) < new Date() ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                        {new Date(task.deadline).toLocaleDateString('vi-VN', {day: 'numeric', month: 'numeric'})}
                                     </span>
                                  )}
                                  <span className="text-[10px] text-gray-400 font-medium truncate bg-gray-50 px-1.5 py-0.5 rounded max-w-[80px] block">{task.category}</span>
                               </div>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-black text-gray-900 block">{fmtShortMoney(task.estimatedCost)}</span>
                            </div>
                         </div>
                      ))
                   ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-8">
                         <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-3">
                            <Sparkles className="w-8 h-8 text-green-500" />
                         </div>
                         <p className="text-gray-800 font-bold">Mọi thứ đã sẵn sàng!</p>
                         <p className="text-xs text-gray-400 mt-1">Không có công việc nào quá hạn.</p>
                      </div>
                   )}
                </div>
             </div>

             {/* AI Promo Card */}
             <div onClick={() => setActiveTab('ai')} className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl md:rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-200 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group">
                <div className="absolute right-0 top-0 opacity-10 p-4 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                    <Sparkles className="w-24 h-24" />
                </div>
                <div className="relative z-10 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm shadow-inner">
                         <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                         <p className="text-xs font-bold opacity-80 uppercase tracking-wider mb-0.5">Trợ lý AI</p>
                         <p className="text-lg font-bold">Bạn cần lời khuyên?</p>
                      </div>
                   </div>
                   <div className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
                     <ArrowRight className="w-5 h-5" />
                   </div>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
