// Jakarta time utilities (UTC+7) using naive offset, konsisten dgn versi awal.

export function nowJakartaDate(): Date {
  const nowUtc = new Date();
  const jakartaOffsetMs = 7 * 60 * 60 * 1000;
  return new Date(nowUtc.getTime() + jakartaOffsetMs);
}

export function fmtDateJakarta(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function fmtTimeJakarta(d: Date): string {
  const HH = String(d.getUTCHours()).padStart(2, "0");
  const MM = String(d.getUTCMinutes()).padStart(2, "0");
  const SS = String(d.getUTCSeconds()).padStart(2, "0");
  return `${HH}:${MM}:${SS}`;
}

export function yearMonth(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}${mm}`;
}

export function roundToNearest100(n: number): number {
  const remainder = n % 100;
  if (remainder >= 50) return n + (100 - remainder);
  return n - remainder;
}
