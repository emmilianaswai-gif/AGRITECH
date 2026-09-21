import { useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

type Currency = { code: string; name: string; flag: string; rate: number };

const BASE_CURRENCIES: Currency[] = [
  { code: "TZS", name: "Tanzanian Shilling", flag: "🇹🇿", rate: 1 },
  { code: "KES", name: "Kenyan Shilling", flag: "🇰🇪", rate: 0.0398 },
  { code: "UGX", name: "Ugandan Shilling", flag: "🇺🇬", rate: 1.36 },
  { code: "USD", name: "US Dollar", flag: "🇺🇸", rate: 0.00031 },
  { code: "EUR", name: "Euro", flag: "🇪🇺", rate: 0.00029 },
  { code: "GBP", name: "British Pound", flag: "🇬🇧", rate: 0.00025 },
  { code: "ZAR", name: "South African Rand", flag: "🇿🇦", rate: 0.0053 },
  { code: "CNY", name: "Chinese Yuan", flag: "🇨🇳", rate: 0.0023 },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳", rate: 0.026 },
];

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: n < 1 ? 4 : 2, minimumFractionDigits: 2 });
}

export default function Exchange() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [amount, setAmount] = useState("1000");
  const [from, setFrom] = useState("TZS");
  const [to, setTo] = useState("USD");

  const currencies = useMemo(() => BASE_CURRENCIES, []);

  const amountNum = parseFloat(amount) || 0;
  const fromC = currencies.find((c) => c.code === from)!;
  const toC = currencies.find((c) => c.code === to)!;
  const result = (amountNum / fromC.rate) * toC.rate;

  const root = dark ? "bg-[#0b1410] text-gray-100" : "";
  const card = dark ? "bg-[#12201a] border-gray-700" : "bg-white border-gray-100";

  return (
    <div className={`space-y-6 ${root}`}>
      <div className="bg-gradient-to-br from-green-800 to-green-700 rounded-[28px] p-6 text-white shadow-lg shadow-green-800/20">
        <h2 className="text-2xl font-extrabold">{t("exchange")}</h2>
        <p className="mt-1 text-green-100 text-sm">
          All values in Tanzanian Shillings (TZS) — see rates and convert your produce worth into any currency.
        </p>
      </div>

      <div className={`rounded-[28px] border shadow-sm p-6 ${card}`}>
        <label className="block text-sm font-medium mb-2">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`w-full px-4 py-3 rounded-xl text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 ${
            dark ? "bg-[#1d2a23] text-gray-100 border border-gray-700" : "bg-gray-50 border border-gray-200 text-gray-900"
          }`}
        />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={`w-full px-3 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 ${
                dark ? "bg-[#1d2a23] text-gray-100 border border-gray-700" : "bg-gray-50 border border-gray-200 text-gray-900"
              }`}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={`w-full px-3 py-3 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 ${
                dark ? "bg-[#1d2a23] text-gray-100 border border-gray-700" : "bg-gray-50 border border-gray-200 text-gray-900"
              }`}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`mt-6 rounded-2xl p-6 text-center ${dark ? "bg-[#1d2a23] border border-gray-700" : "bg-green-50"}`}>
          <p className="text-3xl font-extrabold text-green-700 dark:text-green-400">
            {fmt(result)} {to}
          </p>
          <p className="text-sm mt-1 opacity-70">
            {fmt(amountNum)} {from} = {fmt(result)} {to} · 1 {from} = {fmt(fromC.rate / toC.rate)} {to}
          </p>
        </div>
      </div>

      <div className={`rounded-[28px] border shadow-sm overflow-hidden ${card}`}>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold">Exchange rates (1 {from} in each currency)</h3>
          <p className="text-xs opacity-60 mt-0.5">Rates approximate · {new Date().toLocaleDateString()}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-px">
          {currencies
            .filter((c) => c.code !== from)
            .map((c) => (
              <div key={c.code} className={`px-5 py-4 ${dark ? "bg-[#0f1a14] border border-gray-800" : "bg-white border border-gray-50"}`}>
                <p className="text-sm font-semibold">{c.flag} {c.code}</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  {fmt(fromC.rate / c.rate)}
                  <span className="text-xs font-medium opacity-60 ml-1">{from}</span>
                </p>
                <p className="text-xs opacity-60">{c.name}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}