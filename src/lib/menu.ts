export const ITEMS = [
  { key: "vanilla_latte", label: "Vanilla Latte", abbr: "VL", category: "milk" },
  { key: "latte", label: "Latte", abbr: "L", category: "milk" },
  { key: "mocha_latte", label: "Mocha Latte", abbr: "ML", category: "milk" },
  { key: "cappuccino", label: "Cappuccino", abbr: "CAP", category: "milk" },
  { key: "flat_white", label: "Flat White", abbr: "FW", category: "milk" },
  { key: "cortado", label: "Cortado", abbr: "CT", category: "milk" },
  { key: "americano", label: "Americano", abbr: "AM", category: "non-milk" },
  { key: "espresso", label: "Espresso", abbr: "ESP", category: "non-milk" },
  { key: "nitro_cold_brew", label: "Nitro Cold Brew", abbr: "NCB", category: "non-milk" },
  { key: "matcha_latte", label: "Matcha Latte", abbr: "MTL", category: "non-coffee" },
  { key: "hot_chocolate", label: "Hot Chocolate", abbr: "HC", category: "non-coffee" },
] as const;

// Drinks with no default milk — milk is an optional add-on instead of a required choice.
export const MILK_OPTIONAL_ITEMS = ["espresso", "americano", "nitro_cold_brew"] as const;

// Drinks served only one way — no Hot/Iced toggle shown.
export const NO_TEMP_ITEMS = ["nitro_cold_brew"] as const;

// Drinks with no extra shot option.
export const NO_SHOTS_ITEMS = ["hot_chocolate"] as const;

// Drinks with no Decaf / Boast Style mods.
export const NO_MODS_ITEMS = ["hot_chocolate"] as const;

export const MILKS = [
  { key: "whole", label: "Whole Milk", abbr: "WM" },
  { key: "oat", label: "Oat Milk", abbr: "O" },
  { key: "almond", label: "Almond Milk", abbr: "A" },
] as const;

export const SYRUPS = [
  { key: "vanilla", label: "Vanilla", abbr: "VS" },
  { key: "maple_bourbon", label: "Maple Bourbon", abbr: "MB" },
  { key: "mocha", label: "Mocha", abbr: "MS" },
] as const;

export type ItemKey = (typeof ITEMS)[number]["key"];
export type MilkKey = (typeof MILKS)[number]["key"];
export type SyrupKey = (typeof SYRUPS)[number]["key"];
export type Temp = "hot" | "iced";

export interface OrderSelection {
  item: ItemKey;
  temp: Temp;
  milk: MilkKey | null;
  shotsAdded: number;
  syrup: SyrupKey | null;
  decaf: boolean;
  boastStyle: boolean;
}

export function itemLabel(key: string) {
  return ITEMS.find((i) => i.key === key)?.label ?? key;
}

export function milkLabel(key: string | null) {
  if (!key) return null;
  return MILKS.find((m) => m.key === key)?.label ?? key;
}

export function syrupLabel(key: string | null) {
  if (!key) return null;
  return SYRUPS.find((s) => s.key === key)?.label ?? key;
}

export function buildAbbreviation(sel: OrderSelection): string {
  const item = ITEMS.find((i) => i.key === sel.item);
  const milk = sel.milk ? MILKS.find((m) => m.key === sel.milk) : null;
  const syrup = sel.syrup ? SYRUPS.find((s) => s.key === sel.syrup) : null;

  const lines: string[] = [];
  lines.push(
    sel.temp === "iced" ? `ICED ${item?.abbr ?? sel.item}` : item?.abbr ?? sel.item
  );
  if (milk) lines.push(milk.abbr);
  if (sel.shotsAdded > 0) {
    lines.push(sel.shotsAdded === 1 ? "+SHOT" : `+${sel.shotsAdded}SHOT`);
  }
  if (syrup) lines.push(`+${syrup.abbr}`);
  if (sel.decaf) lines.push("DECAF");
  if (sel.boastStyle) lines.push("BOAST");
  return lines.join(" / ");
}
