# posnos

Drink-order tracker for Boast Coffee catering events. Baristas create or join an
event, start the timer, tap drinks to log orders, and review live orders and a
summary (counts by drink/milk/syrup, plus milk usage) from any device.

Next.js App Router + Drizzle on Neon Postgres. Built for an iPhone in Safari.

## Setup

```bash
npm install
echo 'DATABASE_URL=postgres://…' > .env.local   # Neon connection string
npm run db:push                                  # sync src/db/schema.ts to the database
npm run dev
```

## Scripts

- `npm run dev` — dev server on http://localhost:3000
- `npm test` — unit tests (`node --test`, no extra deps)
- `npm run lint`
- `npm run db:push` — push schema changes via drizzle-kit

Past learnings live in `docs/solutions/`.
