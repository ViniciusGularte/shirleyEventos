import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[28px] font-black leading-tight tracking-normal sm:text-[32px]">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-event-ink/62">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
