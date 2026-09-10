import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import CustomerSales from "./CustomerSales";
import CustomerDebts from "./CustomerDebts";

export default function Customers() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [tab, setTab] = useState<"sales" | "debts">("sales");

  const tabs: { id: "sales" | "debts"; label: string }[] = [
    { id: "sales", label: "Customer Sales" },
    { id: "debts", label: "Customer Debts" },
  ];

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-full bg-gray-100 dark:bg-[#0d1813] p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-white dark:bg-[#1d2a23] text-green-800 dark:text-green-300 shadow-sm"
                : dark
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "sales" ? <CustomerSales /> : <CustomerDebts />}
    </div>
  );
}