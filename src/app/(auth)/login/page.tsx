import { login } from "@/features/auth/actions";
import { Card } from "@/components/ui/card";
import { PasswordField } from "@/components/ui/password-field";
import { FlashMessage } from "@/components/ui/flash-message";
import Link from "next/link";
import { SubmitButton } from "@/components/ui/simple-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const params = await searchParams;
  const hasLoginError = params.erro === "1";

  return (
    <main className="grid min-h-dvh place-items-center bg-event-paper px-4 py-8">
      <Card className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm font-bold text-event-rose">Eventos Sob Controle</p>
          <h1 className="mt-3 text-3xl font-black">Entre no seu financeiro</h1>
        </div>
        {params.sucesso === "senha" ? <div className="mb-4"><FlashMessage>Senha atualizada. Entre com a nova senha.</FlashMessage></div> : null}
        {hasLoginError ? <div className="mb-4"><FlashMessage variant="error">E-mail ou senha incorretos. Confira os dados e tente novamente.</FlashMessage></div> : null}
        <form action={login} className="grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-event-ink/75">
            <span>E-mail <span className="text-event-rose" aria-hidden="true">*</span></span>
            <input className="focus-ring min-h-12 rounded-[16px] border border-event-ink/15 bg-event-paper px-4 text-base" name="email" type="email" autoComplete="email" inputMode="email" required />
          </label>
          <PasswordField name="password" label="Senha" autoComplete="current-password" />
          <SubmitButton pendingLabel="Entrando...">Entrar</SubmitButton>
          <Link className="focus-ring justify-self-center rounded-lg px-2 py-1 text-sm font-bold text-event-rose underline-offset-4 hover:underline" href="/esqueci-senha">Esqueci minha senha</Link>
        </form>
      </Card>
    </main>
  );
}
