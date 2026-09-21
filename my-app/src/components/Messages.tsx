import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  smsApi,
  type SmsBalance,
} from "../api/client";
import { useUser } from "../context/UserContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useGetStarted } from "../context/GetStartedContext";
import {
  loadContacts,
  persistContacts,
  loadSenderName,
  persistSenderName,
  loadRecent,
  persistRecent,
  normalizePhone,
  makeContact,
  smsHeader,
  composeSmsBody,
  smsSegments,
  type SmsContact,
  type SentSms,
} from "../data/sms";

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusBadge(status: string | null): { label: string; cls: string } {
  const s = (status ?? "").toLowerCase();
  if (s === "sent" || s === "delivered") return { label: status ?? "Sent", cls: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" };
  if (s === "simulated" || s === "queued") return { label: status ?? "Simulated", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
  if (s === "failed" || s === "error") return { label: status ?? "Failed", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" };
  return { label: status ?? "Sent", cls: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" };
}

export default function Messages() {
  const { user } = useUser();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { open: openGetStarted } = useGetStarted();
  const dark = theme === "dark";

  // Saved contacts
  const [contacts, setContacts] = useState<SmsContact[]>([]);
  const [search, setSearch] = useState("");

  // Compose
  const [toPhone, setToPhone] = useState("");
  const [toName, setToName] = useState("");
  const [body, setBody] = useState("");
  const [senderName, setSenderName] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Balance
  const [balance, setBalance] = useState<SmsBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState("");

  // Recent sent
  const [recent, setRecent] = useState<SentSms[]>([]);

  // ---------- helpers ----------
  const composed = body.trim() ? composeSmsBody(senderName, body) : "";
  const segments = smsSegments(composed);
  const isSaved = contacts.some((c) => normalizePhone(c.phone) === normalizePhone(toPhone));
  const selectedId = contacts.find((c) => normalizePhone(c.phone) === normalizePhone(toPhone))?.id ?? null;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? contacts.filter(
        (c) => c.name.toLowerCase().includes(q) || normalizePhone(c.phone).includes(q.replace(/\D/g, "")),
      )
    : [...contacts];

  // ---------- init ----------
  useEffect(() => {
    if (!user) return;
    setContacts(loadContacts(user.id));
    setRecent(loadRecent(user.id));
    setSenderName(loadSenderName(user.id) || user.fullName || "");
  }, [user]);

  // ---------- balance ----------
  const refreshBalance = useCallback(async () => {
    setLoadingBalance(true);
    setBalanceError("");
    try {
      setBalance(await smsApi.balance());
    } catch (err) {
      setBalance(null);
      setBalanceError(err instanceof Error ? err.message : "Balance unavailable");
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  // ---------- contacts ----------
  const saveNumber = () => {
    if (!user) return;
    const phone = toPhone.trim();
    if (!phone) { setPhoneError("Enter a phone number first."); return; }
    if (phone.length < 7) { setPhoneError("Phone number looks too short."); return; }
    setPhoneError("");
    const name = toName.trim() || "Customer";
    const idx = contacts.findIndex((c) => normalizePhone(c.phone) === normalizePhone(phone));
    const updated = idx >= 0
      ? contacts.map((c, i) => (i === idx ? { ...c, name, phone } : c))
      : [...contacts, makeContact(name, phone)];
    setContacts(updated);
    persistContacts(user.id, updated);
    if (!toName.trim() && idx < 0) setToName(name);
  };

  const removeNumber = (id: string) => {
    if (!user) return;
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    persistContacts(user.id, updated);
  };

  const selectContact = (c: SmsContact) => {
    setToPhone(c.phone);
    setToName(c.name);
    setPhoneError("");
    setNotice("");
    setError("");
  };

  // ---------- send ----------
  const sendSms = async (e: FormEvent) => {
    e.preventDefault();
    setNotice("");
    setError("");
    setPhoneError("");
    const phone = toPhone.trim();
    if (!phone) { setPhoneError("Enter a phone number."); return; }
    if (phone.length < 7) { setPhoneError("Phone number looks too short."); return; }
    if (!body.trim()) { setError("Type a message first."); return; }
    setSending(true);
    try {
      const rec = await smsApi.send({
        header: smsHeader(senderName),
        fromName: senderName,
        toName: toName.trim(),
        toPhone: phone,
        body: composed,
      });
      const entry: SentSms = {
        id: rec.id?.toString() ?? `${Date.now()}`,
        toPhone: rec.toPhone,
        toName: rec.toName ?? toName,
        body: composed,
        status: rec.status ?? "Sent",
        provider: rec.provider ?? null,
        createdAt: rec.createdAt ?? new Date().toISOString(),
      };
      setRecent((prev) => {
        const next = [entry, ...prev].slice(0, 30);
        persistRecent(user?.id, next);
        return next;
      });
      setNotice(
        rec.status === "Simulated"
          ? "SMS simulated — add your Africa's Talking key in the backend to send real messages."
          : `SMS delivered to ${rec.toPhone} via ${rec.provider ?? "gateway"}.`,
      );
      setBody("");
      refreshBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send SMS");
    } finally {
      setSending(false);
    }
  };

  // ---------- not logged in ----------
  if (!user) {
    return (
      <div className={`rounded-[28px] border shadow-sm p-10 text-center ${dark ? "bg-[#12201a] border-gray-700 text-gray-100" : "bg-white border-gray-100"}`}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3" />
          </svg>
        </div>
        <h3 className="text-lg font-bold">Send direct SMS from AGRICONNECT</h3>
        <p className={`mt-2 mb-6 text-sm ${dark ? "text-gray-300" : "text-gray-500"}`}>
          {t("login_hint")}
        </p>
        <button
          onClick={() => openGetStarted()}
          className="px-6 py-2.5 bg-green-800 text-white font-semibold rounded-xl hover:bg-green-900"
        >
          {t("signup")} / {t("login")}
        </button>
      </div>
    );
  }

  const root = dark ? "bg-[#0b1410] text-gray-100" : "";
  const card = dark ? "bg-[#12201a] border-gray-700" : "bg-white border-gray-100";
  const muted = dark ? "text-gray-400" : "text-gray-500";
  const inputCls = `w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${dark ? "bg-[#1d2a23] text-gray-100 border border-gray-700" : "bg-gray-50 border border-gray-200 text-gray-900"}`;

  return (
    <div className={`space-y-4 ${root}`}>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>
      )}

      {/* Balance banner */}
      <div className={`rounded-[28px] border shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4 ${card}`}>
        <div className="flex items-center gap-3 flex-1">
          <span className="w-10 h-10 rounded-xl bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3" />
            </svg>
          </span>
          <div>
            <p className="font-bold text-sm">SMS Balance</p>
            {loadingBalance ? (
              <p className={`text-xs ${muted}`}>Checking balance...</p>
            ) : balance ? (
              <p className="text-xs">
                <span className="font-semibold">{balance.units ?? "—"}</span> SMS units available
                {balance.balance != null && <span className={`${muted} ml-2`}>({balance.currency ?? "TZS"} {balance.balance.toLocaleString()})</span>}
                {balance.simulated && <span className="text-amber-600 dark:text-amber-400 font-semibold ml-2">· Simulated</span>}
              </p>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400">{balanceError || "No balance info — gateway not connected"}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => refreshBalance()}
          disabled={loadingBalance}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${dark ? "border-gray-600 text-gray-300 hover:bg-[#1d2a23]" : "border-gray-200 text-gray-600 hover:bg-gray-50"} disabled:opacity-50`}
        >
          {loadingBalance ? "Refreshing..." : "Refresh balance"}
        </button>
      </div>

      {/* Main card */}
      <div className={`rounded-[28px] border shadow-sm overflow-hidden ${card}`}>
        <div className="flex flex-col md:flex-row md:h-[70vh]">
          {/* Saved contacts sidebar */}
          <div className={`w-full md:w-72 md:flex-shrink-0 border-b md:border-b-0 md:border-r ${dark ? "border-gray-700" : "border-gray-100"} flex flex-col`}>
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-sm">Saved Numbers</h3>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or number..."
                className={`${inputCls} text-xs`}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className={`text-xs px-4 pb-4 text-center ${muted}`}>
                  {contacts.length === 0 ? "No saved numbers yet." : "No match."}
                </p>
              ) : (
                <ul>
                  {filtered.map((c) => (
                    <li key={c.id} className={`flex items-center gap-2 px-4 py-2.5 transition-colors ${
                      selectedId === c.id ? "bg-green-50 dark:bg-[#1d2a23]" : "hover:bg-gray-50 dark:hover:bg-[#1d2a23]"
                    }`}>
                      <button onClick={() => selectContact(c)} className="flex-1 min-w-0 text-left">
                        <p className="font-semibold text-sm truncate">{c.name}</p>
                        <p className={`text-xs truncate ${muted}`}>{c.phone}</p>
                      </button>
                      <button
                        onClick={() => removeNumber(c.id)}
                        className="text-gray-400 hover:text-red-600 shrink-0"
                        title="Remove"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Compose pane */}
          <div className="flex-1 flex flex-col min-h-[60vh] md:min-h-0">
            {/* Header */}
            <div className={`px-5 py-4 border-b flex items-center gap-3 ${dark ? "border-gray-700" : "border-gray-100"}`}>
              <span className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3" />
                </svg>
              </span>
              <div>
                <p className="font-bold text-sm">Direct SMS</p>
                <p className={`text-xs ${muted}`}>Message any phone number via AGRICONNECT</p>
              </div>
            </div>

            <form onSubmit={sendSms} className="flex-1 flex flex-col p-5 gap-4 overflow-y-auto">
              {/* Recipient */}
              <fieldset className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Recipient</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`text-[11px] font-medium ${muted}`}>Phone number</label>
                    <input
                      value={toPhone}
                      onChange={(e) => { setToPhone(e.target.value); setPhoneError(""); setNotice(""); setError(""); }}
                      placeholder="0712 345 678"
                      type="tel"
                      className={`${inputCls} mt-1`}
                    />
                    {phoneError && <p className="text-[11px] font-semibold text-red-600 mt-1">{phoneError}</p>}
                  </div>
                  <div>
                    <label className={`text-[11px] font-medium ${muted}`}>Contact name (optional)</label>
                    <input
                      value={toName}
                      onChange={(e) => setToName(e.target.value)}
                      placeholder="e.g. Jabali Farm"
                      className={`${inputCls} mt-1`}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={saveNumber}
                    disabled={!toPhone.trim() || toPhone.trim().length < 7}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                      isSaved
                        ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : dark ? "border-gray-600 text-gray-300 hover:bg-[#1d2a23]" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    } disabled:opacity-50`}
                  >
                    {isSaved ? "Number saved" : "Save this number"}
                  </button>
                  {isSaved && (
                    <span className="text-[11px] text-green-700 dark:text-green-400 font-semibold">
                      Saved for future use
                    </span>
                  )}
                </div>
              </fieldset>

              {/* Sender name / store */}
              <fieldset className="space-y-2">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Your agro store name</p>
                <div className="flex gap-2">
                  <input
                    value={senderName}
                    onChange={(e) => { setSenderName(e.target.value); if (user) persistSenderName(user.id, e.target.value); }}
                    placeholder="e.g. Mbeya Fresh Produce"
                    className={inputCls}
                  />
                </div>
                <p className={`text-[11px] ${muted}`}>
                  Customer will see: <span className="font-semibold text-green-700 dark:text-green-400">{smsHeader(senderName)}: ...</span>
                </p>
              </fieldset>

              {/* Message */}
              <fieldset className="space-y-2 flex-1 flex flex-col">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Message</p>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message to the customer..."
                  rows={5}
                  className={`${inputCls} flex-1 resize-none`}
                />
                {body.trim() && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`${muted}`}>Characters: {composed.length}</span>
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      {segments} SMS segment{segments === 1 ? "" : "s"}
                    </span>
                  </div>
                )}
                {composed && (
                  <div className={`rounded-2xl border p-3 ${dark ? "border-gray-700 bg-[#0d1813]" : "border-gray-100 bg-gray-50"}`}>
                    <p className={`text-[10px] font-semibold ${muted} mb-1`}>Message preview (customer will see)</p>
                    <p className="text-sm whitespace-pre-wrap">{composed}</p>
                  </div>
                )}
              </fieldset>

              {notice && (
                <p className="text-[11px] font-semibold text-green-700 dark:text-green-400">{notice}</p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="submit"
                  disabled={sending || !toPhone.trim() || !body.trim()}
                  className="px-5 py-2.5 rounded-xl bg-green-800 text-white text-sm font-semibold disabled:opacity-50 hover:bg-green-900 flex items-center gap-2"
                >
                  {sending ? (
                    "Sending..."
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                      Send SMS
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Recent sent */}
            {recent.length > 0 && (
              <div className={`border-t px-5 py-4 ${dark ? "border-gray-700" : "border-gray-100"}`}>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Recent messages</p>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {recent.map((r) => {
                    const badge = statusBadge(r.status);
                    return (
                      <li key={r.id} className={`rounded-2xl border px-4 py-3 ${dark ? "border-gray-700 bg-[#0d1813]" : "border-gray-100 bg-gray-50"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold">{r.toName || r.toPhone}</p>
                          <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${badge.cls}`}>{badge.label}</span>
                        </div>
                        <p className={`text-xs ${muted} line-clamp-2`}>{r.body}</p>
                        <p className={`text-[10px] ${muted} mt-1`}>{fmtDate(r.createdAt)}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
