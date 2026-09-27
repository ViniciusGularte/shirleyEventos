"use client";

import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarRange, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/currency";

type MovementPoint = { month: string; received: number; expenses: number; result: number };
type EventsPoint = { month: string; events: number };

export function MovementChart({ data }: { data: MovementPoint[] }) {
  const received = data.reduce((total, item) => total + item.received, 0);
  const result = data.reduce((total, item) => total + item.result, 0);
  const hasData = data.some((item) => item.received !== 0 || item.expenses !== 0 || item.result !== 0);

  return (
    <Card className="relative h-[390px] overflow-hidden p-0" role="figure" aria-label={`Movimento dos últimos seis meses. Recebido: ${formatCurrency(received)}. Resultado: ${formatCurrency(result)}.`}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-event-rose/10 blur-3xl" />
      <div className="relative flex flex-col gap-4 border-b border-event-ink/8 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-event-ink text-event-paper"><TrendingUp size={20} /></span>
          <div><p className="text-xs font-extrabold uppercase tracking-[.12em] text-event-ink/45">Últimos 6 meses</p><h2 className="mt-1 text-lg font-black">Movimento financeiro</h2></div>
        </div>
        <div className="flex gap-4 text-xs font-bold text-event-ink/62" aria-hidden="true">
          <LegendDot color="bg-event-rose" label="Recebido" />
          <LegendDot color="bg-event-ink" label="Despesas" />
          <LegendDot color="bg-emerald-600" label="Resultado" dashed />
        </div>
      </div>
      <div className="h-[285px] px-1 pb-4 pt-4 sm:px-3">
        {hasData ? <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 10, left: -14, bottom: 0 }}>
            <defs>
              <linearGradient id="receivedGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#BE185D" stopOpacity={0.3} /><stop offset="100%" stopColor="#BE185D" stopOpacity={0.01} /></linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#120C12" stopOpacity={0.16} /><stop offset="100%" stopColor="#120C12" stopOpacity={0.01} /></linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(18,12,18,0.07)" strokeDasharray="4 7" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: "rgba(18,12,18,.58)", fontWeight: 700 }} tickFormatter={formatMonth} dy={8} />
            <YAxis tickLine={false} axisLine={false} width={56} fontSize={10} tick={{ fill: "rgba(18,12,18,.48)" }} tickFormatter={compactCurrency} />
            <Tooltip content={<MovementTooltip />} cursor={{ stroke: "rgba(190,24,93,.22)", strokeWidth: 1 }} />
            <Area type="monotone" dataKey="received" name="Recebido" fill="url(#receivedGradient)" stroke="#BE185D" strokeWidth={2.5} activeDot={{ r: 5, fill: "#BE185D", stroke: "#FFF8FB", strokeWidth: 3 }} />
            <Area type="monotone" dataKey="expenses" name="Despesas" fill="url(#expenseGradient)" stroke="#120C12" strokeWidth={2} activeDot={{ r: 4, fill: "#120C12", stroke: "#FFF8FB", strokeWidth: 3 }} />
            <Line type="monotone" dataKey="result" name="Resultado" stroke="#047857" strokeDasharray="7 6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#047857", stroke: "#FFF8FB", strokeWidth: 3 }} />
          </ComposedChart>
        </ResponsiveContainer> : <ChartEmpty icon={TrendingUp} title="Seu movimento aparecerá aqui" description="Registre recebimentos e despesas para formar a curva do seu resultado." />}
      </div>
    </Card>
  );
}

export function EventsChart({ data }: { data: EventsPoint[] }) {
  const total = data.reduce((sum, item) => sum + item.events, 0);
  const best = data.reduce<EventsPoint | null>((current, item) => !current || item.events > current.events ? item : current, null);
  const hasData = data.some((item) => item.events > 0);

  return (
    <Card className="relative h-[390px] overflow-hidden p-0" role="figure" aria-label={`${total} eventos nos últimos seis meses. ${best ? `Maior volume em ${best.month}: ${best.events}.` : ""}`}>
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative flex items-start justify-between border-b border-event-ink/8 p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-event-rose/10 text-event-rose"><CalendarRange size={20} /></span>
          <div><p className="text-xs font-extrabold uppercase tracking-[.12em] text-event-ink/45">Volume</p><h2 className="mt-1 text-lg font-black">Eventos por mês</h2></div>
        </div>
        <div className="text-right"><strong className="block text-2xl font-black tabular-nums">{total}</strong><span className="text-xs font-bold text-event-ink/48">no período</span></div>
      </div>
      <div className="h-[285px] px-2 pb-4 pt-4 sm:px-4">
        {hasData ? <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 6, left: -26, bottom: 0 }}>
            <defs><linearGradient id="eventBarGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#BE185D" /><stop offset="100%" stopColor="#DB2777" /></linearGradient></defs>
            <CartesianGrid stroke="rgba(18,12,18,0.07)" strokeDasharray="4 7" vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} tick={{ fill: "rgba(18,12,18,.58)", fontWeight: 700 }} tickFormatter={formatMonth} dy={8} />
            <YAxis tickLine={false} axisLine={false} fontSize={10} allowDecimals={false} tick={{ fill: "rgba(18,12,18,.48)" }} />
            <Tooltip content={<EventsTooltip />} cursor={{ fill: "rgba(190,24,93,.05)", radius: 12 }} />
            <Bar dataKey="events" name="Eventos" fill="url(#eventBarGradient)" background={{ fill: "rgba(18,12,18,.035)", radius: 10 }} radius={[10, 10, 5, 5]} maxBarSize={42} />
          </BarChart>
        </ResponsiveContainer> : <ChartEmpty icon={CalendarRange} title="Ainda não há eventos no período" description="O comparativo mensal será criado automaticamente após o primeiro evento." />}
      </div>
    </Card>
  );
}

function LegendDot({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`${color} h-2 w-2 rounded-full ${dashed ? "ring-2 ring-emerald-600/20 ring-offset-1" : ""}`} />{label}</span>;
}

function MovementTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-44 rounded-[16px] border border-event-ink/10 bg-white/95 p-3 shadow-xl backdrop-blur">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-event-ink/45">{formatMonth(label)}</p>
      {payload.map((item: any) => <div key={item.dataKey} className="flex items-center justify-between gap-5 py-1 text-xs"><span className="font-bold" style={{ color: item.stroke }}>{item.name}</span><strong className="tabular-nums text-event-ink">{formatCurrency(item.value)}</strong></div>)}
    </div>
  );
}

function EventsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0].value);
  return <div className="rounded-[16px] border border-event-ink/10 bg-white/95 px-4 py-3 shadow-xl backdrop-blur"><p className="text-xs font-bold text-event-ink/50">{formatMonth(label)}</p><strong className="mt-1 block text-sm">{value} {value === 1 ? "evento" : "eventos"}</strong></div>;
}

function ChartEmpty({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="grid h-full place-items-center rounded-[18px] bg-[radial-gradient(circle_at_center,rgba(190,24,93,.07),transparent_62%)] px-6 text-center">
      <div className="max-w-xs">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-event-rose/15 bg-white text-event-rose shadow-sm"><Icon size={21} /></span>
        <h3 className="mt-4 text-sm font-extrabold">{title}</h3>
        <p className="mt-2 text-xs leading-5 text-event-ink/55">{description}</p>
      </div>
    </div>
  );
}

function compactCurrency(value: number) {
  if (Math.abs(value) >= 1000) return `R$ ${new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;
  return `R$ ${value}`;
}

function formatMonth(value: string) {
  const date = new Date(`${value}-01T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  const month = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(date);
  return month.replace(" de ", "/").replace(".", "");
}
