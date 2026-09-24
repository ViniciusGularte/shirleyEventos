import { Button } from "@/components/ui/button";

export function Field({ label, name, type = "text", required = false, children }: { label: string; name: string; type?: string; required?: boolean; children?: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-event-ink/72">
      {label}
      {children ?? <input className="focus-ring min-h-12 rounded-[16px] border border-event-ink/10 bg-event-paper px-4 text-event-ink" name={name} type={type} required={required} />}
    </label>
  );
}

export function SubmitButton({ children }: { children: React.ReactNode }) {
  return <Button type="submit" className="w-full sm:w-auto">{children}</Button>;
}
