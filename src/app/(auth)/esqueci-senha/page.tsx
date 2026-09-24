import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="max-w-md">
        <h1 className="text-2xl font-black">Recuperar senha</h1>
        <p className="mt-3 text-sm text-event-ink/65">Peça um novo convite ou recuperação para a mentoria.</p>
      </Card>
    </main>
  );
}
