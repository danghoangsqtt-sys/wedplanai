import React, { useState, useMemo, useEffect } from 'react';
import { BudgetItem, TaskStatus, WeddingSide } from '../types';
import { 
  Plus, Trash2, Calendar as CalendarIcon, Search, 
  ArrowUpRight, Wallet, Filter, ArrowUpDown, FileSpreadsheet, 
  DollarSign, Check
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
  // Local state to handle the display string (e.g., "100.000")
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    // Sync with external value changes
    setDisplayValue(value === 0 ? '' : new Intl.NumberFormat('vi-VN').format(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Get raw input
    const rawInput = e.target.value;
    
    // 2. Remove non-numeric characters (keep digits only)
    const numericString = rawInput.replace(/\D/g, '');

    if (!numericString) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    // 3. Parse to integer
    const numberValue = parseInt(numericString, 10);

    // 4. Update display with dots
    setDisplayValue(new Intl.NumberFormat('vi-VN').format(numberValue));

    // 5. Trigger parent change
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

  // New Item State
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Chung");
  const [newItemCost, setNewItemCost] = useState(0);

  // Suggestions for categories
  const existingCategories = useMemo(() => 
    Array.from(new Set(budgetItems.map(i => i.category))), 
  [budgetItems]);

  // --- Logic Export CSV ---
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

  // --- Derived Data & Calculations ---

  const filteredItems = useMemo(() => {
    let items = budgetItems.filter(item => {
      const matchesSide = filterSide === 'ALL' || item.side === filterSide || item.side === 'BOTH';
      const matchesStatus = filterStatus === 'ALL' || item.status === filterStatus;
      const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.assignee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSide && matchesStatus && matchesSearch;
    });

    // Sort items
    if (sortBy === 'COST_DESC') {
      items.sort((a, b) => b.estimatedCost - a.estimatedCost);
    } else if (sortBy === 'COST_ASC') {
      items.sort((a, b) => a.estimatedCost - b.estimatedCost);
    } else if (sortBy === 'DEADLINE') {
      items.sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'));
    }

    return items;
  }, [budgetItems, filterSide, filterStatus, searchTerm, sortBy]);

  // Group items by category with totals
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

    // Convert to array and sort groups by Total Estimated Cost (High to Low)
    return Object.entries(groups).sort(([, a], [, b]) => b.subTotalEst - a.subTotalEst);
  }, [filteredItems]);

  // Global Stats
  const stats = useMemo(() => {
    const estimated = filteredItems.reduce((acc, i) => acc + i.estimatedCost, 0);
    const actual = filteredItems.reduce((acc, i) => acc + i.actualCost, 0);
    const percentUsed = estimated > 0 ? (actual / estimated) * 100 : 0;
    
    return { estimated, actual, percentUsed };
  }, [filteredItems]);

  // --- Handlers ---

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
      
      {/* 1. Header Area - Sticky */}
      <div className="bg-white border-b border-rose-100 shadow-sm z-30 sticky top-0">
        
        {/* Top Bar: Title & Primary Actions */}
        <div className="p-3 md:p-4 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="p-2.5 bg-rose-500 rounded-xl text-white shadow-md shadow-rose-200">
               <Wallet className="w-5 h-5" />
             </div>
             <div className="flex-1">
               <h2 className="text-lg md:text-xl font-bold text-gray-800">Quản Lý Ngân Sách</h2>
               <p className="text-xs text-gray-500 hidden md:block">Kiểm soát chi tiêu, tránh phát sinh</p>
               
               {/* Mini Stats for Mobile */}
               <div className="flex md:hidden items-center gap-2 text-xs text-gray-500 mt-1 font-medium bg-gray-50 px-2 py-1 rounded-md w-fit whitespace-nowrap overflow-x-auto">
                  <span>Dự: {stats.estimated.toLocaleString('vi-VN')}</span>
                  <span className="text-gray-300">|</span>
                  <span className={stats.actual > stats.estimated ? 'text-red-500' : 'text-emerald-500'}>
                     Thực: {stats.actual.toLocaleString('vi-VN')}
                  </span>
               </div>
             </div>
             
             {/* Mobile Export Button */}
             <button onClick={exportToCSV} className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded">
                <FileSpreadsheet className="w-5 h-5" />
             </button>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
            {/* Desktop Stats (Compact) */}
            <div className="hidden md:flex items-center gap-6 mr-2">
                <div className="text-right">
                   <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tổng Dự Kiến</div>
                   <div className="text-lg font-bold text-gray-800">{stats.estimated.toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-normal">đ</span></div>
                </div>
                <div className="h-8 w-px bg-gray-100"></div>
                <div className="text-right">
                   <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Đã Chi Tiêu</div>
                   <div className={`text-lg font-bold ${stats.actual > stats.estimated ? 'text-red-500' : 'text-emerald-500'}`}>
                      {stats.actual.toLocaleString('vi-VN')} <span className="text-xs text-gray-400 font-normal">đ</span>
                   </div>
                </div>
            </div>

            <button 
               onClick={exportToCSV}
               className="hidden md:flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
            >
               <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
               <span>Excel</span>
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="px-3 md:px-4 pb-3 flex flex-col xl:flex-row gap-3">
            <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                  type="text" 
                  placeholder="Tìm khoản chi, người phụ trách..." 
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none text-sm bg-gray-50 focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
               />
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 xl:pb-0 touch-pan-x">
               {/* Side Filter */}
               <div className="flex bg-gray-100 p-1 rounded-xl flex-shrink-0">
                  <button onClick={() => setFilterSide('ALL')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filterSide === 'ALL' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Tất cả</button>
                  <button onClick={() => setFilterSide('GROOM')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filterSide === 'GROOM' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Nhà Trai</button>
                  <button onClick={() => setFilterSide('BRIDE')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filterSide === 'BRIDE' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Nhà Gái</button>
               </div>

               {/* Status Filter */}
               <div className="relative flex-shrink-0">
                   <select 
                      className="pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 focus:border-rose-500 outline-none text-sm bg-white appearance-none h-full cursor-pointer hover:bg-gray-50 font-medium"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'ALL')}
                   >
                      <option value="ALL">Mọi trạng thái</option>
                      {Object.values(TaskStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                   </select>
                   <Filter className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
               </div>

               {/* Sort */}
               <div className="relative flex-shrink-0">
                   <select 
                      className="pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 focus:border-rose-500 outline-none text-sm bg-white appearance-none h-full cursor-pointer hover:bg-gray-50 font-medium"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                   >
                      <option value="DEFAULT">Mặc định</option>
                      <option value="COST_DESC">Giá cao ➝ thấp</option>
                      <option value="COST_ASC">Giá thấp ➝ cao</option>
                      <option value="DEADLINE">Hạn chót</option>
                   </select>
                   <ArrowUpDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
               </div>
            </div>
        </div>

        {/* Quick Add Bar */}
        <div className="bg-rose-50 border-t border-rose-100 p-3 md:p-4">
           <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-12 md:col-span-4">
                 <input 
                   placeholder="Nhập tên khoản chi mới..." 
                   className="w-full px-4 py-2.5 text-sm rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none shadow-sm font-medium placeholder-rose-300 bg-white"
                   value={newItemName}
                   onChange={(e) => setNewItemName(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                 />
              </div>
              <div className="col-span-6 md:col-span-3">
                 <input 
                   list="categories"
                   placeholder="Danh mục" 
                   className="w-full px-4 py-2.5 text-sm rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none shadow-sm bg-white"
                   value={newItemCategory}
                   onChange={(e) => setNewItemCategory(e.target.value)}
                 />
                 <datalist id="categories">
                   {existingCategories.map((c: string) => <option key={c} value={c} />)}
                 </datalist>
              </div>
              <div className="col-span-6 md:col-span-3">
                 <div className="relative">
                    <CurrencyInput
                      value={newItemCost}
                      onChange={setNewItemCost}
                      placeholder="Dự trù..."
                      className="w-full pl-4 pr-3 py-2.5 text-sm rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none shadow-sm font-mono font-bold text-rose-600 bg-white"
                    />
                 </div>
              </div>
              <div className="col-span-12 md:col-span-2">
                 <button 
                  onClick={handleAddItem}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-sm font-bold shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Plus className="w-5 h-5" /> <span className="inline">Thêm</span>
                </button>
              </div>
           </div>
        </div>
      </div>

      {/* 2. Scrollable List Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6">
         {groupedData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
               <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                 <DollarSign className="w-12 h-12 text-gray-300" />
               </div>
               <p className="text-lg font-bold text-gray-600">Chưa có dữ liệu</p>
               <p className="text-sm">Hãy thêm khoản chi đầu tiên hoặc điều chỉnh bộ lọc.</p>
            </div>
         )}

         {groupedData.map(([category, groupData]) => {
           const { items, subTotalEst, subTotalAct } = groupData;
           const isGroupOverBudget = subTotalAct > subTotalEst;
           const groupPercent = subTotalEst > 0 ? (subTotalAct / subTotalEst) * 100 : 0;
           
           return (
             <div key={category as string} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                
                {/* Category Header */}
                <div className="bg-gray-50/80 backdrop-blur-sm p-4 border-b border-gray-100 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 sticky top-0 z-10">
                   {/* Progress Bar Background */}
                   <div className="absolute bottom-0 left-0 h-1 bg-gray-200 w-full opacity-50">
                      <div 
                         className={`h-full transition-all duration-500 ${isGroupOverBudget ? 'bg-red-500' : 'bg-emerald-500'}`} 
                         style={{width: `${Math.min(groupPercent, 100)}%`}}
                      />
                   </div>

                   <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm text-gray-700 font-bold text-lg flex-shrink-0">
                         {category.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-base md:text-lg truncate">{category}</h3>
                        <p className="text-xs text-gray-500 font-medium">{items.length} hạng mục</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-4 text-sm ml-auto bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
                      <div className="text-right">
                         <div className="text-[10px] text-gray-400 font-bold uppercase">Dự kiến</div>
                         <div className="font-mono font-bold text-gray-600">{subTotalEst.toLocaleString('vi-VN')}</div>
                      </div>
                      <div className="w-px h-8 bg-gray-100 mx-1 hidden sm:block"></div>
                      <div className="text-right">
                         <div className="text-[10px] text-gray-400 font-bold uppercase">Thực tế</div>
                         <div className={`font-mono font-bold flex items-center gap-1 ${isGroupOverBudget ? 'text-red-500' : 'text-emerald-500'}`}>
                            {subTotalAct.toLocaleString('vi-VN')}
                            {isGroupOverBudget && <ArrowUpRight className="w-3 h-3"/>}
                         </div>
                      </div>
                   </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-gray-50">
                  {/* Desktop Table Header */}
                  <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-white">
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
                        <div className="lg:hidden p-4 relative">
                           {/* Row 1: Name & Delete */}
                           <div className="flex justify-between items-start mb-3 gap-3">
                              <div className="flex-1 min-w-0">
                                <input 
                                  className="font-bold text-gray-800 bg-transparent border-b border-dashed border-transparent focus:border-rose-300 outline-none w-full text-base py-1"
                                  value={item.itemName}
                                  onChange={(e) => handleUpdateItem(item.id, 'itemName', e.target.value)}
                                />
                              </div>
                              <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500 p-2 -mr-2 -mt-2 flex-shrink-0">
                                 <Trash2 className="w-5 h-5" />
                              </button>
                           </div>
                           
                           {/* Row 2: Assignee & Date & Note */}
                           <div className="flex flex-wrap gap-2 mb-4">
                              <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-1.5 rounded-lg max-w-[48%]">
                                 <input 
                                    className="text-xs bg-transparent border-none outline-none text-gray-700 w-full truncate placeholder-gray-400 font-medium"
                                    placeholder="Người phụ trách"
                                    value={item.assignee}
                                    onChange={(e) => handleUpdateItem(item.id, 'assignee', e.target.value)}
                                 />
                              </div>
                              <div className="flex items-center gap-1 bg-gray-50 border border-gray-100 px-2 py-1.5 rounded-lg">
                                 <CalendarIcon className="w-3 h-3 text-gray-400" />
                                 <input 
                                    type="date"
                                    className="bg-transparent text-xs outline-none text-gray-600 font-mono w-20"
                                    value={item.deadline || ''}
                                    onChange={(e) => handleUpdateItem(item.id, 'deadline', e.target.value)}
                                 />
                              </div>
                              <input 
                                className="w-full bg-transparent border-b border-gray-100 focus:border-rose-300 outline-none text-xs text-gray-500 italic py-1 mt-1"
                                placeholder="Ghi chú..."
                                value={item.note || ''}
                                onChange={(e) => handleUpdateItem(item.id, 'note', e.target.value)}
                              />
                           </div>

                           {/* Row 3: Costs & Status */}
                           <div className="grid grid-cols-2 gap-3 items-end">
                               <div className="space-y-3">
                                   <div className="flex justify-between text-xs text-gray-500 items-center">
                                      <span>Dự trù:</span>
                                      <CurrencyInput 
                                        value={item.estimatedCost} 
                                        onChange={(val) => handleUpdateItem(item.id, 'estimatedCost', val)}
                                        className="bg-transparent text-right outline-none font-mono text-gray-500 w-28 border-b border-dashed border-gray-200 focus:border-rose-400 py-1"
                                      />
                                   </div>
                                   <div className="flex justify-between text-sm font-bold items-center bg-gray-50 p-2 rounded-lg border border-gray-100">
                                      <span className="text-gray-500 text-xs uppercase mr-2">Thực:</span>
                                      <CurrencyInput 
                                        value={item.actualCost}
                                        onChange={(val) => handleUpdateItem(item.id, 'actualCost', val)}
                                        className={`bg-transparent w-full font-mono outline-none text-right ${item.actualCost > item.estimatedCost ? 'text-red-500' : 'text-gray-800'}`}
                                      />
                                   </div>
                               </div>
                               <div>
                                 <select 
                                    className={`w-full text-xs px-3 py-3 rounded-lg border outline-none appearance-none font-bold ${getStatusColor(item.status)}`}
                                    value={item.status}
                                    onChange={(e) => handleUpdateItem(item.id, 'status', e.target.value)}
                                 >
                                    {Object.values(TaskStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                                 </select>
                               </div>
                           </div>
                        </div>

                        {/* Desktop Table View (>= LG) */}
                        <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 items-center">
                            {/* Col 1: Name & Note */}
                            <div className="col-span-3 pl-2 min-w-0">
                               <input 
                                  className="w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-rose-400 focus:bg-white rounded px-2 py-1 outline-none text-sm font-bold text-gray-800 transition-all placeholder-gray-400"
                                  value={item.itemName}
                                  onChange={(e) => handleUpdateItem(item.id, 'itemName', e.target.value)}
                                  placeholder="Tên công việc..."
                               />
                               <div className="flex items-center px-2 mt-0.5">
                                 <input 
                                    className="w-full bg-transparent border-none focus:ring-0 text-xs text-gray-400 italic outline-none placeholder-gray-300"
                                    placeholder="Thêm ghi chú..."
                                    value={item.note || ''}
                                    onChange={(e) => handleUpdateItem(item.id, 'note', e.target.value)}
                                 />
                               </div>
                            </div>
                            
                            {/* Col 2: Assignee & Date */}
                            <div className="col-span-2 flex flex-col gap-1 px-2">
                               <input 
                                  className="w-full bg-transparent border-b border-dashed border-gray-200 hover:border-rose-300 focus:border-rose-500 py-0.5 outline-none text-xs text-gray-600 font-medium"
                                  placeholder="Chưa phân công"
                                  value={item.assignee}
                                  onChange={(e) => handleUpdateItem(item.id, 'assignee', e.target.value)}
                               />
                               <div className="flex items-center text-gray-400 group/date">
                                  <CalendarIcon className="w-3 h-3 mr-1 group-hover/date:text-rose-400 flex-shrink-0" />
                                  <input 
                                    type="date"
                                    className="bg-transparent outline-none text-[10px] font-mono w-full cursor-pointer text-gray-500 hover:text-gray-800"
                                    value={item.deadline || ''}
                                    onChange={(e) => handleUpdateItem(item.id, 'deadline', e.target.value)}
                                 />
                               </div>
                            </div>

                            {/* Col 3: Status */}
                            <div className="col-span-2">
                                <div className="relative">
                                  <select 
                                    className={`w-full text-xs px-3 py-1.5 rounded-lg border cursor-pointer font-bold outline-none transition-all appearance-none ${getStatusColor(item.status)}`}
                                    value={item.status}
                                    onChange={(e) => handleUpdateItem(item.id, 'status', e.target.value)}
                                  >
                                    {Object.values(TaskStatus).map((s: string) => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                     <ArrowUpDown className="w-3 h-3" />
                                  </div>
                                </div>
                            </div>

                            {/* Col 4: Estimated */}
                            <div className="col-span-2 text-right">
                               <CurrencyInput
                                  value={item.estimatedCost}
                                  onChange={(val) => handleUpdateItem(item.id, 'estimatedCost', val)}
                                  className="w-full bg-transparent border-b border-transparent hover:border-gray-200 focus:border-rose-400 rounded px-2 py-1 outline-none text-sm font-mono text-gray-500 text-right"
                               />
                            </div>

                            {/* Col 5: Actual */}
                            <div className="col-span-2 text-right relative">
                               <CurrencyInput
                                  value={item.actualCost}
                                  onChange={(val) => handleUpdateItem(item.id, 'actualCost', val)}
                                  className={`w-full bg-transparent border border-transparent hover:border-gray-200 focus:border-rose-400 rounded px-2 py-1 outline-none text-sm font-mono font-bold text-right ${item.actualCost > item.estimatedCost ? 'text-red-500' : 'text-gray-800'}`}
                               />
                               {item.actualCost > item.estimatedCost && (
                                  <div className="absolute right-0 -top-1" title="Vượt ngân sách">
                                    <span className="flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                                    </span>
                                  </div>
                               )}
                            </div>

                            {/* Col 6: Actions */}
                            <div className="col-span-1 text-center">
                               <button 
                                  onClick={() => handleDelete(item.id)}
                                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                  title="Xóa mục này"
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