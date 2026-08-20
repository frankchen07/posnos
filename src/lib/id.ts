import { createHash } from "node:crypto";

export function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "event";
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildEventId(name: string, dateString: string): string {
  const hash = createHash("sha256")
    .update(`${name}${dateString}`)
    .digest("hex")
    .slice(0, 6);
  return `${slugify(name)}-${hash}`;
}
