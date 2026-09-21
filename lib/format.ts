export function formatMinutes(minutes: number | null): string {
  if (minutes === null || minutes <= 0) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

export function formatMoney(value: number | null): string {
  if (value === null) return "";
  return value % 1 === 0 ? `$${value}` : `$${value.toFixed(2)}`;
}

export function formatRating(rating: number | null): string {
  if (rating === null) return "";
  return rating % 1 === 0 ? String(rating) : rating.toFixed(1);
}

export function formatDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  // Parse as local time so the date never slips back a day.
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function costPerServing(cost: number | null, servings: number | null): string {
  if (cost === null || !servings || servings <= 0) return "";
  return `${formatMoney(Math.round((cost / servings) * 100) / 100)}/serving`;
}
