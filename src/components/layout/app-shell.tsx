"use client";

import Link from "next/link";
import { CalendarDays, Home, Landmark, LogOut, MoreHorizontal, Settings, Users } from "lucide-react";
import { usePathname } from "next/navigation";
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
    <div className="min-h-dvh bg-event-paper">
      <a href="#conteudo-principal" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-xl bg-event-ink px-4 py-3 text-sm font-bold text-event-paper transition focus:translate-y-0">Pular para o conteúdo</a>
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-60 flex-col border-r border-event-paper/10 bg-event-ink px-4 py-6 text-event-paper md:flex">
        <div className="px-3 text-lg font-black leading-tight">Eventos<br />Sob Controle</div>
        <nav className="mt-10 flex flex-1 flex-col gap-2">
          {items.map((item) => <NavItem key={item.href} {...item} />)}
        </nav>
        <div className="space-y-2">
          {!admin ? <NavItem href="/app/configuracoes" label="Configurações" icon={Settings} /> : null}
          <form action="/auth/signout" method="post">
            <button className="focus-ring flex min-h-12 w-full items-center gap-3 rounded-[18px] px-3 py-3 text-sm text-event-paper/80 transition hover:bg-event-paper/10 hover:text-event-paper">
              <LogOut size={18} /> Sair
            </button>
          </form>
        </div>
      </aside>
      <MobileHeader admin={admin} />
      <main id="conteudo-principal" className="mx-auto min-h-dvh w-full max-w-[1440px] px-4 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-[calc(env(safe-area-inset-top)+5.5rem)] sm:px-6 md:pb-10 md:pl-72 md:pr-8 md:pt-8">
        {children}
      </main>
      <MobileBottomNav admin={admin} />
    </div>
  );
}

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
  const pathname = usePathname();
  const active = href === "/app" || href === "/admin" ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "focus-ring flex min-h-12 items-center gap-3 rounded-[18px] px-3 py-3 text-sm text-event-paper/80 transition hover:bg-event-paper/10 hover:text-event-paper",
        active && "bg-event-paper/12 font-extrabold text-event-paper"
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

function MobileHeader({ admin }: { admin: boolean }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex min-h-16 items-center justify-between border-b border-event-ink/10 bg-event-paper/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur md:hidden">
      <Link href={admin ? "/admin" : "/app"} className="focus-ring rounded-lg py-2 text-sm font-black leading-tight">
        Eventos Sob Controle
        <span className="block text-[11px] font-bold text-event-rose">{admin ? "Administração" : "Meu financeiro"}</span>
      </Link>
      <form action="/auth/signout" method="post">
        <button aria-label="Sair do sistema" className="focus-ring grid min-h-11 min-w-11 place-items-center rounded-full border border-event-ink/10 bg-white/70 text-event-ink transition hover:border-event-rose/40 hover:text-event-rose">
          <LogOut size={18} />
        </button>
      </form>
    </header>
  );
}

function MobileBottomNav({ admin }: { admin: boolean }) {
  const pathname = usePathname();
  const items = admin
    ? adminItems
    : [
        { href: "/app", label: "Início", icon: Home },
        { href: "/app/eventos", label: "Eventos", icon: CalendarDays },
        { href: "/app/financeiro", label: "Financeiro", icon: Landmark },
        { href: "/app/clientes", label: "Clientes", icon: Users },
        { href: "/app/configuracoes", label: "Mais", icon: MoreHorizontal }
      ];
  return (
    <nav
      aria-label={admin ? "Navegação administrativa" : "Navegação principal"}
      className={cn(
        "fixed bottom-0 left-0 z-40 grid w-full border-t border-event-ink/10 bg-event-paper/95 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 backdrop-blur md:hidden",
        admin ? "grid-cols-3" : "grid-cols-5"
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.href === "/app" || item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn("focus-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold text-event-ink/65", active && "text-event-rose")}
          >
            <span className={cn("grid h-7 w-9 place-items-center rounded-full transition", active && "bg-event-rose/10")}>
              <Icon size={18} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
