import Link from "next/link";
import { CalendarDays, Home, Landmark, LogOut, MoreHorizontal, Plus, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const studentItems = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/app/eventos", label: "Eventos", icon: CalendarDays },
  { href: "/app/financeiro", label: "Financeiro", icon: Landmark },
  { href: "/app/clientes", label: "Clientes", icon: Users }
];

const adminItems = [
  { href: "/admin", label: "Visão geral", icon: Home },
  { href: "/admin/alunas", label: "Alunas", icon: Users },
  { href: "/admin/logs", label: "Logs", icon: MoreHorizontal }
];

export function AppShell({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const items = admin ? adminItems : studentItems;
  return (
    <div className="min-h-screen bg-event-paper">
      <aside className="fixed left-0 top-0 hidden h-screen w-60 flex-col border-r border-event-ink/10 bg-event-ink px-4 py-6 text-event-paper md:flex">
        <div className="px-3 text-lg font-black leading-tight">Eventos<br />Sob Controle</div>
        <nav className="mt-10 flex flex-1 flex-col gap-2">
          {items.map((item) => <NavItem key={item.href} {...item} />)}
        </nav>
        <div className="space-y-2">
          {!admin ? <NavItem href="/app/configuracoes" label="Configurações" icon={Settings} /> : null}
          <form action="/auth/signout" method="post">
            <button className="flex w-full items-center gap-3 rounded-[18px] px-3 py-3 text-sm text-event-paper/78 transition hover:bg-event-paper/10">
              <LogOut size={18} /> Sair
            </button>
          </form>
        </div>
      </aside>
      <main className="mx-auto min-h-screen w-full max-w-[1440px] px-4 pb-24 pt-6 md:pl-72 md:pr-8">
        {children}
      </main>
      {!admin ? <MobileBottomNav /> : null}
    </div>
  );
}

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm text-event-paper/78 transition hover:bg-event-paper/10 hover:text-event-paper">
      <Icon size={18} />
      {label}
    </Link>
  );
}

function MobileBottomNav() {
  const items = [
    { href: "/app", label: "Início", icon: Home },
    { href: "/app/eventos", label: "Eventos", icon: CalendarDays },
    { href: "/app/eventos/novo", label: "Novo", icon: Plus, primary: true },
    { href: "/app/financeiro", label: "Financeiro", icon: Landmark },
    { href: "/app/configuracoes", label: "Mais", icon: MoreHorizontal }
  ];
  return (
    <nav className="fixed bottom-0 left-0 z-40 grid w-full grid-cols-5 border-t border-event-ink/10 bg-event-paper/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 backdrop-blur md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-[11px] font-bold text-event-ink/70">
            <span className={cn("grid h-9 w-9 place-items-center rounded-full", item.primary && "bg-event-rose text-event-paper")}>
              <Icon size={18} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
