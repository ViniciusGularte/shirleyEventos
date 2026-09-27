import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-black leading-tight tracking-normal sm:text-[32px]">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-6 text-event-ink/65">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0 [&>*]:w-full sm:[&>*]:w-auto">{action}</div> : null}
    </div>
  );
}
