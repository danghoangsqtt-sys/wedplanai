import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { AttendanceProbability, GuestGroup, type Guest } from "../../types";
import { guestPartySize, normalizeGuest } from "../../lib/guestStats";

const fieldClass =
  "mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100";
export default function GuestForm({
  guest,
  onSave,
  onClose,
}: {
  guest: Guest;
  onSave: (guest: Guest) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Guest>({
    ...guest,
    partySize: guestPartySize(guest),
  });
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element?.showModal) element.showModal();
    else element?.setAttribute("open", "");
    return () => {
      if (element?.close && element.open) element.close();
    };
  }, []);
  const update = <K extends keyof Guest>(key: K, value: Guest[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  return (
    <dialog
      ref={dialog}
      aria-labelledby="guest-form-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-950/40"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            onSave(normalizeGuest(form));
          } catch (err) {
            setError(
              err instanceof Error ? err.message : "Thông tin chưa hợp lệ.",
            );
          }
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-5 py-4">
          <div>
            <h2 id="guest-form-title" className="text-lg font-bold">
              Hồ sơ khách mời
            </h2>
            <p className="text-xs text-gray-500">
              Một hồ sơ cho một khách hoặc một nhóm đi cùng.
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng hồ sơ"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
            >
              {error}
            </p>
          )}
          <label className="text-sm font-medium sm:col-span-2">
            Tên khách / đại diện
            <input
              autoFocus
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium">
            Nhóm khách
            <select
              value={form.group}
              onChange={(e) => update("group", e.target.value as GuestGroup)}
              className={fieldClass}
            >
              {Object.values(GuestGroup).map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Số điện thoại
            <input
              type="tel"
              maxLength={30}
              value={form.phone || ""}
              onChange={(e) => update("phone", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Địa chỉ
            <input
              maxLength={200}
              value={form.address || ""}
              onChange={(e) => update("address", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium">
            Tổng số người
            <input
              type="number"
              required
              min={1}
              max={100}
              step={1}
              value={form.partySize ?? 1}
              onChange={(e) => update("partySize", Number(e.target.value))}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium">
            Trong đó trẻ em
            <input
              type="number"
              required
              min={0}
              max={(form.partySize || 1) - 1}
              step={1}
              value={form.childrenCount}
              onChange={(e) => update("childrenCount", Number(e.target.value))}
              className={fieldClass}
            />
          </label>
          <p className="-mt-2 text-xs text-gray-500 sm:col-span-2">
            Tổng số người đã bao gồm trẻ em và khách đi cùng; không cộng trẻ em
            lần thứ hai.
          </p>
          <label className="text-sm font-medium">
            Phản hồi tham dự
            <select
              value={form.probability}
              onChange={(e) =>
                update(
                  "probability",
                  Number(e.target.value) as AttendanceProbability,
                )
              }
              className={fieldClass}
            >
              <option value={100}>Đã xác nhận tham dự</option>
              <option value={80}>Khả năng cao (80%)</option>
              <option value={50}>Chưa xác nhận (50%)</option>
              <option value={0}>Không tham dự</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Tình trạng gửi thiệp
            <select
              value={form.invitationStatus || ""}
              onChange={(e) =>
                update(
                  "invitationStatus",
                  (e.target.value || undefined) as Guest["invitationStatus"],
                )
              }
              className={fieldClass}
            >
              <option value="">Chưa ghi nhận</option>
              <option value="not_sent">Chưa gửi thiệp</option>
              <option value="sent">Đã gửi thiệp</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Bàn dự kiến
            <input
              maxLength={50}
              placeholder="Ví dụ: Bàn 01 / Gia đình"
              value={form.tableName || ""}
              onChange={(e) => update("tableName", e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium">
            Tiền mừng dự kiến cả nhóm (VNĐ)
            <input
              type="number"
              min={0}
              max={Number.MAX_SAFE_INTEGER}
              step={1}
              required
              value={form.redEnvelope}
              onChange={(e) => update("redEnvelope", Number(e.target.value))}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Ghi chú
            <textarea
              rows={3}
              maxLength={2000}
              placeholder="Ăn chay, dị ứng, người liên hệ, hỗ trợ di chuyển…"
              value={form.notes || ""}
              onChange={(e) => update("notes", e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border px-4 py-2 text-sm"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700"
          >
            Lưu khách mời
          </button>
        </div>
      </form>
    </dialog>
  );
}
