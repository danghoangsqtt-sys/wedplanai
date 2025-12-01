import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { UserRole, UserProfile } from '../../types';
import {
   Plus, Trash2, ShieldCheck, User, Key, Save, X, Cloud, CloudOff,
   Activity, Database, Users, Server, Search, Zap, Loader2, RefreshCw,
   Globe, MousePointer2, MoreVertical, CheckCircle
} from 'lucide-react';
import {
   AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
   PieChart, Pie, Cell, Legend
} from 'recharts';

const AdminDashboard: React.FC = () => {
   const {
      adminUsers, adminStats, fetchAdminData,
      addUser, updateUser, deleteUser, user: currentUser,
      addNotification
   } = useStore();

   const [isAdding, setIsAdding] = useState(false);
   const [isLoading, setIsLoading] = useState(false);
   const [searchTerm, setSearchTerm] = useState('');

   // New User Form State
   const [newEmail, setNewEmail] = useState('');
   const [newName, setNewName] = useState('');
   const [newRole, setNewRole] = useState<UserRole>('USER');

   // OPTIMIZATION: Only fetch if we don't have data yet (Client-side Caching)
   useEffect(() => {
      if (adminUsers.length === 0 || !adminStats) {
         handleRefresh();
      }
   }, []);

   const handleRefresh = async () => {
      setIsLoading(true);
      await fetchAdminData();
      setIsLoading(false);
   };

   const handleAddUser = async () => {
      if (!newEmail || !newName) return;

      const newUser: UserProfile = {
         uid: `user-${Date.now()}`,
         email: newEmail,
         displayName: newName,
         photoURL: null,
         role: newRole,
         isActive: true,
         joinedAt: new Date().toISOString(),
         allowCustomApiKey: newRole === 'USER',
         enableCloudStorage: false
      };

      await addUser(newUser);
      setNewEmail('');
      setNewName('');
      setIsAdding(false);
   };

   const handleActivateUser = async (uid: string) => {
      if (confirm("Kích hoạt tài khoản này? Người dùng sẽ được bật Storage và API Key.")) {
         try {
            await updateUser(uid, {
               isActive: true,
               enableCloudStorage: true,
               allowCustomApiKey: true
            });
            addNotification('SUCCESS', 'Kích hoạt thành công!');
         } catch (error: any) {
            alert("LỖI: Không thể lưu thay đổi xuống Server.\nNguyên nhân: Thiếu quyền Admin trong Firebase Rules.\nVui lòng cập nhật Rules trong Firebase Console.");
            console.error("Activate User Error:", error);
         }
      }
   };

   const handleDeleteUser = async (uid: string) => {
      if (confirm("CẢNH BÁO: Hành động này sẽ xóa VĨNH VIỄN người dùng và toàn bộ dữ liệu của họ. Bạn có chắc chắn không?")) {
         try {
            await deleteUser(uid);
            addNotification('INFO', 'Đã xóa người dùng thành công.');
         } catch (error) {
            alert("Lỗi khi xóa người dùng.");
         }
      }
   }

   const filteredUsers = useMemo(() => {
      return adminUsers.filter(u =>
         (u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
         (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
      );
   }, [adminUsers, searchTerm]);

   // Fallback stats if loading or empty
   const stats = adminStats || {
      dailyVisits: [],
      onlineNow: 0,
      totalUsers: 0,
      userRoles: { admin: 0, user: 0, guest: 0, inactive: 0 },
      trafficSources: []
   };

   // Tính tổng lượt truy cập từ nguồn
   const totalVisits = useMemo(() => {
      return stats.trafficSources?.reduce((acc, curr) => acc + curr.value, 0) || 0;
   }, [stats.trafficSources]);

   // Estimate storage usage (Simulation based on real user count)
   // ~ 100KB per user doc + 50KB overhead
   const totalStorageMB = (stats.totalUsers * 0.15).toFixed(2);

   // Màu cho biểu đồ tròn
   const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#64748B'];

   // --- MOBILE USER CARD COMPONENT ---
   const UserCardMobile: React.FC<{ u: UserProfile }> = ({ u }) => (
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative flex flex-col gap-3">
         {/* Header: Avatar, Name, Role */}
         <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${u.role === 'ADMIN' ? 'bg-purple-500' : u.role === 'GUEST' ? 'bg-slate-400' : 'bg-blue-500'}`}>
                  {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full rounded-full object-cover" /> : (u.displayName?.charAt(0) || '?')}
               </div>
               <div className="min-w-0">
                  <div className="font-bold text-slate-800 text-sm truncate max-w-[150px]">{u.displayName}</div>
                  <div className="text-slate-500 text-xs truncate max-w-[150px]">{u.email || 'N/A'}</div>
               </div>
            </div>
            <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                  u.role === 'GUEST' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-100'
               }`}>
               {u.role}
            </span>
         </div>

         {/* Status & Actions */}
         <div className="flex items-center justify-between border-t border-gray-100 pt-3 mt-1">
            {u.role === 'ADMIN' ? (
               <span className="text-green-600 font-bold text-xs flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Admin System</span>
            ) : u.role === 'GUEST' ? (
               <span className="text-gray-400 text-xs italic">Tài khoản khách</span>
            ) : u.isActive ? (
               <div className="flex items-center gap-1 text-green-600 text-xs font-bold">
                  <CheckCircle className="w-3.5 h-3.5" /> Đã kích hoạt
               </div>
            ) : (
               <button
                  onClick={() => handleActivateUser(u.uid)}
                  className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 flex items-center gap-1 animate-pulse"
               >
                  <Zap className="w-3 h-3" /> Kích hoạt ngay
               </button>
            )}

            {u.uid !== currentUser?.uid && u.role !== 'ADMIN' && (
               <button
                  onClick={() => handleDeleteUser(u.uid)}
                  className="text-gray-400 hover:text-red-500 bg-gray-50 p-2 rounded-lg"
               >
                  <Trash2 className="w-4 h-4" />
               </button>
            )}
         </div>

         {/* Toggles */}
         <div className="grid grid-cols-2 gap-2">
            {/* Cloud Toggle */}
            <label className={`flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 ${u.role === 'GUEST' ? 'opacity-50' : ''}`}>
               <div className="flex items-center gap-2">
                  {u.enableCloudStorage ? <Cloud className="w-3.5 h-3.5 text-blue-500" /> : <CloudOff className="w-3.5 h-3.5 text-gray-400" />}
                  <span className="text-xs font-medium text-gray-600">Storage</span>
               </div>
               <input
                  type="checkbox"
                  checked={u.enableCloudStorage || false}
                  disabled={u.role === 'GUEST'}
                  onChange={(e) => {
                     try { updateUser(u.uid, { enableCloudStorage: e.target.checked }); } catch (e) { }
                  }}
                  className="w-3.5 h-3.5 text-blue-600 rounded"
               />
            </label>

            {/* API Key Toggle */}
            {u.role === 'USER' && (
               <label className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                     <Key className="w-3.5 h-3.5 text-indigo-500" />
                     <span className="text-xs font-medium text-gray-600">API</span>
                  </div>
                  <input
                     type="checkbox"
                     checked={u.allowCustomApiKey || false}
                     onChange={(e) => {
                        try { updateUser(u.uid, { allowCustomApiKey: e.target.checked }); } catch (e) { }
                     }}
                     className="w-3.5 h-3.5 text-indigo-600 rounded"
                  />
               </label>
            )}
         </div>
      </div>
   );

   return (
      <div className="space-y-4 md:space-y-6 pb-20 animate-fadeIn">

         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-none">
            <div>
               <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 md:w-7 md:h-7 text-indigo-600" />
                  Trung Tâm Quản Trị
               </h1>
               <p className="text-slate-500 text-xs md:text-sm mt-1">Giám sát hệ thống và người dùng.</p>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
               <button
                  onClick={handleRefresh}
                  className="flex-1 md:flex-none justify-center p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg md:rounded-full transition-colors flex items-center gap-2 px-4"
               >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="text-xs font-bold">Làm mới</span>
               </button>
               <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
                  <Activity className="w-3.5 h-3.5" /> Live
               </div>
            </div>
         </div>

         {/* STATS GRID */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Total Users */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute right-0 top-0 p-4 opacity-10">
                  <Users className="w-12 h-12 md:w-16 md:h-16 text-indigo-600" />
               </div>
               <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                     <Users className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Tổng người dùng</span>
               </div>
               <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-black text-slate-800">{stats.totalUsers}</span>
               </div>
               <div className="flex gap-2 md:gap-3 mt-2 md:mt-3 text-[10px] md:text-xs font-medium">
                  <span className="text-blue-600">{stats.userRoles.user} Active</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-red-500">{stats.userRoles.inactive} Inactive</span>
               </div>
            </div>

            {/* Storage */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute right-0 top-0 p-4 opacity-10">
                  <Database className="w-12 h-12 md:w-16 md:h-16 text-rose-600" />
               </div>
               <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 bg-rose-50 text-rose-600 rounded-lg">
                     <Database className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">DB Usage</span>
               </div>
               <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-black text-slate-800">{totalStorageMB}</span>
                  <span className="text-xs md:text-sm font-bold text-slate-400">MB</span>
               </div>
               <div className="w-full bg-gray-100 rounded-full h-1 mt-3 md:mt-4 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '5%' }}></div>
               </div>
            </div>

            {/* Reads/Writes */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute right-0 top-0 p-4 opacity-10">
                  <Server className="w-12 h-12 md:w-16 md:h-16 text-amber-600" />
               </div>
               <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2 bg-amber-50 text-amber-600 rounded-lg">
                     <Server className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase">Firestore Load</span>
               </div>
               <div className="space-y-1">
                  <div className="flex justify-between text-xs md:text-sm">
                     <span className="text-slate-600">Sessions:</span>
                     <span className="font-bold text-slate-900">~{stats.onlineNow * 3}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm">
                     <span className="text-slate-600">Writes:</span>
                     <span className="font-bold text-slate-900">{stats.totalUsers * 12}</span>
                  </div>
               </div>
            </div>

            {/* Live Visitors */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-4 md:p-5 rounded-2xl shadow-lg relative overflow-hidden">
               <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${stats.onlineNow > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-[10px] md:text-xs font-bold opacity-80 uppercase">Đang Online</span>
               </div>
               <div className="flex items-baseline gap-1 mt-1 md:mt-2">
                  <span className="text-3xl md:text-4xl font-black">{stats.onlineNow}</span>
                  <span className="text-xs md:text-sm opacity-80">người</span>
               </div>
            </div>
         </div>

         {/* CHARTS & TABLES SPLIT */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

            {/* LEFT: TRAFFIC & SOURCES CHART */}
            <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
               <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                     <Activity className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
                     Phân Tích Lưu Lượng
                  </h3>
                  <div className="bg-gray-50 px-2 md:px-3 py-1 rounded-lg border border-gray-100 flex items-center gap-2">
                     <span className="text-[10px] md:text-xs text-gray-500 uppercase font-bold hidden sm:inline">Tổng lượt:</span>
                     <span className="text-xs md:text-sm font-black text-indigo-600">{totalVisits}</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                  {/* Chart 1: Daily Visits */}
                  <div className="flex flex-col min-h-[180px]">
                     <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase mb-2 md:mb-3 text-center">7 ngày qua</p>
                     <div className="h-[180px] w-full flex-1">
                        {stats.dailyVisits.length > 0 ? (
                           <ResponsiveContainer width="99%" height="100%">
                              <AreaChart data={stats.dailyVisits} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                 <defs>
                                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                       <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                 <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                 />
                                 <Area type="monotone" dataKey="visits" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                              </AreaChart>
                           </ResponsiveContainer>
                        ) : (
                           <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                              <p>Chưa có dữ liệu truy cập</p>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Chart 2: Traffic Sources */}
                  <div className="flex flex-col relative min-h-[180px]">
                     <div className="absolute right-0 top-0">
                        <Globe className="w-3 h-3 md:w-4 md:h-4 text-gray-300" />
                     </div>
                     <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase mb-2 md:mb-3 text-center">Nguồn Truy Cập</p>
                     <div className="h-[180px] w-full flex-1 relative">
                        {stats.trafficSources && stats.trafficSources.length > 0 ? (
                           <ResponsiveContainer width="99%" height="100%">
                              <PieChart>
                                 <Pie
                                    data={stats.trafficSources}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={65}
                                    paddingAngle={5}
                                 >
                                    {stats.trafficSources.map((entry, index) => (
                                       <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                                    ))}
                                 </Pie>
                                 <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                                 <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: '#64748B' }}
                                    iconSize={8}
                                    iconType="circle"
                                 />
                              </PieChart>
                           </ResponsiveContainer>
                        ) : (
                           <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                              <MousePointer2 className="w-8 h-8 text-slate-200 mb-2" />
                              <p className="text-xs">Chưa có dữ liệu Referrer</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* RIGHT: USER ROLES DISTRIBUTION */}
            <div className="lg:col-span-1 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 mb-4 md:mb-6 text-sm md:text-base">Phân loại tài khoản</h3>
               <div className="space-y-4">
                  {[
                     { label: 'Admin', count: stats.userRoles.admin, color: 'text-purple-600', bg: 'bg-purple-600', bgLight: 'bg-purple-50' },
                     { label: 'Active User', count: stats.userRoles.user, color: 'text-blue-600', bg: 'bg-blue-600', bgLight: 'bg-blue-50' },
                     { label: 'Inactive User', count: stats.userRoles.inactive, color: 'text-red-500', bg: 'bg-red-400', bgLight: 'bg-red-50' },
                     { label: 'Guest', count: stats.userRoles.guest, color: 'text-gray-500', bg: 'bg-gray-400', bgLight: 'bg-gray-100' }
                  ].map((role, idx) => (
                     <div key={idx}>
                        <div className="flex justify-between text-xs font-bold mb-1">
                           <span className={role.color}>{role.label}</span>
                           <span className="text-slate-600">{role.count}</span>
                        </div>
                        <div className={`w-full ${role.bgLight} rounded-full h-1.5 md:h-2`}>
                           <div className={`${role.bg} h-1.5 md:h-2 rounded-full transition-all duration-500`} style={{ width: `${stats.totalUsers > 0 ? (role.count / stats.totalUsers) * 100 : 0}%` }}></div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* USER MANAGEMENT TABLE / CARDS */}
         <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
               <h3 className="font-bold text-slate-800 text-base md:text-lg">Danh Sách Người Dùng</h3>

               <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input
                        placeholder="Tìm email, tên..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm bg-gray-50 focus:bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                     />
                  </div>
                  <button
                     onClick={() => setIsAdding(true)}
                     className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
                  >
                     <Plus className="w-4 h-4" /> <span className="md:hidden lg:inline">Thêm mới</span>
                  </button>
               </div>
            </div>

            {isAdding && (
               <div className="p-4 md:p-5 bg-indigo-50 border-b border-indigo-100 animate-fadeIn">
                  <h4 className="font-bold text-indigo-900 mb-3 text-sm uppercase">Thêm người dùng thủ công</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                     <input
                        placeholder="Email..."
                        className="p-2.5 rounded-lg border border-indigo-200 text-sm focus:border-indigo-500 outline-none"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                     />
                     <input
                        placeholder="Tên hiển thị..."
                        className="p-2.5 rounded-lg border border-indigo-200 text-sm focus:border-indigo-500 outline-none"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                     />
                     <select
                        className="p-2.5 rounded-lg border border-indigo-200 text-sm focus:border-indigo-500 outline-none bg-white"
                        value={newRole}
                        onChange={e => setNewRole(e.target.value as UserRole)}
                     >
                        <option value="USER">User (Người dùng)</option>
                        <option value="ADMIN">Admin (Quản trị)</option>
                     </select>
                     <div className="flex gap-2">
                        <button onClick={handleAddUser} className="flex-1 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 shadow-sm">Lưu</button>
                        <button onClick={() => setIsAdding(false)} className="px-3 bg-white text-slate-500 rounded-lg border border-slate-200 hover:bg-slate-50"><X className="w-4 h-4" /></button>
                     </div>
                  </div>
               </div>
            )}

            {/* MOBILE LIST VIEW (< 768px) */}
            <div className="md:hidden bg-gray-50 p-3 space-y-3">
               {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">Không tìm thấy người dùng.</div>
               ) : (
                  filteredUsers.map(u => <UserCardMobile key={u.uid} u={u} />)
               )}
            </div>

            {/* DESKTOP TABLE VIEW (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                     <tr>
                        <th className="p-4 border-b border-slate-100">Người dùng</th>
                        <th className="p-4 border-b border-slate-100">Vai trò</th>
                        <th className="p-4 border-b border-slate-100">Trạng thái</th>
                        <th className="p-4 border-b border-slate-100">Quyền hạn & Lưu trữ</th>
                        <th className="p-4 border-b border-slate-100 text-center">Hành động</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                     {filteredUsers.length === 0 ? (
                        <tr>
                           <td colSpan={5} className="p-8 text-center text-gray-400">Không tìm thấy người dùng nào.</td>
                        </tr>
                     ) : filteredUsers.map((u) => (
                        <tr key={u.uid} className="hover:bg-slate-50/50 transition-colors">
                           <td className="p-4">
                              <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${u.role === 'ADMIN' ? 'bg-purple-500' : u.role === 'GUEST' ? 'bg-slate-400' : 'bg-blue-500'}`}>
                                    {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full rounded-full object-cover" /> : (u.displayName?.charAt(0) || '?')}
                                 </div>
                                 <div className="min-w-0">
                                    <div className="font-bold text-slate-800 truncate">{u.displayName}</div>
                                    <div className="text-slate-500 text-xs font-mono truncate">{u.email || 'N/A'}</div>
                                    <div className="text-slate-400 text-[10px] mt-0.5">UID: {u.uid.substring(0, 8)}...</div>
                                 </div>
                              </div>
                           </td>
                           <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                    u.role === 'GUEST' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-100'
                                 }`}>
                                 {u.role}
                              </span>
                           </td>
                           <td className="p-4">
                              {u.role === 'ADMIN' ? (
                                 <span className="text-green-600 font-bold text-xs flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Admin</span>
                              ) : u.role === 'GUEST' ? (
                                 <span className="text-gray-400 text-xs">Khách</span>
                              ) : u.isActive ? (
                                 <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">Đã kích hoạt</span>
                              ) : (
                                 <div className="flex flex-col gap-1 items-start">
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-200 text-center">Chưa kích hoạt</span>
                                    <button
                                       onClick={() => handleActivateUser(u.uid)}
                                       className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium mt-1"
                                    >
                                       <Zap className="w-3 h-3" /> Kích hoạt ngay
                                    </button>
                                 </div>
                              )}
                           </td>
                           <td className="p-4">
                              <div className="flex flex-col gap-2">
                                 {/* Cloud Storage Permission */}
                                 <label className={`flex items-center gap-2 ${u.role === 'GUEST' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                    <div className={`w-8 h-4 flex items-center bg-gray-300 rounded-full p-0.5 duration-300 ease-in-out ${u.enableCloudStorage ? 'bg-blue-500' : ''}`}>
                                       <div className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ease-in-out ${u.enableCloudStorage ? 'translate-x-4' : ''}`}></div>
                                    </div>
                                    <input
                                       type="checkbox"
                                       checked={u.enableCloudStorage || false}
                                       disabled={u.role === 'GUEST'}
                                       onChange={(e) => {
                                          try {
                                             updateUser(u.uid, { enableCloudStorage: e.target.checked });
                                          } catch (e) { alert("Lỗi lưu quyền Storage."); }
                                       }}
                                       className="hidden"
                                    />
                                    <span className={`text-xs font-medium flex items-center gap-1 ${u.enableCloudStorage ? 'text-blue-700' : 'text-slate-500'}`}>
                                       {u.enableCloudStorage ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
                                       Storage
                                    </span>
                                 </label>

                                 {/* API Key Permission */}
                                 {u.role === 'USER' && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                       <input
                                          type="checkbox"
                                          checked={u.allowCustomApiKey || false}
                                          onChange={(e) => {
                                             try {
                                                updateUser(u.uid, { allowCustomApiKey: e.target.checked });
                                             } catch (e) { alert("Lỗi lưu quyền API Key."); }
                                          }}
                                          className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                       />
                                       <span className="text-xs text-slate-600">Custom API Key</span>
                                    </label>
                                 )}
                              </div>
                           </td>
                           <td className="p-4 text-center">
                              {u.uid !== currentUser?.uid && u.role !== 'ADMIN' && (
                                 <button
                                    onClick={() => handleDeleteUser(u.uid)}
                                    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                    title="Xóa người dùng"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};

export default AdminDashboard;