/**
 * Format a number as USD currency.
 */
export function formatDollars(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format hours with one decimal place.
 */
export function formatHours(value: number): string {
  return `${value.toFixed(1)}h`;
}

/**
 * Format a ratio like "7.2x".
 */
export function formatRatio(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "N/A";
  return `${value.toFixed(1)}x`;
}

/**
 * Format a number with commas.
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Format ISO date string to readable form.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format ISO date string to short form (for tables).
 */
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
