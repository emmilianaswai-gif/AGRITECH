import { useEffect, useState } from "react";
import {
  learningApi,
  storeApi,
  adminApi,
  type Store,
  type LearningResource,
  type CustomerOrder,
  type InventoryTotals,
} from "../api/client";
import { services } from "../data/services";
import { useServices } from "../context/ServicesContext";
import { useUser } from "../context/UserContext";
import { roleLabel, accessRate } from "../data/access";
import { useAccess } from "../context/AccessContext";
import { useLanguage } from "../context/LanguageContext";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function money(n: number): string {
  return "TZS " + fmt(n);
}

function uniqueByTitle(list: CustomerOrder[]): CustomerOrder[] {
  const seen = new Set<string>();
  const out: CustomerOrder[] = [];
  const salesStatus = (s?: string | null) =>
    s !== "Requested" && s !== "Pending" && s !== "Rejected";

  for (const o of list) {
    if (!salesStatus(o.status) || seen.has(o.itemTitle)) continue;
    seen.add(o.itemTitle);
    out.push(o);
  }
  return out;
}

type Stat = {
  label: string;
  sub: string;
  value: string;
  color: string;
  id: string | null;
};

export default function Dashboard() {
  const { open } = useServices();
  const { user } = useUser();
  const { t } = useLanguage();
  const { canAccess } = useAccess();

  const [stores, setStores] = useState<Store[]>([]);
  const [learning, setLearning] = useState<LearningResource[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [summary, setSummary] = useState<InventoryTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isCustomer = (user?.role ?? "") === "CUSTOMER";

  const load = async () => {
    setLoading(true);
    try {
      const [st, l, o, sum] = await Promise.all([
        storeApi.getAll(),
        learningApi.getAll(),
        adminApi.orders.getAll(),
        adminApi.orders.summary(),
      ]);
      setStores(st);
      setLearning(l);
      setOrders(o);
      setSummary(sum);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const myOrders = orders
    .filter((o) => o.customerUserId === user?.id)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const myPurchases = uniqueByTitle(myOrders);

  const myCourses = learning.filter((r) => r.type === "COURSE");
  const coursesDone = myCourses.filter((r) => (r.progress ?? 0) >= 100);
  const myVideos = learning.filter((r) => r.type === "VIDEO");
  const videosDone = myVideos.filter((r) => (r.progress ?? 0) >= 100);
  const recommended = learning
    .filter((r) => (r.type === "COURSE" || r.type === "VIDEO") && (r.progress ?? 0) < 100)
    .slice(0, 6);

  const stats: Stat[] = isCustomer
    ? [
        {
          label: "Orders made",
          sub: `${myOrders.length} total`,
          value: String(myOrders.length),
          color: "bg-violet-50 text-violet-800",
          id: "buy",
        },
        {
          label: "Purchased products",
          sub: `${myPurchases.length} item${myPurchases.length === 1 ? "" : "s"} bought`,
          value: String(myPurchases.length),
          color: "bg-green-50 text-green-800",
          id: "buy",
        },
        {
          label: "Courses done",
          sub: `${coursesDone.length} of ${myCourses.length}`,
          value: String(coursesDone.length),
          color: "bg-blue-50 text-blue-800",
          id: "learning",
        },
        {
          label: "Videos watched",
          sub: `${videosDone.length} of ${myVideos.length}`,
          value: String(videosDone.length),
          color: "bg-amber-50 text-amber-800",
          id: "learning",
        },
      ]
    : [
        {
          label: "Agro stores",
          sub: "in the directory",
          value: String(stores.length),
          color: "bg-teal-50 text-teal-800",
          id: "stores",
        },
        {
          label: "Learning items",
          sub: "courses, videos & more",
          value: String(learning.length),
          color: "bg-blue-50 text-blue-800",
          id: "learning",
        },
        {
          label: "Stock items",
          sub: "in your inventory",
          value: String(summary?.inventoryCount ?? 0),
          color: "bg-green-50 text-green-800",
          id: "stock",
        },
        {
          label: "Inventory value",
          sub: "at sell price",
          value: money(summary?.inventoryValue ?? 0),
          color: "bg-lime-50 text-lime-800",
          id: "stock",
        },
        {
          label: "Customer orders",
          sub: `${summary?.orderCount ?? 0} sale${(summary?.orderCount ?? 0) === 1 ? "" : "s"}`,
          value: money(summary?.totalSales ?? 0),
          color: "bg-violet-50 text-violet-800",
          id: "customer",
        },
        {
          label: "Total profit",
          sub: "across all sales",
          value: money(summary?.totalProfit ?? 0),
          color: "bg-rose-50 text-rose-800",
          id: "customer",
        },
      ];

  const recentOrders = [...orders]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, 5);

  const orderBadge = (status?: string | null): { label: string; cls: string } => {
    const s = status ?? "Requested";
    if (s === "Paid") return { label: "Paid", cls: "bg-green-100 text-green-700" };
    if (s === "Approved") return { label: "Approved", cls: "bg-blue-100 text-blue-700" };
    if (s === "Rejected") return { label: "Rejected", cls: "bg-rose-100 text-rose-700" };
    if (s === "Credit") return { label: "Credit", cls: "bg-amber-100 text-amber-700" };
    if (s === "Pending") return { label: "Pending", cls: "bg-gray-100 text-gray-600" };
    return { label: "Requested", cls: "bg-blue-100 text-blue-700" };
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-green-800 to-green-700 rounded-[28px] p-6 sm:p-8 text-white shadow-lg shadow-green-800/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-green-200 text-xs font-semibold uppercase tracking-wider">{today}</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
              {user ? `${t("welcome")}, ${user.fullName.split(" ")[0]}` : t("welcome")}
            </h2>
            <p className="mt-2 text-green-100 text-sm sm:text-base max-w-xl">
              {user
                ? `${accessRate(user.role)} · ${roleLabel(user.role)}`
                : "Your farm, your market — no middlemen."}
            </p>
          </div>
          <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center ring-4 ring-white/20">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>
      )}

      {/* Overview stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.filter((s) => canAccess(user?.role, s.id)).map((stat) => (
          <button
            key={stat.label}
            onClick={() => open(stat.id)}
            className={`text-left rounded-2xl px-4 py-4 ${stat.color} transition-transform hover:scale-[1.03] active:scale-95`}
          >
            <p className="text-xs font-medium opacity-70">{stat.label}</p>
            <p className="font-bold text-lg sm:text-xl mt-1 truncate">{stat.value}</p>
            <p className="text-[11px] opacity-70 mt-0.5 truncate">{stat.sub}</p>
          </button>
        ))}
      </div>

      {/* Quick access */}
      <div className="bg-white dark:bg-[#12201a] rounded-[28px] border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <h3 className="font-bold text-green-950 dark:text-green-100 mb-4">{t("quick_access")}</h3>
        <div className="flex flex-wrap gap-4">
          {services.filter((s) => canAccess(user?.role, s.id)).map((service) => (
            <button
              key={service.id}
              onClick={() => open(service.id)}
              className="group flex flex-col items-center gap-2 min-w-[64px]"
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${service.color} shadow-sm group-hover:scale-105 group-active:scale-95`}
              >
                {service.icon}
              </div>
              <span className="text-[11px] font-semibold text-gray-600 text-center leading-tight">
                {service.shortLabel}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      {isCustomer ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#12201a] rounded-[28px] border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-green-950 dark:text-green-100">My orders</h3>
              <button onClick={() => open("buy")} className="text-xs font-semibold text-green-700 dark:text-green-400 hover:text-green-900">
                {t("view_all")}
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{t("loading")}</p>
            ) : myOrders.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">You have not placed any orders yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {myOrders.slice(0, 5).map((order) => {
                  const badge = orderBadge(order.status);
                  return (
                    <li key={order.id ?? order.itemTitle} className="flex items-center justify-between py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{order.itemTitle}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {fmt(order.quantity ?? 0)} {order.unit}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm dark:text-gray-100">{money(order.total ?? 0)}</p>
                        <p className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${badge.cls}`}>{badge.label}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="bg-white dark:bg-[#12201a] rounded-[28px] border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-green-950 dark:text-green-100">Purchased products</h3>
              <span className="text-xs font-semibold text-gray-400">{myPurchases.length}</span>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{t("loading")}</p>
            ) : myPurchases.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">No purchases yet — browse stock to get started.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {myPurchases.map((o) => (
                  <li key={o.id ?? o.itemTitle} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{o.itemTitle}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Bought {fmt(o.quantity ?? 0)} {o.unit}
                      </p>
                    </div>
                    <p className="font-semibold text-sm dark:text-gray-100 flex-shrink-0 ml-2">{money(o.total ?? 0)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white dark:bg-[#12201a] rounded-[28px] border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-green-950 dark:text-green-100">Courses completed</h3>
              <button onClick={() => open("learning")} className="text-xs font-semibold text-green-700 dark:text-green-400 hover:text-green-900">
                {t("view_all")}
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{t("loading")}</p>
            ) : coursesDone.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">No completed courses yet — keep learning.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {coursesDone.map((c) => (
                  <li key={c.id ?? c.title} className="flex items-center justify-between py-3">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{c.title}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0 ml-2">Done</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white dark:bg-[#12201a] rounded-[28px] border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-green-950 dark:text-green-100">Videos watched</h3>
              <button onClick={() => open("learning")} className="text-xs font-semibold text-green-700 dark:text-green-400 hover:text-green-900">
                {t("view_all")}
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{t("loading")}</p>
            ) : videosDone.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">No videos watched yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {videosDone.map((v) => (
                  <li key={v.id ?? v.title} className="flex items-center justify-between py-3">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{v.title}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0 ml-2">Watched</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white dark:bg-[#12201a] rounded-[28px] border border-gray-100 dark:border-gray-700 shadow-sm p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-green-950 dark:text-green-100">Recommended for you</h3>
              <span className="text-xs font-semibold text-gray-400">not started yet</span>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{t("loading")}</p>
            ) : recommended.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">Check back soon for new courses and videos.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommended.map((r) => (
                  <button
                    key={r.id ?? r.title}
                    onClick={() => open("learning")}
                    className="text-left rounded-2xl border border-gray-100 dark:border-gray-700 p-3 hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${r.type === "COURSE" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                        {r.type === "COURSE" ? "Course" : "Video"}
                      </span>
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 truncate">{r.title}</p>
                    </div>
                    {r.category && <p className="text-xs text-gray-400 mt-1 truncate">{r.category}</p>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white dark:bg-[#12201a] rounded-[28px] border border-gray-100 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-green-950 dark:text-green-100">{t("recent_orders")}</h3>
              <button onClick={() => open("customer")} className="text-xs font-semibold text-green-700 dark:text-green-400 hover:text-green-900">
                {t("view_all")}
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">{t("loading")}</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
                {t("no_accounts")}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {recentOrders.map((order) => (
                  <li key={order.id ?? order.itemTitle} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{order.itemTitle}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {order.customer} · {fmt(order.quantity ?? 0)} {order.unit}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-sm dark:text-gray-100">{money(order.total ?? 0)}</p>
                      <p className={`text-xs font-semibold ${order.profit && order.profit >= 0 ? "text-green-700 dark:text-green-400" : "text-red-600"}`}>
                        {money(order.profit ?? 0)} profit
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}