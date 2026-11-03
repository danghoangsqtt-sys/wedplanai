import React from "react";
import { webcrypto } from "node:crypto";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  configured: false,
  getSession: vi.fn(),
  getUser: vi.fn(),
  rpc: vi.fn(),
  save: vi.fn(),
  load: vi.fn(),
}));
vi.mock("../lib/supabase", () => ({
  get isSupabaseConfigured() {
    return mocks.configured;
  },
  TABLES: {},
  supabase: {
    rpc: mocks.rpc,
    auth: { getSession: mocks.getSession, getUser: mocks.getUser },
  },
}));
vi.mock("../services/cloudService", () => ({
  saveUserDataToCloud: mocks.save,
  loadUserDataFromCloud: mocks.load,
}));
import PasswordGate from "../components/PasswordGate";
import { lockPersonalAccess, verifyPersonalPin } from "../lib/personalAccess";
import { useStore } from "../store/useStore";

beforeEach(() => {
  vi.stubGlobal("crypto", webcrypto);
  sessionStorage.clear();
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  mocks.configured = false;
  mocks.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "owner", email: "owner@example.test" } },
    error: null,
  });
  mocks.rpc.mockResolvedValue({ data: false, error: null });
});
afterEach(() => {
  vi.unstubAllGlobals();
});
async function enterPin(pin = "201020") {
  fireEvent.change(screen.getByLabelText("Mã PIN"), { target: { value: pin } });
  fireEvent.click(screen.getByRole("button", { name: "Mở kế hoạch" }));
}
describe("personal PIN access is the default", () => {
  it("matches the owner chosen PIN and rejects different or malformed values", async () => {
    expect(await verifyPersonalPin("201020")).toBe(true);
    expect(await verifyPersonalPin("123456")).toBe(false);
    expect(await verifyPersonalPin("20102")).toBe(false);
  });
  it("opens without Supabase setup or account login and does not authorize network access", async () => {
    const onUnlock = vi.fn();
    render(<PasswordGate onUnlock={onUnlock}>PERSONAL PLAN</PasswordGate>);
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    await enterPin("123456");
    await screen.findByRole("alert");
    expect(screen.queryByText("PERSONAL PLAN")).not.toBeInTheDocument();
    await enterPin();
    await screen.findByText("PERSONAL PLAN");
    expect(useStore.getState()).toMatchObject({
      isLocalOnly: true,
      isCloudLoaded: false,
      syncStatus: "local",
    });
    expect(onUnlock).not.toHaveBeenCalled();
    expect(mocks.getSession).not.toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("retains same-tab unlock, local edits and an explicit relock without signing out of a server", async () => {
    const onUnlock = vi.fn();
    let view = render(
      <PasswordGate onUnlock={onUnlock}>PERSONAL PLAN</PasswordGate>,
    );
    await enterPin();
    await screen.findByText("PERSONAL PLAN");
    act(() =>
      useStore.getState().updateInvitation({ groomName: "Personal change" }),
    );
    await useStore.getState().syncToCloud();
    expect(mocks.save).not.toHaveBeenCalled();
    expect(useStore.getState().hasUnsyncedChanges).toBe(true);
    expect(
      JSON.parse(localStorage.getItem("wedplan-storage-v14")!).state.invitation
        .groomName,
    ).toBe("Personal change");
    view.unmount();
    view = render(
      <PasswordGate onUnlock={onUnlock}>PERSONAL PLAN</PasswordGate>,
    );
    await screen.findByText("PERSONAL PLAN");
    act(() => lockPersonalAccess());
    await screen.findByRole("button", { name: "Mở kế hoạch" });
    expect(screen.queryByText("PERSONAL PLAN")).not.toBeInTheDocument();
    await enterPin();
    await screen.findByText("PERSONAL PLAN");
    expect(useStore.getState().invitation.groomName).toBe("Personal change");
  });
  it("does not use PIN as database authorization even when a cached account session exists", async () => {
    mocks.configured = true;
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: "existing-session" } },
      error: null,
    });
    const onUnlock = vi.fn();
    render(<PasswordGate onUnlock={onUnlock}>PERSONAL PLAN</PasswordGate>);
    await enterPin();
    await screen.findByText("PERSONAL PLAN");
    await waitFor(() => expect(mocks.rpc).toHaveBeenCalled());
    expect(onUnlock).not.toHaveBeenCalled();
    expect(useStore.getState().isLocalOnly).toBe(true);
  });
  it("may connect an already verified owner session, and keeps local access after a failed cloud read", async () => {
    mocks.configured = true;
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: "existing-session" } },
      error: null,
    });
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    const onUnlock = vi.fn().mockRejectedValue(new Error("offline"));
    render(<PasswordGate onUnlock={onUnlock}>PERSONAL PLAN</PasswordGate>);
    await enterPin();
    await screen.findByText("PERSONAL PLAN");
    await screen.findByRole("alert");
    expect(onUnlock).toHaveBeenCalledTimes(1);
    expect(useStore.getState().isLocalOnly).toBe(true);
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
