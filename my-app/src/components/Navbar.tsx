import { useState } from "react";
import { useGetStarted } from "../context/GetStartedContext";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { LANGUAGES } from "../data/i18n";
import { roleLabel, accessRate } from "../data/access";

export default function Navbar() {
  const { open: openGetStarted } = useGetStarted();
  const { user, logout } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const dark = theme === "dark";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-sm border-b transition-colors ${
        dark ? "bg-[#0d1813]/95 border-gray-700" : "bg-white/95 border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between h-14 px-3 sm:px-6 max-w-[1920px] mx-auto w-full">
        <a href="#" className="flex items-center gap-2 group min-w-0">
          <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75" />
            </svg>
          </div>
          <span className={`text-lg font-bold leading-tight whitespace-nowrap truncate ${dark ? "text-green-100" : "text-green-900"}`}>
            {t("app_name")}
          </span>
        </a>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => { setShowLang((s) => !s); setShowMenu(false); }}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${
                dark ? "bg-[#1d2a23] text-green-100 hover:bg-[#243429]" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title={t("language")}
            >
              {LANGUAGES.find((l) => l.code === lang)?.flag ?? "🌐"}
            </button>
            {showLang && (
              <div
                className={`absolute right-0 mt-2 w-44 rounded-xl shadow-xl border overflow-hidden z-50 ${
                  dark ? "bg-[#12201a] border-gray-700" : "bg-white border-gray-100"
                }`}
              >
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setShowLang(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left transition-colors ${
                      lang === l.code ? "font-bold text-green-700 dark:text-green-400" : dark ? "text-gray-200 hover:bg-[#1d2a23]" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{l.flag}</span> {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-colors ${
              dark ? "bg-[#1d2a23] text-amber-300 hover:bg-[#243429]" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title={dark ? t("light_mode") : t("dark_mode")}
          >
            {dark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button
                onClick={() => { setShowMenu((s) => !s); setShowLang(false); }}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-[#1d2a23] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-sm">
                  {(user.fullName || "?").charAt(0).toUpperCase()}
                </div>
                <span className={`hidden sm:block text-sm font-semibold max-w-[120px] truncate ${dark ? "text-gray-100" : "text-gray-800"}`}>
                  {user.fullName}
                </span>
              </button>
              {showMenu && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-xl shadow-xl border overflow-hidden z-50 ${
                    dark ? "bg-[#12201a] border-gray-700" : "bg-white border-gray-100"
                  }`}
                >
                  <div className={`px-4 py-3 border-b ${dark ? "border-gray-700" : "border-gray-100"}`}>
                    <p className="font-bold text-sm">{user.fullName}</p>
                    <p className="text-xs opacity-60">{user.phoneNumber}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 rounded-full px-2 py-0.5">
                        {roleLabel(user.role)}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">· {accessRate(user.role)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); setShowMenu(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                      dark ? "text-red-400 hover:bg-[#1d2a23]" : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={openGetStarted}
                className="hidden sm:inline-flex items-center px-4 py-2 bg-green-800 text-white text-sm font-semibold rounded-xl hover:bg-green-900 transition-colors shadow-md shadow-green-800/20"
              >
                {t("signup")}
              </button>
              <button
                onClick={openGetStarted}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  dark ? "bg-[#1d2a23] text-green-100 hover:bg-[#243429]" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
                aria-label={t("login")}
                title={t("login")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}