import { useServices } from "../context/ServicesContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useUser } from "../context/UserContext";
import { useAccess } from "../context/AccessContext";

const HomeIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const ChatIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-8.25 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm12 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);

const AdviceIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
);

const StoresIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .414.336.75.75.75z" />
  </svg>
);

const TradeIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const BuyIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
  </svg>
);

export default function MobileTabBar() {
  const { active, open } = useServices();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user } = useUser();
  const { canAccess } = useAccess();
  const dark = theme === "dark";

  const tabs = [
    { id: null as string | null, label: t("home"), icon: HomeIcon },
    { id: "messages", label: t("chat"), icon: ChatIcon },
    { id: "advice", label: t("advice"), icon: AdviceIcon },
    { id: "stores", label: t("stores"), icon: StoresIcon },
    { id: "buy", label: "Buy", icon: BuyIcon },
    { id: "stock", label: "Stock", icon: TradeIcon },
  ].filter((tab) => canAccess(user?.role, tab.id));

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 transition-colors ${
        dark ? "bg-[#0d1813] border-gray-700" : "bg-white border-gray-100"
      } border-t shadow-[0_-4px_20px_rgba(0,0,0,0.04)]`}
    >
      <div className="flex items-stretch justify-around px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] max-w-[1920px] mx-auto">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.label}
              onClick={() => open(tab.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-colors ${
                isActive ? "text-green-700 dark:text-green-400" : dark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="relative">
                {tab.icon}
                {isActive && (
                  <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-700 dark:bg-green-400" />
                )}
              </span>
              <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}