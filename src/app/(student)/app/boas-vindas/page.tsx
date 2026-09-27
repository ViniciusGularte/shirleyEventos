import Link from "next/link";
import { ArrowRight, CalendarDays, Check, CircleDollarSign, LayoutDashboard, Users } from "lucide-react";
import { requireStudentWorkspace } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { FlashMessage } from "@/components/ui/flash-message";
import { cn } from "@/lib/utils/cn";

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ senha?: string }> }) {
  const query = await searchParams;
  const { supabase, profile, workspaceId } = await requireStudentWorkspace();
  const [clientsResult, eventsResult, transactionsResult] = await Promise.all([
    supabase.from("event_fin_clients").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId).eq("is_active", true),
    supabase.from("event_fin_events").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
    supabase.from("event_fin_transactions").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId)
  ]);

  const steps = [
    { title: "Cadastre seu primeiro cliente", description: "Comece pelo nome e contato de quem contratou o serviço.", href: "/app/clientes", action: "Cadastrar cliente", icon: Users, complete: (clientsResult.count ?? 0) > 0 },
    { title: "Crie seu primeiro evento", description: "Registre serviço, datas, valor vendido e sinal recebido.", href: "/app/eventos/novo", action: "Criar evento", icon: CalendarDays, complete: (eventsResult.count ?? 0) > 0 },
    { title: "Organize o financeiro", description: "Lance um recebimento ou uma despesa e escolha a conta correta.", href: "/app/financeiro", action: "Abrir financeiro", icon: CircleDollarSign, complete: (transactionsResult.count ?? 0) > 0 },
    { title: "Acompanhe seu painel", description: "Veja os indicadores e use a distribuição para planejar o resultado.", href: "/app", action: "Ver meu painel", icon: LayoutDashboard, complete: (eventsResult.count ?? 0) > 0 && (transactionsResult.count ?? 0) > 0 }
  ];
  const completed = steps.filter((step) => step.complete).length;
  const progress = Math.round((completed / steps.length) * 100);
  const firstName = profile.full_name.split(" ")[0];

  return (
    <div className="grid gap-6">
      <PageHeader
        title={`Vamos organizar tudo, ${firstName}`}
        subtitle="Este guia acompanha seu progresso de verdade. Você pode sair e voltar quando quiser."
        action={<Link href="/app" className="focus-ring inline-flex min-h-12 items-center justify-center rounded-[18px] border border-event-ink/10 px-5 text-sm font-bold transition hover:border-event-rose/40">Pular por agora</Link>}
      />
      {query.senha === "1" ? <FlashMessage>Senha criada com sucesso. Sua conta está pronta para começar.</FlashMessage> : null}

      <Card className="overflow-hidden !bg-event-ink text-event-paper">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.16em] text-event-paper/55">Primeiros passos</p>
            <h2 className="mt-2 text-2xl font-black">{completed === steps.length ? "Tudo pronto para crescer" : `${completed} de ${steps.length} etapas concluídas`}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-event-paper/70">Complete no seu ritmo. Cada etapa alimenta os indicadores do sistema.</p>
          </div>
          <strong className="text-3xl font-black tabular-nums text-event-paper">{progress}%</strong>
        </div>
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-event-paper/12" role="progressbar" aria-label="Progresso do guia inicial" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-event-rose transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Etapas do guia inicial">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} className={cn("relative flex flex-col gap-5 transition", step.complete && "border-emerald-200 !bg-emerald-50/55")}>
              <div className="flex items-start gap-4">
                <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-[16px]", step.complete ? "bg-emerald-600 text-white" : "bg-event-rose/10 text-event-rose")}>
                  {step.complete ? <Check size={22} strokeWidth={3} /> : <Icon size={22} />}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-event-ink/45">Etapa {index + 1}</p>
                  <h2 className="mt-1 text-lg font-extrabold">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-event-ink/62">{step.description}</p>
                </div>
              </div>
              <Link href={step.href} className={cn("focus-ring mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-[16px] px-4 text-sm font-extrabold transition", step.complete ? "border border-emerald-200 bg-white text-emerald-800 hover:border-emerald-400" : "bg-event-ink text-event-paper hover:bg-event-rose")}>
                {step.complete ? "Revisar etapa" : step.action} <ArrowRight size={17} />
              </Link>
            </Card>
          );
        })}
      </section>

      <p className="text-center text-sm text-event-ink/55">Nada aqui bloqueia o uso do sistema. O guia existe para dar contexto, não para limitar seu caminho.</p>
    </div>
  );
}
