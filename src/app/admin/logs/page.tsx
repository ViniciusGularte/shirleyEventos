import { requireAdmin } from "@/lib/auth/guards";
import { listAdminLogs } from "@/features/admin/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function LogsPage() {
  const { supabase } = await requireAdmin();
  const logs = await listAdminLogs(supabase);
  return (
    <div className="grid gap-6">
      <PageHeader title="Logs" subtitle="Ações administrativas registradas." />
      {logs.length === 0 ? <EmptyState title="Nenhuma ação administrativa registrada.">Convites e mudanças de status aparecerão aqui.</EmptyState> : (
        <Card className="grid gap-2">
          {logs.map((log: any) => <div key={log.id} className="flex flex-col gap-1 border-b border-event-ink/8 py-3 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between"><span className="break-words font-bold">{formatAction(log.action)}</span><time className="shrink-0 text-event-ink/60" dateTime={log.created_at}>{new Date(log.created_at).toLocaleString("pt-BR")}</time></div>)}
        </Card>
      )}
    </div>
  );
}

function formatAction(action: string) {
  const labels: Record<string, string> = {
    student_invited: "Aluna convidada",
    student_active: "Acesso reativado",
    student_grace: "Aluna em carência",
    student_suspended: "Acesso suspenso",
    student_archived: "Aluna arquivada"
  };
  return labels[action] ?? action.replaceAll("_", " ");
}
