import { useEffect, useState, type FormEvent } from "react";
import { adminApi, storeApi, storeSellerToken, storeIdFromSeller, type CustomerOrder, type InventoryItem, type Store } from "../api/client";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import ConfirmDialog from "./ConfirmDialog";

function money(n: number | null | undefined): string {
  return "TZS " + (n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

type BuyMode = "pay" | "debt" | "request";

export default function BuyStock() {
  const { user } = useUser();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<CustomerOrder[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<number | null>(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mode, setMode] = useState<BuyMode>("pay");
  const [payMethod, setPayMethod] = useState<"Cash" | "Online">("Cash");
  const [debtPhone, setDebtPhone] = useState("");
  const [debtLocation, setDebtLocation] = useState("");
  const [debtLat, setDebtLat] = useState<number | null>(null);
  const [debtLng, setDebtLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [checkout, setCheckout] = useState<"idle" | "processing" | "done" | "failed">("idle");
  const [refNo, setRefNo] = useState("");
  const [notice, setNotice] = useState("");
  const [checkedOrderIds, setCheckedOrderIds] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

  const load = async () => {
    try {
      const [inv, orders, allStores] = await Promise.all([
        adminApi.inventory.getAll(),
        adminApi.orders.getAll(),
        storeApi.getAll().catch(() => []),
      ]);
      setItems(inv);
      setRequests(orders.filter((o) => o.customerUserId === user?.id));
      setStores(allStores);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stock");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const readGps = () => {
    if (!navigator.geolocation) {
      setError("GPS is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDebtLat(pos.coords.latitude);
        setDebtLng(pos.coords.longitude);
        setDebtLocation((prev) => prev || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setLocating(false);
        setError("");
      },
      () => {
        setLocating(false);
        setError("Could not read GPS. Type a place name instead.");
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  const placeOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected || !user?.id || quantity <= 0) return;

    if (mode === "pay" && payMethod === "Online") {
      setCheckout("processing");
      await new Promise((r) => setTimeout(r, 1600));
      const fakeRef =
        "PV" + Math.random().toString(36).slice(2, 8).toUpperCase() + Date.now().toString().slice(-6);
      setRefNo(fakeRef);
      setCheckout("done");
      return;
    }

    if (mode === "debt" && (!debtPhone.trim() || !debtLocation.trim())) {
      setError("Phone number and location are required to buy on debt.");
      return;
    }

    setPlacing(true);
    setNotice("");
    setError("");
    try {
      const isRequest = mode === "request";
      await adminApi.orders.create({
        inventoryItemId: selected.id ?? 0,
        customer: user.fullName,
        quantity,
        customerUserId: user.id,
        sellerUserId: isFarmer && activeStore ? storeSellerToken(activeStore.id) : undefined,
        paymentMethod: isRequest ? "Request" : mode === "debt" ? "Credit" : payMethod,
        phone: mode === "debt" ? debtPhone : undefined,
        location: mode === "debt" ? debtLocation : undefined,
        latitude: mode === "debt" ? debtLat ?? undefined : undefined,
        longitude: mode === "debt" ? debtLng ?? undefined : undefined,
      });
      if (isRequest) {
        setNotice(`${activeStore && isFarmer ? `${activeStore.name} · ` : ""}Your request for ${quantity} ${selected.unit} of ${selected.title} has been sent.`);
      } else if (mode === "debt") {
        setNotice(`Purchased ${quantity} ${selected.unit} of ${selected.title} on debt. It was recorded as credit.`);
      } else if (payMethod === "Cash") {
        setNotice(`You paid ${money((quantity || 0) * (selected.sellingPrice ?? 0))} in cash for ${quantity} ${selected.unit} of ${selected.title}.`);
      } else {
        setNotice(`Payment of ${money((quantity || 0) * (selected.sellingPrice ?? 0))} confirmed (ref ${refNo}). Your stock is reserved.`);
      }
      closeModal();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  const closeModal = () => {
    setSelected(null);
    setQuantity(1);
    setMode("pay");
    setPayMethod("Cash");
    setDebtPhone("");
    setDebtLocation("");
    setDebtLat(null);
    setDebtLng(null);
    setCheckout("idle");
    setRefNo("");
  };

  const myOrderIds = requests.map((o) => o.id).filter((id): id is number => id != null);
  const allMyOrdersChecked = myOrderIds.length > 0 && myOrderIds.every((id) => checkedOrderIds.includes(id));

  const toggleOrderChecked = (id: number | null | undefined) => {
    if (id == null) return;
    setCheckedOrderIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleAllMyOrders = () => setCheckedOrderIds(allMyOrdersChecked ? [] : myOrderIds);

  const removeSelected = async () => {
    setBulkDeleting(true);
    setError("");
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

  const card = dark ? "bg-[#12201a] border-gray-700" : "bg-white border-gray-100";
  const muted = dark ? "text-gray-400" : "text-gray-500";

  const isFarmer = user?.role === "FAMER";
  const activeStore = activeStoreId == null ? null : stores.find((s) => s.id === activeStoreId) ?? null;

  const filteredStores = stores.filter((s) => {
    const q = storeSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.name ?? "").toLowerCase().includes(q) ||
      (s.category ?? "").toLowerCase().includes(q) ||
      (s.location ?? "").toLowerCase().includes(q)
    );
  });

  const visibleItems = isFarmer && activeStore
    ? items.filter((it) => {
        const storeName = (activeStore.name ?? "").trim().toLowerCase();
        const supplier = (it.supplier ?? "").trim().toLowerCase();
        if (!supplier || !storeName) return false;
        return supplier === storeName || supplier.includes(storeName) || storeName.includes(supplier);
      })
    : items;

  const storeOfOrder = (o: CustomerOrder): Store | null => {
    const id = storeIdFromSeller(o.sellerUserId);
    if (id == null) return null;
    return stores.find((s) => s.id === id) ?? null;
  };

  const storeOrderCount = (store: Store): number =>
    requests.filter((o) => storeIdFromSeller(o.sellerUserId) === store.id).length;

  const orderTotal = (quantity || 0) * (selected?.sellingPrice ?? 0);

  const statusBadge = (s?: string | null): { label: string; cls: string } => {
    const v = s ?? "Requested";
    if (v === "Paid") return { label: "Paid", cls: "bg-green-100 text-green-700" };
    if (v === "Approved") return { label: "Approved", cls: "bg-blue-100 text-blue-700" };
    if (v === "Rejected") return { label: "Rejected", cls: "bg-rose-100 text-rose-700" };
    if (v === "Credit") return { label: "Debt", cls: "bg-amber-100 text-amber-700" };
    if (v === "Pending") return { label: "Pending", cls: "bg-gray-200 text-gray-600" };
    return { label: "Requested", cls: "bg-blue-100 text-blue-700" };
  };

  const modeOptions: { id: BuyMode; label: string; hint: string }[] = [
    { id: "pay", label: "Pay now", hint: "Cash or online payment" },
    { id: "debt", label: "Buy on debt", hint: "Pay later — recorded as credit" },
    { id: "request", label: "Request order", hint: "Ask supplier to order for you" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-green-800 to-teal-700 rounded-[28px] p-6 text-white shadow-lg shadow-green-800/20">
        <h2 className="text-2xl font-extrabold">Buy Stock</h2>
        <p className="mt-1 text-green-100 text-sm">
          Browse available produce and buy by paying (cash or online), take it on debt, or place a request order.
        </p>
      </div>

      {notice && (
        <div className={`text-sm rounded-2xl px-4 py-3 ${dark ? "bg-green-900/40 text-green-200 border border-green-800" : "bg-green-50 text-green-800 border border-green-100"}`}>
          {notice}
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>
      )}

      {isFarmer && (
        <div className={`rounded-[28px] border shadow-sm overflow-hidden ${card}`}>
          <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-bold">Buy from another agro store</h3>
                <p className={`text-xs ${muted}`}>
                  Farmers can buy stock straight from any agro store registered on the platform.
                </p>
              </div>
              {activeStore && (
                <button
                  onClick={() => setActiveStoreId(null)}
                  className="text-xs font-semibold text-green-700 dark:text-green-400 border border-green-700 dark:border-green-500 rounded-xl px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                >
                  Show all agro stores
                </button>
              )}
            </div>
            <div className="relative mt-3">
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                placeholder="Search agro stores by name, category or location..."
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  dark ? "bg-[#0d1813] border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
                }`}
              />
            </div>
          </div>
          {filteredStores.length === 0 ? (
            <p className={`text-sm py-8 text-center ${muted}`}>No agro stores found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              {filteredStores.map((store) => {
                const selected = activeStore?.id === store.id;
                const placedOrders = storeOrderCount(store);
                return (
                  <button
                    key={store.id ?? store.name}
                    onClick={() => setActiveStoreId(selected ? null : store.id ?? null)}
                    className={`text-left rounded-2xl border p-4 flex flex-col gap-1 transition-colors ${
                      selected
                        ? "border-green-600 bg-green-50 dark:bg-green-900/40"
                        : dark
                          ? "border-gray-700 hover:border-green-300 bg-[#0d1813]"
                          : "border-gray-200 hover:border-green-300 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-sm truncate">{store.name}</p>
                      <span className="text-[11px] font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 rounded-full px-2 py-0.5 whitespace-nowrap">
                        {store.category ?? "Agro Store"}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${muted}`}>
                      {store.location || "Location not set"}
                      {store.phone ? ` · ${store.phone}` : ""}
                    </p>
                    {placedOrders > 0 && (
                      <span className={`inline-flex self-start items-center text-[11px] font-semibold rounded-full px-2.5 py-1 ${
                        dark ? "bg-amber-900/40 text-amber-300" : "bg-amber-50 text-amber-700"
                      }`}>
                        {placedOrders} order{placedOrders === 1 ? "" : "s"} sent to this store
                      </span>
                    )}
                    <span
                      className={`mt-2 inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                        selected
                          ? "bg-green-800 text-white"
                          : dark
                            ? "bg-[#1d2a23] text-green-300"
                            : "bg-green-50 text-green-800"
                      }`}
                    >
                      {selected ? "Viewing stock" : "Buy stock from this store"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className={`text-sm py-10 text-center ${muted}`}>Loading stock...</p>
      ) : visibleItems.length === 0 ? (
        activeStore ? (
          <p className={`text-sm py-10 text-center ${muted}`}>
            This agro store has not listed any stock yet. Pick another store or show all agro stores.
          </p>
        ) : (
          <p className={`text-sm py-10 text-center ${muted}`}>No produce available right now. Check back soon.</p>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleItems.map((item) => (
            <div key={item.id ?? item.title} className={`rounded-2xl border p-4 shadow-sm flex flex-col ${card}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold">{item.title}</p>
                <span className="text-[11px] font-semibold bg-green-100 text-green-700 rounded-full px-2.5 py-0.5">
                  {item.quantity ?? 0} {item.unit}
                </span>
              </div>
              <p className={`text-xs mt-1 ${muted}`}>
                {item.category || "Produce"} · {item.supplier || "Farm"}
              </p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className={`text-[11px] ${muted}`}>Price per {item.unit}</p>
                  <p className="font-bold text-lg text-green-700 dark:text-green-400">{money(item.sellingPrice ?? 0)}</p>
                </div>
                <button
                  onClick={() => { setSelected(item); setQuantity(1); setMode("pay"); setNotice(""); setError(""); }}
                  disabled={(item.quantity ?? 0) <= 0}
                  className="px-4 py-2 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 disabled:opacity-40 transition-colors"
                >
                  Buy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={`rounded-[28px] border shadow-sm overflow-hidden ${card}`}>
        <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-bold">My orders</h3>
            <p className={`text-xs ${muted}`}>Everything you bought or requested — paid, debt, and pending.</p>
          </div>
          {selectMode ? (
            <div className="flex items-center gap-2">
              <button
                onClick={toggleAllMyOrders}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
              >
                {allMyOrdersChecked ? "Clear" : "Select all"}
              </button>
              <button
                onClick={() => {
                  setSelectMode(false);
                  setCheckedOrderIds([]);
                }}
                className="text-xs font-semibold text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setBulkOpen(true)}
                disabled={checkedOrderIds.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Delete selected ({checkedOrderIds.length})
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              disabled={requests.length === 0}
              className="text-xs font-semibold text-green-700 dark:text-green-400 border border-green-700 dark:border-green-500 rounded-xl px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Select orders
            </button>
          )}
        </div>
        {requests.length === 0 ? (
          <p className={`text-sm py-8 text-center ${muted}`}>You have not placed any orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left border-b ${dark ? "border-gray-700" : "border-gray-100"}`}>
                  {selectMode && (
                    <th className={`px-4 py-3 ${muted}`}>
                      <input
                        type="checkbox"
                        checked={allMyOrdersChecked}
                        onChange={toggleAllMyOrders}
                        className={`w-4 h-4 ${dark ? "accent-green-500" : "accent-green-700"}`}
                        aria-label="Select all my orders"
                      />
                    </th>
                  )}
                  <th className={`px-4 py-3 font-semibold ${muted}`}>Item</th>
                  <th className={`px-4 py-3 font-semibold ${muted}`}>Store</th>
                  <th className={`px-4 py-3 font-semibold ${muted}`}>Qty</th>
                  <th className={`px-4 py-3 font-semibold ${muted}`}>Total</th>
                  <th className={`px-4 py-3 font-semibold ${muted}`}>Payment</th>
                  <th className={`px-4 py-3 font-semibold ${muted}`}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {requests.map((o) => {
                  const badge = statusBadge(o.status);
                  const orderStore = storeOfOrder(o);
                  return (
                    <tr key={o.id ?? o.itemTitle}>
                      {selectMode && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={o.id != null && checkedOrderIds.includes(o.id)}
                            onChange={() => toggleOrderChecked(o.id)}
                            className={`w-4 h-4 ${dark ? "accent-green-500" : "accent-green-700"}`}
                            aria-label={`Select order for ${o.itemTitle}`}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 font-semibold">{o.itemTitle}</td>
                      <td className="px-4 py-3">
                        {orderStore ? (
                          <span className="text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 rounded-full px-3 py-1">
                            {orderStore.name}
                          </span>
                        ) : (
                          <span className={`text-xs ${muted}`}>—</span>
                        )}
                      </td>
                      <td className={`px-4 py-3 ${muted}`}>{o.quantity ?? 0} {o.unit}</td>
                      <td className="px-4 py-3 font-semibold">{money(o.total ?? 0)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full px-3 py-1">
                          {o.paymentMethod ?? "Request"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold rounded-full px-3 py-1 ${badge.cls}`}>{badge.label}</span>
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
            {checkedOrderIds.length === 1 ? "" : "s"} from your list?
          </>
        }
        busy={bulkDeleting}
        onCancel={() => !bulkDeleting && setBulkOpen(false)}
        onConfirm={removeSelected}
      />

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !placing && checkout === "idle" && closeModal()} />
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl p-6 ${dark ? "bg-[#12201a] border border-gray-700" : "bg-white"}`}>
            <h3 className="font-bold text-lg">Buy · {selected.title}</h3>
            <p className={`text-sm mt-1 ${muted}`}>
              {money(selected.sellingPrice ?? 0)} per {selected.unit} · {selected.quantity ?? 0} {selected.unit} available
            </p>

            {checkout === "processing" && (
              <div className="mt-6 text-center py-8">
                <div className="w-12 h-12 mx-auto rounded-full border-4 border-green-200 border-t-green-700 animate-spin" />
                <p className="mt-4 text-sm font-semibold text-green-700 dark:text-green-400">Processing online payment...</p>
                <p className={`text-xs mt-1 ${muted}`}>Simulated gateway · no real money is moved</p>
              </div>
            )}

            {checkout === "failed" && (
              <div className="mt-6 text-center py-8">
                <p className="text-sm font-semibold text-red-600">Payment failed. Please try again.</p>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setCheckout("idle")} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${dark ? "border border-gray-700 text-gray-300" : "border border-gray-200 text-gray-600"}`}>
                    Back
                  </button>
                </div>
              </div>
            )}

            {checkout === "done" && (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 dark:bg-green-900/30 p-5 text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-green-600 text-white flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="mt-3 font-bold text-green-800 dark:text-green-200">Payment successful</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reference: {refNo}</p>
                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="mt-4 w-full rounded-xl bg-green-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-60"
                >
                  {placing ? "Confirming..." : "Confirm order"}
                </button>
              </div>
            )}

            {(checkout === "idle" || checkout === "failed") && (
              <form onSubmit={placeOrder} className="mt-4 space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-1 ${dark ? "text-gray-200" : "text-gray-700"}`}>
                    Quantity ({selected.unit})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selected.quantity ?? 1}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      dark ? "bg-[#0d1813] border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-900"
                    }`}
                  />
                </div>

                <div>
                  <p className={`block text-sm font-semibold mb-1.5 ${dark ? "text-gray-200" : "text-gray-700"}`}>How do you want to buy?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {modeOptions.map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex flex-col items-center rounded-xl border px-2 py-2.5 text-center cursor-pointer transition-colors ${
                          mode === opt.id
                            ? "border-green-500 bg-green-50 dark:bg-green-900/40"
                            : dark ? "border-gray-700 text-gray-300 hover:border-green-300" : "border-gray-200 text-gray-600 hover:border-green-300"
                        }`}
                      >
                        <input type="radio" name="mode" checked={mode === opt.id} onChange={() => setMode(opt.id)} className="sr-only" />
                        <span className="text-sm font-bold">{opt.label}</span>
                        <span className={`text-[10px] leading-tight ${muted}`}>{opt.hint}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {mode === "pay" && (
                  <div className="grid grid-cols-2 gap-2">
                    {(["Cash", "Online"] as const).map((m) => (
                      <label
                        key={m}
                        className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold cursor-pointer transition-colors ${
                          payMethod === m
                            ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                            : dark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-600"
                        }`}
                      >
                        <input type="radio" name="payMethod" checked={payMethod === m} onChange={() => setPayMethod(m)} className="accent-green-600" />
                        {m === "Cash" ? "Cash" : "Online payment"}
                      </label>
                    ))}
                  </div>
                )}

                {mode === "debt" && (
                  <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 dark:bg-amber-900/20 p-3 space-y-3">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      Debt purchase — phone and location are required so the supplier can follow up.
                    </p>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${dark ? "text-gray-200" : "text-gray-700"}`}>Phone number *</label>
                      <input
                        type="tel"
                        value={debtPhone}
                        onChange={(e) => setDebtPhone(e.target.value)}
                        placeholder="e.g. 0712 345 678"
                        className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          dark ? "bg-[#0d1813] border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-semibold mb-1 ${dark ? "text-gray-200" : "text-gray-700"}`}>Location *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={debtLocation}
                          onChange={(e) => setDebtLocation(e.target.value)}
                          placeholder="Place name / address"
                          className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                            dark ? "bg-[#0d1813] border-gray-700 text-gray-100" : "bg-white border-gray-200 text-gray-900"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={readGps}
                          disabled={locating}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                          {locating ? "Reading GPS..." : "GPS"}
                        </button>
                      </div>
                    </div>
                    {debtLat != null && debtLng != null && (
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span>GPS {debtLat.toFixed(5)}, {debtLng.toFixed(5)}</span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${debtLat},${debtLng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-amber-700 hover:underline"
                        >
                          Open map
                        </a>
                      </div>
                    )}
                    {debtLat != null && debtLng != null && (
                      <iframe
                        title="Location"
                        src={`https://maps.google.com/maps?q=${debtLat},${debtLng}&z=15&output=embed`}
                        className="w-full h-32 rounded-xl border border-gray-200"
                        loading="lazy"
                      />
                    )}
                  </div>
                )}

                <p className={`text-xs ${muted}`}>
                  {mode === "debt"
                    ? "This amount is added to your debt: "
                    : mode === "request"
                      ? "A request holds no stock until confirmation: "
                      : "Amount due now: "}
                  <span className="font-bold text-green-700 dark:text-green-400">{money(orderTotal)}</span>
                </p>

                <div className="flex gap-3">
                  <button type="button" onClick={closeModal} disabled={placing} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold ${dark ? "border border-gray-700 text-gray-300" : "border border-gray-200 text-gray-600"}`}>
                    Cancel
                  </button>
                  <button type="submit" disabled={placing} className="flex-1 rounded-xl bg-green-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-60">
                    {placing
                      ? "Placing..."
                      : mode === "pay" && payMethod === "Online"
                        ? "Pay online"
                        : mode === "debt"
                          ? "Take on debt"
                          : "Send request"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}