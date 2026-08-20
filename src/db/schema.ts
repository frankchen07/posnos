import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  eventDate: date("event_date").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  orderCounter: integer("order_counter").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id),
  seq: integer("seq").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  item: text("item").notNull(),
  temp: text("temp").notNull(),
  milk: text("milk"),
  shotsAdded: integer("shots_added").notNull().default(0),
  syrup: text("syrup"),
  decaf: boolean("decaf").notNull().default(false),
  boastStyle: boolean("boast_style").notNull().default(false),
  abbreviation: text("abbreviation").notNull(),
  deleted: boolean("deleted").notNull().default(false),
});
