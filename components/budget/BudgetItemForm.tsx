import React, { useRef, useState } from "react";
import { useStore } from "../../store/useStore";
import { TaskStatus, type BudgetItem, type WeddingSide } from "../../types";
import { newUuid } from "../../lib/ids";
import {
  formatBudgetMoney,
  hasPaymentTracking,
  recordBudgetPayment,
  todayInBangkok,
  validateBudgetPaymentData,
} from "../../lib/budgetPayments";
import BudgetModal, {
  budgetInput,
  budgetPrimary,
  budgetSecondary,
} from "./BudgetModal";

export default function BudgetItemForm({
  item,
  onClose,
}: {
  item?: BudgetItem;
  onClose: () => void;
}) {
  const store = useStore(),
    legacy = !!item && !hasPaymentTracking(item);
  const [name, setName] = useState(item?.itemName || ""),
    [category, setCategory] = useState(item?.category || "Chung");
  const [estimated, setEstimated] = useState(String(item?.estimatedCost ?? "")),
    [agreed, setAgreed] = useState(
      item?.agreedCost === undefined ? "" : String(item.agreedCost),
    );
  const [supplier, setSupplier] = useState(item?.supplierName || ""),
    [phone, setPhone] = useState(item?.supplierPhone || "");
  const [assignee, setAssignee] = useState(item?.assignee || ""),
    [side, setSide] = useState<WeddingSide>(item?.side || "BOTH");
  const [note, setNote] = useState(item?.note || ""),
    [deadline, setDeadline] = useState(item?.deadline || "");
  const [paid, setPaid] = useState("0"),
    [deposit, setDeposit] = useState("0"),
    [paidAt, setPaidAt] = useState(todayInBangkok());
  const [confirmed, setConfirmed] = useState(false),
    [error, setError] = useState("");
  const busy = useRef(false);
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (busy.current) return;
    setError("");
    try {
      const est = Number(estimated),
        price = agreed.trim() === "" ? undefined : Number(agreed);
      if (
        !name.trim() ||
        estimated.trim() === "" ||
        !Number.isSafeInteger(est) ||
        est < 0 ||
        (price !== undefined && (!Number.isSafeInteger(price) || price < 0))
      )
        throw new Error(
          "Nhập tên và số tiền nguyên không âm; để trống giá chốt nếu chưa thống nhất.",
        );
      if (legacy && !confirmed)
        throw new Error(
          "Hãy xác nhận đã đối chiếu số cũ trước khi bắt đầu theo dõi.",
        );
      const initialPaid = Number(paid),
        initialDeposit = Number(deposit);
      if (
        legacy &&
        (![initialPaid, initialDeposit].every(
          (v) => Number.isSafeInteger(v) && v >= 0,
        ) ||
          initialDeposit > initialPaid)
      )
        throw new Error(
          "Số cọc phải nằm trong tổng đã trả; cả hai là số nguyên không âm.",
        );
      const changes = {
        itemName: name.trim(),
        category: category.trim() || "Chung",
        estimatedCost: est,
        agreedCost: price,
        supplierName: supplier.trim() || undefined,
        supplierPhone: phone.trim() || undefined,
        assignee: assignee.trim(),
        side,
        note: note.trim(),
        deadline: deadline || undefined,
      };
      busy.current = true;
      if (item) {
        store.mutateBudgetItem(item.id, (current) => {
          if (legacy && hasPaymentTracking(current))
            throw new Error(
              "Khoản này đã được đối chiếu ở nơi khác. Hãy mở lại hồ sơ.",
            );
          let next: BudgetItem = { ...current, ...changes };
          if (legacy) {
            next = { ...next, payments: [], paymentSchedule: [] };
            if (initialDeposit)
              next = recordBudgetPayment(
                next,
                {
                  id: newUuid(),
                  amount: initialDeposit,
                  kind: "deposit",
                  paidAt,
                  note: "Đối chiếu khoản cọc đã trả trước đây",
                },
                store.invitation.date,
              );
            if (initialPaid > initialDeposit)
              next = recordBudgetPayment(
                next,
                {
                  id: newUuid(),
                  amount: initialPaid - initialDeposit,
                  kind: "payment",
                  paidAt,
                  note: "Đối chiếu phần đã thanh toán trước đây",
                },
                store.invitation.date,
              );
          }
          validateBudgetPaymentData(next);
          return next;
        });
      } else {
        store.addBudgetItem({
          id: newUuid(),
          ...changes,
          actualCost: 0,
          status: TaskStatus.PENDING,
          payments: [],
          paymentSchedule: [],
        });
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không lưu được khoản chi.",
      );
    } finally {
      busy.current = false;
    }
  };
  return (
    <BudgetModal
      title={
        legacy
          ? "Đối chiếu và theo dõi thanh toán"
          : item
            ? "Sửa khoản chi"
            : "Thêm khoản chi"
      }
      onClose={onClose}
    >
      <form onSubmit={save}>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2"
            >
              {error}
            </p>
          )}
          <label className="text-sm font-medium sm:col-span-2">
            Tên khoản chi
            <input
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={budgetInput}
            />
          </label>
          <label className="text-sm font-medium">
            Danh mục
            <input
              required
              maxLength={100}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={budgetInput}
            />
          </label>
          <label className="text-sm font-medium">
            Bên phụ trách
            <select
              value={side}
              onChange={(e) => setSide(e.target.value as WeddingSide)}
              className={budgetInput}
            >
              <option value="BOTH">Cả hai bên</option>
              <option value="GROOM">Nhà trai</option>
              <option value="BRIDE">Nhà gái</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Dự toán (VNĐ)
            <input
              type="number"
              required
              min={0}
              step={1}
              value={estimated}
              onChange={(e) => setEstimated(e.target.value)}
              className={budgetInput}
            />
          </label>
          <label className="text-sm font-medium">
            Giá đã chốt (VNĐ)
            <input
              type="number"
              min={0}
              step={1}
              placeholder="Chưa chốt"
              value={agreed}
              onChange={(e) => setAgreed(e.target.value)}
              className={budgetInput}
            />
          </label>
          <label className="text-sm font-medium">
            Nhà cung cấp
            <input
              maxLength={150}
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className={budgetInput}
            />
          </label>
          <label className="text-sm font-medium">
            Điện thoại nhà cung cấp
            <input
              type="tel"
              maxLength={30}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={budgetInput}
            />
          </label>
          <label className="text-sm font-medium">
            Người phụ trách
            <input
              maxLength={100}
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className={budgetInput}
            />
          </label>
          <label className="text-sm font-medium">
            Hạn công việc (tùy chọn)
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={budgetInput}
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Ghi chú
            <textarea
              rows={2}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={budgetInput}
            />
          </label>
          {legacy && (
            <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:col-span-2">
              <h3 className="text-sm font-bold text-amber-900">
                Đối chiếu số liệu trước đây
              </h3>
              <p className="text-xs leading-relaxed text-amber-800">
                Số “Thực tế” cũ: <b>{formatBudgetMoney(item!.actualCost)}</b>.
                Chưa dùng số này làm giá chốt hoặc tiền đã trả.
              </p>
              <button
                type="button"
                onClick={() => setAgreed(String(item!.actualCost))}
                className="text-xs font-semibold text-amber-900 underline"
              >
                Dùng số cũ làm giá chốt
              </button>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  Tổng thực đã trả trước đây (VNĐ)
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={paid}
                    onChange={(e) => setPaid(e.target.value)}
                    className={budgetInput}
                  />
                </label>
                <label className="text-sm">
                  Trong đó tiền cọc (VNĐ)
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    className={budgetInput}
                  />
                </label>
              </div>
              <label className="block text-sm">
                Ngày thực trả đối chiếu
                <input
                  type="date"
                  required
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className={budgetInput}
                />
              </label>
              <p className="text-xs text-amber-800">
                Sẽ ghi nhận {formatBudgetMoney(Number(paid) || 0)} tổng đã trả,
                trong đó cọc {formatBudgetMoney(Number(deposit) || 0)}. Nếu có
                nhiều ngày trả, có thể nhập từng giao dịch riêng sau khi đối
                chiếu 0 đồng.
              </p>
              <label className="flex items-start gap-2 text-sm text-amber-900">
                <input
                  type="checkbox"
                  required
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1"
                />
                Tôi đã đối chiếu giá chốt và số thực đã trả.
              </label>
            </section>
          )}
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white px-5 py-4">
          <button type="button" onClick={onClose} className={budgetSecondary}>
            Hủy
          </button>
          <button type="submit" className={budgetPrimary}>
            {legacy ? "Xác nhận đối chiếu" : "Lưu khoản chi"}
          </button>
        </div>
      </form>
    </BudgetModal>
  );
}
