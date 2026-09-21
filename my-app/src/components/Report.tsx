import { useEffect, useState, type ReactNode } from "react";
import { adminApi, type CustomerOrder, type InventoryItem, type TradingStats } from "../api/client";
import { useTheme } from "../context/ThemeContext";
import Pagination, { usePagination } from "./Pagination";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function money(n: number): string {
  return "TZS " + fmt(n);
}

function dateLabel(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US");
}

export default function Report() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"sales" | "debts" | "stock">("sales");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [o, inv, s] = await Promise.all([
        adminApi.orders.getAll(),
        adminApi.inventory.getAll(),
        adminApi.orders.tradingStats(),
      ]);
      setOrders(o);
      setInventory(inv);
      setStats(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saleStatus = (s?: string | null) => s !== "Requested" && s !== "Pending" && s !== "Rejected";
  const sales = orders
    .filter((o) => saleStatus(o.status))
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const debts = orders
    .filter((o) => o.status === "Credit" || o.paymentMethod === "Credit")
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const stockItems = [...inventory].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const salesPager = usePagination(sales.length, 8);
  const debtsPager = usePagination(debts.length, 8);
  const stockPager = usePagination(stockItems.length, 8);

  const card = dark ? "bg-[#12201a] border-gray-700" : "bg-white border-gray-100";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const th = `px-4 py-3 font-semibold ${muted}`;

  const tabs: { id: typeof tab; label: string; count: number }[] = [
    { id: "sales", label: "Sales report", count: sales.length },
    { id: "debts", label: "Outstanding debts", count: debts.length },
    { id: "stock", label: "Stock report", count: stockItems.length },
  ];

  const sum = (list: CustomerOrder[], f: (o: CustomerOrder) => number | null | undefined): number =>
    list.reduce((acc, o) => acc + (f(o) ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-cyan-800 to-teal-700 rounded-[28px] p-6 text-white shadow-lg shadow-cyan-800/20">
        <p className="text-cyan-200 text-[11px] font-semibold uppercase tracking-widest">Reports</p>
        <h2 className="text-2xl font-extrabold mt-1">Sales, debts and stock at a glance</h2>
        <p className="mt-1 text-cyan-100/90 text-sm max-w-xl">
          See your money, outstanding credit and inventory value in one place.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>
      )}

      {loading ? (
        <p className={`text-sm py-10 text-center ${muted}`}>Loading reports...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className={`rounded-2xl border shadow-sm px-4 py-4 ${card}`}>
              <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
              <p className="font-bold text-lg mt-1">{money(stats?.todaySales ?? 0)}</p>
              <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold">
                {money(stats?.todayProfit ?? 0)} profit
              </p>
            </div>
            <div className={`rounded-2xl border shadow-sm px-4 py-4 ${card}`}>
              <p className="text-xs text-gray-500 dark:text-gray-400">This month</p>
              <p className="font-bold text-lg mt-1">{money(stats?.monthSales ?? 0)}</p>
              <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold">
                {money(stats?.monthProfit ?? 0)} profit
              </p>
            </div>
            <div className={`rounded-2xl border shadow-sm px-4 py-4 ${card}`}>
              <p className="text-xs text-gray-500 dark:text-gray-400">All-time profit</p>
              <p className="font-bold text-lg mt-1">{money(stats?.allTimeProfit ?? 0)}</p>
              <p className="text-[11px] text-green-600 dark:text-green-400 font-semibold">
                {money(stats?.allTimeSales ?? 0)} sales
              </p>
            </div>
            <div className={`rounded-2xl border shadow-sm px-4 py-4 ${card}`}>
              <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding debt</p>
              <p className="font-bold text-lg mt-1 text-amber-600 dark:text-amber-400">
                {money(stats?.outstandingDebt ?? 0)}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {stats?.outstandingDebtCount ?? 0} account{((stats?.outstandingDebtCount ?? 0) === 1) ? "" : "s"}
              </p>
            </div>
          </div>

          <div className={`rounded-[28px] border shadow-sm overflow-hidden ${card}`}>
            <div className="flex flex-wrap items-center gap-2 px-4 py-4 border-b border-gray-100 dark:border-gray-700">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                    tab === t.id
                      ? "bg-cyan-800 text-white shadow-md shadow-cyan-800/20"
                      : dark
                        ? "bg-[#0d1813] text-gray-300 hover:bg-[#1d2a23]"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {t.label} · {t.count}
                </button>
              ))}
            </div>

            {tab === "sales" && (
              <TableShell
                headings={["Item", "Customer", "Qty", "Total", "Profit", "Status"]}
                empty={sales.length === 0}
                emptyText="No sales recorded yet."
              >
                {sales.slice(salesPager.start, salesPager.end).map((o) => (
                  <tr key={o.id ?? o.itemTitle} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 font-semibold">{o.itemTitle}</td>
                    <td className={`px-4 py-3 ${muted}`}>{o.customer}</td>
                    <td className={`px-4 py-3 ${muted}`}>{fmt(o.quantity ?? 0)} {o.unit}</td>
                    <td className="px-4 py-3 font-semibold">{money(o.total ?? 0)}</td>
                    <td className={`px-4 py-3 font-semibold ${(o.profit ?? 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600"}`}>
                      {money(o.profit ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold uppercase bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200 rounded-full px-2.5 py-1">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </TableShell>
            )}

            {tab === "debts" && (
              <TableShell
                headings={["Item", "Customer", "Qty", "Total", "Location", "Status"]}
                empty={debts.length === 0}
                emptyText="No outstanding debts. Everyone has paid up."
              >
                {debts.slice(debtsPager.start, debtsPager.end).map((o) => (
                  <tr key={o.id ?? o.itemTitle} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 font-semibold">{o.itemTitle}</td>
                    <td className={`px-4 py-3 ${muted}`}>{o.customer}</td>
                    <td className={`px-4 py-3 ${muted}`}>{fmt(o.quantity ?? 0)} {o.unit}</td>
                    <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">{money(o.total ?? 0)}</td>
                    <td className={`px-4 py-3 ${muted}`}>{o.customerLocation || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 rounded-full px-2.5 py-1">
                        Debt
                      </span>
                    </td>
                  </tr>
                ))}
              </TableShell>
            )}

            {tab === "stock" && (
              <TableShell
                headings={["Item", "Category", "Qty", "Cost", "Sell", "Value"]}
                empty={stockItems.length === 0}
                emptyText="No stock recorded yet."
              >
                {stockItems.slice(stockPager.start, stockPager.end).map((item) => (
                  <tr key={item.id ?? item.title} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 font-semibold">{item.title}</td>
                    <td className={`px-4 py-3 ${muted}`}>{item.category || "Produce"}</td>
                    <td className={`px-4 py-3 ${muted}`}>{fmt(item.quantity ?? 0)} {item.unit}</td>
                    <td className={`px-4 py-3 ${muted}`}>{money(item.costPrice ?? 0)}</td>
                    <td className={`px-4 py-3 ${muted}`}>{money(item.sellingPrice ?? 0)}</td>
                    <td className="px-4 py-3 font-semibold">{money((item.quantity ?? 0) * (item.sellingPrice ?? 0))}</td>
                  </tr>
                ))}
              </TableShell>
            )}

            {tab === "sales" && (
              <Pagination
                page={salesPager.page}
                totalPages={salesPager.totalPages}
                hasPrev={salesPager.hasPrev}
                hasNext={salesPager.hasNext}
                onPage={salesPager.setPage}
                start={salesPager.start}
                end={salesPager.end}
                totalItems={sales.length}
              />
            )}
            {tab === "debts" && (
              <Pagination
                page={debtsPager.page}
                totalPages={debtsPager.totalPages}
                hasPrev={debtsPager.hasPrev}
                hasNext={debtsPager.hasNext}
                onPage={debtsPager.setPage}
                start={debtsPager.start}
                end={debtsPager.end}
                totalItems={debts.length}
              />
            )}
            {tab === "stock" && (
              <Pagination
                page={stockPager.page}
                totalPages={stockPager.totalPages}
                hasPrev={stockPager.hasPrev}
                hasNext={stockPager.hasNext}
                onPage={stockPager.setPage}
                start={stockPager.start}
                end={stockPager.end}
                totalItems={stockItems.length}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TableShell({
  headings,
  children,
  empty,
  emptyText,
}: {
  headings: string[];
  children: ReactNode;
  empty?: boolean;
  emptyText?: string;
}) {
  return (
    <div className="overflow-x-auto">
      {empty ? (
        <p className="text-sm text-gray-400 py-10 text-center">{emptyText}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              {headings.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      )}
    </div>
  );
}