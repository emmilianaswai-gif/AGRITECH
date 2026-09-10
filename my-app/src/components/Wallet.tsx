import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  walletApi,
  type PaymentAttempt,
  type WalletTransaction,
  type WalletSummary,
} from "../api/client";
import ConfirmDialog from "./ConfirmDialog";

const MOBILE_MONEY = ["M-Pesa", "Tigo Pesa", "Airtel Money", "Halopesa"];
const BANKS = ["NMB", "CRDB", "NBC", "Equity", "Stanbic", "TPB", "Exim", "DTB", "TIB", "Azania Bank"];
const isBank = (p: string) => BANKS.includes(p);

function fmt(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function money(n: number): string {
  return "TZS " + fmt(n);
}

function timeLabel(createdAt: string | null): string {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function dirBadge(t: WalletTransaction): { label: string; cls: string } {
  if (t.direction === "IN") {
    if (t.category === "DEBT_PAID") return { label: "Debt Paid", cls: "text-amber-700 bg-amber-100" };
    if (t.category === "DEPOSIT") return { label: "Deposit", cls: "text-teal-700 bg-teal-100" };
    return { label: "Money In", cls: "text-green-700 bg-green-100" };
  }
  if (t.category === "WITHDRAW") return { label: "Withdrawal", cls: "text-gray-600 bg-gray-200" };
  return { label: "Refund", cls: "text-rose-700 bg-rose-100" };
}

function paymentStatus(p: PaymentAttempt): { label: string; cls: string } {
  switch (p.status) {
    case "COMPLETED":
      return { label: "Completed", cls: "text-green-700 bg-green-100" };
    case "FAILED":
      return { label: "Cancelled", cls: "text-rose-700 bg-rose-100" };
    default:
      return { label: "Pending", cls: "text-amber-700 bg-amber-100" };
  }
}

const emptyForm = {
  amount: "",
  provider: MOBILE_MONEY[0],
  phone: "",
  accountNumber: "",
  accountName: "",
};

export default function Wallet() {
  const [txns, setTxns] = useState<WalletTransaction[]>([]);
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [payments, setPayments] = useState<PaymentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [depositForm, setDepositForm] = useState(emptyForm);
  const [withdrawForm, setWithdrawForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [pending, setPending] = useState<PaymentAttempt | null>(null);
  const [acting, setActing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [t, s, p] = await Promise.all([
        walletApi.transactions(),
        walletApi.summary(),
        walletApi.payments(),
      ]);
      setTxns(t);
      setSummary(s);
      setPayments(p);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 5000);
  };

  const validate = (amount: string, form: typeof emptyForm): number => {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setFormError("Enter a valid amount");
      return NaN;
    }
    if (isBank(form.provider)) {
      const acc = form.accountNumber.replace(/[^0-9]/g, "");
      if (acc.length < 6) {
        setFormError("Enter a valid bank account number");
        return NaN;
      }
      if (!form.accountName.trim()) {
        setFormError("Enter the bank account holder name");
        return NaN;
      }
    } else {
      const digits = form.phone.replace(/[^0-9]/g, "");
      if (digits.length < 9 || digits.length > 12) {
        setFormError("Enter a valid mobile money phone number");
        return NaN;
      }
    }
    return amt;
  };

  const submitDeposit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = validate(depositForm.amount, depositForm);
    if (isNaN(amt)) return;
    setSubmitting(true);
    setFormError("");
    try {
      const p = await walletApi.deposit(
        amt,
        depositForm.provider,
        depositForm.phone,
        depositForm.accountNumber,
        depositForm.accountName,
      );
      setPending(p);
      setShowDeposit(false);
      setDepositForm(emptyForm);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Deposit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const submitWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    const amt = validate(withdrawForm.amount, withdrawForm);
    if (isNaN(amt)) return;
    if (summary && amt > summary.balance) {
      setFormError("Withdrawal amount exceeds your available balance");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const p = await walletApi.payout(
        amt,
        withdrawForm.provider,
        withdrawForm.phone,
        withdrawForm.accountNumber,
        withdrawForm.accountName,
      );
      setPending(p);
      setShowWithdraw(false);
      setWithdrawForm(emptyForm);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  const approvePending = async () => {
    if (!pending) return;
    setActing(true);
    try {
      await walletApi.confirmPayment(pending.reference);
      setPending(null);
      await load();
      flash(pending.type === "DEPOSIT" ? "Deposit completed — money added to your wallet" : "Withdrawal sent to your phone");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm payment");
    } finally {
      setActing(false);
    }
  };

  const declinePending = async () => {
    if (!pending) return;
    setActing(true);
    try {
      await walletApi.cancelPayment(pending.reference);
      setPending(null);
      await load();
      flash("Payment cancelled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel payment");
    } finally {
      setActing(false);
    }
  };

  const confirmFromList = async (ref: string) => {
    setActing(true);
    try {
      await walletApi.confirmPayment(ref);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm payment");
    } finally {
      setActing(false);
    }
  };

  const cancelPaymentFromList = async (ref: string) => {
    setActing(true);
    try {
      await walletApi.cancelPayment(ref);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel payment");
    } finally {
      setActing(false);
    }
  };

  const renderMoneyForm = (
    title: string,
    prompt: ReactNode,
    form: typeof emptyForm,
    setForm: (f: typeof emptyForm) => void,
    onSubmit: (e: FormEvent) => void,
    submitLabel: string,
    close: () => void,
  ) => (
    <ConfirmDialog
      open
      title={title}
      message={prompt}
      busy={submitting}
      onCancel={() => !submitting && close()}
      onConfirm={() => {}}
    >
      <form onSubmit={onSubmit} className="space-y-3 mt-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Amount</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="e.g. 50000"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1813] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-lime-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Provider</label>
          <select
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1813] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-lime-500"
          >
            <optgroup label="Mobile Money">
              {MOBILE_MONEY.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </optgroup>
            <optgroup label="Banks">
              {BANKS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </optgroup>
          </select>
        </div>
        {isBank(form.provider) ? (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Bank account number</label>
              <input
                type="text"
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="e.g. 12345678901"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1813] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Account holder name</label>
              <input
                type="text"
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                placeholder="e.g. Jane Mushi"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1813] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-lime-500"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Phone number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="e.g. 0682 123 456"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0d1813] px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-lime-500"
            />
          </div>
        )}
        {formError && <p className="text-xs text-rose-600 dark:text-rose-400">{formError}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => !submitting && close()}
            disabled={submitting}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold py-2.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-lime-600 hover:bg-lime-700 disabled:opacity-60 text-white text-sm font-semibold py-2.5 transition-colors"
          >
            {submitting ? "Sending..." : submitLabel}
          </button>
        </div>
      </form>
    </ConfirmDialog>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 px-4 py-3 text-sm">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-3 text-sm font-medium">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-lime-600 to-green-700 text-white p-4 flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-lime-100">Balance</span>
          <span className="text-2xl font-extrabold mt-1">
            {loading ? "—" : money(summary?.balance ?? 0)}
          </span>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                setFormError("");
                setShowDeposit(true);
              }}
              disabled={loading}
              className="flex-1 rounded-lg bg-white text-green-700 text-xs font-semibold py-2 transition-colors hover:bg-green-50 disabled:opacity-50"
            >
              Deposit
            </button>
            <button
              onClick={() => {
                setFormError("");
                setShowWithdraw(true);
              }}
              disabled={loading}
              className="flex-1 rounded-lg bg-white/20 text-white text-xs font-semibold py-2 transition-colors hover:bg-white/30 disabled:opacity-50"
            >
              Withdraw
            </button>
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#12201a] border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Money in</span>
          <span className="text-xl font-bold text-green-700 dark:text-green-400 mt-1">
            {loading ? "—" : money(summary?.moneyIn ?? 0)}
          </span>
          <span className="text-[11px] text-gray-400 mt-3">Sales, debts &amp; deposits</span>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#12201a] border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-between">
          <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Money out</span>
          <span className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {loading ? "—" : money(summary?.moneyOut ?? 0)}
          </span>
          <span className="text-[11px] text-gray-400 mt-3">Refunds &amp; withdrawals</span>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-bold text-green-950 dark:text-green-100 mb-3">Transactions</h4>
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading transactions...</p>
        ) : txns.length === 0 ? (
          <div className="rounded-xl bg-gray-50 dark:bg-[#12201a] border border-gray-100 dark:border-gray-700 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No transactions yet. Money from your sales will appear here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-[#0d1813]">
                  <th className="px-4 py-2.5 font-semibold">Description</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Date</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {txns.map((t) => {
                  const badge = dirBadge(t);
                  return (
                    <tr key={t.id} className="odd:bg-white even:bg-gray-50/60 dark:odd:bg-[#12201a] dark:even:bg-[#0d1813]">
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{t.description}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{timeLabel(t.createdAt)}</td>
                      <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${t.direction === "IN" ? "text-green-700 dark:text-green-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {t.direction === "IN" ? "+" : "−"}{money(t.amount ?? 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-bold text-green-950 dark:text-green-100 mb-3">Mobile money payments</h4>
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading payments...</p>
        ) : payments.length === 0 ? (
          <div className="rounded-xl bg-gray-50 dark:bg-[#12201a] border border-gray-100 dark:border-gray-700 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No deposits or withdrawals yet. Use Deposit or Withdraw to top up or send money to a phone.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-[#0d1813]">
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Provider</th>
                  <th className="px-4 py-2.5 font-semibold">Recipient</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Amount</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {payments.map((p) => {
                  const badge = paymentStatus(p);
                  return (
                    <tr key={p.reference} className="odd:bg-white even:bg-gray-50/60 dark:odd:bg-[#12201a] dark:even:bg-[#0d1813]">
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                        {p.type === "DEPOSIT" ? "Deposit" : "Withdrawal"}
                      </td>
                      <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{p.provider}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {p.phone ?? (p.accountName ? `${p.accountName} (${p.accountNumber})` : p.accountNumber ?? "-")}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold whitespace-nowrap">
                        {money(p.amount ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-2">
                            <button
                              onClick={() => confirmFromList(p.reference)}
                              disabled={acting}
                              className="text-[11px] font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => cancelPaymentFromList(p.reference)}
                              disabled={acting}
                              className="text-[11px] font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-400">{p.reference}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showDeposit &&
        renderMoneyForm(
          "Deposit money",
          <>Top up your wallet with mobile money. This runs in sandbox mode — confirm on the next screen to simulate approving on your phone.</>,
          depositForm,
          setDepositForm,
          submitDeposit,
          "Deposit",
          () => setShowDeposit(false),
        )}

      {showWithdraw &&
        renderMoneyForm(
          "Withdraw money",
          <>Send money from your wallet to your phone via mobile money. This runs in sandbox mode — confirm on the next screen to simulate approving on your phone.</>,
          withdrawForm,
          setWithdrawForm,
          submitWithdraw,
          "Send money",
          () => setShowWithdraw(false),
        )}

      <ConfirmDialog
        open={pending !== null}
        title={pending?.type === "WITHDRAW" ? "Send money now?" : "Complete deposit?"}
        message={
          pending ? (
            <>
              <b>{money(pending.amount ?? 0)}</b> {pending.type === "WITHDRAW" ? "from" : "to"} your wallet via{" "}
              {pending.provider} ({pending.phone ?? pending.accountName ?? pending.accountNumber}). Reference <b>{pending.reference}</b>.
              <span className="block mt-2 text-xs text-gray-400">
                Sandbox mode: press Approve to complete the payment, or Decline to cancel it.
              </span>
            </>
          ) : null
        }
        busy={acting}
        tone="success"
        onCancel={() => !acting && declinePending()}
        onConfirm={() => approvePending()}
        confirmLabel={pending?.type === "WITHDRAW" ? "Send" : "Complete"}
      />
    </div>
  );
}