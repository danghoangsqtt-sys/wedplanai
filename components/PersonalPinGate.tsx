import React, { useCallback, useEffect, useRef, useState } from "react";
import { Heart, LockKeyhole, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { OWNER_UID } from "../lib/constants";
import {
  PERSONAL_LOCK_EVENT,
  PERSONAL_UNLOCK_KEY,
  verifyPersonalPin,
} from "../lib/personalAccess";
import { readLegacyMilestoneTasks } from "../lib/milestoneTasks";
import { DEFAULT_GUEST_USER } from "../data/initialData";
import { useStore } from "../store/useStore";

export default function PersonalPinGate({
  children,
  onUnlock,
}: {
  children: React.ReactNode;
  onUnlock: () => Promise<void>;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [cloudWarning, setCloudWarning] = useState(false);
  const generation = useRef(0);
  const checkingRef = useRef(false);

  const connectExistingSession = useCallback(
    async (request: number) => {
      if (!isSupabaseConfigured) return;
      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();
        if (
          request !== generation.current ||
          sessionError ||
          !sessionData.session
        )
          return;
        const { data, error: authError } = await supabase.auth.getUser();
        if (request !== generation.current || authError || !data.user) return;
        const { data: allowed, error: permissionError } = await supabase.rpc(
          "can_manage_plan",
          { plan_uid: OWNER_UID },
        );
        if (request !== generation.current || permissionError || !allowed)
          return;
        await useStore
          .getState()
          .login({
            ...(useStore.getState().user || DEFAULT_GUEST_USER),
            uid: OWNER_UID,
            email: data.user.email || null,
          });
        if (request !== generation.current) return;
        useStore.setState({ isLocalOnly: false });
        try {
          await onUnlock();
          if (request === generation.current) setCloudWarning(false);
        } catch {
          if (request !== generation.current) return;
          if (useStore.getState().syncStatus !== "conflict")
            useStore.getState().enableLocalMode();
          setCloudWarning(true);
        }
      } catch {
        /* Keep local access when an existing cloud session cannot be verified. */
      }
    },
    [onUnlock],
  );

  const activate = useCallback(
    (request: number) => {
      useStore.getState().enableLocalMode();
      if (
        !isSupabaseConfigured &&
        !Object.keys(useStore.getState().milestoneTasks).length
      ) {
        const legacy = readLegacyMilestoneTasks();
        if (legacy) useStore.getState().setMilestoneTasks(legacy);
      }
      setUnlocked(true);
      void connectExistingSession(request);
    },
    [connectExistingSession],
  );

  useEffect(() => {
    const lock = () => {
      generation.current++;
      useStore.getState().enableLocalMode();
      setUnlocked(false);
      setPin("");
      setError("");
      setCloudWarning(false);
    };
    window.addEventListener(PERSONAL_LOCK_EVENT, lock);
    try {
      if (sessionStorage.getItem(PERSONAL_UNLOCK_KEY) === "1")
        activate(++generation.current);
    } catch {
      /* Ask for PIN again. */
    }
    return () => {
      generation.current++;
      window.removeEventListener(PERSONAL_LOCK_EVENT, lock);
    };
  }, [activate]);

  const unlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (checkingRef.current) return;
    checkingRef.current = true;
    setChecking(true);
    setError("");
    const request = ++generation.current;
    try {
      const correct = await verifyPersonalPin(pin);
      if (request !== generation.current) return;
      if (!correct) {
        setError("Mã PIN chưa đúng. Vui lòng thử lại.");
        setPin("");
        return;
      }
      try {
        sessionStorage.setItem(PERSONAL_UNLOCK_KEY, "1");
      } catch {
        /* Unlock for this mount only. */
      }
      setPin("");
      activate(request);
    } catch {
      setError(
        "Chưa kiểm tra được mã PIN. Hãy mở trang bằng localhost hoặc HTTPS.",
      );
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  };

  if (unlocked)
    return (
      <>
        {children}
        {cloudWarning && (
          <div
            role="alert"
            className="fixed bottom-20 right-4 z-50 max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 shadow-lg"
          >
            Chưa đồng bộ được cloud. Các thay đổi vẫn được giữ trên thiết bị.
            <button
              className="ml-2 font-semibold underline"
              onClick={() => void connectExistingSession(++generation.current)}
            >
              Thử kết nối lại
            </button>
          </div>
        )}
      </>
    );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 px-4">
      <form
        onSubmit={unlock}
        className="w-full max-w-sm rounded-3xl border border-rose-100 bg-white p-8 shadow-xl shadow-rose-100/50"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50">
          <LockKeyhole className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="text-center text-2xl font-bold text-gray-900">
          WedPlan AI
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Không gian cưới của hai bạn
        </p>
        <label className="mt-7 block text-sm font-semibold text-gray-700">
          Mã PIN
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            autoComplete="off"
            pattern="[0-9]{6}"
            maxLength={6}
            minLength={6}
            required
            aria-describedby="pin-help"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-center text-2xl tracking-[0.5em] outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </label>
        <p id="pin-help" className="mt-2 text-xs text-gray-400">
          Nhập mã PIN 6 số để mở kế hoạch cưới.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={checking}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 p-3 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-60"
        >
          {checking && <Loader2 className="h-4 w-4 animate-spin" />}
          {checking ? "Đang mở…" : "Mở kế hoạch"}
        </button>
        <p className="mt-6 text-center text-xs text-gray-400">
          <Heart className="mr-1 inline h-3 w-3" />
          Cùng nhau chuẩn bị ngày hạnh phúc
        </p>
      </form>
    </div>
  );
}
