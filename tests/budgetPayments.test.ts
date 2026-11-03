import { describe, expect, it } from "vitest";
import {
  getItemPaymentSummary,
  getBudgetPaymentSummary,
  recordBudgetPayment,
  saveBudgetSchedule,
  removeBudgetSchedule,
  voidBudgetPayment,
  validateBudgetPaymentData,
  todayInBangkok,
} from "../lib/budgetPayments";
import { TaskStatus, type BudgetItem } from "../types";
const M = 1000000,
  day = "2026-12-20";
function item(): BudgetItem {
  return {
    id: "restaurant",
    itemName: "Nhà hàng",
    category: "Tiệc",
    side: "BOTH",
    assignee: "",
    status: TaskStatus.PENDING,
    estimatedCost: 120 * M,
    actualCost: 0,
    agreedCost: 110 * M,
    payments: [],
    paymentSchedule: [
      { id: "s1", label: "Cọc", offsetDays: -30, amount: 30 * M },
      { id: "s2", label: "Trước tiệc", offsetDays: -7, amount: 20 * M },
      { id: "s3", label: "Quyết toán", offsetDays: 3, amount: 60 * M },
    ],
  };
}
function paid() {
  let row = recordBudgetPayment(
    item(),
    { id: "p1", amount: 30 * M, kind: "deposit", paidAt: "2026-11-20" },
    day,
    "s1",
  );
  row = recordBudgetPayment(
    row,
    { id: "p2", amount: 20 * M, kind: "payment", paidAt: "2026-12-13" },
    day,
    "s2",
  );
  return row;
}
describe("canonical wedding payment ledger", () => {
  it("counts deposits once and keeps cash independent from completed work", () => {
    const row = { ...paid(), status: TaskStatus.DONE };
    const s = getItemPaymentSummary(row, day, "2026-12-21");
    expect(s).toMatchObject({
      paid: 50 * M,
      deposits: 30 * M,
      remaining: 60 * M,
      after: 60 * M,
      before: 0,
    });
    expect(row.actualCost).toBe(0);
  });
  it("allocates one payment across stages without duplication", () => {
    const row = recordBudgetPayment(
      item(),
      { id: "p", amount: 35 * M, kind: "payment", paidAt: "2026-11-21" },
      day,
    );
    expect(row.payments![0].allocations).toEqual([
      { scheduleId: "s1", amount: 30 * M },
      { scheduleId: "s2", amount: 5 * M },
    ]);
    expect(getItemPaymentSummary(row, day)).toMatchObject({
      paid: 35 * M,
      remaining: 75 * M,
      before: 15 * M,
      after: 60 * M,
    });
  });
  it("preserves legacy actualCost and PAID status without inventing transactions", () => {
    const legacy = {
      ...item(),
      payments: undefined,
      paymentSchedule: undefined,
      agreedCost: undefined,
      actualCost: 110 * M,
      status: TaskStatus.PAID,
    };
    expect(getBudgetPaymentSummary([legacy], day)).toMatchObject({
      paid: 0,
      remaining: 0,
      provisionalRemaining: 120 * M,
      unreconciledCount: 1,
    });
    expect(legacy.actualCost).toBe(110 * M);
  });
  it("separates provisional balances and actual deposits before a price is agreed", () => {
    const row = recordBudgetPayment(
      { ...item(), agreedCost: undefined, paymentSchedule: [] },
      { id: "p", amount: 10 * M, kind: "deposit", paidAt: day },
      day,
    );
    expect(getBudgetPaymentSummary([row], day)).toMatchObject({
      paid: 10 * M,
      deposits: 10 * M,
      remaining: 0,
      provisionalRemaining: 110 * M,
      unpricedCount: 1,
    });
  });
  it("reports supplier overpayments separately rather than netting other debt", () => {
    const row = recordBudgetPayment(
      paid(),
      { id: "p3", amount: 70 * M, kind: "payment", paidAt: "2026-12-23" },
      day,
    );
    const other = {
      ...item(),
      id: "other",
      agreedCost: 13 * M,
      paymentSchedule: [],
      payments: [],
    };
    expect(getBudgetPaymentSummary([row, other], day)).toMatchObject({
      paid: 120 * M,
      remaining: 13 * M,
      overpaid: 10 * M,
      unscheduled: 13 * M,
    });
  });
  it("preserves reconciliation after voiding a payment that preceded an overpayment", () => {
    const row = recordBudgetPayment(
      paid(),
      { id: "p3", amount: 70 * M, kind: "payment", paidAt: "2026-12-23" },
      day,
    );
    const corrected = voidBudgetPayment(row, "p1", "Bản ghi cọc bị nhầm");
    const s = getItemPaymentSummary(corrected, day);
    expect(s.remaining).toBe(20 * M);
    expect(s.before + s.after + s.unscheduled).toBe(s.remaining);
    expect(corrected.payments![0]).toHaveProperty(
      "voidReason",
      "Bản ghi cọc bị nhầm",
    );
    expect(row.payments![0].voidedAt).toBeUndefined();
  });
  it("moves scheduled dates with the wedding, keeps actual dates and settled references", () => {
    const row = paid(),
      s = getItemPaymentSummary(row, "2027-01-10", "2027-01-11");
    expect(s.schedule[0].due).toBe("2026-11-20");
    expect(s.schedule[2].due).toBe("2027-01-13");
    expect(row.payments![0].paidAt).toBe("2026-11-20");
  });
  it("does not call today overdue and handles missing wedding dates", () => {
    const row = paid();
    expect(getItemPaymentSummary(row, day, "2026-12-23")).toMatchObject({
      overdue: 0,
      dueSoon: 60 * M,
    });
    expect(getItemPaymentSummary(row, day, "2026-12-24")).toMatchObject({
      overdue: 60 * M,
      dueSoon: 0,
    });
    expect(getItemPaymentSummary(row, "", "2026-12-24")).toMatchObject({
      overdue: 0,
      dueSoon: 0,
      after: 60 * M,
    });
    expect(todayInBangkok(new Date("2026-11-02T18:00:00Z"))).toBe("2026-11-03");
  });
  it("schedules an already paid unplanned balance without creating cash", () => {
    let row = recordBudgetPayment(
      { ...item(), paymentSchedule: [] },
      { id: "p", amount: 30 * M, kind: "deposit", paidAt: day },
      day,
    );
    row = saveBudgetSchedule(
      row,
      { id: "new", label: "Sau tiệc", amount: 110 * M, offsetDays: 3 },
      day,
    );
    expect(getItemPaymentSummary(row, day)).toMatchObject({
      paid: 30 * M,
      remaining: 80 * M,
      after: 80 * M,
      unscheduled: 0,
    });
    expect(row.payments).toHaveLength(1);
    expect(row.payments![0].allocations).toEqual([
      { scheduleId: "new", amount: 30 * M },
    ]);
  });
  it("allows explicit zero prices but protects referenced stage history", () => {
    expect(
      getItemPaymentSummary(
        { ...item(), agreedCost: 0, paymentSchedule: [] },
        day,
      ).remaining,
    ).toBe(0);
    expect(() => removeBudgetSchedule(paid(), "s1")).toThrow(/lịch sử/);
    expect(() =>
      saveBudgetSchedule(
        paid(),
        { id: "s1", label: "Cọc", amount: 1, offsetDays: 0 },
        day,
      ),
    ).toThrow(/nhỏ hơn/);
  });
  it.each([
    { ...item(), agreedCost: -1 },
    {
      ...item(),
      paymentSchedule: [{ id: "s", label: "Bad", amount: 1, offsetDays: 0.5 }],
    },
    {
      ...item(),
      payments: [
        {
          id: "p",
          amount: 1,
          kind: "payment",
          paidAt: "2026-02-30",
          allocations: [],
        },
      ],
    },
    {
      ...item(),
      payments: [
        {
          id: "p",
          amount: 1,
          kind: "payment",
          paidAt: day,
          allocations: [{ scheduleId: "missing", amount: 1 }],
        },
      ],
    },
    {
      ...item(),
      payments: [
        {
          id: "p",
          amount: 1,
          kind: "payment",
          paidAt: day,
          allocations: [{ scheduleId: "s1", amount: 2 }],
        },
      ],
    },
    { ...item(), agreedCost: Number.MAX_SAFE_INTEGER + 1 },
  ])("rejects malformed financial extensions atomically", (row) => {
    expect(() => validateBudgetPaymentData(row as BudgetItem)).toThrow();
  });
  it("rejects duplicate transaction IDs and unsafe aggregate sums", () => {
    expect(() =>
      recordBudgetPayment(
        paid(),
        { id: "p1", amount: 1, kind: "payment", paidAt: day },
        day,
      ),
    ).toThrow(/đã được/);
    const huge = {
      ...item(),
      estimatedCost: Number.MAX_SAFE_INTEGER,
      agreedCost: Number.MAX_SAFE_INTEGER,
      paymentSchedule: [],
    };
    expect(() =>
      getBudgetPaymentSummary([huge, { ...huge, id: "other" }], day),
    ).toThrow(/giới hạn/);
  });
});
