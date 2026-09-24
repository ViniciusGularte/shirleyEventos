import { updatePassword } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DefinePasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-event-paper px-4">
      <Card className="w-full max-w-md">
        <h1 className="text-3xl font-black">Crie sua senha</h1>
        <form action={updatePassword} className="mt-8 grid gap-4">
          <input className="focus-ring min-h-12 rounded-[16px] border border-event-ink/10 bg-event-paper px-4" name="password" type="password" placeholder="Nova senha" required />
          <input className="focus-ring min-h-12 rounded-[16px] border border-event-ink/10 bg-event-paper px-4" name="confirmation" type="password" placeholder="Confirmar senha" required />
          <Button type="submit">Salvar senha</Button>
        </form>
      </Card>
    </main>
  );
}
