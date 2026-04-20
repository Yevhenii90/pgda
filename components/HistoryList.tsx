"use client";

import type { HistoryItem } from "@/lib/types";

type HistoryListProps = {
  items: HistoryItem[];
  onOpen: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function HistoryList({ items, onOpen, onDelete }: HistoryListProps) {
  return (
    <section aria-labelledby="history-heading" className="border-t border-stone-200 pt-8">
      <h2 id="history-heading" className="mb-4 text-lg font-semibold text-stone-950">
        History
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-stone-600">
          Your last 10 analyses will appear here.
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 rounded border border-stone-200 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <button
                type="button"
                onClick={() => onOpen(item)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="block truncate text-sm font-medium text-stone-950">
                  {item.result.title}
                </span>
                <span className="mt-1 block line-clamp-2 text-sm leading-6 text-stone-600">
                  {item.decision}
                </span>
                <span className="mt-2 block text-xs text-stone-500">
                  {item.mode} · {dateFormatter.format(new Date(item.createdAt))}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="rounded border border-stone-300 px-3 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
              >
                Delete
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
