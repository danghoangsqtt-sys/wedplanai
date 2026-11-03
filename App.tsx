import { getBudgetPaymentSummary } from './lib/budgetPayments';
import { useBudgetDate } from './hooks/useBudgetDate';

import React, { useState, useMemo, useEffect, Suspense, lazy } from 'react';
import { AttendanceProbability, DashboardStats, TaskStatus } from './types';
import SideNav from './components/layout/SideNav';
import TopBar from './components/layout/TopBar';
import BottomNav from './components/layout/BottomNav';
import MobileDrawer from './components/layout/MobileDrawer';
import CommandCenter from './components/CommandCenter';
import AIFloatingChat from './components/AIFloatingChat';
import WelcomeOnboarding from './components/WelcomeOnboarding';
import Notifications from './components/ui/Notifications';
import { useStore } from './store/useStore';
import PasswordGate from './components/PasswordGate';
import { OWNER_UID } from './lib/constants';
import { guestAdults, guestPartySize } from './lib/guestStats';
import { isSupabaseConfigured } from './lib/supabase';
import { logAppVisit } from './services/cloudService';
import { AlertTriangle, Loader2 } from 'lucide-react';

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
const ProcessGuide = lazyWithRetry(() => import('./components/ProcessGuide'));
const FengShuiConsultant = lazyWithRetry(() => import('./components/fengshui/FengShuiConsultant'));
const SettingsPage = lazyWithRetry(() => import('./components/SettingsPage').then(mod => ({ default: mod.default })));
const InvitationEditorPage = lazyWithRetry(() => import('./components/invitation/editor/InvitationEditorPage'));
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
type EBProps = { children: React.ReactNode; fallback?: React.ReactNode };
type EBState = { hasError: boolean; error?: Error };

class ErrorBoundary extends React.Component<EBProps, EBState> {
  declare props: Readonly<EBProps>;
  declare state: EBState;
  declare setState: React.Component<EBProps, EBState>['setState'];

  constructor(props: EBProps) {
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
  const { settings, guests, budgetItems, loadFromCloud } = useStore();
  const [activeTab, setActiveTab] = useState<'home' | 'plan' | 'budget' | 'guests' | 'local' | 'fengshui' | 'invitation' | 'settings'>('home');

  // UI State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [settingsDefaultTab, setSettingsDefaultTab] = useState<SettingsTab>('ACCOUNT');

  // Public View State — read synchronously so PasswordGate NEVER renders for guest links
  // (useEffect runs after first render, causing PIN gate flash on invitation URLs)
  const [isPublicView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const isQueryView = params.get('view') === 'invitation' && !!params.get('uid');
    // Short URL: /thiep → show owner's invitation without UID in URL
    const isShortUrl = window.location.pathname === '/thiep';
    if (isShortUrl && !params.get('uid')) {
      // Inject OWNER_UID into URL without page reload (history API)
      const newUrl = `/?view=invitation&uid=${OWNER_UID}`;
      window.history.replaceState(null, '', newUrl);
    }
    return isQueryView || isShortUrl;
  });

  // --- Apply Theme Effect ---
  useEffect(() => {
    if (settings.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.themeMode]);

  // BUG-016 fix: log app visit for analytics (once per day, per session)
  useEffect(() => {
    if (!isPublicView && isSupabaseConfigured) {
      logAppVisit(OWNER_UID);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Statistics Calculation Logic ---
  const invitation = useStore(state => state.invitation);
  const budgetToday = useBudgetDate();
  const stats: DashboardStats = useMemo(() => {
    const budgetPayments = getBudgetPaymentSummary(budgetItems, invitation.date, budgetToday);
    const totalGuests = guests.reduce((sum,g)=>sum+guestAdults(g),0);
    const weightedGuestCount = guests.reduce((acc, guest) => {
      const totalPeople = guestPartySize(guest);
      const prob = guest.probability / 100;
      return acc + (totalPeople * prob);
    }, 0);
    const totalChildren = guests.reduce((acc, g) => acc + g.childrenCount, 0);
    const confirmedGuests = guests.filter(g => g.probability === AttendanceProbability.CONFIRMED).reduce((sum,g)=>sum+guestAdults(g),0);
    const expectedGiftMoney = guests.reduce((acc, guest) => acc + (guest.redEnvelope * (guest.probability / 100)), 0);
    const totalBudget = budgetItems.reduce((acc, item) => acc + item.estimatedCost, 0);
    const totalActual = budgetPayments.paid;
    const pendingTasks = budgetItems.filter(item => item.status !== TaskStatus.DONE && item.status !== TaskStatus.PAID).length;

    return { totalGuests, weightedGuestCount, totalChildren, confirmedGuests, totalBudget, totalActual, expectedGiftMoney, pendingTasks, budgetPayments };
  }, [guests, budgetItems, invitation.date, budgetToday]);



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

  // BUG-015 note: isRestricted reserved for future feature-gating logic
  const isRestricted = false;

  return (
    <PasswordGate onUnlock={loadFromCloud}>
    <div className="flex h-screen bg-[#FDF2F8] overflow-hidden transition-colors dark:bg-gray-900 font-sans">

      {/* Toast Notifications */}
      <Notifications />



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
          onLoginClick={() => {}}
          setActiveTab={setActiveTab}
          onMenuClick={() => setIsMobileDrawerOpen(true)}
        />

        {/* Inactive user warning banner */}
        {/* TEMP: Hidden inactive warning for anonymous access mode */}

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
                    <InvitationEditorPage onBack={()=>setActiveTab('home')} />
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
    </PasswordGate>
  );
}

export default App;
