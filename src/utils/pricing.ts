// src/utils/pricing.ts
export type Tier = { qty: number; total: number };

// DP untuk dapat total termurah per jumlah
export function calcBulkTotal(qty: number, tiers: Tier[] | undefined, singlePrice: number): number {
  if (qty <= 0) return 0;
  const list = (tiers?.length ? tiers : [{ qty: 1, total: singlePrice }])
    .slice()
    .sort((a,b) => b.qty - a.qty);
  const dp = Array(qty + 1).fill(Infinity) as number[];
  dp[0] = 0;
  for (let i = 1; i <= qty; i++) {
    for (const t of list) if (t.qty <= i) dp[i] = Math.min(dp[i], dp[i - t.qty] + t.total);
    dp[i] = Math.min(dp[i], dp[i - 1] + singlePrice);
  }
  return dp[qty];
}

/** Distribusi total group ke item2 (agar sum line_total = groupTotal).
 *  items: { idx, qty }
 *  return: array number sama urutan items (line_total per item)
 */
export function allocateGroupTotals(
  items: { qty: number }[],
  groupTotal: number
): number[] {
  const totalQty = items.reduce((a, x) => a + x.qty, 0) || 1;
  const eff = groupTotal / totalQty;
  const res = items.map(x => Math.round(eff * x.qty));
  // koreksi selisih pembulatan
  let diff = groupTotal - res.reduce((a,b)=>a+b,0);
  for (let i = res.length - 1; diff !== 0 && i >= 0; i--) {
    const adj = diff > 0 ? 1 : -1;
    res[i] += adj;
    diff -= adj;
  }
  return res;
}
