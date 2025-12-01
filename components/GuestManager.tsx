import React, { useState, useEffect } from 'react';
import { Guest, GuestGroup, AttendanceProbability } from '../types';
import { Plus, Trash2, FileSpreadsheet, Users, Baby, Banknote, CheckCircle, Search, ChevronUp } from 'lucide-react';
import { useStore } from '../store/useStore';

const GuestManager: React.FC = () => {
  const { guests, addGuest, removeGuest } = useStore();
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState<GuestGroup>(GuestGroup.FRIEND);
  const [newProb, setNewProb] = useState<AttendanceProbability>(AttendanceProbability.LIKELY);
  const [newChildren, setNewChildren] = useState(0);
  const [newRedEnvelope, setNewRedEnvelope] = useState(500000);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileAddOpen, setIsMobileAddOpen] = useState(false);

  // Resize listener to switch between Mobile Card view and Desktop Table view
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddGuest = () => {
    if (!newName.trim()) return;
    const newGuest: Guest = {
      id: Date.now().toString(),
      name: newName,
      group: newGroup,
      probability: Number(newProb),
      childrenCount: Number(newChildren),
      redEnvelope: Number(newRedEnvelope)
    };
    addGuest(newGuest);
    setNewName("");
    setNewChildren(0);
  };

  const handleRemoveGuest = (id: string) => {
    if (confirm("Xóa khách mời này?")) {
      removeGuest(id);
    }
  };

  const getProbLabel = (prob: number) => {
    switch (prob) {
      case 100: return "Chắc chắn";
      case 80: return "Khả năng cao";
      case 50: return "Có thể";
      case 0: return "Không tham dự";
      default: return "";
    }
  };

  const getProbColor = (prob: number) => {
    switch (prob) {
      case 100: return "bg-green-100 text-green-800";
      case 80: return "bg-blue-100 text-blue-800";
      case 50: return "bg-yellow-100 text-yellow-800";
      case 0: return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100";
    }
  };

  const exportToCSV = () => {
    const headers = ["Họ Tên", "Nhóm", "Khả năng tham dự (%)", "Số trẻ em", "Tiền mừng dự kiến"];
    const rows = guests.map(g => [
      g.name,
      g.group,
      `${g.probability}%`,
      g.childrenCount,
      g.redEnvelope
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
    link.setAttribute("download", "danh_sach_khach_moi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter guests
  const filteredGuests = guests.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- RENDER COMPONENTS (Standard List) ---

  // Desktop Row Renderer
  const DesktopRow: React.FC<{ guest: Guest }> = ({ guest }) => {
    return (
      <div className="grid grid-cols-12 gap-4 px-4 h-[54px] items-center border-b border-gray-100 hover:bg-rose-50/30 transition-colors text-sm text-gray-700">
        <div className="col-span-3 font-medium truncate pr-2">{guest.name}</div>
        <div className="col-span-2">
          <span className="bg-white border border-gray-200 px-2 py-1 rounded text-xs text-gray-600 truncate block w-fit">
            {guest.group}
          </span>
        </div>
        <div className="col-span-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getProbColor(guest.probability)}`}>
            {getProbLabel(guest.probability)}
          </span>
        </div>
        <div className="col-span-2 text-center">
          {guest.childrenCount > 0 ? (
            <span className="text-rose-600 font-bold">+{guest.childrenCount}</span>
          ) : (
            <span className="text-gray-300">-</span>
          )}
        </div>
        <div className="col-span-2 text-right font-mono">
          {guest.redEnvelope.toLocaleString('vi-VN')}
        </div>
        <div className="col-span-1 text-center">
          <button
            onClick={() => handleRemoveGuest(guest.id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Xóa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Mobile Row Renderer (Card based)
  const MobileRow: React.FC<{ guest: Guest }> = ({ guest }) => {
    return (
      <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm flex flex-col justify-between mb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-gray-800 text-sm">{guest.name}</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">{guest.group}</span>
          </div>
          <button onClick={() => handleRemoveGuest(guest.id)} className="text-gray-400 p-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mt-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getProbColor(guest.probability)}`}>
              {getProbLabel(guest.probability)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 justify-end">
            <Banknote className="w-3.5 h-3.5 text-green-500" />
            <span className="font-mono">{guest.redEnvelope.toLocaleString('vi-VN')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 col-span-2">
            <Baby className="w-3.5 h-3.5 text-rose-400" />
            <span>{guest.childrenCount > 0 ? `${guest.childrenCount} trẻ em` : 'Không có trẻ em'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-rose-100 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-rose-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-rose-50/50 gap-4 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-500" />
            Danh Sách Khách Mời
            <span className="bg-white text-rose-600 px-2 py-0.5 rounded-full text-xs border border-rose-200">{filteredGuests.length}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">Quản lý danh sách và dự toán tiền mừng</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Tìm kiếm..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:border-rose-500 outline-none text-sm bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span className="hidden sm:inline">Xuất</span>
          </button>
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <div className="md:hidden px-4 pt-3 pb-1">
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
            <>Thêm khách mời <Plus className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {/* Add Form (Collapsible on Mobile) */}
      <div className={`
         bg-gray-50 border-b border-gray-100 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden
         ${isMobileAddOpen ? 'max-h-[500px] border-t opacity-100' : 'max-h-0 border-t-0 opacity-0'} 
         md:max-h-none md:border-t md:opacity-100
      `}>
        <div className="p-4 grid grid-cols-2 md:grid-cols-6 gap-3">
          <input
            placeholder="Họ tên khách..."
            className="col-span-2 p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-sm"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <select
            className="col-span-1 p-2 rounded border border-gray-300 outline-none text-sm"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value as GuestGroup)}
          >
            {Object.values(GuestGroup).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select
            className="col-span-1 p-2 rounded border border-gray-300 outline-none text-sm"
            value={newProb}
            onChange={(e) => setNewProb(Number(e.target.value) as AttendanceProbability)}
          >
            <option value={AttendanceProbability.CONFIRMED}>Chắc chắn</option>
            <option value={AttendanceProbability.LIKELY}>Cao</option>
            <option value={AttendanceProbability.POSSIBLE}>Có thể</option>
            <option value={AttendanceProbability.UNLIKELY}>Không</option>
          </select>

          <div className="col-span-2 md:col-span-1 flex gap-2">
            <input
              type="number"
              min="0"
              placeholder="Trẻ em"
              className="w-1/2 md:w-full p-2 rounded border border-gray-300 outline-none text-sm"
              value={newChildren}
              onChange={(e) => setNewChildren(Number(e.target.value))}
              title="Số trẻ em đi kèm"
            />
            <input
              type="number"
              min="0"
              step="100000"
              placeholder="Mừng"
              className="w-1/2 md:w-full p-2 rounded border border-gray-300 outline-none text-sm"
              value={newRedEnvelope}
              onChange={(e) => setNewRedEnvelope(Number(e.target.value))}
              title="Tiền mừng dự kiến"
            />
          </div>

          <button
            onClick={handleAddGuest}
            className="col-span-2 md:col-span-1 bg-rose-500 hover:bg-rose-600 text-white p-2 rounded font-medium flex justify-center items-center gap-1 transition-colors text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Thêm
          </button>
        </div>
      </div>

      {/* Desktop Header Row (Sticky visual) */}
      {!isMobile && (
        <div className="bg-gray-50 text-gray-600 text-sm font-semibold uppercase tracking-wider grid grid-cols-12 gap-4 px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="col-span-3">Họ Tên</div>
          <div className="col-span-2">Nhóm</div>
          <div className="col-span-2">Trạng thái</div>
          <div className="col-span-2 text-center">Trẻ em</div>
          <div className="col-span-2 text-right">Mừng (Dự kiến)</div>
          <div className="col-span-1 text-center">Xóa</div>
        </div>
      )}

      {/* Scrollable List Container */}
      <div className="flex-1 bg-white min-h-0 overflow-y-auto">
        {filteredGuests.length === 0 ? (
          <div className="p-8 text-center text-gray-400 italic">
            {searchTerm ? 'Không tìm thấy khách mời phù hợp.' : 'Chưa có khách mời nào.'}
          </div>
        ) : (
          <div className={isMobile ? "p-2 pb-20" : ""}>
            {filteredGuests.map((guest) => (
              isMobile ? <MobileRow key={guest.id} guest={guest} /> : <DesktopRow key={guest.id} guest={guest} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestManager;