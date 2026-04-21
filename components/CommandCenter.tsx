
import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  Calendar, Users, Wallet, CheckCircle2, AlertTriangle,
  Clock, TrendingUp, Heart, ChevronRight, Crown,
  PartyPopper, HeartHandshake, Plus, Trash2,
  Sparkles, Lightbulb, ChevronDown, ChevronUp,
  Loader2, X, Banknote, Gift, Target,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { DashboardStats, BudgetItem, TaskStatus } from '../types';

interface CommandCenterProps {
  stats: DashboardStats;
  setActiveTab: (tab: string) => void;
}

// ── Types ──────────────────────────────────────────────────────────────────
interface MilestoneTask {
  id: string;
  title: string;
  notes: string;
  tips: string;
  done: boolean;
}

interface MilestoneData {
  id: string;
  label: string;
  shortLabel: string;
  desc: string;
  daysOffset: number;
  color: string;         // Tailwind bg class for active state
  ringColor: string;     // Tailwind ring class
  defaultTasks: Array<{ title: string; notes: string }>;
}

// ── Stage ──────────────────────────────────────────────────────────────────
interface Stage { label: string; sublabel: string; gradientClass: string }

function computeStage(d: number): Stage {
  if (d > 365) return { label: 'Lên kế hoạch',       sublabel: 'Bắt đầu hành trình chuẩn bị',          gradientClass: 'from-blue-500 to-indigo-600' };
  if (d > 180) return { label: 'Chuẩn bị sớm',       sublabel: 'Đặt cọc các dịch vụ quan trọng',       gradientClass: 'from-indigo-500 to-violet-600' };
  if (d > 90)  return { label: 'Chuẩn bị chính',     sublabel: 'Gửi thiệp, xác nhận khách mời',        gradientClass: 'from-violet-500 to-purple-600' };
  if (d > 30)  return { label: 'Giai đoạn nước rút', sublabel: 'Hoàn thiện mọi chi tiết cuối cùng',    gradientClass: 'from-amber-500 to-orange-600' };
  if (d > 7)   return { label: 'Sắp đến rồi!',       sublabel: 'Tổng duyệt và chuẩn bị tinh thần',    gradientClass: 'from-orange-500 to-rose-500'  };
  if (d > 0)   return { label: '🎉 Tuần cưới!',      sublabel: 'Những ngày hạnh phúc nhất đã đến',    gradientClass: 'from-rose-500 to-pink-600'    };
  if (d === 0) return { label: '💍 Ngày trọng đại!', sublabel: 'Chúc mừng đại hỷ!',                   gradientClass: 'from-rose-500 to-pink-600'    };
  return       { label: 'Sau đám cưới',              sublabel: 'Chúc hạnh phúc mãi mãi 🌹',           gradientClass: 'from-emerald-500 to-teal-600' };
}

