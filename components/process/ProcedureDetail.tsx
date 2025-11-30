
import React, { useState, useEffect } from 'react';
import { ProcedureStep, WeddingRegion, TaskStatus } from '../../types';
import { useStore } from '../../store/useStore';
import { getCulturalAdvice } from '../../services/geminiService';
import { 
  Users, Gift, ScrollText, Mic, Copy, 
  Check, Loader2, BookOpen,
  ListTodo, AlertTriangle, Lightbulb, Sparkles, CheckSquare, Square, PlusCircle
} from 'lucide-react';

interface ProcedureDetailProps {
  step: ProcedureStep;
  region: WeddingRegion;
}

type TabType = 'INFO' | 'CHECKLIST' | 'SPEECH';

const ProcedureDetail: React.FC<ProcedureDetailProps> = ({ step, region }) => {
  const { addBudgetItem } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('INFO');
  
  // AI State
  const [aiContent, setAiContent] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Checklist State
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<Set<number>>(new Set());
  const [justAdded, setJustAdded] = useState(false);

  // Reset state when step changes
  useEffect(() => {
    setAiContent(null);
    // Default select all tasks that are not clearly "Done"
    setSelectedTaskIndices(new Set(step.tasks.map((_, i) => i))); 
    setActiveTab('INFO');
  }, [step.id]);

  const toggleTask = (index: number) => {
    const newSet = new Set(selectedTaskIndices);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedTaskIndices(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedTaskIndices.size === step.tasks.length) {
      setSelectedTaskIndices(new Set());
    } else {
      setSelectedTaskIndices(new Set(step.tasks.map((_, i) => i)));
    }
  };

  const handleAddSelectedTasks = () => {
    const tasksToAdd = step.tasks.filter((_, index) => selectedTaskIndices.has(index));
    
    if (tasksToAdd.length === 0) {
      alert("Vui lòng chọn ít nhất một công việc để thêm.");
      return;
    }

    if (confirm(`Thêm ${tasksToAdd.length} công việc này vào Ngân sách?`)) {
      tasksToAdd.forEach(t => {
        addBudgetItem({
          id: Date.now().toString() + Math.random(),
          category: t.category,
          itemName: t.itemName,
          estimatedCost: t.estimatedCost,
          actualCost: 0,
          status: TaskStatus.PENDING,
          assignee: t.assignee,
          side: t.side,
          note: `Từ quy trình: ${step.title}`
        });
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 3000);
    }
  };

  const handleGetSpeech = async () => {
    setLoadingAi(true);
    try {
      const speech = await getCulturalAdvice(region, step.title, 'SPEECH');
      setAiContent(speech);
    } catch (error) {
      setAiContent("Lỗi khi kết nối AI. Vui lòng kiểm tra API Key.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white md:rounded-xl shadow-sm border-t md:border border-rose-100 overflow-hidden transition-all duration-300">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* 1. Header with Tabs */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-rose-50/50 to-white flex-shrink-0">
         <div className="p-4 md:p-6 pb-2 md:pb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex flex-wrap items-center gap-2">
               {step.title}
               <span className="text-xs font-normal text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Miền {region === 'NORTH' ? 'Bắc' : region === 'CENTRAL' ? 'Trung' : 'Nam'}
               </span>
            </h2>
            <p className="text-gray-600 mt-2 text-xs md:text-sm leading-relaxed max-w-2xl line-clamp-2 md:line-clamp-none">{step.description}</p>
         </div>
         
         {/* Custom Tabs */}
         <div className="flex px-4 md:px-6 gap-6 md:gap-8 overflow-x-auto no-scrollbar">
            <button 
               onClick={() => setActiveTab('INFO')}
               className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'INFO' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
               <BookOpen className="w-4 h-4" /> Cẩm Nang
            </button>
            <button 
               onClick={() => setActiveTab('CHECKLIST')}
               className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'CHECKLIST' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
               <ListTodo className="w-4 h-4" /> Việc Cần Làm <span className="bg-gray-100 text-gray-600 px-1.5 rounded-full text-[10px]">{step.tasks.length}</span>
            </button>
            <button 
               onClick={() => setActiveTab('SPEECH')}
               className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'SPEECH' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
               <Sparkles className="w-4 h-4" /> Trợ Lý Lời Hay
            </button>
         </div>
      </div>

      {/* 2. Content Area */}
      <div className="p-4 md:p-6 bg-white flex-1 overflow-y-auto">
         
         {/* --- TAB 1: CẨM NANG --- */}
         {activeTab === 'INFO' && (
            <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Meaning */}
                  <div className="bg-white p-4 md:p-5 rounded-xl border border-blue-100 shadow-[0_2px_8px_rgba(59,130,246,0.05)]">
                     <div className="flex items-start gap-3 mb-4">
                        <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                           <ScrollText className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="font-bold text-gray-800 text-base">Ý nghĩa & Thành phần</h3>
                           <p className="text-xs text-gray-400">Những điều cốt lõi</p>
                        </div>
                     </div>
                     <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                        <div className="bg-blue-50/50 p-3 rounded-lg">
                           <span className="font-bold text-blue-800 block mb-1">Ý nghĩa:</span>
                           {step.meaning}
                        </div>
                        <div>
                           <span className="font-bold text-gray-700 block mb-1">Thành phần tham dự:</span>
                           {step.participants}
                        </div>
                     </div>
                  </div>

                  {/* Offerings */}
                  <div className="bg-white p-4 md:p-5 rounded-xl border border-rose-100 shadow-[0_2px_8px_rgba(244,63,94,0.05)]">
                     <div className="flex items-start gap-3 mb-4">
                        <div className="bg-rose-50 p-2 rounded-lg text-rose-600">
                           <Gift className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="font-bold text-gray-800 text-base">Sính lễ & Vật phẩm</h3>
                           <p className="text-xs text-gray-400">Chuẩn bị chu đáo</p>
                        </div>
                     </div>
                     <ul className="space-y-2">
                        {step.offerings.map((item, idx) => (
                           <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 p-2 rounded hover:bg-rose-50 transition-colors">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 mt-1.5"></span>
                              <span>{item}</span>
                           </li>
                        ))}
                     </ul>
                  </div>
               </div>

               {/* Taboos Alert (Red Highlight) */}
               {step.taboos && step.taboos.length > 0 && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4 md:p-5 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <AlertTriangle className="w-24 h-24" />
                     </div>
                     <h3 className="flex items-center gap-2 font-bold text-red-800 mb-3 text-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        Điều Kiêng Kỵ
                     </h3>
                     <ul className="space-y-2 relative z-10">
                        {step.taboos.map((t, i) => (
                           <li key={i} className="flex items-start gap-2 text-red-700 text-sm">
                              <span className="text-red-400 font-bold">•</span>
                              {t}
                           </li>
                        ))}
                     </ul>
                  </div>
               )}

               {/* Tips (Green Highlight) */}
               {step.tips && step.tips.length > 0 && (
                  <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl p-4 md:p-5 shadow-sm">
                     <h3 className="flex items-center gap-2 font-bold text-emerald-800 mb-3 text-lg">
                        <Lightbulb className="w-5 h-5 text-emerald-600" />
                        Mẹo Hay Tổ Chức
                     </h3>
                     <ul className="space-y-2">
                        {step.tips.map((t, i) => (
                           <li key={i} className="flex items-start gap-2 text-emerald-700 text-sm">
                              <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              {t}
                           </li>
                        ))}
                     </ul>
                  </div>
               )}
            </div>
         )}

         {/* --- TAB 2: CHECKLIST --- */}
         {activeTab === 'CHECKLIST' && (
            <div className="max-w-3xl mx-auto h-full flex flex-col">
               <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
                  
                  {/* Checklist Header */}
                  <div className="p-3 md:p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                     <div className="flex items-center gap-3">
                        <button 
                           onClick={toggleSelectAll}
                           className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-rose-600 transition-colors p-1"
                        >
                           {selectedTaskIndices.size === step.tasks.length ? (
                              <CheckSquare className="w-5 h-5 text-rose-500" />
                           ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                           )}
                           <span className="hidden sm:inline">Chọn tất cả</span>
                           <span className="sm:hidden">Tất cả</span>
                        </button>
                     </div>
                     <div className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm whitespace-nowrap">
                        Đã chọn: <span className="text-rose-600 font-bold text-sm">{selectedTaskIndices.size}</span>
                     </div>
                  </div>
                  
                  {/* Checklist Items */}
                  <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
                     {step.tasks.map((task, index) => {
                        const isSelected = selectedTaskIndices.has(index);
                        return (
                           <div 
                              key={index} 
                              className={`p-3 md:p-4 flex items-start gap-3 md:gap-4 transition-all cursor-pointer group hover:bg-rose-50/20 active:bg-rose-50/30 ${isSelected ? 'bg-rose-50/10' : ''}`}
                              onClick={() => toggleTask(index)}
                           >
                              <div className={`mt-1 flex-shrink-0 transition-colors ${isSelected ? 'text-rose-500' : 'text-gray-300 group-hover:text-gray-400'}`}>
                                 {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                 <p className={`font-medium text-sm mb-1 line-clamp-2 md:line-clamp-none ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{task.itemName}</p>
                                 <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs text-gray-400">
                                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">
                                       <Users className="w-3 h-3" /> {task.assignee}
                                    </span>
                                    <span className="font-mono text-gray-500 whitespace-nowrap">{task.estimatedCost.toLocaleString('vi-VN')} đ</span>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  {/* Add Action */}
                  <div className="p-3 md:p-4 bg-white border-t border-gray-200 flex justify-end shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex-shrink-0">
                     <button 
                        onClick={handleAddSelectedTasks}
                        disabled={justAdded}
                        className={`w-full sm:w-auto px-4 md:px-6 py-2.5 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                           justAdded 
                           ? 'bg-green-500 text-white cursor-default' 
                           : 'bg-rose-600 hover:bg-rose-700 text-white hover:shadow-lg'
                        }`}
                     >
                        {justAdded ? <Check className="w-5 h-5 animate-bounce"/> : <PlusCircle className="w-5 h-5" />}
                        <span className="text-sm md:text-base">
                           {justAdded ? "Đã thêm!" : `Thêm ${selectedTaskIndices.size} mục vào Ngân sách`}
                        </span>
                     </button>
                  </div>
               </div>
               <p className="text-center text-xs text-gray-400 mt-2 md:mt-4 italic px-2">
                  * Các công việc được thêm sẽ xuất hiện trong tab "Ngân Sách".
               </p>
            </div>
         )}

         {/* --- TAB 3: TRỢ LÝ AI --- */}
         {activeTab === 'SPEECH' && (
            <div className="max-w-3xl mx-auto h-full flex flex-col">
               <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 p-4 md:p-6 rounded-xl border border-purple-100 flex-1 flex flex-col shadow-sm">
                  <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                     <div className="bg-white p-2 md:p-3 rounded-full shadow-md text-purple-600">
                        <Sparkles className="w-6 h-6 md:w-8 md:h-8" />
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-800 text-base md:text-lg">Trợ Lý Soạn Thảo</h3>
                        <p className="text-xs md:text-sm text-gray-500">Tạo bài phát biểu, lời cảm ơn hoặc văn khấn.</p>
                     </div>
                  </div>

                  {!aiContent ? (
                     <div className="flex-1 flex flex-col items-center justify-center text-center p-4 md:p-8 border-2 border-dashed border-purple-200 rounded-xl bg-white/60">
                        <div className="bg-purple-100 p-3 md:p-4 rounded-full mb-4">
                           <Mic className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                        </div>
                        <h4 className="font-bold text-gray-700 mb-2 text-base md:text-lg">Bạn cần chuẩn bị bài phát biểu?</h4>
                        <p className="text-xs md:text-sm text-gray-500 max-w-md mb-6 md:mb-8 leading-relaxed">
                           AI sẽ giúp bạn soạn thảo nội dung trang trọng cho đại diện gia đình trong lễ <strong className="text-purple-700">{step.title}</strong> này.
                        </p>
                        <button 
                           onClick={handleGetSpeech}
                           disabled={loadingAi}
                           className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 md:px-8 py-3 rounded-full font-bold shadow-lg shadow-purple-200 flex items-center justify-center gap-2 transition-all hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0 text-sm md:text-base"
                        >
                           {loadingAi ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                           {loadingAi ? "Đang soạn thảo..." : "Viết bài phát biểu mẫu"}
                        </button>
                     </div>
                  ) : (
                     <div className="flex-1 flex flex-col bg-white rounded-xl shadow-md border border-purple-100 overflow-hidden relative">
                         <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nội dung đề xuất</span>
                            <button 
                               onClick={() => {
                                  navigator.clipboard.writeText(aiContent);
                                  alert("Đã sao chép!");
                               }}
                               className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                               <Copy className="w-3 h-3" /> <span className="hidden sm:inline">Sao chép</span>
                            </button>
                         </div>
                         <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-white relative">
                            <textarea 
                               className="w-full h-full resize-none focus:outline-none font-serif text-gray-800 leading-relaxed text-sm md:text-base bg-transparent"
                               value={aiContent}
                               readOnly
                            />
                         </div>
                         <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-center flex-shrink-0">
                            <button onClick={handleGetSpeech} className="text-xs font-medium text-gray-500 hover:text-purple-600 underline transition-colors">
                               Thử soạn lại nội dung khác
                            </button>
                         </div>
                     </div>
                  )}
               </div>
            </div>
         )}

      </div>
    </div>
  );
};

export default ProcedureDetail;
