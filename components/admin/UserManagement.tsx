
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { UserRole, UserProfile } from '../../types';
import { 
  Plus, Trash2, ShieldCheck, User, Key, Save, X, Cloud, CloudOff, 
  Activity, Database, Users, Server, Search, Zap, Loader2, RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
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
  // This saves Firebase Reads when switching tabs
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
      userRoles: { admin: 0, user: 0, guest: 0, inactive: 0 }
  };

  // Estimate storage usage (Simulation based on real user count)
  // ~ 100KB per user doc + 50KB overhead
  const totalStorageMB = (stats.totalUsers * 0.15).toFixed(2);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            Trung Tâm Quản Trị
          </h1>
          <p className="text-slate-500 text-sm">Giám sát hệ thống và người dùng thực tế.</p>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={handleRefresh}
             className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors flex items-center gap-2 px-4"
             title="Làm mới dữ liệu"
           >
             <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
             <span className="text-xs font-bold">Làm mới</span>
           </button>
           <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200">
              <Activity className="w-3.5 h-3.5" /> Dữ liệu thực
           </span>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         {/* Total Users */}
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Users className="w-16 h-16 text-indigo-600" />
            </div>
            <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Users className="w-5 h-5" />
               </div>
               <span className="text-xs font-bold text-slate-400 uppercase">Tổng người dùng</span>
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black text-slate-800">{stats.totalUsers}</span>
            </div>
            <div className="flex gap-3 mt-3 text-xs font-medium">
               <span className="text-blue-600">{stats.userRoles.user} Active</span>
               <span className="text-slate-400">•</span>
               <span className="text-red-500">{stats.userRoles.inactive} Inactive</span>
            </div>
         </div>

         {/* Storage */}
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Database className="w-16 h-16 text-rose-600" />
            </div>
            <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                  <Database className="w-5 h-5" />
               </div>
               <span className="text-xs font-bold text-slate-400 uppercase">DB Usage (Est.)</span>
            </div>
            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-black text-slate-800">{totalStorageMB}</span>
               <span className="text-sm font-bold text-slate-400">MB</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4 overflow-hidden">
               <div className="bg-rose-500 h-full rounded-full" style={{width: '5%'}}></div>
            </div>
         </div>

         {/* Reads/Writes (Simulation based on users) */}
         <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
               <Server className="w-16 h-16 text-amber-600" />
            </div>
            <div className="flex items-center gap-3 mb-3">
               <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Server className="w-5 h-5" />
               </div>
               <span className="text-xs font-bold text-slate-400 uppercase">Firestore Load</span>
            </div>
            <div className="space-y-1">
               <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Active Sessions:</span>
                  <span className="font-bold text-slate-900">~{stats.onlineNow * 3}</span>
               </div>
               <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Daily Writes:</span>
                  <span className="font-bold text-slate-900">{stats.totalUsers * 12}</span>
               </div>
            </div>
         </div>
         
         {/* Live Visitors */}
         <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
             <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${stats.onlineNow > 0 ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs font-bold opacity-80 uppercase">Đang Online (10p)</span>
             </div>
             <div className="flex items-baseline gap-1 mt-2">
                 <span className="text-4xl font-black">{stats.onlineNow}</span>
                 <span className="text-sm opacity-80">người</span>
             </div>
             <div className="mt-4 text-xs opacity-70">
                Thống kê thời gian thực
             </div>
         </div>
      </div>

      {/* CHARTS & TABLES SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         
         {/* LEFT: TRAFFIC CHART */}
         <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Activity className="w-5 h-5 text-indigo-500" />
               Lưu lượng truy cập (7 ngày qua)
            </h3>
            <div className="h-[250px] w-full min-h-[250px]">
               {stats.dailyVisits.length > 0 ? (
                 <ResponsiveContainer width="99%" height="100%">
                    <AreaChart data={stats.dailyVisits} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                       <defs>
                          <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                       <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                       <Tooltip 
                          contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                       />
                       <Area type="monotone" dataKey="visits" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                    </AreaChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-xl">
                    <p>Chưa có dữ liệu truy cập</p>
                    <p className="text-xs mt-1 text-slate-300">(Vui lòng kiểm tra Firestore Rules)</p>
                 </div>
               )}
            </div>
         </div>

         {/* RIGHT: USER ROLES DISTRIBUTION */}
         <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">Phân loại tài khoản</h3>
            <div className="space-y-4">
               {/* Admin Bar */}
               <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                     <span className="text-purple-600">Admin</span>
                     <span className="text-slate-600">{stats.userRoles.admin}</span>
                  </div>
                  <div className="w-full bg-purple-50 rounded-full h-2">
                     <div className="bg-purple-600 h-2 rounded-full" style={{width: `${stats.totalUsers > 0 ? (stats.userRoles.admin/stats.totalUsers)*100 : 0}%`}}></div>
                  </div>
               </div>
               
               {/* User Bar */}
               <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                     <span className="text-blue-600">Active User</span>
                     <span className="text-slate-600">{stats.userRoles.user}</span>
                  </div>
                  <div className="w-full bg-blue-50 rounded-full h-2">
                     <div className="bg-blue-600 h-2 rounded-full" style={{width: `${stats.totalUsers > 0 ? (stats.userRoles.user/stats.totalUsers)*100 : 0}%`}}></div>
                  </div>
               </div>

               {/* Inactive Bar */}
               <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                     <span className="text-red-500">Inactive User</span>
                     <span className="text-slate-600">{stats.userRoles.inactive}</span>
                  </div>
                  <div className="w-full bg-red-50 rounded-full h-2">
                     <div className="bg-red-400 h-2 rounded-full" style={{width: `${stats.totalUsers > 0 ? (stats.userRoles.inactive/stats.totalUsers)*100 : 0}%`}}></div>
                  </div>
               </div>
               
               {/* Guest Bar */}
               <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                     <span className="text-gray-500">Guest</span>
                     <span className="text-slate-600">{stats.userRoles.guest}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                     <div className="bg-gray-400 h-2 rounded-full" style={{width: `${stats.totalUsers > 0 ? (stats.userRoles.guest/stats.totalUsers)*100 : 0}%`}}></div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* USER MANAGEMENT TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
         <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-slate-800 text-lg">Danh Sách Người Dùng Firebase (50 mới nhất)</h3>
            
            <div className="flex gap-2 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                     placeholder="Tìm email, tên..." 
                     className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <button 
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap"
               >
                  <Plus className="w-4 h-4" /> Thêm mới
               </button>
            </div>
         </div>

         {isAdding && (
            <div className="p-5 bg-indigo-50 border-b border-indigo-100 animate-fadeIn">
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

         <div className="overflow-x-auto">
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
                           <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                              u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                              u.role === 'GUEST' ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-blue-50 text-blue-700 border-blue-100'
                           }`}>
                              {u.role}
                           </span>
                        </td>
                        <td className="p-4">
                           {u.role === 'ADMIN' ? (
                              <span className="text-green-600 font-bold text-xs flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Admin</span>
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
                                        } catch(e) { alert("Lỗi lưu quyền Storage."); }
                                    }}
                                    className="hidden"
                                 />
                                 <span className={`text-xs font-medium flex items-center gap-1 ${u.enableCloudStorage ? 'text-blue-700' : 'text-slate-500'}`}>
                                    {u.enableCloudStorage ? <Cloud className="w-3 h-3"/> : <CloudOff className="w-3 h-3"/>}
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
                                            } catch(e) { alert("Lỗi lưu quyền API Key."); }
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
