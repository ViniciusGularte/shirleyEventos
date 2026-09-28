export function splitEventInput<T extends { received_now: number; initial_cost: number; wallet_id?: string | null }>(input: T) {
  const { received_now, initial_cost, wallet_id, ...event } = input;
  return {
    event,
    finance: { received_now, initial_cost, wallet_id: wallet_id ?? null }
  };
}
