import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { listStudents } from "@/features/admin/queries";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Card } from "@/components/ui/card";
import { formatDate, formatMoney, getPlanSituation } from "@/features/admin/plan";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const students = await listStudents(supabase);
  const workspaces = students.map((student: any) => student.event_fin_workspace_members?.[0]?.event_fin_workspaces).filter(Boolean);
  const plans = workspaces.map((workspace: any) => ({ workspace, situation: getPlanSituation(workspace) }));
  const overdue = plans.filter(({ situation }) => situation.kind === "overdue");
  const dueSoon = plans.filter(({ situation }) => situation.kind === "due_soon");
  const paused = plans.filter(({ situation }) => situation.kind === "paused");
  const expectedRevenue = workspaces.filter((workspace: any) => !workspace.plan_paused_at && workspace.status !== "archived").reduce((total: number, workspace: any) => total + Number(workspace.plan_amount ?? 0), 0);
  return (
    <div className="grid gap-6">
      <PageHeader title="Visão geral" subtitle="Acompanhe planos, pagamentos e acessos das alunas." action={<Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-[18px] bg-event-ink px-5 text-sm font-bold text-event-paper transition hover:bg-event-rose" href="/admin/alunas/nova">Adicionar aluna</Link>} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Total de alunas" value={String(students.length)} />
        <MetricCard label="Ativas" value={String(workspaces.filter((w: any) => w.status === "active").length)} />
        <MetricCard label="Pagamentos atrasados" value={String(overdue.length)} hint="Precisam de atenção" />
        <MetricCard label="Vencem em 7 dias" value={String(dueSoon.length)} />
        <MetricCard label="Planos pausados" value={String(paused.length)} />
        <MetricCard label="Mensal previsto" value={formatMoney(expectedRevenue)} hint="Planos não pausados" />
      </section>
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-extrabold">Cobranças que pedem atenção</h2><p className="mt-1 text-sm text-event-ink/55">Atrasadas primeiro, depois os próximos vencimentos.</p></div><Link href="/admin/alunas" className="focus-ring rounded-lg text-sm font-bold text-event-rose hover:underline">Ver todas as alunas</Link></div>
        <div className="mt-4 grid gap-2">
          {[...overdue, ...dueSoon].length === 0 ? <p className="text-sm text-event-ink/60">Nenhum vencimento urgente agora.</p> : [...overdue, ...dueSoon].slice(0, 8).map(({ workspace, situation }: any) => {
            const student = students.find((item: any) => item.event_fin_workspace_members?.[0]?.event_fin_workspaces?.id === workspace.id);
            return <Link href={`/admin/alunas/${student?.id}`} key={workspace.id} className="focus-ring grid gap-1 rounded-[14px] border-b border-event-ink/8 px-2 py-3 text-sm last:border-0 hover:bg-event-ink/[.03] sm:grid-cols-[1fr_150px_130px] sm:items-center"><span className="font-bold">{student?.full_name ?? workspace.name}</span><span className={situation.kind === "overdue" ? "font-bold text-red-700" : "font-bold text-amber-800"}>{situation.label}</span><span className="text-event-ink/60">{formatDate(workspace.next_payment_due_on)}</span></Link>;
          })}
        </div>
      </Card>
    </div>
  );
}
