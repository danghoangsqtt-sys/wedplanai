
import React, { useEffect } from 'react';
import {
  LayoutDashboard, Users, ListTodo, BookOpen, Compass,
  QrCode, TrendingUp, Settings, ShieldCheck, HeartHandshake,
  LogOut, X, Calendar, ChevronRight
} from 'lucide-react';
import { useStore } from '../../store/useStore';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Tổng Quan', icon: LayoutDashboard, emoji: '📊', roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'plan', label: 'Kế Hoạch', icon: BookOpen, emoji: '📋', roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'budget', label: 'Ngân Sách', icon: ListTodo, emoji: '💰', roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'guests', label: 'Khách Mời', icon: Users, emoji: '👥', roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'local', label: 'Thị Trường', icon: TrendingUp, emoji: '📈', roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'fengshui', label: 'Phong Thủy', icon: Compass, emoji: '🧭', roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'invitation', label: 'Thiệp Cưới', icon: QrCode, emoji: '💌', roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'admin', label: 'Quản Trị', icon: ShieldCheck, emoji: '🛡️', roles: ['ADMIN'] },
  { id: 'settings', label: 'Cài Đặt', icon: Settings, emoji: '⚙️', roles: ['ADMIN', 'USER', 'GUEST'] },
];

const MobileDrawer: React.FC<MobileDrawerProps> = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  const { user, logout } = useStore();

  const effectiveRole = user && user.role === 'USER' && !user.isActive ? 'GUEST' : user?.role || 'GUEST';
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(effectiveRole));

  // Lock body scroll when drawer open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleNav = (tabId: string) => {
    setActiveTab(tabId);
    onClose();
  };

  const weddingDate = user?.weddingDate || '';
  const daysUntil = weddingDate
    ? Math.ceil((new Date(weddingDate).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] lg:hidden
          transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 w-[280px] max-w-[85vw] bg-white z-[101] lg:hidden
          flex flex-col shadow-2xl
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-rose-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <HeartHandshake className="w-7 h-7 text-rose-500" />
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              WedPlan<span className="text-rose-500">AI</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wedding date banner */}
        {daysUntil !== null && daysUntil > 0 && (
          <div className="mx-3 mt-3 px-3 py-2.5 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-xl flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Ngày cưới</p>
              <p className="text-sm font-bold text-rose-600">
                Còn {daysUntil.toLocaleString('vi-VN')} ngày
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {visibleItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-sm
                  ${isActive
                    ? 'bg-rose-50 text-rose-600 font-semibold shadow-sm border border-rose-100'
                    : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100 font-medium'}
                `}
              >
                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-rose-500' : 'text-gray-400'}`} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-rose-300 flex-shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Bottom: User info + logout */}
        <div className="flex-shrink-0 border-t border-rose-100 p-3 space-y-2 bg-gray-50/50">
          {/* User info */}
          {user && user.role !== 'GUEST' && (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm flex-shrink-0 overflow-hidden border-2 border-rose-200 shadow-sm">
                {user.photoURL
                  ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  : <span className="text-base">{user.displayName?.charAt(0)?.toUpperCase() || 'U'}</span>
                }
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">{user.displayName}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          )}

          {/* Logout */}
          {user?.role !== 'GUEST' && (
            <button
              onClick={() => { logout(); onClose(); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default MobileDrawer;
