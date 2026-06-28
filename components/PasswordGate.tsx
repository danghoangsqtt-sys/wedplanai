import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Lock, AlertTriangle } from 'lucide-react';
import { PIN_HASH, SESSION_UNLOCKED_KEY } from '../lib/constants';

interface PasswordGateProps {
  children: React.ReactNode;
  onUnlock: () => Promise<void>;
}

const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export default function PasswordGate({ children, onUnlock }: PasswordGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  // BUG-002 fix: track cloud load failure to show warning
  const [cloudWarning, setCloudWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // BUG-001 fix: wrap in useCallback with proper dependency
  const handleUnlock = useCallback(async () => {
    setIsLoading(true);
    try {
      await onUnlock();
      sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
      setUnlocked(true);
    } catch {
      // BUG-002 fix: set warning flag, still unlock (cloud may be unavailable)
      setCloudWarning(true);
      sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
      setUnlocked(true);
    } finally {
      setIsLoading(false);
    }
  }, [onUnlock]);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_UNLOCKED_KEY) === 'true') {
      handleUnlock();
    } else {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [handleUnlock]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!pin || isLoading) return;

    const inputHash = await hashPin(pin);
    if (inputHash === PIN_HASH) {
      await handleUnlock();
    } else {
      setError(true);
      setShake(true);
      setPin('');
      setTimeout(() => { setError(false); setShake(false); }, 600);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  if (unlocked) return (
    <>
      {children}
      {/* BUG-002 fix: show cloud warning banner after unlock if load failed */}
      {cloudWarning && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 bg-amber-50 border border-amber-200 rounded-xl shadow-lg p-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Không thể tải dữ liệu cloud</p>
            <p className="text-xs text-amber-600 mt-0.5">Đang hiển thị dữ liệu cục bộ. Kiểm tra kết nối mạng và tải lại trang.</p>
          </div>
          <button onClick={() => setCloudWarning(false)} className="text-amber-400 hover:text-amber-600 p-1 flex-shrink-0" aria-label="Đóng">
            ×
          </button>
        </div>
      )}
    </>
  );

  if (isLoading && sessionStorage.getItem(SESSION_UNLOCKED_KEY) === 'true') {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50">
        <div className="flex flex-col items-center gap-3">
          <Heart className="w-10 h-10 text-rose-400 animate-pulse" />
          <p className="text-sm text-rose-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50">
      <div
        className={`bg-white rounded-2xl shadow-xl border border-rose-100 p-8 w-full max-w-sm mx-4 transition-all ${shake ? 'animate-shake' : ''}`}
        style={{ animation: shake ? 'shake 0.5s ease-in-out' : undefined }}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-md">
            <Lock className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-800 mb-1">WedPlan AI</h1>
          <p className="text-sm text-gray-400">Nhập mật khẩu để tiếp tục</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="password"
              value={pin}
              onChange={e => { setPin(e.target.value); setError(false); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="••••••"
              maxLength={8}
              autoComplete="current-password"
              className={`w-full px-4 py-3 rounded-xl border text-center text-lg tracking-widest font-mono transition-all outline-none focus:ring-2 ${
                error
                  ? 'border-red-300 bg-red-50 focus:ring-red-200 text-red-600'
                  : 'border-gray-200 focus:border-rose-400 focus:ring-rose-100 text-gray-700'
              }`}
            />
            {error && (
              <p className="text-xs text-red-500 text-center mt-2">Mật khẩu không đúng. Thử lại.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!pin || isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:from-rose-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang xác thực...' : 'Vào ứng dụng'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-300 mt-5">
          <Heart className="inline w-3 h-3 text-rose-300 mr-1" />
          Công cụ cá nhân riêng tư
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
