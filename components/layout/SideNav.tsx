
import React from 'react';
import {
  LayoutDashboard, Users, ListTodo, BookOpen, Compass,
  QrCode, TrendingUp, Settings, ShieldCheck, HeartHandshake,
  ChevronLeft, ChevronRight, LogOut
} from 'lucide-react';
import { useStore } from '../../store/useStore';

interface SideNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Tổng Quan', icon: LayoutDashboard, roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'plan', label: 'Kế Hoạch', icon: BookOpen, roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'budget', label: 'Ngân Sách', icon: ListTodo, roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'guests', label: 'Khách Mời', icon: Users, roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'local', label: 'Thị Trường', icon: TrendingUp, roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'fengshui', label: 'Phong Thủy', icon: Compass, roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'invitation', label: 'Thiệp Cưới', icon: QrCode, roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'admin', label: 'Quản Trị', icon: ShieldCheck, roles: ['ADMIN'] },
  { id: 'settings', label: 'Cài Đặt', icon: Settings, roles: ['ADMIN', 'USER', 'GUEST'] },
];

const SideNav: React.FC<SideNavProps> = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useStore();

  const effectiveRole = user && user.role === 'USER' && !user.isActive ? 'GUEST' : user?.role || 'GUEST';
  const visibleItems = NAV_ITEMS.filter(item => item.roles.includes(effectiveRole));

  return (
    <aside
      className={`
        hidden lg:flex flex-col h-screen bg-white border-r border-rose-100 flex-shrink-0
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo */}
      <div className={`h-14 flex items-center flex-shrink-0 border-b border-rose-100 ${isCollapsed ? 'justify-center px-2' : 'px-4 gap-2.5'}`}>
        <HeartHandshake className="w-7 h-7 text-rose-500 flex-shrink-0" />
        {!isCollapsed && (
          <span className="text-lg font-bold text-gray-900 tracking-tight whitespace-nowrap">
            WedPlan<span className="text-rose-500">AI</span>
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {visibleItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm
                ${isActive
                  ? 'bg-rose-50 text-rose-600 font-semibold shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 font-medium'}
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-rose-500' : ''}`} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom: User info + controls */}
      <div className="flex-shrink-0 border-t border-rose-100 p-2 space-y-1">
        {/* User info (expanded only) */}
        {user && !isCollapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-sm flex-shrink-0 overflow-hidden border border-rose-200">
              {user.photoURL
                ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                : <span>{user.displayName?.charAt(0)?.toUpperCase() || 'U'}</span>
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-800 truncate">{user.displayName}</p>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                user.role === 'USER' && !user.isActive ? 'bg-red-100 text-red-600' :
                user.role === 'USER' ? 'bg-blue-100 text-blue-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {user.role === 'USER' && !user.isActive ? 'Chưa kích hoạt' : user.role}
              </span>
            </div>
          </div>
        )}

        {/* Logout */}
        {user?.role !== 'GUEST' && (
          <button
            onClick={logout}
            title={isCollapsed ? 'Đăng xuất' : undefined}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors text-sm ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors text-sm ${isCollapsed ? 'justify-center' : ''}`}
        >
          {isCollapsed
            ? <ChevronRight className="w-4 h-4" />
            : <><ChevronLeft className="w-4 h-4" /><span>Thu gọn</span></>
          }
        </button>
      </div>
    </aside>
  );
};

export default SideNav;
