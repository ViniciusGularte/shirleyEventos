import Link from "next/link";
import { ArrowLeft, CalendarDays, CircleDollarSign, PauseCircle, PlayCircle } from "lucide-react";
import { pauseStudentPlan, registerPayment, registerPaymentReminder, resumeStudentPlan, updateStudentPlan, updateStudentStatus } from "@/features/admin/actions";
import { formatDate, formatDateTime, formatMoney, getPlanSituation } from "@/features/admin/plan";
import { getStudent } from "@/features/admin/queries";
import { requireAdmin } from "@/lib/auth/guards";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { FlashMessage } from "@/components/ui/flash-message";
import { ActionForm } from "@/components/ui/action-form";
import { Field, SelectField, SubmitButton } from "@/components/ui/simple-form";

export default async function StudentDetailPage({ params, searchParams }: { params: Promise<{ userId: string }>; searchParams: Promise<{ status?: string; updated?: string }> }) {
  const { userId } = await params;
  const query = await searchParams;
  const { supabase } = await requireAdmin();
  const student = await getStudent(supabase, userId);
  const workspace = (student as any)?.event_fin_workspace_members?.[0]?.event_fin_workspaces;
  const plan = getPlanSituation(workspace);

  return (
    <div className="grid gap-6">
      <PageHeader title={(student as any)?.full_name ?? "Aluna"} subtitle="Plano, pagamentos e acesso em um só lugar." action={<Link className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-event-ink/10 px-4 text-sm font-bold hover:border-event-rose/40" href="/admin/alunas"><ArrowLeft size={18} /> Voltar às alunas</Link>} />
      {query.status ? <FlashMessage>{statusMessage(query.status)}</FlashMessage> : null}
      {query.updated ? <FlashMessage>{updateMessage(query.updated)}</FlashMessage> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo da aluna">
        <Summary label="Entrada" value={formatDate(workspace?.plan_started_on ?? (student as any)?.created_at)} icon={<CalendarDays size={19} />} />
        <Summary label="Mensalidade" value={formatMoney(workspace?.plan_amount)} icon={<CircleDollarSign size={19} />} />
        <Summary label="Situação do plano" value={plan.label} hint={plan.detail} tone={plan.kind} />
        <Summary label="Último acesso" value={(student as any)?.last_seen_at ? new Date((student as any).last_seen_at).toLocaleDateString("pt-BR") : "Ainda não acessou"} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
        <Card>
          <div className="mb-5"><h2 className="text-lg font-black">Controle do plano</h2><p className="mt-1 text-sm leading-6 text-event-ink/60">Atualize o combinado financeiro. Esses dados aparecem apenas para a administração.</p></div>
          <ActionForm action={updateStudentPlan.bind(null, userId)} className="grid gap-4 sm:grid-cols-2">
            <Field label="Data de entrada" name="planStartedOn" type="date" defaultValue={workspace?.plan_started_on ?? ""} />
            <Field label="Valor mensal" name="planAmount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="Ex.: 149,90" defaultValue={workspace?.plan_amount ?? ""} />
            <Field label="E-mail financeiro" name="billingEmail" type="email" inputMode="email" defaultValue={workspace?.billing_email ?? ""} />
            <Field label="WhatsApp para cobrança" name="billingPhone" type="tel" inputMode="tel" placeholder="Ex.: (11) 99999-9999" defaultValue={workspace?.billing_phone ?? ""} />
            <Field label="Dia habitual do vencimento" name="paymentDueDay" type="number" inputMode="numeric" min="1" max="31" placeholder="Ex.: 10" defaultValue={workspace?.payment_due_day ?? ""} />
            <Field label="Próximo vencimento" name="nextPaymentDueOn" type="date" defaultValue={workspace?.next_payment_due_on ?? ""} />
            <Field label="Último pagamento" name="lastPaymentOn" type="date" defaultValue={workspace?.last_payment_on ?? ""} />
            <div className="sm:col-span-2"><Field label="Observações internas" name="planNotes"><textarea defaultValue={workspace?.plan_notes ?? ""} rows={4} maxLength={600} placeholder="Ex.: condição combinada, desconto ou detalhe importante" className="focus-ring w-full rounded-[16px] border border-event-ink/15 bg-event-paper px-4 py-3 text-base text-event-ink sm:text-sm" /></Field></div>
            <div className="sm:col-span-2"><SubmitButton pendingLabel="Salvando plano...">Salvar dados do plano</SubmitButton></div>
          </ActionForm>
        </Card>

        <div className="grid content-start gap-5">
          <Card>
            <h2 className="text-lg font-black">Pagamento</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <InfoRow label="Próximo vencimento" value={formatDate(workspace?.next_payment_due_on)} />
              <InfoRow label="Último pagamento" value={formatDate(workspace?.last_payment_on)} />
              <InfoRow label="Último lembrete" value={formatDateTime(workspace?.payment_reminder_at)} />
            </dl>
            <ActionForm action={registerPayment.bind(null, userId)} className="mt-4"><ConfirmSubmitButton className="w-full" message="Confirmar que o pagamento foi recebido? O próximo vencimento avançará um mês.">Registrar pagamento recebido</ConfirmSubmitButton></ActionForm>
          </Card>

          <Card>
            <h2 className="text-lg font-black">Lembrete de pagamento</h2>
            <p className="mt-1 text-sm leading-6 text-event-ink/60">Abra a conversa com uma mensagem pronta. Depois, registre o contato abaixo.</p>
            {whatsAppReminderUrl(workspace, (student as any)?.full_name) ? <a href={whatsAppReminderUrl(workspace, (student as any)?.full_name)!} target="_blank" rel="noreferrer" className="focus-ring mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-[18px] bg-emerald-700 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-800">Abrir lembrete no WhatsApp</a> : <p className="mt-4 rounded-[14px] bg-event-ink/5 px-3 py-2 text-xs font-bold text-event-ink/60">Cadastre o WhatsApp financeiro para liberar a mensagem pronta.</p>}
            <ActionForm action={registerPaymentReminder.bind(null, userId)} className="mt-4 grid gap-4">
              <SelectField label="Canal usado" name="channel" required defaultValue={workspace?.payment_reminder_channel ?? "whatsapp"}>
                <option value="whatsapp">WhatsApp</option><option value="email">E-mail</option><option value="phone">Ligação</option><option value="other">Outro</option>
              </SelectField>
              <Field label="Anotação" name="note"><textarea rows={3} maxLength={300} placeholder="Ex.: pediu para pagar na sexta" className="focus-ring w-full rounded-[16px] border border-event-ink/15 bg-event-paper px-4 py-3 text-base text-event-ink sm:text-sm" /></Field>
              <SubmitButton pendingLabel="Registrando..." variant="secondary">Registrar lembrete feito</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      </section>

      <Card className="grid gap-5">
        <div><h2 className="text-lg font-black">Pausa do plano</h2><p className="mt-1 text-sm leading-6 text-event-ink/60">Pausar o plano também bloqueia o acesso. Retomar libera o sistema novamente.</p></div>
        {workspace?.plan_paused_at ? (
          <div className="grid gap-4 rounded-[18px] border border-amber-200 bg-amber-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div><p className="font-extrabold text-amber-950">Pausado em {formatDateTime(workspace.plan_paused_at)}</p><p className="mt-1 text-sm text-amber-900/75">Motivo: {workspace.plan_pause_reason || "Não informado"}</p></div>
            <ActionForm action={resumeStudentPlan.bind(null, userId)}><ConfirmSubmitButton className="w-full sm:w-auto" message="Retomar este plano e liberar o acesso da aluna?"><PlayCircle size={18} /> Retomar plano</ConfirmSubmitButton></ActionForm>
          </div>
        ) : (
          <ActionForm action={pauseStudentPlan.bind(null, userId)} className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <Field label="Motivo da pausa" name="reason" placeholder="Ex.: férias, acordo temporário ou pedido da aluna" required />
            <ConfirmSubmitButton disabled={workspace?.status === "archived"} variant="secondary" className="w-full border-amber-200 text-amber-900 hover:border-amber-400" message="Pausar o plano e bloquear o acesso desta aluna?"><PauseCircle size={18} /> Pausar plano</ConfirmSubmitButton>
          </ActionForm>
        )}
      </Card>

      <Card className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-black">Acesso à plataforma</h2><StatusPill status={workspace?.status ?? "active"} /></div>
        <p className="text-sm leading-6 text-event-ink/65">Carência mantém o acesso e sinaliza acompanhamento. Suspender bloqueia temporariamente. Arquivar encerra o acesso e preserva o histórico.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <ActionForm action={updateStudentStatus.bind(null, userId, "active")}><SubmitButton className="w-full" pendingLabel="Reativando..." disabled={workspace?.status === "active" || Boolean(workspace?.plan_paused_at)} variant="secondary">Reativar acesso</SubmitButton></ActionForm>
          <ActionForm action={updateStudentStatus.bind(null, userId, "grace")}><SubmitButton className="w-full" pendingLabel="Atualizando..." disabled={workspace?.status === "grace" || Boolean(workspace?.plan_paused_at)} variant="secondary">Dar carência</SubmitButton></ActionForm>
          <ActionForm action={updateStudentStatus.bind(null, userId, "suspended")}><ConfirmSubmitButton className="w-full border-amber-200 text-amber-800 hover:border-amber-400" disabled={workspace?.status === "suspended"} variant="secondary" message="Suspender o acesso desta aluna? Ela não conseguirá entrar até ser reativada.">Suspender acesso</ConfirmSubmitButton></ActionForm>
          <ActionForm action={updateStudentStatus.bind(null, userId, "archived")}><ConfirmSubmitButton className="w-full border-red-200 text-red-700 hover:border-red-400" disabled={workspace?.status === "archived"} variant="secondary" message="Arquivar esta aluna? O acesso será bloqueado e o histórico será preservado.">Arquivar aluna</ConfirmSubmitButton></ActionForm>
        </div>
      </Card>
    </div>
  );
}

function Summary({ label, value, hint, icon, tone }: { label: string; value: string; hint?: string; icon?: React.ReactNode; tone?: string }) {
  const color = tone === "overdue" ? "text-red-700" : tone === "due_soon" || tone === "paused" ? "text-amber-800" : "text-event-ink";
  return <Card className="min-h-28"><div className="flex items-center gap-2 text-sm font-bold text-event-ink/55">{icon}{label}</div><strong className={`mt-3 block text-xl font-black ${color}`}>{value}</strong>{hint ? <p className="mt-1 text-xs text-event-ink/55">{hint}</p> : null}</Card>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-event-ink/8 pb-3 last:border-0 last:pb-0"><dt className="text-event-ink/55">{label}</dt><dd className="text-right font-bold">{value}</dd></div>;
}

function statusMessage(status: string) {
  const labels: Record<string, string> = { active: "Acesso reativado.", grace: "Carência registrada.", suspended: "Acesso suspenso.", archived: "Aluna arquivada." };
  return labels[status] ?? "Status atualizado.";
}

function updateMessage(update: string) {
  const labels: Record<string, string> = { plan: "Dados do plano salvos.", paused: "Plano pausado e acesso bloqueado.", resumed: "Plano retomado e acesso liberado.", reminder: "Lembrete de pagamento registrado.", payment: "Pagamento registrado e próximo vencimento atualizado." };
  return labels[update] ?? "Informações atualizadas.";
}

function whatsAppReminderUrl(workspace: any, fullName: string) {
  const rawPhone = String(workspace?.billing_phone ?? "").replace(/\D/g, "");
  if (!rawPhone) return null;
  const phone = rawPhone.length === 10 || rawPhone.length === 11 ? `55${rawPhone}` : rawPhone;
  const firstName = String(fullName ?? "").trim().split(/\s+/)[0] || "tudo bem";
  const due = workspace?.next_payment_due_on ? ` vence em ${formatDate(workspace.next_payment_due_on)}` : " está pendente";
  const message = `Oi, ${firstName}! Passando para lembrar que a mensalidade da plataforma${due}. Se você já pagou, pode desconsiderar, tá?`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
