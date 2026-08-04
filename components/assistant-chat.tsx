"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { cn } from "@/lib/utils/cn";

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
}

/** Shared across Teacher, Mentor, and Student portals — see
 * AssistantsDirectory for why `theme` is opt-in per caller. */
export function AssistantChat({
  assistantId,
  assistantName,
  initialHistory,
  theme = "default",
}: {
  assistantId: string;
  assistantName: string;
  initialHistory: ChatMessage[];
  theme?: "default" | "cinema";
}) {
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
      const response = await fetch(`/api/assistants/${assistantId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage.content }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : `${assistantName} couldn't respond`);
      }
      const { reply } = await response.json();
      setMessages((prev) => [...prev, { id: reply.id, role: "ASSISTANT", content: reply.content }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSending(false);
    }
  }

  const isCinema = theme === "cinema";

  return (
    <div
      className={cn(
        "flex h-[60vh] flex-col rounded-xl border",
        isCinema ? "border-cinema-border bg-cinema-panel/70 backdrop-blur" : "border-studio-ink/10 dark:border-white/10",
      )}
    >
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className={cn("text-sm", isCinema ? "text-cinema-muted" : "text-studio-ink/50 dark:text-white/50")}>
            Ask {assistantName} anything in their lane.
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
              message.role === "USER"
                ? isCinema
                  ? "ml-auto bg-cinema-red text-cinema-white"
                  : "ml-auto bg-studio-accent text-white"
                : isCinema
                  ? "bg-white/5 text-cinema-white"
                  : "bg-studio-ink/5 dark:bg-white/10",
            )}
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

      <form
        onSubmit={handleSubmit}
        className={cn("flex gap-2 border-t p-3", isCinema ? "border-cinema-border" : "border-studio-ink/10 dark:border-white/10")}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Ask ${assistantName}...`}
          className={cn("flex-1", isCinema && "!border-cinema-border !bg-cinema-black/40 !text-cinema-white placeholder:!text-cinema-muted focus:!border-cinema-red focus:!ring-cinema-red/30")}
        />
        <Button type="submit" variant={isCinema ? "cinema" : "primary"} isLoading={isSending} disabled={!input.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
