import { updatePassword } from "@/features/auth/actions";
import { Card } from "@/components/ui/card";
import { PasswordField } from "@/components/ui/password-field";
import { FlashMessage } from "@/components/ui/flash-message";
import { SubmitButton } from "@/components/ui/simple-form";

export default async function DefinePasswordPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-event-paper px-4 py-8">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-black">Crie sua senha</h1>
        <p className="mt-3 text-sm leading-6 text-event-ink/65">Use pelo menos 8 caracteres e repita a mesma senha nos dois campos.</p>
        {params.erro === "1" ? <div className="mt-4"><FlashMessage variant="error">As senhas precisam ser iguais e ter pelo menos 8 caracteres.</FlashMessage></div> : null}
        <form action={updatePassword} className="mt-8 grid gap-4">
          <PasswordField name="password" label="Nova senha" autoComplete="new-password" />
          <PasswordField name="confirmation" label="Confirmar senha" autoComplete="new-password" />
          <SubmitButton pendingLabel="Salvando senha...">Salvar senha</SubmitButton>
        </form>
      </Card>
    </main>
  );
}
