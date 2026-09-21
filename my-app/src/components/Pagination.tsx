import { useEffect, useMemo, useState } from "react";

export function usePagination(totalItems: number, perPage = 8) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    else if (page < 1) setPage(1);
  }, [totalPages, page]);

  return useMemo(() => {
    const start = (page - 1) * perPage;
    return {
      page,
      perPage,
      totalItems,
      totalPages,
      start,
      end: Math.min(start + perPage, totalItems),
      hasPrev: page > 1,
      hasNext: page < totalPages,
      setPage,
    };
  }, [page, perPage, totalItems, totalPages]);
}

type PaginationProps = {
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPage: (p: number) => void;
  start?: number;
  end?: number;
  totalItems?: number;
};

function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  const low = Math.max(2, current - 1);
  const high = Math.min(total - 1, current + 1);
  if (low > 2) pages.push("…");
  for (let p = low; p <= high; p++) pages.push(p);
  if (high < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export default function Pagination({
  page,
  totalPages,
  hasPrev,
  hasNext,
  onPage,
  start,
  end,
  totalItems,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const btn =
    "min-w-9 h-9 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-700">
      {totalItems != null && (
        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          Showing {start != null && end != null ? `${start + 1}–${end}` : ""} of {totalItems}
        </p>
      )}
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={!hasPrev}
          className={`${btn} text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1d2a23]`}
          aria-label="Previous page"
        >
          ‹
        </button>
        {pageNumbers(page, totalPages).map((p, i) =>
          p === "…" ? (
            <span key={`dots-${i}`} className="px-1 text-xs text-gray-400">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              className={`${btn} ${
                p === page
                  ? "bg-green-700 text-white shadow-sm shadow-green-700/30"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1d2a23]"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={!hasNext}
          className={`${btn} text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1d2a23]`}
          aria-label="Next page"
        >
          ›
        </button>
      </div>
    </div>
  );
}