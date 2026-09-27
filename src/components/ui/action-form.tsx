"use client";

import { createContext, useActionState, useContext, useEffect, useRef, type FormHTMLAttributes } from "react";
import { CircleAlert } from "lucide-react";
import { initialActionState, type ActionState } from "@/lib/actions/state";
import { cn } from "@/lib/utils/cn";

type FormAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

const ActionFormContext = createContext<ActionState>(initialActionState);

export function ActionForm({ action, children, className, ...props }: Omit<FormHTMLAttributes<HTMLFormElement>, "action"> & { action: FormAction }) {
  const [state, formAction] = useActionState(action, initialActionState);
  const alertRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submittedValues = useRef<Array<[string, FormDataEntryValue]>>([]);

  useEffect(() => {
    if (state.status !== "error") return;
    const form = formRef.current;
    for (const [name, value] of submittedValues.current) {
      if (!form || typeof value !== "string") continue;
      const controls = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${CSS.escape(name)}"]`);
      controls.forEach((control) => {
        if (control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")) control.checked = control.value === value;
        else control.value = value;
      });
    }
    alertRef.current?.focus();
  }, [state]);

  return (
    <ActionFormContext.Provider value={state}>
      <form ref={formRef} action={formAction} noValidate className={cn(className)} {...props} onSubmit={(event) => { submittedValues.current = Array.from(new FormData(event.currentTarget).entries()); props.onSubmit?.(event); }}>
        {state.status === "error" ? (
          <div ref={alertRef} role="alert" tabIndex={-1} className="col-span-full mb-1 flex items-start gap-3 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-5 text-red-800 outline-none focus:ring-2 focus:ring-red-300">
            <CircleAlert className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
            <span>{state.message}</span>
          </div>
        ) : null}
        {children}
      </form>
    </ActionFormContext.Provider>
  );
}

export function useActionFormState() {
  return useContext(ActionFormContext);
}

export function FieldError({ name }: { name: string }) {
  const state = useActionFormState();
  const error = state.fieldErrors?.[name]?.[0];
  return error ? <p className="text-xs font-bold leading-5 text-red-700">{error}</p> : null;
}
