import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn() }));
vi.mock("../services/cloudService", () => ({
  loadUserDataFromCloud: mocks.load,
  saveUserDataToCloud: mocks.save,
}));
import CommandCenter from "../components/CommandCenter";
import { useStore } from "../store/useStore";
import { resolveMilestoneTasks } from "../lib/milestoneTasks";
import { createBackup, restoreBackup } from "../lib/backup";
const stats = {
  totalGuests: 0,
  weightedGuestCount: 0,
  totalChildren: 0,
  confirmedGuests: 0,
  totalBudget: 0,
  totalActual: 0,
  expectedGiftMoney: 0,
  pendingTasks: 0,
};
const remote = () => ({
  guests: [],
  budgetItems: [],
  revision: "r1",
  invitation: { ...useStore.getInitialState().invitation, date: "2028-12-01" },
});
beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  mocks.load.mockResolvedValue(remote());
  mocks.save.mockResolvedValue("r2");
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});
describe("dashboard milestone durability", () => {
  it("retains a tick through immediate storage rehydration and subsequent cloud acknowledgement", async () => {
    await useStore.getState().loadFromCloud();
    const view = render(
      <CommandCenter stats={stats} setActiveTab={() => {}} />,
    );
    const checkbox = screen.getByRole("checkbox", {
      name: "Chọn & chốt ngày cưới",
    });
    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "true");
    const saved = localStorage.getItem("wedplan-storage-v14")!;
    view.unmount();
    useStore.setState(useStore.getInitialState(), true);
    localStorage.setItem("wedplan-storage-v14", saved);
    await act(async () => {
      await useStore.persist.rehydrate();
      await useStore.getState().loadFromCloud();
    });
    render(<CommandCenter stats={stats} setActiveTab={() => {}} />);
    expect(
      screen.getByRole("checkbox", { name: "Chọn & chốt ngày cưới" }),
    ).toHaveAttribute("aria-checked", "true");
    await act(async () => {
      await useStore.getState().syncToCloud();
    });
    expect(mocks.save.mock.calls[0][1].milestoneTasks.m12[0].done).toBe(true);
    expect(useStore.getState().hasUnsyncedChanges).toBe(false);
  });
  it("migrates legacy browser-only tasks after a verified read and preserves empty lists", async () => {
    localStorage.setItem(
      "wedplan_ms_tasks_v2",
      JSON.stringify({
        m12: [],
        m9: [{ id: "old", title: "Legacy", notes: "Keep me", done: true }],
      }),
    );
    await useStore.getState().loadFromCloud();
    expect(useStore.getState().milestoneTasks.m12).toEqual([]);
    expect(
      resolveMilestoneTasks(useStore.getState().milestoneTasks).m9[0].done,
    ).toBe(true);
    expect(useStore.getState().hasUnsyncedChanges).toBe(true);
  });
  it("does not overwrite a server checklist or import legacy tasks after a failed read", async () => {
    localStorage.setItem(
      "wedplan_ms_tasks_v2",
      JSON.stringify({
        m12: [{ id: "old", title: "Legacy", notes: "", done: true }],
      }),
    );
    mocks.load.mockRejectedValueOnce(new Error("offline"));
    await expect(useStore.getState().loadFromCloud()).rejects.toThrow(
      "offline",
    );
    expect(useStore.getState().milestoneTasks).toEqual({});
    mocks.load.mockResolvedValue({ ...remote(), milestoneTasks: { m12: [] } });
    await useStore.getState().loadFromCloud();
    expect(useStore.getState().milestoneTasks).toEqual({ m12: [] });
    expect(useStore.getState().hasUnsyncedChanges).toBe(false);
  });
  it("round-trips dashboard notes/deletions through backup, preserves old backups and rejects malformed tasks", () => {
    const state = {
      ...useStore.getState(),
      milestoneTasks: {
        m12: [],
        m9: [
          { id: "custom", title: "Call vendor", notes: "Friday", done: true },
        ],
      },
    };
    expect(
      restoreBackup(createBackup(state), useStore.getState()).milestoneTasks,
    ).toEqual(state.milestoneTasks);
    expect(restoreBackup({ guests: [] }, state).milestoneTasks).toEqual(
      state.milestoneTasks,
    );
    expect(() =>
      restoreBackup(
        { guests: [], milestoneTasks: { m12: [{ done: true }] } },
        state,
      ),
    ).toThrow();
  });
});
