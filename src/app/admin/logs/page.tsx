import { requireAdmin } from "@/lib/auth/guards";
import { listAdminLogs } from "@/features/admin/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export default async function LogsPage() {
  const { supabase } = await requireAdmin();
  const logs = await listAdminLogs(supabase);
  return (
    <div className="grid gap-6">
      <PageHeader title="Logs" subtitle="Ações administrativas registradas." />
      <Card className="grid gap-2">
        {logs.map((log: any) => <div key={log.id} className="flex justify-between border-b border-event-ink/8 py-2 text-sm"><span>{log.action}</span><span>{new Date(log.created_at).toLocaleString("pt-BR")}</span></div>)}
      </Card>
    </div>
  );
}
