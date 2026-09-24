"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStudentWorkspace } from "@/lib/auth/guards";

const clientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional()
});

export async function createClient(formData: FormData) {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const input = clientSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || "",
    notes: formData.get("notes") || undefined
  });
  const { error } = await supabase.from("event_fin_clients").insert({ ...input, workspace_id: workspaceId });
  if (error) throw new Error("Não foi possível salvar cliente.");
  revalidatePath("/app/clientes");
}

export async function archiveClient(clientId: string) {
  const { supabase, workspaceId } = await requireStudentWorkspace();
  const { error } = await supabase.from("event_fin_clients").update({ is_active: false }).eq("workspace_id", workspaceId).eq("id", clientId);
  if (error) throw new Error("Não foi possível arquivar cliente.");
  revalidatePath("/app/clientes");
}
