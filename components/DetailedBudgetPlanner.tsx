
import React, { useState, useMemo, useEffect } from 'react';
import { BudgetItem, TaskStatus, WeddingSide } from '../types';
import {
   Plus, Trash2, Calendar as CalendarIcon, Search,
   ArrowUpRight, Wallet, Filter, ArrowUpDown, FileSpreadsheet,
   DollarSign, Check, ChevronUp, ChevronDown
} from 'lucide-react';
import { useStore } from '../store/useStore';

// --- HELPER COMPONENT: CURRENCY INPUT ---
interface CurrencyInputProps {
   value: number;
   onChange: (val: number) => void;
   className?: string;
   placeholder?: string;
   autoFocus?: boolean;
}

const CurrencyInput: React.FC<CurrencyInputProps> = ({ value, onChange, className, placeholder, autoFocus }) => {
   const [displayValue, setDisplayValue] = useState('');

   useEffect(() => {
      setDisplayValue(value === 0 ? '' : new Intl.NumberFormat('vi-VN').format(value));
   }, [value]);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      const numericString = rawInput.replace(/\D/g, '');

      if (!numericString) {
         setDisplayValue('');
         onChange(0);
         return;
      }

      const numberValue = parseInt(numericString, 10);
      setDisplayValue(new Intl.NumberFormat('vi-VN').format(numberValue));
      onChange(numberValue);
   };

   return (
      <input
         type="text"
         inputMode="numeric"
         value={displayValue}
         onChange={handleChange}
         className={className}
         placeholder={placeholder}
         autoFocus={autoFocus}
      />
   );
};

