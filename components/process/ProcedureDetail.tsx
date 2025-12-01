
import React, { useState, useEffect, useRef } from 'react';
import { ProcedureStep, WeddingRegion, TaskStatus } from '../../types';
import { useStore } from '../../store/useStore';
import { getCulturalAdvice } from '../../services/geminiService';
import { checkGuestIPLimit, incrementGuestIPUsage } from '../../services/cloudService';
import { WEDDING_PROCEDURES } from '../../data/wedding-procedures';
import { storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
   Users, Gift, ScrollText, Mic, Copy,
   Check, Loader2, BookOpen,
   ListTodo, AlertTriangle, Lightbulb, Sparkles, CheckSquare, Square, PlusCircle, Lock,
   Image as ImageIcon, X, ExternalLink, Search, Edit2, Save, Plus, Trash2, Link, Upload
} from 'lucide-react';

interface ProcedureDetailProps {
   step: ProcedureStep;
   region: WeddingRegion;
}

type TabType = 'INFO' | 'CHECKLIST' | 'SPEECH';

// --- DEFAULT IMAGE MAPPING DATA ---
const DEFAULT_ITEM_IMAGES: Record<string, string> = {
   "trầu": "https://images.unsplash.com/photo-1596504280766-3d6d540203f5?q=80&w=800&auto=format&fit=crop",
   "cau": "https://images.unsplash.com/photo-1596504280766-3d6d540203f5?q=80&w=800&auto=format&fit=crop",
   "rượu": "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=800&auto=format&fit=crop",
   "vang": "https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=800&auto=format&fit=crop",
   "chè": "https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?q=80&w=800&auto=format&fit=crop",
   "trà": "https://images.unsplash.com/photo-1563822249548-9a72b6353cd1?q=80&w=800&auto=format&fit=crop",
   "bánh": "https://images.unsplash.com/photo-1535141192574-5d4897c12636?q=80&w=800&auto=format&fit=crop",
   "cốm": "https://images.unsplash.com/photo-1623945037615-5853e506927d?q=80&w=800&auto=format&fit=crop",
   "phu thê": "https://images.unsplash.com/photo-1623945037615-5853e506927d?q=80&w=800&auto=format&fit=crop",
   "su sê": "https://images.unsplash.com/photo-1623945037615-5853e506927d?q=80&w=800&auto=format&fit=crop",
   "hoa quả": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800&auto=format&fit=crop",
   "trái cây": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800&auto=format&fit=crop",
   "quả": "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=800&auto=format&fit=crop",
   "nến": "https://images.unsplash.com/photo-1603204071830-6644f8087798?q=80&w=800&auto=format&fit=crop",
   "đèn": "https://images.unsplash.com/photo-1603204071830-6644f8087798?q=80&w=800&auto=format&fit=crop",
   "hoa": "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=800&auto=format&fit=crop",
   "nhẫn": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
   "vàng": "https://images.unsplash.com/photo-1610375461490-fb4133a2f00b?q=80&w=800&auto=format&fit=crop",
   "trang sức": "https://images.unsplash.com/photo-1599643478518-17488fbbcd75?q=80&w=800&auto=format&fit=crop",
   "bông tai": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop",
   "xe": "https://images.unsplash.com/photo-1552550178-9524c520a022?q=80&w=800&auto=format&fit=crop",
   "lợn": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
   "heo": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop",
   "gà": "https://images.unsplash.com/photo-1609167830220-7164aa360951?q=80&w=800&auto=format&fit=crop",
   "tháp ly": "https://images.unsplash.com/photo-1582650116803-b09736c478a5?q=80&w=800&auto=format&fit=crop",
};

