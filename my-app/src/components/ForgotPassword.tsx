import { useState, type FormEvent } from "react";
import { authApi } from "../api/client";
import { useTheme } from "../context/ThemeContext";

export default function ForgotPassword({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
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

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) {
      setError("Enter your email or phone number.");
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword(identifier.trim());
      setStep("reset");
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.trim().length === 0) {
      setError("Enter the 6-digit code.");
      return;
    }
    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(identifier.trim(), code.trim(), newPassword);
      setStep("done");
    } catch (err) {
      setError(cleanError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const labelClass = `block text-sm font-semibold mb-1.5 ${dark ? "text-gray-200" : "text-gray-700"}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div
        className={`relative w-full max-w-md rounded-[28px] border shadow-2xl overflow-hidden transition-colors ${
          dark ? "bg-[#0d1813] border-gray-700" : "bg-white border-gray-100"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold">Reset password</h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-40"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {step === "email" && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>
                Enter your email or phone number and we'll send a 6-digit code to reset your password.
              </p>
              <div>
                <label className={labelClass}>Email or phone number</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com or +255..."
                  autoFocus
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
                {loading ? "Sending..." : "Send code"}
              </button>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className={`text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>
                Code sent to <b>{identifier}</b>. It expires in 10 minutes.
              </p>
              <div>
                <label className={labelClass}>6-digit code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className={inputClass}
                  placeholder="e.g. 482913"
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
                  placeholder="Repeat the password"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(""); }}
                  disabled={loading}
                  className="px-4 py-3.5 rounded-xl border text-sm font-semibold text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3.5 bg-green-800 text-white font-bold rounded-xl hover:bg-green-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Updating..." : "Update password"}
                </button>
              </div>
            </form>
          )}

          {step === "done" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className={`mb-2 ${dark ? "text-gray-200" : "text-gray-700"}`}>Password updated successfully.</p>
              <p className={`text-sm mb-6 ${dark ? "text-gray-400" : "text-gray-500"}`}>
                You can now log in with your new password.
              </p>
              <button
                onClick={onClose}
                disabled={loading}
                className="w-full px-6 py-3 bg-green-800 text-white font-semibold rounded-xl hover:bg-green-900 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}