
import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { AttendanceProbability, DashboardStats, TaskStatus } from './types';
import LoginPage from './components/auth/LoginPage';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/Dashboard';
import Notifications from './components/ui/Notifications';
import { useStore } from './store/useStore';
import { Menu, LogIn, AlertTriangle, Loader2 } from 'lucide-react';
import { logAppVisit, getUserPublicProfile, syncUserProfile } from './services/cloudService';
import { account } from './lib/appwrite';
import { UserProfile } from './types';

// --- Lazy-loaded components for code splitting ---
const GuestManager = lazy(() => import('./components/GuestManager'));
const AIAdvisor = lazy(() => import('./components/AIAdvisor'));
const DetailedBudgetPlanner = lazy(() => import('./components/DetailedBudgetPlanner'));
const UserManagement = lazy(() => import('./components/admin/UserManagement'));
const ProcessGuide = lazy(() => import('./components/ProcessGuide'));
const FengShuiConsultant = lazy(() => import('./components/fengshui/FengShuiConsultant'));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(mod => ({ default: mod.default })));
const InvitationManager = lazy(() => import('./components/invitation/InvitationManager'));
const PublicInvitationView = lazy(() => import('./components/invitation/PublicInvitationView'));

// --- Loading Fallback ---
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-3 text-gray-400">
      <Loader2 className="w-8 h-8 animate-spin text-rose-400" />
      <span className="text-sm">Đang tải...</span>
    </div>
  </div>
);

// --- Error Boundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 max-w-md text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="font-bold text-gray-800 mb-2">Đã xảy ra lỗi</h3>
              <p className="text-sm text-gray-500 mb-4">
                {this.state.error?.message || 'Một lỗi không mong muốn đã xảy ra.'}
              </p>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="px-4 py-2 bg-rose-500 text-white text-sm rounded-lg hover:bg-rose-600 transition-colors"
              >
                Thử lại
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export type SettingsTab = 'ACCOUNT' | 'DATA' | 'SYSTEM' | 'ABOUT';

