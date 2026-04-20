import type { HistoryItem } from "./types";

const STORAGE_KEY = "decision-debugger-history";
const MAX_HISTORY_ITEMS = 10;

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.slice(0, MAX_HISTORY_ITEMS) as HistoryItem[];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items.slice(0, MAX_HISTORY_ITEMS)),
  );
}

export function addHistoryItem(items: HistoryItem[], item: HistoryItem) {
  return [item, ...items].slice(0, MAX_HISTORY_ITEMS);
}
