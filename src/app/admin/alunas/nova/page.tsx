import { inviteStudent } from "@/features/admin/actions";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Field, SubmitButton } from "@/components/ui/simple-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";

export default function NewStudentPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Adicionar aluna" subtitle="Crie o espaço da aluna e envie o convite por e-mail." action={<Link className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-[18px] border border-event-ink/10 px-4 text-sm font-bold hover:border-event-rose/40" href="/admin/alunas"><ArrowLeft size={18} /> Voltar às alunas</Link>} />
      <Card>
        <ActionForm action={inviteStudent} className="grid gap-4 md:grid-cols-2">
          <Field label="Nome completo" name="fullName" autoComplete="name" required />
          <Field label="E-mail" name="email" type="email" inputMode="email" autoComplete="email" required />
          <div className="md:col-span-2"><SubmitButton>Enviar convite</SubmitButton></div>
        </ActionForm>
      </Card>
    </div>
  );
}
