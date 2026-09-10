import { useEffect, useState } from "react";
import { adminApi, type CustomerOrder, type TradingStats } from "../api/client";
import ConfirmDialog from "./ConfirmDialog";

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function money(n: number): string {
  return "TZS " + fmt(n);
}

function mapLink(o: CustomerOrder): string | null {
  if (o.latitude != null && o.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}`;
  }
  if (o.customerLocation) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(o.customerLocation)}`;
  }
  return null;
}

export default function CustomerDebts() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [collectOrderId, setCollectOrderId] = useState<number | null>(null);
  const [collectMethod, setCollectMethod] = useState("Cash");
  const [collecting, setCollecting] = useState(false);
  const [checkedOrderIds, setCheckedOrderIds] = useState<number[]>([]);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<"orders" | null>(null);
  const [selectMode, setSelectMode] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [ord, st] = await Promise.all([adminApi.orders.getAll(), adminApi.orders.tradingStats()]);
      setOrders(ord);
      setStats(st);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load debts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return;
    setDeleting(true);
    try {
      await adminApi.orders.delete(deleteOrderId);
      setDeleteOrderId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete debt");
      setDeleteOrderId(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteTarget) return;
    setDeleting(true);
    try {
      await Promise.allSettled(checkedOrderIds.map((id) => adminApi.orders.delete(id)));
      setCheckedOrderIds([]);
      setBulkDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete the selected records");
      setBulkDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleCollect = async () => {
    if (collectOrderId == null) return;
    setCollecting(true);
    try {
      await adminApi.orders.collect(collectOrderId, collectMethod);
      setCollectOrderId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to collect debt");
      setCollectOrderId(null);
    } finally {
      setCollecting(false);
    }
  };

  const creditOrders = orders.filter((o) => (o.paymentMethod ?? o.status) === "Credit");
  const allOrderIds = orders.map((o) => o.id).filter((id): id is number => id != null);
  const allOrdersChecked = allOrderIds.length > 0 && allOrderIds.every((id) => checkedOrderIds.includes(id));

  const toggleOrderChecked = (id: number | null | undefined) => {
    if (id == null) return;
    setCheckedOrderIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleAllOrders = () => {
    if (allOrdersChecked) {
      setCheckedOrderIds((prev) => prev.filter((id) => !allOrderIds.includes(id)));
    } else {
      setCheckedOrderIds((prev) => Array.from(new Set([...prev, ...allOrderIds])));
    }
  };
  const exitSelectMode = () => {
    setSelectMode(false);
    setCheckedOrderIds([]);
  };

  const collectOrder = orders.find((o) => o.id === collectOrderId) ?? null;
  const collectLocation = collectOrder ? mapLink(collectOrder) : null;

  const collectCards = [
    { label: "Cash collected", value: money(stats?.cashCollected ?? 0), color: "bg-green-50 text-green-800" },
    { label: "Check collected", value: money(stats?.checkCollected ?? 0), color: "bg-blue-50 text-blue-800" },
    { label: `Outstanding debt (${stats?.outstandingDebtCount ?? 0})`, value: money(stats?.outstandingDebt ?? 0), color: "bg-amber-50 text-amber-800" },
    { label: "Pending", value: money(stats?.pendingTotal ?? 0), color: "bg-gray-50 text-gray-700" },
  ];

  return (
    <div>
      <p className="text-xs text-gray-600 mb-3">
        Credit sales awaiting payment, with the customer's phone and GPS location for follow-up.
      </p>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {collectCards.map((s) => (
          <div key={s.label} className={`rounded-2xl px-3 py-2 ${s.color}`}>
            <p className="text-[10px] font-medium opacity-70">{s.label}</p>
            <p className="font-bold text-sm mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h4 className="font-bold text-green-950">Customer debts (credit sales)</h4>
            <div className="flex flex-wrap items-center gap-2">
              {selectMode ? (
                <>
                  {checkedOrderIds.length > 0 && (
                    <button
                      onClick={() => setBulkDeleteTarget("orders")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Delete selected ({checkedOrderIds.length})
                    </button>
                  )}
                  <button
                    onClick={exitSelectMode}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectMode(true)}
                  disabled={creditOrders.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-green-800 text-green-800 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Select debts
                </button>
              )}
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-full px-3 py-1.5">
                Total debt {money(stats?.outstandingDebt ?? 0)} · {creditOrders.length} customer{creditOrders.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {creditOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No outstanding debts. Sales made on credit appear here with the customer's phone and GPS location.
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="text-left border-b border-gray-100 text-xs text-gray-500">
                    {selectMode && (
                      <th className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={allOrdersChecked}
                          onChange={toggleAllOrders}
                          className="accent-green-700 w-4 h-4"
                          aria-label="Select all debts"
                        />
                      </th>
                    )}
                    <th className="px-4 py-2.5 font-semibold">Customer</th>
                    <th className="px-4 py-2.5 font-semibold">Phone</th>
                    <th className="px-4 py-2.5 font-semibold">Location</th>
                    <th className="px-4 py-2.5 font-semibold">Item</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Debt</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Profit</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {creditOrders.map((o) => {
                    const link = mapLink(o);
                    return (
                      <tr key={o.id ?? o.itemTitle} className="align-middle">
                        {selectMode && (
                          <td className="px-4 py-2.5">
                            <input
                              type="checkbox"
                              checked={o.id != null && checkedOrderIds.includes(o.id)}
                              onChange={() => toggleOrderChecked(o.id)}
                              className="accent-green-700 w-4 h-4"
                              aria-label={`Select debt for ${o.customer}`}
                            />
                          </td>
                        )}
                        <td className="px-4 py-2.5 font-semibold">{o.customer}</td>
                        <td className="px-4 py-2.5">
                          {o.customerPhone ? (
                            <a href={`tel:${o.customerPhone}`} className="text-blue-600 hover:underline">
                              {o.customerPhone}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {link ? (
                            <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                              </svg>
                              {o.customerLocation ?? `${o.latitude?.toFixed(4) ?? ""}, ${o.longitude?.toFixed(4) ?? ""}`}
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">{o.itemTitle}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-amber-700">{money(o.total ?? 0)}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${o.profit && o.profit >= 0 ? "text-green-700" : "text-red-600"}`}>{money(o.profit ?? 0)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => o.id && setCollectOrderId(o.id)}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-800 text-white hover:bg-green-900 transition-colors"
                            >
                              Collect
                            </button>
                            <button
                              onClick={() => o.id && setDeleteOrderId(o.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                              title="Delete debt"
                              aria-label="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Collect debt modal */}
      {collectOrderId != null && collectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !collecting && setCollectOrderId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-green-950">Collect debt</h3>
              <button onClick={() => !collecting && setCollectOrderId(null)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-4 mb-4">
              <p className="font-semibold text-gray-800">{collectOrder.customer}</p>
              {collectOrder.customerPhone && <p className="text-xs text-gray-500">{collectOrder.customerPhone}</p>}
              {collectLocation && (
                <a href={collectLocation} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                  View location on Google Maps
                </a>
              )}
              <p className="mt-2 font-bold text-amber-700 text-lg">{money(collectOrder.total ?? 0)}</p>
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-1.5">How was it paid?</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["Cash", "Check"].map((m) => (
                <label
                  key={m}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${
                    collectMethod === m ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="collectMethod"
                    checked={collectMethod === m}
                    onChange={() => setCollectMethod(m)}
                    className="accent-green-600"
                  />
                  {m}
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => !collecting && setCollectOrderId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCollect}
                disabled={collecting}
                className="flex-1 px-4 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {collecting ? "Saving..." : "Mark Paid"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOrderId != null}
        title="Delete customer debt?"
        message={
          <>
            Delete the debt of <b>{orders.find((o) => o.id === deleteOrderId)?.customer ?? "this customer"}</b>?
            The sold quantity will be restored to stock.
          </>
        }
        busy={deleting}
        onCancel={() => !deleting && setDeleteOrderId(null)}
        onConfirm={handleDeleteOrder}
      />

      <ConfirmDialog
        open={bulkDeleteTarget != null}
        title="Delete selected debts?"
        message={
          <>
            Are you sure you want to delete <b>{checkedOrderIds.length}</b> debt
            {checkedOrderIds.length === 1 ? "" : "s"}? Sold quantities will be restored to stock.
          </>
        }
        busy={deleting}
        onCancel={() => !deleting && setBulkDeleteTarget(null)}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}