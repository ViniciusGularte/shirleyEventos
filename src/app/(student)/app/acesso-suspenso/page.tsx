import { Card } from "@/components/ui/card";

export default function SuspendedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-event-paper px-4">
      <Card className="max-w-md text-center">
        <h1 className="text-2xl font-black">Seu acesso está temporariamente suspenso.</h1>
        <p className="mt-4 text-sm leading-6 text-event-ink/65">Se precisar regularizar ou tiver alguma dúvida, entre em contato com a mentoria.</p>
      </Card>
    </main>
  );
}
