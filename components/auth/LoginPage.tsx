import React, { useState } from 'react';
import { HeartHandshake, UserCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { UserProfile } from '../../types';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { getUserPublicProfile, syncUserProfile } from '../../services/cloudService';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onClose?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onClose }) => {
  const { login, addUser, addNotification } = useStore();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');

    if (!auth || !googleProvider) {
      setError("Cấu hình Firebase chưa chính xác hoặc thiếu API Key.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      // 1. QUAN TRỌNG: Kiểm tra trên Cloud trước để lấy trạng thái isActive mới nhất
      let cloudProfile: UserProfile | null = await getUserPublicProfile(fbUser.uid);
      const isAdminEmail = fbUser.email === 'danghoang.sqtt@gmail.com';

      let targetUser: UserProfile;

      if (cloudProfile) {
        // TRƯỜNG HỢP 1: User đã tồn tại trên hệ thống Cloud
        // Logic: Lấy toàn bộ data từ Cloud (đặc biệt là isActive) gộp vào user local
        targetUser = {
          ...cloudProfile, // Spread toàn bộ thông tin từ Cloud (bao gồm isActive, role, settings...)

          // Cập nhật các thông tin hiển thị mới nhất từ Google (nếu có thay đổi)
          email: fbUser.email,
          displayName: fbUser.displayName || cloudProfile.displayName,
          photoURL: fbUser.photoURL || cloudProfile.photoURL,

          // Đảm bảo quyền Admin không bị ghi đè, và isActive được tôn trọng từ Cloud
          role: isAdminEmail ? 'ADMIN' : cloudProfile.role,
          isActive: isAdminEmail ? true : cloudProfile.isActive, // Lấy isActive từ Cloud
          allowCustomApiKey: isAdminEmail ? true : cloudProfile.allowCustomApiKey
        };

        // Đồng bộ ngược lại thông tin Google mới nhất lên Cloud
        await syncUserProfile(targetUser);
      } else {
        // TRƯỜNG HỢP 2: User hoàn toàn mới -> Tạo profile mặc định
        targetUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          photoURL: fbUser.photoURL,
          partnerName: null,
          phoneNumber: fbUser.phoneNumber || null,
          role: isAdminEmail ? 'ADMIN' : 'USER',
          isActive: isAdminEmail, // Admin active ngay, User thường chờ duyệt
          joinedAt: new Date().toISOString(),
          allowCustomApiKey: isAdminEmail,
          enableCloudStorage: true,
          weddingDate: null,
          showCountdown: false
        };
        // Thêm vào store và cloud
        await addUser(targetUser);
      }

      // 2. Login vào store local với thông tin đã được đồng bộ chuẩn
      await login(targetUser);

      // 3. Thông báo chào mừng
      if (isAdminEmail) {
        addNotification('SUCCESS', `Chào mừng Admin ${targetUser.displayName} quay trở lại!`);
      } else if (!targetUser.isActive) {
        addNotification(
          'WARNING',
          `Tài khoản chưa kích hoạt. Vui lòng liên hệ Admin: 0343019101 hoặc danghoang.sqtt@gmail.com`,
          10000
        );
      } else {
        addNotification('SUCCESS', `Đăng nhập thành công! Xin chào ${targetUser.displayName}`);
      }

      onLoginSuccess();

    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Bạn đã hủy đăng nhập.');
      } else {
        setError(err.message || 'Có lỗi xảy ra khi kết nối Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    if (onClose) onClose();
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden relative animate-scaleIn">
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 bg-gray-50 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-rose-100 p-4 rounded-full shadow-inner">
            <HeartHandshake className="w-10 h-10 text-rose-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">WedPlan AI</h1>
        <p className="text-gray-500 text-sm mb-8">
          Đăng nhập để đồng bộ kế hoạch cưới của bạn trên mọi thiết bị.
        </p>

        <div className="space-y-4">
          {/* GOOGLE LOGIN BUTTON */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{isLoading ? "Đang kết nối..." : "Tiếp tục với Google"}</span>
          </button>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg border border-red-100 animate-pulse text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* DIVIDER */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400">Hoặc</span>
            </div>
          </div>

          {/* GUEST BUTTON */}
          <button
            onClick={handleGuestLogin}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 px-4 rounded-xl transition-all active:scale-95"
          >
            <UserCircle2 className="w-5 h-5" />
            <span>Trải nghiệm vai trò Khách</span>
          </button>
        </div>

        <div className="mt-6 text-[10px] text-gray-400">
          Bằng việc đăng nhập, bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của WedPlan AI.
        </div>
      </div>

      <style>{`
         @keyframes scaleIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
         }
         .animate-scaleIn {
            animation: scaleIn 0.2s ease-out forwards;
         }
      `}</style>
    </div>
  );
};

export default LoginPage;