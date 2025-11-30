
import React, { useState, useMemo, useEffect } from 'react';
import { AttendanceProbability, DashboardStats, TaskStatus } from './types';
import GuestManager from './components/GuestManager';
import AIAdvisor from './components/AIAdvisor';
import DetailedBudgetPlanner from './components/DetailedBudgetPlanner';
import LoginPage from './components/auth/LoginPage';
import Sidebar from './components/layout/Sidebar';
import UserManagement from './components/admin/UserManagement';
import Dashboard from './components/Dashboard';
import ProcessGuide from './components/ProcessGuide';
import FengShuiConsultant from './components/fengshui/FengShuiConsultant';
import SettingsPage from './components/SettingsPage';
import Notifications from './components/ui/Notifications';
import { useStore } from './store/useStore';
import { Menu, ShieldAlert, LogIn, AlertTriangle } from 'lucide-react';
import { logAppVisit } from './services/cloudService';

function App() {
  const { user, settings, guests, budgetItems, isSyncing, refreshUserProfile } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'process' | 'fengshui' | 'guests' | 'budget' | 'ai' | 'admin' | 'settings'>('dashboard');
  
  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // --- Apply Theme Effect ---
  useEffect(() => {
    if (settings.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.themeMode]);

  // --- Analytics & User Sync Tracking ---
  useEffect(() => {
    // 1. Log visit
    logAppVisit(user?.uid);
    
    // 2. Refresh user profile (check activation status) from Cloud
    if (user && user.role !== 'GUEST') {
        refreshUserProfile();
    }
  }, [user?.uid]);

  // --- Statistics Calculation Logic ---
  const stats: DashboardStats = useMemo(() => {
    const totalGuests = guests.length;
    const weightedGuestCount = guests.reduce((acc, guest) => {
      const totalPeople = 1 + guest.childrenCount;
      const prob = guest.probability / 100;
      return acc + (totalPeople * prob);
    }, 0);
    const totalChildren = guests.reduce((acc, g) => acc + g.childrenCount, 0);
    const confirmedGuests = guests.filter(g => g.probability === AttendanceProbability.CONFIRMED).length;
    const expectedGiftMoney = guests.reduce((acc, guest) => acc + (guest.redEnvelope * (guest.probability / 100)), 0);
    const totalBudget = budgetItems.reduce((acc, item) => acc + item.estimatedCost, 0);
    const totalActual = budgetItems.reduce((acc, item) => acc + item.actualCost, 0);
    const pendingTasks = budgetItems.filter(item => item.status !== TaskStatus.DONE && item.status !== TaskStatus.PAID).length;

    return { totalGuests, weightedGuestCount, totalChildren, confirmedGuests, totalBudget, totalActual, expectedGiftMoney, pendingTasks };
  }, [guests, budgetItems]);

  // Handle Login Success from Modal
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    setActiveTab('dashboard');
  };

  if (!user) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  // Define Restricted Access Logic: Guest OR Inactive User
  const isRestricted = user.role === 'GUEST' || (user.role === 'USER' && !user.isActive);

  return (
    <div className="flex h-screen bg-[#FDF2F8] overflow-hidden transition-colors dark:bg-gray-900 font-sans relative">
      
      {/* Toast Notifications */}
      <Notifications />

      {/* Login Modal */}
      {showLoginModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <LoginPage onLoginSuccess={handleLoginSuccess} onClose={() => setShowLoginModal(false)} />
         </div>
      )}

      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        stats={stats}
        onLoginClick={() => setShowLoginModal(true)}
      />

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-rose-100 flex items-center justify-between px-4 flex-shrink-0">
          <h1 className="font-bold text-gray-900">WedPlan AI</h1>
          <div className="flex items-center gap-2">
            {user.role === 'GUEST' && (
               <button 
                  onClick={() => setShowLoginModal(true)}
                  className="p-2 text-rose-600 bg-rose-50 rounded-lg text-xs font-bold animate-pulse"
               >
                  Đăng nhập
               </button>
            )}
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 rounded-lg hover:bg-gray-100">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Global Warning Banner for Inactive Users */}
        {user.role === 'USER' && !user.isActive && (
           <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-center text-xs md:text-sm font-bold text-amber-800 gap-2 flex-shrink-0 text-center z-10 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>Tài khoản chưa kích hoạt. Liên hệ Admin: 0343019101 hoặc danghoang.sqtt@gmail.com</span>
           </div>
        )}

        {/* Prominent Floating Login Button (Top Right) */}
        {user.role === 'GUEST' && (
            <div className="absolute top-5 right-5 z-[50]">
               <button 
                  onClick={() => setShowLoginModal(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white border-2 border-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-rose-500/40 transition-all flex items-center gap-2 hover:shadow-xl hover:scale-105 active:scale-95 animate-pulse"
               >
                  <LogIn className="w-5 h-5" /> Đăng nhập ngay
               </button>
            </div>
        )}

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-[#FDF2F8]">
           <div className="max-w-7xl mx-auto h-full flex flex-col">
              
              {activeTab === 'dashboard' && (
                <Dashboard 
                  stats={stats} 
                  user={user} 
                  isSyncing={isSyncing} 
                  setActiveTab={setActiveTab} 
                />
              )}

              {activeTab === 'process' && (
                <ProcessGuide />
              )}

              {activeTab === 'fengshui' && !isRestricted && (
                <div className="h-full flex-1 min-h-[600px] bg-white rounded-xl shadow-sm border border-rose-100 overflow-hidden">
                   <FengShuiConsultant />
                </div>
              )}

              {activeTab === 'fengshui' && isRestricted && (
                 <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-rose-100 p-8 text-center">
                    <ShieldAlert className="w-16 h-16 text-rose-300 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Tính năng giới hạn</h2>
                    <p className="text-gray-500 mb-6 max-w-md">
                      {user.role === 'GUEST' 
                        ? "Tính năng Phong Thủy AI chỉ dành cho thành viên chính thức. Vui lòng đăng nhập để sử dụng." 
                        : "Tài khoản của bạn chưa được kích hoạt. Vui lòng liên hệ Admin để mở khóa tính năng này."}
                    </p>
                    {user.role === 'GUEST' && (
                      <button 
                        onClick={() => setShowLoginModal(true)}
                        className="bg-rose-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-rose-700 transition-transform active:scale-95 animate-pulse"
                      >
                        Đăng nhập ngay
                      </button>
                    )}
                 </div>
              )}

              {activeTab === 'guests' && <GuestManager />}

              {activeTab === 'budget' && (
                <div className="flex-1 flex flex-col h-full min-h-[600px]">
                   <DetailedBudgetPlanner />
                </div>
              )}

              {activeTab === 'ai' && !isRestricted && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-rose-100">
                      <h3 className="font-bold text-gray-700 mb-2">Trạng thái AI</h3>
                      <div className={`p-3 rounded-lg text-sm ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                        {user.role === 'ADMIN'
                          ? "Bạn đang dùng Google Gemini (System Key)." 
                          : "Bạn đang dùng OpenAI (Personal Key)."}
                      </div>
                      {user.role === 'USER' && !user.allowCustomApiKey && (
                        <div className="mt-2 text-xs text-red-500 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3"/> Bạn chưa được cấp quyền nhập Key.
                        </div>
                      )}
                      {user.role === 'USER' && user.allowCustomApiKey && !settings.openaiApiKey && (
                        <div className="mt-2 text-xs text-red-500">
                          ⚠️ Chưa có API Key. Vui lòng vào Cài Đặt.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <AIAdvisor stats={stats} />
                  </div>
                </div>
              )}

              {activeTab === 'ai' && isRestricted && (
                  <div className="h-full flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-rose-100 p-8 text-center">
                    <ShieldAlert className="w-16 h-16 text-rose-300 mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Trợ Lý AI</h2>
                    <p className="text-gray-500 mb-6 max-w-md">
                       {user.role === 'GUEST' 
                        ? "Vui lòng đăng nhập để chat với Cố vấn Cưới hỏi thông minh." 
                        : "Tài khoản chưa kích hoạt không thể sử dụng AI. Vui lòng liên hệ Admin."}
                    </p>
                    {user.role === 'GUEST' && (
                      <button 
                        onClick={() => setShowLoginModal(true)}
                        className="bg-rose-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-rose-700 transition-transform active:scale-95 animate-pulse"
                      >
                        Đăng nhập ngay
                      </button>
                    )}
                 </div>
              )}

              {activeTab === 'admin' && user.role === 'ADMIN' && (
                <UserManagement />
              )}

              {activeTab === 'settings' && (
                 <SettingsPage />
              )}
           </div>
        </main>
      </div>
    </div>
  );
}

export default App;
