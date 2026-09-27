import { updateStudentStatus } from "@/features/admin/actions";
import { getStudent } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FlashMessage } from "@/components/ui/flash-message";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { SubmitButton } from "@/components/ui/simple-form";

export default async function StudentDetailPage({ params, searchParams }: { params: Promise<{ userId: string }>; searchParams: Promise<{ status?: string }> }) {
  const { userId } = await params;
  const query = await searchParams;
  const { supabase } = await requireAdmin();
  const student = await getStudent(supabase, userId);
  const workspace = (student as any)?.event_fin_workspace_members?.[0]?.event_fin_workspaces;

  return (
    <div className="grid gap-6">
      <PageHeader title={(student as any)?.full_name ?? "Aluna"} subtitle="Gerencie o acesso desta aluna ao sistema." action={<Link className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-event-ink/10 px-4 text-sm font-bold hover:border-event-rose/40" href="/admin/alunas"><ArrowLeft size={18} /> Voltar às alunas</Link>} />
      {query.status ? <FlashMessage>{statusMessage(query.status)}</FlashMessage> : null}
      <Card className="grid gap-4">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-event-ink/50">Status atual</p><StatusPill status={workspace?.status ?? "active"} /></div>
        <p className="text-sm leading-6 text-event-ink/65">Carência manté o acesso ativo, mas sinaliza acompanhamento. Suspender bloqueia temporariamente. Arquivar encerra o acesso e preserva o histórico.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <ActionForm action={updateStudentStatus.bind(null, userId, "active")}><SubmitButton className="w-full" pendingLabel="Reativando..." disabled={workspace?.status === "active"} variant="secondary">Reativar</SubmitButton></ActionForm>
          <ActionForm action={updateStudentStatus.bind(null, userId, "grace")}><SubmitButton className="w-full" pendingLabel="Atualizando..." disabled={workspace?.status === "grace"} variant="secondary">Carência</SubmitButton></ActionForm>
          <ActionForm action={updateStudentStatus.bind(null, userId, "suspended")}><ConfirmSubmitButton className="w-full border-amber-200 text-amber-800 hover:border-amber-400" disabled={workspace?.status === "suspended"} variant="secondary" message="Suspender o acesso desta aluna? Ela não conseguirá entrar até ser reativada.">Suspender</ConfirmSubmitButton></ActionForm>
          <ActionForm action={updateStudentStatus.bind(null, userId, "archived")}><ConfirmSubmitButton className="w-full border-red-200 text-red-700 hover:border-red-400" disabled={workspace?.status === "archived"} variant="secondary" message="Arquivar esta aluna? O acesso será bloqueado e o histórico será preservado.">Arquivar</ConfirmSubmitButton></ActionForm>
        </div>
      </Card>
    </div>
  );
}

function statusMessage(status: string) {
  const labels: Record<string, string> = { active: "Acesso reativado.", grace: "Aluna colocada em carência.", suspended: "Acesso suspenso.", archived: "Aluna arquivada." };
  return labels[status] ?? "Status atualizado.";
}
