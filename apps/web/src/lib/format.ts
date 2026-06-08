export function formatIdr(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  return `Rp ${safe.toLocaleString("id-ID")}`;
}

export function formatIdrCompact(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  if (safe >= 1_000_000_000) {
    return `Rp ${trimZero(safe / 1_000_000_000)} M`;
  }
  if (safe >= 1_000_000) {
    return `Rp ${trimZero(safe / 1_000_000)} jt`;
  }
  if (safe >= 1_000) {
    return `Rp ${Math.round(safe / 1_000)} rb`;
  }
  return `Rp ${Math.round(safe)}`;
}

export function formatNumber(value: number): string {
  const safe = Number.isFinite(value) ? Math.round(value) : 0;
  return safe.toLocaleString("id-ID");
}

function trimZero(value: number): string {
  return value
    .toFixed(1)
    .replace(/\.0$/, "")
    .replace(".", ",");
}

// Spec-named aliases.
export const formatCurrencyIDR = formatIdr;
export const formatCompactIDR = formatIdrCompact;

const ID_MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

// "7 Jun 2026" from "YYYY-MM-DD" or an ISO timestamp.
export function formatDateID(value: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  const d = new Date(time);
  return `${d.getUTCDate()} ${ID_MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// "Baru saja" / "3 jam lalu" / "2 hari lalu" from elapsed hours.
export function formatRelativeTimeID(hours: number): string {
  if (hours < 1) return "Baru saja";
  if (hours < 24) return `${Math.round(hours)} jam lalu`;
  return `${Math.round(hours / 24)} hari lalu`;
}

// "<1 jam" / "3 jam" / "2 hari" — bare duration label (waiting-time columns).
export function formatDurationID(hours: number): string {
  if (hours < 1) return "<1 jam";
  if (hours < 24) return `${Math.round(hours)} jam`;
  return `${Math.round(hours / 24)} hari`;
}
