import { useEffect, useState, type FormEvent } from "react";
import { storeApi, type Store } from "../api/client";
import ConfirmDialog from "./ConfirmDialog";

const emptyForm = {
  name: "",
  category: "",
  location: "",
  description: "",
  phone: "",
  email: "",
  rating: "",
};

const categoryColors: Record<string, string> = {
  "Agro-dealer": "bg-green-100 text-green-700",
  Seeds: "bg-emerald-100 text-emerald-700",
  Equipment: "bg-blue-100 text-blue-700",
  Fertilizer: "bg-amber-100 text-amber-700",
  Cooperative: "bg-purple-100 text-purple-700",
  Other: "bg-gray-100 text-gray-600",
};

const fallbackColor = "bg-green-100 text-green-700";

export default function Stores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [checkedIds, setCheckedIds] = useState<number[]>([]);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setStores(await storeApi.getAll());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = stores.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (s.name ?? "").toLowerCase().includes(q) ||
      (s.category ?? "").toLowerCase().includes(q) ||
      (s.location ?? "").toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Store name is required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await storeApi.create({
        name: form.name.trim(),
        category: form.category.trim() || null,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        rating: form.rating ? Number(form.rating) : null,
      });
      setShowForm(false);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await storeApi.delete(deleteId);
      setDeleteId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  const allIds = filtered.map((s) => s.id).filter((id): id is number => id != null);
  const allChecked = allIds.length > 0 && allIds.every((id) => checkedIds.includes(id));

  const toggleChecked = (id: number | null | undefined) => {
    if (id == null) return;
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleAll = () => setCheckedIds(allChecked ? [] : allIds);

  const handleBulkDelete = async () => {
    setDeleting(true);
    try {
      await Promise.allSettled(checkedIds.map((id) => storeApi.delete(id)));
      setCheckedIds([]);
      setBulkOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete the selected stores");
      setBulkOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const stars = (rating: number | null) => {
    const r = Math.round(rating ?? 0);
    return (
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className={`w-3.5 h-3.5 ${i <= r ? "text-amber-400" : "text-gray-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.363 1.118l1.287 3.958c.3.922-.755 1.688-1.539 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.196-1.539-1.118l1.287-3.958a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
          </svg>
        ))}
      </span>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectMode ? (
            <>
              {checkedIds.length > 0 && (
                <button
                  onClick={() => setBulkOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  Delete selected ({checkedIds.length})
                </button>
              )}
              <button
                onClick={() => {
                  setSelectMode(false);
                  setCheckedIds([]);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              disabled={stores.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-green-800 text-green-800 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Select stores
            </button>
          )}
          <button
            onClick={() => {
              setForm(emptyForm);
              setFormError("");
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors shadow-md shadow-green-800/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Store
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">{stores.length === 0 ? "No stores registered yet." : "No stores match your search."}</p>
          {stores.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors"
            >
              Add the first store
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="text-left border-b border-gray-100 text-xs text-gray-500">
                {selectMode && (
                  <th className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={toggleAll}
                      className="accent-green-700 w-4 h-4"
                      aria-label="Select all stores"
                    />
                  </th>
                )}
                <th className="px-4 py-2.5 font-semibold">Store</th>
                <th className="px-4 py-2.5 font-semibold">Location</th>
                <th className="px-4 py-2.5 font-semibold">Contact</th>
                <th className="px-4 py-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((store) => (
                <tr key={store.id ?? store.name} className="align-middle">
                  {selectMode && (
                    <td className="px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={store.id != null && checkedIds.includes(store.id)}
                        onChange={() => toggleChecked(store.id)}
                        className="accent-green-700 w-4 h-4"
                        aria-label={`Select ${store.name}`}
                      />
                    </td>
                  )}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{store.name}</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${categoryColors[store.category ?? ""] ?? fallbackColor}`}>
                            {store.category ?? "Store"}
                          </span>
                          {store.rating != null && stars(store.rating)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">
                    {store.location || <span className="text-gray-400">—</span>}
                    {store.description && (
                      <p className="text-xs text-gray-400 truncate max-w-[240px]">{store.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {store.phone && (
                        <a
                          href={`tel:${store.phone}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-green-800 bg-green-50 border border-green-100 rounded-lg px-2 py-1 hover:bg-green-100 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                          {store.phone}
                        </a>
                      )}
                      {store.email && (
                        <a
                          href={`mailto:${store.email}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-green-800 bg-green-50 border border-green-100 rounded-lg px-2 py-1 hover:bg-green-100 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          {store.email}
                        </a>
                      )}
                      {!store.phone && !store.email && <span className="text-gray-400 text-xs">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => store.id && setDeleteId(store.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      title="Delete"
                      aria-label="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteId != null}
        title="Delete store?"
        message={
          <>
            Are you sure you want to remove{" "}
            <b>{stores.find((s) => s.id === deleteId)?.name ?? "this store"}</b>? This cannot be undone.
          </>
        }
        busy={deleting}
        onCancel={() => !deleting && setDeleteId(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkOpen}
        title="Delete selected stores?"
        message={
          <>
            Are you sure you want to remove <b>{checkedIds.length}</b> store
            {checkedIds.length === 1 ? "" : "s"}? This cannot be undone.
          </>
        }
        busy={deleting}
        onCancel={() => !deleting && setBulkOpen(false)}
        onConfirm={handleBulkDelete}
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => !saving && setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-green-950">Add a Store</h3>
              <button onClick={() => !saving && setShowForm(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{formError}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Store name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Green Harvest Agro Store"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="">Select...</option>
                    {["Agro-dealer", "Seeds", "Equipment", "Fertilizer", "Cooperative", "Other"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Nairobi, Kiambu Rd"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Rating (0–5)</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={form.rating}
                    onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    placeholder="e.g. 4.5"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="What do they sell?"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+254700000000"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="name@store.co.ke"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !saving && setShowForm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Add Store"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}