import { inviteStudent } from "@/features/admin/actions";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Field, SubmitButton } from "@/components/ui/simple-form";

export default function NewStudentPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Adicionar aluna" subtitle="Cria workspace, convite e usuário Supabase." />
      <Card>
        <form action={inviteStudent} className="grid gap-4 md:grid-cols-2">
          <Field label="Nome completo" name="fullName" required />
          <Field label="E-mail" name="email" type="email" required />
          <div className="md:col-span-2"><SubmitButton>Enviar convite</SubmitButton></div>
        </form>
      </Card>
    </div>
  );
}
