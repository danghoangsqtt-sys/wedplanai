import React, { useRef, useState } from "react";
import { useStore } from "../../store/useStore";
import type { BudgetPaymentStage } from "../../types";
import { newUuid } from "../../lib/ids";
import {
  formatBudgetDate,
  formatBudgetMoney,
  getItemPaymentSummary,
  paymentOffsetLabel,
  saveBudgetSchedule,
  shiftBudgetDate,
} from "../../lib/budgetPayments";
import BudgetModal, {
  budgetInput,
  budgetPrimary,
  budgetSecondary,
} from "./BudgetModal";

export default function ScheduleDialog({
  itemId,
  stage,
  onClose,
}: {
  itemId: string;
  stage?: BudgetPaymentStage;
  onClose: () => void;
}) {
  const { budgetItems, invitation, mutateBudgetItem } = useStore(),
    item = budgetItems.find((i) => i.id === itemId);
  const [label, setLabel] = useState(stage?.label || ""),
    [amount, setAmount] = useState(stage ? String(stage.amount) : "");
  const [side, setSide] = useState(
      stage
        ? stage.offsetDays < 0
          ? "before"
          : stage.offsetDays > 0
            ? "after"
            : "on"
        : "after",
    ),
    [days, setDays] = useState(String(Math.abs(stage?.offsetDays || 3)));
  const [error, setError] = useState("");
  const id = useRef(stage?.id || newUuid()),
    busy = useRef(false);
  if (!item) return null;
  const offset =
      side === "on" ? 0 : side === "before" ? -Number(days) : Number(days),
    stats = getItemPaymentSummary(item, invitation.date);
  const planned = (item.paymentSchedule ?? [])
      .filter((s) => s.id !== stage?.id)
      .reduce((n, s) => n + s.amount, 0),
    room = stats.base - planned;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current) return;
    setError("");
    try {
      if (
        !Number.isInteger(offset) ||
        Math.abs(offset) > 3650 ||
        (side !== "on" && Number(days) < 1)
      )
        throw new Error("Nhập số ngày nguyên từ 1 đến 3650.");
      busy.current = true;
      mutateBudgetItem(itemId, (current) => {
        if (stage && !current.paymentSchedule?.some((s) => s.id === stage.id))
          throw new Error("Đợt đã thay đổi. Hãy mở lại.");
        return saveBudgetSchedule(
          current,
          {
            id: id.current,
            label: label.trim(),
            amount: Number(amount),
            offsetDays: offset,
          },
          invitation.date,
        );
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được lịch.");
    } finally {
      busy.current = false;
    }
  };
  return (
    <BudgetModal
      title={stage ? "Sửa đợt phải trả" : "Thêm đợt phải trả"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <div className="space-y-4 p-5">
          <p className="text-sm text-gray-500">
            {item.itemName} · Có thể xếp tối đa{" "}
            {formatBudgetMoney(Math.max(room, 0))} cho đợt này.
            {stats.provisional ? " Giá chưa chốt: đây là lịch tạm tính." : ""}
          </p>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <label className="block text-sm font-medium">
            Tên đợt
            <input
              required
              maxLength={100}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={budgetInput}
            />
          </label>
          <label className="block text-sm font-medium">
            Số tiền phải trả của đợt (VNĐ)
            <input
              type="number"
              required
              min={1}
              max={Math.max(room, 1)}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={budgetInput}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm font-medium">
              Mốc hẹn
              <select
                value={side}
                onChange={(e) => setSide(e.target.value)}
                className={budgetInput}
              >
                <option value="before">Trước ngày cưới</option>
                <option value="on">Đúng ngày cưới</option>
                <option value="after">Sau ngày cưới</option>
              </select>
            </label>
            <label className="text-sm font-medium">
              Số ngày
              <input
                disabled={side === "on"}
                required={side !== "on"}
                type="number"
                min={1}
                max={3650}
                step={1}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className={budgetInput}
              />
            </label>
          </div>
          <p className="text-xs text-rose-600">
            {Number.isInteger(offset)
              ? `${paymentOffsetLabel(offset)} · ${formatBudgetDate(shiftBudgetDate(invitation.date, offset))}`
              : "Nhập mốc hợp lệ."}
          </p>
          <p className="text-xs leading-relaxed text-gray-500">
            Lịch hẹn không tạo tiền đã trả. Nếu khoản này có tiền đã trả trước
            khi xếp lịch, phần đó sẽ được đối chiếu vào đợt mới mà không cộng
            thêm tiền.
          </p>
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white px-5 py-4">
          <button type="button" onClick={onClose} className={budgetSecondary}>
            Hủy
          </button>
          <button type="submit" className={budgetPrimary}>
            Lưu đợt thanh toán
          </button>
        </div>
      </form>
    </BudgetModal>
  );
}
