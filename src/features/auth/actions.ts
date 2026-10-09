"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?erro=1");

  const { data: userData } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("event_fin_profiles").select("system_role").eq("id", userData.user?.id ?? "").single();
  redirect(profile?.system_role === "platform_admin" ? "/admin" : "/app");
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (password.length < 8 || password !== confirmation) redirect("/definir-senha?erro=1");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/definir-senha?erro=1");

  const { data: userData } = await supabase.auth.getUser();
  let systemRole: "platform_admin" | "student" | null = null;
  if (userData.user) {
    const { data: profile } = await supabase
      .from("event_fin_profiles")
      .select("system_role")
      .eq("id", userData.user.id)
      .single();
    systemRole = profile?.system_role ?? null;

    try {
      const admin = createAdminClient();
      await admin
        .from("event_fin_invites")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("auth_user_id", userData.user.id)
        .eq("status", "pending");
    } catch {
      // A atualização do histórico não deve impedir o acesso depois da troca da senha.
    }
  }
  redirect(systemRole === "platform_admin" ? "/admin" : "/app/boas-vindas?senha=1");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) redirect("/esqueci-senha?erro=1");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl.replace(/\/$/, "")}/definir-senha`
  });
  if (error) redirect("/esqueci-senha?erro=1");
  redirect("/esqueci-senha?enviado=1");
}