// ── Milestone definitions with default task lists ──────────────────────────
const MILESTONES: MilestoneData[] = [
  {
    id: 'm12', label: 'T-12 tháng', shortLabel: 'T-12', daysOffset: -365,
    desc: 'Chọn ngày & đặt địa điểm',
    color: 'bg-blue-500', ringColor: 'ring-blue-400',
    defaultTasks: [
      { title: 'Chọn & chốt ngày cưới', notes: 'Kiểm tra lịch âm dương, tránh ngày xấu, thống nhất cả 2 bên gia đình' },
      { title: 'Khảo sát & đặt địa điểm tổ chức', notes: 'So sánh ít nhất 3 nhà hàng về giá, sức chứa, phong cách, menu' },
      { title: 'Lập danh sách khách mời sơ bộ', notes: 'Tổng hợp từ 2 bên gia đình để ước tính tổng số khách' },
      { title: 'Xác định & phân bổ ngân sách tổng', notes: 'Phân % theo hạng mục: địa điểm ~40%, ảnh/quay ~10%, trang phục ~10%...' },
      { title: 'Chọn style & concept đám cưới', notes: 'Tông màu chủ đạo, phong cách (hiện đại, cổ điển, boho, garden...)' },
    ],
  },
  {
    id: 'm9', label: 'T-9 tháng', shortLabel: 'T-9', daysOffset: -270,
    desc: 'Đặt ảnh cưới & dịch vụ chính',
    color: 'bg-indigo-500', ringColor: 'ring-indigo-400',
    defaultTasks: [
      { title: 'Đặt gói chụp ảnh pre-wedding', notes: 'Xem portfolio, thống nhất concept, địa điểm, ngày chụp' },
      { title: 'Đặt quay phim ngày cưới', notes: 'Xem demo video, chọn phong cách: cinematic hay phóng sự' },
      { title: 'Chọn & đặt cọc MC', notes: 'Nghe thử giọng, kiểm tra kinh nghiệm và phong cách dẫn' },
      { title: 'Đặt ban nhạc / DJ', notes: 'Thống nhất danh sách bài, thời lượng biểu diễn, thiết bị âm thanh' },
      { title: 'Đặt cọc makeup artist & làm tóc', notes: 'Xem portfolio, thống nhất số lần thay trang phục trong ngày' },
    ],
  },
  {
    id: 'm6', label: 'T-6 tháng', shortLabel: 'T-6', daysOffset: -180,
    desc: 'Chọn váy & thiết kế thiệp',
    color: 'bg-violet-500', ringColor: 'ring-violet-400',
    defaultTasks: [
      { title: 'Thử & chọn váy cưới cô dâu', notes: 'Thử ít nhất 5-7 mẫu ở nhiều tiệm, chụp ảnh để so sánh sau' },
      { title: 'Chọn & đặt trang phục chú rể', notes: 'Đo may hoặc thuê vest, phối màu theo váy cô dâu' },
      { title: 'Thiết kế & in thiệp mời', notes: 'Kiểm tra kỹ nội dung trước khi in, in dư 10% số lượng cần' },
      { title: 'Đặt hoa cưới & trang trí sân khấu', notes: 'Xác nhận màu hoa, kiểu cắm, backdrop, phù hợp concept' },
      { title: 'Đặt bánh cưới', notes: 'Thử vị bánh, chọn mẫu & số tầng, thống nhất ngày giao' },
      { title: 'Chọn nhẫn cưới', notes: 'So sánh chất liệu vàng/bạch kim, khắc tên & ngày cưới vào nhẫn' },
    ],
  },
  {
    id: 'm3', label: 'T-3 tháng', shortLabel: 'T-3', daysOffset: -90,
    desc: 'Gửi thiệp & xác nhận khách',
    color: 'bg-purple-500', ringColor: 'ring-purple-400',
    defaultTasks: [
      { title: 'Gửi thiệp mời đến toàn bộ khách', notes: 'Gửi trước ít nhất 6 tuần, nhắn tin/gọi xác nhận thêm' },
      { title: 'Tổng hợp & xác nhận số khách tham dự', notes: 'Cập nhật vào danh sách, thông báo số lượng cho nhà hàng' },
      { title: 'Thử & duyệt menu tiệc cưới', notes: 'Chọn 5-7 món, lưu ý thực khách ăn chay hoặc dị ứng' },
      { title: 'Đặt xe hoa & đoàn đón dâu', notes: 'Thống nhất số lượng xe, trang trí, lịch trình di chuyển' },
      { title: 'Đặt phòng cưới / khách sạn đêm tân hôn', notes: 'Đặt sớm để có phòng phù hợp, kiểm tra chính sách hủy' },
    ],
  },
  {
    id: 'm1', label: 'T-1 tháng', shortLabel: 'T-1', daysOffset: -30,
    desc: 'Thử váy & tổng duyệt',
    color: 'bg-amber-500', ringColor: 'ring-amber-400',
    defaultTasks: [
      { title: 'Thử váy cưới lần cuối', notes: 'Kiểm tra chỉnh sửa hoàn tất, test phụ kiện giày, vương miện đầy đủ' },
      { title: 'Tổng duyệt nghi lễ & chương trình tiệc', notes: 'Chạy toàn bộ flow với MC, nhà hàng, nhạc, quay phim' },
      { title: 'Xác nhận lại toàn bộ nhà cung cấp', notes: 'Gọi điện cho từng đơn vị, kiểm tra hợp đồng, giờ có mặt' },
      { title: 'Chuẩn bị phong bì & quà cảm ơn', notes: 'Phong bì cho phù dâu, phù rể, ekip hỗ trợ trong ngày' },
      { title: 'Làm trang điểm thử chính thức', notes: 'Test full look: tóc + makeup + phụ kiện, chụp ảnh kiểm tra' },
    ],
  },
  {
    id: 'mw', label: 'Tuần cưới', shortLabel: 'Tuần C', daysOffset: -7,
    desc: 'Hoàn thiện & dưỡng sức',
    color: 'bg-orange-500', ringColor: 'ring-orange-400',
    defaultTasks: [
      { title: 'Họp mặt & briefing toàn đội ngũ', notes: 'Thống nhất phân công, thời gian có mặt, số điện thoại liên hệ' },
      { title: 'Chuẩn bị hành lý tuần trăng mật', notes: 'Check vé, hộ chiếu/CCCD, đặt khách sạn, đóng gói hành lý' },
      { title: 'Chuẩn bị đồ cho ngày cưới', notes: 'Váy, giày, phụ kiện, đồ trang điểm, đóng gói sẵn từ hôm trước' },
      { title: 'Nghỉ ngơi & dưỡng da dưỡng sức', notes: 'Ngủ đủ giấc, uống đủ nước, tránh lịch họp căng thẳng' },
    ],
  },
  {
    id: 'd0', label: 'Ngày cưới', shortLabel: 'Ngày C', daysOffset: 0,
    desc: 'Hạnh phúc mãi mãi 💍',
    color: 'bg-rose-500', ringColor: 'ring-rose-400',
    defaultTasks: [
      { title: 'Cô dâu trang điểm & làm đầu', notes: 'Đặt lịch sớm, dự phòng thêm 1-2 tiếng so với kế hoạch' },
      { title: 'Chụp ảnh gia đình trước lễ', notes: 'Chuẩn bị danh sách ảnh cần chụp với từng nhóm người thân' },
      { title: 'Giao toàn bộ điều phối cho người phụ trách', notes: 'Trưởng nhóm phụ trách xử lý mọi phát sinh trong ngày' },
      { title: 'Tận hưởng ngày trọng đại!', notes: 'Hít thở, mỉm cười và sống trọn vẹn khoảnh khắc này 🥰' },
    ],
  },
];

// ── Persistence ────────────────────────────────────────────────────────────
const MS_TASKS_KEY = 'wedplan_ms_tasks_v2';

type TaskStore = Record<string, MilestoneTask[]>;

function loadTaskStore(): TaskStore {
  try { return JSON.parse(localStorage.getItem(MS_TASKS_KEY) || '{}'); }
  catch { return {}; }
}

function saveTaskStore(store: TaskStore) {
  try { localStorage.setItem(MS_TASKS_KEY, JSON.stringify(store)); } catch {}
}

function initTaskStore(): TaskStore {
  const saved = loadTaskStore();
  const result: TaskStore = {};
  for (const ms of MILESTONES) {
    result[ms.id] = saved[ms.id] ?? ms.defaultTasks.map((t, i) => ({
      id: `${ms.id}_${i}`,
      title: t.title,
      notes: t.notes,
      tips: '',
      done: false,
    }));
  }
  return result;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function fmtMoney(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}T`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(0)}tr`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}

function isDone(i: BudgetItem) { return i.status === TaskStatus.DONE || i.status === TaskStatus.PAID; }
function isOverdue(i: BudgetItem) {
  if (isDone(i) || !i.deadline) return false;
  return new Date(i.deadline) < new Date();
}
function isDueThisWeek(i: BudgetItem) {
  if (isDone(i) || !i.deadline) return false;
  const diff = (new Date(i.deadline).getTime() - Date.now()) / 86_400_000;
  return diff >= 0 && diff <= 7;
}

// ── AI tip generator ───────────────────────────────────────────────────────
async function generateAITip(title: string, msLabel: string, userApiKey?: string): Promise<string> {
  // @ts-ignore
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  const apiKey = userApiKey || envKey;
  if (!apiKey) return '';

  const prompt = `Bạn là chuyên gia tư vấn cưới hỏi tại Việt Nam. Viết 1-2 câu mẹo ngắn gọn, cụ thể và thực tế cho công việc: "${title}" trong giai đoạn ${msLabel} chuẩn bị đám cưới. Chỉ trả lời nội dung mẹo, không thêm tiêu đề.`;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
        }),
      }
    );
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  } catch { return ''; }
}

