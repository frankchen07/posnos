// Event names were typed as `name-yyyymmdd` (or `yyyymmdd-name`) before the
// date was stored separately in eventDate. The name part is the series that
// recurs across dates, e.g. every `coopelectric-*` event.
export function stripNameDate(name: string): string {
  const trimmed = name.trim();
  const stripped = trimmed.replace(/^\d{8}[-_\s]+|[-_\s]+\d{8}$/g, "").trim();
  return stripped || trimmed;
}

export function eventSeries(name: string): { key: string; label: string } {
  const label = stripNameDate(name).toLowerCase();
  return { key: label.replace(/[^a-z0-9]/g, ""), label };
}
