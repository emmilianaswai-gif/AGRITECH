import { useEffect, useState } from "react";
import { adminApi, storeApi, storeIdFromSeller, type CustomerOrder, type InventoryTotals, type Store } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import ConfirmDialog from "./ConfirmDialog";

function money(n: number | null | undefined): string {
  return "TZS " + (n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function statusBadge(status: string | null | undefined): { label: string; cls: string } {
  switch (status ?? "Paid") {
    case "Requested":
      return { label: "Requested", cls: "text-slate-600 bg-slate-100" };
    case "Pending":
      return { label: "Pending", cls: "text-gray-600 bg-gray-100" };
    case "Approved":
      return { label: "Approved", cls: "text-blue-700 bg-blue-100" };
    case "Rejected":
      return { label: "Rejected", cls: "text-rose-700 bg-rose-100" };
    case "Credit":
      return { label: "Credit", cls: "text-amber-700 bg-amber-100" };
    case "Paid":
      return { label: "Paid", cls: "text-green-700 bg-green-100" };
    default:
      return { label: "Paid", cls: "text-green-700 bg-green-100" };
  }
}

export default function Orders() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [summary, setSummary] = useState<InventoryTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [checkedOrderIds, setCheckedOrderIds] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [statusBusyId, setStatusBusyId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<CustomerOrder | null>(null);
  const [rejecting, setRejecting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [o, s, allStores] = await Promise.all([
        adminApi.orders.getAll(),
        adminApi.orders.summary(),
        storeApi.getAll().catch(() => []),
      ]);
      setOrders(o);
      setStores(allStores);
      setSummary(s);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: number) => {
    try {
      await adminApi.orders.delete(id);
      setConfirmId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete order");
    }
  };

  const sortedIds = [...orders].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")).map((o) => o.id).filter((id): id is number => id != null);
  const allChecked = sortedIds.length > 0 && sortedIds.every((id) => checkedOrderIds.includes(id));

  const toggleChecked = (id: number | null | undefined) => {
    if (id == null) return;
    setCheckedOrderIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleAll = () => setCheckedOrderIds(allChecked ? [] : sortedIds);

  const removeSelected = async () => {
    setBulkDeleting(true);
    try {
      await Promise.allSettled(checkedOrderIds.map((id) => adminApi.orders.delete(id)));
      setCheckedOrderIds([]);
      setBulkOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete the selected orders");
      setBulkOpen(false);
    } finally {
      setBulkDeleting(false);
    }
  };

  const updateStatus = async (id: number | null | undefined, next: string) => {
    if (id == null) return;
    setStatusBusyId(id);
    try {
      await adminApi.orders.updateStatus(id, next);
      setRejectTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setStatusBusyId(null);
      setRejecting(false);
    }
  };

  const canApprove = (o: CustomerOrder) => o.status === "Requested" || o.status === "Pending";
  const canReject = (o: CustomerOrder) =>
    o.status === "Requested" ||
    o.status === "Pending" ||
    o.status === "Approved" ||
    o.status === "Paid" ||
    !o.status;
  const canPending = (o: CustomerOrder) => o.status === "Requested" || o.status === "Rejected";

  const root = dark ? "bg-[#0b1410] text-gray-100" : "";
  const card = dark ? "bg-[#12201a] border-gray-700" : "bg-white border-gray-100";
  const muted = dark ? "text-gray-400" : "text-gray-500";

  const sorted = [...orders].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  const storeOfOrder = (o: CustomerOrder): Store | null => {
    const id = storeIdFromSeller(o.sellerUserId);
    if (id == null) return null;
    return stores.find((s) => s.id === id) ?? null;
  };

  return (
    <div className={`space-y-6 ${root}`}>
      <div className="bg-gradient-to-br from-green-800 to-green-700 rounded-[28px] p-6 text-white shadow-lg shadow-green-800/20">
        <h2 className="text-2xl font-extrabold">{t("orders")}</h2>
        <p className="mt-1 text-green-100 text-sm">Every customer order, its value, and the profit made.</p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>
      )}

      {/* Summary chips */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className={`rounded-2xl px-4 py-4 border shadow-sm ${card}`}>
          <p className={`text-xs font-medium ${muted}`}>Orders</p>
          <p className="font-bold text-xl mt-1">{summary?.orderCount ?? 0}</p>
        </div>
        <div className={`rounded-2xl px-4 py-4 border shadow-sm ${card}`}>
          <p className={`text-xs font-medium ${muted}`}>Total sales</p>
          <p className="font-bold text-xl mt-1 text-green-700 dark:text-green-400">{money(summary?.totalSales ?? 0)}</p>
        </div>
        <div className={`rounded-2xl px-4 py-4 border shadow-sm ${card}`}>
          <p className={`text-xs font-medium ${muted}`}>Total profit</p>
          <p className="font-bold text-xl mt-1 text-emerald-700 dark:text-emerald-400">{money(summary?.totalProfit ?? 0)}</p>
        </div>
        <div className={`rounded-2xl px-4 py-4 border shadow-sm ${card}`}>
          <p className={`text-xs font-medium ${muted}`}>Stock items</p>
          <p className="font-bold text-xl mt-1">{summary?.inventoryCount ?? 0}</p>
        </div>
      </div>

      <div className={`rounded-[28px] border shadow-sm overflow-hidden ${card}`}>
        {(selectMode || sorted.length > 0) && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            {selectMode ? (
              <>
                <p className={`text-sm ${muted}`}>
                  <b>{checkedOrderIds.length}</b> selected
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectMode(false);
                      setCheckedOrderIds([]);
                    }}
                    className={`text-xs font-semibold rounded-xl px-3 py-2 border ${dark ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setBulkOpen(true)}
                    disabled={checkedOrderIds.length === 0}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-red-600 rounded-xl px-3 py-2 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Delete selected ({checkedOrderIds.length})
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between w-full">
                <p className={`text-xs ${muted}`}>Select one or more orders to delete them together.</p>
                <button
                  onClick={() => setSelectMode(true)}
                  className="text-xs font-semibold text-green-700 dark:text-green-400 border border-green-700 dark:border-green-500 rounded-xl px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                >
                  Select orders
                </button>
              </div>
            )}
          </div>
        )}
        {loading ? (
          <p className={`text-sm py-10 text-center ${muted}`}>{t("loading")}</p>
        ) : sorted.length === 0 ? (
          <p className={`text-sm py-10 text-center ${muted}`}>{t("no_accounts")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left border-b ${dark ? "border-gray-700" : "border-gray-100"}`}>
                  {selectMode && (
                    <th className={`px-4 py-3 ${muted}`}>
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={toggleAll}
                        className={`w-4 h-4 ${dark ? "accent-green-500" : "accent-green-700"}`}
                        aria-label="Select all orders"
                      />
                    </th>
                  )}
                  <th className={`px-4 py-3 font-semibold ${muted}`}>Item</th>
                  <th className={`px-4 py-3 font-semibold ${muted}`}>Customer</th>
                  <th className={`px-4 py-3 font-semibold ${muted}`}>Store</th>
                  <th className={`px-4 py-3 font-semibold ${muted}`}>Qty</th>
                  <th className={`px-4 py-3 font-semibold ${muted}`}>Total</th>
                  <th className={`px-4 py-3 font-semibold ${muted}`}>Profit</th>
                  <th className={`px-4 py-3 font-semibold ${muted}`}>Status</th>
                  <th className={`px-4 py-3 font-semibold ${muted}`}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {sorted.map((o) => {
                  const badge = statusBadge(o.status);
                  const orderStore = storeOfOrder(o);
                  return (
                    <tr key={o.id ?? o.itemTitle}>
                      {selectMode && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={o.id != null && checkedOrderIds.includes(o.id)}
                            onChange={() => toggleChecked(o.id)}
                            className={`w-4 h-4 ${dark ? "accent-green-500" : "accent-green-700"}`}
                            aria-label={`Select order for ${o.customer}`}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 font-semibold">{o.itemTitle}</td>
                      <td className={`px-4 py-3 ${muted}`}>{o.customer}</td>
                      <td className="px-4 py-3">
                        {orderStore ? (
                          <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 rounded-full px-3 py-1">
                            {orderStore.name}
                          </span>
                        ) : (
                          <span className={`text-xs ${muted}`}>—</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 ${muted}`}>
                        {o.quantity ?? 0} {o.unit}
                      </td>
                      <td className="px-4 py-3 font-semibold">{money(o.total ?? 0)}</td>
                      <td className={`px-4 py-3 font-semibold ${dark ? "text-emerald-400" : "text-emerald-700"}`}>
                        {money(o.profit ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className={`text-xs font-semibold rounded-full px-3 py-1 ${badge.cls}`}>
                            {badge.label}
                          </span>
                          {o.status !== "Credit" && (
                            <span className="inline-flex items-center gap-1.5">
                              {canApprove(o) && (
                                <button
                                  onClick={() => updateStatus(o.id, "Approved")}
                                  disabled={statusBusyId === o.id}
                                  className="text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md px-2 py-1 transition-colors disabled:opacity-50"
                                >
                                  Approve
                                </button>
                              )}
                              {canPending(o) && (
                                <button
                                  onClick={() => updateStatus(o.id, "Pending")}
                                  disabled={statusBusyId === o.id}
                                  className={`text-[11px] font-semibold rounded-md px-2 py-1 border transition-colors disabled:opacity-50 ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-600 hover:bg-gray-100"}`}
                                >
                                  Pending
                                </button>
                              )}
                              {canReject(o) && (
                                <button
                                  onClick={() => setRejectTarget(o)}
                                  disabled={statusBusyId === o.id}
                                  className="text-[11px] font-semibold rounded-md px-2 py-1 bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {confirmId === o.id ? (
                          <span className="inline-flex items-center gap-2">
                            <button
                              onClick={() => remove(o.id!)}
                              className="text-xs font-semibold text-white bg-red-600 rounded-lg px-3 py-1.5"
                            >
                              Confirm delete
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className={`text-xs font-semibold rounded-lg px-3 py-1.5 border ${dark ? "border-gray-600 text-gray-300" : "border-gray-200 text-gray-600"}`}
                            >
                              {t("cancel")}
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmId(o.id ?? null)}
                            className="text-xs font-semibold text-red-500 hover:text-red-700"
                          >
                            {t("delete")}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={bulkOpen}
        title="Delete selected orders?"
        message={
          <>
            Are you sure you want to delete <b>{checkedOrderIds.length}</b> order
            {checkedOrderIds.length === 1 ? "" : "s"}? Sold quantities will be restored to stock.
          </>
        }
        busy={bulkDeleting}
        onCancel={() => !bulkDeleting && setBulkOpen(false)}
        onConfirm={removeSelected}
      />

      <ConfirmDialog
        open={rejectTarget !== null}
        title="Reject this order?"
        message={
          <>
            Are you sure you want to reject
            {rejectTarget ? ` ${rejectTarget.itemTitle} for ${rejectTarget.customer}` : ""}?
            {rejectTarget &&
            (rejectTarget.status === "Approved" || rejectTarget.status === "Paid")
              ? " The stock is restored and the money is refunded back to your wallet."
              : " The order stays in your list as rejected."}
          </>
        }
        busy={rejecting}
        onCancel={() => !rejecting && setRejectTarget(null)}
        onConfirm={() => {
          if (rejectTarget) {
            setRejecting(true);
            updateStatus(rejectTarget.id, "Rejected");
          }
        }}
      />
    </div>
  );
}