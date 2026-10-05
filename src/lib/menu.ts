export const ITEMS = [
  { key: "vanilla_latte", label: "Vanilla Latte", abbr: "VL", category: "milk" },
  { key: "latte", label: "Latte", abbr: "L", category: "milk" },
  { key: "mocha_latte", label: "Mocha Latte", abbr: "MoL", category: "milk" },
  { key: "cappuccino", label: "Cappuccino", abbr: "CAP", category: "milk" },
  { key: "flat_white", label: "Flat White", abbr: "FW", category: "milk" },
  { key: "cortado", label: "Cortado", abbr: "CT", category: "milk" },
  { key: "americano", label: "Americano", abbr: "AM", category: "non-milk" },
  { key: "espresso", label: "Espresso", abbr: "ESP", category: "non-milk" },
  { key: "nitro_cold_brew", label: "Nitro Cold Brew", abbr: "NCB", category: "non-milk" },
  { key: "matcha_latte", label: "Matcha Latte", abbr: "MaL", category: "non-coffee" },
  { key: "hot_chocolate", label: "Hot Chocolate", abbr: "XOCO", category: "non-coffee" },
  { key: "tea", label: "Tea", abbr: "TEA", category: "non-coffee" },
] as const;

// Drinks with no default milk — milk is an optional add-on instead of a required choice.
export const MILK_OPTIONAL_ITEMS: readonly ItemKey[] = ["espresso", "americano", "nitro_cold_brew", "tea"];

// Drinks served only one way — no Hot/Iced toggle shown.
export const NO_TEMP_ITEMS: readonly ItemKey[] = ["nitro_cold_brew"];

// Drinks with no extra shot option.
export const NO_SHOTS_ITEMS: readonly ItemKey[] = ["hot_chocolate", "tea"];

// Default shot count baked into each drink (matcha is measured in shots too).
// Extra shots prefix the new total (Latte + single = "2X L"). Nitro Cold Brew
// has no baseline shot, so extra shots on it print as an add-on ("+1 Shot").
export const DEFAULT_SHOTS: Partial<Record<ItemKey, number>> = {
  vanilla_latte: 1,
  latte: 1,
  mocha_latte: 1,
  cappuccino: 2,
  flat_white: 2,
  cortado: 1,
  americano: 1,
  espresso: 1,
  matcha_latte: 1,
};

// Drinks with no Decaf / Boast Style mods.
export const NO_MODS_ITEMS: readonly ItemKey[] = [
  "hot_chocolate",
  "tea",
  "nitro_cold_brew",
  "matcha_latte",
];

// Drinks sweet enough to offer a "Less Sweet" syrup option.
export const SWEET_ITEMS: readonly ItemKey[] = [
  "matcha_latte",
  "mocha_latte",
  "vanilla_latte",
  "hot_chocolate",
];

export const MILKS = [
  { key: "whole", label: "Whole Milk", abbr: "WM" },
  { key: "oat", label: "Oat Milk", abbr: "O" },
  { key: "almond", label: "Almond Milk", abbr: "A" },
] as const;

export const SYRUPS = [
  { key: "vanilla", label: "Vanilla", abbr: "V" },
  { key: "maple_bourbon", label: "Maple Bourbon", abbr: "MB" },
  { key: "mocha", label: "Mocha", abbr: "Mo" },
  { key: "less_sweet", label: "Less Sweet", abbr: "1/2 S" },
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

// Temperature is never written — the cup (paper vs plastic) already says it.
export function buildAbbreviation(sel: OrderSelection): string {
  const item = ITEMS.find((i) => i.key === sel.item);
  const milk = sel.milk ? MILKS.find((m) => m.key === sel.milk) : null;
  const syrup = sel.syrup ? SYRUPS.find((s) => s.key === sel.syrup) : null;
  const defaultShots = DEFAULT_SHOTS[sel.item];

  const itemAbbr = item?.abbr ?? sel.item;
  const shotsPrefixed = sel.shotsAdded > 0 && defaultShots != null;

  const lines: string[] = [
    shotsPrefixed ? `${defaultShots + sel.shotsAdded}X ${itemAbbr}` : itemAbbr,
  ];
  if (milk) lines.push(milk.abbr);
  if (sel.shotsAdded > 0 && !shotsPrefixed) lines.push(`+${sel.shotsAdded} Shot`);
  // Less Sweet takes syrup away, so it gets no plus.
  if (syrup) lines.push(syrup.key === "less_sweet" ? syrup.abbr : `+${syrup.abbr}`);
  if (sel.decaf) lines.push("DECAF");
  if (sel.boastStyle) lines.push("BOAST");
  return lines.join(" / ");
}
