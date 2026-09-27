import { CheckCircle2, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function FlashMessage({ children, variant = "success" }: { children: React.ReactNode; variant?: "success" | "error" | "warning" }) {
  const Icon = variant === "success" ? CheckCircle2 : CircleAlert;
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-[16px] border px-4 py-3 text-sm font-bold leading-5",
        variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        variant === "warning" && "border-amber-200 bg-amber-50 text-amber-900",
        variant === "error" && "border-red-200 bg-red-50 text-red-800"
      )}
    >
      <Icon className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
