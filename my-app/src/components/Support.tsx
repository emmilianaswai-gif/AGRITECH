import { useState, useEffect, useCallback } from "react";
import { supportApi, type SupportContact } from "../api/client";
import { useUser, roleOf } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import ConfirmDialog from "./ConfirmDialog";

const PROVIDER_ROLES = ["FAMER", "ADMIN", "SUPER_ADMIN"];
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

const errMsg = (err: unknown) =>
  err instanceof Error ? err.message.replace(/^Request failed \(\d+\): /, "").trim() : "Something went wrong";

const AVATAR_COLORS = [
  "bg-purple-500",
  "bg-indigo-500",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-sky-500",
];

function avatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

export default function Support() {
  const { user } = useUser();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const role = roleOf(user) ?? "";
  const canProvide = PROVIDER_ROLES.includes(role);
  const isAdmin = ADMIN_ROLES.includes(role);
  const myId = user?.id ?? "";

  const [contacts, setContacts] = useState<SupportContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

const [form, setForm] = useState({
  name: user?.fullName ?? "",
  phone: "",
  email: "",
  category: "",
  description: "",
});
const [editingId, setEditingId] = useState<number | null>(null);
const [busy, setBusy] = useState(false);
const [deleteContact, setDeleteContact] = useState<SupportContact | null>(null);
const [deleting, setDeleting] = useState(false);
const [checkedIds, setCheckedIds] = useState<number[]>([]);
const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
const [open, setOpen] = useState(false);
const [selectMode, setSelectMode] = useState(false);

const SUPPORT_CATEGORIES = [
  "Agronomy & Crops",
  "Irrigation & Pumps",
  "Machinery Repair",
  "Pest & Disease Control",
  "Soil & Fertilizer",
  "Livestock Care",
  "Market & Prices",
  "Other",
];

  const load = useCallback(async () => {
    try {
      const data = await supportApi.getAll();
      setContacts(data);
      setError("");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const canEdit = (c: SupportContact) => (myId && c.userId === myId) || isAdmin;

  const submit = async () => {
    setError("");
    setNotice("");
    if (!user) return;
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!form.category) {
      setError("Category is required.");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        contact: form.phone.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        category: form.category,
        description: form.description.trim(),
        role,
        userId: myId,
      };
      if (editingId) {
        await supportApi.update(editingId, payload);
        setNotice("Your support contact was updated.");
      } else {
        await supportApi.create(payload);
        setNotice("Your support contact is now visible to everyone.");
      }
      setForm({ name: user.fullName, phone: "", email: "", category: "", description: "" });
      setEditingId(null);
      setOpen(false);
      await load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (c: SupportContact) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      phone: c.phone || (c.contact && !c.contact.includes("@") ? c.contact : ""),
      email: c.email || (c.contact && c.contact.includes("@") ? c.contact : ""),
      category: c.category ?? "",
      description: c.description,
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setOpen(false);
    setForm({ name: user?.fullName ?? "", phone: "", email: "", category: "", description: "" });
  };

  const remove = async () => {
    if (!deleteContact) return;
    setDeleting(true);
    setError("");
    try {
      await supportApi.remove(deleteContact.id, role, myId);
      setNotice("Support contact removed.");
      setDeleteContact(null);
      if (editingId === deleteContact.id) cancelEdit();
      await load();
    } catch (err) {
      setError(errMsg(err));
      setDeleteContact(null);
    } finally {
      setDeleting(false);
    }
  };

  const removableIds = contacts.filter((c) => canEdit(c)).map((c) => c.id).filter((id): id is number => id != null);
  const allChecked = removableIds.length > 0 && removableIds.every((id) => checkedIds.includes(id));

  const toggleChecked = (id: number | null | undefined) => {
    if (id == null) return;
    setCheckedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleAll = () => setCheckedIds(allChecked ? [] : removableIds);

  const removeSelected = async () => {
    setDeleting(true);
    setError("");
    try {
      await Promise.allSettled(checkedIds.map((id) => supportApi.remove(id, role, myId)));
      setCheckedIds([]);
      setBulkDeleteOpen(false);
      await load();
    } catch (err) {
      setError(errMsg(err));
      setBulkDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const card = dark ? "bg-[#12201a] border-gray-700" : "bg-white border-gray-100";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const input = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
    dark ? "bg-[#0d1813] border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-900"
  }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-800 to-indigo-700 rounded-[28px] p-6 text-white shadow-lg shadow-purple-800/20">
        <p className="text-purple-200 text-[11px] font-semibold uppercase tracking-widest">Technical Support</p>
        <h2 className="text-2xl font-extrabold mt-1">Get hands-on help</h2>
        <p className="mt-1 text-purple-100/90 text-sm max-w-xl">
          Farmers and admins register their contact and a short description so the whole community can reach them directly.
        </p>
      </div>

      {notice && (
        <div className={`text-sm rounded-2xl px-4 py-3 ${dark ? "bg-green-900/40 text-green-200 border border-green-800" : "bg-green-50 text-green-800 border border-green-100"}`}>
          {notice}
          <button onClick={() => setNotice("")} className="ml-2 text-xs underline">dismiss</button>
        </div>
      )}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>
      )}

      {/* Provider form */}
      {canProvide ? (
        open || editingId != null ? (
          <div className={`rounded-[28px] border shadow-sm p-5 sm:p-6 ${card}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold">{editingId ? "Update your support contact" : "Register your support contact"}</h3>
              {editingId ? (
                <button onClick={cancelEdit} className="text-xs font-semibold text-gray-400 hover:text-gray-600 underline">
                  Cancel editing
                </button>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false);
                    setError("");
                    setForm({ name: user?.fullName ?? "", phone: "", email: "", category: "", description: "" });
                  }}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-600 underline"
                >
                  Cancel
                </button>
              )}
            </div>
            <p className={`text-xs mt-0.5 ${muted}`}>
              Visible to every user. Only farmers and all admins can add or change these details.
            </p>
          <div className="mt-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Your name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={input}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Phone number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={input}
                  placeholder="e.g. 0712 345 678"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={input}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={input}
                >
                  <option value="">Select a category...</option>
                  {SUPPORT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Short description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className={input}
                placeholder="e.g. I repair irrigation pumps and give on-field troubleshooting advice."
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={submit}
                disabled={busy}
                className="px-6 py-3 bg-purple-800 text-white text-sm font-bold rounded-xl hover:bg-purple-900 disabled:opacity-60 transition-colors"
              >
                {busy ? "Saving..." : editingId ? "Save changes" : "Publish contact"}
              </button>
            </div>
          </div>
        </div>
        ) : (
        <div className={`rounded-[28px] border shadow-sm p-5 sm:p-6 ${card}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold">Add yourself to the support team</h3>
              <p className={`text-xs mt-0.5 ${muted}`}>
                Register your contact and a short description so the whole community can reach you directly.
              </p>
            </div>
            <button
              onClick={() => {
                setOpen(true);
                setError("");
                setNotice("");
              }}
              className="px-6 py-3 bg-purple-800 text-white text-sm font-bold rounded-xl hover:bg-purple-900 transition-colors"
            >
              Add contact
            </button>
          </div>
        </div>
      )) : (
        <div className={`rounded-2xl border px-4 py-3 text-xs ${dark ? "bg-[#12201a] border-gray-700 text-gray-400" : "bg-gray-50 border-gray-100 text-gray-500"}`}>
          Only farmers and admin can register support contacts — you're viewing the established support team below.
        </div>
      )}

      {/* Established contacts */}
      <div className={`rounded-[28px] border shadow-sm overflow-hidden ${card}`}>
        <div className={`px-5 py-4 border-b ${dark ? "border-gray-700" : "border-gray-100"} flex flex-wrap items-center justify-between gap-2`}>
          <div>
            <h3 className="font-bold">Support team</h3>
            <p className={`text-xs mt-0.5 ${muted}`}>{contacts.length} established contact{contacts.length === 1 ? "" : "s"}</p>
          </div>
          {selectMode ? (
            <div className="flex items-center gap-2">
              <button onClick={toggleAll} className="text-xs font-semibold text-gray-500 hover:text-gray-700 underline">
                {allChecked ? "Clear" : "Select all"}
              </button>
              <button
                onClick={() => {
                  setSelectMode(false);
                  setCheckedIds([]);
                }}
                className="text-xs font-semibold text-gray-500 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setBulkDeleteOpen(true)}
                disabled={checkedIds.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Delete selected ({checkedIds.length})
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              disabled={removableIds.length === 0}
              className="text-xs font-semibold text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-500 rounded-xl px-3 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Select contacts
            </button>
          )}
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Loading…</div>
        ) : contacts.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className={`text-sm ${muted}`}>No support contacts registered yet.</p>
            {canProvide && <p className="text-xs mt-1 text-gray-400">Click "Add contact" above to publish the first one.</p>}
          </div>
        ) : (
          <div className="p-5 grid gap-3 sm:grid-cols-2">
            {contacts.map((c) => {
              const mine = myId !== "" && c.userId === myId;
              const removable = canEdit(c);
              return (
                <div
                  key={c.id}
                  className={`rounded-2xl border p-4 relative ${
                    dark ? "bg-[#0d1813] border-gray-700" : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${avatarColor(c.name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-sm truncate">{c.name}</p>
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-300/50">
                          {c.role ?? "Support"}
                        </span>
                        {c.category && (
                          <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-300/50">
                            {c.category}
                          </span>
                        )}
                        {mine && (
                          <span className="text-[9px] uppercase font-bold text-green-700 dark:text-green-400">you</span>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {c.phone && (
                          <a href={`tel:${c.phone.replace(/[^+\d]/g, "")}`} className="block text-sm font-semibold text-purple-700 dark:text-purple-300 break-all">
                            {c.phone}
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="block text-sm font-semibold text-purple-700 dark:text-purple-300 break-all">
                            {c.email}
                          </a>
                        )}
                        {!c.phone && !c.email && c.contact && (
                          <a
                            href={c.contact.includes("@") ? `mailto:${c.contact}` : `tel:${c.contact.replace(/[^+\d]/g, "")}`}
                            className="block text-sm font-semibold text-purple-700 dark:text-purple-300 break-all"
                          >
                            {c.contact}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  {c.description ? (
                    <p className={`mt-2 text-sm leading-relaxed ${muted}`}>{c.description}</p>
                  ) : (
                    <p className={`mt-2 text-xs italic ${muted}`}>No description provided.</p>
                  )}
                  {removable && (
                    <div className="mt-3 flex items-center gap-2">
                      {selectMode && (
                        <label className={`inline-flex items-center gap-2 text-xs font-semibold cursor-pointer ${dark ? "text-gray-400" : "text-gray-500"}`}>
                          <input
                            type="checkbox"
                            checked={c.id != null && checkedIds.includes(c.id)}
                            onChange={() => toggleChecked(c.id)}
                            className="accent-purple-700 w-4 h-4"
                            aria-label={`Select ${c.name}`}
                          />
                          Select
                        </label>
                      )}
                      {canProvide && (
                        <button
                          onClick={() => startEdit(c)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-purple-200 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteContact(c)}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteContact != null}
        title="Remove support contact?"
        message={
          <>
            Remove <b>{deleteContact?.name ?? "this contact"}</b>'s support profile from the support team?
          </>
        }
        busy={deleting}
        onCancel={() => !deleting && setDeleteContact(null)}
        onConfirm={remove}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Remove selected contacts?"
        message={
          <>
            Remove <b>{checkedIds.length}</b> support contact
            {checkedIds.length === 1 ? "" : "s"} from the support team?
          </>
        }
        busy={deleting}
        onCancel={() => !deleting && setBulkDeleteOpen(false)}
        onConfirm={removeSelected}
      />
    </div>
  );
}