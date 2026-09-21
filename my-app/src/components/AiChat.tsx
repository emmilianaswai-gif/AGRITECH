import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { adviceApi, type ChatMessage } from "../api/client";

const suggestedQuestions = [
  "How do I improve maize yields?",
  "What fertilizer is best for tomatoes?",
  "How do I protect crops from locusts?",
  "What's the best irrigation method for a small farm?",
];

export default function AiChat() {
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your AgriConnect farming advisor. Ask me about crops, soil, pests, irrigation, or market prices.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adviceApi
      .getModels()
      .then((res) => {
        setModels(res.models);
        setModel(res.defaultModel);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load AI models"));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const res = await adviceApi.chat({ model, messages: newMessages });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get advice. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[560px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-green-800 text-white">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-300" />
          </span>
          <span className="font-semibold text-sm">AI Farming Advisor</span>
        </div>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="bg-green-700 text-white text-xs rounded-lg px-2 py-1.5 border border-green-600 focus:outline-none"
          title="Choose AI model"
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-br from-green-50/50 to-white">
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  isUser
                    ? "bg-green-800 text-white rounded-br-md"
                    : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">{error}</div>
        )}

        {messages.length <= 1 && !loading && (
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-3">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs text-green-800 bg-green-50 border border-green-100 rounded-full px-3 py-1.5 hover:bg-green-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask about farming..."
          className="flex-1 resize-none px-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="w-11 h-11 bg-green-800 text-white rounded-xl hover:bg-green-900 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Send message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}