import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ASSISTANTS } from "@/lib/ai/assistants";

export function AssistantsDirectory({ basePath }: { basePath: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ASSISTANTS.map((assistant) => (
        <Link key={assistant.id} href={`${basePath}/${assistant.id}`}>
          <Card className="h-full transition-colors hover:border-studio-accent">
            <CardHeader>
              <CardTitle className="text-base">{assistant.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-studio-ink/60 dark:text-white/60">{assistant.tagline}</CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
