import React from "react";
import AccountGate from "./AccountGate";
import PersonalPinGate from "./PersonalPinGate";
import { USE_ACCOUNT_ACCESS } from "../lib/personalAccess";

export default function PasswordGate(props: {
  children: React.ReactNode;
  onUnlock: () => Promise<void>;
}) {
  return USE_ACCOUNT_ACCESS ? (
    <AccountGate {...props} />
  ) : (
    <PersonalPinGate {...props} />
  );
}
