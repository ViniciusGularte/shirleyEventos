import { updateStudentStatus } from "@/features/admin/actions";
import { getStudent } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";

export default async function StudentDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const { supabase } = await requireAdmin();
  const student = await getStudent(supabase, userId);
  const workspace = (student as any)?.event_fin_workspace_members?.[0]?.event_fin_workspaces;
  async function setSuspended() { "use server"; await updateStudentStatus(userId, "suspended"); }
  async function setActive() { "use server"; await updateStudentStatus(userId, "active"); }
  async function setGrace() { "use server"; await updateStudentStatus(userId, "grace"); }
  async function setArchived() { "use server"; await updateStudentStatus(userId, "archived"); }

  return (
    <div className="grid gap-6">
      <PageHeader title={(student as any)?.full_name ?? "Aluna"} subtitle="Dados financeiros em modo somente leitura no MVP." />
      <Card className="grid gap-4">
        <StatusPill status={workspace?.status ?? "active"} />
        <div className="flex flex-wrap gap-2">
          <form action={setActive}><Button type="submit" variant="secondary">Reativar</Button></form>
          <form action={setGrace}><Button type="submit" variant="secondary">Carência</Button></form>
          <form action={setSuspended}><Button type="submit" variant="secondary">Suspender</Button></form>
          <form action={setArchived}><Button type="submit" variant="secondary">Arquivar</Button></form>
        </div>
      </Card>
    </div>
  );
}
