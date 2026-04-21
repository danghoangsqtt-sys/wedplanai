
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  Users, Copy, Check, Link2, Loader2, X, RefreshCw,
  UserPlus, Shield, Clock, Unlink, Heart
} from 'lucide-react';

const SharedPlanSection: React.FC = () => {
  const {
    user, sharedPlan, isSharedPlanOwner,
    createShareInviteAction, joinPlanAction,
    leavePlanAction, revokePlanAction, pollSharedData,
    addNotification
  } = useStore();

  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [showConfirmRevoke, setShowConfirmRevoke] = useState(false);
  const [showConfirmLeave, setShowConfirmLeave] = useState(false);

  if (!user || user.role === 'GUEST') return null;

  const handleCreate = async () => {
    setIsCreating(true);
    await createShareInviteAction();
    setIsCreating(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      addNotification('WARNING', 'Vui lòng nhập mã mời.');
      return;
    }
    setIsJoining(true);
    await joinPlanAction(joinCode.trim());
    setIsJoining(false);
    setJoinCode('');
    setShowJoinInput(false);
  };

  const handleCopy = () => {
    if (sharedPlan?.shareCode) {
      navigator.clipboard.writeText(sharedPlan.shareCode);
      setCopied(true);
      addNotification('SUCCESS', 'Đã copy mã mời!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await pollSharedData();
    addNotification('SUCCESS', 'Đã đồng bộ dữ liệu mới nhất!');
    setIsSyncing(false);
  };

  const handleRevoke = async () => {
    await revokePlanAction();
    setShowConfirmRevoke(false);
  };

  const handleLeave = async () => {
    await leavePlanAction();
    setShowConfirmLeave(false);
  };

  // --- STATE 3: Active shared plan ---
  if (sharedPlan?.status === 'active') {
    return (
      <section className="space-y-4 pt-4">
        <h4 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
          Kế hoạch chung
        </h4>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 p-4 pointer-events-none">
            <Heart className="w-20 h-20 text-emerald-600" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-emerald-500 text-white p-2 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-900 text-base">Kế hoạch chung — Đang hoạt động</h3>
                <p className="text-xs text-emerald-600">Cả 2 đang cùng chỉnh sửa chung dữ liệu</p>
              </div>
              <div className="ml-auto">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  <Check className="w-3 h-3" /> Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-3 bg-white/70 rounded-xl p-3 border border-emerald-100">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-sm font-bold flex-shrink-0">
                  {sharedPlan.ownerName?.charAt(0) || '👰'}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Chủ kế hoạch</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{sharedPlan.ownerName || sharedPlan.ownerEmail}</p>
                  {isSharedPlanOwner && <span className="text-[10px] text-emerald-600 font-semibold">(Bạn)</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/70 rounded-xl p-3 border border-emerald-100">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold flex-shrink-0">
                  {sharedPlan.partnerEmail?.charAt(0) || '🤵'}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Đối tác</p>
                  <p className="text-sm font-bold text-gray-800 truncate">{sharedPlan.partnerEmail}</p>
                  {!isSharedPlanOwner && <span className="text-[10px] text-blue-600 font-semibold">(Bạn)</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-100/50 rounded-lg px-3 py-2 mb-4">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Đồng bộ tự động mỗi 30 giây</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleSync}
                disabled={isSyncing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-emerald-200 text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors text-sm disabled:opacity-50"
              >
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Đồng bộ ngay
              </button>

              {!showConfirmRevoke && !showConfirmLeave ? (
                <button
                  type="button"
                  onClick={() => isSharedPlanOwner ? setShowConfirmRevoke(true) : setShowConfirmLeave(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors text-sm"
                >
                  <Unlink className="w-4 h-4" />
                  {isSharedPlanOwner ? 'Hủy chia sẻ' : 'Rời kế hoạch'}
                </button>
              ) : (
                <div className="flex-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowConfirmRevoke(false); setShowConfirmLeave(false); }}
                    className="flex-1 px-3 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={isSharedPlanOwner ? handleRevoke : handleLeave}
                    className="flex-1 px-3 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 text-sm"
                  >
                    Xác nhận
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // --- STATE 2: Pending invite (owner created code, waiting for partner) ---
  if (sharedPlan?.status === 'pending' && isSharedPlanOwner) {
    return (
      <section className="space-y-4 pt-4">
        <h4 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
          Kế hoạch chung
        </h4>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-amber-500 text-white p-2 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-base">Đang chờ đối tác tham gia</h3>
              <p className="text-xs text-amber-600">Gửi mã bên dưới cho bạn đời</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border-2 border-dashed border-amber-300 p-4 mb-4 text-center">
            <p className="text-xs text-gray-500 mb-2">Mã mời</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-black text-amber-700 tracking-[0.2em] font-mono">{sharedPlan.shareCode}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                title="Copy mã"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-amber-700 mb-4 text-center">
            Bạn đời mở WedPlan AI → Cài đặt → Nhập mã tham gia này
          </p>

          {!showConfirmRevoke ? (
            <button
              type="button"
              onClick={() => setShowConfirmRevoke(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors text-sm"
            >
              <X className="w-4 h-4" /> Hủy lời mời
            </button>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowConfirmRevoke(false)}
                className="flex-1 px-3 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 text-sm">
                Giữ lại
              </button>
              <button type="button" onClick={handleRevoke}
                className="flex-1 px-3 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 text-sm">
                Xác nhận hủy
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // --- STATE 1: No shared plan ---
  return (
    <section className="space-y-4 pt-4">
      <h4 className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
        Kế hoạch chung
      </h4>
      <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 rounded-2xl border border-violet-200 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 p-4 pointer-events-none">
          <Users className="w-24 h-24 text-violet-600" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-violet-500 text-white p-2 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-violet-900 text-base">Chia sẻ kế hoạch cưới</h3>
          </div>

          <p className="text-sm text-gray-600 mb-5 max-w-md leading-relaxed">
            Mời bạn đời cùng quản lý kế hoạch cưới. Cả 2 sẽ thấy và chỉnh sửa chung
            <strong> ngân sách, khách mời, thị trường, phong thủy</strong> — tiết kiệm thời gian và đồng bộ dữ liệu.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isCreating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors text-sm disabled:opacity-50 shadow-sm"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Tạo mã mời
            </button>

            {!showJoinInput ? (
              <button
                type="button"
                onClick={() => setShowJoinInput(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-violet-200 text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-colors text-sm"
              >
                <Link2 className="w-4 h-4" /> Nhập mã tham gia
              </button>
            ) : (
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="WED-XXXX"
                  maxLength={8}
                  className="flex-1 px-3 py-3 rounded-xl border border-violet-200 text-center font-mono text-lg font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white placeholder-gray-300"
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={isJoining || !joinCode.trim()}
                  className="px-4 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowJoinInput(false); setJoinCode(''); }}
                  className="px-3 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SharedPlanSection;
