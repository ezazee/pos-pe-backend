export type Tier = { qty: number; total: number };

export function calcBulkTotal(
  qty: number,
  tiers: Tier[] | undefined,
  singlePrice: number
): number {
  if (!qty) return 0;
  const list = (tiers?.length ? tiers : [{ qty: 1, total: singlePrice }])
    .slice()
    .sort((a, b) => b.qty - a.qty);

  const dp = Array(qty + 1).fill(Infinity) as number[];
  dp[0] = 0;

  for (let i = 1; i <= qty; i++) {
    for (const t of list) {
      if (t.qty <= i) dp[i] = Math.min(dp[i], dp[i - t.qty] + t.total);
    }
    dp[i] = Math.min(dp[i], dp[i - 1] + singlePrice);
  }
  return dp[qty];
}
