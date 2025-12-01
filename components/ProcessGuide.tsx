
import React, { useState, useMemo } from 'react';
import { WeddingRegion, ProcedureStep } from '../types';
import { useStore } from '../store/useStore';
import Timeline from './process/Timeline';
import ProcedureDetail from './process/ProcedureDetail';
import { Map, Plus, Trash2, RotateCcw } from 'lucide-react';

const ProcessGuide: React.FC = () => {
  const { procedures, user, addProcedure, deleteProcedure, resetProcedures } = useStore();
  const [region, setRegion] = useState<WeddingRegion>('NORTH');
  const [selectedStepId, setSelectedStepId] = useState<string>('');

  // Get procedures from store instead of constant
  const currentProcedures = useMemo(() => procedures[region] || [], [procedures, region]);

  // Auto-select first step on region change or if empty selection
  useMemo(() => {
    if (currentProcedures.length > 0) {
      // Only if ID not found or empty
      if (!selectedStepId || !currentProcedures.find(p => p.id === selectedStepId)) {
        setSelectedStepId(currentProcedures[0].id);
      }
    } else {
      setSelectedStepId('');
    }
  }, [currentProcedures, region]); // Remove selectedStepId from dep array to avoid loops

  const currentStep = currentProcedures.find(p => p.id === selectedStepId) || currentProcedures[0];

  const handleAddStep = () => {
    const newStep: ProcedureStep = {
      id: `custom-step-${Date.now()}`,
      title: "Quy trình mới",
      description: "Mô tả ngắn gọn về quy trình này...",
      meaning: "Ý nghĩa của nghi lễ...",
      participants: "Thành phần tham dự...",
      offerings: ["Vật phẩm 1", "Vật phẩm 2"],
      taboos: ["Kiêng kỵ 1"],
      tips: ["Mẹo hay 1"],
      scriptSuggestion: "Lời phát biểu mẫu...",
      tasks: []
    };
    addProcedure(region, newStep);
    setSelectedStepId(newStep.id);
  };

  const handleDeleteStep = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa quy trình này không?")) {
      deleteProcedure(region, id);
      // Reset selection will happen via useMemo effect
    }
  };

  const handleReset = () => {
    if (confirm("Khôi phục toàn bộ quy trình về mặc định? Mọi chỉnh sửa sẽ bị mất.")) {
      resetProcedures();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row lg:h-full bg-[#FDF2F8] lg:overflow-hidden rounded-xl lg:rounded-none lg:shadow-none shadow-sm border border-rose-100 lg:border-none m-0 lg:m-0">

      {/* --- SIDEBAR (Timeline) --- */}
      <div className="w-full lg:w-80 bg-white border-b lg:border-b-0 lg:border-r border-rose-100 flex flex-col flex-shrink-0 z-20">

        {/* Header & Region Selector */}
        <div className="p-3 md:p-4 border-b border-rose-50 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="bg-rose-100 p-2 rounded-lg text-rose-600">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-gray-800">Lộ Trình Cưới</h2>
                <p className="text-[10px] md:text-xs text-gray-500">Quy trình {region === 'NORTH' ? 'Miền Bắc' : region === 'CENTRAL' ? 'Miền Trung' : 'Miền Nam'}</p>
              </div>
            </div>

            {/* Reset Button - Available to everyone */}
            <button
              onClick={handleReset}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Khôi phục mặc định"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Region Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-lg mb-2">
            {(['NORTH', 'CENTRAL', 'SOUTH'] as WeddingRegion[]).map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${region === r
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                  }`}
              >
                {r === 'NORTH' ? 'Bắc' : r === 'CENTRAL' ? 'Trung' : 'Nam'}
              </button>
            ))}
          </div>

          {/* Add Button - Available to everyone */}
          <button
            onClick={handleAddStep}
            className="w-full flex items-center justify-center gap-1 py-2 border-2 border-dashed border-rose-200 text-rose-500 rounded-lg hover:bg-rose-50 hover:border-rose-300 transition-all text-xs font-bold"
          >
            <Plus className="w-4 h-4" /> Thêm quy trình mới
          </button>
        </div>

        {/* Timeline Component - Responsive Container */}
        <div className="flex-1 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto">
          {currentProcedures.length > 0 ? (
            <Timeline
              steps={currentProcedures}
              selectedStepId={selectedStepId}
              onSelectStep={(step) => setSelectedStepId(step.id)}
            />
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">Chưa có quy trình nào.</div>
          )}
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="lg:flex-1 lg:overflow-y-auto bg-white lg:bg-[#FDF2F8] relative min-h-[400px]">
        {currentStep ? (
          <div className="h-full flex flex-col">
            {/* Delete Button - Available to everyone */}
            <div className="absolute top-4 right-4 z-50">
              <button
                onClick={() => handleDeleteStep(currentStep.id)}
                className="bg-white text-gray-400 hover:text-red-500 border border-gray-200 hover:border-red-200 p-2 rounded-lg shadow-sm transition-all"
                title="Xóa quy trình này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <ProcedureDetail step={currentStep} region={region} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-2">
            <Map className="w-10 h-10 opacity-20" />
            <p>Chọn một bước để xem chi tiết</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessGuide;
