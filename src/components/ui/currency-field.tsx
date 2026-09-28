"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useActionFormState } from "@/components/ui/action-form";
import { appendCurrencyDigit, currencyInputToCents, formatCurrencyFromCents, removeCurrencyDigit } from "@/lib/finance/currency";

type CurrencyFieldProps = {
  label: string;
  name: string;
  required?: boolean;
  allowNegative?: boolean;
  defaultValue?: number;
};

export function CurrencyField({ label, name, required = false, allowNegative = false, defaultValue = 0 }: CurrencyFieldProps) {
  const state = useActionFormState();
  const generatedId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cents, setCents] = useState(() => Math.round(defaultValue * 100));
  const error = state.fieldErrors?.[name]?.[0];
  const fieldId = `field-${name}-${generatedId.replace(/:/g, "")}`;
  const errorId = `${fieldId}-error`;
  const formattedValue = formatCurrencyFromCents(cents);

  useEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) {
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }, [cents]);

  function moveCaretToEnd() {
    requestAnimationFrame(() => {
      const input = inputRef.current;
      input?.setSelectionRange(input.value.length, input.value.length);
    });
  }

  function hasFullSelection(input: HTMLInputElement) {
    return input.selectionStart === 0 && input.selectionEnd === input.value.length;
  }

  function insertDigit(digit: number, replace = false) {
    setCents((current) => appendCurrencyDigit(replace ? 0 : current, digit));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      insertDigit(Number(event.key), hasFullSelection(event.currentTarget));
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      const replace = hasFullSelection(event.currentTarget);
      setCents((current) => replace ? 0 : removeCurrencyDigit(current));
      return;
    }
    if (event.key === "Delete") {
      event.preventDefault();
      setCents(0);
      return;
    }
    if (allowNegative && event.key === "-") {
      event.preventDefault();
      setCents((current) => current === 0 ? 0 : -current);
    }
  }

  function handleBeforeInput(event: FormEvent<HTMLInputElement>) {
    const nativeEvent = event.nativeEvent as InputEvent;
    if (nativeEvent.data && /^\d$/.test(nativeEvent.data)) {
      event.preventDefault();
      insertDigit(Number(nativeEvent.data), hasFullSelection(event.currentTarget));
    } else if (nativeEvent.inputType === "deleteContentBackward") {
      event.preventDefault();
      const replace = hasFullSelection(event.currentTarget);
      setCents((current) => replace ? 0 : removeCurrencyDigit(current));
    }
  }

  return (
    <label className="grid gap-2 text-sm font-bold text-event-ink/72">
      <span>{label}{required ? <span className="text-event-rose" aria-hidden="true"> *</span> : null}</span>
      <input
        ref={inputRef}
        id={fieldId}
        name={name}
        type="text"
        inputMode={allowNegative ? "decimal" : "numeric"}
        autoComplete="off"
        required={required}
        value={formattedValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className="focus-ring min-h-12 w-full rounded-[16px] border border-event-ink/15 bg-event-paper px-4 text-base font-extrabold tabular-nums text-event-ink transition selection:bg-event-rose/20 aria-[invalid=true]:border-red-400 aria-[invalid=true]:bg-red-50 sm:text-sm"
        onChange={(event) => setCents(currencyInputToCents(event.target.value, allowNegative))}
        onBeforeInput={handleBeforeInput}
        onFocus={(event) => event.currentTarget.select()}
        onClick={moveCaretToEnd}
        onKeyDown={handleKeyDown}
        onPaste={(event) => {
          event.preventDefault();
          setCents(currencyInputToCents(event.clipboardData.getData("text"), allowNegative));
        }}
      />
      {error ? <span id={errorId} className="text-xs font-bold leading-5 text-red-700">{error}</span> : null}
    </label>
  );
}
