import { PIN_HASH } from "./constants";

export const USE_ACCOUNT_ACCESS =
  import.meta.env.VITE_ACCESS_MODE === "account";
export const PERSONAL_UNLOCK_KEY = "wedplan_personal_pin_v1";
export const PERSONAL_LOCK_EVENT = "wedplan:personal-lock";

export async function verifyPersonalPin(pin: string): Promise<boolean> {
  if (!/^\d{6}$/.test(pin)) return false;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(pin),
  );
  const hex = Array.from(new Uint8Array(digest), (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
  return hex === PIN_HASH;
}

export function lockPersonalAccess() {
  try {
    sessionStorage.removeItem(PERSONAL_UNLOCK_KEY);
  } catch {
    /* No persistent unlock when storage is unavailable. */
  }
  window.dispatchEvent(new Event(PERSONAL_LOCK_EVENT));
}
