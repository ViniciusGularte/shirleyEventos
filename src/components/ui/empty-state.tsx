import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <Card className="flex min-h-56 flex-col items-start justify-center gap-4">
      <div>
        <h2 className="text-xl font-extrabold">{title}</h2>
        <div className="mt-2 max-w-md text-sm leading-6 text-event-ink/65">{children}</div>
      </div>
      {action}
    </Card>
  );
}
