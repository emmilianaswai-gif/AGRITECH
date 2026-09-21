import type { ReactNode } from "react";
import { useTheme } from "../context/ThemeContext";

type Props = {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  tone?: "danger" | "success";
  children?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  busy = false,
  tone = "danger",
  children,
  onCancel,
  onConfirm,
}: Props) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const success = tone === "success";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={busy ? undefined : onCancel} />
      <div
        className={`relative w-full max-w-sm rounded-2xl shadow-2xl p-6 ${
          dark ? "bg-[#12201a] border border-gray-700" : "bg-white"
        }`}
      >
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${
            success ? "bg-lime-100 text-lime-700" : "bg-red-100 text-red-600"
          }`}
        >
          {success ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className={`text-sm mt-1 ${dark ? "text-gray-400" : "text-gray-500"}`}>{message}</p>
        {children}
        {!children && (
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                dark ? "border border-gray-700 text-gray-300" : "border border-gray-200 text-gray-600"
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 transition-colors ${
                success ? "bg-lime-600 hover:bg-lime-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {busy ? (success ? "Working..." : "Deleting...") : confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}