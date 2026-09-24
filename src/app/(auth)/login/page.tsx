import { login } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const params = await searchParams;
  const hasLoginError = params.erro === "1";

  return (
    <main className="grid min-h-screen place-items-center bg-event-paper px-4">
      <Card className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-sm font-bold text-event-rose">Eventos Sob Controle</p>
          <h1 className="mt-3 text-3xl font-black">Entre no seu financeiro</h1>
        </div>
        {hasLoginError ? (
          <div role="alert" className="mb-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            E-mail ou senha incorretos. Confira os dados e tente novamente.
          </div>
        ) : null}
        <form action={login} className="grid gap-4">
          <input className="focus-ring min-h-12 rounded-[16px] border border-event-ink/10 bg-event-paper px-4" name="email" type="email" placeholder="E-mail" required />
          <input className="focus-ring min-h-12 rounded-[16px] border border-event-ink/10 bg-event-paper px-4" name="password" type="password" placeholder="Senha" required />
          <Button type="submit">Entrar</Button>
        </form>
      </Card>
    </main>
  );
}
