import React, { useMemo, useState } from "react";
import { useStore } from "../../store/useStore";
import type { BudgetPaymentFilter } from "../../types";
import { useBudgetDate } from "../../hooks/useBudgetDate";
import {
  formatBudgetDate,
  formatBudgetMoney,
  getBudgetPaymentSummary,
  getItemPaymentSummary,
  paymentOffsetLabel,
} from "../../lib/budgetPayments";
import BudgetSummaryCards from "./BudgetSummaryCards";
import PaymentDialog from "./PaymentDialog";

export default function BudgetPaymentDashboard({
  onOpenBudget,
}: {
  onOpenBudget: () => void;
}) {
  const { budgetItems, invitation, setBudgetFilter } = useStore();
  const today = useBudgetDate();
  const [payment, setPayment] = useState<{
    id: string;
    stageId: string;
  } | null>(null);
  const summary = useMemo(
    () => getBudgetPaymentSummary(budgetItems, invitation.date, today),
    [budgetItems, invitation.date, today],
  );
  const rows = useMemo(
    () =>
      budgetItems
        .map((i) => getItemPaymentSummary(i, invitation.date, today))
        .filter((r) => !r.provisional),
    [budgetItems, invitation.date, today],
  );
  const pending = rows
    .flatMap((r) =>
      r.schedule
        .filter((s) => s.remaining > 0)
        .map((stage) => ({ item: r.item, stage })),
    )
    .sort((a, b) =>
      (a.stage.due || "9999").localeCompare(b.stage.due || "9999"),
    );
  const buckets = new Map<number, number>();
  pending.forEach(({ stage }) =>
    buckets.set(
      stage.offsetDays,
      (buckets.get(stage.offsetDays) || 0) + stage.remaining,
    ),
  );
  const timeline = [...buckets].sort(([a], [b]) => a - b),
    max = Math.max(1, ...timeline.map(([, value]) => value));
  const open = (filter: BudgetPaymentFilter) => {
    setBudgetFilter(filter);
    onOpenBudget();
  };
  return (
    <section className="space-y-3" aria-label="Tổng quan công nợ đám cưới">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-gray-900">
          Ngân sách & công nợ
        </h2>
        <button
          onClick={() => open("all")}
          className="text-xs font-semibold text-rose-600"
        >
          Mở sổ thanh toán →
        </button>
      </div>
      <BudgetSummaryCards summary={summary} onSelect={open} />
      {(summary.unreconciledCount > 0 || summary.unpricedCount > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          <b>
            {summary.unreconciledCount} khoản chưa đối chiếu ·{" "}
            {summary.unpricedCount} khoản chưa chốt giá.
          </b>{" "}
          Còn tạm tính {formatBudgetMoney(summary.provisionalRemaining)} được
          tách khỏi công nợ đã xác định.{" "}
          <button
            onClick={() => open("unreconciled")}
            className="font-semibold underline"
          >
            Đối chiếu số liệu
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400">
            Sau khi tiệc kết thúc
          </p>
          <h3 className="mt-1 text-base font-bold text-rose-800">
            Còn {formatBudgetMoney(summary.after)} cần trả sau cưới
          </h3>
          <p className="mt-1 text-xs text-rose-600">
            Đây là một phần của tổng công nợ; tiền mừng dự kiến chưa tự trừ vào
            số này.
          </p>
        </div>
        <button
          onClick={() => open("after")}
          className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-rose-600"
        >
          Xem các khoản sau cưới →
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-100 bg-white p-4">
          <h3 className="text-sm font-bold">Lịch chi tiền theo mốc</h3>
          <p className="mt-1 text-xs text-gray-400">
            Chỉ gồm phần chưa trả của các khoản đã đối chiếu và chốt giá.
          </p>
          <div className="mt-4 space-y-3">
            {timeline.length ? (
              timeline.map(([offset, amount]) => (
                <button
                  key={offset}
                  onClick={() => open(offset > 0 ? "after" : "before")}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="w-12 shrink-0 text-[11px] font-semibold text-gray-500">
                    {offset === 0
                      ? "T"
                      : offset < 0
                        ? `T−${-offset}`
                        : `T+${offset}`}
                  </span>
                  <span className="h-3 flex-1 overflow-hidden rounded bg-gray-100">
                    <span
                      className={`block h-full rounded ${offset > 0 ? "bg-rose-400" : "bg-rose-200"}`}
                      style={{ width: `${(amount / max) * 100}%` }}
                    />
                  </span>
                  <b className="w-28 shrink-0 break-words text-right text-[11px] text-gray-600">
                    {formatBudgetMoney(amount)}
                  </b>
                </button>
              ))
            ) : (
              <p className="py-3 text-sm text-gray-400">
                {summary.unscheduled > 0
                  ? "Còn nợ nhưng chưa xếp lịch thanh toán."
                  : "Chưa có đợt thanh toán đang chờ."}
              </p>
            )}
          </div>
          <p className="mt-4 border-t border-gray-100 pt-3 text-[10px] leading-relaxed text-gray-400">
            Trước/ngày cưới {formatBudgetMoney(summary.before)} + sau cưới{" "}
            {formatBudgetMoney(summary.after)} + chưa xếp lịch{" "}
            {formatBudgetMoney(summary.unscheduled)} ={" "}
            {formatBudgetMoney(summary.remaining)} còn phải trả.
          </p>
          {summary.unscheduled > 0 && (
            <button
              onClick={() => open("unscheduled")}
              className="mt-2 text-xs font-semibold text-amber-700 underline"
            >
              Xếp lịch cho {formatBudgetMoney(summary.unscheduled)} còn nợ
            </button>
          )}
        </section>
        <section className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold">Ưu tiên thanh toán</h3>
            <span className="text-[10px] text-gray-400">
              {formatBudgetDate(today)}
            </span>
          </div>
          <div className="mt-3 divide-y divide-gray-100">
            {pending.slice(0, 5).map(({ item, stage }) => (
              <div
                key={`${item.id}:${stage.id}`}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-gray-800">
                    {item.itemName}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-gray-400">
                    {stage.label} · {paymentOffsetLabel(stage.offsetDays)}
                    <br />
                    {formatBudgetDate(stage.due)}
                  </p>
                  <button
                    onClick={() =>
                      setPayment({ id: item.id, stageId: stage.id })
                    }
                    className="mt-2 text-xs font-semibold text-rose-600"
                  >
                    Ghi nhận thanh toán →
                  </button>
                </div>
                <div className="shrink-0 text-right">
                  <b className="text-xs text-gray-800">
                    {formatBudgetMoney(stage.remaining)}
                  </b>
                  <p
                    className={`mt-2 text-[10px] ${stage.overdue ? "text-red-600" : stage.offsetDays > 0 ? "text-rose-600" : "text-gray-400"}`}
                  >
                    {stage.overdue
                      ? "Quá hạn"
                      : stage.offsetDays > 0
                        ? "Sau cưới"
                        : "Chưa đến hạn"}
                  </p>
                </div>
              </div>
            ))}
            {!pending.length && (
              <p className="py-6 text-center text-sm text-gray-400">
                Chưa có đợt hẹn cần thanh toán.
              </p>
            )}
          </div>
        </section>
      </div>
      {!invitation.date && (
        <p className="text-xs text-amber-700">
          Chưa chọn ngày cưới: vẫn theo dõi được mốc và tiền, nhưng chưa thể xác
          định quá hạn hoặc 7 ngày tới.
        </p>
      )}
      {summary.overpaid > 0 && (
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
          Có {formatBudgetMoney(summary.overpaid)} trả dư tại một số đơn vị;
          khoản này không tự bù sang công nợ nhà cung cấp khác.
        </p>
      )}
      {payment && (
        <PaymentDialog
          itemId={payment.id}
          stageId={payment.stageId}
          onClose={() => setPayment(null)}
        />
      )}
    </section>
  );
}
