import { useMemo, useState, useCallback, type FormEvent } from "react";
import { usersApi, type UserRequest, type Role, type UserResponse } from "../api/client";
import { useAccess, CORE_ROLES } from "../context/AccessContext";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { services } from "../data/services";
import { roleLabel } from "../data/access";

const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-indigo-500",
  "bg-fuchsia-500",
  "bg-teal-500",
  "bg-orange-500",
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

function badgeClass(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
    case "ADMIN":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300/50";
    case "FAMER":
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-300/50";
    case "SUPPLIER":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300/50";
    default:
      return "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-300/50";
  }
}

const roleOf = (u: UserResponse) => (u.role ?? "FAMER").toUpperCase();

export default function RoleAccess() {
  const { roles, save, addRole, removeRole, refresh, servicesOf } = useAccess();
  const { user: me } = useUser();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [filterRole, setFilterRole] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [editing, setEditing] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Record<string, string[]> | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [view, setView] = useState<"permissions" | "members">("permissions");
  const [showAddMember, setShowAddMember] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [addMember, setAddMember] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
    address: "",
    location: "",
    role: "FAMER",
  });

  const loadUsers = useCallback(async () => {
    try {
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    }
  }, []);

  const load = useCallback(async () => {
    await Promise.all([loadUsers(), refresh()]);
    setDraft(null);
  }, [loadUsers, refresh]);

  const isSuperAdmin = me?.role === "SUPER_ADMIN";
  const canEnroll = isSuperAdmin || me?.role === "ADMIN" || me?.role === "FAMER";
  const currentView = isSuperAdmin ? view : "members";
  const dismiss = () => setError("");
  const clearNotice = () => setNotice("");

  const departmentOf = (u: UserResponse) =>
    (u.location ?? u.address ?? "").trim() || "Not set";

  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => set.add(departmentOf(u)));
    return [...set].sort();
  }, [users]);

  const roleRows = roles.filter((r) => r !== "SUPER_ADMIN" && (isSuperAdmin || r !== "ADMIN"));
  const membersOf = (role: string) => users.filter((u) => roleOf(u) === role);
  const serviceIds = services.map((s) => s.id);

  if (!canEnroll) {
    return (
      <div className={`rounded-[28px] border p-10 text-center ${dark ? "bg-[#12201a] border-gray-700" : "bg-white border-gray-100"}`}>
        <p className="text-sm text-gray-500">Only the Super Admin, admins, and farmers can manage members.</p>
      </div>
    );
  }

  const draftOf = (role: string) =>
    draft && draft[role] !== undefined ? draft[role] : servicesOf(role);

  const toggleRolePage = (role: string, serviceId: string) => {
    dismiss();
    clearNotice();
    const current = draftOf(role);
    const next = current.includes(serviceId)
      ? current.filter((s) => s !== serviceId)
      : [...current, serviceId];
    setDraft((d) => ({ ...(d ?? {}), [role]: next }));
  };

  const sameList = (a: string[], b: string[]) =>
    a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");

  const dirtyRoles = roleRows.filter(
    (r) => draft && draft[r] !== undefined && !sameList(draft[r], servicesOf(r)),
  );

  const unsaved = roleRows.reduce((n, r) => {
    if (!draft || draft[r] === undefined) return n;
    const cur = servicesOf(r);
    const nx = draft[r];
    return n + cur.filter((s) => !nx.includes(s)).length + nx.filter((s) => !cur.includes(s)).length;
  }, 0);

  const saveChanges = async () => {
    if (dirtyRoles.length === 0) return;
    dismiss();
    clearNotice();
    setSavingAll(true);
    try {
      for (const r of dirtyRoles) await save(r, draft?.[r] ?? []);
      setDraft(null);
      setNotice(
        `Saved ${dirtyRoles.length} role${dirtyRoles.length > 1 ? "s" : ""} — changes now apply to every user of each role.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSavingAll(false);
    }
  };

  const discardChanges = () => {
    setDraft(null);
    clearNotice();
  };

  const handleDeleteRole = async (role: string) => {
    if (CORE_ROLES.includes(role as (typeof CORE_ROLES)[number])) return;
    const count = membersOf(role).length;
    if (!window.confirm(`Delete role "${role}"?${count ? ` ${count} user(s) keep the role but lose all page access.` : ""}`)) return;
    dismiss();
    clearNotice();
    setBusy(`delete-${role}`);
    try {
      await removeRole(role);
      setNotice(`Role "${role}" deleted.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete role");
    } finally {
      setBusy("");
    }
  };

  const handleAddRole = async () => {
    const name = window.prompt("New role name, e.g. AUDITOR");
    if (!name) return;
    const clean = name.trim().toUpperCase();
    if (clean === "SUPER_ADMIN") {
      setError("Super Admin is always full access and cannot be added.");
      return;
    }
    if (roles.includes(clean)) {
      setError("That role already exists.");
      return;
    }
    dismiss();
    clearNotice();
    try {
      await addRole(clean);
      setNotice(`Role "${clean}" added. Set its pages below, then Save Changes to apply it to all ${clean} users.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add role");
    }
  };

  const handleEnroll = async (e: FormEvent) => {
    e.preventDefault();
    dismiss();
    clearNotice();
    setAddingMember(true);
    try {
      const payload: UserRequest = {
        fullName: addMember.fullName.trim(),
        email: addMember.email.trim(),
        password: addMember.password,
        phoneNumber: addMember.phoneNumber.trim(),
        address: addMember.address.trim(),
        location: addMember.location.trim(),
        role: addMember.role as Role,
      };
      const created = await usersApi.enroll(payload, me?.role ?? "FAMER");
      setShowAddMember(false);
      setAddMember({ fullName: "", email: "", password: "", phoneNumber: "", address: "", location: "", role: "FAMER" });
      await loadUsers();
      setNotice(`${created.fullName || "New member"} created — they will set their own password on first login.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create member");
    } finally {
      setAddingMember(false);
    }
  };

  const startEdit = (u: UserResponse) => {
    if (roleOf(u) === "SUPER_ADMIN") {
      setError("Super Admin role cannot be changed.");
      return;
    }
    setEditing(u.id);
    setEditRole(roleOf(u));
  };

  const applyEdit = async (u: UserResponse) => {
    dismiss();
    clearNotice();
    if (!u.id) throw new Error("Missing user id");
    setBusy(`edit-${u.id}`);
    try {
      await usersApi.updateRole(u.id, editRole);
      await loadUsers();
      setEditing(null);
      setNotice(`${u.fullName} moved to ${roleLabel(editRole)} — now inherits that role's pages.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setBusy("");
    }
  };

  const revokeRole = (role: string) => {
    if (role === "SUPER_ADMIN") return;
    const count = membersOf(role).length;
    if (!window.confirm(`Revoke all pages for ${roleLabel(role)}? All ${count} ${roleLabel(role)} user(s) will lose every page. Super Admin can restore it here.`)) return;
    dismiss();
    clearNotice();
    setDraft((d) => ({ ...(d ?? {}), [role]: [] }));
    setNotice(`Staged: all pages revoked for ${roleLabel(role)}. Click Save Changes to apply to its users.`);
  };

  const filtered = users.filter((u) => {
    if (filterRole !== "all" && roleOf(u) !== filterRole) return false;
    if (filterDept !== "all" && departmentOf(u) !== filterDept) return false;
    return true;
  });

  const card = dark ? "bg-[#12201a] border-gray-700" : "bg-white border-gray-100";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const selectClass = `px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
    dark ? "bg-[#0d1813] border-gray-700 text-gray-100" : "bg-gray-50 border-gray-200 text-gray-900"
  }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-800 rounded-[28px] p-6 sm:p-8 text-white shadow-lg shadow-indigo-900/20">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-indigo-300 text-[11px] font-semibold uppercase tracking-widest">Access Control</p>
            <h2 className="text-xl sm:text-2xl font-extrabold mt-1">
              Cloud App Access Management UI – Clean &amp; Secure
            </h2>
            <p className="mt-1.5 text-indigo-200/80 text-sm max-w-xl">
              {isSuperAdmin
                ? "Set pages per role — stage your changes, then click Save Changes to apply them to every user in that role. Super Admin always has full access."
                : "Enroll new members for your organization and manage who is part of the app. New members set their own password on first login."}
            </p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={handleAddRole}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add role
            </button>
          )}
        </div>
      </div>

      {notice && (
      <div className={`text-sm rounded-2xl px-4 py-3 ${dark ? "bg-green-900/40 text-green-200 border border-green-800" : "bg-green-50 text-green-800 border border-green-100"}`}>
        {notice}
        <button onClick={clearNotice} className="ml-2 text-xs underline">dismiss</button>
      </div>
    )}
    {error && (
      <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>
    )}

    {unsaved > 0 && (
      <div
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl px-5 py-3.5 shadow-2xl border ${
          dark ? "bg-[#0d1813] border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
        <span className={`text-sm font-semibold ${muted}`}>
          {unsaved} unsaved change{unsaved > 1 ? "s" : ""}
        </span>
        <button
          onClick={discardChanges}
          disabled={savingAll}
          className="ml-2 px-3 py-2 rounded-xl border text-xs font-semibold text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          Discard
        </button>
        <button
          onClick={saveChanges}
          disabled={savingAll || dirtyRoles.length === 0}
          className="px-4 py-2 rounded-xl bg-green-800 text-white text-xs font-bold hover:bg-green-900 disabled:opacity-40 transition-colors"
        >
          {savingAll ? "Saving..." : `Save Changes (${dirtyRoles.length})`}
        </button>
      </div>
    )}

      {/* Sidebar + pages */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {isSuperAdmin && (
        <aside
          className={`lg:w-56 w-full shrink-0 rounded-[28px] border shadow-sm overflow-hidden ${card}`}
        >
          <div className="p-2 grid grid-cols-2 gap-1.5 lg:grid-cols-1">
            <button
              onClick={() => setView("permissions")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                currentView === "permissions"
                  ? "bg-indigo-700 text-white shadow-md shadow-indigo-900/20"
                  : dark
                    ? "text-gray-300 hover:bg-gray-800"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Role Permission
            </button>
            <button
              onClick={() => setView("members")}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                currentView === "members"
                  ? "bg-indigo-700 text-white shadow-md shadow-indigo-900/20"
                  : dark
                    ? "text-gray-300 hover:bg-gray-800"
                    : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              Members
            </button>
          </div>
        </aside>
        )}

        <div className="flex-1 min-w-0 space-y-6">
          {currentView === "permissions" && (
      <div className={`rounded-[28px] border shadow-sm overflow-hidden ${card}`}>
        <div className={`px-5 py-4 border-b ${dark ? "border-gray-700" : "border-gray-100"} flex flex-wrap items-center justify-between gap-2`}>
          <div>
            <h3 className="font-bold">Roles &amp; Permissions</h3>
            <p className={`text-xs mt-0.5 ${muted}`}>
              Toggle a page to stage a change for <b>all users of that role</b> — then press Save Changes to apply it.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className={`text-left border-b ${dark ? "border-gray-700" : "border-gray-100"}`}>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Users</th>
                <th className="px-4 py-3 font-semibold">Pages (applied to all users)</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {roleRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`px-5 py-10 text-center ${muted}`}>
                    No roles configured yet. Add one above.
                  </td>
                </tr>
              ) : (
                roleRows.map((role) => {
                  const members = membersOf(role);
                  const granted = draftOf(role);
                  const isCore = CORE_ROLES.includes(role as (typeof CORE_ROLES)[number]);
                  return (
                    <tr key={role} className="align-top">
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${badgeClass(role)}`}>
                            {roleLabel(role)}
                          </span>
                          {!isCore && (
                            <button
                              onClick={() => handleDeleteRole(role)}
                              disabled={busy === `delete-${role}`}
                              title="Delete this role"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {!isCore && <p className={`text-[10px] mt-1 ${muted}`}>Custom role</p>}
                      </td>

                      <td className="px-4 py-4">
                        {members.length === 0 ? (
                          <p className={`text-xs ${muted}`}>No users yet</p>
                        ) : (
                          <>
                            <div className="flex -space-x-2">
                              {members.slice(0, 3).map((m) => (
                                <div
                                  key={m.id}
                                  title={m.fullName}
                                  className={`w-7 h-7 rounded-full ring-2 ${dark ? "ring-[#12201a]" : "ring-white"} ${avatarColor(m.fullName)} flex items-center justify-center text-white text-[9px] font-bold`}
                                >
                                  {initials(m.fullName)}
                                </div>
                              ))}
                              {members.length > 3 && (
                                <div className={`w-7 h-7 rounded-full ring-2 ${dark ? "ring-[#12201a]" : "ring-white"} bg-gray-400 flex items-center justify-center text-white text-[9px] font-bold`}>
                                  +{members.length - 3}
                                </div>
                              )}
                            </div>
                            <p className={`text-[11px] mt-1.5 ${muted}`}>
                              {members.length} user{members.length > 1 ? "s" : ""} · {members.slice(0, 2).map((m) => m.fullName.split(" ")[0]).join(", ")}
                            </p>
                          </>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-x-4 gap-y-2 max-w-[380px]">
                          {serviceIds.map((id) => {
                            const on = granted.includes(id);
                            return (
                              <button
                                key={id}
                                onClick={() => toggleRolePage(role, id)}
                                disabled={savingAll}
                                title={`${roleLabel(role)} · ${id}${on ? " granted" : " denied"}`}
                                className={`inline-flex items-center gap-1.5 ${muted}`}
                              >
                                <span
                                  className={`w-8 h-[18px] rounded-full relative transition-colors ${on ? "bg-green-600" : dark ? "bg-gray-700" : "bg-gray-300"} ${savingAll ? "opacity-50" : ""}`}
                                >
                                  <span
                                    className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all ${
                                      on ? "left-[16px]" : "left-[2px]"
                                    }`}
                                  />
                                </span>
                                <span className="text-[10px] capitalize">{id}</span>
                              </button>
                            );
                          })}
                        </div>
                        {granted.length === 0 && <p className={`text-xs mt-1 ${muted}`}>All pages revoked for this role.</p>}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => revokeRole(role)}
                          disabled={savingAll}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                          </svg>
                          Revoke Access
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
          )}

          {currentView === "members" && (
      <div className={`rounded-[28px] border shadow-sm overflow-hidden ${card}`}>
        <div className={`px-5 py-4 border-b ${dark ? "border-gray-700" : "border-gray-100"} flex flex-wrap items-end gap-3`}>
          <div>
            <h3 className="font-bold">Members</h3>
            <p className={`text-xs mt-0.5 ${muted}`}>
              Edit which role each user belongs to — permissions follow the role.
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Filter by Role</label>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={selectClass}>
                <option value="all">All roles</option>
                {roleRows.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Filter by Department</label>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className={selectClass}>
                <option value="all">All departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAddMember(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-green-800 text-white hover:bg-green-900 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              Add member
            </button>
            <button
              onClick={() => load()}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border text-green-700 dark:text-green-300 border-green-200 dark:border-gray-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className={`text-left border-b ${dark ? "border-gray-700" : "border-gray-100"}`}>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Pages</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className={`px-5 py-10 text-center ${muted}`}>
                    No users match the current filters.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const role = roleOf(u);
                  const isLocked = role === "SUPER_ADMIN";
                  const isSelf = me?.id === u.id;
                  const granted = servicesOf(role);
                  return (
                    <tr key={u.id} className="align-top">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${avatarColor(u.fullName)} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}
                          >
                            {initials(u.fullName)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold truncate">
                              {u.fullName}
                              {isSelf && <span className="ml-1.5 text-[9px] uppercase text-green-700 dark:text-green-400">you</span>}
                            </p>
                            <p className={`text-xs truncate ${muted}`}>{u.email ?? u.phoneNumber}</p>
                            <p className={`hidden sm:block text-[10px] mt-0.5 ${muted}`}>
                              {departmentOf(u)} · {u.phoneNumber}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${badgeClass(role)}`}>
                          {isLocked ? "Super Admin" : roleLabel(role)}
                        </span>
                        {isLocked && <p className={`text-[10px] mt-1 ${muted}`}>Full access · cannot be edited</p>}
                      </td>

                      <td className="px-4 py-3.5">
                        {granted.length === 0 ? (
                          <p className={`text-xs ${muted}`}>No pages granted</p>
                        ) : (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${dark ? "border-gray-700 bg-[#0d1813] text-gray-200" : "border-gray-200 bg-gray-50 text-gray-700"}`}>
                            <span className="text-green-600 dark:text-green-400">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </span>
                            {granted.length} page{granted.length > 1 ? "s" : ""} · {isLocked ? "All" : `as ${roleLabel(role)}`}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        {editing === u.id && !isLocked ? (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className={`${selectClass} !py-1.5 text-xs`}
                              autoFocus
                            >
                              {roleRows.map((r) => (
                                <option key={r} value={r}>
                                  {roleLabel(r)}
                                </option>
                              ))}
                            </select>
                            <div className="flex gap-2">
                              <button
                                onClick={() => applyEdit(u)}
                                disabled={busy === `edit-${u.id}` || editRole === role}
                                className="px-3 py-1.5 bg-green-800 text-white text-xs font-bold rounded-lg hover:bg-green-900 disabled:opacity-40 transition-colors"
                              >
                                {busy === `edit-${u.id}` ? "Saving..." : "Apply"}
                              </button>
                              <button
                                onClick={() => setEditing(null)}
                                className="px-3 py-1.5 rounded-lg border text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                            <button
                              onClick={() => startEdit(u)}
                              disabled={isLocked || busy === `edit-${u.id}`}
                              className="flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-indigo-700 hover:bg-indigo-800 disabled:opacity-40 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                              Edit Role
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
          )}
        </div>
      </div>

      {/* Footer branding */}
      <div className="flex justify-center pt-2 pb-4">
        <div className="flex items-center gap-3 bg-black text-white rounded-full pl-4 pr-6 py-2.5 shadow-lg">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089a1.125 1.125 0 01-1.272 1.117l-1.527-.255a2.25 2.25 0 01-1.893-2.037l-.017-.152a11.24 11.24 0 01-1.04-4.993l.002-1.312M6.115 5.19l.318-1.912a1.044 1.044 0 011.195-.879c1.676.264 3.3.818 4.793 1.626v6.453M6.115 5.19H3.727a7.5 7.5 0 01-.427.424M13.288 2.884A17.247 17.247 0 0115.75 2.25c2.03 0 3.968.288 5.81.84.318.095.542.372.586.75a5.25 5.25 0 01.101 1.08v7.569M7.5 22.5h9" />
            </svg>
          </div>
          <span className="text-lg font-extrabold tracking-tight">Bilions</span>
        </div>
      </div>

      {showAddMember && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !addingMember && setShowAddMember(false)} />
          <div className={`relative w-full max-w-lg rounded-[28px] border shadow-2xl overflow-hidden transition-colors ${dark ? "bg-[#0d1813] border-gray-700" : "bg-white border-gray-100"}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold">Add member</h3>
              <button
                onClick={() => !addingMember && setShowAddMember(false)}
                disabled={addingMember}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-40"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEnroll} className="p-6 space-y-4">
              <p className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>
                Create an account with a temporary password. It is never shown again — the member enters their
                username, old password and a new password on first login.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Full name *</label>
                  <input
                    type="text"
                    required
                    value={addMember.fullName}
                    onChange={(e) => setAddMember({ ...addMember, fullName: e.target.value })}
                    className={selectClass}
                    placeholder="Member name"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Phone number *</label>
                  <input
                    type="text"
                    required
                    value={addMember.phoneNumber}
                    onChange={(e) => setAddMember({ ...addMember, phoneNumber: e.target.value })}
                    className={selectClass}
                    placeholder="+255..."
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Email</label>
                  <input
                    type="email"
                    value={addMember.email}
                    onChange={(e) => setAddMember({ ...addMember, email: e.target.value })}
                    className={selectClass}
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Role *</label>
                  <select
                    value={addMember.role}
                    onChange={(e) => setAddMember({ ...addMember, role: e.target.value })}
                    className={selectClass}
                  >
                    {roleRows.map((r) => (
                      <option key={r} value={r}>
                        {roleLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Address</label>
                  <input
                    type="text"
                    value={addMember.address}
                    onChange={(e) => setAddMember({ ...addMember, address: e.target.value })}
                    className={selectClass}
                    placeholder="Street / city"
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Location</label>
                  <input
                    type="text"
                    value={addMember.location}
                    onChange={(e) => setAddMember({ ...addMember, location: e.target.value })}
                    className={selectClass}
                    placeholder="Region / district"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={`block text-xs font-semibold mb-1.5 ${muted}`}>Temporary password *</label>
                  <input
                    type="password"
                    required
                    value={addMember.password}
                    onChange={(e) => setAddMember({ ...addMember, password: e.target.value })}
                    className={selectClass}
                    placeholder="Set an initial password for this member"
                  />
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
              )}
              <button
                type="submit"
                disabled={addingMember}
                className="w-full px-6 py-3.5 bg-green-800 text-white font-bold rounded-xl hover:bg-green-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {addingMember ? "Creating..." : "Create member"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}