import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { listStudents } from "@/features/admin/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

export default async function StudentsPage() {
  const { supabase } = await requireAdmin();
  const students = await listStudents(supabase);
  return (
    <div className="grid gap-6">
      <PageHeader title="Alunas" subtitle="Convites, status de acesso e último login." action={<Link className="rounded-[18px] bg-event-ink px-5 py-3 text-sm font-bold text-event-paper" href="/admin/alunas/nova">+ Adicionar aluna</Link>} />
      <div className="grid gap-3">
        {students.map((student: any) => {
          const workspace = student.event_fin_workspace_members?.[0]?.event_fin_workspaces;
          return (
            <Link href={`/admin/alunas/${student.id}`} key={student.id}>
              <Card className="grid gap-3 md:grid-cols-[1fr_130px_130px_130px] md:items-center">
                <div><h2 className="font-extrabold">{student.full_name}</h2><p className="text-sm text-event-ink/55">{student.id}</p></div>
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
