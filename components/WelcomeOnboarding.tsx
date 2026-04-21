
import React, { useState, useEffect } from 'react';
import {
  HeartHandshake, Calendar, ListChecks, X, ChevronRight,
  ChevronLeft, Sparkles, Users, Wallet, MessageSquareText
} from 'lucide-react';

const STORAGE_KEY = 'wedplan_onboarding_done';

interface WelcomeOnboardingProps {
  onDone: (goToSettings?: boolean) => void;
}

const STEPS = [
  {
    icon: HeartHandshake,
    color: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    title: 'Chào mừng đến WedPlan AI! 💍',
    subtitle: 'Trợ lý thông minh cho hành trình cưới của bạn',
    desc: 'WedPlan AI giúp bạn lên kế hoạch, quản lý ngân sách, khách mời và theo dõi tiến độ chuẩn bị đám cưới — tất cả trong một nơi.',
    features: [
      { icon: Calendar, label: 'Theo dõi mốc thời gian cưới' },
      { icon: Wallet, label: 'Quản lý ngân sách chi tiết' },
      { icon: Users, label: 'Quản lý danh sách khách mời' },
      { icon: MessageSquareText, label: 'Cố vấn AI 24/7' },
    ],
    cta: 'Bắt đầu',
    ctaSecondary: null,
  },
  {
    icon: Calendar,
    color: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    title: 'Bước 1: Nhập ngày cưới dự kiến',
    subtitle: 'Đây là bước quan trọng nhất',
    desc: 'Sau khi nhập ngày cưới (và ngày ăn hỏi nếu có), hệ thống sẽ tự động tạo các mốc thời gian và nhắc nhở bạn những việc cần làm theo từng giai đoạn.',
    tips: [
      '📅 Vào Cài Đặt → Tài Khoản để nhập ngày cưới',
      '🗺️ Nhập vùng miền để nhận tư vấn phù hợp',
      '👫 Thêm tên cô dâu chú rể để cá nhân hóa',
    ],
    cta: 'Tiếp theo',
    ctaSecondary: 'Đến Cài Đặt ngay',
  },
  {
    icon: ListChecks,
    color: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    title: 'Bước 2: Theo dõi theo checklist',
    subtitle: 'Làm từng bước, không bỏ sót',
    desc: 'Thêm các hạng mục chi phí vào phần Ngân Sách. Mỗi hạng mục có thể đặt hạn chót và trạng thái. Trang Tổng Quan sẽ tự động cập nhật tiến độ.',
    tips: [
      '✅ Nhấn ô vuông trên Tổng Quan để tick hoàn thành',
      '💰 Nhập chi phí thực tế khi đã thanh toán',
      '⚠️ Hệ thống sẽ cảnh báo khi có hạng mục quá hạn',
    ],
    cta: 'Bắt đầu lên kế hoạch!',
    ctaSecondary: null,
  },
];

const WelcomeOnboarding: React.FC<WelcomeOnboardingProps> = ({ onDone }) => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Small delay so app renders first
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleClose = (goSettings = false) => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
    onDone(goSettings);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">

        {/* Gradient top bar */}
        <div className={`bg-gradient-to-r ${current.color} h-1.5`} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          {/* Step dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-rose-500' : i < step ? 'w-3 bg-rose-200' : 'w-3 bg-gray-200'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleClose()}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            title="Bỏ qua"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-2xl ${current.iconBg} flex items-center justify-center mb-4`}>
            <Icon className={`w-7 h-7 ${current.iconColor}`} />
          </div>

          <h2 className="text-xl font-black text-gray-900 mb-1">{current.title}</h2>
          <p className="text-xs text-rose-500 font-semibold mb-3">{current.subtitle}</p>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">{current.desc}</p>

          {/* Features (step 0) */}
          {'features' in current && current.features && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {current.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-rose-50 rounded-xl p-2.5">
                  <f.icon className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-700">{f.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tips (steps 1 & 2) */}
          {'tips' in current && current.tips && (
            <div className="space-y-2 mb-4">
              {current.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                  <span className="text-sm leading-relaxed text-gray-700">{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          {/* Secondary CTA */}
          {current.ctaSecondary && (
            <button
              type="button"
              onClick={() => handleClose(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              {current.ctaSecondary}
            </button>
          )}

          {/* Primary CTA */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center justify-center gap-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-bold transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isLast) handleClose();
                else setStep(s => s + 1);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-sm font-bold transition-all active:scale-95 shadow-md shadow-rose-200"
            >
              {current.cta}
              {!isLast && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleClose()}
            className="text-xs text-gray-400 hover:text-gray-600 text-center py-1 transition-colors"
          >
            Bỏ qua phần hướng dẫn
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeOnboarding;
