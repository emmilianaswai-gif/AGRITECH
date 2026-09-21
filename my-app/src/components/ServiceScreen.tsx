import LearningCenter from "./LearningCenter";
import AiChat from "./AiChat";
import Stores from "./Stores";
import MyStock from "./MyStock";
import Customers from "./Customers";
import Wallet from "./Wallet";
import Orders from "./Orders";
import Report from "./Report";
import Messages from "./Messages";
import Exchange from "./Exchange";
import BuyStock from "./BuyStock";
import RoleAccess from "./RoleAccess";
import Support from "./Support";
import Dashboard from "./Dashboard";
import { useServices } from "../context/ServicesContext";
import { services } from "../data/services";
import { useUser } from "../context/UserContext";
import { useAccess } from "../context/AccessContext";
import { useLanguage } from "../context/LanguageContext";

export default function ServiceScreen() {
  const { active, open: setActive } = useServices();
  const { user } = useUser();
  const { canAccess } = useAccess();
  const { t } = useLanguage();

  const current = services.find((s) => s.id === active) ?? null;

  return (
    <div>
      {current ? (
        <div className="bg-white dark:bg-[#12201a] rounded-[28px] border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4 bg-white dark:bg-[#0d1813] border-b border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setActive(null)}
              className="md:hidden w-9 h-9 rounded-full bg-gray-100 dark:bg-[#1d2a23] flex items-center justify-center text-gray-500 dark:text-gray-300 hover:bg-gray-200 transition-colors flex-shrink-0"
              title="Back to services"
              aria-label="Back to services"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${current.color} dark:bg-opacity-20`}>
              {current.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-green-950 dark:text-green-100 leading-tight">{current.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{current.description}</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50/50 dark:bg-transparent">
            {!canAccess(user?.role, active) ? (
              <div className="text-center py-10">
                <p className="text-sm text-gray-500 dark:text-gray-300">{t("access_denied")}</p>
              </div>
            ) : (
              <>
                {active === "learning" && <LearningCenter />}
                {active === "advice" && <AiChat />}
                {active === "stores" && <Stores />}
                {active === "stock" && <MyStock />}
                {active === "customer" && <Customers />}
                {active === "wallet" && <Wallet />}
                {active === "orders" && <Orders />}
                {active === "report" && <Report />}
                {active === "messages" && <Messages />}
                {active === "exchange" && <Exchange />}
                {active === "buy" && <BuyStock />}
                {active === "access" && <RoleAccess />}
                {active === "support" && <Support />}
              </>
            )}
          </div>
        </div>
      ) : (
        <Dashboard />
      )}
    </div>
  );
}