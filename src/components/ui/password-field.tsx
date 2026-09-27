"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordField({ name, label, autoComplete }: { name: string; label: string; autoComplete: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="grid gap-2 text-sm font-bold text-event-ink/75">
      <span>{label} <span className="text-event-rose" aria-hidden="true">*</span></span>
      <span className="relative">
        <input
          className="focus-ring min-h-12 w-full rounded-[16px] border border-event-ink/15 bg-event-paper px-4 pr-12 text-base"
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="focus-ring absolute inset-y-0 right-1 grid min-h-11 min-w-11 place-items-center rounded-xl text-event-ink/60 hover:text-event-rose"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}
