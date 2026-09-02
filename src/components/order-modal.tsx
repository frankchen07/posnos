"use client";

import { useState } from "react";
import {
  ITEMS,
  MILKS,
  SYRUPS,
  MILK_OPTIONAL_ITEMS,
  NO_TEMP_ITEMS,
  NO_SHOTS_ITEMS,
  NO_MODS_ITEMS,
  SWEET_ITEMS,
  buildAbbreviation,
  type ItemKey,
  type MilkKey,
  type SyrupKey,
  type OrderSelection,
  type Temp,
} from "@/lib/menu";

function OptionButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 px-2 py-1.5 text-base font-medium transition-colors ${
        active
          ? "border-espresso bg-espresso text-cream"
          : "border-border bg-white text-espresso active:bg-surface"
      }`}
    >
      {children}
    </button>
  );
}

export function OrderModal({
  itemKey,
  onClose,
  onSubmit,
}: {
  itemKey: ItemKey;
  onClose: () => void;
  onSubmit: (selection: OrderSelection) => void;
}) {
  const item = ITEMS.find((i) => i.key === itemKey)!;
  const showTemp = !(NO_TEMP_ITEMS as readonly string[]).includes(itemKey);
  const milkRequired = !(MILK_OPTIONAL_ITEMS as readonly string[]).includes(itemKey);
  const showShots = !(NO_SHOTS_ITEMS as readonly string[]).includes(itemKey);
  const showMods = !(NO_MODS_ITEMS as readonly string[]).includes(itemKey);
  const isSweetItem = (SWEET_ITEMS as readonly string[]).includes(itemKey);
  const visibleSyrups = SYRUPS.filter((s) => s.key !== "less_sweet" || isSweetItem);

  const [temp, setTemp] = useState<Temp>(showTemp ? "hot" : "iced");
  const [milk, setMilk] = useState<MilkKey | null>(null);
  const [shotsAdded, setShotsAdded] = useState(0);
  const [syrup, setSyrup] = useState<SyrupKey | null>(null);
  const [decaf, setDecaf] = useState(false);
  const [boastStyle, setBoastStyle] = useState(false);

  const selection: OrderSelection = {
    item: itemKey,
    temp,
    milk,
    shotsAdded,
    syrup,
    decaf,
    boastStyle,
  };
  const preview = buildAbbreviation(selection);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-y-auto rounded-t-3xl bg-white p-3 sm:rounded-3xl sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-espresso">{item.label}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-xl text-muted"
          >
            ✕
          </button>
        </div>

        {showTemp && (
          <section className="mt-3">
            <h3 className="mb-1 text-sm font-semibold uppercase text-muted">Temp</h3>
            <div className="grid grid-cols-3 gap-2">
              <OptionButton active={temp === "hot"} onClick={() => setTemp("hot")}>
                Hot
              </OptionButton>
              <OptionButton active={temp === "iced"} onClick={() => setTemp("iced")}>
                Iced
              </OptionButton>
            </div>
          </section>
        )}

        <section className="mt-3">
          <h3 className="mb-1 text-sm font-semibold uppercase text-muted">
            {milkRequired ? "Milk" : "Add Milk"}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {MILKS.map((m) => (
              <OptionButton
                key={m.key}
                active={milk === m.key}
                onClick={() => setMilk((cur) => (cur === m.key ? null : m.key))}
              >
                {milkRequired ? m.label : `+${m.label}`}
              </OptionButton>
            ))}
          </div>
        </section>

        {showShots && (
          <section className="mt-3">
            <h3 className="mb-1 text-sm font-semibold uppercase text-muted">Extra Shots</h3>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2].map((n) => (
                <OptionButton
                  key={n}
                  active={shotsAdded === n}
                  onClick={() => setShotsAdded((cur) => (cur === n ? 0 : n))}
                >
                  {n === 1 ? "Extra Single" : "Extra Double"}
                </OptionButton>
              ))}
            </div>
          </section>
        )}

        <section className="mt-3">
          <h3 className="mb-1 text-sm font-semibold uppercase text-muted">Extra Syrup</h3>
          <div className="grid grid-cols-3 gap-2">
            {visibleSyrups.map((s) => (
              <OptionButton
                key={s.key}
                active={syrup === s.key}
                onClick={() => setSyrup((cur) => (cur === s.key ? null : s.key))}
              >
                {`+${s.label}`}
              </OptionButton>
            ))}
          </div>
        </section>

        {showMods && (
          <section className="mt-3">
            <h3 className="mb-1 text-sm font-semibold uppercase text-muted">Mods</h3>
            <div className="grid grid-cols-3 gap-2">
              <OptionButton active={decaf} onClick={() => setDecaf((d) => !d)}>
                Decaf
              </OptionButton>
              <OptionButton active={boastStyle} onClick={() => setBoastStyle((b) => !b)}>
                Boast Style
              </OptionButton>
            </div>
          </section>
        )}

        <div className="mt-3 rounded-xl bg-espresso px-4 py-2 text-center font-mono text-xl tracking-wide text-cream">
          {preview}
        </div>

        <button
          type="button"
          onClick={() => onSubmit(selection)}
          className="mt-2 w-full rounded-2xl bg-emerald-600 py-4 text-xl font-bold text-white active:bg-emerald-700"
        >
          Done
        </button>
      </div>
    </div>
  );
}
