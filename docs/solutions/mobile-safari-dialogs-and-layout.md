# Never gate an action behind window.confirm (and the mx-auto overflow trap)

**Date**: 2026-09-29

## The problem

An event could not be ended from an iPhone. The red **End** button was visible,
tapping it did nothing — no dialog, no network request, no error. The same tap
worked on a laptop.

Two independent defects, both mobile-only:

1. `endTimer()` gated the whole action behind `window.confirm()`. iOS Safari
   suppresses in-page JS dialogs under several conditions (tab switch, app
   backgrounding, after a `pushState` + back navigation). Per MDN, a suppressed
   `confirm()` **returns `false` instead of throwing**, so `if (!confirmed) return;`
   exited silently. The action was unreachable with no feedback of any kind.
   `window.alert()` is suppressed the same way, so the failure toasts in the
   `catch` blocks were invisible too — the app could not report its own errors.

2. The page scrolled horizontally on every phone width. The root container was
   `mx-auto flex min-h-screen max-w-2xl flex-col` inside `<body class="flex flex-col">`
   (`src/app/layout.tsx`). **`mx-auto` on a flex item disables `align-self: stretch`**,
   so the container sized to *max-content* — 585px on a 375px viewport, driven by
   the longest event name. Everything inside inherited that width, and `truncate`
   did nothing because there was no constraint to truncate against.

## The solution / decision

- Replaced every `window.confirm` / `window.alert` in the app with an in-app
  React `ConfirmDialog` + an inline error banner. No native dialogs remain —
  `grep -rn "window.confirm\|window.alert" src` should stay empty.
- Added `w-full` to the root containers (`w-full max-w-2xl mx-auto` is the correct
  idiom — `max-w-*` caps, `w-full` supplies the base width, `mx-auto` still centres).
- Header action row: `flex-wrap` + `min-w-0`/`truncate` on the name block, which
  gets its own row under `sm`. Tap targets raised to 44px (`min-h-11`, iOS HIG).

Rejected: a shared `ModalOverlay` extracted from `order-modal.tsx` — the two
overlays differ in padding and max-height, so the "shared" component would need
props for both and the indirection costs more than the duplicated class string.

## Two traps when replacing a native dialog with a React one

`window.confirm` / `window.alert` have two properties that are easy to lose:

1. **They are always visible.** The End button sits in a `sticky top-0` header, so
   it is tappable while scrolled down the order grid. An error banner placed in
   normal flow after `</header>` renders at document top — measured at `top: -204px`
   with the page scrolled to `y: 346`, i.e. completely off-screen exactly when it
   fires. The banner must live *inside* the sticky header.
2. **They block the JS thread**, so state cannot change between asking and answering.
   A React dialog can sit open across SWR polls (3s here). Device A ends the event,
   device B's open dialog confirms, and `/api/events/[id]/end` does an unguarded
   `.set({ endTime: new Date() })` — silently rewriting the real end timestamp and
   corrupting the event's duration. The dialog is now gated on
   `event?.startTime && !event.endTime` and `confirmEnd` re-checks before POSTing.

Also restore `Escape` to cancel — `window.confirm` did that for free.

## Why it wasn't obvious

- The first hypothesis (dialogs break specifically after `pushState` + back) was
  **wrong and disproved by the repro**: `activeEventId` is `useState` with no
  persistence, so navigating away and back drops you to the join screen — there is
  no End button to tap in that state. The real trigger is app backgrounding, which
  Playwright cannot emulate.
- Playwright auto-dismisses native dialogs when no `page.on('dialog')` handler is
  registered. That is a faithful simulation of the iOS condition and is what makes
  this testable at all: **omit the dialog handler** and the bug reproduces exactly.
- The overflow looked like a header-flex problem. It was not — measuring
  `getBoundingClientRect()` on every element showed the *root container* was the
  offender, three levels up from where the symptom appeared.

## Pointers

- `src/components/confirm-dialog.tsx` — the replacement dialog
- `src/components/catering-app.tsx` — End flow, error banner, header row
- `src/app/layout.tsx` — the `body { display: flex; flex-direction: column }` that
  makes `mx-auto` size-to-content
- MDN: https://developer.mozilla.org/docs/Web/API/Window/confirm
  ("if a browser is ignoring in-page dialogs, then the returned value is always false")
- Repro recipe: WebKit at 375x812, **no** `page.on('dialog')` handler, create event,
  Start, tap End — assert a POST to `/api/events/*/end` actually fires.

## Follow-ups (fixed 2026-10-05)

- Active event is persisted in the URL (`?event=<id>`), so a reload or a discarded
  tab lands back on the event.
- `POST /api/events/[id]/start` no-ops when already started; `/end` returns 409
  when already ended. The timestamp guard is now server-side.
- `createOrJoinEvent` and order submit check `res.ok`; a failed order keeps the
  modal open with an inline error, and Done is disabled while saving.
- `order-modal.tsx` uses `92dvh` + safe-area bottom padding.
