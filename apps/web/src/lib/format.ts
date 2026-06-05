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
