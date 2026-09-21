import { useEffect, useState, type FormEvent } from "react";
import { adminApi, type InventoryItem, type CustomerOrder, type InventoryTotals, type TradingStats } from "../api/client";
import ConfirmDialog from "./ConfirmDialog";

const emptyOrderForm = {
  inventoryItemId: "",
  customer: "",
  quantity: "",
  status: "Paid",
  paymentMethod: "Cash",
  phone: "",
  location: "",
  latitude: null as number | null,
  longitude: null as number | null,
};

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function money(n: number): string {
  return "TZS " + fmt(n);
}

function paymentBadge(method: string | null | undefined): { label: string; cls: string } {
  const m = method ?? "Cash";
  switch (m) {
    case "Check":
      return { label: "Check", cls: "text-blue-700 bg-blue-100" };
    case "Credit":
      return { label: "Credit", cls: "text-amber-700 bg-amber-100" };
    case "Pending":
      return { label: "Pending", cls: "text-gray-600 bg-gray-100" };
    case "Approved":
      return { label: "Approved", cls: "text-blue-700 bg-blue-100" };
    case "Rejected":
      return { label: "Rejected", cls: "text-rose-700 bg-rose-100" };
    case "Requested":
      return { label: "Requested", cls: "text-slate-600 bg-slate-100" };
    default:
      return { label: "Cash", cls: "text-green-700 bg-green-100" };
  }
}

