export const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export function formatCurrency(value: number | string | null | undefined) {
  return brlFormatter.format(Number(value ?? 0));
}

const MAX_CURRENCY_CENTS = 99_999_999_999_999;

export function currencyInputToCents(value: string, allowNegative = false) {
  const digits = value.replace(/\D/g, "");
  const cents = Math.min(Number(digits || "0"), MAX_CURRENCY_CENTS);
  return allowNegative && value.includes("-") ? -cents : cents;
}

export function formatCurrencyFromCents(cents: number) {
  return brlFormatter.format(cents / 100);
}

export function appendCurrencyDigit(cents: number, digit: number) {
  const sign = cents < 0 ? -1 : 1;
  const next = Math.min((Math.abs(cents) * 10) + digit, MAX_CURRENCY_CENTS);
  return sign * next;
}

export function removeCurrencyDigit(cents: number) {
  const sign = cents < 0 ? -1 : 1;
  return sign * Math.trunc(Math.abs(cents) / 10);
}

export function parseMoney(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return 0;
  return Number(value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, ""));
}
