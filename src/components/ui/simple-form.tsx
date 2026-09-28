"use client";

import { cloneElement, isValidElement, useId, type InputHTMLAttributes, type ReactElement, type SelectHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useActionFormState } from "@/components/ui/action-form";

type FieldProps = {
  label: string;
  name: string;
  children?: React.ReactNode;
} & Pick<InputHTMLAttributes<HTMLInputElement>, "type" | "required" | "inputMode" | "autoComplete" | "min" | "max" | "step" | "placeholder" | "defaultValue">;

export function Field({ label, name, type = "text", required = false, children, ...inputProps }: FieldProps) {
  const state = useActionFormState();
  const generatedId = useId();
  const error = state.fieldErrors?.[name]?.[0];
  const fieldId = `field-${name}-${generatedId.replace(/:/g, "")}`;
  const errorId = `${fieldId}-error`;
  const controlProps = {
    id: fieldId,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errorId : undefined
  };
  const control = children && isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, controlProps)
    : <input className="focus-ring min-h-12 w-full rounded-[16px] border border-event-ink/15 bg-event-paper px-4 text-base text-event-ink aria-[invalid=true]:border-red-400 aria-[invalid=true]:bg-red-50 sm:text-sm" name={name} type={type} required={required} {...inputProps} {...controlProps} />;

  return (
    <label className="grid gap-2 text-sm font-bold text-event-ink/72">
      <span>{label}{required ? <span className="text-event-rose" aria-hidden="true"> *</span> : null}</span>
      {control}
      {error ? <span id={errorId} className="text-xs font-bold leading-5 text-red-700">{error}</span> : null}
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  name: string;
  children: React.ReactNode;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "children">;

export function SelectField({ label, name, required = false, children, className, ...selectProps }: SelectFieldProps) {
  const state = useActionFormState();
  const generatedId = useId();
  const error = state.fieldErrors?.[name]?.[0];
  const fieldId = `field-${name}-${generatedId.replace(/:/g, "")}`;
  const errorId = `${fieldId}-error`;

  return (
    <label className="grid gap-2 text-sm font-bold text-event-ink/72">
      <span>{label}{required ? <span className="text-event-rose" aria-hidden="true"> *</span> : null}</span>
      <select
        id={fieldId}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={className ?? "focus-ring min-h-12 w-full rounded-[16px] border border-event-ink/15 bg-event-paper px-4 text-base text-event-ink aria-[invalid=true]:border-red-400 aria-[invalid=true]:bg-red-50 sm:text-sm"}
        {...selectProps}
      >
        {children}
      </select>
      {error ? <span id={errorId} className="text-xs font-bold leading-5 text-red-700">{error}</span> : null}
    </label>
  );
}

export function SubmitButton({ children, pendingLabel = "Salvando...", className, ...props }: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <Button {...props} type="submit" disabled={pending || props.disabled} aria-disabled={pending || props.disabled} className={`w-full sm:w-auto ${className ?? ""}`}>{pending ? <><LoaderCircle className="animate-spin" size={17} aria-hidden="true" /> {pendingLabel}</> : children}</Button>;
}
