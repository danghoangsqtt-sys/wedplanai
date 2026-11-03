import { useEffect, useState } from "react";
import { todayInBangkok } from "../lib/budgetPayments";
export function useBudgetDate(): string {
  const [date, setDate] = useState(todayInBangkok);
  useEffect(() => {
    const update = () => setDate(todayInBangkok());
    const timer = window.setInterval(update, 60000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return date;
}
