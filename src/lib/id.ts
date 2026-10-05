import { createHash } from "node:crypto";

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "event";
}

// Events are dated by the Pacific calendar day so an evening event isn't
// stamped with tomorrow's UTC date.
const EVENT_TIME_ZONE = "America/Los_Angeles";

export function todayDateString(now = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: EVENT_TIME_ZONE }).format(now);
}

export function buildEventId(name: string, dateString: string): string {
  const hash = createHash("sha256")
    .update(`${name}${dateString}`)
    .digest("hex")
    .slice(0, 6);
  return `${slugify(name)}-${hash}`;
}
