
import React from 'react';
import { Calendar, Users, Heart, LogIn } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { DashboardStats } from '../../types';

interface TopBarProps {
  activeTab: string;
  stats: DashboardStats;
  onLoginClick: () => void;
  setActiveTab: (tab: string) => void;
}

const PAGE_LABELS: Record<string, string> = {
  home: 'Tổng Quan',
  plan: 'Kế Hoạch',
  budget: 'Ngân Sách',
  guests: 'Khách Mời',
  local: 'Thị Trường',
  fengshui: 'Phong Thủy',
  invitation: 'Thiệp Cưới',
  settings: 'Cài Đặt',
  admin: 'Quản Trị',
};

interface StageInfo {
  label: string;
  colorClass: string;
}

function getStage(daysUntil: number): StageInfo {
  if (daysUntil > 365) return { label: 'Lên kế hoạch', colorClass: 'bg-blue-100 text-blue-700' };
  if (daysUntil > 180) return { label: 'Chuẩn bị sớm', colorClass: 'bg-indigo-100 text-indigo-700' };
  if (daysUntil > 90)  return { label: 'Chuẩn bị chính', colorClass: 'bg-violet-100 text-violet-700' };
  if (daysUntil > 30)  return { label: 'Giai đoạn nước rút', colorClass: 'bg-amber-100 text-amber-700' };
  if (daysUntil > 7)   return { label: 'Hoàn thiện', colorClass: 'bg-orange-100 text-orange-700' };
  if (daysUntil > 0)   return { label: '🎉 Tuần cưới!', colorClass: 'bg-rose-100 text-rose-700 animate-pulse' };
  return { label: 'Sau đám cưới', colorClass: 'bg-emerald-100 text-emerald-700' };
}

const TopBar: React.FC<TopBarProps> = ({ activeTab, stats, onLoginClick, setActiveTab }) => {
  const { user, sharedPlan } = useStore();

  const weddingDate = user?.weddingDate || '';
  const daysUntil = weddingDate
    ? Math.ceil((new Date(weddingDate).getTime() - Date.now()) / 86_400_000)
    : null;
  const stage = daysUntil !== null ? getStage(daysUntil) : null;

  const budgetPct = stats.totalBudget > 0
    ? Math.round((stats.totalActual / stats.totalBudget) * 100)
    : 0;

  return (
    <header className="h-14 bg-white border-b border-rose-100 flex items-center px-4 flex-shrink-0 z-30 gap-3 shadow-sm">

      {/* Mobile / Tablet: Logo */}
      <div className="lg:hidden flex items-center gap-2">
        <Heart className="w-5 h-5 text-rose-500" />
        <span className="font-bold text-gray-900 text-base">
          WedPlan<span className="text-rose-500">AI</span>
        </span>
      </div>

      {/* Mobile: Current page label */}
      {activeTab !== 'home' && (
        <span className="lg:hidden text-sm text-gray-400 font-medium">
          · {PAGE_LABELS[activeTab] || ''}
        </span>
      )}

      {/* Desktop: Stage badge */}
      {stage && (
        <div className="hidden lg:flex items-center gap-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${stage.colorClass}`}>
            {stage.label}
          </span>
          {daysUntil !== null && daysUntil > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-rose-400" />
              <span className="font-bold text-rose-600">{daysUntil.toLocaleString('vi-VN')}</span>
              <span>ngày nữa</span>
            </div>
          )}
          {daysUntil === 0 && (
            <span className="text-sm font-bold text-rose-600 animate-pulse">Hôm nay là ngày cưới! 🎊</span>
          )}
        </div>
      )}

      {/* Desktop: No date set prompt */}
      {!stage && (
        <div className="hidden lg:flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          <span>Chưa đặt ngày cưới —</span>
          <button
            onClick={() => setActiveTab('settings')}
            className="text-rose-500 hover:text-rose-600 hover:underline text-xs font-semibold transition-colors"
          >
            Thiết lập ngay
          </button>
        </div>
      )}

      <div className="flex-1" />

      {/* Desktop: Budget quick indicator */}
      {stats.totalBudget > 0 && (
        <div className="hidden xl:flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${budgetPct > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(budgetPct, 100)}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium">{budgetPct}% NS</span>
        </div>
      )}

      {/* Desktop: Team indicator */}
      {sharedPlan?.status === 'active' && (
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-full">
          <Users className="w-3.5 h-3.5" />
          <span className="font-semibold">Đội nhóm hoạt động</span>
        </div>
      )}

      {/* Guest count quick stat */}
      {stats.totalGuests > 0 && (
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1.5 rounded-full">
          <Users className="w-3.5 h-3.5 text-rose-400" />
          <span className="font-medium">{stats.totalGuests} khách</span>
        </div>
      )}

      {/* Profile / Login */}
      {user?.role === 'GUEST' ? (
        <button
          onClick={onLoginClick}
          className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Đăng nhập</span>
        </button>
      ) : (
        <button
          onClick={() => setActiveTab('settings')}
          className="w-8 h-8 rounded-full bg-rose-100 overflow-hidden flex items-center justify-center text-rose-600 font-bold text-sm hover:ring-2 hover:ring-rose-300 transition-all flex-shrink-0"
          title={user?.displayName || ''}
        >
          {user?.photoURL
            ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            : <span>{user?.displayName?.charAt(0)?.toUpperCase() || 'U'}</span>
          }
        </button>
      )}
    </header>
  );
};

export default TopBar;
