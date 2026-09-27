import Link from "next/link";
import { CalendarDays, Landmark, ListChecks, LogOut, Users } from "lucide-react";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export default async function SettingsPage() {
  const { profile, workspace } = await requireStudentWorkspace();
  return (
    <div className="grid gap-6">
      <PageHeader title="Configurações" subtitle="Perfil, atalhos e segurança da conta." />
      <Card>
        <h2 className="font-extrabold">Perfil</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-event-ink/50">Nome</dt><dd className="mt-1 font-bold">{profile.full_name}</dd></div>
          <div><dt className="text-event-ink/50">Espaço de trabalho</dt><dd className="mt-1 font-bold">{workspace.name}</dd></div>
        </dl>
      </Card>
      <Card>
        <h2 className="font-extrabold">Atalhos</h2>
        <p className="mt-1 text-sm text-event-ink/60">Acesse rapidamente as áreas principais, inclusive no celular.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Shortcut href="/app/boas-vindas" label="Guia inicial" icon={ListChecks} />
          <Shortcut href="/app/eventos" label="Eventos" icon={CalendarDays} />
          <Shortcut href="/app/financeiro" label="Financeiro" icon={Landmark} />
          <Shortcut href="/app/clientes" label="Clientes" icon={Users} />
        </div>
      </Card>
      <Card>
        <h2 className="font-extrabold">Serviços e categorias</h2>
        <p className="mt-2 text-sm leading-6 text-event-ink/65">Os serviços e as categorias são preparados pela mentoria no cadastro inicial. Use a tela Financeiro para registrar movimentações e escolher as categorias disponíveis.</p>
      </Card>
      <Card className="md:hidden">
        <h2 className="font-extrabold">Segurança</h2>
        <p className="mt-1 text-sm text-event-ink/60">Encerre a sessão ao usar um aparelho compartilhado.</p>
        <form action="/auth/signout" method="post" className="mt-4">
          <button className="focus-ring inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] border border-event-ink/15 px-5 text-sm font-extrabold"><LogOut size={18} /> Sair do sistema</button>
        </form>
      </Card>
    </div>
  );
}

function Shortcut({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  return <Link href={href} className="focus-ring flex min-h-12 items-center gap-3 rounded-[16px] border border-event-ink/10 bg-event-paper/70 px-4 text-sm font-bold transition hover:border-event-rose/40 hover:text-event-rose"><Icon size={18} /> {label}</Link>;
}
