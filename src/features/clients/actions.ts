"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { errorState, validationState, type ActionState } from "@/lib/actions/state";

const clientSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome com pelo menos 2 caracteres."),
  phone: z.string().optional(),
  email: z.string().email("Informe um e-mail válido.").optional().or(z.literal("")),
  notes: z.string().optional()
});

export async function createClient(_state: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const parsed = clientSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || "",
    notes: formData.get("notes") || undefined
  });
  if (!parsed.success) return validationState(parsed.error);

  const { error } = await supabase.from("event_fin_clients").insert({ ...parsed.data, workspace_id: workspaceId });
  if (error) return errorState("Não foi possível salvar o cliente. Confira os dados e tente novamente.");
  revalidatePath("/app/clientes");
  redirect("/app/clientes?criado=1");
}

export async function archiveClient(clientId: string) {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const { error } = await supabase.from("event_fin_clients").update({ is_active: false }).eq("workspace_id", workspaceId).eq("id", clientId);
  if (error) throw new Error("Não foi possível arquivar cliente.");
  revalidatePath("/app/clientes");
}
