import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  PhoneCall,
  MapPin,
  Check,
  Download,
  RefreshCw,
  MessageSquare,
  UserCheck,
  Send,
  Armchair,
} from "lucide-react";
import { AttendanceProbability, GuestGroup, type Guest } from "../types";
import { useStore } from "../store/useStore";
import {
  loadInvitationResponses,
  type InvitationResponse,
} from "../services/cloudService";
import { OWNER_UID } from "../lib/constants";
import { guestFromRsvp, guestPartySize } from "../lib/guestStats";
import { newUuid } from "../lib/ids";
import { downloadCsv } from "../lib/csv";
import GuestForm from "./guests/GuestForm";

const money = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " ₫";
const searchKey = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
const attendanceLabel = (p: number) =>
  p === 100
    ? "Đã xác nhận"
    : p === 80
      ? "Khả năng cao"
      : p === 0
        ? "Không tham dự"
        : "Chưa xác nhận";
const inviteLabel = (s: Guest["invitationStatus"]) =>
  s === "sent"
    ? "Đã gửi thiệp"
    : s === "not_sent"
      ? "Chưa gửi thiệp"
      : "Chưa ghi nhận gửi thiệp";
const selectClass =
  "min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-rose-400";

export default function GuestManager() {
  const { guests, addGuest, updateGuest, removeGuest, getEffectiveUid } =
    useStore();
  const planUid = getEffectiveUid() || OWNER_UID;
  const [activeTab, setActiveTab] = useState<"list" | "rsvp">("list");
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("all");
  const [attendance, setAttendance] = useState("all");
  const [invited, setInvited] = useState("all");
  const [table, setTable] = useState("all");
  const [editing, setEditing] = useState<{
    guest: Guest;
    isNew: boolean;
  } | null>(null);
  const [rsvpList, setRsvpList] = useState<InvitationResponse[]>([]);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const loadRsvp = useCallback(async () => {
    setRsvpLoading(true);
    setRsvpError("");
    try {
      const result = await loadInvitationResponses(planUid);
      setRsvpList(result.rsvps);
    } catch {
      setRsvpError("Không tải được phản hồi. Vui lòng thử lại.");
    } finally {
      setRsvpLoading(false);
    }
  }, [planUid]);
  useEffect(() => {
    if (activeTab === "rsvp") void loadRsvp();
  }, [activeTab, loadRsvp]);
  const handleImportRsvp = (r: InvitationResponse) => {
    if (useStore.getState().guests.some((g) => g.sourceRsvpId === r.id)) return;
    addGuest(guestFromRsvp(r, newUuid()));
  };
  const summary = useMemo(
    () => ({
      people: guests.reduce((n, g) => n + guestPartySize(g), 0),
      confirmed: guests
        .filter((g) => g.probability === 100)
        .reduce((n, g) => n + guestPartySize(g), 0),
      pending: guests
        .filter((g) => g.probability === 50 || g.probability === 80)
        .reduce((n, g) => n + guestPartySize(g), 0),
      sent: guests.filter((g) => g.invitationStatus === "sent").length,
      unassigned: guests
        .filter((g) => !g.tableName && g.probability > 0)
        .reduce((n, g) => n + guestPartySize(g), 0),
    }),
    [guests],
  );
  const tables = useMemo(() => {
    const grouped = new Map<string, { people: number; confirmed: number }>();
    for (const guest of guests) {
      if (!guest.tableName) continue;
      const row = grouped.get(guest.tableName) || { people: 0, confirmed: 0 };
      if (guest.probability > 0) row.people += guestPartySize(guest);
      if (guest.probability === 100) row.confirmed += guestPartySize(guest);
      grouped.set(guest.tableName, row);
    }
    return [...grouped].sort(([a], [b]) =>
      a.localeCompare(b, "vi", { numeric: true }),
    );
  }, [guests]);
  const filtered = useMemo(
    () =>
      guests.filter((g) => {
        const matchesSearch = searchKey(
          [g.name, g.phone, g.group, g.address, g.tableName, g.notes]
            .filter(Boolean)
            .join(" "),
        ).includes(searchKey(search.trim()));
        return (
          matchesSearch &&
          (group === "all" || g.group === group) &&
          (attendance === "all" || g.probability === Number(attendance)) &&
          (invited === "all" ||
            (invited === "unknown"
              ? !g.invitationStatus
              : g.invitationStatus === invited)) &&
          (table === "all" ||
            (table === "unassigned" ? !g.tableName : g.tableName === table))
        );
      }),
    [guests, search, group, attendance, invited, table],
  );
  const rsvpStats = useMemo(
    () => ({
      yes: rsvpList
        .filter((r) => r.attending === "yes")
        .reduce((n, r) => n + (r.guestCount || 1), 0),
      no: rsvpList.filter((r) => r.attending === "no").length,
    }),
    [rsvpList],
  );
  const resetFilters = () => {
    setSearch("");
    setGroup("all");
    setAttendance("all");
    setInvited("all");
    setTable("all");
  };
  const addNew = () =>
    setEditing({
      isNew: true,
      guest: {
        id: newUuid(),
        name: "",
        group: GuestGroup.FRIEND,
        probability: AttendanceProbability.POSSIBLE,
        childrenCount: 0,
        partySize: 1,
        redEnvelope: 500000,
        invitationStatus: "not_sent",
      },
    });
  const exportGuests = () =>
    downloadCsv("danh_sach_khach_moi.csv", [
      [
        "Họ tên / Đại diện",
        "Nhóm",
        "Điện thoại",
        "Địa chỉ",
        "Tổng số người",
        "Trẻ em",
        "Phản hồi",
        "Gửi thiệp",
        "Bàn",
        "Tiền mừng dự kiến cả nhóm",
        "Ghi chú",
      ],
      ...filtered.map((g) => [
        g.name,
        g.group,
        g.phone || "",
        g.address || "",
        guestPartySize(g),
        g.childrenCount,
        attendanceLabel(g.probability),
        inviteLabel(g.invitationStatus),
        g.tableName || "",
        g.redEnvelope,
        g.notes || "",
      ]),
    ]);
  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-rose-500">
            Khách mời & người thân
          </p>
          <h1 className="text-2xl font-bold text-gray-900">
            Danh sách khách mời
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi từng nhóm khách, gửi thiệp và sắp xếp chỗ ngồi.
          </p>
        </div>
        <button
          onClick={addNew}
          className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-700"
        >
          <Plus className="h-4 w-4" />
          Thêm khách mời
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {[
          {
            label: "Tổng số người",
            value: summary.people,
            note: `${guests.length} hồ sơ / nhóm khách`,
            icon: Users,
          },
          {
            label: "Đã xác nhận",
            value: summary.confirmed,
            note: "người chắc chắn tham dự",
            icon: UserCheck,
          },
          {
            label: "Chờ xác nhận",
            value: summary.pending,
            note: "người cần liên hệ lại",
            icon: MessageSquare,
          },
          {
            label: "Đã gửi thiệp",
            value: summary.sent,
            note: `trên ${guests.length} hồ sơ`,
            icon: Send,
          },
          {
            label: "Chưa xếp bàn",
            value: summary.unassigned,
            note: "người dự kiến tham dự",
            icon: Armchair,
          },
        ].map(({ label, value, note, icon: Icon }) => (
          <div
            key={label}
            className="rounded-2xl border border-rose-100 bg-white p-4"
          >
            <dt className="flex items-center gap-2 text-xs font-medium text-gray-500">
              <Icon className="h-4 w-4 text-rose-400" />
              {label}
            </dt>
            <dd className="mt-2 text-2xl font-bold text-gray-900">{value}</dd>
            <p className="mt-1 text-xs text-gray-400">{note}</p>
          </div>
        ))}
      </dl>
      <div
        className="flex gap-2 border-b border-gray-200"
        role="tablist"
        aria-label="Nguồn khách mời"
      >
        <button
          role="tab"
          aria-selected={activeTab === "list"}
          onClick={() => setActiveTab("list")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === "list" ? "border-rose-500 text-rose-600" : "border-transparent text-gray-500"}`}
        >
          Danh sách & xếp bàn
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "rsvp"}
          onClick={() => setActiveTab("rsvp")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeTab === "rsvp" ? "border-emerald-500 text-emerald-700" : "border-transparent text-gray-500"}`}
        >
          RSVP Thực Tế
        </button>
      </div>
      {activeTab === "list" ? (
        <>
          <section
            className="rounded-2xl border border-gray-200 bg-white p-4"
            aria-label="Bộ lọc khách mời"
          >
            <div className="flex flex-wrap gap-2">
              <div className="relative min-w-48 flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  aria-label="Tìm khách mời"
                  placeholder="Tìm tên, điện thoại, bàn, ghi chú…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`${selectClass} w-full pl-9`}
                />
              </div>
              <button
                onClick={exportGuests}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
              >
                <Download className="h-4 w-4" />
                Xuất CSV ({filtered.length})
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-5">
              <select
                aria-label="Lọc nhóm khách"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className={selectClass}
              >
                <option value="all">Tất cả nhóm</option>
                {Object.values(GuestGroup).map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
              <select
                aria-label="Lọc phản hồi"
                value={attendance}
                onChange={(e) => setAttendance(e.target.value)}
                className={selectClass}
              >
                <option value="all">Tất cả phản hồi</option>
                {[100, 80, 50, 0].map((p) => (
                  <option key={p} value={p}>
                    {attendanceLabel(p)}
                  </option>
                ))}
              </select>
              <select
                aria-label="Lọc gửi thiệp"
                value={invited}
                onChange={(e) => setInvited(e.target.value)}
                className={selectClass}
              >
                <option value="all">Tình trạng gửi thiệp</option>
                <option value="sent">Đã gửi</option>
                <option value="not_sent">Chưa gửi</option>
                <option value="unknown">Chưa ghi nhận</option>
              </select>
              <select
                aria-label="Lọc bàn"
                value={table}
                onChange={(e) => setTable(e.target.value)}
                className={selectClass}
              >
                <option value="all">Tất cả bàn</option>
                <option value="unassigned">Chưa xếp bàn</option>
                {tables.map(([name]) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
              <button
                onClick={resetFilters}
                className="text-sm text-rose-600 hover:underline"
              >
                Xóa bộ lọc
              </button>
            </div>
          </section>
          {tables.length > 0 && (
            <section
              aria-label="Tổng quan bàn tiệc"
              className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4"
            >
              <h2 className="mb-2 text-sm font-bold">Bàn tiệc dự kiến</h2>
              <div className="flex flex-wrap gap-2">
                {tables.map(([name, row]) => (
                  <button
                    key={name}
                    onClick={() => setTable(name)}
                    aria-pressed={table === name}
                    className={`rounded-xl border px-3 py-2 text-left ${table === name ? "border-rose-400 bg-rose-100" : "border-white bg-white"}`}
                  >
                    <p className="text-sm font-semibold">{name}</p>
                    <p className="text-xs text-gray-500">
                      {row.people} người · {row.confirmed} xác nhận
                    </p>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Số người dự kiến không gồm khách đã từ chối. Chọn bàn để xem
                danh sách.
              </p>
            </section>
          )}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>
              Đang hiển thị{" "}
              <strong className="text-gray-800">
                {filtered.length} hồ sơ ·{" "}
                {filtered.reduce((n, g) => n + guestPartySize(g), 0)} người
              </strong>
            </p>
          </div>
          {!filtered.length ? (
            <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-gray-500">
              <Users className="mx-auto mb-3 h-8 w-8 text-rose-200" />
              <p>Không có khách mời phù hợp.</p>
              <button
                onClick={resetFilters}
                className="mt-2 text-sm text-rose-600"
              >
                Xem toàn bộ danh sách
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((g) => (
                <article
                  key={g.id}
                  aria-label={`Khách: ${g.name}`}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-lg font-bold text-rose-600">
                      {g.name.trim().slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="break-words font-bold text-gray-900">
                        {g.name}
                      </h2>
                      <p className="mt-1 text-xs text-gray-500">
                        {g.group} · {guestPartySize(g)} người
                        {g.childrenCount > 0
                          ? ` (gồm ${g.childrenCount} trẻ em)`
                          : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => setEditing({ guest: g, isNew: false })}
                      aria-label={`Sửa ${g.name}`}
                      className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Xóa khách mời ${g.name}?`))
                          removeGuest(g.id);
                      }}
                      aria-label={`Xóa ${g.name}`}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${g.probability === 100 ? "bg-emerald-50 text-emerald-700" : g.probability === 0 ? "bg-gray-100 text-gray-500" : "bg-amber-50 text-amber-700"}`}
                    >
                      {attendanceLabel(g.probability)}
                    </span>
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                      {inviteLabel(g.invitationStatus)}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                    {g.phone && (
                      <p className="flex items-center gap-2">
                        <PhoneCall className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <a
                          className="hover:text-rose-600"
                          href={`tel:${g.phone.replace(/[^+\d]/g, "")}`}
                        >
                          {g.phone}
                        </a>
                      </p>
                    )}
                    {g.address && (
                      <p className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="break-words">{g.address}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Armchair className="h-3.5 w-3.5 text-gray-400" />
                      {g.tableName || "Chưa xếp bàn"}
                    </p>
                    {g.notes && (
                      <p className="whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-2 text-xs text-gray-500">
                        {g.notes}
                      </p>
                    )}
                  </div>
                  <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    Mừng dự kiến cả nhóm{" "}
                    <strong className="float-right text-sm text-emerald-700">
                      {money(g.redEnvelope)}
                    </strong>
                  </p>
                </article>
              ))}
            </div>
          )}
        </>
      ) : (
        <section className="space-y-3 rounded-2xl border bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold">Phản hồi từ thiệp điện tử</h2>
              <p className="text-sm text-gray-500">
                {rsvpStats.yes} người xác nhận · {rsvpStats.no} phản hồi từ chối
              </p>
            </div>
            <button
              onClick={() => void loadRsvp()}
              disabled={rsvpLoading}
              className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm"
            >
              <RefreshCw
                className={`h-4 w-4 ${rsvpLoading ? "animate-spin" : ""}`}
              />
              Làm mới
            </button>
          </div>
          {rsvpError && (
            <p
              role="alert"
              className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
            >
              {rsvpError}{" "}
              <button onClick={() => void loadRsvp()} className="underline">
                Thử lại
              </button>
            </p>
          )}
          {rsvpLoading ? (
            <p className="py-8 text-center text-gray-400">Đang tải phản hồi…</p>
          ) : !rsvpList.length ? (
            <p className="py-8 text-center text-gray-400">
              Chưa có phản hồi từ khách mời.
            </p>
          ) : (
            rsvpList.map((r) => {
              const imported = guests.some((g) => g.sourceRsvpId === r.id);
              return (
                <article
                  key={r.id}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{r.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {r.attending === "yes"
                        ? `Sẽ đến · ${r.guestCount || 1} người`
                        : "Không tham dự"}
                      {r.phone ? ` · ${r.phone}` : ""}
                    </p>
                    {r.message && (
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-500">
                        {r.message}
                      </p>
                    )}
                    {!!r.selectedEventIds?.length && (
                      <p className="mt-1 text-xs text-gray-400">
                        Đã chọn {r.selectedEventIds.length} sự kiện
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  {r.attending === "yes" && (
                    <button
                      onClick={() => handleImportRsvp(r)}
                      disabled={imported}
                      title={
                        imported
                          ? "Đã thêm vào danh sách"
                          : "Thêm vào danh sách khách mời"
                      }
                      className="rounded-xl border px-3 py-2 text-sm text-emerald-700 disabled:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      {imported ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </article>
              );
            })
          )}
        </section>
      )}
      {editing && (
        <GuestForm
          guest={editing.guest}
          onClose={() => setEditing(null)}
          onSave={(guest) => {
            if (editing.isNew) addGuest(guest);
            else updateGuest(guest);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
