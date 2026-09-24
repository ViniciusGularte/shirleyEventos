import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] px-5 text-sm font-extrabold transition-all duration-200 disabled:opacity-50",
        variant === "primary" && "bg-event-ink text-event-paper hover:bg-event-rose",
        variant === "secondary" && "border border-event-ink/10 bg-event-paper/70 text-event-ink hover:border-event-rose/40",
        variant === "ghost" && "text-event-ink hover:bg-event-ink/5",
        className
      )}
      {...props}
    />
  );
}