const DetailedBudgetPlanner: React.FC = () => {
   const { budgetItems, addBudgetItem, updateBudgetItem, deleteBudgetItem } = useStore();

   // Local UI State
   const [filterSide, setFilterSide] = useState<WeddingSide | 'ALL'>('ALL');
   const [filterStatus, setFilterStatus] = useState<TaskStatus | 'ALL'>('ALL');
   const [sortBy, setSortBy] = useState<'DEFAULT' | 'COST_DESC' | 'COST_ASC' | 'DEADLINE'>('DEFAULT');
   const [searchTerm, setSearchTerm] = useState("");
   const [isMobileAddOpen, setIsMobileAddOpen] = useState(false);

   // New Item State
   const [newItemName, setNewItemName] = useState("");
   const [newItemCategory, setNewItemCategory] = useState("Chung");
   const [newItemCost, setNewItemCost] = useState(0);

   // Suggestions for categories
   const existingCategories = useMemo(() =>
      Array.from(new Set(budgetItems.map(i => i.category))),
      [budgetItems]);

   const exportToCSV = () => {
      const headers = ["Danh mục", "Tên khoản chi", "Bên lo", "Người phụ trách", "Trạng thái", "Dự kiến (VNĐ)", "Thực tế (VNĐ)", "Hạn chót", "Ghi chú"];
      const rows = budgetItems.map(item => [
         item.category,
         item.itemName,
         item.side,
         item.assignee,
         item.status,
         item.estimatedCost,
         item.actualCost,
         item.deadline || '',
         item.note || ''
      ]);

      const csvContent = [
         headers.join(","),
         ...rows.map(row => row.map(item => `"${item}"`).join(","))
      ].join("\n");

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "ngan_sach_dam_cuoi.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
   };

   const filteredItems = useMemo(() => {
      let items = budgetItems.filter(item => {
         const matchesSide = filterSide === 'ALL' || item.side === filterSide || item.side === 'BOTH';
         const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
         const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.assignee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.category.toLowerCase().includes(searchTerm.toLowerCase());
         return matchesSide && matchesStatus && matchesSearch;
      });

      if (sortBy === 'COST_DESC') {
         items.sort((a, b) => b.estimatedCost - a.estimatedCost);
      } else if (sortBy === 'COST_ASC') {
         items.sort((a, b) => a.estimatedCost - b.estimatedCost);
      } else if (sortBy === 'DEADLINE') {
         items.sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));
      }

      return items;
   }, [budgetItems, filterSide, filterStatus, searchTerm, sortBy]);

   const groupedData = useMemo(() => {
      const groups: Record<string, { items: BudgetItem[], subTotalEst: number, subTotalAct: number }> = {};

      filteredItems.forEach(item => {
         if (!groups[item.category]) {
            groups[item.category] = { items: [], subTotalEst: 0, subTotalAct: 0 };
         }
         groups[item.category].items.push(item);
         groups[item.category].subTotalEst += item.estimatedCost;
         groups[item.category].subTotalAct += item.actualCost;
      });

      return Object.entries(groups).sort(([, a], [, b]) => b.subTotalEst - a.subTotalEst);
   }, [filteredItems]);

   const stats = useMemo(() => {
      const estimated = filteredItems.reduce((acc, i) => acc + i.estimatedCost, 0);
      const actual = filteredItems.reduce((acc, i) => acc + i.actualCost, 0);
      const percentUsed = estimated > 0 ? (actual / estimated) * 100 : 0;

      return { estimated, actual, percentUsed };
   }, [filteredItems]);

   const handleUpdateItem = (id: string, field: keyof BudgetItem, value: any) => {
      updateBudgetItem(id, field, value);
   };

   const handleAddItem = () => {
      if (!newItemName.trim()) return;
      const newItem: BudgetItem = {
         id: Date.now().toString(),
         itemName: newItemName,
         category: newItemCategory,
         estimatedCost: newItemCost,
         actualCost: 0,
         status: TaskStatus.PENDING,
         assignee: "",
         side: filterSide === 'ALL' ? 'BOTH' : filterSide,
         note: ""
      };
      addBudgetItem(newItem);
      setNewItemName("");
      setNewItemCost(0);

      // Optional: Collapse on mobile after adding to let user see list?
      // setIsMobileAddOpen(false); 
   };

   const handleDelete = (id: string) => {
      if (confirm("Bạn có chắc chắn muốn xóa mục này?")) {
         deleteBudgetItem(id);
      }
   };

   const getStatusColor = (status: TaskStatus) => {
      switch (status) {
         case TaskStatus.DONE: return "bg-emerald-50 text-emerald-700 border-emerald-200";
         case TaskStatus.PAID: return "bg-sky-50 text-sky-700 border-sky-200";
         case TaskStatus.IN_PROGRESS: return "bg-amber-50 text-amber-700 border-amber-200";
         default: return "bg-gray-50 text-gray-600 border-gray-200";
      }
   };

   return (
      <div className="flex flex-col h-full bg-[#FDF2F8]">

         {/* 1. Sticky Header Area */}
         <div className="bg-white border-b border-rose-100 shadow-sm z-30 sticky top-0">

            {/* Top Bar: Title & Stats */}
            <div className="px-3 py-3 md:p-4 flex flex-wrap lg:flex-nowrap justify-between gap-3 items-center">
               <div className="flex items-center gap-2 md:gap-3 w-full lg:w-auto">
                  <div className="p-2 md:p-2.5 bg-rose-500 rounded-xl text-white shadow-md shadow-rose-200 flex-shrink-0">
                     <Wallet className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                     <h2 className="text-base md:text-xl font-bold text-gray-800 truncate">Quản Lý Ngân Sách</h2>

                     {/* Mobile Stats Scroll */}
                     <div className="flex lg:hidden items-center gap-2 text-[10px] md:text-xs text-gray-500 mt-1 font-medium overflow-x-auto no-scrollbar whitespace-nowrap">
                        <span className="bg-gray-50 px-2 py-0.5 rounded">Dự: {stats.estimated.toLocaleString('vi-VN')}</span>
                        <span className="text-gray-300">|</span>
                        <span className={`bg-gray-50 px-2 py-0.5 rounded ${stats.actual > stats.estimated ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'}`}>
                           Thực: {stats.actual.toLocaleString('vi-VN')}
                        </span>
                     </div>
                  </div>

                  {/* Mobile Export */}
                  <button onClick={exportToCSV} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg flex-shrink-0">
                     <FileSpreadsheet className="w-5 h-5" />
                  </button>
               </div>

               <div className="hidden lg:flex items-center gap-4">
                  <div className="text-right">
                     <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tổng Dự Kiến</div>
                     <div className="text-lg font-bold text-gray-800">{stats.estimated.toLocaleString('vi-VN')}</div>
                  </div>
                  <div className="h-8 w-px bg-gray-100"></div>
                  <div className="text-right">
                     <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Đã Chi Tiêu</div>
                     <div className={`text-lg font-bold ${stats.actual > stats.estimated ? 'text-red-500' : 'text-emerald-500'}`}>
                        {stats.actual.toLocaleString('vi-VN')}
                     </div>
                  </div>
                  <button
                     onClick={exportToCSV}
                     className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
                  >
                     <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                     <span>Excel</span>
                  </button>
               </div>
            </div>

            {/* Search & Filters (Scrollable on mobile) */}
            <div className="px-3 md:px-4 pb-3 flex flex-col xl:flex-row gap-3">
               <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                     type="text"
                     placeholder="Tìm kiếm..."
                     className="w-full pl-9 pr-4 py-2 md:py-2.5 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>

               <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 xl:pb-0 touch-pan-x">
                  {/* Side Filter */}
                  <div className="flex bg-gray-100 p-1 rounded-xl flex-shrink-0">
                     <button onClick={() => setFilterSide('ALL')} className={`px-3 md:px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filterSide === 'ALL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Tất cả</button>
                     <button onClick={() => setFilterSide('GROOM')} className={`px-3 md:px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filterSide === 'GROOM' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Nhà Trai</button>
                     <button onClick={() => setFilterSide('BRIDE')} className={`px-3 md:px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filterSide === 'BRIDE' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Nhà Gái</button>
                  </div>

                  {/* Dropdowns */}
                  <div className="relative flex-shrink-0 min-w-[120px]">
                     <select
                        className="w-full pl-3 pr-8 py-2 md:py-2.5 rounded-xl border border-gray-200 focus:border-rose-500 outline-none text-xs md:text-sm bg-white appearance-none h-full"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'ALL')}
                     >
                        <option value="ALL">Mọi trạng thái</option>
                        {Object.values(TaskStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                     </select>
                     <Filter className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                  </div>

                  <div className="relative flex-shrink-0 min-w-[120px]">
                     <select
                        className="w-full pl-3 pr-8 py-2 md:py-2.5 rounded-xl border border-gray-200 focus:border-rose-500 outline-none text-xs md:text-sm bg-white appearance-none h-full"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                     >
                        <option value="DEFAULT">Mặc định</option>
                        <option value="COST_DESC">Giá cao ➝ thấp</option>
                        <option value="COST_ASC">Giá thấp ➝ cao</option>
                        <option value="DEADLINE">Hạn chót</option>
                     </select>
                     <ArrowUpDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                  </div>
               </div>
            </div>

            {/* Mobile Toggle Button for Quick Add */}
            <div className="md:hidden px-3 pb-3">
               <button
                  onClick={() => setIsMobileAddOpen(!isMobileAddOpen)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${isMobileAddOpen
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-rose-600 text-white shadow-rose-200 hover:bg-rose-700'
                     }`}
               >
                  {isMobileAddOpen ? (
                     <>Thu gọn <ChevronUp className="w-4 h-4" /></>
                  ) : (
                     <>Thêm khoản chi mới <Plus className="w-4 h-4" /></>
                  )}
               </button>
            </div>

            {/* Quick Add Bar - Responsive Grid (Collapsible on Mobile) */}
            <div className={`
             bg-rose-50 border-rose-100 transition-all duration-300 ease-in-out overflow-hidden
             ${isMobileAddOpen ? 'max-h-[500px] border-t opacity-100' : 'max-h-0 border-t-0 opacity-0'} 
             md:max-h-none md:border-t md:opacity-100
        `}>
               <div className="p-3 md:p-4">
                  <div className="grid grid-cols-12 gap-2 md:gap-3 items-center">
                     <div className="col-span-12 md:col-span-4">
                        <input
                           placeholder="Nhập tên khoản chi..."
                           className="w-full px-3 py-2 text-sm rounded-lg border border-rose-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-200 outline-none shadow-sm placeholder-rose-300 bg-white"
                           value={newItemName}
                           onChange={(e) => setNewItemName(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        />
                     </div>
                     <div className="col-span-7 md:col-span-3">
                        <input
                           list="categories"
                           placeholder="Danh mục"
                           className="w-full px-3 py-2 text-sm rounded-lg border border-rose-200 focus:border-rose-500 outline-none shadow-sm bg-white"
                           value={newItemCategory}
                           onChange={(e) => setNewItemCategory(e.target.value)}
                        />
                        <datalist id="categories">
                           {existingCategories.map((c: string) => <option key={c} value={c} />)}
                        </datalist>
                     </div>
                     <div className="col-span-5 md:col-span-3">
                        <CurrencyInput
                           value={newItemCost}
                           onChange={setNewItemCost}
                           placeholder="Dự trù..."
                           className="w-full px-3 py-2 text-sm rounded-lg border border-rose-200 focus:border-rose-500 outline-none shadow-sm font-mono font-bold text-rose-600 bg-white"
                        />
                     </div>
                     <div className="col-span-12 md:col-span-2">
                        <button
                           onClick={handleAddItem}
                           className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg text-sm font-bold shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                           <Plus className="w-4 h-4" /> <span className="inline">Thêm</span>
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* 2. Scrollable List Area */}
         <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6">
            {groupedData.length === 0 && (
               <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <DollarSign className="w-10 h-10 text-gray-300 mb-2" />
                  <p className="text-sm font-medium">Chưa có dữ liệu</p>
               </div>
            )}

            {groupedData.map(([category, groupData]) => {
               const { items, subTotalEst, subTotalAct } = groupData;
               const isGroupOverBudget = subTotalAct > subTotalEst;
               const groupPercent = subTotalEst > 0 ? (subTotalAct / subTotalEst) * 100 : 0;

               return (
                  <div key={category as string} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

                     {/* Category Header */}
                     <div className="bg-gray-50/80 backdrop-blur-sm p-3 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                        {/* Progress Bar Background */}
                        <div className="absolute bottom-0 left-0 h-0.5 bg-gray-200 w-full opacity-50">
                           <div
                              className={`h-full transition-all duration-500 ${isGroupOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(groupPercent, 100)}%` }}
                           />
                        </div>

                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm text-gray-700 font-bold text-sm">
                              {category.charAt(0).toUpperCase()}
                           </div>
                           <div className="min-w-0">
                              <h3 className="font-bold text-gray-800 text-sm md:text-base truncate">{category}</h3>
                              <p className="text-[10px] text-gray-500">{items.length} hạng mục</p>
                           </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs md:text-sm text-gray-600 bg-white px-2 py-1 rounded-lg shadow-sm border border-gray-100">
                           <div className="text-right hidden sm:block">
                              <div className="text-[8px] text-gray-400 font-bold uppercase">Dự kiến</div>
                              <div className="font-mono font-bold">{subTotalEst.toLocaleString('vi-VN')}</div>
                           </div>
                           <div className="w-px h-6 bg-gray-100 hidden sm:block"></div>
                           <div className="text-right">
                              <div className="text-[8px] text-gray-400 font-bold uppercase sm:text-right">Thực tế</div>
                              <div className={`font-mono font-bold flex items-center justify-end gap-1 ${isGroupOverBudget ? 'text-red-500' : 'text-emerald-500'}`}>
                                 {subTotalAct.toLocaleString('vi-VN')}
                                 {isGroupOverBudget && <ArrowUpRight className="w-3 h-3" />}
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Items List */}
                     <div className="divide-y divide-gray-50">
                        {/* Desktop Table Header - Only visible on LG screens */}
                        <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-white">
                           <div className="col-span-3 pl-2">Tên mục / Ghi chú</div>
                           <div className="col-span-2">Phụ trách & Hạn</div>
                           <div className="col-span-2">Trạng thái</div>
                           <div className="col-span-2 text-right">Dự trù (VNĐ)</div>
                           <div className="col-span-2 text-right">Thực tế (VNĐ)</div>
                           <div className="col-span-1"></div>
                        </div>

                        {items.map(item => (
                           <div key={item.id} className="group hover:bg-rose-50/10 transition-colors">

                              {/* Mobile/Tablet Card View (< LG) */}
                              <div className="lg:hidden p-3 relative flex flex-col gap-2">
                                 <div className="flex justify-between items-start gap-2">
                                    <input
                                       className="font-bold text-gray-800 bg-transparent border-b border-dashed border-transparent focus:border-rose-300 outline-none flex-1 text-sm py-0.5"
                                       value={item.itemName}
                                       onChange={(e) => handleUpdateItem(item.id, 'itemName', e.target.value)}
                                    />
                                    <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-1">
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>

                                 <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-gray-50 rounded px-2 py-1 flex items-center">
                                       <input
                                          className="bg-transparent w-full outline-none text-gray-600 truncate placeholder-gray-400"
                                          placeholder="Người phụ trách"
                                          value={item.assignee}
                                          onChange={(e) => handleUpdateItem(item.id, 'assignee', e.target.value)}
                                       />
                                    </div>
                                    <div className="bg-gray-50 rounded px-2 py-1 flex items-center gap-1">
                                       <CalendarIcon className="w-3 h-3 text-gray-400" />
                                       <input
                                          type="date"
                                          className="bg-transparent w-full outline-none text-gray-600 font-mono"
                                          value={item.deadline || ''}
                                          onChange={(e) => handleUpdateItem(item.id, 'deadline', e.target.value)}
                                       />
                                    </div>
                                 </div>

                                 <input
                                    className="w-full text-xs text-gray-500 italic placeholder-gray-300 bg-transparent outline-none border-b border-transparent focus:border-rose-200"
                                    placeholder="Ghi chú..."
                                    value={item.note || ''}
                                    onChange={(e) => handleUpdateItem(item.id, 'note', e.target.value)}
                                 />

                                 <div className="flex items-center justify-between gap-2 mt-1">
                                    <div className="flex flex-col items-start gap-1">
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-[10px] text-gray-400 uppercase">Dự:</span>
                                          <CurrencyInput
                                             value={item.estimatedCost}
                                             onChange={(val) => handleUpdateItem(item.id, 'estimatedCost', val)}
                                             className="bg-transparent outline-none font-mono text-gray-500 w-20 border-b border-dashed border-gray-200 focus:border-rose-400 text-xs"
                                          />
                                       </div>
                                       <div className="flex items-baseline gap-1">
                                          <span className="text-[10px] text-gray-400 uppercase">Thực:</span>
                                          <CurrencyInput
                                             value={item.actualCost}
                                             onChange={(val) => handleUpdateItem(item.id, 'actualCost', val)}
                                             className={`bg-transparent outline-none font-mono font-bold w-24 text-sm ${item.actualCost > item.estimatedCost ? 'text-red-500' : 'text-gray-800'}`}
                                          />
                                       </div>
                                    </div>
                                    <div>
                                       <select
                                          className={`text-[10px] font-bold px-2 py-1.5 rounded border outline-none ${getStatusColor(item.status)}`}
                                          value={item.status}
                                          onChange={(e) => handleUpdateItem(item.id, 'status', e.target.value)}
                                       >
                                          {Object.values(TaskStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                                       </select>
                                    </div>
                                 </div>
                              </div>

                              {/* Desktop Table View (>= LG) */}
                              <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 items-center text-sm">
                                 <div className="col-span-3 pl-2 min-w-0">
                                    <input
                                       className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-rose-400 focus:bg-white rounded px-2 py-1 outline-none font-bold text-gray-800 transition-all placeholder-gray-400"
                                       value={item.itemName}
                                       onChange={(e) => handleUpdateItem(item.id, 'itemName', e.target.value)}
                                       placeholder="Tên công việc..."
                                    />
                                    <input
                                       className="w-full bg-transparent border-none focus:ring-0 text-xs text-gray-400 italic outline-none px-2 mt-0.5"
                                       placeholder="Thêm ghi chú..."
                                       value={item.note || ''}
                                       onChange={(e) => handleUpdateItem(item.id, 'note', e.target.value)}
                                    />
                                 </div>

                                 <div className="col-span-2 flex flex-col gap-1 px-2">
                                    <input
                                       className="w-full bg-transparent border-b border-dashed border-gray-200 hover:border-rose-300 focus:border-rose-500 py-0.5 outline-none text-xs text-gray-600 font-medium"
                                       placeholder="Người phụ trách"
                                       value={item.assignee}
                                       onChange={(e) => handleUpdateItem(item.id, 'assignee', e.target.value)}
                                    />
                                    <div className="flex items-center text-gray-400 group/date">
                                       <CalendarIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                       <input
                                          type="date"
                                          className="bg-transparent outline-none text-[10px] font-mono w-full cursor-pointer text-gray-500 hover:text-gray-800"
                                          value={item.deadline || ''}
                                          onChange={(e) => handleUpdateItem(item.id, 'deadline', e.target.value)}
                                       />
                                    </div>
                                 </div>

                                 <div className="col-span-2">
                                    <div className="relative">
                                       <select
                                          className={`w-full text-xs px-2 py-1.5 rounded-lg border cursor-pointer font-bold outline-none transition-all appearance-none ${getStatusColor(item.status)}`}
                                          value={item.status}
                                          onChange={(e) => handleUpdateItem(item.id, 'status', e.target.value)}
                                       >
                                          {Object.values(TaskStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                                       </select>
                                       <ArrowUpDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                                    </div>
                                 </div>

                                 <div className="col-span-2 text-right">
                                    <CurrencyInput
                                       value={item.estimatedCost}
                                       onChange={(val) => handleUpdateItem(item.id, 'estimatedCost', val)}
                                       className="w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-rose-400 rounded px-2 py-1 outline-none font-mono text-gray-500 text-right"
                                    />
                                 </div>

                                 <div className="col-span-2 text-right relative">
                                    <CurrencyInput
                                       value={item.actualCost}
                                       onChange={(val) => handleUpdateItem(item.id, 'actualCost', val)}
                                       className={`w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-rose-400 rounded px-2 py-1 outline-none font-mono font-bold text-right ${item.actualCost > item.estimatedCost ? 'text-red-500' : 'text-gray-800'}`}
                                    />
                                 </div>

                                 <div className="col-span-1 text-center">
                                    <button
                                       onClick={() => handleDelete(item.id)}
                                       className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
   );
};

export default DetailedBudgetPlanner;
