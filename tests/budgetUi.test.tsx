import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("../services/cloudService", () => ({
  loadUserDataFromCloud: vi.fn(),
  saveUserDataToCloud: vi.fn(),
}));
import DetailedBudgetPlanner from "../components/DetailedBudgetPlanner";
import { useStore } from "../store/useStore";
import { getItemPaymentSummary } from "../lib/budgetPayments";
import { TaskStatus, type BudgetItem } from "../types";
const base: BudgetItem = {
  id: "r",
  itemName: "Nhà hàng",
  category: "Tiệc",
  side: "BOTH",
  assignee: "",
  status: TaskStatus.PENDING,
  estimatedCost: 120000000,
  actualCost: 0,
  agreedCost: 110000000,
  paymentSchedule: [],
  payments: [],
};
beforeEach(() => {
  useStore.setState(
    {
      ...useStore.getInitialState(),
      budgetItems: [structuredClone(base)],
      invitation: {
        ...useStore.getInitialState().invitation,
        date: "2026-12-20",
      },
    },
    true,
  );
  useStore.getState().enableLocalMode();
});
describe("shipping budget input flows", () => {
  it("records a deposit, relative schedule and another partial payment through real forms", async () => {
    render(<DetailedBudgetPlanner />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Ghi nhận cọc" }));
    await user.type(
      screen.getByRole("spinbutton", { name: "Số tiền mới thực trả (VNĐ)" }),
      "30000000",
    );
    await user.click(screen.getByRole("button", { name: "Xác nhận đã trả" }));
    await user.click(
      screen.getByRole("button", { name: "Chi tiết thanh toán" }),
    );
    await user.click(screen.getByRole("button", { name: "＋ Thêm đợt" }));
    await user.type(
      screen.getByRole("textbox", { name: "Tên đợt" }),
      "Quyết toán sau tiệc",
    );
    await user.type(
      screen.getByRole("spinbutton", {
        name: "Số tiền phải trả của đợt (VNĐ)",
      }),
      "110000000",
    );
    await user.click(
      screen.getByRole("button", { name: "Lưu đợt thanh toán" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Ghi nhận thanh toán" }),
    );
    await user.type(
      screen.getByRole("spinbutton", { name: "Số tiền mới thực trả (VNĐ)" }),
      "20000000",
    );
    await user.click(screen.getByRole("button", { name: "Xác nhận đã trả" }));
    const row = useStore.getState().budgetItems[0];
    expect(getItemPaymentSummary(row, "2026-12-20")).toMatchObject({
      paid: 50000000,
      deposits: 30000000,
      remaining: 60000000,
      after: 60000000,
    });
    expect(row.payments).toHaveLength(2);
    expect(row.paymentSchedule![0].offsetDays).toBe(3);
    expect(useStore.getState().hasUnsyncedChanges).toBe(true);
    expect(useStore.getState().isLocalOnly).toBe(true);
  });
  it("requires explicit reconciliation and retains legacy actualCost separately from recorded cash", async () => {
    useStore.setState({
      budgetItems: [
        {
          ...base,
          agreedCost: undefined,
          payments: undefined,
          paymentSchedule: undefined,
          actualCost: 50000000,
          status: TaskStatus.PAID,
        },
      ],
    });
    render(<DetailedBudgetPlanner />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Đối chiếu số liệu" }));
    await user.type(
      screen.getByRole("spinbutton", { name: "Giá đã chốt (VNĐ)" }),
      "110000000",
    );
    const paid = screen.getByRole("spinbutton", {
      name: "Tổng thực đã trả trước đây (VNĐ)",
    });
    await user.clear(paid);
    await user.type(paid, "50000000");
    const deposit = screen.getByRole("spinbutton", {
      name: "Trong đó tiền cọc (VNĐ)",
    });
    await user.clear(deposit);
    await user.type(deposit, "30000000");
    await user.click(
      screen.getByRole("checkbox", {
        name: "Tôi đã đối chiếu giá chốt và số thực đã trả.",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "Xác nhận đối chiếu" }),
    );
    const row = useStore.getState().budgetItems[0];
    expect(row.actualCost).toBe(50000000);
    expect(row.payments).toHaveLength(2);
    expect(getItemPaymentSummary(row, "2026-12-20")).toMatchObject({
      paid: 50000000,
      deposits: 30000000,
      remaining: 60000000,
    });
  });
  it("keeps typing focus and preserves existing payment history when metadata is edited", async () => {
    render(<DetailedBudgetPlanner />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Sửa Nhà hàng" }));
    const input = screen.getByRole("textbox", { name: "Tên khoản chi" });
    await user.clear(input);
    await user.type(input, "Nhà hàng tiệc cưới");
    expect(input).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Lưu khoản chi" }));
    expect(useStore.getState().budgetItems[0].itemName).toBe(
      "Nhà hàng tiệc cưới",
    );
  });
  it("does not create a transaction from completed work and retains voided records", async () => {
    useStore.setState({
      budgetItems: [
        {
          ...base,
          payments: [
            {
              id: "p",
              kind: "deposit",
              amount: 30000000,
              paidAt: "2026-11-03",
              allocations: [{ scheduleId: null, amount: 30000000 }],
            },
          ],
        },
      ],
    });
    render(<DetailedBudgetPlanner />);
    const user = userEvent.setup();
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Trạng thái công việc Nhà hàng" }),
      TaskStatus.DONE,
    );
    expect(useStore.getState().budgetItems[0].payments).toHaveLength(1);
    await user.click(
      screen.getByRole("button", { name: "Chi tiết thanh toán" }),
    );
    await user.click(
      screen.getByRole("button", { name: "Hủy bản ghi nhập sai" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Lý do hủy" }),
      "Nhập trùng",
    );
    await user.click(
      screen.getByRole("button", { name: "Xác nhận hủy bản ghi" }),
    );
    const item = useStore.getState().budgetItems[0];
    expect(item.payments).toHaveLength(1);
    expect(item.payments![0].voidReason).toBe("Nhập trùng");
    expect(getItemPaymentSummary(item, "2026-12-20").paid).toBe(0);
  });
  it("separates a missing agreed price from a valid zero price", async () => {
    useStore.setState({ budgetItems: [] });
    render(<DetailedBudgetPlanner />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Thêm khoản chi" }));
    await user.type(
      screen.getByRole("textbox", { name: "Tên khoản chi" }),
      "Khoản được tặng",
    );
    await user.type(
      screen.getByRole("spinbutton", { name: "Dự toán (VNĐ)" }),
      "0",
    );
    await user.type(
      screen.getByRole("spinbutton", { name: "Giá đã chốt (VNĐ)" }),
      "0",
    );
    await user.click(screen.getByRole("button", { name: "Lưu khoản chi" }));
    expect(useStore.getState().budgetItems[0].agreedCost).toBe(0);
    expect(
      screen.getByRole("article", { name: "Khoản chi: Khoản được tặng" }),
    ).toHaveTextContent("Đã thanh toán đủ");
  });
});
