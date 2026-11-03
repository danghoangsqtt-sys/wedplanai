import React, { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Download, Wallet } from "lucide-react";
import {
  TaskStatus,
  type BudgetItem,
  type BudgetPaymentFilter,
} from "../types";
import { useStore } from "../store/useStore";
import { downloadCsv } from "../lib/csv";
import {
  formatBudgetDate,
  formatBudgetMoney,
  getBudgetPaymentSummary,
  getItemPaymentSummary,
  matchesBudgetFilter,
  paymentOffsetLabel,
} from "../lib/budgetPayments";
import { useBudgetDate } from "../hooks/useBudgetDate";
import BudgetItemForm from "./budget/BudgetItemForm";
import BudgetPaymentDetails from "./budget/BudgetPaymentDetails";
import PaymentDialog from "./budget/PaymentDialog";
import BudgetSummaryCards from "./budget/BudgetSummaryCards";
import {
  budgetInput,
  budgetPrimary,
  budgetSecondary,
} from "./budget/BudgetModal";

const paymentFilters: { id: BudgetPaymentFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "remaining", label: "Còn nợ" },
  { id: "after", label: "Trả sau cưới" },
  { id: "before", label: "Trước / ngày cưới" },
  { id: "overdue", label: "Quá hạn" },
  { id: "dueSoon", label: "7 ngày tới" },
  { id: "unscheduled", label: "Chưa xếp lịch" },
  { id: "unreconciled", label: "Chưa đối chiếu / chốt giá" },
  { id: "history", label: "Đã có thanh toán" },
];
const sideLabels = { BOTH: "Cả hai bên", GROOM: "Nhà trai", BRIDE: "Nhà gái" };
const searchKey = (text: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").toLowerCase();
export default function DetailedBudgetPlanner() {
  const {
    budgetItems,
    invitation,
    budgetFilter,
    setBudgetFilter,
    updateBudgetItem,
    deleteBudgetItem,
    setBudgetItems,
  } = useStore();
  const today = useBudgetDate();
  const [search, setSearch] = useState(""),
    [side, setSide] = useState("all"),
    [category, setCategory] = useState("all"),
    [work, setWork] = useState("all"),
    [sort, setSort] = useState("due");
  const [form, setForm] = useState<{ item?: BudgetItem } | null>(null),
    [detail, setDetail] = useState<string | null>(null),
    [payment, setPayment] = useState<{
      id: string;
      kind: "deposit" | "payment";
    } | null>(null),
    [error, setError] = useState("");
  const summary = useMemo(
    () => getBudgetPaymentSummary(budgetItems, invitation.date, today),
    [budgetItems, invitation.date, today],
  );
  const rows = useMemo(
    () =>
      budgetItems
        .map((item) => getItemPaymentSummary(item, invitation.date, today))
        .filter((row) => {
          const i = row.item;
          return (
            matchesBudgetFilter(row, budgetFilter) &&
            (side === "all" || i.side === side || i.side === "BOTH") &&
            (category === "all" || i.category === category) &&
            (work === "all" || i.status === work) &&
            searchKey(
              [i.itemName, i.supplierName, i.supplierPhone, i.assignee, i.note]
                .filter(Boolean)
                .join(" "),
            ).includes(searchKey(search.trim()))
          );
        })
        .sort((a, b) =>
          sort === "remaining"
            ? b.remaining - a.remaining
            : sort === "estimate"
              ? b.item.estimatedCost - a.item.estimatedCost
              : Number(b.overdue > 0) - Number(a.overdue > 0) ||
                (
                  a.schedule
                    .filter((s) => s.remaining > 0 && s.due)
                    .sort((x, y) => x.due!.localeCompare(y.due!))[0]?.due ||
                  "9999"
                ).localeCompare(
                  b.schedule
                    .filter((s) => s.remaining > 0 && s.due)
                    .sort((x, y) => x.due!.localeCompare(y.due!))[0]?.due ||
                    "9999",
                ),
        ),
    [
      budgetItems,
      invitation.date,
      today,
      budgetFilter,
      side,
      category,
      work,
      search,
      sort,
    ],
  );
  const categories = [...new Set(budgetItems.map((i) => i.category))];
  const filteredKnown = rows
      .filter((r) => !r.provisional)
      .reduce((n, r) => n + r.remaining, 0),
    filteredProvisional = rows
      .filter((r) => r.provisional)
      .reduce((n, r) => n + r.remaining, 0);
  const reset = () => {
    setBudgetFilter("all");
    setSearch("");
    setSide("all");
    setCategory("all");
    setWork("all");
  };
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
  const exportSummary = () =>
    downloadCsv("ngan_sach_va_cong_no.csv", [
      [
        "Danh mục",
        "Khoản chi",
        "Nhà cung cấp",
        "Điện thoại",
        "Bên phụ trách",
        "Người phụ trách",
        "Trạng thái công việc",
        "Dự toán",
        "Giá chốt",
        "Thực tế cũ chưa diễn giải",
        "Đã cọc",
        "Tổng đã trả",
        "Còn phải trả đã xác định",
        "Còn tạm tính",
        "Sau cưới",
        "Chưa xếp lịch",
        "Trả dư",
        "Ghi chú",
      ],
      ...rows.map((r) => [
        r.item.category,
        r.item.itemName,
        r.item.supplierName || "",
        r.item.supplierPhone || "",
        sideLabels[r.item.side] || "",
        r.item.assignee,
        r.item.status,
        r.item.estimatedCost,
        r.item.agreedCost ?? "",
        r.item.actualCost,
        r.deposits,
        r.paid,
        r.provisional ? "" : r.remaining,
        r.provisional ? r.remaining : "",
        r.provisional ? "" : r.after,
        r.provisional ? "" : r.unscheduled,
        r.overpaid,
        r.item.note || "",
      ]),
    ]);
  const exportSchedule = () =>
    downloadCsv("lich_thanh_toan.csv", [
      [
        "Khoản chi",
        "Nhà cung cấp",
        "Đợt",
        "Mốc so với ngày cưới",
        "Ngày được tính",
        "Phải trả",
        "Đã trả",
        "Còn lại",
        "Tính chất",
      ],
      ...rows.flatMap((r) =>
        r.schedule.map((s) => [
          r.item.itemName,
          r.item.supplierName || "",
          s.label,
          paymentOffsetLabel(s.offsetDays),
          s.due || "",
          s.amount,
          s.paid,
          s.remaining,
          r.provisional
            ? "Tạm tính"
            : s.overdue
              ? "Quá hạn"
              : s.remaining === 0
                ? "Đã trả đủ"
                : "Chưa trả đủ",
        ]),
      ),
    ]);
  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-500">
            Cọc · Thanh toán · Công nợ
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            Ngân sách & thanh toán
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Biết đã cọc bao nhiêu, còn phải trả cho ai và ở mốc nào.
          </p>
        </div>
        <button
          onClick={() => setForm({})}
          className={`${budgetPrimary} flex items-center gap-2`}
        >
          <Plus className="h-4 w-4" />
          Thêm khoản chi
        </button>
      </div>
      <BudgetSummaryCards summary={summary} onSelect={setBudgetFilter} />
      {(summary.unreconciledCount > 0 || summary.unpricedCount > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
          <b>
            {summary.unreconciledCount} khoản chưa đối chiếu ·{" "}
            {summary.unpricedCount} khoản chưa chốt giá.
          </b>{" "}
          Công nợ đã xác định chưa gồm phần tạm tính{" "}
          {formatBudgetMoney(summary.provisionalRemaining)}. Số “Thực tế” cũ
          được giữ nguyên, không tự xem là tiền đã trả.{" "}
          <button
            className="ml-1 font-semibold underline"
            onClick={() => setBudgetFilter("unreconciled")}
          >
            Xem để đối chiếu
          </button>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <section
        aria-label="Bộ lọc ngân sách"
        className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4"
      >
        <div className="flex flex-wrap gap-2">
          <label className="relative min-w-44 flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              aria-label="Tìm khoản chi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm khoản chi, nhà cung cấp, ghi chú…"
              className={`${budgetInput} mt-0 pl-9`}
            />
          </label>
          <button
            onClick={exportSummary}
            className={`${budgetSecondary} flex items-center gap-2`}
          >
            <Download className="h-4 w-4" />
            Xuất công nợ
          </button>
          <button onClick={exportSchedule} className={budgetSecondary}>
            Xuất lịch trả
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {paymentFilters.map((f) => (
            <button
              key={f.id}
              aria-pressed={budgetFilter === f.id}
              onClick={() => setBudgetFilter(f.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs ${budgetFilter === f.id ? "border-rose-300 bg-rose-50 font-semibold text-rose-600" : "border-gray-200 text-gray-500"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
          <select
            aria-label="Lọc bên phụ trách"
            value={side}
            onChange={(e) => setSide(e.target.value)}
            className={budgetInput}
          >
            <option value="all">Tất cả các bên</option>
            <option value="GROOM">Nhà trai</option>
            <option value="BRIDE">Nhà gái</option>
            <option value="BOTH">Cả hai bên</option>
          </select>
          <select
            aria-label="Lọc danh mục"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={budgetInput}
          >
            <option value="all">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            aria-label="Lọc trạng thái công việc"
            value={work}
            onChange={(e) => setWork(e.target.value)}
            className={budgetInput}
          >
            <option value="all">Tất cả công việc</option>
            {Object.values(TaskStatus).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Sắp xếp ngân sách"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={budgetInput}
          >
            <option value="due">Ưu tiên hạn trả</option>
            <option value="remaining">Còn phải trả nhiều nhất</option>
            <option value="estimate">Dự toán cao nhất</option>
          </select>
          <button onClick={reset} className="text-sm text-rose-600 underline">
            Xóa bộ lọc
          </button>
        </div>
      </section>
      <p className="text-xs leading-relaxed text-gray-500">
        Đang xem {rows.length}/{budgetItems.length} khoản · Còn phải trả trong
        bộ lọc: <b>{formatBudgetMoney(filteredKnown)}</b>
        {filteredProvisional > 0
          ? ` · Tạm tính riêng: ${formatBudgetMoney(filteredProvisional)}`
          : ""}
      </p>
      <div className="space-y-3">
        {rows.map((row) => {
          const item = row.item,
            next = row.schedule
              .filter((s) => s.remaining > 0)
              .sort((a, b) => a.offsetDays - b.offsetDays)[0];
          return (
            <article
              key={item.id}
              aria-label={`Khoản chi: ${item.itemName}`}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {item.category} · {sideLabels[item.side]}
                  </p>
                  <h2 className="mt-1 break-words text-base font-bold text-gray-900">
                    {item.itemName}
                  </h2>
                  <p className="mt-1 break-words text-xs text-gray-500">
                    {item.supplierName || "Chưa có nhà cung cấp"}
                    {item.assignee ? ` · ${item.assignee}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Trạng thái công việc ${item.itemName}`}
                    value={item.status}
                    onChange={(e) =>
                      run(() =>
                        updateBudgetItem(item.id, "status", e.target.value),
                      )
                    }
                    className="max-w-40 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-600"
                  >
                    <option value={TaskStatus.PENDING}>Chưa làm</option>
                    <option value={TaskStatus.IN_PROGRESS}>
                      Đang thực hiện
                    </option>
                    <option value={TaskStatus.DONE}>Đã xong dịch vụ</option>
                    {item.status === TaskStatus.PAID && (
                      <option value={TaskStatus.PAID}>
                        Đã thanh toán (nhãn cũ)
                      </option>
                    )}
                  </select>
                  <button
                    aria-label={`Sửa ${item.itemName}`}
                    onClick={() => setForm({ item })}
                    className="rounded-lg p-2 text-gray-400 hover:bg-rose-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label={`Xóa ${item.itemName}`}
                    onClick={() => {
                      if (
                        confirm(
                          `Xóa khoản ${item.itemName}${item.payments?.length ? " cùng toàn bộ lịch sử thanh toán của khoản này" : ""}?`,
                        )
                      )
                        run(() => deleteBudgetItem(item.id));
                    }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="my-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                {[
                  ["Dự toán", formatBudgetMoney(item.estimatedCost)],
                  [
                    "Giá đã chốt",
                    item.agreedCost === undefined
                      ? "Chưa chốt"
                      : formatBudgetMoney(item.agreedCost),
                  ],
                  [
                    "Đã cọc",
                    row.tracked
                      ? formatBudgetMoney(row.deposits)
                      : "Chưa đối chiếu",
                  ],
                  [
                    "Tổng đã trả",
                    row.tracked ? formatBudgetMoney(row.paid) : "Chưa ghi nhận",
                  ],
                  [
                    row.provisional ? "Còn tạm tính" : "Còn phải trả",
                    formatBudgetMoney(row.remaining),
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <p className="text-[10px] text-gray-400">{label}</p>
                    <p
                      className={`mt-1 break-words text-sm font-bold ${label.startsWith("Còn") ? "text-rose-600" : "text-gray-800"}`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                <div className="min-w-0 text-xs leading-relaxed text-gray-500">
                  {!row.tracked ? (
                    <p>
                      Số thực tế cũ {formatBudgetMoney(item.actualCost)} cần đối
                      chiếu.
                    </p>
                  ) : next ? (
                    <p>
                      Đợt tiếp: <b>{next.label}</b> ·{" "}
                      {paymentOffsetLabel(next.offsetDays)} ·{" "}
                      {formatBudgetDate(next.due)}
                      <br />
                      {formatBudgetMoney(next.remaining)}
                      {next.overdue && (
                        <span className="ml-2 rounded bg-red-50 px-2 py-0.5 text-red-600">
                          Quá hạn
                        </span>
                      )}
                    </p>
                  ) : row.remaining > 0 ? (
                    <p>
                      {formatBudgetMoney(row.unscheduled)} còn chưa xếp lịch.
                    </p>
                  ) : (
                    <p className="text-emerald-700">
                      {row.provisional
                        ? "Chưa có số dư dự kiến"
                        : "Đã thanh toán đủ"}
                    </p>
                  )}
                  {row.overpaid > 0 && (
                    <p className="text-amber-700">
                      Trả dư {formatBudgetMoney(row.overpaid)} tại đơn vị này.
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setDetail(item.id)}
                    className={budgetSecondary}
                  >
                    Chi tiết thanh toán
                  </button>
                  {row.tracked ? (
                    <button
                      onClick={() =>
                        setPayment({ id: item.id, kind: "deposit" })
                      }
                      className={budgetPrimary}
                    >
                      Ghi nhận cọc
                    </button>
                  ) : (
                    <button
                      onClick={() => setForm({ item })}
                      className={budgetPrimary}
                    >
                      Đối chiếu số liệu
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
        {!rows.length && (
          <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-gray-400">
            <Wallet className="mx-auto mb-3 h-8 w-8 text-rose-200" />
            Không có khoản chi phù hợp.{" "}
            <button onClick={reset} className="text-rose-600 underline">
              Xem tất cả
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <p>
          Cọc đã nằm trong số đã trả. Công việc hoàn tất không tự tạo thanh
          toán.
        </p>
        <button
          onClick={() => {
            if (
              budgetItems.length &&
              confirm(
                `Xóa toàn bộ ${budgetItems.length} khoản chi và lịch sử thanh toán? Hãy xuất backup trước.`,
              )
            )
              run(() => setBudgetItems([]));
          }}
          className="underline"
        >
          Xóa toàn bộ ngân sách
        </button>
      </div>
      {form && (
        <BudgetItemForm item={form.item} onClose={() => setForm(null)} />
      )}
      {detail && (
        <BudgetPaymentDetails
          itemId={detail}
          onClose={() => setDetail(null)}
          onEdit={(item) => setForm({ item })}
        />
      )}
      {payment && (
        <PaymentDialog
          itemId={payment.id}
          kind={payment.kind}
          onClose={() => setPayment(null)}
        />
      )}
    </div>
  );
}
