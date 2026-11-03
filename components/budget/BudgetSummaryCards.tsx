import React from "react";
import type { BudgetPaymentFilter, BudgetPaymentSummary } from "../../types";
import { formatBudgetMoney } from "../../lib/budgetPayments";

export default function BudgetSummaryCards({
  summary,
  onSelect,
}: {
  summary: BudgetPaymentSummary;
  onSelect?: (filter: BudgetPaymentFilter) => void;
}) {
  const cards: {
    label: string;
    value: number;
    note: string;
    filter: BudgetPaymentFilter;
    accent?: string;
  }[] = [
    {
      label: "Tổng dự toán",
      value: summary.estimated,
      note: "Dự toán gốc của toàn kế hoạch",
      filter: "all",
    },
    {
      label: "Tổng dự kiến thanh toán",
      value: summary.forecast,
      note: summary.unpricedCount
        ? `${summary.unpricedCount} khoản chưa chốt giá`
        : "Giá đã chốt của các khoản",
      filter: "all",
    },
    {
      label: "Tổng đã trả",
      value: summary.paid,
      note: `Trong đó cọc ${formatBudgetMoney(summary.deposits)}`,
      filter: "history",
      accent: "text-emerald-700",
    },
    {
      label: "Còn phải trả",
      value: summary.remaining,
      note: summary.provisionalRemaining
        ? `Tạm tính thêm ${formatBudgetMoney(summary.provisionalRemaining)}`
        : "Công nợ đã xác định",
      filter: "remaining",
      accent: "text-rose-600",
    },
    {
      label: "Trước / đúng ngày cưới",
      value: summary.before,
      note: "Chưa trả, mốc trước/ngày cưới",
      filter: "before",
    },
    {
      label: "Sau đám cưới",
      value: summary.after,
      note: "Chưa trả, ở các mốc sau cưới",
      filter: "after",
      accent: "text-rose-600",
    },
    {
      label: "Đã quá hạn",
      value: summary.overdue,
      note: "Chưa trả và đã qua ngày hẹn",
      filter: "overdue",
      accent: "text-red-600",
    },
    {
      label: "Trong 7 ngày tới",
      value: summary.dueSoon,
      note: "Gồm cả ngày đến hạn hôm nay",
      filter: "dueSoon",
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
      {cards.map((card) => (
        <button
          type="button"
          key={card.label}
          disabled={!onSelect}
          onClick={() => onSelect?.(card.filter)}
          aria-label={`${card.label}: ${formatBudgetMoney(card.value)}`}
          className="min-w-0 rounded-2xl border border-rose-100 bg-white p-3 text-left transition hover:border-rose-300 sm:p-4 disabled:cursor-default"
        >
          <p className="text-[11px] text-gray-500">{card.label}</p>
          <p
            data-budget-metric={
              card.filter === "all"
                ? card.label === "Tổng dự toán"
                  ? "estimated"
                  : "forecast"
                : card.filter
            }
            className={`mt-2 break-words text-base font-bold sm:text-xl ${card.accent || "text-gray-900"}`}
          >
            {formatBudgetMoney(card.value)}
          </p>
          <p className="mt-2 break-words text-[10px] leading-relaxed text-gray-400">
            {card.note}
          </p>
        </button>
      ))}
    </div>
  );
}
