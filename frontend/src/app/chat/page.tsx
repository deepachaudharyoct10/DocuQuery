"use client";

import { useState } from "react";

import { api, type Citation } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string>();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSend() {
    const question = input.trim();
    if (!question || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setIsLoading(true);
    setError(undefined);

    try {
      const res = await api.askQuestion(question, conversationId);
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer, citations: res.citations }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col px-6 py-8">
      <h1 className="text-2xl font-semibold">Chat</h1>
      <p className="mt-1 text-sm text-neutral-500">Ask questions about your uploaded documents.</p>

      <div className="mt-6 flex-1 space-y-4 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-neutral-400">No messages yet — ask something below.</p>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 space-y-1 border-t border-neutral-300/50 pt-2 text-xs opacity-80">
                  {msg.citations.map((c, ci) => (
                    <p key={ci}>
                      📄 {c.documentName} — chunk {c.chunkIndex}
                      {c.pageNumber ? `, page ${c.pageNumber}` : ""}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && <p className="text-sm text-neutral-500">Thinking…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="mt-4 flex gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask a question about your documents…"
          className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </main>
  );
}
