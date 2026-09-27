import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { listStudents } from "@/features/admin/queries";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { Card } from "@/components/ui/card";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const students = await listStudents(supabase);
  const workspaces = students.map((student: any) => student.event_fin_workspace_members?.[0]?.event_fin_workspaces).filter(Boolean);
  return (
    <div className="grid gap-6">
      <PageHeader title="Visão geral" subtitle="Controle de acesso das alunas." action={<Link className="focus-ring inline-flex min-h-12 items-center justify-center rounded-[18px] bg-event-ink px-5 text-sm font-bold text-event-paper transition hover:bg-event-rose" href="/admin/alunas/nova">Adicionar aluna</Link>} />
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <MetricCard label="Total de alunas" value={String(students.length)} />
        <MetricCard label="Ativas" value={String(workspaces.filter((w: any) => w.status === "active").length)} />
        <MetricCard label="Em carência" value={String(workspaces.filter((w: any) => w.status === "grace").length)} />
        <MetricCard label="Suspensas" value={String(workspaces.filter((w: any) => w.status === "suspended").length)} />
        <MetricCard label="Novas este mês" value={String(students.filter((s: any) => new Date(s.created_at).getMonth() === new Date().getMonth()).length)} />
      </section>
      <Card><h2 className="font-extrabold">Últimos acessos</h2><div className="mt-3 grid gap-2">{students.length === 0 ? <p className="text-sm text-event-ink/60">Nenhuma aluna cadastrada.</p> : students.slice(0, 8).map((student: any) => <div key={student.id} className="flex flex-col gap-1 border-b border-event-ink/8 py-2 text-sm last:border-0 sm:flex-row sm:justify-between"><span className="font-bold">{student.full_name}</span><span className="text-event-ink/60">{student.last_seen_at ? new Date(student.last_seen_at).toLocaleDateString("pt-BR") : "Sem acesso"}</span></div>)}</div></Card>
    </div>
  );
}
