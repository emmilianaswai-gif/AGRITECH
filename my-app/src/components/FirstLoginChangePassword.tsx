import { useState, type FormEvent } from "react";
import { usersApi } from "../api/client";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

export default function FirstLoginChangePassword() {
  const { user, login } = useUser();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [identifier, setIdentifier] = useState(user?.email || user?.phoneNumber || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputClass = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
    dark
      ? "bg-[#12201a] border-gray-700 text-gray-100"
      : "bg-white border-gray-200 text-gray-900"
  }`;

  const cleanError = (err: unknown) => {
    if (!(err instanceof Error)) return "Something went wrong";
    const raw = err.message.replace("Request failed (500): ", "").trim();
    try {
      const parsed = JSON.parse(raw);
      return parsed.error ?? parsed.message ?? raw;
    } catch {
      return raw;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) {
      setError("Enter your username (email or phone number).");
      return;
    }
    if (!oldPassword) {
      setError("Enter your old password.");
      return;
    }
    if (newPassword.length < 4) {
      setError("New password must be at least 4 characters.");
      return;
    }
    if (newPassword === oldPassword) {
      setError("New password must be different from the old one.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await usersApi.changePassword(identifier.trim(), oldPassword, newPassword);
      if (user) login({ ...user, mustChangePassword: false });
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  };

  const labelClass = `block text-sm font-semibold mb-1.5 ${dark ? "text-gray-200" : "text-gray-700"}`;

  return (
    <div
      className={`min-h-screen font-sans transition-colors ${dark ? "bg-[#0b1410]" : "bg-[#f6f9f4]"}`}
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className={`w-full max-w-md rounded-[28px] border shadow-xl overflow-hidden transition-colors ${
            dark ? "bg-[#0d1813] border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-800 px-8 py-8 text-center text-white">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Change password</h1>
            <p className="text-sm text-indigo-100 mt-1">
              For your security, set a new password before continuing.
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Username (email or phone number)</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com or +255..."
                />
              </div>
              <div>
                <label className={labelClass}>Old password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Password given to you"
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                  placeholder="At least 4 characters"
                />
              </div>
              <div>
                <label className={labelClass}>Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Repeat the new password"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3.5 bg-green-800 text-white font-bold rounded-xl hover:bg-green-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Change password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}