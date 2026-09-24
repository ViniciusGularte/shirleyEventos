export const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export function formatCurrency(value: number | string | null | undefined) {
  return brlFormatter.format(Number(value ?? 0));
}

export function parseMoney(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return 0;
  return Number(value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
}
