import { requireStudentWorkspace } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export default async function SettingsPage() {
  const { profile, workspace } = await requireStudentWorkspace();
  return (
    <div className="grid gap-6">
      <PageHeader title="Configurações" subtitle="Perfil, serviços, categorias e segurança." />
      <Card><h2 className="font-extrabold">Perfil</h2><p className="mt-2 text-sm text-event-ink/65">{profile.full_name}</p><p className="text-sm text-event-ink/65">{workspace.name}</p></Card>
      <Card><h2 className="font-extrabold">Serviços e categorias</h2><p className="mt-2 text-sm text-event-ink/65">Gerenciados pela mentoria no setup inicial e editáveis pelas telas financeiras do MVP.</p></Card>
    </div>
  );
}
