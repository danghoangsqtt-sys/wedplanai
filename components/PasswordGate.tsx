import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Heart, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { OWNER_UID } from '../lib/constants';
import { useStore } from '../store/useStore';

interface PasswordGateProps { children: React.ReactNode; onUnlock: () => Promise<void> }

// RLS independently authorizes each database call; browser state grants no access.
export default function PasswordGate({ children, onUnlock }: PasswordGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [cloudWarning, setCloudWarning] = useState(false);
  const generation = useRef(0);
  const authenticating = useRef(false);

  const validateAccess = useCallback(async () => {
    const request = ++generation.current;
    setLoading(true);
    setUnlocked(false);
    try {
      const { data, error: authError } = await supabase.auth.getUser();
      if (request !== generation.current) return;
      if (authError || !data.user) return;
      const { data: allowed, error: permissionError } = await supabase.rpc('can_manage_plan', { plan_uid: OWNER_UID });
      if (request !== generation.current) return;
      if (permissionError || !allowed) {
        setError('Tài khoản này chưa được cấp quyền quản lý kế hoạch cưới.');
        return;
      }
      await useStore.getState().login({ ...useStore.getState().user!, uid: OWNER_UID, email: data.user.email || null });
      try {
        await onUnlock();
        if (request === generation.current) setCloudWarning(false);
      } catch {
        if (request === generation.current) setCloudWarning(true);
      }
      if (request === generation.current) setUnlocked(true);
    } catch {
      if (request === generation.current) setError('Không thể xác minh phiên đăng nhập. Vui lòng thử lại.');
    } finally {
      if (request === generation.current) setLoading(false);
    }
  }, [onUnlock]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void validateAccess();
    let timer: ReturnType<typeof setTimeout>;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        generation.current++;
        useStore.setState({ isCloudLoaded: false });
        setUnlocked(false);
        setLoading(false);
      } else if (event === 'SIGNED_IN' && !authenticating.current) {
        // Defer auth methods until the SDK releases its Auth callback lock.
        clearTimeout(timer);
        timer = setTimeout(() => { void validateAccess(); }, 0);
      }
    });
    return () => { generation.current++; clearTimeout(timer); subscription.unsubscribe(); };
  }, [validateAccess]);

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (authenticating.current) return;
    authenticating.current = true;
    setLoading(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) { setError('Email hoặc mật khẩu không đúng.'); return; }
      setPassword('');
      await validateAccess();
    } catch {
      setError('Không thể đăng nhập. Kiểm tra kết nối và thử lại.');
    } finally {
      authenticating.current = false;
      setLoading(false);
    }
  };

  if (unlocked) return <>
    {children}
    {cloudWarning && <div role="alert" className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-sm z-50 rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-lg">
      <AlertTriangle className="w-5 h-5 text-amber-600" />
      <p className="text-sm text-amber-800">Chưa tải được dữ liệu cloud. Tự động lưu đang tạm dừng để bảo vệ dữ liệu.</p>
      <button className="mt-2 text-sm font-semibold text-amber-900 underline" onClick={async () => {
        try { await onUnlock(); setCloudWarning(false); } catch { setCloudWarning(true); }
      }}>Thử tải lại</button>
    </div>}
  </>;

  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 px-4">
    <div className="w-full max-w-sm rounded-2xl border border-rose-100 bg-white p-8 shadow-xl">
      <div className="flex justify-center mb-5"><Lock className="w-10 h-10 text-rose-500" /></div>
      <h1 className="text-center text-xl font-bold text-gray-800">WedPlan AI</h1>
      {!isSupabaseConfigured ? <p role="status" className="mt-5 text-sm text-gray-600">Ứng dụng chưa được kết nối máy chủ. Vui lòng liên hệ người quản trị để hoàn tất thiết lập.</p> : <form onSubmit={signIn} className="mt-5 space-y-4">
        <p className="text-sm text-gray-500 text-center">Đăng nhập tài khoản quản lý kế hoạch cưới</p>
        <label className="block text-sm text-gray-700">Email
          <input type="email" required autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3" />
        </label>
        <label className="block text-sm text-gray-700">Mật khẩu
          <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3" />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={loading} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 p-3 font-semibold text-white disabled:opacity-50">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}{loading ? 'Đang xác minh...' : 'Đăng nhập'}
        </button>
      </form>}
      <p className="mt-5 text-center text-xs text-gray-400"><Heart className="inline w-3 h-3 mr-1" />Kế hoạch cưới riêng tư của bạn</p>
    </div>
  </div>;
}
