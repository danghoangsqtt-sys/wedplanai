import { MILESTONES } from "../data/milestones";
import type { MilestoneTaskStore } from "../types";

export function isMilestoneTaskStore(
  value: unknown,
): value is MilestoneTaskStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([key, tasks]) =>
      MILESTONES.some((m) => m.id === key) &&
      Array.isArray(tasks) &&
      tasks.length <= 500 &&
      new Set(tasks.map((t) => t?.id)).size === tasks.length &&
      tasks.every(
        (t) =>
          t &&
          typeof t.id === "string" &&
          t.id.length > 0 &&
          t.id.length <= 100 &&
          typeof t.title === "string" &&
          t.title.length > 0 &&
          t.title.length <= 500 &&
          typeof t.notes === "string" &&
          t.notes.length <= 10000 &&
          typeof t.done === "boolean",
      ),
  );
}

export function resolveMilestoneTasks(
  saved: MilestoneTaskStore = {},
): MilestoneTaskStore {
  const valid = isMilestoneTaskStore(saved) ? saved : {};
  return Object.fromEntries(
    MILESTONES.map((ms) => [
      ms.id,
      valid[ms.id] ??
        ms.defaultTasks.map((t, i) => ({
          id: `${ms.id}_${i}`,
          title: t.title,
          notes: t.notes,
          done: false,
        })),
    ]),
  );
}

export function readLegacyMilestoneTasks(): MilestoneTaskStore | null {
  try {
    const raw = localStorage.getItem("wedplan_ms_tasks_v2");
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isMilestoneTaskStore(parsed) && Object.keys(parsed).length
      ? parsed
      : null;
  } catch {
    return null;
  }
}
