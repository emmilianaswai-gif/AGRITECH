import { useEffect, useState, type FormEvent } from "react";
import { storeApi, usersApi, type Store } from "../api/client";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { useGetStarted } from "../context/GetStartedContext";
import { useAccess } from "../context/AccessContext";
import { roleLabel } from "../data/access";
import ForgotPassword from "./ForgotPassword";

const STORE_CATEGORIES = ["Agro-dealer", "Seeds", "Equipment", "Fertilizer", "Cooperative", "Other"];

const emptyStore = {
  ownerName: "",
  phone: "",
  email: "",
  password: "",
  name: "",
  category: "",
  location: "",
  description: "",
};

function StoreRegisterModal({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const { login } = useUser();
  const dark = theme === "dark";
  const [form, setForm] = useState(emptyStore);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const inputClass = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
    dark
      ? "bg-[#12201a] border-gray-700 text-gray-100"
      : "bg-white border-gray-200 text-gray-900"
  }`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) {
      setError("Store name is required.");
      return;
    }
    if (!form.ownerName.trim() || !form.phone.trim() || !form.email.trim()) {
      setError("Your full name, phone number and email are required to create your account.");
      return;
    }
    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    try {
      const user = await usersApi.register({
        fullName: form.ownerName.trim(),
        email: form.email.trim(),
        password: form.password,
        phoneNumber: form.phone.trim(),
        address: form.location.trim(),
        location: form.location.trim(),
        role: "CUSTOMER",
      });
      login(user);

      try {
        await storeApi.create({
          name: form.name.trim(),
          category: form.category.trim() || null,
          location: form.location.trim() || null,
          description: form.description.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          rating: null,
        });
      } catch (storeErr) {
        setError(
          "Your account was created, but registering the store failed: " +
            (storeErr instanceof Error ? storeErr.message : "try again later"),
        );
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create the account. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] ${
          dark ? "bg-[#0d1813] border border-gray-700" : "bg-white"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold">Register your Agri Store</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {done ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-1 font-semibold">Welcome!</p>
              <p className="text-sm text-gray-400 mb-6">
                Your account and Agri Store were created. You're signed in — start selling.
              </p>
              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-green-800 text-white font-semibold rounded-xl hover:bg-green-900 transition-colors"
              >
                Start using the app
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label required>Full name</Label>
                <input
                  type="text"
                  required
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. John Mwangi"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>Phone number</Label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className={inputClass}
                    placeholder="+255..."
                  />
                </div>
                <div>
                  <Label required>Email</Label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputClass}
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              <div>
                <Label required>Password</Label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputClass}
                  placeholder="At least 6 characters"
                />
              </div>

              <div className={`border-t ${dark ? "border-gray-700" : "border-gray-200"} pt-4`}>
                <p className={`text-xs font-bold uppercase tracking-wide mb-3 ${dark ? "text-gray-300" : "text-gray-700"}`}>
                  Store details
                </p>
                <div className="space-y-4">
                  <div>
                    <Label required>Store name</Label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. Mwangi Agro Supplies"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Category</Label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">Select...</option>
                        {STORE_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Location</Label>
                      <input
                        type="text"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                        className={inputClass}
                        placeholder="e.g. Arusha"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={2}
                      className={inputClass}
                      placeholder="What does your store supply?"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-green-800 text-white font-semibold rounded-xl hover:bg-green-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? "Creating account & store..." : "Create account & register store"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginScreen() {
  const { login, enterAsGuest } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { open: openGetStarted } = useGetStarted();
  const { roles } = useAccess();
  const dark = theme === "dark";

  const [identifier, setIdentifier] = useState("emmilianaswai@gmail.com");
  const [password, setPassword] = useState("123");
  const [role, setRole] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [showStore, setShowStore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>("");

  useEffect(() => {
    storeApi.getAll().then(setStores).catch(() => {});
  }, []);

  const matchedStores = stores.filter((s) => {
    const id = identifier.trim().toLowerCase();
    if (!id) return false;
    return (s.email?.toLowerCase() === id) || (s.phone?.toLowerCase() === id);
  });

  const loginRoles = roles.filter((r) => r !== "SUPER_ADMIN" && r !== "ADMIN");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await usersApi.login(identifier.trim(), password, role || undefined);
      login(user);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace("Request failed (500): ", "").trim()
          : "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
    dark
      ? "bg-[#12201a] border-gray-700 text-gray-100"
      : "bg-white border-gray-200 text-gray-900"
  }`;

  return (
    <div
      className={`min-h-screen font-sans transition-colors ${dark ? "bg-[#0b1410]" : "bg-[#f6f9f4]"}`}
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          className={`fixed top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
            dark
              ? "bg-[#12201a] border-gray-700 text-yellow-300"
              : "bg-white border-gray-200 text-gray-600"
          }`}
        >
          {dark ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>

        <div
          className={`w-full max-w-md rounded-[28px] border shadow-xl overflow-hidden transition-colors ${
            dark ? "bg-[#0d1813] border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          {/* Brand header */}
          <div className="bg-gradient-to-br from-green-800 to-green-600 px-8 py-8 text-center text-white">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">AgriConnect</h1>
            <p className="text-sm text-green-100 mt-1">Farmers & customers, trading directly.</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? "text-gray-200" : "text-gray-700"}`}>
                  Login as
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    dark
                      ? "bg-[#12201a] border-gray-700 text-gray-100"
                      : "border-gray-200 text-gray-900"
                  }`}
                >
                  <option value="">My account role (no category)</option>
                  {loginRoles.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
                <p className={`text-[11px] mt-1.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>
                  Only the Super Admin can log in as another category.
                </p>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? "text-gray-200" : "text-gray-700"}`}>
                  Email or phone number
                </label>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setSelectedStore(""); }}
                  className={inputClass}
                  placeholder="you@example.com or +255..."
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${dark ? "text-gray-200" : "text-gray-700"}`}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Your password"
                />
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className={`text-xs font-semibold hover:underline ${
                      dark ? "text-green-300" : "text-green-700"
                    }`}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              {matchedStores.length > 0 && (
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${dark ? "text-gray-200" : "text-gray-700"}`}>
                    Select your Agro Store
                  </label>
                  <select
                    value={selectedStore}
                    onChange={(e) => setSelectedStore(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      dark
                        ? "bg-[#12201a] border-gray-700 text-gray-100"
                        : "bg-white border-gray-200 text-gray-900"
                    }`}
                  >
                    <option value="">None (skip)</option>
                    {matchedStores.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name}{s.location ? ` — ${s.location}` : ""}
                      </option>
                    ))}
                  </select>
                  <p className={`text-[11px] mt-1.5 ${dark ? "text-gray-500" : "text-gray-400"}`}>
                    Optional — pick a store if you own one.
                  </p>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3.5 bg-green-800 text-white font-bold rounded-xl hover:bg-green-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Log in"}
              </button>
            </form>

            <div className={`my-6 flex items-center gap-3 text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              OTHER WAYS TO JOIN
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            <div className="space-y-3">
              <button
                onClick={enterAsGuest}
                className={`w-full flex items-center justify-center gap-2 rounded-xl border px-6 py-3 font-semibold text-sm transition-colors ${
                  dark
                    ? "border-gray-700 text-green-200 hover:bg-[#12201a]"
                    : "border-green-200 text-green-800 hover:bg-green-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c0-4.418 3.582-8 8-8m-8 8a9 9 0 01-8-8m8 8a8.964 8.964 0 008-8m-8 0h.008M21 12a9 9 0 00-9-9m0 0C7.029 3 3 7.029 3 12" />
                </svg>
                Use the app without an account
              </button>

              <button
                onClick={() => setShowStore(true)}
                className={`w-full flex items-center justify-center gap-2 rounded-xl border px-6 py-3 font-semibold text-sm transition-colors ${
                  dark
                    ? "border-gray-700 text-green-200 hover:bg-[#12201a]"
                    : "border-green-200 text-green-800 hover:bg-green-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
                </svg>
                Register your Agri Store
              </button>

              <button
                onClick={() => openGetStarted("FAMER")}
                className={`w-full flex items-center justify-center gap-2 rounded-xl border px-6 py-3 font-semibold text-sm transition-colors ${
                  dark
                    ? "border-gray-700 text-green-200 hover:bg-[#12201a]"
                    : "border-green-200 text-green-800 hover:bg-green-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                </svg>
                Create a farmer account
              </button>

              <button
                onClick={() => openGetStarted("CUSTOMER")}
                className={`w-full flex items-center justify-center gap-2 rounded-xl border px-6 py-3 font-semibold text-sm transition-colors ${
                  dark
                    ? "border-gray-700 text-green-200 hover:bg-[#12201a]"
                    : "border-green-200 text-green-800 hover:bg-green-50"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                Create a customer account
              </button>
            </div>
          </div>
        </div>
      </div>

      {showForgot && <ForgotPassword onClose={() => setShowForgot(false)} />}
      {showStore && <StoreRegisterModal onClose={() => setShowStore(false)} />}
    </div>
  );
}