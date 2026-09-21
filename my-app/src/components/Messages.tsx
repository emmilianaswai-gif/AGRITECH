import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  chatApi,
  usersApi,
  smsApi,
  type ChatMessageResponse,
  type Conversation,
  type UserResponse,
} from "../api/client";
import { useUser } from "../context/UserContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useGetStarted } from "../context/GetStartedContext";

function fmtTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function Messages() {
  const { user } = useUser();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { open: openGetStarted } = useGetStarted();
  const dark = theme === "dark";

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [people, setPeople] = useState<UserResponse[]>([]);
  const [partner, setPartner] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<ChatMessageResponse[]>([]);
  const [text, setText] = useState("");
  const [smsPhone, setSmsPhone] = useState("");
  const [smsBody, setSmsBody] = useState("");
  const [smsSending, setSmsSending] = useState(false);
  const [smsNotice, setSmsNotice] = useState("");
  const [smsError, setSmsError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    if (!user?.id) return;
    try {
      setConversations(await chatApi.getConversations(user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chats");
    }
  };

  const openChat = async (c: Conversation) => {
    const uid = user?.id;
    if (!uid) return;
    setPartner(c);
    const known = people.find((p) => p.id === c.partnerId);
    setSmsPhone(known?.phoneNumber || "");
    setSmsBody("");
    setSmsNotice("");
    setSmsError("");
    try {
      setMsgs(await chatApi.getConversation(uid, c.partnerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const uid = user?.id;
    if (!uid || !partner || !text.trim()) return;
    try {
      await chatApi.send({ senderId: uid, receiverId: partner.partnerId, content: text.trim() });
      setText("");
      const updated = await chatApi.getConversation(uid, partner.partnerId);
      setMsgs(updated);
      loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    }
  };

  const sendSms = async (e: FormEvent) => {
    e.preventDefault();
    const uid = user?.id;
    if (!uid || !partner || !smsPhone.trim() || !smsBody.trim()) return;
    setSmsSending(true);
    setSmsNotice("");
    setSmsError("");
    try {
      const rec = await smsApi.send({
        fromName: user?.fullName,
        toName: partner.partnerName,
        toPhone: smsPhone.trim(),
        body: smsBody.trim(),
      });
      setSmsNotice(
        rec.status === "Simulated"
          ? `SMS sent to ${rec.toPhone} through the system (simulated — no gateway configured).`
          : `SMS delivered to ${rec.toPhone} via ${rec.provider ?? "gateway"}.`,
      );
      setSmsBody("");
    } catch (err) {
      setSmsError(err instanceof Error ? err.message : "Failed to send SMS");
    } finally {
      setSmsSending(false);
    }
  };

  const startNewChat = async (p: UserResponse) => {
    if (!p.id) return;
    setShowNew(false);
    const conv: Conversation = {
      partnerId: p.id,
      partnerName: p.fullName,
      partnerRole: p.role ?? "",
      lastMessage: "",
      lastTime: null,
    };
    await openChat(conv);
  };

  useEffect(() => {
    const uid = user?.id;
    if (!uid) return;
    loadConversations();
    usersApi
      .getAll()
      .then((all) => setPeople(all.filter((p) => p.id !== uid)))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    const uid = user?.id;
    if (!uid || !partner) return;
    const iv = setInterval(async () => {
      try {
        setMsgs(await chatApi.getConversation(uid, partner.partnerId));
      } catch {}
    }, 5000);
    return () => clearInterval(iv);
  }, [user?.id, partner]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  if (!user) {
    return (
      <div className={`rounded-[28px] border shadow-sm p-10 text-center ${dark ? "bg-[#12201a] border-gray-700 text-gray-100" : "bg-white border-gray-100"}`}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-700" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold">Talk directly to farmers & customers</h3>
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
  const bubbleMine = "bg-green-700 text-white";
  const bubbleTheirs = dark ? "bg-[#1d2a23] text-gray-100 border border-gray-700" : "bg-green-50 text-gray-900";

  return (
    <div className={`space-y-4 ${root}`}>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</div>
      )}

      <div className={`rounded-[28px] border shadow-sm overflow-hidden ${card}`}>
        <div className="flex flex-col md:flex-row md:h-[70vh]">
          {/* Conversations list */}
          <div className={`w-full md:w-72 md:flex-shrink-0 border-b md:border-b-0 md:border-r ${dark ? "border-gray-700" : "border-gray-100"}`}>
            <div className="flex items-center justify-between p-4">
              <h3 className="font-bold">{t("chat")}</h3>
              <button
                onClick={() => setShowNew(true)}
                className="w-9 h-9 rounded-full bg-green-800 text-white flex items-center justify-center hover:bg-green-900"
                title="New chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
            <div className="max-h-56 md:max-h-none overflow-y-auto md:h-[calc(70vh-4rem)]">
              {conversations.length === 0 ? (
                <p className={`text-sm px-4 py-8 text-center ${muted}`}>No conversations yet.</p>
              ) : (
                <ul>
                  {conversations.map((c) => (
                    <li key={c.partnerId}>
                      <button
                        onClick={() => openChat(c)}
                        className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                          partner?.partnerId === c.partnerId ? "bg-green-50 dark:bg-[#1d2a23]" : "hover:bg-gray-50 dark:hover:bg-[#1d2a23]"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold flex-shrink-0">
                          {(c.partnerName || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{c.partnerName}</p>
                          <p className={`text-xs truncate ${muted}`}>{c.lastMessage}</p>
                        </div>
                        {c.lastTime && (
                          <span className={`text-[10px] flex-shrink-0 ${muted}`}>{fmtTime(c.lastTime)}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Conversation pane */}
          <div className="flex-1 flex flex-col md:h-full">
            {!partner ? (
              <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center ${muted}`}>
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm8.25 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                <p className="text-sm">Select a conversation or start a new one.</p>
              </div>
            ) : (
              <>
                <div className={`px-4 py-3 flex items-center gap-3 border-b ${dark ? "border-gray-700" : "border-gray-100"}`}>
                  <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold">
                    {(partner.partnerName || "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{partner.partnerName}</p>
                    <p className={`text-xs ${muted}`}>{partner.partnerRole ? partner.partnerRole.replace("_", " ").toLowerCase() : "user"}</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[40vh] md:min-h-0">
                  {msgs.length === 0 ? (
                    <p className={`text-sm text-center pt-10 ${muted}`}>Say hello to start the conversation!</p>
                  ) : (
                    msgs.map((m) => {
                      const mine = m.senderId === user.id;
                      return (
                        <div key={m.id ?? `${m.createdAt}-${m.content}-${Math.random()}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${mine ? bubbleMine : bubbleTheirs}`}>
                            <p>{m.content}</p>
                            <p className={`text-[10px] mt-1 ${mine ? "text-green-100" : muted}`}>{fmtTime(m.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={send} className={`p-3 border-t flex gap-2 ${dark ? "border-gray-700" : "border-gray-100"}`}>
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Message ${partner.partnerName}...`}
                    className={`flex-1 px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      dark ? "bg-[#1d2a23] text-gray-100 border border-gray-700" : "bg-gray-50 border border-gray-200 text-gray-900"
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={loading || !text.trim()}
                    className="w-11 h-11 rounded-full bg-green-800 text-white flex items-center justify-center disabled:opacity-50 hover:bg-green-900"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  </button>
                </form>

                <form onSubmit={sendSms} className={`p-3 border-t space-y-2 ${dark ? "border-gray-700" : "border-gray-100"}`}>
                  <div className="flex items-center gap-2">
                    <svg className={`w-4 h-4 flex-shrink-0 ${muted}`} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                    <p className={`text-[11px] font-semibold ${muted}`}>Send SMS to {partner.partnerName}</p>
                  </div>
                  <input
                    value={smsPhone}
                    onChange={(e) => {
                      setSmsPhone(e.target.value);
                      setSmsNotice("");
                      setSmsError("");
                    }}
                    placeholder="Phone number e.g. 0712 345 678"
                    type="tel"
                    className={`w-full px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      dark ? "bg-[#1d2a23] text-gray-100 border border-gray-700" : "bg-gray-50 border border-gray-200 text-gray-900"
                    }`}
                  />
                  <div className="flex gap-2">
                    <input
                      value={smsBody}
                      onChange={(e) => setSmsBody(e.target.value)}
                      placeholder="Type the SMS message..."
                      className={`flex-1 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        dark ? "bg-[#1d2a23] text-gray-100 border border-gray-700" : "bg-gray-50 border border-gray-200 text-gray-900"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={smsSending || !smsPhone.trim() || !smsBody.trim()}
                      className="shrink-0 px-4 py-2 rounded-xl bg-green-700 text-white text-sm font-semibold disabled:opacity-50 hover:bg-green-800"
                    >
                      {smsSending ? "Sending..." : "Send SMS"}
                    </button>
                  </div>
                  {smsNotice && (
                    <p className="text-[11px] font-semibold text-green-700 dark:text-green-400">{smsNotice}</p>
                  )}
                  {smsError && (
                    <p className="text-[11px] font-semibold text-red-600">{smsError}</p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* New chat modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowNew(false)} />
          <div className={`relative rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto ${dark ? "bg-[#12201a] text-gray-100 border border-gray-700" : "bg-white"}`}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-bold">Start a new chat</h3>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {people.length === 0 ? (
                <p className={`text-sm text-center py-8 ${muted}`}>No other users yet.</p>
              ) : (
                people.map((p) => (
                  <li key={p.id ?? p.phoneNumber}>
                    <button onClick={() => startNewChat(p)} className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-[#1d2a23]">
                      <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold">
                        {(p.fullName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{p.fullName}</p>
                        <p className={`text-xs ${muted}`}>{p.role ?? "user"} · {p.location || p.address || ""}</p>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}