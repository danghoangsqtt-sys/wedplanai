
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Guest, GuestGroup, AttendanceProbability } from '../types';
import { Plus, Trash2, FileSpreadsheet, Users, Baby, Banknote, CheckCircle, Search, ChevronUp, MapPin, Pencil, Check, X, RefreshCw, UserCheck, UserX, PhoneCall, MessageSquare, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { sanitizeGuestInput, isValidAttendanceProbability } from '../lib/sanitize';
import { loadInvitationResponses, InvitationResponse } from '../services/cloudService';
import { OWNER_UID } from '../lib/constants';

const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const GuestManager: React.FC = () => {
  const { guests, addGuest, removeGuest, updateGuest } = useStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<'list' | 'rsvp'>('list');

  // RSVP tab state
  const [rsvpList, setRsvpList] = useState<InvitationResponse[]>([]);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const loadRsvp = useCallback(async () => {
    setRsvpLoading(true);
    try {
      const { rsvps } = await loadInvitationResponses(OWNER_UID);
      setRsvpList(rsvps);
    } catch {
      /* ignore */
    } finally {
      setRsvpLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'rsvp') loadRsvp();
  }, [activeTab, loadRsvp]);

  // Import RSVP submission → add to guests[] — default 500k (mức cơ bản Việt Nam)
  const handleImportRsvp = (r: InvitationResponse) => {
    if (importedIds.has(r.id)) return;
    // BUG-007 fix: check duplicate by name (case-insensitive) before adding
    // importedIds resets on navigate, so this is the true duplicate guard
    const normalizedName = r.name.trim().toLowerCase();
    const alreadyExists = guests.some(g => g.name.trim().toLowerCase() === normalizedName);
    if (alreadyExists) {
      // Still mark as imported so the UI shows "Đã import"
      setImportedIds(prev => new Set([...prev, r.id]));
      return;
    }
    const newGuest: Guest = {
      id: generateId(),
      name: r.name.trim().slice(0, 100),
      group: GuestGroup.FRIEND,
      probability: r.attending === 'yes' ? AttendanceProbability.CONFIRMED : AttendanceProbability.UNLIKELY,
      childrenCount: 0,
      redEnvelope: 500000, // Mức mừng cơ bản 500.000đ (Việt Nam)
    };
    addGuest(newGuest);
    setImportedIds(prev => new Set([...prev, r.id]));
  };

  // Add form state
  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState<GuestGroup>(GuestGroup.FRIEND);
  const [newAddress, setNewAddress] = useState("");
  const [newProb, setNewProb] = useState<AttendanceProbability>(AttendanceProbability.LIKELY);
  const [newChildren, setNewChildren] = useState(0);
  const [newRedEnvelope, setNewRedEnvelope] = useState(500000);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isMobileAddOpen, setIsMobileAddOpen] = useState(false);

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Guest>>({});

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddGuest = () => {
    const sanitizedName = sanitizeGuestInput(newName);
    if (!sanitizedName) return;
    const children = Number(newChildren);
    const envelope = Number(newRedEnvelope);
    if (isNaN(children) || children < 0 || isNaN(envelope) || envelope < 0) return;
    const prob = Number(newProb);
    if (!isValidAttendanceProbability(prob)) return;
    const newGuest: Guest = {
      id: generateId(),
      name: sanitizedName,
      group: newGroup,
      address: newAddress.trim().slice(0, 200) || undefined,
      probability: prob as AttendanceProbability,
      childrenCount: Math.min(children, 20),
      redEnvelope: envelope,
    };
    addGuest(newGuest);
    setNewName("");
    setNewAddress("");
    setNewProb(AttendanceProbability.LIKELY);
    setNewChildren(0);
    setNewRedEnvelope(500000);
    setIsMobileAddOpen(false);
  };

  const handleRemoveGuest = (id: string) => {
    if (confirm("Xóa khách mời này?")) {
      removeGuest(id);
    }
  };

  const handleEditStart = (guest: Guest) => {
    setEditingId(guest.id);
    setEditForm({ ...guest });
  };

  const handleEditSave = () => {
    if (!editingId || !editForm.name?.trim()) return;
    updateGuest({
      ...editForm,
      name: editForm.name.trim(),
      address: editForm.address?.trim() || undefined,
      id: editingId,
      group: editForm.group ?? GuestGroup.FRIEND,
      probability: editForm.probability ?? AttendanceProbability.LIKELY,
      childrenCount: Number(editForm.childrenCount ?? 0),
      redEnvelope: Number(editForm.redEnvelope ?? 0),
    } as Guest);
    setEditingId(null);
    setEditForm({});
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const getProbLabel = (prob: number) => {
    switch (prob) {
      case 100: return "Chắc chắn";
      case 80: return "Cao";
      case 50: return "Có thể";
      case 0: return "Không";
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
    try {
      const headers = ["Họ Tên", "Nhóm", "Địa chỉ", "Khả năng tham dự (%)", "Số trẻ em", "Tiền mừng dự kiến"];
      const rows = guests.map(g => [
        g.name,
        g.group,
        g.address || '',
        `${g.probability}%`,
        g.childrenCount,
        g.redEnvelope
      ]);
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(item => `"${String(item).replace(/"/g, '""')}"`).join(","))
      ].join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "danh_sach_khach_moi.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('CSV export failed:', e);
    }
  };

  const filteredGuests = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return guests;
    return guests.filter(g =>
      g.name.toLowerCase().includes(term) ||
      g.group.toLowerCase().includes(term) ||
      (g.address?.toLowerCase().includes(term) ?? false)
    );
  }, [guests, searchTerm]);

  // --- INLINE EDIT ROW (Desktop) ---
  const EditRow: React.FC<{ guest: Guest }> = ({ guest }) => (
    <div className="grid grid-cols-12 gap-2 px-4 py-2 items-center border-b border-rose-200 bg-rose-50/60 text-sm">
      <input
        autoFocus
        className="col-span-2 px-2 py-1 rounded border border-rose-300 focus:border-rose-500 outline-none text-sm"
        value={editForm.name ?? ''}
        onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
        onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') handleEditCancel(); }}
        placeholder="Họ tên..."
      />
      <select
        title="Nhóm khách"
        className="col-span-2 px-2 py-1 rounded border border-gray-300 outline-none text-sm"
        value={editForm.group ?? GuestGroup.FRIEND}
        onChange={(e) => setEditForm(f => ({ ...f, group: e.target.value as GuestGroup }))}
      >
        {Object.values(GuestGroup).map(g => <option key={g} value={g}>{g}</option>)}
      </select>
      <input
        className="col-span-3 px-2 py-1 rounded border border-gray-300 focus:border-rose-400 outline-none text-sm"
        value={editForm.address ?? ''}
        onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))}
        placeholder="Địa chỉ..."
        title="Địa chỉ"
      />
      <select
        title="Khả năng tham dự"
        className="col-span-2 px-2 py-1 rounded border border-gray-300 outline-none text-sm"
        value={editForm.probability ?? AttendanceProbability.LIKELY}
        onChange={(e) => setEditForm(f => ({ ...f, probability: Number(e.target.value) as AttendanceProbability }))}
      >
        <option value={AttendanceProbability.CONFIRMED}>Chắc chắn</option>
        <option value={AttendanceProbability.LIKELY}>Cao</option>
        <option value={AttendanceProbability.POSSIBLE}>Có thể</option>
        <option value={AttendanceProbability.UNLIKELY}>Không</option>
      </select>
      <input
        type="number" min="0"
        title="Số trẻ em"
        placeholder="Trẻ"
        className="col-span-1 px-1 py-1 rounded border border-gray-300 outline-none text-sm text-center"
        value={editForm.childrenCount ?? 0}
        onChange={(e) => setEditForm(f => ({ ...f, childrenCount: Math.max(0, Number(e.target.value)) }))}
      />
      <input
        type="number" min="0" step="100000"
        title="Tiền mừng dự kiến"
        placeholder="Mừng"
        className="col-span-1 px-1 py-1 rounded border border-gray-300 outline-none text-sm font-mono"
        value={editForm.redEnvelope ?? 0}
        onChange={(e) => setEditForm(f => ({ ...f, redEnvelope: Math.max(0, Number(e.target.value)) }))}
      />
      <div className="col-span-1 flex gap-1 justify-center">
        <button type="button" onClick={handleEditSave} className="p-1 text-green-600 hover:bg-green-100 rounded" title="Lưu">
          <Check className="w-4 h-4" />
        </button>
        <button type="button" onClick={handleEditCancel} className="p-1 text-gray-400 hover:bg-gray-100 rounded" title="Hủy">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // --- DESKTOP ROW ---
  const DesktopRow: React.FC<{ guest: Guest }> = ({ guest }) => {
    if (editingId === guest.id) return <EditRow guest={guest} />;
    return (
      <div className="grid grid-cols-12 gap-2 px-4 h-[54px] items-center border-b border-gray-100 hover:bg-rose-50/30 transition-colors text-sm text-gray-700">
        <div className="col-span-2 font-medium truncate" title={guest.name}>{guest.name}</div>
        <div className="col-span-2">
          <span className="bg-white border border-gray-200 px-2 py-1 rounded text-xs text-gray-600 truncate block w-fit max-w-full">
            {guest.group}
          </span>
        </div>
        <div className="col-span-3 text-xs text-gray-500 truncate" title={guest.address}>
          {guest.address ? (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 flex-shrink-0" /> {guest.address}</span>
          ) : <span className="text-gray-300">-</span>}
        </div>
        <div className="col-span-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getProbColor(guest.probability)} whitespace-nowrap`}>
            {getProbLabel(guest.probability)}
          </span>
        </div>
        <div className="col-span-1 text-center text-xs">
          {guest.childrenCount > 0 ? (
            <span className="text-rose-600 font-bold">+{guest.childrenCount}</span>
          ) : (
            <span className="text-gray-300">-</span>
          )}
        </div>
        <div className="col-span-1 text-right font-mono text-xs">
          {(guest.redEnvelope / 1000).toLocaleString('vi-VN')}k
        </div>
        <div className="col-span-1 flex gap-0.5 justify-center">
          <button
            onClick={() => handleEditStart(guest)}
            className="text-gray-400 hover:text-rose-500 transition-colors p-1"
            title="Sửa"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
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

  // --- MOBILE ROW ---
  const MobileRow: React.FC<{ guest: Guest }> = ({ guest }) => {
    const isEditing = editingId === guest.id;

    if (isEditing) {
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 shadow-sm flex flex-col gap-2 mb-2">
          <input
            autoFocus
            className="w-full px-2 py-1.5 rounded border border-rose-300 focus:border-rose-500 outline-none text-sm font-bold"
            placeholder="Họ tên..."
            value={editForm.name ?? ''}
            onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
          />
          <input
            className="w-full px-2 py-1.5 rounded border border-gray-300 outline-none text-sm"
            placeholder="Địa chỉ (tùy chọn)..."
            value={editForm.address ?? ''}
            onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              title="Nhóm khách"
              className="px-2 py-1.5 rounded border border-gray-300 outline-none text-sm"
              value={editForm.group ?? GuestGroup.FRIEND}
              onChange={(e) => setEditForm(f => ({ ...f, group: e.target.value as GuestGroup }))}
            >
              {Object.values(GuestGroup).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              title="Khả năng tham dự"
              className="px-2 py-1.5 rounded border border-gray-300 outline-none text-sm"
              value={editForm.probability ?? AttendanceProbability.LIKELY}
              onChange={(e) => setEditForm(f => ({ ...f, probability: Number(e.target.value) as AttendanceProbability }))}
            >
              <option value={AttendanceProbability.CONFIRMED}>Chắc chắn</option>
              <option value={AttendanceProbability.LIKELY}>Cao</option>
              <option value={AttendanceProbability.POSSIBLE}>Có thể</option>
              <option value={AttendanceProbability.UNLIKELY}>Không</option>
            </select>
            <input
              type="number" min="0"
              className="px-2 py-1.5 rounded border border-gray-300 outline-none text-sm text-center"
              placeholder="Trẻ em"
              value={editForm.childrenCount ?? 0}
              onChange={(e) => setEditForm(f => ({ ...f, childrenCount: Math.max(0, Number(e.target.value)) }))}
            />
            <input
              type="number" min="0" step="100000"
              className="px-2 py-1.5 rounded border border-gray-300 outline-none text-sm font-mono"
              placeholder="Tiền mừng"
              value={editForm.redEnvelope ?? 0}
              onChange={(e) => setEditForm(f => ({ ...f, redEnvelope: Math.max(0, Number(e.target.value)) }))}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleEditSave}
              className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" /> Lưu
            </button>
            <button
              type="button"
              onClick={handleEditCancel}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-bold flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4" /> Hủy
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm flex flex-col justify-between mb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-gray-800 text-sm truncate">{guest.name}</h3>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full inline-block">{guest.group}</span>
              {guest.address && (
                <span className="text-xs text-gray-500 flex items-center gap-1 truncate max-w-full">
                  <MapPin className="w-3 h-3" /> {guest.address}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-0.5 flex-shrink-0">
            <button type="button" title="Sửa" onClick={() => handleEditStart(guest)} className="text-gray-400 hover:text-rose-500 p-1">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button type="button" title="Xóa" onClick={() => handleRemoveGuest(guest.id)} className="text-gray-400 hover:text-red-500 p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mt-3 border-t border-gray-50 pt-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-gray-400" />
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getProbColor(guest.probability)}`}>
              {getProbLabel(guest.probability)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600 justify-end">
            <Banknote className="w-3.5 h-3.5 text-green-500" />
            <span className="font-mono font-bold text-green-700">{(guest.redEnvelope / 1000).toLocaleString('vi-VN')}k</span>
          </div>
          {guest.childrenCount > 0 && (
            <div className="flex items-center gap-1.5 text-gray-600 col-span-2">
              <Baby className="w-3.5 h-3.5 text-rose-400" />
              <span>{guest.childrenCount} trẻ em</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── RSVP Stats — dùng 500.000đ/người (mức cơ bản Việt Nam) ────────────────────────────────
  const BASE_GIFT_VND = 500000; // Mức mừng cơ bản Việt Nam
  const rsvpStats = useMemo(() => {
    const attending = rsvpList.filter(r => r.attending === 'yes');
    const notAttending = rsvpList.filter(r => r.attending === 'no');
    const totalGuests = attending.reduce((s, r) => s + (r.guestCount ?? 1), 0);
    const expectedGift = totalGuests * BASE_GIFT_VND; // 500k × số khách
    return { attending, notAttending, totalGuests, expectedGift };
  }, [rsvpList]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-rose-100 overflow-hidden h-full flex flex-col">

      {/* ── Tab Bar ── */}
      <div className="flex border-b border-rose-100 flex-shrink-0 bg-rose-50/30">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
            activeTab === 'list'
              ? 'border-rose-500 text-rose-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Danh Sách
          <span className="bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full text-[10px]">{guests.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rsvp')}
          className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-b-2 ${
            activeTab === 'rsvp'
              ? 'border-emerald-500 text-emerald-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          RSVP Thực Tế
          {rsvpList.length > 0 && (
            <span className="bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full text-[10px]">{rsvpList.length}</span>
          )}
        </button>
      </div>

      {/* ── RSVP DASHBOARD TAB ── */}
      {activeTab === 'rsvp' && (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Refresh */}
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="font-bold text-gray-800">Xác nhận tham dự từ thiệp</h3>
              <p className="text-xs text-gray-500 mt-0.5">Phản hồi từ khách mời qua đường link thiệp điện tử</p>
            </div>
            <button
              type="button"
              onClick={loadRsvp}
              disabled={rsvpLoading}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rsvpLoading ? 'animate-spin' : ''}`} />
              {rsvpLoading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>

          {/* 4 Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
              <UserCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-emerald-700">{rsvpStats.attending.length}</div>
              <div className="text-xs text-emerald-600 font-medium mt-0.5">Sẽ đến</div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <UserX className="w-6 h-6 text-red-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-red-600">{rsvpStats.notAttending.length}</div>
              <div className="text-xs text-red-500 font-medium mt-0.5">Không đến</div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-700">{rsvpStats.totalGuests}</div>
              <div className="text-xs text-blue-600 font-medium mt-0.5">Tổng số khách</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
              <Banknote className="w-6 h-6 text-amber-500 mx-auto mb-1" />
              <div className="text-lg font-bold text-amber-700">
                {rsvpStats.expectedGift >= 1000000
                  ? `${(rsvpStats.expectedGift / 1000000).toFixed(1)}M`
                  : `${(rsvpStats.expectedGift / 1000).toFixed(0)}k`
                }
              </div>
              <div className="text-xs text-amber-600 font-medium mt-0.5">Thu hồi dự kiến</div>
              <div className="text-[9px] text-amber-400 mt-0.5">~500k/người</div>
            </div>
          </div>

          {/* RSVP Submissions Table */}
          {rsvpLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Đang tải phản hồi...
            </div>
          ) : rsvpList.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Chưa có phản hồi nào</p>
              <p className="text-sm mt-1">Chia sẻ link thiệp để khách mời xác nhận tham dự</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rsvpList.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    r.attending === 'yes'
                      ? 'bg-emerald-50 border-emerald-100'
                      : 'bg-red-50 border-red-100'
                  }`}
                >
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    r.attending === 'yes' ? 'bg-emerald-500' : 'bg-red-400'
                  }`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">{r.name}</span>
                      {r.attending === 'yes' && r.guestCount && (
                        <span className="text-xs bg-white border border-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-full">
                          {r.guestCount} người
                        </span>
                      )}
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                        r.attending === 'yes'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {r.attending === 'yes' ? '✓ Sẽ đến' : '✗ Không đến'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {r.phone && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <PhoneCall className="w-3 h-3" />{r.phone}
                        </span>
                      )}
                      {r.message && (
                        <span className="text-xs text-gray-400 flex items-center gap-1 truncate max-w-[180px]">
                          <MessageSquare className="w-3 h-3 flex-shrink-0" />{r.message}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400">
                        {new Date(r.createdAt).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Import button */}
                  {r.attending === 'yes' && (
                    <button
                      type="button"
                      onClick={() => handleImportRsvp(r)}
                      disabled={importedIds.has(r.id)}
                      title={importedIds.has(r.id) ? 'Đã thêm vào danh sách' : 'Thêm vào danh sách khách mời'}
                      className={`flex-shrink-0 p-2 rounded-lg text-xs flex items-center gap-1 transition-all ${
                        importedIds.has(r.id)
                          ? 'bg-gray-100 text-gray-400 cursor-default'
                          : 'bg-white border border-emerald-300 text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {importedIds.has(r.id)
                        ? <Check className="w-3.5 h-3.5" />
                        : <Download className="w-3.5 h-3.5" />
                      }
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LIST TAB contents (original) ── */}
      {activeTab === 'list' && (<>

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
              placeholder="Tìm tên, nhóm, địa chỉ..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:border-rose-500 outline-none text-sm bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            type="button"
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
          type="button"
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

      {/* Add Form */}
      <div className={`
         bg-gray-50 border-b border-gray-100 flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden
         ${isMobileAddOpen ? 'max-h-[500px] border-t opacity-100' : 'max-h-0 border-t-0 opacity-0'}
         md:max-h-none md:border-t md:opacity-100
      `}>
        <div className="p-4 grid grid-cols-2 md:grid-cols-12 gap-3">
          <input
            placeholder="Họ tên khách..."
            className="col-span-2 md:col-span-3 p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-sm"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddGuest()}
          />
          <input
            placeholder="Địa chỉ (tùy chọn)..."
            className="col-span-2 md:col-span-3 p-2 rounded border border-gray-300 focus:border-rose-500 outline-none text-sm"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
          />
          <select
            title="Nhóm khách"
            className="col-span-1 md:col-span-2 p-2 rounded border border-gray-300 outline-none text-sm"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value as GuestGroup)}
          >
            {Object.values(GuestGroup).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select
            title="Khả năng tham dự"
            className="col-span-1 md:col-span-2 p-2 rounded border border-gray-300 outline-none text-sm"
            value={newProb}
            onChange={(e) => setNewProb(Number(e.target.value) as AttendanceProbability)}
          >
            <option value={AttendanceProbability.CONFIRMED}>Chắc chắn</option>
            <option value={AttendanceProbability.LIKELY}>Cao</option>
            <option value={AttendanceProbability.POSSIBLE}>Có thể</option>
            <option value={AttendanceProbability.UNLIKELY}>Không</option>
          </select>

          <div className="col-span-2 md:col-span-2 flex gap-2">
            <input
              type="number"
              min="0"
              placeholder="Trẻ"
              className="w-1/3 p-2 rounded border border-gray-300 outline-none text-sm text-center"
              value={newChildren}
              onChange={(e) => setNewChildren(Math.max(0, Number(e.target.value)))}
              title="Số trẻ em"
            />
            <input
              type="number"
              min="0"
              step="100000"
              placeholder="Mừng"
              className="w-2/3 p-2 rounded border border-gray-300 outline-none text-sm"
              value={newRedEnvelope}
              onChange={(e) => setNewRedEnvelope(Math.max(0, Number(e.target.value)))}
              title="Tiền mừng dự kiến"
            />
          </div>

          <button
            type="button"
            onClick={handleAddGuest}
            className="col-span-2 md:col-span-12 md:mt-2 bg-rose-500 hover:bg-rose-600 text-white py-2 rounded font-medium flex justify-center items-center gap-1 transition-colors text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Thêm Khách Mời
          </button>
        </div>
      </div>

      {/* Desktop Header Row */}
      {!isMobile && (
        <div className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="col-span-2">Họ Tên</div>
          <div className="col-span-2">Nhóm</div>
          <div className="col-span-3">Địa chỉ</div>
          <div className="col-span-2">Trạng thái</div>
          <div className="col-span-1 text-center">Trẻ em</div>
          <div className="col-span-1 text-right">Mừng</div>
          <div className="col-span-1 text-center">Thao tác</div>
        </div>
      )}

      {/* Scrollable List */}
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
      </>)}
    </div>
  );
};

export default GuestManager;
