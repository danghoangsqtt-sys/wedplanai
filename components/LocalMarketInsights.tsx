
import React, { useState, useCallback } from 'react';
import {
  MapPin, Loader2, RefreshCw, ChevronDown, ChevronUp,
  TrendingUp, CheckCircle2, AlertCircle, Sparkles,
  DollarSign, Clock, Info, BarChart3, ArrowRight
} from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  VIETNAM_PROVINCES, MARKET_CATEGORIES,
  detectLocation, generateLocalMarketReport
} from '../services/localMarketService';
import { LocalMarketReport, LocalMarketSection } from '../types';

const fmt = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} triệu`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return n.toLocaleString('vi-VN');
};

const REGION_LABELS: Record<string, string> = {
  NORTH: '🌿 Miền Bắc', CENTRAL: '🏖️ Miền Trung', SOUTH: '🌴 Miền Nam'
};
const ECON_LABELS: Record<string, { label: string; color: string }> = {
  HIGH: { label: 'Mức cao', color: 'text-purple-600 bg-purple-50' },
  MID: { label: 'Mức trung bình', color: 'text-blue-600 bg-blue-50' },
  LOW: { label: 'Mức thấp hơn', color: 'text-green-600 bg-green-50' },
};

// --- Single section card ---
const SectionCard: React.FC<{ section: LocalMarketSection; isOpen: boolean; onToggle: () => void }> = ({ section, isOpen, onToggle }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-2xl flex-shrink-0">{section.emoji}</span>
        <div className="min-w-0">
          <p className="font-bold text-gray-800 text-sm truncate">{section.label}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            <span className="text-rose-600 font-semibold">{fmt(section.avgLow)}</span>
            <span className="mx-1 opacity-50">–</span>
            <span className="text-rose-600 font-semibold">{fmt(section.avgHigh)}</span>
            <span className="ml-1 opacity-60">{section.priceNote}</span>
          </p>
        </div>
      </div>
      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
    </button>

    {isOpen && (
      <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">{section.summary}</p>

        {/* Items table */}
        <div className="space-y-2">
          {section.items.map((item, i) => (
            <div key={i} className="rounded-lg bg-gray-50 p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-semibold text-sm text-gray-800">{item.name}</span>
                <span className="text-rose-600 font-bold text-sm whitespace-nowrap flex-shrink-0">{item.priceRange}</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
              {item.tips && (
                <p className="text-xs text-amber-700 mt-1.5 flex items-start gap-1">
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{item.tips}</span>
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Budget recommendation */}
        <div className="rounded-lg bg-rose-50 border border-rose-100 p-3 flex items-start gap-2">
          <DollarSign className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">Đề xuất ngân sách</p>
            <p className="text-base font-bold text-rose-600 mt-0.5">{fmt(section.budgetRecommendation.estimatedCost)}</p>
            <p className="text-xs text-rose-600 opacity-80 mt-0.5">{section.budgetRecommendation.note}</p>
          </div>
        </div>
      </div>
    )}
  </div>
);

// --- Budget apply modal ---
const BudgetApplyModal: React.FC<{
  report: LocalMarketReport;
  onClose: () => void;
  onApply: (sectionIds: string[]) => void;
}> = ({ report, onClose, onApply }) => {
  const [selected, setSelected] = useState<string[]>(report.sections.map(s => s.id));
  const { budgetItems } = useStore();

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">Áp dụng giá địa phương vào Ngân sách</h3>
          <p className="text-sm text-gray-500 mt-1">Chọn danh mục muốn cập nhật ước tính theo mức giá tại <strong>{report.province}</strong></p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {report.sections.map(section => {
            const currentTotal = budgetItems
              .filter(b => section.budgetCategories.includes(b.category))
              .reduce((sum, b) => sum + b.estimatedCost, 0);
            const recommended = section.budgetRecommendation.estimatedCost;
            const diff = recommended - currentTotal;
            const isSelected = selected.includes(section.id);

            return (
              <label key={section.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-rose-300 bg-rose-50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggle(section.id)}
                  className="w-4 h-4 accent-rose-500 flex-shrink-0"
                />
                <span className="text-xl flex-shrink-0">{section.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{section.label}</p>
                  <div className="flex items-center gap-2 text-xs mt-0.5">
                    <span className="text-gray-400">Hiện: {currentTotal > 0 ? fmt(currentTotal) : 'Chưa có'}</span>
                    <ArrowRight className="w-3 h-3 text-gray-300" />
                    <span className="text-rose-600 font-bold">{fmt(recommended)}</span>
                    {diff !== 0 && currentTotal > 0 && (
                      <span className={`font-semibold ${diff > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                        ({diff > 0 ? '+' : ''}{fmt(diff)})
                      </span>
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onApply(selected)}
            disabled={selected.length === 0}
            className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Áp dụng {selected.length} danh mục
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================
interface Props {
  onNavigateBudget?: () => void;
}

