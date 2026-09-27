import type { ZodError } from "zod";

export type ActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialActionState: ActionState = { status: "idle" };

export function validationState(error: ZodError, message = "Revise os campos destacados e tente novamente."): ActionState {
  return {
    status: "error",
    message,
    fieldErrors: error.flatten().fieldErrors as Record<string, string[]>
  };
}

export function errorState(message: string): ActionState {
  return { status: "error", message };
}