export default function CustomerSales() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [summary, setSummary] = useState<InventoryTotals | null>(null);
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState(emptyOrderForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [checkedOrderIds, setCheckedOrderIds] = useState<number[]>([]);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<"orders" | null>(null);
  const [selectMode, setSelectMode] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [inv, ord, sum, st] = await Promise.all([
        adminApi.inventory.getAll(),
        adminApi.orders.getAll(),
        adminApi.orders.summary(),
        adminApi.orders.tradingStats(),
      ]);
      setItems(inv);
      setOrders(ord);
      setSummary(sum);
      setStats(st);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleOrderSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!orderForm.customer.trim()) {
      setFormError("Please enter the customer name");
      return;
    }
    const id = Number(orderForm.inventoryItemId);
    const qty = Number(orderForm.quantity) || 0;
    if (!id || qty <= 0) {
      setFormError("Select an item and enter a quantity greater than zero");
      return;
    }
    if (orderForm.paymentMethod === "Credit") {
      if (!orderForm.phone.trim()) {
        setFormError("Phone number is required for credit sales");
        return;
      }
      if (!orderForm.location.trim()) {
        setFormError("Location is required for credit sales — capture the customer's GPS location");
        return;
      }
    }
    setSaving(true);
    setFormError("");
    try {
      await adminApi.orders.create({
        inventoryItemId: id,
        customer: orderForm.customer.trim(),
        quantity: qty,
        status: orderForm.paymentMethod === "Pending" ? "Pending" : orderForm.paymentMethod === "Credit" ? "Credit" : "Paid",
        paymentMethod: orderForm.paymentMethod,
        phone: orderForm.phone.trim() || undefined,
        location: orderForm.location.trim() || undefined,
        latitude: orderForm.latitude ?? undefined,
        longitude: orderForm.longitude ?? undefined,
      });
      setShowOrderForm(false);
      setOrderForm(emptyOrderForm);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save order.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deleteOrderId) return;
    setDeleting(true);
    try {
      await adminApi.orders.delete(deleteOrderId);
      setDeleteOrderId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete order");
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

  const locateCustomer = () => {
    if (!navigator.geolocation) {
      setFormError("Geolocation is not supported by this browser");
      return;
    }
    setLocating(true);
    setFormError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrderForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location: prev.location.trim()
            ? prev.location
            : `GPS ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
        }));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setFormError("Could not read GPS location: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

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

  const selectedItem = items.find((i) => i.id === Number(orderForm.inventoryItemId));
  const orderQty = Number(orderForm.quantity) || 0;
  const orderUnitPrice = selectedItem?.sellingPrice ?? 0;
  const orderCost = selectedItem?.costPrice ?? 0;
  const orderTotal = orderQty * orderUnitPrice;
  const orderProfit = orderQty * (orderUnitPrice - orderCost);

  const statCards = [
    { label: "Customer orders", value: String(summary?.orderCount ?? 0), color: "bg-blue-50 text-blue-800" },
    { label: "Total sales", value: money(summary?.totalSales ?? 0), color: "bg-violet-50 text-violet-800" },
    { label: "Total profit", value: money(stats?.allTimeProfit ?? summary?.totalProfit ?? 0), color: "bg-amber-50 text-amber-800" },
  ];

  const periodCards = [
    { label: "Today", sales: stats?.todaySales ?? 0, profit: stats?.todayProfit ?? 0, color: "bg-emerald-50 text-emerald-800" },
    { label: "This month", sales: stats?.monthSales ?? 0, profit: stats?.monthProfit ?? 0, color: "bg-teal-50 text-teal-800" },
    { label: "Last 6 months", sales: stats?.sixMonthSales ?? 0, profit: stats?.sixMonthProfit ?? 0, color: "bg-sky-50 text-sky-800" },
    { label: "This year", sales: stats?.yearSales ?? 0, profit: stats?.yearProfit ?? 0, color: "bg-indigo-50 text-indigo-800" },
    { label: "All time", sales: stats?.allTimeSales ?? 0, profit: stats?.allTimeProfit ?? 0, color: "bg-violet-50 text-violet-800" },
  ];

  return (
    <div>
      <p className="text-xs text-gray-600 mb-3">
        Every sale deducts from your stock and records the profit you made.
      </p>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-2xl px-3 py-2 ${s.color}`}>
            <p className="text-[10px] font-medium opacity-70">{s.label}</p>
            <p className="font-bold text-base mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-4">
        <h4 className="font-bold text-green-950 text-sm mb-3">Profit by period</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {periodCards.map((s) => (
            <div key={s.label} className={`rounded-2xl px-3 py-2 ${s.color}`}>
              <p className="text-[10px] font-medium opacity-70">{s.label}</p>
              <p className="font-bold text-sm mt-0.5">Sales {money(s.sales)}</p>
              <p className="font-bold text-sm">Profit {money(s.profit)}</p>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h4 className="font-bold text-green-950">Sales to customers</h4>
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
                  disabled={orders.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-green-800 text-green-800 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Select sales
                </button>
              )}
              <button
                onClick={() => {
                  setOrderForm(emptyOrderForm);
                  setFormError("");
                  setShowOrderForm(true);
                }}
                disabled={items.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors shadow-md shadow-green-800/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Sale
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Add stock items in the Stock page before recording customer sales.
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-3">No customer sales yet.</p>
              <button
                onClick={() => setShowOrderForm(true)}
                className="px-5 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors"
              >
                Record your first sale
              </button>
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
                          aria-label="Select all sales"
                        />
                      </th>
                    )}
                    <th className="px-4 py-2.5 font-semibold">Customer</th>
                    <th className="px-4 py-2.5 font-semibold">Item</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Qty</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Unit price</th>
                    <th className="px-4 py-2.5 font-semibold">Payment</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Total</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Profit</th>
                    <th className="px-4 py-2.5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((o) => {
                    const badge =
                      o.status === "Rejected" || o.status === "Approved"
                        ? paymentBadge(o.status)
                        : paymentBadge(o.paymentMethod ?? o.status);
                    const isCredit = (o.paymentMethod ?? o.status) === "Credit";
                    return (
                      <tr key={o.id ?? o.itemTitle} className="align-middle">
                        {selectMode && (
                          <td className="px-4 py-2.5">
                            <input
                              type="checkbox"
                              checked={o.id != null && checkedOrderIds.includes(o.id)}
                              onChange={() => toggleOrderChecked(o.id)}
                              className="accent-green-700 w-4 h-4"
                              aria-label={`Select sale to ${o.customer}`}
                            />
                          </td>
                        )}
                        <td className="px-4 py-2.5">
                          <p className="font-semibold">{o.customer}</p>
                          {isCredit && o.customerPhone && <p className="text-xs text-gray-400">{o.customerPhone}</p>}
                        </td>
                        <td className="px-4 py-2.5">{o.itemTitle}</td>
                        <td className="px-4 py-2.5 text-right">{fmt(o.quantity ?? 0)} {o.unit}</td>
                        <td className="px-4 py-2.5 text-right">{fmt(o.unitPrice ?? 0)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${badge.cls}`}>{badge.label}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold">{money(o.total ?? 0)}</td>
                        <td className={`px-4 py-2.5 text-right font-semibold ${o.profit && o.profit >= 0 ? "text-green-700" : "text-red-600"}`}>{money(o.profit ?? 0)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => o.id && setDeleteOrderId(o.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                            title="Delete sale (restores stock)"
                            aria-label="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
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

      {/* New sale modal */}
      {showOrderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !saving && setShowOrderForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-green-950">New Customer Sale</h3>
              <button onClick={() => !saving && setShowOrderForm(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{formError}</div>
            )}

            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Product *</label>
                  <select
                    value={orderForm.inventoryItemId}
                    onChange={(e) => setOrderForm({ ...orderForm, inventoryItemId: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">Select stock...</option>
                    {items.map((i) => (
                      <option key={i.id} value={String(i.id)} disabled={(i.quantity ?? 0) <= 0}>
                        {i.title} — {fmt(i.quantity ?? 0)} {i.unit} in stock
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Customer name *</label>
                  <input
                    type="text"
                    value={orderForm.customer}
                    onChange={(e) => setOrderForm({ ...orderForm, customer: e.target.value })}
                    placeholder="e.g. Jane Wanjiku"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min={0}
                    value={orderForm.quantity}
                    onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                    placeholder={`Max ${fmt(selectedItem?.quantity ?? 0)}`}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Payment method *</label>
                  <select
                    value={orderForm.paymentMethod}
                    onChange={(e) => setOrderForm({ ...orderForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="Cash">Cash (paid now)</option>
                    <option value="Check">Check (paid now)</option>
                    <option value="Credit">Credit (customer debt)</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              {orderForm.paymentMethod === "Credit" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-800">
                    Credit sale — customer name, phone and location are required to be able to follow up.
                  </p>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone number *</label>
                    <input
                      type="tel"
                      value={orderForm.phone}
                      onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                      placeholder="e.g. 0712 345 678"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Location *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={orderForm.location}
                        onChange={(e) => setOrderForm({ ...orderForm, location: e.target.value })}
                        placeholder="Place name / address"
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={locateCustomer}
                        disabled={locating}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {locating ? "Reading GPS..." : "Read GPS"}
                      </button>
                    </div>
                  </div>
                  {orderForm.location && (
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="truncate">
                        {orderForm.latitude != null && orderForm.longitude != null
                          ? `GPS ${orderForm.latitude.toFixed(5)}, ${orderForm.longitude.toFixed(5)}`
                          : "No GPS point yet — press Read GPS."}
                      </span>
                      {orderForm.latitude != null && orderForm.longitude != null && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${orderForm.latitude},${orderForm.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-amber-700 hover:underline"
                        >
                          Open map
                        </a>
                      )}
                    </div>
                  )}
                  {orderForm.latitude != null && orderForm.longitude != null && (
                    <iframe
                      title="Customer location"
                      src={`https://maps.google.com/maps?q=${orderForm.latitude},${orderForm.longitude}&z=15&output=embed`}
                      className="w-full h-40 rounded-xl border border-gray-200"
                      loading="lazy"
                    />
                  )}
                </div>
              )}

              {selectedItem && orderQty > 0 && (
                <div className="rounded-xl border border-green-100 bg-green-50/60 p-4 space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Sold at {fmt(orderUnitPrice)} × {fmt(orderQty)} {selectedItem.unit}</span>
                    <span className="font-semibold">{money(orderTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Cost {fmt(orderCost)} × {fmt(orderQty)}</span>
                    <span className="font-semibold text-red-500">- {money(orderQty * orderCost)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Stock after sale</span>
                    <span className="font-semibold">{fmt((selectedItem.quantity ?? 0) - orderQty)} {selectedItem.unit}</span>
                  </div>
                  <div className="pt-1.5 border-t border-green-100 flex justify-between font-bold">
                    <span>Profit</span>
                    <span className={orderProfit >= 0 ? "text-green-700" : "text-red-600"}>{money(orderProfit)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !saving && setShowOrderForm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Confirm Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOrderId != null}
        title="Delete customer sale?"
        message={
          <>
            Delete the sale to <b>{orders.find((o) => o.id === deleteOrderId)?.customer ?? "this customer"}</b>?
            The sold quantity will be restored to stock.
          </>
        }
        busy={deleting}
        onCancel={() => !deleting && setDeleteOrderId(null)}
        onConfirm={handleDeleteOrder}
      />

      <ConfirmDialog
        open={bulkDeleteTarget != null}
        title="Delete selected sales?"
        message={
          <>
            Are you sure you want to delete <b>{checkedOrderIds.length}</b> sale
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