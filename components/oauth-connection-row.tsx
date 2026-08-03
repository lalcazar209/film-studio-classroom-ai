"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function OAuthConnectionRow({
  provider,
  label,
  isConnected,
  isConfigured,
  envHint,
}: {
  provider: string;
  label: string;
  isConnected: boolean;
  isConfigured: boolean;
  envHint: string;
}) {
  const router = useRouter();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  async function handleDisconnect() {
    setIsDisconnecting(true);
    try {
      await fetch(`/api/integrations/${provider}/disconnect`, { method: "POST" });
      router.refresh();
    } finally {
      setIsDisconnecting(false);
    }
  }

  return (
    <div className="flex items-center justify-between border-b border-studio-ink/5 py-2 last:border-0 dark:border-white/5">
      <span>{label}</span>
      {isConnected ? (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-studio-mint/10 px-2.5 py-1 text-xs font-bold text-studio-mint">
            Connected
          </span>
          <Button variant="ghost" onClick={handleDisconnect} isLoading={isDisconnecting} className="px-2 py-1 text-xs">
            Disconnect
          </Button>
        </div>
      ) : isConfigured ? (
        <a href={`/api/integrations/${provider}/authorize`}>
          <Button variant="secondary" className="px-3 py-1 text-xs">
            Connect
          </Button>
        </a>
      ) : (
        <span className="text-xs text-studio-ink/50 dark:text-white/50">Needs {envHint}</span>
      )}
    </div>
  );
}
