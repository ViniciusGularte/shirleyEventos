import { inviteStudent } from "@/features/admin/actions";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Field, SubmitButton } from "@/components/ui/simple-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { dateInBrazil } from "@/features/admin/plan";

export default function NewStudentPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Adicionar aluna" subtitle="Cadastre o plano e envie o convite de acesso por e-mail." action={<Link className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-event-ink/10 px-4 text-sm font-bold hover:border-event-rose/40" href="/admin/alunas"><ArrowLeft size={18} /> Voltar às alunas</Link>} />
      <Card>
        <ActionForm action={inviteStudent} className="grid gap-4 md:grid-cols-2">
          <Field label="Nome completo" name="fullName" autoComplete="name" required />
          <Field label="E-mail" name="email" type="email" inputMode="email" autoComplete="email" required />
          <Field label="WhatsApp para cobrança" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="Ex.: (11) 99999-9999" />
          <div className="md:col-span-2 mt-2 border-t border-event-ink/10 pt-5"><h2 className="font-extrabold">Combinado do plano</h2><p className="mt-1 text-sm text-event-ink/55">Pode preencher agora ou completar depois no perfil da aluna.</p></div>
          <Field label="Data de entrada" name="planStartedOn" type="date" defaultValue={dateInBrazil()} />
          <Field label="Valor mensal" name="planAmount" type="number" inputMode="decimal" min="0" step="0.01" placeholder="Ex.: 149,90" />
          <Field label="Dia habitual do vencimento" name="paymentDueDay" type="number" inputMode="numeric" min="1" max="31" placeholder="Ex.: 10" />
          <Field label="Primeiro vencimento" name="nextPaymentDueOn" type="date" />
          <div className="md:col-span-2"><SubmitButton pendingLabel="Criando e enviando...">Criar aluna e enviar convite</SubmitButton></div>
        </ActionForm>
      </Card>
    </div>
  );
}
