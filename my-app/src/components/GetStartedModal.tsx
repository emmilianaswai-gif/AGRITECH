import { useEffect, useState, type FormEvent } from "react";
import { usersApi, type Role, type UserRequest } from "../api/client";
import { useGetStarted } from "../context/GetStartedContext";
import { useUser } from "../context/UserContext";
import { useLanguage } from "../context/LanguageContext";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "../data/access";

const ROLES: Role[] = ["FAMER", "CUSTOMER", "SUPPLIER"];

const emptyForm: UserRequest = {
  fullName: "",
  email: "",
  password: "",
  phoneNumber: "",
  address: "",
  location: "",
  role: "CUSTOMER",
};

export default function GetStartedModal() {
  const { isOpen, close, presetRole } = useGetStarted();
  const { login } = useUser();
  const { t } = useLanguage();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [form, setForm] = useState<UserRequest>(emptyForm);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (isOpen && presetRole) {
      setMode("register");
      setForm((prev) => ({ ...prev, role: presetRole }));
      setRegistered(false);
      setError("");
    }
  }, [isOpen, presetRole]);

  if (!isOpen) return null;

  const handleChange = (field: keyof UserRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        const user = await usersApi.register(form);
        login(user);
        setRegistered(true);
      } else {
        const user = await usersApi.login(loginIdentifier, loginPassword);
        login(user);
        setRegistered(true);
      }
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

  const handleClose = () => {
    close();
    setForm(emptyForm);
    setError("");
    setRegistered(false);
    setLoginIdentifier("");
    setLoginPassword("");
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-gray-50 dark:bg-[#1d2a23] dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div className="relative bg-white dark:bg-[#0d1813] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-green-950 dark:text-green-100">
            {registered ? t("welcome") : mode === "register" ? t("signup") : t("welcome_back")}
          </h3>
          <button onClick={handleClose} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {registered ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {mode === "register"
                  ? "Your account has been created successfully. Our team will reach out shortly."
                  : "Signed in successfully. Welcome back!"}
              </p>
              <p className="text-sm text-gray-400 mb-6">You can now chat with farmers & customers directly.</p>
              <button
                onClick={handleClose}
                className="w-full px-6 py-3 bg-green-800 text-white font-semibold rounded-xl hover:bg-green-900 transition-colors"
              >
                {t("done") === "done" ? "Done" : t("done")}
              </button>
            </div>
          ) : (
            <>
              <div className="flex bg-gray-100 dark:bg-[#1d2a23] rounded-xl p-1 mb-5">
                <button
                  onClick={() => { setMode("register"); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    mode === "register"
                      ? "bg-white dark:bg-[#2a3def] text-green-800 dark:text-white shadow"
                      : "text-gray-500"
                  }`}
                >
                  {t("signup")}
                </button>
                <button
                  onClick={() => { setMode("login"); setError(""); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    mode === "login"
                      ? "bg-white dark:bg-[#2a3d2a] text-green-800 dark:text-white shadow"
                      : "text-gray-500"
                  }`}
                >
                  {t("login")}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "register" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("full_name")}</label>
                      <input
                        type="text"
                        required
                        value={form.fullName}
                        onChange={(e) => handleChange("fullName", e.target.value)}
                        className={inputClass}
                        placeholder="e.g. John Mwangi"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("email")}</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        className={inputClass}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("phone")}</label>
                      <input
                        type="tel"
                        required
                        value={form.phoneNumber}
                        onChange={(e) => handleChange("phoneNumber", e.target.value)}
                        className={inputClass}
                        placeholder="+255 7XX XXX XXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("password")}</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={form.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        className={inputClass}
                        placeholder="At least 6 characters"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("address")}</label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        className={inputClass}
                        placeholder="Farm / plot address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("location")}</label>
                      <input
                        type="text"
                        value={form.location}
                        onChange={(e) => handleChange("location", e.target.value)}
                        className={inputClass}
                        placeholder="Region / province"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("i_am")}</label>
                      <div className="grid grid-cols-2 gap-2">
                        {ROLES.map((role) => (
                          <button
                            type="button"
                            key={role}
                            onClick={() => handleChange("role", role)}
                            className={`text-left rounded-xl px-3 py-2.5 border text-xs font-semibold transition-colors ${
                              form.role === role
                                ? "border-green-600 bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                                : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {ROLE_LABELS[role]}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {ROLE_DESCRIPTIONS[(form.role ?? "FAMER") as Role] ?? ROLE_DESCRIPTIONS.FAMER}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email or phone number</label>
                      <input
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className={inputClass}
                        placeholder="you@example.com or +255..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("password")}</label>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className={inputClass}
                        placeholder="Your password"
                      />
                    </div>
                  </>
                )}

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-green-800 text-white font-semibold rounded-xl hover:bg-green-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? t("creating") : mode === "register" ? t("create_account") : t("sign_in")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}