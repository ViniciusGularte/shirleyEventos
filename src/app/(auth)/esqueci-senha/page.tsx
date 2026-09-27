import Link from "next/link";
import { requestPasswordReset } from "@/features/auth/actions";
import { Card } from "@/components/ui/card";
import { FlashMessage } from "@/components/ui/flash-message";
import { SubmitButton } from "@/components/ui/simple-form";

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ enviado?: string; erro?: string }> }) {
  const params = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-event-paper px-4 py-8">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-black">Recuperar senha</h1>
        <p className="mt-3 text-sm leading-6 text-event-ink/65">Informe o e-mail da sua conta. Enviaremos um link para criar uma nova senha.</p>
        {params.enviado === "1" ? <div className="mt-5"><FlashMessage>Se o e-mail estiver cadastrado, o link de recuperação chegará em alguns minutos.</FlashMessage></div> : null}
        {params.erro === "1" ? <div className="mt-5"><FlashMessage variant="error">Não foi possível enviar agora. Tente novamente em alguns minutos.</FlashMessage></div> : null}
        <form action={requestPasswordReset} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-event-ink/75">
            <span>E-mail <span className="text-event-rose" aria-hidden="true">*</span></span>
            <input className="focus-ring min-h-12 rounded-[16px] border border-event-ink/15 bg-event-paper px-4 text-base" name="email" type="email" autoComplete="email" inputMode="email" required />
          </label>
          <SubmitButton pendingLabel="Enviando...">Enviar link</SubmitButton>
          <Link className="focus-ring justify-self-center rounded-lg px-2 py-1 text-sm font-bold text-event-rose underline-offset-4 hover:underline" href="/login">Voltar para o login</Link>
        </form>
      </Card>
    </main>
  );
}
