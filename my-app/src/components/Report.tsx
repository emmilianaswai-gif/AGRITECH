import { useEffect, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

  const chartGrid = dark ? "#1d2a23" : "#e5e7eb";
  const chartAxis = dark ? "#9ca3af" : "#6b7280";
  const chartTooltip = {
    backgroundColor: dark ? "#12201a" : "#ffffff",
    border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
    borderRadius: 12,
    color: dark ? "#f3f4f6" : "#111827",
    fontSize: 12,
  };

  const dayKey = (iso?: string | null): string => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const trendData = (() => {
    const buckets: { key: string; label: string; sales: number; profit: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      buckets.push({
        key: dayKey(d.toISOString()),
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        sales: 0,
        profit: 0,
      });
    }
    const byKey = new Map(buckets.map((b) => [b.key, b]));
    sales.forEach((o) => {
      const b = byKey.get(dayKey(o.createdAt));
      if (b) {
        b.sales += o.total ?? 0;
        b.profit += o.profit ?? 0;
      }
    });
    return buckets;
  })();

  const periodData = [
    { label: "Today", sales: stats?.todaySales ?? 0, profit: stats?.todayProfit ?? 0 },
    { label: "Month", sales: stats?.monthSales ?? 0, profit: stats?.monthProfit ?? 0 },
    { label: "6 mo", sales: stats?.sixMonthSales ?? 0, profit: stats?.sixMonthProfit ?? 0 },
    { label: "Year", sales: stats?.yearSales ?? 0, profit: stats?.yearProfit ?? 0 },
    { label: "All", sales: stats?.allTimeSales ?? 0, profit: stats?.allTimeProfit ?? 0 },
  ];

  const statusMeta: Record<string, string> = {
    Paid: "#16a34a",
    Approved: "#2563eb",
    Credit: "#d97706",
    Requested: "#6366f1",
    Pending: "#9ca3af",
    Rejected: "#e11d48",
  };
  const statusData = Object.entries(
    orders.reduce<Record<string, number>>((acc, o) => {
      const k = o.status ?? "Requested";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value, color: statusMeta[name] ?? "#0891b2" }));

  const categoryData = Object.entries(
    inventory.reduce<Record<string, number>>((acc, it) => {
      const k = it.category || "Produce";
      acc[k] = (acc[k] ?? 0) + (it.quantity ?? 0) * (it.sellingPrice ?? 0);
      return acc;
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={`lg:col-span-2 rounded-[28px] border shadow-sm p-5 ${card}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 8-8" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-bold text-sm">Sales trend</h3>
                    <p className={`text-[11px] ${muted}`}>Last 7 days</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold ${muted}`}>
                  {money(sum(sales, (o) => o.total))} total
                </span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0891b2" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0891b2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartAxis }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: chartAxis }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(Number(v))} />
                    <Tooltip contentStyle={chartTooltip} formatter={(v) => money(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="sales" name="Sales" stroke="#16a34a" strokeWidth={2} fill="url(#rSales)" />
                    <Area type="monotone" dataKey="profit" name="Profit" stroke="#0891b2" strokeWidth={2} fill="url(#rProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`rounded-[28px] border shadow-sm p-5 ${card}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 3a8 8 0 108 8h-8V3z" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-bold text-sm">Orders by status</h3>
                  <p className={`text-[11px] ${muted}`}>{orders.length} orders</p>
                </div>
              </div>
              {statusData.length === 0 ? (
                <p className={`text-sm py-16 text-center ${muted}`}>No orders yet.</p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                        {statusData.map((d) => (
                          <Cell key={d.name} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={chartTooltip} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={`rounded-[28px] border shadow-sm p-5 ${card}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10m6 10V4m6 16v-7" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-bold text-sm">Sales vs profit</h3>
                  <p className={`text-[11px] ${muted}`}>Across time periods</p>
                </div>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={periodData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartAxis }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: chartAxis }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(Number(v))} />
                    <Tooltip contentStyle={chartTooltip} formatter={(v) => money(Number(v))} cursor={{ fill: dark ? "#1d2a23" : "#f3f4f6" }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="sales" name="Sales" fill="#16a34a" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="profit" name="Profit" fill="#0891b2" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`rounded-[28px] border shadow-sm p-5 ${card}`}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </span>
                <div>
                  <h3 className="font-bold text-sm">Stock value by category</h3>
                  <p className={`text-[11px] ${muted}`}>Top categories</p>
                </div>
              </div>
              {categoryData.length === 0 ? (
                <p className={`text-sm py-16 text-center ${muted}`}>No stock recorded yet.</p>
              ) : (
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: chartAxis }} axisLine={false} tickLine={false} tickFormatter={(v) => fmt(Number(v))} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: chartAxis }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartTooltip} formatter={(v) => money(Number(v))} cursor={{ fill: dark ? "#1d2a23" : "#f3f4f6" }} />
                      <Bar dataKey="value" name="Value" fill="#0d9488" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
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