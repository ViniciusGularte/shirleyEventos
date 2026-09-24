"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  redirect("/app");
}
