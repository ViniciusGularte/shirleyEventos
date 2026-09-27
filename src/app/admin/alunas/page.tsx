import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { listStudents } from "@/features/admin/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { FlashMessage } from "@/components/ui/flash-message";
import { EmptyState } from "@/components/ui/empty-state";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ convite?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const students = await listStudents(supabase);
  return (
    <div className="grid gap-6">
      <PageHeader title="Alunas" subtitle="Convites, status de acesso e último login." action={<Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-[18px] bg-event-ink px-5 text-sm font-bold text-event-paper transition hover:bg-event-rose" href="/admin/alunas/nova">Adicionar aluna</Link>} />
      {params.convite === "1" ? <FlashMessage>Convite enviado e espaço da aluna criado com sucesso.</FlashMessage> : null}
      {students.length === 0 ? <EmptyState title="Nenhuma aluna cadastrada.">Use “Adicionar aluna” para enviar o primeiro convite.</EmptyState> : null}
      <div className="grid gap-3">
        {students.map((student: any) => {
          const workspace = student.event_fin_workspace_members?.[0]?.event_fin_workspaces;
          return (
            <Link className="focus-ring block rounded-[22px]" href={`/admin/alunas/${student.id}`} key={student.id}>
              <Card className="grid gap-3 transition hover:-translate-y-0.5 hover:border-event-rose/30 hover:shadow-event lg:grid-cols-[minmax(180px,1fr)_130px_130px_130px] lg:items-center">
                <div className="min-w-0"><h2 className="font-extrabold">{student.full_name}</h2><p className="truncate text-sm text-event-ink/55" title={student.id}>ID: {student.id}</p></div>
                <StatusPill status={workspace?.status ?? "active"} />
                <span className="text-sm">{new Date(student.created_at).toLocaleDateString("pt-BR")}</span>
                <span className="text-sm">{student.last_seen_at ? new Date(student.last_seen_at).toLocaleDateString("pt-BR") : "Sem acesso"}</span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
