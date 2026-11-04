/**
 * Consistent date formatting for the whole app: DD/MM/YYYY.
 * Always zero-pads day and month — no time, no weekday — regardless of locale.
 */
export function formatDate(d?: Date | string | number): string {
  if (d == null) return '—';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}