const ProcedureDetail: React.FC<ProcedureDetailProps> = ({ step, region }) => {
   const { user, guestUsage, incrementGuestSpeech, addBudgetItem, updateProcedure } = useStore();
   const [activeTab, setActiveTab] = useState<TabType>('INFO');

   // AI State
   const [aiContent, setAiContent] = useState<string | null>(null);
   const [loadingAi, setLoadingAi] = useState(false);

   // Checklist State
   const [selectedTaskIndices, setSelectedTaskIndices] = useState<Set<number>>(new Set());
   const [justAdded, setJustAdded] = useState(false);

   // Image Modal State
   const [viewingImage, setViewingImage] = useState<{ name: string, url: string | null } | null>(null);

   // Edit Mode State (AVAILABLE FOR ALL USERS)
   const [isEditing, setIsEditing] = useState(false);
   const [editedStep, setEditedStep] = useState<ProcedureStep>(step);

   // File Upload State
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [uploadingItem, setUploadingItem] = useState<string | null>(null);

   // Logic phân quyền (vẫn giữ logic restricted cho AI)
   const isRestricted = user?.role === 'GUEST' || (user?.role === 'USER' && !user.isActive);
   const isAdmin = user?.role === 'ADMIN';

   // Logic khóa tính năng nâng cao (AI Speech)
   const defaultFirstStepId = WEDDING_PROCEDURES[region][0].id;
   const isFirstStep = defaultFirstStepId === step.id;
   const isStepLocked = isRestricted && !isFirstStep;
   const isLimitReachedLocal = isRestricted && guestUsage.speechCount >= 1;

   // Reset state when step changes
   useEffect(() => {
      setAiContent(null);
      setSelectedTaskIndices(new Set(step.tasks.map((_, i) => i)));
      setActiveTab('INFO');
      setEditedStep(step);

      // Auto-Enter Edit Mode if it's a "New Process"
      // Now applies to anyone who creates a new step
      if (step.title === "Quy trình mới") {
         setIsEditing(true);
      } else {
         setIsEditing(false);
      }
   }, [step.id, region]);

   // --- IMAGE HELPER: CUSTOM > DEFAULT ---
   const getImageForItem = (itemName: string): string | null => {
      const sourceStep = isEditing ? editedStep : step;
      if (sourceStep.customImages && sourceStep.customImages[itemName]) {
         return sourceStep.customImages[itemName];
      }
      const lowerName = itemName.toLowerCase();
      for (const [key, url] of Object.entries(DEFAULT_ITEM_IMAGES)) {
         if (lowerName.includes(key)) {
            return url;
         }
      }
      return null;
   };

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
      if (isStepLocked) {
         alert("🔒 TÍNH NĂNG VIP: Bạn chỉ được trải nghiệm thử ở bước đầu tiên. Vui lòng liên hệ Admin để mở khóa toàn bộ quy trình.");
         return;
      }
      if (isRestricted) {
         setLoadingAi(true);
         const limitReached = await checkGuestIPLimit('speechCount', 1);
         if (limitReached) {
            alert("🔒 HẾT LƯỢT DÙNG THỬ: Bạn đã sử dụng hết lượt tạo nội dung miễn phí. Vui lòng liên hệ Admin để mở khóa không giới hạn.");
            setLoadingAi(false);
            return;
         }
      }
      setLoadingAi(true);
      try {
         const speech = await getCulturalAdvice(region, step.title, 'SPEECH');
         setAiContent(speech);
         if (isRestricted) {
            await incrementGuestIPUsage('speechCount');
            incrementGuestSpeech();
         }
      } catch (error) {
         setAiContent("Lỗi khi kết nối AI. Vui lòng kiểm tra API Key.");
      } finally {
         setLoadingAi(false);
      }
   };

   const renderFormattedText = (text: string) => {
      return text.split('\n').map((line, lineIdx) => (
         <div key={lineIdx} className="mb-1 last:mb-0">
            {line.split(/(\*\*.*?\*\*)/g).map((part, i) => {
               if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={i} className="font-bold text-gray-800">{part.slice(2, -2)}</strong>;
               }
               return <span key={i}>{part}</span>;
            })}
         </div>
      ));
   };

   // --- EDIT HANDLERS ---
   const handleSaveEdit = () => {
      updateProcedure(region, editedStep);
      setIsEditing(false);
   };

   const handleArrayChange = (field: 'offerings' | 'taboos' | 'tips', index: number, value: string) => {
      const newArray = [...(editedStep[field] || [])];
      newArray[index] = value;
      setEditedStep({ ...editedStep, [field]: newArray });
   };

   const handleAddArrayItem = (field: 'offerings' | 'taboos' | 'tips') => {
      setEditedStep({ ...editedStep, [field]: [...(editedStep[field] || []), "Mục mới..."] });
   };

   const handleRemoveArrayItem = (field: 'offerings' | 'taboos' | 'tips', index: number) => {
      const newArray = [...(editedStep[field] || [])];
      newArray.splice(index, 1);
      setEditedStep({ ...editedStep, [field]: newArray });
   };

   // Image Upload Logic
   const triggerUpload = (itemName: string) => {
      setUploadingItem(itemName);
      fileInputRef.current?.click();
   };

   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const itemName = uploadingItem;
      if (!file || !itemName || !storage) return;

      // Small delay to ensure state update
      try {
         // Lưu theo user ID để tránh conflict nếu nhiều người dùng chung
         const userFolder = user?.uid || 'guest';
         const storageRef = ref(storage, `procedure_images/${userFolder}/${region}/${step.id}/${itemName}_${Date.now()}`);
         const metadata = { contentType: file.type };
         const snapshot = await uploadBytes(storageRef, file, metadata);
         const url = await getDownloadURL(snapshot.ref);

         setEditedStep(prev => ({
            ...prev,
            customImages: {
               ...prev.customImages,
               [itemName]: url
            }
         }));
      } catch (err: any) {
         alert("Lỗi upload ảnh (Có thể do chưa cấp quyền Storage hoặc chưa đăng nhập): " + err.message);
      } finally {
         setUploadingItem(null);
         if (fileInputRef.current) fileInputRef.current.value = '';
      }
   };

   const handleImageLink = (itemName: string) => {
      const currentUrl = getImageForItem(itemName) || '';
      const url = prompt(`Nhập đường dẫn ảnh (URL) mới cho "${itemName}":`, currentUrl);
      if (url !== null) {
         setEditedStep(prev => ({
            ...prev,
            customImages: {
               ...prev.customImages,
               [itemName]: url
            }
         }));
      }
   };

   return (
      <div className="flex flex-col h-auto lg:h-full bg-white md:rounded-xl shadow-sm border-t md:border border-rose-100 lg:overflow-hidden transition-all duration-300 relative">
         <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />

         {/* --- IMAGE VIEWER MODAL --- */}
         {viewingImage && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setViewingImage(null)}>
               <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setViewingImage(null)} className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors z-10"><X className="w-5 h-5" /></button>
                  <div className="relative aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                     {viewingImage.url ? (
                        <img src={viewingImage.url} alt={viewingImage.name} className="w-full h-full object-cover" />
                     ) : (
                        <div className="flex flex-col items-center text-gray-400 p-8 text-center">
                           <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                           <span className="text-sm">Chưa có ảnh mẫu cho vật phẩm này.</span>
                        </div>
                     )}
                     <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                        <h3 className="text-white font-bold text-lg">{viewingImage.name}</h3>
                     </div>
                  </div>
                  <div className="p-4 bg-gray-50 flex flex-col gap-3">
                     <a href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(viewingImage.name + " đám cưới việt nam")}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-white border border-gray-300 hover:border-rose-400 hover:text-rose-600 text-gray-700 py-2.5 rounded-xl font-bold transition-all shadow-sm text-sm"><Search className="w-4 h-4" /> Tìm mẫu thực tế trên Google</a>
                  </div>
               </div>
            </div>
         )}

         {/* 1. Header with Tabs */}
         <div className="border-b border-gray-100 bg-gradient-to-r from-rose-50/50 to-white flex-shrink-0 sticky top-0 z-30 lg:static">
            <div className="p-4 md:p-6 pb-2 md:pb-4 relative">
               {/* EDIT TOGGLE (AVAILABLE FOR EVERYONE) */}
               <div className="absolute top-4 right-4 z-40">
                  {isEditing ? (
                     <div className="flex gap-2 animate-fadeIn">
                        <button onClick={() => setIsEditing(false)} className="bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 p-2 rounded-lg text-xs font-bold shadow-sm transition-colors">Hủy</button>
                        <button onClick={handleSaveEdit} className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-lg text-xs font-bold flex items-center gap-1 shadow-rose-200 shadow-sm transition-colors"><Save className="w-4 h-4" /> Lưu</button>
                     </div>
                  ) : (
                     <button onClick={() => { setEditedStep(step); setIsEditing(true); }} className="bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 p-2 rounded-lg shadow-sm transition-all hover:scale-105" title="Chỉnh sửa nội dung">
                        <Edit2 className="w-4 h-4" />
                     </button>
                  )}
               </div>

               {isEditing ? (
                  <div className="space-y-3 pr-20 animate-fadeIn">
                     <input className="w-full text-xl md:text-2xl font-bold text-gray-800 border-b-2 border-rose-300 focus:border-rose-500 outline-none bg-transparent placeholder-gray-300" value={editedStep.title} onChange={e => setEditedStep({ ...editedStep, title: e.target.value })} placeholder="Tiêu đề quy trình" />
                     <textarea className="w-full text-xs md:text-sm text-gray-600 border border-rose-200 focus:border-rose-400 rounded-lg p-2 outline-none h-20 bg-white shadow-inner resize-none" value={editedStep.description} onChange={e => setEditedStep({ ...editedStep, description: e.target.value })} placeholder="Mô tả ngắn gọn..." />
                  </div>
               ) : (
                  <>
                     <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex flex-wrap items-center gap-2 pr-10">
                        {step.title}
                        <span className="text-xs font-normal text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Miền {region === 'NORTH' ? 'Bắc' : region === 'CENTRAL' ? 'Trung' : 'Miền Nam'}</span>
                     </h2>
                     <p className="text-gray-600 mt-2 text-xs md:text-sm leading-relaxed max-w-2xl line-clamp-2 md:line-clamp-none">{step.description}</p>
                  </>
               )}
            </div>

            <div className="flex px-4 md:px-6 gap-6 md:gap-8 overflow-x-auto no-scrollbar">
               <button onClick={() => setActiveTab('INFO')} className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'INFO' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><BookOpen className="w-4 h-4" /> Cẩm Nang</button>
               <button onClick={() => setActiveTab('CHECKLIST')} className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'CHECKLIST' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><ListTodo className="w-4 h-4" /> Việc Cần Làm <span className="bg-gray-100 text-gray-600 px-1.5 rounded-full text-[10px]">{step.tasks.length}</span></button>
               <button onClick={() => setActiveTab('SPEECH')} className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'SPEECH' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}><Sparkles className="w-4 h-4" /> Trợ Lý Lời Hay</button>
            </div>
         </div>

         {/* 2. Content Area */}
         <div className="p-4 md:p-6 pb-20 bg-white flex-1 lg:overflow-y-auto min-h-[500px] lg:min-h-0">
            {activeTab === 'INFO' && (
               <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                     <div className="bg-white p-4 md:p-5 rounded-xl border border-blue-100 shadow-[0_2px_8px_rgba(59,130,246,0.05)]">
                        <div className="flex items-start gap-3 mb-4">
                           <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><ScrollText className="w-5 h-5" /></div>
                           <div><h3 className="font-bold text-gray-800 text-base">Ý nghĩa & Thành phần</h3><p className="text-xs text-gray-400">Những điều cốt lõi</p></div>
                        </div>
                        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
                           <div className="bg-blue-50/50 p-3 rounded-lg"><span className="font-bold text-blue-800 block mb-1">Ý nghĩa:</span>{isEditing ? <textarea className="w-full bg-white p-2 rounded border border-blue-200 outline-none focus:ring-2 focus:ring-blue-100 text-sm" value={editedStep.meaning} onChange={e => setEditedStep({ ...editedStep, meaning: e.target.value })} rows={4} placeholder="Nhập ý nghĩa nghi lễ..." /> : step.meaning}</div>
                           <div><span className="font-bold text-gray-700 block mb-1">Thành phần tham dự:</span>{isEditing ? <textarea className="w-full bg-white p-2 rounded border border-gray-200 outline-none focus:ring-2 focus:ring-gray-100 text-sm" value={editedStep.participants} onChange={e => setEditedStep({ ...editedStep, participants: e.target.value })} rows={3} placeholder="Liệt kê người tham dự..." /> : step.participants}</div>
                        </div>
                     </div>

                     {/* Offerings - With Edit & Image Add */}
                     <div className="bg-white p-4 md:p-5 rounded-xl border border-rose-100 shadow-[0_2px_8px_rgba(244,63,94,0.05)]">
                        <div className="flex items-start gap-3 mb-4">
                           <div className="bg-rose-50 p-2 rounded-lg text-rose-600"><Gift className="w-5 h-5" /></div>
                           <div><h3 className="font-bold text-gray-800 text-base">Sính lễ & Vật phẩm</h3><p className="text-xs text-gray-400">Chuẩn bị chu đáo (Bấm để xem ảnh)</p></div>
                        </div>
                        <ul className="space-y-2">
                           {(isEditing ? editedStep.offerings : step.offerings).map((item, idx) => {
                              const imgUrl = getImageForItem(item);
                              return (
                                 <li key={idx} className={`flex items-start justify-between gap-2 text-sm text-gray-700 p-2 rounded transition-all group border border-transparent ${(!isEditing && (imgUrl || true)) ? 'hover:bg-rose-50 hover:border-rose-100 cursor-pointer' : ''} ${isEditing ? 'bg-gray-50' : ''}`}>
                                    <div className="flex-1 flex items-start gap-2" onClick={() => !isEditing && setViewingImage({ name: item, url: imgUrl })}>
                                       <span className={`w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 mt-2 group-hover:bg-rose-600 transition-colors ${isEditing ? 'mt-3' : ''}`}></span>
                                       {isEditing ? (
                                          <div className="flex-1"><input className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:border-rose-300 outline-none" value={item} onChange={(e) => handleArrayChange('offerings', idx, e.target.value)} placeholder="Tên lễ vật..." /></div>
                                       ) : <span className="py-0.5 leading-relaxed">{item}</span>}
                                    </div>
                                    {isEditing ? (
                                       <div className="flex gap-1 items-center">
                                          <button onClick={() => triggerUpload(item)} className={`p-1.5 rounded transition-colors ${imgUrl ? 'text-green-500 bg-green-50' : 'text-gray-300 hover:text-green-500 hover:bg-gray-200'}`} title="Tải ảnh lên"><Upload className="w-4 h-4" /></button>
                                          <button onClick={() => handleImageLink(item)} className={`p-1.5 rounded transition-colors ${imgUrl ? 'text-blue-500 bg-blue-50' : 'text-gray-300 hover:text-blue-500 hover:bg-gray-200'}`} title="Dán link ảnh"><Link className="w-4 h-4" /></button>
                                          <button onClick={() => handleRemoveArrayItem('offerings', idx)} className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded transition-colors" title="Xóa"><Trash2 className="w-4 h-4" /></button>
                                       </div>
                                    ) : <ImageIcon onClick={() => setViewingImage({ name: item, url: imgUrl })} className={`w-4 h-4 flex-shrink-0 transition-all ${imgUrl ? 'text-rose-400' : 'text-gray-200 group-hover:text-rose-400 opacity-0 group-hover:opacity-100'}`} />}
                                 </li>
                              );
                           })}
                           {isEditing && <button onClick={() => handleAddArrayItem('offerings')} className="w-full flex items-center justify-center gap-1.5 text-xs text-rose-500 font-bold mt-3 py-2 border border-dashed border-rose-300 rounded-lg hover:bg-rose-50 transition-colors"><Plus className="w-3.5 h-3.5" /> Thêm sính lễ</button>}
                        </ul>
                     </div>
                  </div>

                  <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl p-4 md:p-5 shadow-sm">
                     <h3 className="flex items-center gap-2 font-bold text-emerald-800 mb-4 text-lg"><Lightbulb className="w-5 h-5 text-emerald-600" /> Mẹo Hay & Kinh Nghiệm</h3>
                     <div className="space-y-4">
                        {(isEditing ? editedStep.tips : step.tips || []).map((t, i) => (
                           <div key={i} className="flex items-start gap-3 text-emerald-900 text-sm bg-white/60 p-3 rounded-lg border border-emerald-100/50 group">
                              <Check className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                              <div className="leading-relaxed flex-1">{isEditing ? <textarea className="w-full bg-white p-2 rounded border border-emerald-200 outline-none focus:ring-1 focus:ring-emerald-300 text-sm" value={t} onChange={e => handleArrayChange('tips', i, e.target.value)} rows={2} /> : renderFormattedText(t)}</div>
                              {isEditing && <button onClick={() => handleRemoveArrayItem('tips', i)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>}
                           </div>
                        ))}
                        {isEditing && <button onClick={() => handleAddArrayItem('tips')} className="w-full flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-bold mt-2 py-2 border border-dashed border-emerald-300 rounded-lg hover:bg-emerald-100/50 transition-colors"><Plus className="w-3.5 h-3.5" /> Thêm mẹo hay</button>}
                     </div>
                  </div>

                  <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4 md:p-5 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><AlertTriangle className="w-24 h-24" /></div>
                     <h3 className="flex items-center gap-2 font-bold text-red-800 mb-3 text-lg"><AlertTriangle className="w-5 h-5 text-red-600" /> Điều Kiêng Kỵ Cần Tránh</h3>
                     <ul className="space-y-2 relative z-10">
                        {(isEditing ? editedStep.taboos : step.taboos || []).map((t, i) => (
                           <li key={i} className="flex items-start gap-2 text-red-700 text-sm group">
                              <span className="text-red-400 font-bold mt-1.5">•</span>
                              <div className="flex-1">{isEditing ? <input className="w-full bg-white p-2 rounded border border-red-200 outline-none focus:ring-1 focus:ring-red-300 text-sm" value={t} onChange={e => handleArrayChange('taboos', i, e.target.value)} /> : <span className="leading-relaxed">{t}</span>}</div>
                              {isEditing && <button onClick={() => handleRemoveArrayItem('taboos', i)} className="p-1.5 text-red-300 hover:text-red-600 hover:bg-red-100 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>}
                           </li>
                        ))}
                        {isEditing && <button onClick={() => handleAddArrayItem('taboos')} className="w-full flex items-center justify-center gap-1.5 text-xs text-red-600 font-bold mt-3 py-2 border border-dashed border-red-300 rounded-lg hover:bg-red-100/50 transition-colors"><Plus className="w-3.5 h-3.5" /> Thêm điều kiêng kỵ</button>}
                     </ul>
                  </div>
               </div>
            )}

            {activeTab === 'CHECKLIST' && (
               <div className="max-w-3xl mx-auto lg:h-full flex flex-col">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
                     <div className="p-3 md:p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
                        <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-rose-600 transition-colors p-1">
                           {selectedTaskIndices.size === step.tasks.length ? <CheckSquare className="w-5 h-5 text-rose-500" /> : <Square className="w-5 h-5 text-gray-400" />}
                           <span className="hidden sm:inline">Chọn tất cả</span>
                        </button>
                        <div className="text-xs font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm whitespace-nowrap">Đã chọn: <span className="text-rose-600 font-bold text-sm">{selectedTaskIndices.size}</span></div>
                     </div>
                     <div className="flex-1 lg:overflow-y-auto divide-y divide-gray-100">
                        {step.tasks.map((task, index) => {
                           const isSelected = selectedTaskIndices.has(index);
                           return (
                              <div key={index} className={`p-3 md:p-4 flex items-start gap-3 md:gap-4 transition-all cursor-pointer group hover:bg-rose-50/20 active:bg-rose-50/30 ${isSelected ? 'bg-rose-50/10' : ''}`} onClick={() => toggleTask(index)}>
                                 <div className={`mt-1 flex-shrink-0 transition-colors ${isSelected ? 'text-rose-500' : 'text-gray-300 group-hover:text-gray-400'}`}>{isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}</div>
                                 <div className="flex-1">
                                    <p className={`font-medium text-sm mb-1 line-clamp-2 md:line-clamp-none ${isSelected ? 'text-gray-900' : 'text-gray-500'}`}>{task.itemName}</p>
                                    <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs text-gray-400"><span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap"><Users className="w-3 h-3" /> {task.assignee}</span><span className="font-mono text-gray-500 whitespace-nowrap">{task.estimatedCost.toLocaleString('vi-VN')} đ</span></div>
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                     <div className="p-3 md:p-4 bg-white border-t border-gray-200 flex justify-end shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex-shrink-0 sticky bottom-0 z-10 lg:static">
                        <button onClick={handleAddSelectedTasks} disabled={justAdded} className={`w-full sm:w-auto px-4 md:px-6 py-2.5 rounded-lg font-bold shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95 ${justAdded ? 'bg-green-500 text-white cursor-default' : 'bg-rose-600 hover:bg-rose-700 text-white hover:shadow-lg'}`}>{justAdded ? <Check className="w-5 h-5 animate-bounce" /> : <PlusCircle className="w-5 h-5" />}<span className="text-sm md:text-base">{justAdded ? "Đã thêm!" : `Thêm ${selectedTaskIndices.size} mục vào Ngân sách`}</span></button>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'SPEECH' && (
               <div className="max-w-3xl mx-auto lg:h-full flex flex-col">
                  <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 p-4 md:p-6 rounded-xl border border-purple-100 flex-1 flex flex-col shadow-sm">
                     <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                        <div className="bg-white p-2 md:p-3 rounded-full shadow-md text-purple-600"><Sparkles className="w-6 h-6 md:w-8 md:h-8" /></div>
                        <div><h3 className="font-bold text-gray-800 text-base md:text-lg">Trợ Lý Soạn Thảo</h3><p className="text-xs md:text-sm text-gray-500">Tạo bài phát biểu, lời cảm ơn hoặc văn khấn.</p></div>
                     </div>
                     {!aiContent ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 md:p-8 border-2 border-dashed border-purple-200 rounded-xl bg-white/60">
                           <div className="bg-purple-100 p-3 md:p-4 rounded-full mb-4"><Mic className="w-6 h-6 md:w-8 md:h-8 text-purple-500" /></div>
                           <h4 className="font-bold text-gray-700 mb-2 text-base md:text-lg">Bạn cần chuẩn bị bài phát biểu?</h4>
                           <p className="text-xs md:text-sm text-gray-500 max-w-md mb-6 md:mb-8 leading-relaxed">AI sẽ giúp bạn soạn thảo nội dung trang trọng cho đại diện gia đình trong lễ <strong className="text-purple-700">{step.title}</strong> này.</p>
                           {isRestricted && !isStepLocked && <span className="block text-center text-xs text-amber-600 font-bold mb-2">{isLimitReachedLocal ? "Đã hết lượt dùng thử" : `Dùng thử: Còn ${1 - guestUsage.speechCount} lượt`}</span>}
                           {isStepLocked ? (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center max-w-md mx-auto"><Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" /><p className="text-sm text-amber-800 font-bold mb-1">Tính năng giới hạn</p><p className="text-xs text-amber-700">🔒 Tính năng này chỉ dành cho thành viên chính thức. Vui lòng liên hệ Admin.</p></div>
                           ) : (
                              <button onClick={handleGetSpeech} disabled={loadingAi || isLimitReachedLocal} className={`w-full sm:w-auto px-6 md:px-8 py-3 rounded-full font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base ${isLimitReachedLocal ? 'bg-gray-400 text-white shadow-none cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200 hover:-translate-y-1'}`}>{isLimitReachedLocal ? <Lock className="w-5 h-5" /> : (loadingAi ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />)}{isLimitReachedLocal ? "Hết lượt miễn phí (Liên hệ Admin)" : (loadingAi ? "Đang soạn thảo..." : "Viết bài phát biểu mẫu")}</button>
                           )}
                        </div>
                     ) : (
                        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-md border border-purple-100 overflow-hidden relative min-h-[400px]">
                           <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-100 flex-shrink-0"><span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nội dung đề xuất</span><button onClick={() => { navigator.clipboard.writeText(aiContent); alert("Đã sao chép!"); }} className="flex items-center gap-1 text-xs font-bold text-purple-600 hover:text-purple-800 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors"><Copy className="w-3 h-3" /> <span className="hidden sm:inline">Sao chép</span></button></div>
                           <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-white relative"><textarea className="w-full h-full resize-none focus:outline-none font-serif text-gray-800 leading-relaxed text-sm md:text-base bg-transparent min-h-[300px]" value={aiContent} readOnly /></div>
                           <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-center flex-shrink-0"><button onClick={handleGetSpeech} className={`text-xs font-medium underline transition-colors ${isLimitReachedLocal ? 'text-gray-400' : 'text-gray-500 hover:text-purple-600'}`}>{isLimitReachedLocal ? "Đã hết lượt soạn lại" : "Thử soạn lại nội dung khác"}</button></div>
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
