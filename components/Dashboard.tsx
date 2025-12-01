
import React, { useMemo, useState, useEffect } from 'react';
import { DashboardStats, UserProfile, TaskStatus, GuestGroup } from '../types';
import { useStore } from '../store/useStore';
import {
   Users, Cloud, CloudOff,
   Calendar, ArrowRight, DollarSign,
   Clock, Sparkles, Check, Gift, Heart, Quote, RefreshCw,
   Plus, ListTodo, UserPlus, TrendingUp
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
      <div className="space-y-6 md:space-y-8 pb-24 animate-fadeIn w-full overflow-x-hidden">

         {/* HEADER ROW - Optimized for Mobile */}
         <div className="flex justify-between items-end gap-2 px-1">
            <div className="flex-1">
               <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                  <span>Xin chào, {user.displayName?.split(' ').pop()}</span> <span className="animate-wave origin-bottom-right inline-block">👋</span>
               </h1>
               <p className="text-gray-500 font-medium text-xs sm:text-base mt-1">Mọi thứ đã sẵn sàng chưa?</p>
            </div>

            {/* Cloud Status - Minimal on Mobile */}
            <div className={`
            flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full sm:rounded-xl 
            border transition-all shadow-sm
            ${user.enableCloudStorage ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-gray-50 text-gray-400 border-gray-200'}
        `}>
               {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : (user.enableCloudStorage ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />)}
               <span className="hidden sm:inline ml-2 text-xs font-bold">{user.enableCloudStorage ? "Đã đồng bộ" : "Lưu máy"}</span>
            </div>
         </div>

         {/* 1. HERO CARD (Countdown) - Polished */}
         <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 text-white shadow-xl shadow-rose-200/50 group">
            {/* Dynamic Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
               <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <circle cx="90" cy="10" r="40" fill="white" />
                  <circle cx="10" cy="90" r="30" fill="white" />
               </svg>
            </div>

            <div className="relative z-10 p-5 sm:p-8 flex flex-col justify-between h-full min-h-[160px] sm:min-h-[260px]">
               {/* Top Row */}
               <div className="flex justify-between items-start">
                  <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 border border-white/20 shadow-sm">
                     <Heart className="w-3 h-3 fill-current" />
                     {countdownData ? 'Ngày Chung Đôi' : 'Xin Chào'}
                  </div>
                  <button
                     onClick={handleNewQuote}
                     className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-full backdrop-blur-sm active:scale-90"
                     title="Đổi câu nói khác"
                  >
                     <RefreshCw className="w-3.5 h-3.5" />
                  </button>
               </div>

               {/* Middle: Number */}
               <div className="flex flex-col items-center justify-center py-2 sm:py-4">
                  {countdownData ? (
                     <div className="flex flex-col items-center">
                        <h2 className="text-6xl sm:text-8xl font-black tracking-tighter leading-none drop-shadow-md">
                           {Math.abs(countdownData.days)}
                        </h2>
                        <p className="text-rose-100 font-medium text-sm sm:text-xl mt-1 tracking-wide opacity-90">
                           Ngày nữa
                        </p>
                     </div>
                  ) : (
                     <div className="text-center">
                        <button
                           onClick={() => setActiveTab('settings')}
                           className="bg-white text-rose-700 px-5 py-2.5 rounded-xl font-bold hover:bg-rose-50 transition-all shadow-lg active:scale-95 inline-flex items-center gap-2 text-xs sm:text-sm"
                        >
                           <Calendar className="w-4 h-4" /> Chọn ngày cưới ngay
                        </button>
                     </div>
                  )}
               </div>

               {/* Bottom: Quote */}
               <div className="relative text-center px-2 sm:px-4">
                  <p className="text-xs sm:text-base text-rose-50/90 font-serif italic line-clamp-1 leading-relaxed">
                     "{quote}"
                  </p>
               </div>
            </div>
         </div>

         {/* 2. QUICK ACTIONS - Soft UI (No Borders) */}
         <div className="grid grid-cols-4 gap-3 sm:hidden">
            <button onClick={() => setActiveTab('budget')} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
               <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-100 transition-colors">
                  <Plus className="w-6 h-6" />
               </div>
               <span className="text-[11px] font-bold text-gray-600 text-center leading-tight">Chi tiêu</span>
            </button>

            <button onClick={() => setActiveTab('guests')} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
               <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-100 transition-colors">
                  <UserPlus className="w-6 h-6" />
               </div>
               <span className="text-[11px] font-bold text-gray-600 text-center leading-tight">Khách mời</span>
            </button>

            <button onClick={() => setActiveTab('process')} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
               <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 shadow-sm group-hover:bg-orange-100 transition-colors">
                  <ListTodo className="w-6 h-6" />
               </div>
               <span className="text-[11px] font-bold text-gray-600 text-center leading-tight">Việc cần</span>
            </button>

            <button onClick={() => setActiveTab('ai')} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform">
               <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm group-hover:bg-purple-100 transition-colors">
                  <Sparkles className="w-6 h-6" />
               </div>
               <span className="text-[11px] font-bold text-gray-600 text-center leading-tight">Hỏi AI</span>
            </button>
         </div>

         {/* 3. MAIN CONTENT GRID */}
         <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">

            {/* LEFT COLUMN: STATS & CHARTS */}
            <div className="xl:col-span-8 space-y-6">

               {/* STATS CARDS: Horizontal Scroll on Mobile (Wider cards for peek effect) */}
               <style>{`
               .hide-scrollbar::-webkit-scrollbar {
                 display: none;
               }
               .hide-scrollbar {
                 -ms-overflow-style: none;
                 scrollbar-width: none;
               }
             `}</style>
               <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0 hide-scrollbar">

                  {/* Budget Card */}
                  <div onClick={() => setActiveTab('budget')} className="snap-center w-[80vw] sm:w-auto flex-shrink-0 bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-center min-h-[150px]">
                     <div className="absolute right-0 top-0 p-6 opacity-[0.03] pointer-events-none">
                        <DollarSign className="w-32 h-32 text-gray-900" />
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign className="w-4 h-4" /></div>
                              <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">NGÂN SÁCH</span>
                           </div>
                           <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full ${stats.totalActual > stats.totalBudget ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {stats.totalBudget > 0 ? ((stats.totalActual / stats.totalBudget) * 100).toFixed(0) : 0}%
                           </span>
                        </div>

                        <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-0.5">{fmtShortMoney(stats.totalBudget)}</h3>
                        <p className="text-[10px] sm:text-xs text-gray-400 font-bold mb-4">TỔNG DỰ TRÙ</p>

                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                           <div
                              className={`h-full rounded-full transition-all duration-700 ${stats.totalActual > stats.totalBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                              style={{ width: `${stats.totalBudget > 0 ? Math.min((stats.totalActual / stats.totalBudget) * 100, 100) : 0}%` }}
                           ></div>
                        </div>
                        <div className="flex justify-between text-[11px] sm:text-xs font-medium text-gray-500">
                           <span>Đã chi: <span className="font-bold text-gray-900">{fmtShortMoney(stats.totalActual)}</span></span>
                           <span>Còn: <span className="font-bold text-gray-900">{fmtShortMoney(stats.totalBudget - stats.totalActual)}</span></span>
                        </div>
                     </div>
                  </div>

                  {/* Guests Card */}
                  <div onClick={() => setActiveTab('guests')} className="snap-center w-[80vw] sm:w-auto flex-shrink-0 bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-center min-h-[150px]">
                     <div className="absolute right-0 top-0 p-6 opacity-[0.03] pointer-events-none">
                        <Users className="w-32 h-32 text-blue-900" />
                     </div>
                     <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-4 h-4" /></div>
                              <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">KHÁCH MỜI</span>
                           </div>
                        </div>

                        <div className="flex items-baseline gap-2 mb-4">
                           <h3 className="text-3xl font-black text-gray-900 tracking-tight">{stats.totalGuests}</h3>
                           <span className="text-xs font-bold text-gray-400 uppercase">Người</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                           <div className="bg-gray-50 p-2.5 rounded-xl flex flex-col items-start justify-center pl-3 border border-gray-100">
                              <span className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Xác nhận</span>
                              <span className="text-green-600 font-black text-sm flex items-center gap-1">
                                 {stats.confirmedGuests} <Check className="w-3 h-3" />
                              </span>
                           </div>
                           <div className="bg-gray-50 p-2.5 rounded-xl flex flex-col items-start justify-center pl-3 border border-gray-100">
                              <span className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Tiền mừng</span>
                              <span className="text-amber-600 font-black text-sm flex items-center gap-1">
                                 {fmtShortMoney(stats.expectedGiftMoney)} <Gift className="w-3 h-3" />
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* CHARTS */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  {/* Pie Chart */}
                  <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col min-h-[240px]">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                           <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500"><Users className="w-3.5 h-3.5" /></div>
                           Cơ Cấu Khách
                        </h3>
                     </div>
                     <div className="h-[180px] w-full relative flex-1">
                        <ResponsiveContainer width="99%" height="100%">
                           <PieChart>
                              <Pie
                                 data={pieData}
                                 cx="50%"
                                 cy="50%"
                                 innerRadius={45}
                                 outerRadius={65}
                                 paddingAngle={5}
                                 dataKey="value"
                                 cornerRadius={4}
                                 stroke="none"
                              >
                                 {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                              </Pie>
                              <Tooltip content={<CustomTooltip />} />
                              <Legend iconType="circle" iconSize={8} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#9CA3AF' }} />
                           </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none -ml-20">
                           <span className="text-2xl font-black text-gray-800">{stats.totalGuests}</span>
                        </div>
                     </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col min-h-[240px]">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                           <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500"><TrendingUp className="w-3.5 h-3.5" /></div>
                           Chi Tiêu Top 5
                        </h3>
                     </div>
                     <div className="h-[180px] w-full flex-1">
                        <ResponsiveContainer width="99%" height="100%">
                           <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }} barGap={2} barCategoryGap="20%">
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                              <XAxis type="number" hide />
                              <YAxis
                                 dataKey="name"
                                 type="category"
                                 width={70}
                                 tick={{ fontSize: 10, fill: '#6B7280', fontWeight: 600 }}
                                 axisLine={false}
                                 tickLine={false}
                              />
                              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FFF1F2', radius: 4 }} />
                              <Bar
                                 dataKey="duKien"
                                 name="Dự kiến"
                                 fill="#E5E7EB"
                                 radius={[0, 4, 4, 0]}
                                 barSize={8}
                              />
                              <Bar
                                 dataKey="thucTe"
                                 name="Thực tế"
                                 fill="#F43F5E"
                                 radius={[0, 4, 4, 0]}
                                 barSize={8}
                              />
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </div>
            </div>

            {/* RIGHT COLUMN: TASKS & PROMO */}
            <div className="xl:col-span-4 flex flex-col gap-6">

               {/* Task List */}
               <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm flex flex-col h-full min-h-[350px]">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                        <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                           <Clock className="w-3.5 h-3.5" />
                        </div>
                        Cần Làm Gấp
                     </h3>
                     <button onClick={() => setActiveTab('budget')} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors uppercase tracking-wide">
                        Xem tất cả
                     </button>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar max-h-[400px]">
                     {urgentTasks.length > 0 ? (
                        urgentTasks.map(task => (
                           <div
                              key={task.id}
                              className="group bg-white p-3.5 rounded-2xl border border-gray-100 hover:border-rose-200 hover:shadow-sm transition-all cursor-pointer relative flex gap-3 items-center"
                              onClick={() => setActiveTab('budget')}
                           >
                              <button
                                 onClick={(e) => handleQuickComplete(e, task.id)}
                                 className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-300 hover:border-green-500 hover:bg-green-50 hover:text-green-600 transition-all flex-shrink-0"
                                 title="Hoàn thành"
                              >
                                 <Check className="w-3 h-3" />
                              </button>
                              <div className="flex-1 min-w-0">
                                 <h4 className="text-sm font-bold text-gray-700 truncate group-hover:text-rose-600 transition-colors">{task.itemName}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                    {task.deadline && (
                                       <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${new Date(task.deadline) < new Date() ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                          {new Date(task.deadline).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                                       </span>
                                    )}
                                    <span className="text-[10px] text-gray-400 font-medium truncate bg-gray-50 px-1.5 py-0.5 rounded max-w-[80px] block">{task.category}</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <span className="text-xs font-black text-gray-900 block">{fmtShortMoney(task.estimatedCost)}</span>
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-8">
                           <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-3">
                              <Sparkles className="w-6 h-6 text-green-500" />
                           </div>
                           <p className="text-gray-800 font-bold text-base">Tuyệt vời!</p>
                           <p className="text-xs text-gray-400 mt-1">Không có việc quá hạn.</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* AI Promo Card */}
               <div onClick={() => setActiveTab('ai')} className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[24px] p-6 text-white shadow-lg shadow-indigo-200 cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden group">
                  <div className="absolute right-0 top-0 opacity-10 p-4 pointer-events-none group-hover:scale-125 transition-transform duration-700">
                     <Sparkles className="w-24 h-24" />
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm shadow-inner hidden sm:block">
                           <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                           <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider mb-1">Trợ lý AI</p>
                           <p className="text-lg font-bold leading-tight">Bạn cần lời khuyên<br />về kế hoạch?</p>
                        </div>
                     </div>
                     <div className="bg-white/20 p-2.5 rounded-full hover:bg-white/30 transition-colors">
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
