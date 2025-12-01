
import React from 'react';
import {
  LayoutDashboard,
  Users,
  MessageSquareText,
  HeartHandshake,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  X,
  Settings,
  LogOut,
  ShieldCheck,
  BookOpen,
  Compass,
  MailOpen
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { DashboardStats } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (v: boolean) => void;
  stats: DashboardStats;
  onLoginClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  stats,
  onLoginClick
}) => {
  const { user, logout } = useStore();

  const menuItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard, roles: ['ADMIN', 'USER', 'GUEST'] },
    { id: 'process', label: 'Quy Trình', icon: BookOpen, roles: ['ADMIN', 'USER', 'GUEST'] },
    { id: 'invitation', label: 'Thiệp Online', icon: MailOpen, roles: ['ADMIN', 'USER', 'GUEST'] },
    { id: 'fengshui', label: 'Phong Thủy', icon: Compass, roles: ['ADMIN', 'USER', 'GUEST'] },
    { id: 'budget', label: 'Ngân Sách', icon: ListTodo, roles: ['ADMIN', 'USER', 'GUEST'] },
    { id: 'guests', label: 'Khách Mời', icon: Users, roles: ['ADMIN', 'USER', 'GUEST'] },
    { id: 'ai', label: 'Cố Vấn AI', icon: MessageSquareText, roles: ['ADMIN', 'USER', 'GUEST'] },
    { id: 'admin', label: 'Quản Trị', icon: ShieldCheck, roles: ['ADMIN'] },
    { id: 'settings', label: 'Cài Đặt', icon: Settings, roles: ['ADMIN', 'USER', 'GUEST'] },
  ];

  // Logic: Nếu User chưa kích hoạt (!isActive), coi như Guest để filter menu
  const effectiveRole = user && (user.role === 'USER' && !user.isActive) ? 'GUEST' : user?.role || 'GUEST';

  const filteredItems = menuItems.filter(item =>
    user && item.roles.includes(effectiveRole)
  );

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar Container */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-rose-100 shadow-2xl lg:shadow-none 
          transition-transform duration-300 ease-out z-[100] lg:z-auto lg:relative flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-[280px] lg:w-auto
        `}
      >
        {/* Logo Area & Toggle Button */}
        <div className={`h-16 flex items-center border-b border-rose-100 ${isCollapsed ? 'justify-center' : 'justify-between pl-6 pr-3'}`}>
          {/* Logo Content */}
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-7 h-7 text-rose-500" />
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">WedPlan<span className="text-rose-500">AI</span></h1>
            </div>
          ) : (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              title="Mở rộng"
            >
              <HeartHandshake className="w-8 h-8" />
            </button>
          )}

          {/* Desktop Toggle Button (Visible when expanded) */}
          {!isCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              title="Thu gọn"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Mobile Close Button */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* User Info (Mini) */}
        {user && (
          <div className={`px-6 py-4 border-b border-rose-50 bg-rose-50/30 flex items-center gap-3 ${isCollapsed ? 'hidden lg:flex lg:justify-center lg:px-2' : ''}`}>
            <div className={`w-10 h-10 rounded-full border border-rose-100 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold shadow-sm ${user.role === 'GUEST' ? 'bg-gray-100 text-gray-400' : 'bg-white text-rose-500'}`}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : (
                user.displayName?.charAt(0) || 'G'
              )}
            </div>
            {(!isCollapsed || window.innerWidth < 1024) && (
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 font-medium">Xin chào,</p>
                <p className="text-sm font-bold text-gray-800 truncate">{user.displayName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'USER'
                        ? (!user.isActive ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700')
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                    {user.role === 'USER' && !user.isActive ? 'Chưa kích hoạt' : user.role}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-4 flex flex-col gap-1 px-3 overflow-y-auto overscroll-contain">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsMobileMenuOpen(false);
              }}
              className={`
                flex items-center gap-3 px-3 py-3.5 lg:py-3 rounded-xl transition-all touch-manipulation
                ${activeTab === item.id
                  ? 'bg-rose-50 text-rose-600 font-bold shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
                }
                ${isCollapsed ? 'lg:justify-center' : ''}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${activeTab === item.id ? 'text-rose-500' : ''}`} />
              {(!isCollapsed || window.innerWidth < 1024) && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer Actions */}
        {user?.role !== 'GUEST' && (
          <div className="p-4 border-t border-rose-100 bg-rose-50/30 space-y-2 pb-safe-area">
            <button
              onClick={logout}
              className={`flex items-center gap-2 w-full text-gray-500 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-lg transition-colors ${isCollapsed ? 'lg:justify-center' : 'px-4'}`}
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {(!isCollapsed || window.innerWidth < 1024) && <span className="text-sm font-medium">Đăng xuất</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
