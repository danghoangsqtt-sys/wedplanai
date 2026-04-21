
import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { AttendanceProbability, DashboardStats, TaskStatus } from './types';
import LoginPage from './components/auth/LoginPage';
import SideNav from './components/layout/SideNav';
import TopBar from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';
import MobileDrawer from './components/layout/MobileDrawer';
import CommandCenter from './components/CommandCenter';
import AIFloatingChat from './components/AIFloatingChat';
import WelcomeOnboarding from './components/WelcomeOnboarding';
import Notifications from './components/ui/Notifications';
import { useStore } from './store/useStore';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { logAppVisit, getUserPublicProfile, syncUserProfile } from './services/cloudService';
import { account } from './lib/appwrite';
import { UserProfile } from './types';

// --- Helper to handle lazy loading chunk errors (Vite cached index.html issue) ---
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );
    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
      }
      throw error;
    }
  });

// --- Lazy-loaded components for code splitting ---
const GuestManager = lazyWithRetry(() => import('./components/GuestManager'));
const DetailedBudgetPlanner = lazyWithRetry(() => import('./components/DetailedBudgetPlanner'));
const UserManagement = lazyWithRetry(() => import('./components/admin/UserManagement'));
const ProcessGuide = lazyWithRetry(() => import('./components/ProcessGuide'));
const FengShuiConsultant = lazyWithRetry(() => import('./components/fengshui/FengShuiConsultant'));
const SettingsPage = lazyWithRetry(() => import('./components/SettingsPage').then(mod => ({ default: mod.default })));
const InvitationManager = lazyWithRetry(() => import('./components/invitation/InvitationManager'));
const PublicInvitationView = lazyWithRetry(() => import('./components/invitation/PublicInvitationView'));
const LocalMarketInsights = lazyWithRetry(() => import('./components/LocalMarketInsights'));

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
  const { user, settings, guests, budgetItems, refreshUserProfile, addNotification, login, logout } = useStore();
  const [activeTab, setActiveTab] = useState<'home' | 'plan' | 'budget' | 'guests' | 'local' | 'fengshui' | 'invitation' | 'settings' | 'admin'>('home');

  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
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

  // Notify active users without Gemini key once on load
  useEffect(() => {
    if (user?.role === 'USER' && user.isActive && user.allowCustomApiKey && !settings.geminiApiKey) {
      setSettingsDefaultTab('SYSTEM');
      addNotification('WARNING', 'Vui lòng cấu hình Gemini API Key để sử dụng Cố Vấn AI.', 5000);
    }
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setActiveTab('home');
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

  const isRestricted = user.role === 'GUEST' || (user.role === 'USER' && !user.isActive);

  return (
    <div className="flex h-screen bg-[#FDF2F8] overflow-hidden transition-colors dark:bg-gray-900 font-sans">

      {/* Toast Notifications */}
      <Notifications />

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <LoginPage onLoginSuccess={handleLoginSuccess} onClose={() => setShowLoginModal(false)} />
        </div>
      )}

      {/* Desktop Sidebar */}
      <SideNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      {/* Main area: TopBar + Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">

        {/* Top Bar (all screen sizes) */}
        <TopBar
          activeTab={activeTab}
          stats={stats}
          onLoginClick={() => setShowLoginModal(true)}
          setActiveTab={setActiveTab}
          onMenuClick={() => setIsMobileDrawerOpen(true)}
        />

        {/* Inactive user warning banner */}
        {user.role === 'USER' && !user.isActive && (
          <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-center text-xs font-bold text-amber-800 gap-2 flex-shrink-0 text-center z-10">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Tài khoản chưa kích hoạt. Liên hệ Admin: 0343019101 hoặc danghoang.sqtt@gmail.com</span>
          </div>
        )}

        {/* Scrollable page content */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden ${activeTab === 'invitation' ? 'p-0' : 'p-3 md:p-5 lg:p-6'} pb-20 lg:pb-6 bg-[#FDF2F8]`}>
          <div className={`${activeTab === 'invitation' ? 'h-full w-full' : 'max-w-7xl mx-auto'}`}>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>

                {activeTab === 'home' && (
                  <CommandCenter stats={stats} setActiveTab={setActiveTab} />
                )}

                {activeTab === 'plan' && (
                  <ProcessGuide />
                )}

                {activeTab === 'fengshui' && (
                  <div className="min-h-[500px] lg:min-h-[600px] bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
                    <FengShuiConsultant isRestricted={isRestricted} />
                  </div>
                )}

                {activeTab === 'invitation' && (
                  <div className="h-full min-h-[600px] bg-white lg:rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
                    <InvitationManager />
                  </div>
                )}

                {activeTab === 'guests' && <GuestManager />}

                {activeTab === 'budget' && (
                  <div className="flex flex-col min-h-[500px] lg:min-h-[600px] overflow-hidden rounded-2xl border border-gray-200">
                    <DetailedBudgetPlanner />
                  </div>
                )}

                {activeTab === 'local' && (
                  <LocalMarketInsights onNavigateBudget={() => setActiveTab('budget')} />
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

      {/* Mobile Sidebar Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Mobile / Tablet Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* First-time onboarding popup */}
      <WelcomeOnboarding onDone={(goToSettings?: boolean) => {
        if (goToSettings) {
          setSettingsDefaultTab('ACCOUNT');
          setActiveTab('settings');
        }
      }} />

      {/* Floating AI Chat (all screens, bottom-right) */}
      <AIFloatingChat stats={stats} isRestricted={isRestricted} />
    </div>
  );
}

export default App;