const LocalMarketInsights: React.FC<Props> = ({ onNavigateBudget }) => {
  const {
    user, localProvince, localDistrict, localMarketReport,
    setLocalProvince, setLocalDistrict, setLocalMarketReport,
    budgetItems, updateBudgetItem, addNotification
  } = useStore();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(MARKET_CATEGORIES.map(c => c.id));
  const [isDetecting, setIsDetecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const handleAutoDetect = useCallback(async () => {
    setIsDetecting(true);
    try {
      const location = await detectLocation();
      if (location.province) {
        setLocalProvince(location.province);
        if (location.district) {
          setLocalDistrict(location.district);
          addNotification('SUCCESS', `Đã xác định vị trí: ${location.district}, ${location.province}`);
        } else {
          addNotification('SUCCESS', `Đã xác định vị trí: ${location.province}. Bạn có thể nhập quận/huyện thủ công.`);
        }
      } else {
        addNotification('WARNING', 'Không thể xác định vị trí. Vui lòng chọn tỉnh/thành phố thủ công.');
      }
    } catch {
      addNotification('ERROR', 'Lỗi xác định vị trí.');
    } finally {
      setIsDetecting(false);
    }
  }, [setLocalProvince, setLocalDistrict, addNotification]);

  const handleGenerate = useCallback(async () => {
    if (!localProvince) { addNotification('WARNING', 'Vui lòng chọn tỉnh/thành phố.'); return; }
    if (selectedCategories.length === 0) { addNotification('WARNING', 'Vui lòng chọn ít nhất một danh mục.'); return; }
    if (!user) { addNotification('ERROR', 'Vui lòng đăng nhập.'); return; }

    setIsGenerating(true);
    try {
      const newReport = await generateLocalMarketReport(localProvince, selectedCategories, user, localDistrict || undefined);
      setLocalMarketReport(newReport);
      setOpenSections([newReport.sections[0]?.id ?? '']);
      const locLabel = localDistrict ? `${localDistrict}, ${localProvince}` : localProvince;
      addNotification('SUCCESS', `Đã tổng hợp & lưu dữ liệu thị trường ${locLabel}!`);
    } catch (err: any) {
      addNotification('ERROR', err.message || 'Lỗi tạo báo cáo. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  }, [localProvince, localDistrict, selectedCategories, user, setLocalMarketReport, addNotification]);

  const toggleSection = (id: string) =>
    setOpenSections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleCategory = (id: string) =>
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleApplyBudget = useCallback((sectionIds: string[]) => {
    if (!localMarketReport) return;
    let updatedCount = 0;

    for (const sid of sectionIds) {
      const section = localMarketReport.sections.find(s => s.id === sid);
      if (!section) continue;
      const recommended = section.budgetRecommendation.estimatedCost;
      const matchingItems = budgetItems.filter(b => section.budgetCategories.includes(b.category));
      if (!matchingItems.length) continue;

      const currentTotal = matchingItems.reduce((sum, b) => sum + b.estimatedCost, 0);
      if (currentTotal === 0) {
        // Just update the first item
        updateBudgetItem(matchingItems[0].id, 'estimatedCost', recommended);
      } else {
        // Scale each item proportionally
        const ratio = recommended / currentTotal;
        for (const item of matchingItems) {
          updateBudgetItem(item.id, 'estimatedCost', Math.round(item.estimatedCost * ratio));
        }
      }
      updatedCount++;
    }

    setShowBudgetModal(false);
    addNotification('SUCCESS', `Đã cập nhật ${updatedCount} danh mục ngân sách theo giá ${localMarketReport.province}.`);
    if (updatedCount > 0) onNavigateBudget?.();
  }, [localMarketReport, budgetItems, updateBudgetItem, addNotification, onNavigateBudget]);

  const report = localMarketReport;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-6 h-6" />
          <h2 className="text-xl font-bold">Thị Trường Cưới Địa Phương</h2>
        </div>
        <p className="text-sm opacity-90 leading-relaxed">
          Tổng hợp giá dịch vụ, nhà cung cấp và đề xuất ngân sách phù hợp với từng tỉnh/thành phố trên khắp Việt Nam — được cập nhật theo AI thời gian thực.
        </p>
      </div>

      {/* Step 1: Province */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
          <h3 className="font-bold text-gray-800">Chọn tỉnh / thành phố</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={isDetecting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold hover:bg-rose-100 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            {isDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {isDetecting ? 'Đang xác định...' : 'Tự động xác định vị trí'}
          </button>
          <select
            value={localProvince}
            onChange={e => { setLocalProvince(e.target.value); setLocalDistrict(''); }}
            title="Chọn tỉnh/thành phố"
            aria-label="Chọn tỉnh/thành phố"
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-700"
          >
            <option value="">— Chọn tỉnh/thành phố —</option>
            {VIETNAM_PROVINCES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* District input */}
        {localProvince && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Quận / Huyện / Thị xã <span className="text-gray-400">(tùy chọn — cho kết quả chi tiết hơn)</span></label>
            <input
              type="text"
              value={localDistrict}
              onChange={e => setLocalDistrict(e.target.value)}
              placeholder={`VD: Quận 1, Huyện Bình Chánh, TP. Thủ Đức...`}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-700 placeholder-gray-400"
            />
          </div>
        )}

        {localProvince && (
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Đã chọn: <strong>{localDistrict ? `${localDistrict}, ${localProvince}` : localProvince}</strong></span>
          </div>
        )}
      </div>

      {/* Step 2: Categories */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
            <h3 className="font-bold text-gray-800">Chọn danh mục cần tra cứu</h3>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCategories(
              selectedCategories.length === MARKET_CATEGORIES.length ? [] : MARKET_CATEGORIES.map(c => c.id)
            )}
            className="text-xs text-rose-500 font-semibold hover:underline"
          >
            {selectedCategories.length === MARKET_CATEGORIES.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {MARKET_CATEGORIES.map(cat => {
            const active = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${active
                  ? 'bg-rose-500 border-rose-500 text-white shadow-sm'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-600'
                  }`}
              >
                <span className="text-base flex-shrink-0">{cat.emoji}</span>
                <span className="leading-tight text-left">{cat.label}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-gray-400">Đã chọn {selectedCategories.length}/{MARKET_CATEGORIES.length} danh mục</p>
      </div>

      {/* Step 3: Generate */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
          <h3 className="font-bold text-gray-800">Tạo báo cáo thị trường</h3>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !localProvince || selectedCategories.length === 0}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-sm shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
        >
          {isGenerating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Đang phân tích thị trường {localProvince}...</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Tổng hợp thị trường cưới tại {localProvince || '...'}</>
          )}
        </button>
        {isGenerating && (
          <p className="text-center text-xs text-gray-400 mt-3 animate-pulse">
            AI đang tổng hợp giá dịch vụ, nhà cung cấp và đề xuất ngân sách tại {localProvince}... (~20-30 giây)
          </p>
        )}
      </div>

      {/* Report */}
      {report && (
        <div className={`relative space-y-3 transition-opacity duration-300 ${isGenerating ? 'opacity-50 pointer-events-none select-none' : ''}`}>
          {isGenerating && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
              <p className="text-sm font-semibold text-rose-600 animate-pulse bg-white/90 px-4 py-2 rounded-xl shadow">
                Đang cập nhật dữ liệu thị trường {localProvince}...
              </p>
            </div>
          )}
          <>
          {/* Overview */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">
                  <BarChart3 className="inline w-5 h-5 mr-2 text-rose-500" />
                  Báo cáo thị trường: {report.province}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-xs text-gray-400">
                    Tổng hợp lúc {new Date(report.generatedAt).toLocaleString('vi-VN')}
                  </p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold border border-emerald-100">
                    ✓ Đã lưu cục bộ
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                title="Cập nhật lại"
                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                {REGION_LABELS[report.region] ?? report.region}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ECON_LABELS[report.economicLevel]?.color ?? 'text-gray-600 bg-gray-100'}`}>
                💰 {ECON_LABELS[report.economicLevel]?.label ?? report.economicLevel}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> {report.bestTimeToBook}
              </span>
            </div>

            {/* General tips */}
            {report.generalTips?.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Lưu ý chung tại {report.province}</p>
                <ul className="space-y-1.5">
                  {report.generalTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-blue-700">
                      <span className="flex-shrink-0 mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Sections */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-700 text-sm uppercase tracking-wide px-1">
              Chi tiết theo danh mục ({report.sections.length})
            </h4>
            {report.sections.map(section => (
              <SectionCard
                key={section.id}
                section={section}
                isOpen={openSections.includes(section.id)}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
          </div>

          {/* Budget summary + apply */}
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-gray-900">Tóm tắt ngân sách đề xuất</h4>
                <p className="text-xs text-gray-500 mt-0.5">Dựa trên mức giá thực tế tại {report.province}</p>
              </div>
              <span className="text-2xl font-black text-rose-600">
                {fmt(report.sections.reduce((s, sec) => s + sec.budgetRecommendation.estimatedCost, 0))}
              </span>
            </div>
            <div className="space-y-2 mb-4">
              {report.sections.map(section => (
                <div key={section.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <span>{section.emoji}</span>
                    <span className="truncate max-w-[180px]">{section.label}</span>
                  </span>
                  <span className="font-bold text-gray-800 flex-shrink-0">{fmt(section.budgetRecommendation.estimatedCost)}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowBudgetModal(true)}
                className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                Áp dụng vào Ngân sách
              </button>
              {onNavigateBudget && (
                <button
                  type="button"
                  onClick={onNavigateBudget}
                  className="flex-1 py-3 rounded-xl border-2 border-rose-300 text-rose-600 font-bold text-sm hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  Xem Ngân sách
                </button>
              )}
            </div>
          </div>
          </>
        </div>
      )}

      {/* Empty state */}
      {!report && !isGenerating && (
        <div className="text-center py-16 text-gray-400">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Chọn tỉnh/thành phố và tạo báo cáo để xem thông tin thị trường cưới địa phương</p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left">
            {['Giá dịch vụ sát thực tế từng vùng', 'So sánh & áp dụng vào ngân sách', 'Mẹo tiết kiệm theo địa phương', 'Thời điểm đặt dịch vụ tốt nhất', 'Đặc điểm thị trường từng tỉnh', 'Kết nối trực tiếp với Kế hoạch'].map(f => (
              <div key={f} className="flex items-start gap-2 bg-white/60 rounded-xl p-3 border border-gray-100">
                <AlertCircle className="w-4 h-4 text-rose-300 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-500">{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Budget modal */}
      {showBudgetModal && report && (
        <BudgetApplyModal
          report={report}
          onClose={() => setShowBudgetModal(false)}
          onApply={handleApplyBudget}
        />
      )}
    </div>
  );
};

export default LocalMarketInsights;