// ══════════════════════════════════════════════════════════════════════════
const CommandCenter: React.FC<CommandCenterProps> = ({ stats, setActiveTab }) => {
  const { user, guests, budgetItems, sharedPlan, isSharedPlanOwner, invitation, updateBudgetItem, settings } = useStore();

  // ── Milestone task state (localStorage-persisted) ──
  const [msTasks, setMsTasks] = useState<TaskStore>(initTaskStore);
  const [selectedMs, setSelectedMs]   = useState<string | null>(null);
  const [newTitle, setNewTitle]       = useState('');
  const [generatingTip, setGeneratingTip] = useState<string | null>(null);
  const [expandedTask, setExpandedTask]   = useState<string | null>(null);
  const [editingNotes, setEditingNotes]   = useState<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  // ── Task mutations ──
  const patchTask = useCallback((msId: string, taskId: string, patch: Partial<MilestoneTask>) => {
    setMsTasks(prev => {
      const next = { ...prev, [msId]: prev[msId].map(t => t.id === taskId ? { ...t, ...patch } : t) };
      saveTaskStore(next);
      return next;
    });
  }, []);

  const addTask = useCallback((msId: string) => {
    const title = newTitle.trim();
    if (!title) return;
    const task: MilestoneTask = { id: `${msId}_u_${Date.now()}`, title, notes: '', tips: '', done: false };
    setMsTasks(prev => {
      const next = { ...prev, [msId]: [...(prev[msId] ?? []), task] };
      saveTaskStore(next);
      return next;
    });
    setNewTitle('');
    addInputRef.current?.focus();
  }, [newTitle]);

  const deleteTask = useCallback((msId: string, taskId: string) => {
    setMsTasks(prev => {
      const next = { ...prev, [msId]: prev[msId].filter(t => t.id !== taskId) };
      saveTaskStore(next);
      return next;
    });
  }, []);

  const [aiKeyWarning, setAiKeyWarning] = useState(false);

  const genTip = useCallback(async (msId: string, task: MilestoneTask, msLabel: string) => {
    setAiKeyWarning(false);
    setGeneratingTip(task.id);
    const tip = await generateAITip(task.title, msLabel, settings.geminiApiKey || undefined);
    if (tip) {
      patchTask(msId, task.id, { tips: tip });
    } else {
      // No env key AND no user key
      setAiKeyWarning(true);
    }
    setGeneratingTip(null);
  }, [settings.geminiApiKey, patchTask]);

  // ── Wedding date ──
  const weddingDateStr = user?.weddingDate || invitation?.date || '';
  const daysUntil = useMemo(() => {
    if (!weddingDateStr) return null;
    return Math.ceil((new Date(weddingDateStr).getTime() - Date.now()) / 86_400_000);
  }, [weddingDateStr]);

  const stage = daysUntil !== null ? computeStage(daysUntil) : null;

  // ── Budget stats ──
  const totalItems  = budgetItems.length;
  const doneItems   = budgetItems.filter(isDone).length;
  const taskPct     = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const overdueList = useMemo(() => budgetItems.filter(isOverdue),    [budgetItems]);
  const thisWeekList= useMemo(() => budgetItems.filter(isDueThisWeek),[budgetItems]);
  const remaining   = stats.totalBudget - stats.totalActual;
  const spentPct    = stats.totalBudget > 0 ? Math.round((stats.totalActual / stats.totalBudget) * 100) : 0;

  // ── Guest stats ──
  const confirmedCount  = guests.filter(g => (g.probability ?? 50) >= 80).length;
  const expectedEnvelope = useMemo(() =>
    guests.reduce((s, g) => s + (g.redEnvelope || 0) * ((g.probability ?? 50) / 100), 0),
    [guests]);

  // ── Budget by category (top 5) ──
  const categoryRows = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of budgetItems) map[item.category] = (map[item.category] || 0) + item.estimatedCost;
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [budgetItems]);
  const maxCatCost = categoryRows[0]?.[1] ?? 1;

  // ── Milestones with computed status ──
  const milestones = useMemo(() => {
    if (!weddingDateStr) return [];
    const wed = new Date(weddingDateStr);
    const now = new Date();
    return MILESTONES.map((m, idx) => {
      const date = new Date(wed);
      date.setDate(date.getDate() + m.daysOffset);
      const timePassed     = date < now;
      const daysAway       = (date.getTime() - now.getTime()) / 86_400_000;
      const isCurrentPeriod = !timePassed && daysAway <= 45;
      const tasks          = msTasks[m.id] ?? [];
      const doneCnt        = tasks.filter(t => t.done).length;
      const totalCnt       = tasks.length;
      const allDone        = totalCnt > 0 && doneCnt === totalCnt;
      return { ...m, idx, date, timePassed, isCurrentPeriod, tasks, doneCnt, totalCnt, allDone };
    });
  }, [weddingDateStr, msTasks]);

  // Auto-select the first non-complete milestone on mount
  const autoSelected = useMemo(() => milestones.find(m => !m.allDone && !m.timePassed)?.id ?? milestones[0]?.id ?? null, []);
  const activeMsId = selectedMs ?? autoSelected;
  const activeMs   = milestones.find(m => m.id === activeMsId);

  // ── Upcoming tasks (budget items) ──
  const upcomingItems = useMemo(() =>
    budgetItems
      .filter(i => !isDone(i) && i.deadline && new Date(i.deadline) >= new Date())
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 4),
    [budgetItems]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 pb-24 lg:pb-6">

      {/* ══ 1. HERO — compact row ══════════════════════════════════════════ */}
      {stage && weddingDateStr ? (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${stage.gradientClass} text-white shadow-lg`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M20 20.5V18H0v5h5v5H0v5h20v-5h15v5h5V20h-5v-5h5v-5H20v5.5zm-5 4.5v-4h5v4h-5zm5-5V15h5v5h-5zm5 0h5v4h-5v-4zm0-5v-5h5v5h-5zM5 5h5v5H5V5zm0 5h5v5H5v-5zm0 5h5v4H5v-4z\'/%3E%3C/g%3E%3C/svg%3E')] opacity-100" />
          <div className="relative flex items-center gap-0 divide-x divide-white/20">
            {/* Stage */}
            <div className="flex-1 px-4 py-3 md:px-5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Crown className="w-3.5 h-3.5 text-white/70" />
                <span className="text-white/70 text-[10px] font-semibold uppercase tracking-widest">Giai đoạn</span>
              </div>
              <p className="text-lg md:text-xl font-black leading-tight">{stage.label}</p>
              <p className="text-white/70 text-xs mt-0.5 hidden sm:block">{stage.sublabel}</p>
            </div>

            {/* Progress */}
            <div className="px-4 py-3 md:px-5 min-w-[130px]">
              <p className="text-white/70 text-[10px] font-semibold mb-1">TIẾN ĐỘ CÔNG VIỆC</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${taskPct}%` }} />
                </div>
                <span className="text-sm font-black whitespace-nowrap">{taskPct}%</span>
              </div>
              <p className="text-white/60 text-[10px] mt-1">{doneItems}/{totalItems} hạng mục xong</p>
            </div>

            {/* Countdown */}
            <div className="px-4 py-3 md:px-5 text-center flex-shrink-0">
              {daysUntil! > 0 ? (
                <>
                  <div className="text-3xl md:text-4xl font-black leading-none">{daysUntil!.toLocaleString('vi-VN')}</div>
                  <div className="text-white/80 text-xs font-semibold mt-0.5">ngày nữa</div>
                  <div className="text-white/50 text-[10px] mt-0.5">
                    {new Date(weddingDateStr).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </>
              ) : daysUntil === 0 ? (
                <><PartyPopper className="w-8 h-8 mx-auto" /><div className="text-xs font-bold mt-1">Hôm nay!</div></>
              ) : (
                <><Heart className="w-8 h-8 mx-auto" /><div className="text-xs font-bold mt-1">Đã kết hôn ❤️</div></>
              )}
            </div>

            {/* Budget mini */}
            {stats.totalBudget > 0 && (
              <div className="px-4 py-3 md:px-5 min-w-[120px] hidden md:block">
                <p className="text-white/70 text-[10px] font-semibold mb-1">NGÂN SÁCH</p>
                <p className="text-base font-black">{fmtMoney(stats.totalBudget)}</p>
                <p className={`text-[10px] mt-0.5 font-semibold ${spentPct > 100 ? 'text-red-300' : 'text-white/70'}`}>
                  Đã chi {spentPct}% · Còn {fmtMoney(Math.max(remaining, 0))}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center flex-shrink-0">
            <HeartHandshake className="w-6 h-6 text-rose-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-800">Chào mừng đến với WedPlan AI! 👋</h2>
            <p className="text-xs text-gray-500 mt-0.5">Nhập ngày cưới để bắt đầu theo dõi tiến độ và lộ trình chuẩn bị</p>
          </div>
          <button type="button" onClick={() => setActiveTab('settings')}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 active:scale-95">
            <Calendar className="w-3.5 h-3.5" /> Thiết lập
          </button>
        </div>
      )}

      {/* ══ SHARED PLAN BANNER ═══════════════════════════════════════════ */}
      {sharedPlan?.status === 'active' && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-emerald-800">
              Kế hoạch chung {isSharedPlanOwner ? '' : `với ${sharedPlan.ownerName || sharedPlan.ownerEmail}`}
            </p>
            <p className="text-[10px] text-emerald-600">
              {isSharedPlanOwner
                ? `Đang chia sẻ với ${sharedPlan.partnerEmail} · Đồng bộ tự động`
                : 'Bạn đang xem & chỉnh sửa chung · Đồng bộ tự động mỗi 30s'}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex-shrink-0">
            <CheckCircle2 className="w-3 h-3" /> Đã kết nối
          </span>
        </div>
      )}

      {/* ══ 2. MILESTONE TIMELINE ══════════════════════════════════════════ */}
      {milestones.length > 0 && (
        <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-gray-50">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-bold text-gray-800">Lộ trình chuẩn bị</span>
            <span className="text-[10px] text-gray-400">· nhấn vào mốc để xem & quản lý công việc</span>
            <button type="button" onClick={() => setActiveTab('plan')} className="ml-auto text-xs text-rose-500 font-semibold hover:underline flex-shrink-0">
              Xem chi tiết
            </button>
          </div>

          {/* Timeline nodes — horizontal scroll on mobile */}
          <div className="relative px-2 pt-4 pb-3">
            {/* Connecting line */}
            <div className="absolute top-[36px] left-6 right-6 h-0.5 bg-gray-100" />

            <div className="flex gap-0 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {milestones.map(m => {
                const isSelected = activeMsId === m.id;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMs(isSelected ? null : m.id)}
                    className={`
                      flex flex-col items-center flex-shrink-0 min-w-[72px] px-1 py-1 rounded-xl transition-all duration-200 group
                      hover:bg-rose-50 active:scale-95
                      ${isSelected ? 'bg-rose-50 ring-1 ring-rose-200' : ''}
                    `}
                    title={m.label}
                  >
                    {/* Circle */}
                    <div className={`
                      relative z-10 w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200
                      ${m.allDone
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200'
                        : m.isCurrentPeriod
                          ? `${m.color} border-transparent text-white shadow-md scale-110`
                          : m.timePassed
                            ? 'bg-gray-100 border-gray-200 text-gray-400'
                            : 'bg-white border-gray-200 text-gray-300'
                      }
                      ${isSelected && !m.allDone && !m.isCurrentPeriod ? 'ring-2 ring-offset-1 ring-rose-400' : ''}
                    `}>
                      {m.allDone
                        ? <CheckCircle2 className="w-4.5 h-4.5" />
                        : m.isCurrentPeriod
                          ? <Heart className="w-4 h-4" />
                          : m.timePassed
                            ? <Clock className="w-3.5 h-3.5 text-gray-400" />
                            : <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                      }
                    </div>

                    {/* Task progress pill */}
                    {m.totalCnt > 0 && (
                      <div className={`mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        m.allDone ? 'bg-emerald-100 text-emerald-700' :
                        m.isCurrentPeriod ? 'bg-rose-100 text-rose-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {m.doneCnt}/{m.totalCnt}
                      </div>
                    )}

                    {/* Label */}
                    <p className={`text-[9px] font-bold mt-1 leading-tight text-center ${
                      m.allDone ? 'text-emerald-600' :
                      m.isCurrentPeriod ? 'text-rose-600' :
                      isSelected ? 'text-rose-500' : 'text-gray-400'
                    }`}>
                      {m.shortLabel}
                    </p>
                    <p className="text-[8px] text-gray-300 leading-tight">
                      {m.date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Progress bar under timeline */}
            {milestones.length > 0 && (
              <div className="mt-2 mx-2">
                <div className="flex gap-0.5">
                  {milestones.map(m => (
                    <div key={m.id} className="flex-1 h-1 rounded-full overflow-hidden bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          m.allDone ? 'bg-emerald-400' : m.isCurrentPeriod ? 'bg-rose-400' : m.timePassed ? 'bg-gray-300' : 'bg-gray-100'
                        }`}
                        style={{ width: m.totalCnt > 0 ? `${Math.round((m.doneCnt / m.totalCnt) * 100)}%` : '0%' }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Expanded milestone task panel ── */}
          {activeMs && (
            <div className="border-t border-gray-100 bg-gray-50/50">
              {/* Panel header */}
              <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-gray-100`}>
                <div className={`w-2.5 h-2.5 rounded-full ${activeMs.color}`} />
                <span className="text-sm font-bold text-gray-800">{activeMs.label}</span>
                <span className="text-[10px] text-gray-400">— {activeMs.desc}</span>
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                  activeMs.allDone ? 'bg-emerald-100 text-emerald-700' :
                  activeMs.doneCnt > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {activeMs.doneCnt}/{activeMs.totalCnt} hoàn thành
                </span>
              </div>

              {/* Task list */}
              <div className="divide-y divide-gray-100">
                {activeMs.tasks.map(task => {
                  const isExp  = expandedTask === task.id;
                  const isEditing = editingNotes === task.id;
                  return (
                    <div key={task.id} className={`transition-colors ${task.done ? 'bg-emerald-50/40' : 'bg-white'}`}>
                      {/* Task row */}
                      <div className="flex items-start gap-3 px-4 py-2.5 group">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => patchTask(activeMs.id, task.id, { done: !task.done })}
                          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
                            ${task.done
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                            }`}
                        >
                          {task.done && <CheckCircle2 className="w-3 h-3" />}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold leading-snug ${task.done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {task.title}
                          </p>
                          {task.notes && !isExp && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{task.notes}</p>
                          )}

                          {/* Expanded: notes + tips */}
                          {isExp && (
                            <div className="mt-2 space-y-2">
                              {/* Notes */}
                              <div>
                                <p className="text-[10px] font-bold text-gray-500 mb-1">📝 GHI CHÚ</p>
                                {isEditing ? (
                                  <textarea
                                    aria-label="Ghi chú công việc"
                                    className="w-full text-xs text-gray-700 bg-white border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:border-rose-300"
                                    rows={2}
                                    value={task.notes}
                                    onChange={e => patchTask(activeMs.id, task.id, { notes: e.target.value })}
                                    onBlur={() => setEditingNotes(null)}
                                    autoFocus
                                  />
                                ) : (
                                  <p
                                    className="text-xs text-gray-600 bg-white border border-gray-100 rounded-lg px-2.5 py-1.5 cursor-text hover:border-gray-300 transition-colors"
                                    onClick={() => setEditingNotes(task.id)}
                                  >
                                    {task.notes || <span className="text-gray-300 italic">Nhấn để thêm ghi chú...</span>}
                                  </p>
                                )}
                              </div>

                              {/* Tips */}
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <p className="text-[10px] font-bold text-amber-600">💡 MẸO HAY</p>
                                  <button
                                    type="button"
                                    onClick={() => genTip(activeMs.id, task, activeMs.label)}
                                    disabled={!!generatingTip}
                                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-700 font-semibold transition-colors disabled:opacity-50"
                                  >
                                    {generatingTip === task.id
                                      ? <><Loader2 className="w-2.5 h-2.5 animate-spin" /> Đang tạo...</>
                                      : <><Sparkles className="w-2.5 h-2.5" /> AI gợi ý</>
                                    }
                                  </button>
                                  {task.tips && (
                                    <button
                                      type="button"
                                      title="Xóa mẹo"
                                      aria-label="Xóa mẹo AI"
                                      onClick={() => patchTask(activeMs.id, task.id, { tips: '' })}
                                      className="text-[10px] text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                                {task.tips ? (
                                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 leading-relaxed">
                                    {task.tips}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-300 italic px-2.5 py-1">
                                    Nhấn "AI gợi ý" để nhận mẹo cụ thể cho công việc này
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                          <button
                            type="button"
                            onClick={() => { setExpandedTask(isExp ? null : task.id); if (isExp) setEditingNotes(null); }}
                            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                            title={isExp ? 'Thu gọn' : 'Xem ghi chú & mẹo'}
                          >
                            {isExp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTask(activeMs.id, task.id)}
                            className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Xóa công việc"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add task */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <input
                    ref={addInputRef}
                    type="text"
                    placeholder="+ Thêm công việc cho giai đoạn này..."
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTask(activeMs.id)}
                    className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-rose-300 placeholder-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => addTask(activeMs.id)}
                    disabled={!newTitle.trim()}
                    className="flex items-center gap-1 px-3 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-100 text-white disabled:text-gray-400 text-xs font-bold rounded-xl transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                </div>
                {aiKeyWarning && !settings.geminiApiKey && (
                  <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 animate-fadeIn">
                    <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-amber-800">Cần cấu hình API Key</p>
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        Vào <button type="button" onClick={() => setActiveTab('settings')} className="text-violet-600 font-bold underline hover:text-violet-800">Cài đặt</button> → nhập Gemini API Key để sử dụng tính năng AI gợi ý.
                      </p>
                    </div>
                    <button type="button" onClick={() => setAiKeyWarning(false)} className="p-1 text-amber-400 hover:text-amber-600 rounded transition-colors" aria-label="Đóng">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ 3. STATS ROW — 6 cards ═════════════════════════════════════════ */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          {
            label: 'Tổng ngân sách', value: fmtMoney(stats.totalBudget),
            sub: `${totalItems} hạng mục`, icon: Wallet, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600',
            onClick: () => setActiveTab('budget'),
          },
          {
            label: 'Đã chi tiêu', value: fmtMoney(stats.totalActual),
            sub: spentPct > 100 ? '⚠️ Vượt ngân sách!' : `${spentPct}% ngân sách`,
            icon: Banknote, iconBg: spentPct > 100 ? 'bg-red-50' : 'bg-blue-50',
            iconColor: spentPct > 100 ? 'text-red-500' : 'text-blue-600',
            onClick: () => setActiveTab('budget'),
          },
          {
            label: 'Còn cần chi', value: fmtMoney(Math.max(remaining, 0)),
            sub: remaining < 0 ? `Thiếu ${fmtMoney(-remaining)}` : `${100 - spentPct}% còn lại`,
            icon: Target, iconBg: remaining < 0 ? 'bg-red-50' : 'bg-violet-50',
            iconColor: remaining < 0 ? 'text-red-500' : 'text-violet-600',
            onClick: () => setActiveTab('budget'),
          },
          {
            label: 'Tổng khách mời', value: `${stats.totalGuests}`,
            sub: `${confirmedCount} xác nhận cao`,
            icon: Users, iconBg: 'bg-sky-50', iconColor: 'text-sky-600',
            onClick: () => setActiveTab('guests'),
          },
          {
            label: 'Quà phong bì', value: fmtMoney(expectedEnvelope),
            sub: 'Dự kiến nhận',
            icon: Gift, iconBg: 'bg-pink-50', iconColor: 'text-pink-600',
            onClick: () => setActiveTab('guests'),
          },
          {
            label: 'Cảnh báo', value: `${overdueList.length}`,
            sub: overdueList.length > 0 ? 'hạng mục quá hạn' : 'Không có cảnh báo ✓',
            icon: AlertTriangle,
            iconBg: overdueList.length > 0 ? 'bg-red-50' : 'bg-gray-50',
            iconColor: overdueList.length > 0 ? 'text-red-500' : 'text-gray-400',
            onClick: () => setActiveTab('budget'),
          },
        ].map(({ label, value, sub, icon: Icon, iconBg, iconColor, onClick }) => (
          <button key={label} type="button" title={label} onClick={onClick}
            className="bg-white rounded-xl border border-gray-100 p-3 text-left hover:shadow-md hover:border-rose-200 transition-all group active:scale-95">
            <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center mb-2`}>
              <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-tight">{label}</p>
            <p className="text-base font-black text-gray-900 leading-tight mt-0.5">{value}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
          </button>
        ))}
      </div>

      {/* ══ 4. MAIN GRID ═══════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        {/* ── LEFT 2/3: Alerts + Upcoming budget tasks ── */}
        <div className="lg:col-span-2 space-y-3">

          {/* Overdue */}
          {overdueList.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-red-100">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-bold text-red-700">Quá hạn — cần xử lý ngay ({overdueList.length})</span>
              </div>
              <div className="divide-y divide-red-100">
                {overdueList.slice(0, 4).map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 bg-white/60 group">
                    <button type="button" title="Đánh dấu hoàn thành" aria-label="Đánh dấu hoàn thành" onClick={() => updateBudgetItem(item.id, 'status', TaskStatus.DONE)}
                      className="w-5 h-5 rounded border-2 border-red-300 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 transition-all flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-transparent group-hover:text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.itemName}</p>
                      <p className="text-xs text-red-500">Hạn: {new Date(item.deadline!).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <span className="text-xs font-bold text-gray-500 flex-shrink-0">{fmtMoney(item.estimatedCost)}</span>
                  </div>
                ))}
                {overdueList.length > 4 && (
                  <button type="button" onClick={() => setActiveTab('budget')} className="w-full py-2 text-xs text-red-600 font-semibold hover:bg-red-100 transition-colors">
                    Xem thêm {overdueList.length - 4} mục...
                  </button>
                )}
              </div>
            </div>
          )}

          {/* This week */}
          {thisWeekList.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-100">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-700">Tuần này cần làm ({thisWeekList.length})</span>
              </div>
              <div className="divide-y divide-amber-100">
                {thisWeekList.slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 bg-white/60 group">
                    <button type="button" title="Đánh dấu hoàn thành" aria-label="Đánh dấu hoàn thành" onClick={() => updateBudgetItem(item.id, 'status', TaskStatus.DONE)}
                      className="w-5 h-5 rounded border-2 border-amber-300 flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-500 transition-all flex-shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-transparent group-hover:text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.itemName}</p>
                      <p className="text-xs text-amber-600">
                        {item.category} · {new Date(item.deadline!).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gray-500 flex-shrink-0">{fmtMoney(item.estimatedCost)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming budget tasks */}
          {upcomingItems.length > 0 ? (
            <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-500" />
                  <span className="text-sm font-bold text-gray-800">Hạng mục ngân sách sắp đến hạn</span>
                </div>
                <button type="button" onClick={() => setActiveTab('budget')} className="text-xs text-rose-500 font-semibold hover:underline">
                  Xem tất cả
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {upcomingItems.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 group hover:bg-rose-50/30 transition-colors">
                    <button type="button" title="Đánh dấu hoàn thành" aria-label="Đánh dấu hoàn thành" onClick={() => updateBudgetItem(item.id, 'status', TaskStatus.DONE)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0
                        ${idx === 0 ? 'border-rose-400' : 'border-gray-300'} hover:bg-emerald-500 hover:border-emerald-500`}>
                      <CheckCircle2 className="w-3 h-3 text-transparent group-hover:text-white" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.itemName}</p>
                      <p className="text-[10px] text-gray-400">
                        {item.category}{item.deadline ? ` · ${new Date(item.deadline).toLocaleDateString('vi-VN')}` : ''}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gray-600 flex-shrink-0">{fmtMoney(item.estimatedCost)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : totalItems === 0 ? (
            <div className="bg-white border border-rose-100 rounded-2xl p-6 text-center">
              <Wallet className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-500 mb-1">Chưa có hạng mục ngân sách</p>
              <p className="text-xs text-gray-400 mb-3">Thêm hạng mục để theo dõi chi tiêu và tiến độ</p>
              <button type="button" onClick={() => setActiveTab('budget')}
                className="px-4 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition-colors">
                Thêm ngay
              </button>
            </div>
          ) : null}
        </div>

        {/* ── RIGHT 1/3: Team + Budget categories ── */}
        <div className="space-y-3">
          
          {/* Team */}
          <div className="bg-white border border-rose-100 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <HeartHandshake className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-bold text-gray-800">Đội nhóm</span>
            </div>
            {sharedPlan?.status === 'active' ? (
              <div className="space-y-1.5">
                {[
                  { name: user?.displayName || 'Bạn', role: 'Chủ kế hoạch', avatarBg: 'bg-emerald-200', avatarColor: 'text-emerald-700', rowBg: 'bg-emerald-50 border-emerald-100' },
                  { name: user?.partnerName || 'Người bạn đời', role: 'Đang theo dõi', avatarBg: 'bg-blue-200', avatarColor: 'text-blue-700', rowBg: 'bg-blue-50 border-blue-100' },
                ].map(p => (
                  <div key={p.role} className={`flex items-center gap-2 p-2 rounded-xl border ${p.rowBg}`}>
                    <div className={`w-7 h-7 rounded-full ${p.avatarBg} flex items-center justify-center ${p.avatarColor} font-bold text-xs flex-shrink-0`}>
                      {p.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-500">{p.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-400 mb-2">Mời người thân cùng theo dõi kế hoạch cưới</p>
                <button type="button" onClick={() => setActiveTab('settings')}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-colors border border-rose-100">
                  + Chia sẻ kế hoạch
                </button>
              </div>
            )}
          </div>

          {/* Budget by category */}
          {categoryRows.length > 0 && (
            <div className="bg-white border border-rose-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-gray-800">Chi phí theo hạng mục</span>
                </div>
                <button type="button" onClick={() => setActiveTab('budget')} className="text-xs text-rose-500 font-semibold hover:underline">Chi tiết</button>
              </div>
              <div className="space-y-2">
                {categoryRows.map(([cat, cost]) => (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-0.5">
                      <p className="text-xs text-gray-600 font-medium truncate max-w-[60%]">{cat}</p>
                      <p className="text-xs font-bold text-gray-700">{fmtMoney(cost)}</p>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((cost / maxCatCost) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
