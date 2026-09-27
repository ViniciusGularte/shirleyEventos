"use client";

import { Button, type ButtonProps } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function ConfirmSubmitButton({ message, children, ...props }: ButtonProps & { message: string }) {
  const { pending } = useFormStatus();
  return <Button {...props} type="submit" disabled={pending || props.disabled} aria-disabled={pending || props.disabled} onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>{pending ? <><LoaderCircle className="animate-spin" size={17} aria-hidden="true" /> Aguarde...</> : children}</Button>;
}
