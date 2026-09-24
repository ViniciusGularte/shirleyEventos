"use client";

import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/finance/currency";

export function MovementChart({ data }: { data: Array<{ month: string; received: number; expenses: number; result: number }> }) {
  return (
    <Card className="h-[320px]">
      <h2 className="mb-4 text-lg font-extrabold">Movimento financeiro</h2>
      <ResponsiveContainer width="100%" height="82%">
        <ComposedChart data={data}>
          <CartesianGrid stroke="rgba(18,12,18,0.06)" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `R$ ${Number(value) / 1000}k`} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 16, borderColor: "rgba(18,12,18,.12)" }} />
          <Area type="monotone" dataKey="received" name="Recebido" fill="rgba(244,91,146,.18)" stroke="#F45B92" strokeWidth={2} />
          <Area type="monotone" dataKey="expenses" name="Despesas" fill="rgba(18,12,18,.08)" stroke="#120C12" strokeWidth={2} />
          <Line type="monotone" dataKey="result" name="Resultado" stroke="#F45B92" strokeDasharray="6 6" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function EventsChart({ data }: { data: Array<{ month: string; events: number }> }) {
  return (
    <Card className="h-[320px]">
      <h2 className="mb-4 text-lg font-extrabold">Eventos por mês</h2>
      <ResponsiveContainer width="100%" height="82%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(18,12,18,0.06)" vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 16, borderColor: "rgba(18,12,18,.12)" }} />
          <Bar dataKey="events" name="Eventos" fill="#F45B92" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
