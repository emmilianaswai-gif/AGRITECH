import { useEffect, useState, type FormEvent } from "react";
import { adminApi, type InventoryItem, type InventoryTotals } from "../api/client";
import ConfirmDialog from "./ConfirmDialog";

const emptyItemForm = {
  title: "",
  category: "",
  supplier: "",
  ownProduce: false,
  costPrice: "",
  sellingPrice: "",
  quantity: "",
  unit: "kg",
};

const categories = ["Grains", "Vegetables", "Fruits", "Dairy", "Livestock", "Fertilizer", "Seeds", "Tools"];

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function money(n: number): string {
  return "TZS " + fmt(n);
}

export default function MyStock() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventoryTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [checkedItemIds, setCheckedItemIds] = useState<number[]>([]);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<"items" | null>(null);
  const [selectMode, setSelectMode] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [inv, sum] = await Promise.all([adminApi.inventory.getAll(), adminApi.orders.summary()]);
      setItems(inv);
      setSummary(sum);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stock");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cost = Number(itemForm.costPrice) || 0;
  const sell = Number(itemForm.sellingPrice) || 0;
  const margin = sell - cost;

  const handleItemSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!itemForm.title.trim()) {
      setFormError("Please enter the product name");
      return;
    }
    if (sell <= 0) {
      setFormError("Selling price must be greater than zero");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await adminApi.inventory.create({
        title: itemForm.title.trim(),
        category: itemForm.category.trim() || null,
        supplier: itemForm.ownProduce ? null : itemForm.supplier.trim() || null,
        ownProduce: itemForm.ownProduce,
        costPrice: cost,
        sellingPrice: sell,
        quantity: Number(itemForm.quantity) || 0,
        unit: itemForm.unit || "kg",
      });
      setShowItemForm(false);
      setItemForm(emptyItemForm);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItemId) return;
    setDeleting(true);
    try {
      await adminApi.inventory.delete(deleteItemId);
      setDeleteItemId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleteItemId(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteTarget) return;
    setDeleting(true);
    try {
      await Promise.allSettled(checkedItemIds.map((id) => adminApi.inventory.delete(id)));
      setCheckedItemIds([]);
      setBulkDeleteTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete the selected records");
      setBulkDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const inStockItems = items.filter((i) => (i.quantity ?? 0) > 0);
  const outStockItems = items.filter((i) => (i.quantity ?? 0) <= 0);
  const inStockIds = inStockItems.map((i) => i.id).filter((id): id is number => id != null);
  const outStockIds = outStockItems.map((i) => i.id).filter((id): id is number => id != null);
  const inStockAllChecked = inStockIds.length > 0 && inStockIds.every((id) => checkedItemIds.includes(id));
  const outStockAllChecked = outStockIds.length > 0 && outStockIds.every((id) => checkedItemIds.includes(id));

  const toggleItemChecked = (id: number | null | undefined) => {
    if (id == null) return;
    setCheckedItemIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleAllInStock = () => {
    if (inStockAllChecked) {
      setCheckedItemIds((prev) => prev.filter((id) => !inStockIds.includes(id)));
    } else {
      setCheckedItemIds((prev) => Array.from(new Set([...prev, ...inStockIds])));
    }
  };
  const toggleAllOutStock = () => {
    if (outStockAllChecked) {
      setCheckedItemIds((prev) => prev.filter((id) => !outStockIds.includes(id)));
    } else {
      setCheckedItemIds((prev) => Array.from(new Set([...prev, ...outStockIds])));
    }
  };
  const exitSelectMode = () => {
    setSelectMode(false);
    setCheckedItemIds([]);
  };

  const renderInventoryTable = (
    list: InventoryItem[],
    title: string,
    count: number,
    allChecked: boolean,
    onToggleAll: () => void,
  ) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-bold text-green-950">{title}</h4>
          <span className="text-[11px] font-semibold text-green-700 bg-green-50 rounded-full px-2.5 py-0.5">
            {count} item{count === 1 ? "" : "s"}
          </span>
        </div>
        <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-left border-b border-gray-100 text-xs text-gray-500">
                {selectMode && (
                  <th className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={onToggleAll}
                      className="accent-green-700 w-4 h-4"
                      aria-label={`Select all ${title}`}
                    />
                  </th>
                )}
                <th className="px-4 py-2.5 font-semibold">Product</th>
                <th className="px-4 py-2.5 font-semibold">Category</th>
                <th className="px-4 py-2.5 font-semibold text-right">Cost</th>
                <th className="px-4 py-2.5 font-semibold text-right">Sell</th>
                <th className="px-4 py-2.5 font-semibold text-right">Stock</th>
                <th className="px-4 py-2.5 font-semibold text-right">Value</th>
                <th className="px-4 py-2.5 font-semibold text-right">Profit</th>
                <th className="px-4 py-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map((item) => {
                const marginAmt = (item.sellingPrice ?? 0) - (item.costPrice ?? 0);
                const value = (item.quantity ?? 0) * (item.sellingPrice ?? 0);
                return (
                  <tr key={item.id ?? item.title} className="align-middle">
                    {selectMode && (
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={item.id != null && checkedItemIds.includes(item.id)}
                          onChange={() => toggleItemChecked(item.id)}
                          className="accent-green-700 w-4 h-4"
                          aria-label={`Select ${item.title}`}
                        />
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-xs text-gray-400">
                        {item.ownProduce ? "Grown by you" : `From ${item.supplier ?? "supplier"}`}
                      </p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">
                        {item.category ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">{fmt(item.costPrice ?? 0)} <span className="text-xs text-gray-400">/{item.unit}</span></td>
                    <td className="px-4 py-2.5 text-right">{fmt(item.sellingPrice ?? 0)} <span className="text-xs text-gray-400">/{item.unit}</span></td>
                    <td className="px-4 py-2.5 text-right font-semibold">{fmt(item.quantity ?? 0)} {item.unit}</td>
                    <td className="px-4 py-2.5 text-right">{money(value)}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold ${marginAmt >= 0 ? "text-green-700" : "text-red-600"}`}>{money(marginAmt)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => item.id && setDeleteItemId(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Delete stock item"
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
      </div>
    );
  };

  const statCards = [
    { label: "Stock items", value: String(summary?.inventoryCount ?? 0), color: "bg-emerald-50 text-emerald-800" },
    { label: "Inventory value", value: money(summary?.inventoryValue ?? 0), color: "bg-green-50 text-green-800" },
  ];

  return (
    <div>
      <p className="text-xs text-gray-600 mb-3">
        Products you bought from suppliers or grew yourself. Every sale deducts from your stock.
      </p>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        {statCards.map((s) => (
          <div key={s.label} className={`rounded-2xl px-3 py-2 ${s.color}`}>
            <p className="text-[10px] font-medium opacity-70">{s.label}</p>
            <p className="font-bold text-base mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h4 className="font-bold text-green-950">Stock</h4>
            <div className="flex flex-wrap items-center gap-2">
              {selectMode ? (
                <>
                  {checkedItemIds.length > 0 && (
                    <button
                      onClick={() => setBulkDeleteTarget("items")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Delete selected ({checkedItemIds.length})
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
                  disabled={items.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border border-green-800 text-green-800 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Select records
                </button>
              )}
              <button
                onClick={() => {
                  setItemForm(emptyItemForm);
                  setFormError("");
                  setShowItemForm(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors shadow-md shadow-green-800/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Stock
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-3">No stock items yet. Add products you bought from suppliers or crops you produced.</p>
              <button
                onClick={() => setShowItemForm(true)}
                className="px-5 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors"
              >
                Add your first stock item
              </button>
            </div>
          ) : (
            <>
              {renderInventoryTable(inStockItems, "In stock", inStockItems.length, inStockAllChecked, toggleAllInStock)}
              {renderInventoryTable(outStockItems, "Out of stock", outStockItems.length, outStockAllChecked, toggleAllOutStock)}
            </>
          )}
        </div>
      )}

      {/* Add stock item modal */}
      {showItemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !saving && setShowItemForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-green-950">Add Stock</h3>
              <button onClick={() => !saving && setShowItemForm(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{formError}</div>
            )}

            <form onSubmit={handleItemSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Product *</label>
                  <input
                    type="text"
                    value={itemForm.title}
                    onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                    placeholder="e.g. White Maize, Organic Tomatoes..."
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">Select...</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Unit</label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    {["kg", "bag", "ton", "crate", "litre", "bunch", "piece"].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <label className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${itemForm.ownProduce ? "border-amber-500 bg-amber-50 text-amber-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
                  <input
                    type="radio"
                    name="source"
                    checked={!itemForm.ownProduce}
                    onChange={() => setItemForm({ ...itemForm, ownProduce: false })}
                    className="accent-blue-600"
                  />
                  Bought from supplier
                </label>
                <label className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${itemForm.ownProduce ? "bg-amber-50 text-amber-700 border-amber-500" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                  <input
                    type="radio"
                    name="source"
                    checked={itemForm.ownProduce}
                    onChange={() => setItemForm({ ...itemForm, ownProduce: true })}
                    className="accent-amber-600"
                  />
                  My own crops
                </label>
              </div>

              {!itemForm.ownProduce && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={itemForm.supplier}
                    onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })}
                    placeholder="e.g. Green Valley Agro Ltd"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Purchase cost per {itemForm.unit} {itemForm.ownProduce && "(optional)"}</label>
                  <input
                    type="number"
                    min={0}
                    value={itemForm.costPrice}
                    onChange={(e) => setItemForm({ ...itemForm, costPrice: e.target.value })}
                    placeholder="e.g. 40"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Selling price per {itemForm.unit} *</label>
                  <input
                    type="number"
                    min={0}
                    value={itemForm.sellingPrice}
                    onChange={(e) => setItemForm({ ...itemForm, sellingPrice: e.target.value })}
                    placeholder="e.g. 55"
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
                    value={itemForm.quantity}
                    onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                    placeholder="e.g. 1000"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex flex-col justify-center">
                  {sell > 0 ? (
                    <>
                      <p className="text-xs text-gray-600">Margin per {itemForm.unit}</p>
                      <p className={`font-bold text-lg ${margin >= 0 ? "text-green-700" : "text-red-600"}`}>{money(margin)}</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">Enter a selling price to see your margin.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !saving && setShowItemForm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Add to Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteItemId != null}
        title="Delete stock item?"
        message={
          <>
            Are you sure you want to remove{" "}
            <b>{items.find((i) => i.id === deleteItemId)?.title ?? "this item"}</b> from your stock? Its
            value and profit will be removed.
          </>
        }
        busy={deleting}
        onCancel={() => !deleting && setDeleteItemId(null)}
        onConfirm={handleDeleteItem}
      />

      <ConfirmDialog
        open={bulkDeleteTarget != null}
        title="Delete selected stock items?"
        message={
          <>
            Are you sure you want to remove <b>{checkedItemIds.length}</b> stock item
            {checkedItemIds.length === 1 ? "" : "s"}? Their value and profit will be removed.
          </>
        }
        busy={deleting}
        onCancel={() => !deleting && setBulkDeleteTarget(null)}
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}