function App() {
  const { user, settings, guests, budgetItems, isSyncing, refreshUserProfile, addNotification, login, logout } = useStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'process' | 'fengshui' | 'guests' | 'budget' | 'ai' | 'admin' | 'settings' | 'invitation'>('dashboard');

  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<SettingsTab>('ACCOUNT');

  // Public View State
  const [isPublicView, setIsPublicView] = useState(false);

  // --- Appwrite Session Check (runs on mount + after OAuth redirect) ---
  useEffect(() => {
    const initSession = async () => {
      try {
        const appwriteUser = await account.get();
        if (user?.role === 'GUEST') {
          // New session detected (e.g. just came back from Google OAuth redirect)
          const isAdminEmail = appwriteUser.email === 'danghoang.sqtt@gmail.com';
          let profile = await getUserPublicProfile(appwriteUser.$id);
          if (profile) {
            // Existing user: merge latest Google display info
            profile = {
              ...profile,
              email: appwriteUser.email,
              displayName: appwriteUser.name || profile.displayName,
              role: isAdminEmail ? 'ADMIN' : profile.role,
              isActive: isAdminEmail ? true : profile.isActive,
              allowCustomApiKey: isAdminEmail ? true : profile.allowCustomApiKey,
            };
            await syncUserProfile(profile);
          } else {
            // Brand new user
            profile = {
              uid: appwriteUser.$id,
              email: appwriteUser.email,
              displayName: appwriteUser.name || appwriteUser.email?.split('@')[0] || 'Người dùng',
              photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(appwriteUser.name || '')}&background=e11d48&color=fff&size=128`,
              role: isAdminEmail ? 'ADMIN' : 'USER',
              isActive: isAdminEmail,
              enableCloudStorage: true,
              allowCustomApiKey: isAdminEmail,
              joinedAt: new Date().toISOString(),
            } as UserProfile;
          }
          await login(profile);
          if (isAdminEmail) {
            addNotification('SUCCESS', `Chào mừng Admin ${profile.displayName} quay trở lại!`);
          } else if (!profile.isActive) {
            addNotification('WARNING', 'Tài khoản chưa kích hoạt. Liên hệ Admin: 0343019101 hoặc danghoang.sqtt@gmail.com', 10000);
          } else {
            addNotification('SUCCESS', `Đăng nhập thành công! Xin chào ${profile.displayName}`);
          }
        }
      } catch {
        // No valid Appwrite session — if store still shows a real user, clear it
        if (user && user.role !== 'GUEST') {
          logout();
        }
      }
    };
    initSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Check for Public URL Params ---
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'invitation' && params.get('uid')) {
      setIsPublicView(true);
    }
    if (params.get('auth_error') === '1') {
      addNotification('ERROR', 'Đăng nhập Google thất bại. Vui lòng thử lại.', 6000);
    }
  }, []);

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
    if (!isPublicView) {
      // 1. Log visit
      logAppVisit(user?.uid);

      // 2. Refresh user profile (check activation status) from Cloud
      if (user && user.role !== 'GUEST') {
        refreshUserProfile();
      }
    }
  }, [user?.uid, isPublicView]);

  // --- Redirect Logic: Active User without Gemini Key ---
  useEffect(() => {
    if (user?.role === 'USER' && user.isActive && user.allowCustomApiKey && !settings.geminiApiKey) {
      if (activeTab === 'ai') {
        setSettingsDefaultTab('SYSTEM');
        setActiveTab('settings');
        addNotification('WARNING', 'Vui lòng cấu hình Gemini API Key để tiếp tục sử dụng AI.', 5000);
      }
    }
  }, [activeTab, user, settings.geminiApiKey]);

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

  // --- RENDER: PUBLIC VIEW ---
  if (isPublicView) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <PublicInvitationView />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // --- RENDER: APP VIEW ---
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
        <header className="lg:hidden h-16 bg-white border-b border-rose-100 flex items-center justify-between px-4 flex-shrink-0 z-40 relative">
          <h1 className="font-bold text-gray-900 text-lg">WedPlan AI</h1>
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

        {/* Prominent Floating Login Button (Top Right) - Hidden on Mobile */}
        {user.role === 'GUEST' && (
          <div className="hidden lg:block absolute top-5 right-5 z-[50]">
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white border-2 border-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-rose-500/40 transition-all flex items-center gap-2 hover:shadow-xl hover:scale-105 active:scale-95 animate-pulse"
            >
              <LogIn className="w-5 h-5" /> <span>Đăng nhập ngay</span>
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden ${activeTab === 'invitation' ? 'p-0' : 'p-3 md:p-6 lg:p-8'} bg-[#FDF2F8]`}>
          <div className={`h-full flex flex-col ${activeTab === 'invitation' ? 'w-full' : 'max-w-7xl mx-auto'}`}>

            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
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

                {activeTab === 'fengshui' && (
                  <div className="h-full flex-1 min-h-[500px] lg:min-h-[600px] bg-white rounded-xl shadow-sm border border-rose-100 overflow-hidden">
                    <FengShuiConsultant isRestricted={isRestricted} />
                  </div>
                )}

                {activeTab === 'invitation' && (
                  <div className="h-full flex-1 min-h-[600px] bg-white lg:rounded-xl shadow-sm border border-rose-100 overflow-hidden">
                    <InvitationManager />
                  </div>
                )}

                {activeTab === 'guests' && <GuestManager />}

                {activeTab === 'budget' && (
                  <div className="flex-1 flex flex-col h-full min-h-[500px] lg:min-h-[600px] overflow-hidden rounded-xl border border-gray-200">
                    <DetailedBudgetPlanner />
                  </div>
                )}

                {activeTab === 'ai' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-6">
                    <div className="lg:col-span-1 space-y-4">
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-rose-100">
                        <h3 className="font-bold text-gray-700 mb-2">Trạng thái AI</h3>
                        <div className={`p-3 rounded-lg text-sm ${isRestricted
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : user.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                          {isRestricted
                            ? "Đang dùng thử miễn phí"
                            : user.role === 'ADMIN'
                              ? "Bạn đang dùng Google Gemini (System Key)."
                              : "Bạn đang dùng Google Gemini (Personal Key)."
                          }
                        </div>
                      </div>
                    </div>
                    <div className="lg:col-span-2">
                      <AIAdvisor stats={stats} isRestricted={isRestricted} />
                    </div>
                  </div>
                )}

                {activeTab === 'admin' && user.role === 'ADMIN' && (
                  <UserManagement />
                )}

                {activeTab === 'settings' && (
                  <SettingsPage defaultTab={settingsDefaultTab} />
                )}
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
