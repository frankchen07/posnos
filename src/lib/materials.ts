import type { ItemKey, MilkKey } from "./menu";

// Oz of milk used per cup when that drink is ordered with milk, same value
// for hot/iced. PLACEHOLDERS — tune these to the real recipe.
export const MILK_OZ_PER_DRINK: Record<ItemKey, number> = {
  vanilla_latte: 6.5,
  latte: 6.5,
  mocha_latte: 6.5,
  cappuccino: 5,
  flat_white: 5,
  cortado: 3,
  americano: 0.5,
  espresso: 0.5,
  nitro_cold_brew: 0.5,
  matcha_latte: 6.5,
  hot_chocolate: 6.5,
  tea: 0.5,
};

// Container size (oz) each milk is purchased in, used to convert calculated
// ounces into a human-readable "containers used" count.
export const MILK_CONTAINER_OZ: Record<MilkKey, number> = {
  whole: 64, // half gallon
  oat: 32, // barista carton
  almond: 32, // barista carton
};

export function milkMaterialKey(milk: MilkKey): string {
  return `milk_${milk}`;
}
