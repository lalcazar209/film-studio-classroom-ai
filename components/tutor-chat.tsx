"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
}

export function TutorChat({ initialHistory }: { initialHistory: ChatMessage[] }) {
  const [messages, setMessages] = useState(initialHistory);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { id: `local-${Date.now()}`, role: "USER", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch("/api/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage.content }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "The tutor couldn't respond");
      }
      const { reply } = await response.json();
      setMessages((prev) => [...prev, { id: reply.id, role: "ASSISTANT", content: reply.content }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-[60vh] flex-col rounded-xl border border-black/10 dark:border-white/10">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-black/50 dark:text-white/50">
            Ask about your project, a technique, or where you&apos;re stuck — I&apos;ll help you work
            through it rather than just give you the answer.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              message.role === "USER"
                ? "ml-auto bg-studio-accent text-white"
                : "bg-black/5 dark:bg-white/10"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="px-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-black/10 p-3 dark:border-white/10">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the AI Tutor..."
          className="flex-1"
        />
        <Button type="submit" isLoading={isSending} disabled={!input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
