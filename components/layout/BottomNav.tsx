
import React, { useState } from 'react';
import {
  LayoutDashboard, BookOpen, ListTodo, Users,
  MoreHorizontal, TrendingUp, Compass, QrCode,
  Settings, ShieldCheck, X
} from 'lucide-react';
import { useStore } from '../../store/useStore';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const PRIMARY = [
  { id: 'home',   label: 'Tổng Quan', icon: LayoutDashboard },
  { id: 'plan',   label: 'Kế Hoạch',  icon: BookOpen },
  { id: 'budget', label: 'Ngân Sách', icon: ListTodo },
  { id: 'guests', label: 'Khách Mời', icon: Users },
];

const MORE_ITEMS = [
  { id: 'local',      label: 'Thị Trường', icon: TrendingUp, roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'fengshui',   label: 'Phong Thủy', icon: Compass,    roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'invitation', label: 'Thiệp Cưới', icon: QrCode,     roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'settings',   label: 'Cài Đặt',    icon: Settings,   roles: ['ADMIN', 'USER', 'GUEST'] },
  { id: 'admin',      label: 'Quản Trị',   icon: ShieldCheck, roles: ['ADMIN'] },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const [showMore, setShowMore] = useState(false);
  const { user } = useStore();

  const effectiveRole = user && user.role === 'USER' && !user.isActive ? 'GUEST' : user?.role || 'GUEST';
  const filteredMore = MORE_ITEMS.filter(item => item.roles.includes(effectiveRole));
  const isMoreActive = filteredMore.some(item => item.id === activeTab);

  const handleNav = (tabId: string) => {
    setActiveTab(tabId);
    setShowMore(false);
  };

  return (
    <>
      {/* Backdrop for "More" sheet */}
      {showMore && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* "More" bottom sheet */}
      <div
        className={`
          fixed left-0 right-0 bg-white rounded-t-2xl shadow-2xl border-t border-rose-100
          z-50 lg:hidden transition-transform duration-300 ease-out
          ${showMore ? 'translate-y-0' : 'translate-y-full'}
        `}
        style={{ bottom: '64px' }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <span className="font-bold text-gray-800 text-sm">Tính năng khác</span>
          <button
            onClick={() => setShowMore(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 p-4">
          {filteredMore.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-2xl transition-all touch-manipulation
                  ${isActive
                    ? 'bg-rose-50 text-rose-600'
                    : 'text-gray-500 hover:bg-gray-50 active:bg-gray-100'}
                `}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
        {/* iOS safe area */}
        <div className="h-2" />
      </div>

      {/* Bottom Nav Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-rose-100 z-30 safe-area-inset-bottom">
        <div className="flex h-16">
          {PRIMARY.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-0.5 transition-all touch-manipulation
                  ${isActive ? 'text-rose-600' : 'text-gray-400 hover:text-gray-600'}
                `}
              >
                <item.icon
                  className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`}
                />
                <span className="text-[9px] font-semibold">{item.label}</span>
              </button>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(prev => !prev)}
            className={`
              flex-1 flex flex-col items-center justify-center gap-0.5 transition-all touch-manipulation
              ${isMoreActive || showMore ? 'text-rose-600' : 'text-gray-400 hover:text-gray-600'}
            `}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[9px] font-semibold">Thêm</span>
          </button>
        </div>
        {/* iOS home indicator safe area */}
        <div className="h-safe-bottom bg-white" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </nav>
    </>
  );
};

export default BottomNav;
