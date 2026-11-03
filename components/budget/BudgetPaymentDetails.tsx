import React, { useState } from "react";
import { useStore } from "../../store/useStore";
import type { BudgetItem, BudgetPaymentStage } from "../../types";
import {
  formatBudgetDate,
  formatBudgetMoney,
  getItemPaymentSummary,
  paymentOffsetLabel,
  removeBudgetSchedule,
  voidBudgetPayment,
} from "../../lib/budgetPayments";
import BudgetModal, {
  budgetInput,
  budgetPrimary,
  budgetSecondary,
} from "./BudgetModal";
import PaymentDialog from "./PaymentDialog";
import ScheduleDialog from "./ScheduleDialog";

export default function BudgetPaymentDetails({
  itemId,
  onClose,
  onEdit,
}: {
  itemId: string;
  onClose: () => void;
  onEdit: (item: BudgetItem) => void;
}) {
  const { budgetItems, invitation, mutateBudgetItem } = useStore();
  const [payment, setPayment] = useState<{
      kind: "deposit" | "payment";
      stageId?: string;
    } | null>(null),
    [schedule, setSchedule] = useState<{ stage?: BudgetPaymentStage } | null>(
      null,
    );
  const [voidId, setVoidId] = useState<string | null>(null),
    [reason, setReason] = useState(""),
    [error, setError] = useState("");
  const item = budgetItems.find((i) => i.id === itemId);
  if (!item) return null;
  const stats = getItemPaymentSummary(item, invitation.date);
  const run = (action: () => void) => {
    setError("");
    try {
      action();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thực hiện được thao tác.",
      );
    }
  };
  return (
    <>
      <BudgetModal
        title={`Thanh toán · ${item.itemName}`}
        onClose={onClose}
        wide
      >
        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm text-gray-500">
              {item.supplierName || "Chưa có nhà cung cấp"}
              {item.supplierPhone ? ` · ${item.supplierPhone}` : ""}
            </p>
            <button
              className="text-sm font-semibold text-rose-600"
              onClick={() => onEdit(item)}
            >
              {stats.tracked
                ? "Sửa thông tin khoản chi"
                : "Đối chiếu số liệu cũ"}
            </button>
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              [stats.provisional ? "Giá dự kiến" : "Giá đã chốt", stats.base],
              ["Tổng đã trả", stats.paid],
              [
                stats.provisional ? "Còn dự kiến" : "Còn phải trả",
                stats.remaining,
              ],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-xl border border-rose-100 bg-rose-50/40 p-3"
              >
                <p className="text-xs text-gray-500">{String(label)}</p>
                <p className="mt-2 break-words text-lg font-bold text-gray-900">
                  {formatBudgetMoney(Number(value))}
                </p>
              </div>
            ))}
          </div>
          {!stats.tracked ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p>
                Số “Thực tế” cũ: <b>{formatBudgetMoney(item.actualCost)}</b>.
                Chưa tự coi đây là tiền đã trả.
              </p>
              <button
                onClick={() => onEdit(item)}
                className={`${budgetPrimary} mt-3`}
              >
                Đối chiếu và bắt đầu theo dõi
              </button>
            </div>
          ) : (
            <>
              {stats.provisional && (
                <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                  Khoản này chưa chốt giá. Các số còn phải trả và lịch hẹn đang
                  tạm tính theo dự toán; dashboard tách riêng phần này.
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold">Các đợt phải trả</h3>
                <button
                  onClick={() => setSchedule({})}
                  className="text-sm font-semibold text-rose-600"
                >
                  ＋ Thêm đợt
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full min-w-[690px] text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      {[
                        "Đợt / mốc hẹn",
                        "Phải trả",
                        "Đã trả",
                        "Còn lại",
                        "Thao tác",
                      ].map((t) => (
                        <th key={t} className="p-3 font-medium">
                          {t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.schedule.map((s) => (
                      <tr key={s.id} className="border-t border-gray-100">
                        <td className="p-3">
                          <b>{s.label}</b>
                          <p className="mt-1 text-gray-500">
                            {paymentOffsetLabel(s.offsetDays)}
                            <br />
                            {formatBudgetDate(s.due)}
                          </p>
                          {s.overdue && (
                            <span className="mt-1 inline-block rounded bg-red-50 px-2 py-1 text-red-600">
                              Quá hạn
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono">
                          {formatBudgetMoney(s.amount)}
                        </td>
                        <td className="p-3 font-mono">
                          {formatBudgetMoney(s.paid)}
                        </td>
                        <td className="p-3 font-mono text-rose-700">
                          {formatBudgetMoney(s.remaining)}
                        </td>
                        <td className="space-y-2 p-3">
                          <div className="flex gap-2">
                            <button
                              aria-label={`Sửa đợt ${s.label}`}
                              onClick={() => setSchedule({ stage: s })}
                              className="text-gray-500 underline"
                            >
                              Sửa
                            </button>
                            <button
                              aria-label={`Xóa đợt ${s.label}`}
                              onClick={() => {
                                if (
                                  confirm(
                                    "Xóa đợt hẹn này? Tiền thực trả và lịch sử không được xóa theo.",
                                  )
                                )
                                  run(() =>
                                    mutateBudgetItem(itemId, (row) =>
                                      removeBudgetSchedule(row, s.id),
                                    ),
                                  );
                              }}
                              className="text-gray-500 underline"
                            >
                              Xóa
                            </button>
                          </div>
                          {s.remaining > 0 ? (
                            <button
                              className="rounded-lg bg-rose-50 px-2 py-1 text-rose-600"
                              onClick={() =>
                                setPayment({ kind: "payment", stageId: s.id })
                              }
                            >
                              Ghi nhận trả
                            </button>
                          ) : (
                            <span className="text-emerald-700">Đã trả đủ</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!stats.schedule.length && (
                  <p className="p-6 text-center text-sm text-gray-400">
                    Chưa có lịch hẹn. Hãy thêm mốc trước hoặc sau ngày cưới.
                  </p>
                )}
              </div>
              {stats.unscheduled > 0 && (
                <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                  Còn {formatBudgetMoney(stats.unscheduled)} chưa xếp lịch; chưa
                  tự phân thành nợ sau cưới.
                </p>
              )}
              {stats.schedule.some((s) => s.creditApplied > 0) && (
                <p className="text-xs text-gray-500">
                  Một phần tiền đã trả chưa gắn đợt được đối chiếu vào các đợt
                  còn nợ gần nhất. Ngày và số tiền giao dịch gốc được giữ
                  nguyên.
                </p>
              )}
              {stats.overpaid > 0 && (
                <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
                  Trả dư {formatBudgetMoney(stats.overpaid)} cho nhà cung cấp
                  này, không bù vào công nợ đơn vị khác.
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold">Lịch sử thực trả</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Trong đó đã cọc {formatBudgetMoney(stats.deposits)}; cọc đã
                    nằm trong tổng đã trả.
                  </p>
                </div>
                <button
                  className="text-sm font-semibold text-rose-600"
                  onClick={() => setPayment({ kind: "deposit" })}
                >
                  ＋ Ghi nhận cọc
                </button>
              </div>
              {!item.payments?.length ? (
                <p className="py-5 text-center text-sm text-gray-400">
                  Chưa ghi nhận giao dịch; đặt lịch không làm tăng tiền đã trả.
                </p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {[...item.payments].reverse().map((p) => (
                    <article
                      key={p.id}
                      className={`py-3 ${p.voidedAt ? "text-gray-400" : "text-gray-700"}`}
                    >
                      <div className="flex flex-wrap justify-between gap-2 text-sm">
                        <b className={p.voidedAt ? "line-through" : ""}>
                          {p.kind === "deposit" ? "Tiền cọc" : "Thanh toán"} ·{" "}
                          {formatBudgetDate(p.paidAt)}
                        </b>
                        <b
                          className={
                            p.voidedAt ? "line-through" : "text-emerald-700"
                          }
                        >
                          {formatBudgetMoney(p.amount)}
                        </b>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap break-words text-xs text-gray-500">
                        {p.note || "Không có ghi chú"}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {p.allocations
                          .map(
                            (a) =>
                              `${a.scheduleId ? item.paymentSchedule?.find((s) => s.id === a.scheduleId)?.label : "Phần chưa xếp lịch"}: ${formatBudgetMoney(a.amount)}`,
                          )
                          .join(" · ") || "Phần chưa phân bổ / trả dư"}
                      </p>
                      {p.voidedAt ? (
                        <p className="mt-2 text-xs text-red-500">
                          Đã hủy bản ghi: {p.voidReason}
                        </p>
                      ) : (
                        <button
                          className="mt-2 text-xs text-gray-400 underline"
                          onClick={() => {
                            setVoidId(p.id);
                            setReason("");
                            setError("");
                          }}
                        >
                          Hủy bản ghi nhập sai
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}
              <p className="text-xs leading-relaxed text-gray-400">
                Hủy bản ghi dùng để sửa dữ liệu nhập sai, không phải ghi nhận
                nhà cung cấp hoàn tiền. Giao dịch vẫn được giữ trong lịch sử để
                đối chiếu.
              </p>
            </>
          )}
        </div>
        <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white px-5 py-4">
          <button onClick={onClose} className={budgetSecondary}>
            Đóng
          </button>
          {stats.tracked && (
            <button
              onClick={() => setPayment({ kind: "payment" })}
              className={budgetPrimary}
            >
              Ghi nhận thanh toán
            </button>
          )}
        </div>
      </BudgetModal>
      {payment && (
        <PaymentDialog
          itemId={itemId}
          kind={payment.kind}
          stageId={payment.stageId}
          onClose={() => setPayment(null)}
        />
      )}
      {schedule && (
        <ScheduleDialog
          itemId={itemId}
          stage={schedule.stage}
          onClose={() => setSchedule(null)}
        />
      )}
      {voidId && (
        <BudgetModal
          title="Hủy bản ghi nhập sai"
          onClose={() => setVoidId(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run(() => {
                mutateBudgetItem(itemId, (row) =>
                  voidBudgetPayment(row, voidId, reason),
                );
                setVoidId(null);
              });
            }}
          >
            <div className="space-y-3 p-5">
              <p className="text-sm text-gray-500">
                Bản ghi sẽ ngừng tính vào số đã trả, nhưng vẫn nằm trong lịch
                sử.
              </p>
              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}
              <label className="block text-sm font-medium">
                Lý do hủy
                <input
                  required
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={budgetInput}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t p-4">
              <button
                type="button"
                onClick={() => setVoidId(null)}
                className={budgetSecondary}
              >
                Giữ bản ghi
              </button>
              <button type="submit" className={budgetPrimary}>
                Xác nhận hủy bản ghi
              </button>
            </div>
          </form>
        </BudgetModal>
      )}
    </>
  );
}
