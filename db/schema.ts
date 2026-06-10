import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/**
 * Categories: top-level menu sections
 */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    nameRu: text("name_ru").notNull(),
    nameUz: text("name_uz").notNull(),
    nameEn: text("name_en").notNull(),
    introRu: text("intro_ru"),
    introUz: text("intro_uz"),
    introEn: text("intro_en"),
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("categories_slug_uidx").on(t.slug),
    index("categories_sort_idx").on(t.sortOrder),
    index("categories_published_idx").on(t.isPublished),
  ]
);

/**
 * Dishes: individual menu items
 */
export const dishes = pgTable(
  "dishes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    nameRu: text("name_ru").notNull(),
    nameUz: text("name_uz").notNull(),
    nameEn: text("name_en").notNull(),
    descriptionRu: text("description_ru"),
    descriptionUz: text("description_uz"),
    descriptionEn: text("description_en"),
    /** nullable when item uses variants */
    price: integer("price"),
    imageUrl: text("image_url"),
    weight: text("weight"),
    spicy: integer("spicy"),
    diet: jsonb("diet").$type<string[]>().notNull().default([]),
    calories: integer("calories"),
    allergens: jsonb("allergens").$type<string[]>().notNull().default([]),
    tagsRu: jsonb("tags_ru").$type<string[]>().notNull().default([]),
    tagsUz: jsonb("tags_uz").$type<string[]>().notNull().default([]),
    tagsEn: jsonb("tags_en").$type<string[]>().notNull().default([]),
    sortOrder: integer("sort_order").notNull().default(0),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("dishes_slug_uidx").on(t.slug),
    index("dishes_category_idx").on(t.categoryId),
    index("dishes_sort_idx").on(t.categoryId, t.sortOrder),
    index("dishes_published_idx").on(t.isPublished),
    check("spicy_range", sql`${t.spicy} is null or ${t.spicy} between 1 and 3`),
  ]
);

/**
 * Dish variants: small/large portions, 4 шт / 8 шт, etc.
 */
export const dishVariants = pgTable(
  "dish_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dishId: uuid("dish_id")
      .notNull()
      .references(() => dishes.id, { onDelete: "cascade" }),
    labelRu: text("label_ru").notNull(),
    labelUz: text("label_uz").notNull(),
    labelEn: text("label_en").notNull(),
    price: integer("price").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("variants_dish_idx").on(t.dishId, t.sortOrder)]
);

/**
 * Restaurant info — singleton row (id = 1)
 */
export const restaurant = pgTable(
  "restaurant",
  {
    id: integer("id").primaryKey().default(1),
    name: text("name").notNull().default("Сазанчик CITY"),
    taglineRu: text("tagline_ru").notNull().default(""),
    taglineUz: text("tagline_uz").notNull().default(""),
    taglineEn: text("tagline_en").notNull().default(""),
    addressRu: text("address_ru").notNull().default(""),
    addressUz: text("address_uz").notNull().default(""),
    addressEn: text("address_en").notNull().default(""),
    phone: text("phone").notNull().default(""),
    hoursRu: text("hours_ru").notNull().default(""),
    hoursUz: text("hours_uz").notNull().default(""),
    hoursEn: text("hours_en").notNull().default(""),
    instagram: text("instagram").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [check("single_row", sql`${t.id} = 1`)]
);

/**
 * Story chapters
 */
export const storyChapters = pgTable(
  "story_chapters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    titleRu: text("title_ru").notNull(),
    titleUz: text("title_uz").notNull(),
    titleEn: text("title_en").notNull(),
    bodyRu: text("body_ru").notNull(),
    bodyUz: text("body_uz").notNull(),
    bodyEn: text("body_en").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("story_sort_idx").on(t.sortOrder)]
);

/**
 * Orders: placed from the cart
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tableNumber: text("table_number").notNull(),
    status: text("status", { enum: ["pending", "cooking", "delivered", "cancelled"] })
      .notNull()
      .default("pending"),
    totalPrice: integer("total_price").notNull(),
    serviceCharge: integer("service_charge").notNull(),
    isBirthday: boolean("is_birthday").notNull().default(false),
    servedBy: text("served_by"),
    itemsSnapshot: jsonb("items_snapshot").$type<OrderItemSnapshot[]>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_table_idx").on(t.tableNumber),
    index("orders_created_idx").on(t.createdAt),
  ]
);

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type OrderItemSnapshot = {
  nameRu: string;
  nameUz: string;
  nameEn: string;
  variantLabelRu?: string;
  variantLabelUz?: string;
  variantLabelEn?: string;
  quantity: number;
  price: number;
};

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    dishNameRu: text("dish_name_ru").notNull(),
    dishNameUz: text("dish_name_uz").notNull(),
    dishNameEn: text("dish_name_en").notNull(),
    variantLabelRu: text("variant_label_ru"),
    variantLabelUz: text("variant_label_uz"),
    variantLabelEn: text("variant_label_en"),
    quantity: integer("quantity").notNull().default(1),
    price: integer("price").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)]
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

/**
 * Reservations: table bookings placed from the public site
 */
export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    guests: integer("guests").notNull().default(2),
    reservedAt: timestamp("reserved_at", { withTimezone: true }).notNull(),
    tableNumber: text("table_number"),
    comment: text("comment"),
    isBirthday: boolean("is_birthday").notNull().default(false),
    status: text("status", {
      enum: ["new", "confirmed", "seated", "cancelled"],
    })
      .notNull()
      .default("new"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("reservations_status_idx").on(t.status),
    index("reservations_date_idx").on(t.reservedAt),
  ]
);

export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;

/**
 * Staff: waiters who log into the /waiter PWA with a personal PIN
 */
export const staff = pgTable(
  "staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    pinHash: text("pin_hash").notNull(),
    zone: text("zone"),
    tables: jsonb("tables").$type<string[]>().notNull().default([]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("staff_active_idx").on(t.isActive)]
);

export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;

/**
 * Waiter calls: "call waiter / bill / water" buttons from a table.
 * Persisted so the waiter board never loses a call (survives offline).
 */
export const waiterCalls = pgTable(
  "waiter_calls",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tableNumber: text("table_number").notNull(),
    type: text("type", { enum: ["waiter", "bill", "water"] })
      .notNull()
      .default("waiter"),
    status: text("status", { enum: ["new", "done"] })
      .notNull()
      .default("new"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: text("resolved_by"),
  },
  (t) => [
    index("waiter_calls_status_idx").on(t.status),
    index("waiter_calls_created_idx").on(t.createdAt),
  ]
);

export type WaiterCall = typeof waiterCalls.$inferSelect;
export type NewWaiterCall = typeof waiterCalls.$inferInsert;

/**
 * Uploads: images stored in DB (base64) — self-contained fallback when no
 * Vercel Blob is connected. Served via /api/img/[id] with long cache headers.
 */
export const uploads = pgTable("uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  mime: text("mime").notNull(),
  data: text("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Upload = typeof uploads.$inferSelect;

/**
 * Football events: match screenings the restaurant hosts ("watch the game here")
 */
export const footballEvents = pgTable(
  "football_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    homeTeam: text("home_team").notNull(),
    awayTeam: text("away_team").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    league: text("league"),
    note: text("note"),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("football_starts_idx").on(t.startsAt),
    index("football_pub_idx").on(t.isPublished),
  ]
);

export type FootballEvent = typeof footballEvents.$inferSelect;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Dish = typeof dishes.$inferSelect;
export type DishVariant = typeof dishVariants.$inferSelect;
export type Restaurant = typeof restaurant.$inferSelect;
export type StoryChapter = typeof storyChapters.$inferSelect;
