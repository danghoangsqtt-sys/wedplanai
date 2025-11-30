
import React, { useState, useRef } from 'react';
import { useStore } from '../store/useStore';
import { validateGeminiKey } from '../services/aiService';
import * as Storage from 'firebase/storage';
import { storage } from '../lib/firebase';
import {
   User, Calendar, Settings as SettingsIcon, Database,
   Key, Shield, Cloud, Download, Upload, Trash2,
   Save, Eye, EyeOff, Info, CheckCircle2, AlertTriangle,
   Heart, Camera, X, Zap, Mail, Phone, MessageCircle, Server,
   Loader2, ExternalLink, BookOpen, CreditCard, MousePointerClick
} from 'lucide-react';

const { ref, uploadBytes, getDownloadURL } = Storage;

export type SettingsTab = 'ACCOUNT' | 'DATA' | 'SYSTEM' | 'ABOUT';

interface SettingsPageProps {
   defaultTab?: SettingsTab;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ defaultTab = 'ACCOUNT' }) => {
   const { user, updateUser, settings, updateSettings, setGeminiApiKey, resetData, importData, recalculateDeadlines, guests, budgetItems, fengShuiProfile, fengShuiResults, users } = useStore();
   const [activeTab, setActiveTab] = useState<SettingsTab>(defaultTab);

   // --- CẤU HÌNH LINK VIDEO HƯỚNG DẪN TẠI ĐÂY ---
   const YOUTUBE_GUIDE_LINK = "https://aistudio.google.com/app/apikey";
   // ---------------------------------------------

   // Local states for inputs
   const [tempApiKey, setTempApiKey] = useState(settings.geminiApiKey || '');
   const [showApiKey, setShowApiKey] = useState(false);
   const [isValidatingKey, setIsValidatingKey] = useState(false);
   const [isUploading, setIsUploading] = useState(false);

   // Guide State
   const [showApiGuide, setShowApiGuide] = useState(false);

   const fileInputRef = useRef<HTMLInputElement>(null);
   const avatarInputRef = useRef<HTMLInputElement>(null);

   // Get Admin User info for contact display
   const adminContact = users.find(u => u.role === 'ADMIN') || users[0];

   // --- Handlers ---

   const handleExportData = () => {
      const data = {
         guests,
         budgetItems,
         fengShuiProfile,
         fengShuiResults,
         exportedAt: new Date().toISOString(),
         appVersion: '2.1.0'
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wedplan_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
         try {
            const json = JSON.parse(event.target?.result as string);
            if (confirm(`Bạn có chắc chắn muốn khôi phục dữ liệu từ file này? \nDữ liệu hiện tại sẽ bị thay thế.`)) {
               importData(json);
               alert("Khôi phục dữ liệu thành công!");
            }
         } catch (err) {
            alert("File không hợp lệ hoặc bị lỗi.");
         }
      };
      reader.readAsText(file);
      e.target.value = '';
   };

   const handleResetData = () => {
      const confirmText = prompt("Hành động này sẽ XÓA TOÀN BỘ dữ liệu khách mời, ngân sách và phong thủy.\nHãy nhập 'DELETE' để xác nhận:");
      if (confirmText === 'DELETE') {
         resetData();
         alert("Đã xóa dữ liệu về mặc định.");
      }
   };

   const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate size < 2MB
      if (file.size > 2 * 1024 * 1024) {
         alert("Ảnh quá lớn. Vui lòng chọn ảnh < 2MB để tối ưu tốc độ.");
         return;
      }

      // Check if storage is initialized
      if (!storage) {
         alert("Dịch vụ lưu trữ chưa được cấu hình (Thiếu Firebase Config). Không thể tải ảnh lên.");
         return;
      }

      setIsUploading(true);
      try {
         // Path: wedplanai/${user.uid}/${fileName}
         const storageRef = ref(storage, `wedplanai/${user!.uid}/${file.name}`);

         const snapshot = await uploadBytes(storageRef, file);
         const downloadURL = await getDownloadURL(snapshot.ref);

         updateUser(user!.uid, { photoURL: downloadURL });
      } catch (error: any) {
         console.error("Upload error:", error);
         alert(`Lỗi khi tải ảnh: ${error.message}`);
      } finally {
         setIsUploading(false);
         // Reset input
         if (avatarInputRef.current) {
            avatarInputRef.current.value = '';
         }
      }
   };

   const handleRemoveAvatar = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm("Gỡ ảnh đại diện hiện tại?")) {
         updateUser(user!.uid, { photoURL: null });
      }
   };

   const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const date = e.target.value;
      updateUser(user!.uid, { weddingDate: date });
      if (date && confirm("Bạn có muốn tự động cập nhật lại hạn chót (deadline) cho các công việc dựa trên ngày cưới mới không?")) {
         recalculateDeadlines(date);
      }
   };

   const handleSaveApiKey = async () => {
      const cleanKey = tempApiKey.trim();

      if (!cleanKey) {
         alert("Vui lòng nhập API Key.");
         return;
      }

      // Simple format check for Gemini Keys
      if (!cleanKey.startsWith("AIza") && cleanKey.length < 20) {
         alert("Định dạng API Key không hợp lệ (Key thường bắt đầu bằng 'AIza').");
         return;
      }

      setIsValidatingKey(true);
      try {
         await validateGeminiKey(cleanKey);
         setGeminiApiKey(cleanKey);
         alert("Kết nối thành công! Đã lưu Google Gemini API Key.");
      } catch (error: any) {
         alert(`Kết nối thất bại: ${error.message}`);
      } finally {
         setIsValidatingKey(false);
      }
   };

   if (!user) return null;

   return (
      <div className="flex flex-col md:flex-row h-full bg-[#FDF2F8] gap-4 md:gap-6 lg:overflow-hidden rounded-xl lg:rounded-none">

         {/* --- SIDEBAR NAVIGATION (Mobile Horizontal Scroll / Desktop Vertical) --- */}
         <div className="w-full md:w-64 bg-white rounded-2xl border border-rose-100 shadow-sm flex-shrink-0 flex flex-col md:overflow-hidden">
            <div className="p-4 border-b border-rose-50 bg-rose-50/30 hidden md:block">
               <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <SettingsIcon className="w-5 h-5 text-rose-500" />
                  Cài Đặt
               </h2>
            </div>
            <div className="flex-1 overflow-x-auto md:overflow-y-auto p-2 flex md:flex-col gap-2 md:space-y-1 scrollbar-hide">
               <button
                  onClick={() => setActiveTab('ACCOUNT')}
                  className={`flex-shrink-0 w-auto md:w-full text-left px-4 py-3 rounded-xl flex items-center gap-2 md:gap-3 transition-colors whitespace-nowrap ${activeTab === 'ACCOUNT' ? 'bg-rose-50 text-rose-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
               >
                  <User className="w-4 h-4" /> Chung <span className="hidden md:inline">& Hồ Sơ</span>
               </button>
               <button
                  onClick={() => setActiveTab('DATA')}
                  className={`flex-shrink-0 w-auto md:w-full text-left px-4 py-3 rounded-xl flex items-center gap-2 md:gap-3 transition-colors whitespace-nowrap ${activeTab === 'DATA' ? 'bg-rose-50 text-rose-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
               >
                  <Database className="w-4 h-4" /> Dữ Liệu <span className="hidden md:inline">& Sao Lưu</span>
               </button>
               <button
                  onClick={() => setActiveTab('SYSTEM')}
                  className={`flex-shrink-0 w-auto md:w-full text-left px-4 py-3 rounded-xl flex items-center gap-2 md:gap-3 transition-colors whitespace-nowrap ${activeTab === 'SYSTEM' ? 'bg-rose-50 text-rose-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
               >
                  <Key className="w-4 h-4" /> Kết Nối <span className="hidden md:inline">& API</span>
               </button>
               <div className="hidden md:block pt-4 mt-4 border-t border-gray-100">
                  <button
                     onClick={() => setActiveTab('ABOUT')}
                     className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${activeTab === 'ABOUT' ? 'bg-rose-50 text-rose-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                     <Info className="w-4 h-4" /> Thông tin ứng dụng
                  </button>
               </div>
               {/* Mobile Only About Button */}
               <button
                  onClick={() => setActiveTab('ABOUT')}
                  className={`md:hidden flex-shrink-0 w-auto text-left px-4 py-3 rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'ABOUT' ? 'bg-rose-50 text-rose-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
               >
                  <Info className="w-4 h-4" /> Thông tin
               </button>
            </div>
         </div>

         {/* --- MAIN CONTENT AREA --- */}
         <div className="flex-1 bg-white rounded-2xl border border-rose-100 shadow-sm overflow-y-auto">

            {/* TAB: ACCOUNT */}
            {activeTab === 'ACCOUNT' && (
               <div className="p-4 md:p-8 space-y-8 animate-fadeIn">
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-6">
                     <div
                        className={`relative group cursor-pointer ${isUploading ? 'pointer-events-none' : ''}`}
                        onClick={() => avatarInputRef.current?.click()}
                     >
                        <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-3xl font-bold border-4 border-white shadow-md overflow-hidden relative">
                           {user.photoURL ? (
                              <img src={user.photoURL} alt="Avatar" className={`w-full h-full object-cover ${isUploading ? 'opacity-50' : ''}`} />
                           ) : (
                              user.displayName?.charAt(0)
                           )}

                           {/* Uploading Indicator */}
                           {isUploading && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
                                 <Loader2 className="w-6 h-6 text-white animate-spin" />
                              </div>
                           )}

                           {/* Overlay for upload */}
                           {!isUploading && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                 <Camera className="w-6 h-6 text-white" />
                              </div>
                           )}
                        </div>

                        {/* Remove Button */}
                        {user.photoURL && !isUploading && (
                           <button
                              onClick={handleRemoveAvatar}
                              className="absolute -top-1 -right-1 bg-white text-gray-400 hover:text-red-500 rounded-full p-1 shadow-sm border border-gray-200 z-30"
                              title="Gỡ ảnh"
                           >
                              <X className="w-3 h-3" />
                           </button>
                        )}

                        <input
                           type="file"
                           ref={avatarInputRef}
                           onChange={handleAvatarUpload}
                           accept="image/*"
                           className="hidden"
                        />
                     </div>

                     <div className="text-center md:text-left">
                        <h3 className="text-xl font-bold text-gray-800">{user.displayName}</h3>
                        <p className="text-gray-500 text-sm">{user.email}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                           (user.role === 'USER' && !user.isActive) ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                           }`}>
                           {user.role === 'USER' && !user.isActive ? 'CHƯA KÍCH HOẠT' : `${user.role} Account`}
                        </span>
                     </div>
                  </div>

                  {/* Section: Basic Info */}
                  <section className="space-y-4">
                     <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Thông tin cặp đôi</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Tên bạn (Hiển thị)</label>
                           <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                 className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-rose-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                 value={user.displayName || ''}
                                 onChange={(e) => updateUser(user.uid, { displayName: e.target.value })}
                              />
                           </div>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Tên bạn đời</label>
                           <div className="relative">
                              <Heart className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-400" />
                              <input
                                 className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-rose-500 outline-none transition-all bg-gray-50 focus:bg-white placeholder-gray-400"
                                 placeholder="Nhập tên vợ/chồng..."
                                 value={user.partnerName || ''}
                                 onChange={(e) => updateUser(user.uid, { partnerName: e.target.value })}
                              />
                           </div>
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại liên hệ</label>
                           <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                 className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-rose-500 outline-none transition-all bg-gray-50 focus:bg-white placeholder-gray-400 font-mono"
                                 placeholder="Nhập số điện thoại..."
                                 value={user.phoneNumber || ''}
                                 onChange={(e) => updateUser(user.uid, { phoneNumber: e.target.value })}
                              />
                           </div>
                        </div>
                     </div>
                  </section>

                  {/* Section: Wedding Date */}
                  <section className="space-y-4 pt-4">
                     <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Ngày Trọng Đại</h4>
                     <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tổ chức hôn lễ</label>
                              <div className="relative">
                                 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                                 <input
                                    type="date"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-rose-200 focus:border-rose-500 outline-none transition-all bg-white"
                                    value={user.weddingDate || ''}
                                    onChange={handleDateChange}
                                 />
                              </div>
                              <p className="text-[10px] text-gray-500 mt-1 italic">* Thay đổi ngày cưới sẽ gợi ý cập nhật lại hạn chót công việc.</p>
                           </div>
                           <div className="flex items-center">
                              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-white transition-colors w-full border border-transparent hover:border-rose-100">
                                 <div className={`w-10 h-6 flex items-center bg-gray-300 rounded-full p-1 duration-300 ease-in-out ${user.showCountdown ? 'bg-rose-500' : ''}`}>
                                    <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${user.showCountdown ? 'translate-x-4' : ''}`}></div>
                                 </div>
                                 <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={user.showCountdown || false}
                                    onChange={(e) => updateUser(user.uid, { showCountdown: e.target.checked })}
                                 />
                                 <div>
                                    <span className="block text-sm font-medium text-gray-800">Hiển thị đếm ngược</span>
                                    <span className="block text-xs text-gray-500">Trên màn hình Dashboard</span>
                                 </div>
                              </label>
                           </div>
                        </div>
                     </div>
                  </section>
               </div>
            )}

            {/* TAB: DATA */}
            {activeTab === 'DATA' && (
               <div className="p-4 md:p-8 space-y-8 animate-fadeIn">

                  {/* Cloud Sync */}
                  <section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm relative overflow-hidden">
                     <div className="absolute right-0 top-0 opacity-10 p-6 pointer-events-none">
                        <Cloud className="w-32 h-32 text-blue-600" />
                     </div>

                     <div className="flex items-start gap-4 relative z-10">
                        <div className="p-3 bg-white text-blue-600 rounded-xl shadow-sm">
                           <Server className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-start">
                              <h3 className="font-bold text-gray-800 text-lg">Đồng bộ đám mây (Cloud Sync)</h3>
                              <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${user.enableCloudStorage ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                 {user.enableCloudStorage ? 'Active' : 'Disabled'}
                              </span>
                           </div>
                           <p className="text-sm text-gray-600 mt-2 mb-4 max-w-lg leading-relaxed">
                              {user.enableCloudStorage
                                 ? "Dữ liệu của bạn được đồng bộ an toàn trên Firebase Cloud theo thời gian thực. Truy cập từ mọi thiết bị, không lo mất dữ liệu."
                                 : "Dữ liệu chỉ lưu trên trình duyệt này. Nếu xóa cache hoặc đổi máy, bạn sẽ mất toàn bộ kế hoạch."}
                           </p>

                           {user.role === 'GUEST' || (user.role === 'USER' && !user.isActive) ? (
                              <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 w-fit">
                                 <AlertTriangle className="w-4 h-4" />
                                 {user.role === 'GUEST' ? "Tính năng này yêu cầu tài khoản thành viên." : "Tài khoản chưa kích hoạt. Vui lòng liên hệ Admin."}
                              </div>
                           ) : (
                              <label className="flex items-center gap-3 cursor-pointer group">
                                 <div className={`w-14 h-7 flex items-center bg-gray-200 rounded-full p-1 duration-300 ease-in-out ${user.enableCloudStorage ? 'bg-blue-600' : ''}`}>
                                    <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-300 ease-in-out ${user.enableCloudStorage ? 'translate-x-7' : ''}`}></div>
                                 </div>
                                 <span className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                                    {user.enableCloudStorage ? "Đã bật đồng bộ" : "Bật đồng bộ đám mây"}
                                 </span>
                                 <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={user.enableCloudStorage}
                                    onChange={(e) => updateUser(user.uid, { enableCloudStorage: e.target.checked })}
                                 />
                              </label>
                           )}
                        </div>
                     </div>
                  </section>

                  {/* Backup & Restore */}
                  <section className="space-y-4">
                     <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Sao lưu thủ công (Local)</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Export */}
                        <div className="p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all group">
                           <div className="flex items-center gap-3 mb-3">
                              <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-gray-200 transition-colors">
                                 <Download className="w-5 h-5 text-gray-600" />
                              </div>
                              <h5 className="font-bold text-gray-800">Xuất file Backup</h5>
                           </div>
                           <p className="text-xs text-gray-500 mb-4 h-8 leading-tight">Tải về máy toàn bộ dữ liệu dưới dạng file .JSON để lưu trữ riêng.</p>
                           <button
                              onClick={handleExportData}
                              className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm"
                           >
                              Tải về (.json)
                           </button>
                        </div>

                        {/* Import */}
                        <div className="p-5 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all group">
                           <div className="flex items-center gap-3 mb-3">
                              <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-gray-200 transition-colors">
                                 <Upload className="w-5 h-5 text-gray-600" />
                              </div>
                              <h5 className="font-bold text-gray-800">Khôi phục dữ liệu</h5>
                           </div>
                           <p className="text-xs text-gray-500 mb-4 h-8 leading-tight">Khôi phục từ file .JSON đã sao lưu trước đó. Dữ liệu hiện tại sẽ bị thay thế.</p>
                           <input
                              type="file"
                              accept="application/json"
                              ref={fileInputRef}
                              className="hidden"
                              onChange={handleImportData}
                           />
                           <button
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm"
                           >
                              Chọn file Backup
                           </button>
                        </div>
                     </div>
                  </section>

                  {/* Danger Zone */}
                  <section className="pt-4">
                     <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                           <h4 className="font-bold text-red-700 flex items-center gap-2 mb-1">
                              <AlertTriangle className="w-5 h-5" /> Vùng Nguy Hiểm
                           </h4>
                           <p className="text-xs text-red-600 max-w-md">
                              Hành động này sẽ xóa toàn bộ danh sách khách, ngân sách và thiết lập về trạng thái ban đầu. Không thể hoàn tác.
                           </p>
                        </div>
                        <button
                           onClick={handleResetData}
                           className="px-5 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-600 hover:text-white transition-colors text-sm flex items-center gap-2 whitespace-nowrap shadow-sm"
                        >
                           <Trash2 className="w-4 h-4" /> Reset Dữ Liệu
                        </button>
                     </div>
                  </section>
               </div>
            )}

            {/* TAB: SYSTEM & API */}
            {activeTab === 'SYSTEM' && (
               <div className="p-4 md:p-8 space-y-8 animate-fadeIn">

                  {/* Hero Section */}
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                     <div className="absolute right-0 top-0 p-8 opacity-10 pointer-events-none">
                        <Zap className="w-40 h-40 text-yellow-400" />
                     </div>
                     <div className="relative z-10">
                        <h3 className="text-2xl font-bold flex items-center gap-2 mb-2">
                           <Shield className="w-6 h-6 text-emerald-400" /> Kích Hoạt Tính Năng Cao Cấp
                        </h3>
                        <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
                           WedPlan AI sử dụng Google Gemini (AI thông minh nhất của Google) để tư vấn phong thủy, lập ngân sách và viết lời hay.
                           Để sử dụng trọn vẹn, bạn cần kích hoạt tài khoản Pro.
                        </p>
                     </div>
                  </div>

                  {/* Account Status Warning for Inactive Users */}
                  {user.role === 'USER' && !user.isActive && (
                     <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm">
                        <div className="flex items-start gap-3">
                           <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                           <div>
                              <h4 className="font-bold text-amber-800 text-sm">Tài khoản chưa được kích hoạt</h4>
                              <p className="text-sm text-amber-700 mt-1">
                                 Hiện tại bạn không thể nhập API Key hoặc sử dụng các tính năng nâng cao.
                                 <br />
                                 <strong>Vui lòng liên hệ Admin: 0343019101 hoặc danghoang.sqtt@gmail.com để mở khóa.</strong>
                              </p>
                           </div>
                        </div>
                     </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                     {/* Left Col: Status & API Key */}
                     <div className="space-y-6">
                        <h4 className="font-bold text-gray-700 uppercase text-xs tracking-wider border-b border-gray-100 pb-2">Trạng thái kết nối</h4>

                        {user.role === 'ADMIN' ? (
                           <div className="bg-purple-50 p-5 rounded-xl border border-purple-100 flex items-start gap-4">
                              <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                 <CheckCircle2 className="w-6 h-6" />
                              </div>
                              <div>
                                 <p className="font-bold text-purple-900 text-lg">Hệ Thống Admin</p>
                                 <p className="text-sm text-purple-700 mt-1">
                                    Bạn có quyền truy cập không giới hạn vào System Key (Google Gemini). Không cần cấu hình thêm.
                                 </p>
                              </div>
                           </div>
                        ) : (
                           <div className="space-y-4">
                              {/* Activation Status */}
                              <div className={`p-4 rounded-xl border flex items-center gap-3 ${user.allowCustomApiKey && user.isActive ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                 <div className={`p-2 rounded-full ${user.allowCustomApiKey && user.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                    {user.allowCustomApiKey && user.isActive ? <Zap className="w-5 h-5" /> : <Key className="w-5 h-5" />}
                                 </div>
                                 <div>
                                    <p className="font-bold text-gray-800">
                                       {user.allowCustomApiKey && user.isActive ? "Tài khoản Pro (Đã kích hoạt)" : "Tài khoản Giới hạn"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                       {user.allowCustomApiKey && user.isActive ? "Bạn có thể nhập Key cá nhân bên dưới." : "Chưa thể sử dụng tính năng AI."}
                                    </p>
                                 </div>
                              </div>

                              {/* API Key Input (Only if allowed AND active) */}
                              {user.allowCustomApiKey && user.isActive && (
                                 <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-center mb-2">
                                       <label className="block text-sm font-bold text-gray-700">Google Gemini API Key Cá Nhân</label>
                                       <button
                                          onClick={() => setShowApiGuide(!showApiGuide)}
                                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                                       >
                                          <BookOpen className="w-3 h-3" /> Hướng dẫn lấy Key (Miễn phí)
                                       </button>
                                    </div>

                                    {/* Guide Box - Toggleable */}
                                    {showApiGuide && (
                                       <div className="mb-4 bg-indigo-50/70 border border-indigo-100 rounded-lg p-4 text-sm text-gray-700 animate-fadeIn">
                                          <div className="flex justify-between items-start mb-3">
                                             <h5 className="font-bold text-indigo-900 flex items-center gap-2">
                                                <MousePointerClick className="w-4 h-4" /> Cách lấy Key nhanh:
                                             </h5>
                                          </div>

                                          <ol className="space-y-3 pl-2">
                                             <li className="flex gap-2 items-start">
                                                <span className="bg-white text-indigo-600 font-bold w-5 h-5 flex items-center justify-center rounded-full text-xs shadow-sm flex-shrink-0 mt-0.5">1</span>
                                                <span>
                                                   Truy cập: <br />
                                                   <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-blue-600 underline font-bold break-all">
                                                      https://aistudio.google.com/app/apikey
                                                   </a>
                                                </span>
                                             </li>
                                             <li className="flex gap-2 items-start">
                                                <span className="bg-white text-indigo-600 font-bold w-5 h-5 flex items-center justify-center rounded-full text-xs shadow-sm flex-shrink-0 mt-0.5">2</span>
                                                <span>
                                                   Đăng nhập Google và nhấn <strong>Create API key</strong>.
                                                </span>
                                             </li>
                                             <li className="flex gap-2 items-start">
                                                <span className="bg-white text-indigo-600 font-bold w-5 h-5 flex items-center justify-center rounded-full text-xs shadow-sm flex-shrink-0 mt-0.5">3</span>
                                                <span>
                                                   Chọn <strong>Create API key in new project</strong> hoặc dự án có sẵn.
                                                </span>
                                             </li>
                                             <li className="flex gap-2 items-start">
                                                <span className="bg-white text-indigo-600 font-bold w-5 h-5 flex items-center justify-center rounded-full text-xs shadow-sm flex-shrink-0 mt-0.5">4</span>
                                                <span>
                                                   Copy key và dán vào ô bên dưới.
                                                </span>
                                             </li>
                                          </ol>
                                       </div>
                                    )}
                                    <div className="relative mb-2">
                                       <input
                                          type={showApiKey ? "text" : "password"}
                                          className={`w-full pl-10 pr-12 py-3 rounded-xl border outline-none transition-all font-mono text-sm ${!tempApiKey ? 'border-gray-300' : 'border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                                             }`}
                                          placeholder="AIzaSy..."
                                          value={tempApiKey}
                                          onChange={(e) => setTempApiKey(e.target.value)}
                                          disabled={isValidatingKey}
                                       />
                                       <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                       <button
                                          onClick={() => setShowApiKey(!showApiKey)}
                                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                          type="button"
                                       >
                                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                       </button>
                                    </div>

                                    <div className="flex justify-between items-center mb-4">
                                       <p className="text-[11px] text-gray-400">
                                          * Key được lưu cục bộ và chỉ dùng để gọi Google Gemini.
                                       </p>
                                    </div>

                                    <button
                                       onClick={handleSaveApiKey}
                                       disabled={isValidatingKey || !tempApiKey.trim()}
                                       className="w-full px-4 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                       {isValidatingKey ? (
                                          <>
                                             <Loader2 className="w-4 h-4 animate-spin" /> Đang kiểm tra...
                                          </>
                                       ) : (
                                          <>
                                             <Save className="w-4 h-4" /> Lưu & Kiểm tra kết nối
                                          </>
                                       )}
                                    </button>
                                 </div>
                              )}
                           </div>
                        )}
                     </div>

                     {/* Right Col: Contact Admin */}
                     <div className="space-y-6">
                        <h4 className="font-bold text-gray-700 uppercase text-xs tracking-wider border-b border-gray-100 pb-2">Hỗ trợ & Nâng cấp</h4>

                        <div className="bg-white border border-rose-100 rounded-2xl shadow-sm p-6 relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>

                           <div className="relative z-10">
                              <h5 className="font-bold text-rose-600 text-lg mb-4">Liên hệ Admin để kích hoạt</h5>
                              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                 Để mở khóa toàn bộ sức mạnh của WedPlan AI (Tự động hóa ngân sách, Cố vấn phong thủy, Viết lời hay...), vui lòng liên hệ Admin để tạo tài khoản Pro hoặc nhận mã kích hoạt.
                              </p>

                              <div className="space-y-4">
                                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer group">
                                    <div className="bg-white p-2 rounded-lg shadow-sm text-gray-600 group-hover:text-rose-600">
                                       <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-gray-400 uppercase">Admin</p>
                                       <p className="font-bold text-gray-800">{adminContact.displayName}</p>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer group">
                                    <div className="bg-white p-2 rounded-lg shadow-sm text-gray-600 group-hover:text-rose-600">
                                       <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-gray-400 uppercase">Email hỗ trợ</p>
                                       <p className="font-bold text-gray-800">{adminContact.email}</p>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer group">
                                    <div className="bg-white p-2 rounded-lg shadow-sm text-gray-600 group-hover:text-rose-600">
                                       <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                       <p className="text-xs font-bold text-gray-400 uppercase">Zalo / Phone</p>
                                       <p className="font-bold text-gray-800">{adminContact.phoneNumber || '0343019101'} (Liên hệ trực tiếp)</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                  </div>
               </div>
            )}

            {/* TAB: ABOUT */}
            {activeTab === 'ABOUT' && (
               <div className="p-6 md:p-8 text-center space-y-6 animate-fadeIn h-full flex flex-col justify-center items-center">
                  <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                     <Heart className="w-12 h-12 text-rose-500 fill-current" />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">WedPlan AI</h2>
                  <p className="text-gray-500 max-w-md mx-auto">
                     Trợ lý đám cưới thông minh, giúp bạn lên kế hoạch chi tiết, quản lý ngân sách và khách mời một cách hiệu quả nhất.
                  </p>
                  <div className="flex justify-center gap-4 text-sm font-medium text-gray-600">
                     <span>Phiên bản: 2.1.0 (Beta)</span>
                     <span>•</span>
                     <span>Xây dựng bởi Đăng Hoàng</span>
                  </div>
                  <div className="pt-8 text-xs text-gray-400">
                     © 2024 WedPlan AI. DHsystem - All rights reserved.
                  </div>
               </div>
            )}

         </div>
      </div>
   );
};

export default SettingsPage;
