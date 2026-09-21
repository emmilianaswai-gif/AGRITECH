import { useServices } from "../context/ServicesContext";
import { services } from "../data/services";
import { useUser } from "../context/UserContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useGetStarted } from "../context/GetStartedContext";
import { useAccess } from "../context/AccessContext";
import { roleLabel, accessRate } from "../data/access";

export default function AppSidebar() {
  const { active, open } = useServices();
  const { user, logout } = useUser();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { open: openGetStarted } = useGetStarted();
  const { canAccess, servicesOf } = useAccess();
  const dark = theme === "dark";

  const dashboardBtn = (
    <button
      onClick={() => open(null)}
      title="Dashboard"
      className={`w-full flex items-center gap-3 rounded-2xl px-3 py-3 mb-4 text-left transition-all ${
        active === null
          ? "bg-gradient-to-r from-green-700 to-green-600 text-white shadow-lg shadow-green-700/25"
          : "bg-green-50 dark:bg-[#1d2a23] text-green-800 dark:text-green-200 border border-green-100 dark:border-green-900 hover:bg-green-100 dark:hover:bg-[#243429]"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          active === null ? "bg-white/20 text-white" : "bg-green-700 text-white"
        }`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold truncate">{t("dashboard")}</p>
        <p className={`text-xs truncate ${active === null ? "text-green-100" : "text-green-600 dark:text-green-400"}`}>
          {t("dashboard_sub")}
        </p>
      </div>
    </button>
  );

  const serviceBtn = (service: (typeof services)[number]) => {
    const isActive = active === service.id;
    const allowed = canAccess(user?.role, service.id);
    return (
      <button
        key={service.id}
        onClick={() => allowed && open(service.id)}
        title={allowed ? service.label : `${service.label} (locked)`}
        disabled={!allowed}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors ${
          isActive
            ? "bg-green-800 text-white shadow-md shadow-green-800/20"
            : allowed
              ? "hover:bg-gray-100 dark:hover:bg-[#1d2a23]"
              : "opacity-45 cursor-not-allowed"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isActive ? "bg-green-700 text-white" : service.color
          }`}
        >
          {service.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold truncate ${isActive ? "text-white" : dark ? "text-gray-100" : "text-gray-900"}`}>
            {service.label}
          </p>
          <p className={`text-xs truncate ${isActive ? "text-green-200" : dark ? "text-gray-400" : "text-gray-500"}`}>
            {service.description}
          </p>
        </div>
        {!allowed && (
          <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`block flex-shrink-0 border-r transition-colors ${
        dark ? "bg-[#0d1813] border-gray-700" : "bg-white border-gray-100"
      }`}
      style={{ width: 288 }}
    >
      <div className="sticky top-14 h-[calc(100dvh-3.5rem)] flex flex-col">
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <div className="px-3 pb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t("menu")}</p>
          </div>

          {dashboardBtn}

          <div className="px-3 pb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{t("services")}</p>
          </div>
          <nav className="space-y-1">
            {services.map((service) => serviceBtn(service))}
          </nav>
        </div>

        {/* Account / Logout */}
        <div className={`shrink-0 border-t px-3 py-3 ${dark ? "border-gray-700" : "border-gray-100"}`}>
          <div
            className={`rounded-2xl border p-3 ${
              dark ? "bg-[#12201a] border-gray-700" : "bg-gray-50 border-gray-100"
            }`}
          >
            {user ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold flex-shrink-0">
                    {(user.fullName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{user.fullName}</p>
                    <p className={`text-[11px] truncate ${dark ? "text-green-300" : "text-green-700"}`}>
                      {roleLabel(user.role)}
                    </p>
                  </div>
                </div>

                <div
                  className={`mt-3 rounded-xl px-3 py-2.5 border ${
                    dark ? "bg-[#0d1813] border-gray-700" : "bg-white border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] ${dark ? "text-gray-400" : "text-gray-500"}`}>Role</span>
                    <span className="text-[11px] font-bold text-green-700 dark:text-green-400">
                      {roleLabel(user.role)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[11px] ${dark ? "text-gray-400" : "text-gray-500"}`}>Access</span>
                    <span className="text-[11px] font-bold text-green-700 dark:text-green-400">
                      {accessRate(user.role)} ·{" "}
                      {user.role === "SUPER_ADMIN" ? services.length : servicesOf(user.role).length} services
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs font-bold">Account</p>
                <button
                  onClick={() => openGetStarted()}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-green-800 px-3 py-2.5 text-xs font-bold text-white hover:bg-green-900 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M13.5 8.25a.75.75 0 100-1.5.75.75 0 000 1.5zM4.5 7.5a48.667 48.667 0 00-1.5 7.5m1.5-7.5a48.667 48.667 0 001.5-7.5M4.5 7.5H21m-16.5 7.5c.107.644.237 1.281.39 1.908M19.5 15v-7.5M19.5 15c-.107.644-.237 1.281-.39 1.908" />
                  </svg>
                  {t("login")} / {t("signup")}
                </button>
              </>
            )}
          </div>

          {user && (
            <button
              onClick={() => logout()}
              className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-md shadow-red-600/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              {t("logout") === "logout" ? "Log out" : t("logout")}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}