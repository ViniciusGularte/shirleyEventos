import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { listStudents } from "@/features/admin/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { FlashMessage } from "@/components/ui/flash-message";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatMoney, getPlanSituation } from "@/features/admin/plan";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ convite?: string }> }) {
  const params = await searchParams;
  const { supabase } = await requireAdmin();
  const students = await listStudents(supabase);
  return (
    <div className="grid gap-6">
      <PageHeader title="Alunas" subtitle="Entrada, mensalidade, vencimento e situação de cada plano." action={<Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-[18px] bg-event-ink px-5 text-sm font-bold text-event-paper transition hover:bg-event-rose" href="/admin/alunas/nova">Adicionar aluna</Link>} />
      {params.convite === "1" ? <FlashMessage>Convite enviado e espaço da aluna criado com sucesso.</FlashMessage> : null}
      {students.length === 0 ? <EmptyState title="Nenhuma aluna cadastrada.">Use “Adicionar aluna” para enviar o primeiro convite.</EmptyState> : null}
      <div className="grid gap-3">
        {students.map((student: any) => {
          const workspace = student.event_fin_workspace_members?.[0]?.event_fin_workspaces;
          const plan = getPlanSituation(workspace);
          return (
            <Link className="focus-ring block rounded-[22px]" href={`/admin/alunas/${student.id}`} key={student.id}>
              <Card className="grid gap-4 transition hover:-translate-y-0.5 hover:border-event-rose/30 hover:shadow-event xl:grid-cols-[minmax(190px,1fr)_130px_140px_150px_130px] xl:items-center">
                <div className="min-w-0"><h2 className="font-extrabold">{student.full_name}</h2><div className="mt-2"><StatusPill status={workspace?.status ?? "active"} /></div></div>
                <ListValue label="Entrada" value={formatDate(workspace?.plan_started_on ?? student.created_at)} />
                <ListValue label="Mensalidade" value={formatMoney(workspace?.plan_amount)} />
                <ListValue label="Plano" value={plan.label} tone={plan.kind} />
                <ListValue label="Vencimento" value={formatDate(workspace?.next_payment_due_on)} />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ListValue({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const color = tone === "overdue" ? "text-red-700" : tone === "due_soon" || tone === "paused" ? "text-amber-800" : "text-event-ink";
  return <div><span className="block text-xs font-bold uppercase tracking-wide text-event-ink/45">{label}</span><span className={`mt-1 block text-sm font-bold ${color}`}>{value}</span></div>;
}
