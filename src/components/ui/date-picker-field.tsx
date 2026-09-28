"use client";

import { useId, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, ChevronDown, Clock, X } from "lucide-react";
import { useActionFormState } from "@/components/ui/action-form";

type DatePickerFieldProps = {
  label: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  timeName?: string;
  defaultTime?: string;
};

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hour = String(Math.floor(index / 2)).padStart(2, "0");
  const minute = index % 2 === 0 ? "00" : "30";
  return `${hour}:${minute}`;
});

export function DatePickerField({ label, name, required = false, defaultValue, timeName, defaultTime = "" }: DatePickerFieldProps) {
  const state = useActionFormState();
  const generatedId = useId();
  const error = state.fieldErrors?.[name]?.[0] ?? (timeName ? state.fieldErrors?.[timeName]?.[0] : undefined);
  const [selected, setSelected] = useState<Date | undefined>(() => parseDate(defaultValue));
  const [time, setTime] = useState(defaultTime);
  const [open, setOpen] = useState(false);
  const fieldId = `field-${name}-${generatedId.replace(/:/g, "")}`;
  const errorId = `${fieldId}-error`;
  const dateValue = selected ? format(selected, "yyyy-MM-dd") : "";
  const displayValue = selected
    ? `${format(selected, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}${time ? ` às ${time}` : ""}`
    : "Selecionar data";

  return (
    <div className="grid gap-2 text-sm font-bold text-event-ink/72">
      <label htmlFor={fieldId}>
        {label}{required ? <span className="text-event-rose" aria-hidden="true"> *</span> : null}
      </label>
      <input type="hidden" name={name} value={dateValue} />
      {timeName ? <input type="hidden" name={timeName} value={time} /> : null}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            id={fieldId}
            type="button"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="focus-ring flex min-h-12 w-full items-center gap-3 rounded-[16px] border border-event-ink/15 bg-event-paper px-4 text-left text-base text-event-ink transition hover:border-event-rose/35 aria-[invalid=true]:border-red-400 aria-[invalid=true]:bg-red-50 sm:text-sm"
          >
            <CalendarDays size={18} className="shrink-0 text-event-rose" aria-hidden="true" />
            <span className={`min-w-0 flex-1 truncate ${selected ? "" : "font-medium text-event-ink/45"}`}>{displayValue}</span>
            <ChevronDown size={16} className="shrink-0 text-event-ink/45" aria-hidden="true" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={8}
            align="start"
            collisionPadding={16}
            className="date-picker-popover z-50 w-[min(22rem,calc(100vw-2rem))] rounded-[22px] border border-event-ink/10 bg-event-paper p-3 text-event-ink shadow-[0_24px_80px_rgba(18,12,18,0.18)] outline-none"
          >
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(date) => {
                setSelected(date);
                if (date && !timeName) setOpen(false);
              }}
              defaultMonth={selected}
              locale={ptBR}
              captionLayout="dropdown"
              startMonth={new Date(new Date().getFullYear() - 5, 0)}
              endMonth={new Date(new Date().getFullYear() + 10, 11)}
              showOutsideDays
            />
            {timeName ? (
              <div className="mt-2 flex items-center gap-2 border-t border-event-ink/10 px-1 pt-3">
                <Clock size={17} className="shrink-0 text-event-rose" aria-hidden="true" />
                <label htmlFor={`${fieldId}-time`} className="shrink-0 text-xs font-extrabold uppercase tracking-[0.12em] text-event-ink/55">Horário</label>
                <select
                  id={`${fieldId}-time`}
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  disabled={!selected}
                  className="focus-ring min-h-10 min-w-0 flex-1 rounded-[13px] border border-event-ink/15 bg-white px-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <option value="">A definir</option>
                  {timeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <button type="button" onClick={() => setOpen(false)} disabled={!selected} className="focus-ring min-h-10 rounded-[13px] bg-event-ink px-3 text-xs font-extrabold text-event-paper disabled:opacity-45">Aplicar</button>
              </div>
            ) : null}
            {selected ? (
              <button type="button" onClick={() => { setSelected(undefined); setTime(""); }} className="focus-ring mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-xl px-2 text-xs font-bold text-event-ink/55 hover:bg-event-rose/8 hover:text-event-rose">
                <X size={14} aria-hidden="true" /> Limpar data
              </button>
            ) : null}
            <Popover.Arrow className="fill-event-paper" />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      {timeName ? <span className="text-xs font-medium leading-5 text-event-ink/48">O horário pode ficar a definir.</span> : null}
      {error ? <span id={errorId} className="text-xs font-bold leading-5 text-red-700">{error}</span> : null}
    </div>
  );
}
