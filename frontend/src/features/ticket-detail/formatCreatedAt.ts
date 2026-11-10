/**
 * The created date in Swedish format, e.g. "10 nov. 2026 14:30" (AK-2). Uses the browser's time
 * zone unless one is given.
 */
export function formatCreatedAt(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(iso))
}
