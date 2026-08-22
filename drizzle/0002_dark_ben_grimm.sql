CREATE TABLE "employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"position" text DEFAULT 'other' NOT NULL,
	"daily_rate" integer DEFAULT 0 NOT NULL,
	"shift_start" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount" integer NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"note" text,
	"spent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "football_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"home_team" text NOT NULL,
	"away_team" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"league" text,
	"note" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"unit" text DEFAULT 'pcs' NOT NULL,
	"stock" double precision DEFAULT 0 NOT NULL,
	"min_stock" double precision DEFAULT 0 NOT NULL,
	"cost_per_unit" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipe_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dish_id" uuid NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"qty" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"guests" integer DEFAULT 2 NOT NULL,
	"reserved_at" timestamp with time zone NOT NULL,
	"table_number" text,
	"comment" text,
	"is_birthday" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"pin_hash" text NOT NULL,
	"role" text DEFAULT 'waiter' NOT NULL,
	"zone" text,
	"tables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" uuid NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ingredient_id" uuid NOT NULL,
	"delta" double precision NOT NULL,
	"reason" text DEFAULT 'manual' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "table_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_number" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"guests" integer,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"closed_by" text
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mime" text NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waiter_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_number" text NOT NULL,
	"type" text DEFAULT 'waiter' NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" text
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "name_tr" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "intro_tr" text;--> statement-breakpoint
ALTER TABLE "dish_variants" ADD COLUMN "label_tr" text;--> statement-breakpoint
ALTER TABLE "dish_variants" ADD COLUMN "stock_factor" double precision DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "dishes" ADD COLUMN "name_tr" text;--> statement-breakpoint
ALTER TABLE "dishes" ADD COLUMN "description_tr" text;--> statement-breakpoint
ALTER TABLE "dishes" ADD COLUMN "calories" integer;--> statement-breakpoint
ALTER TABLE "dishes" ADD COLUMN "allergens" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "dishes" ADD COLUMN "in_stock" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_birthday" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "served_by" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "drinks_ready" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "hookah_ready" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "food_ready" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cold_ready" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "meat_ready" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "ready_by" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "session_id" uuid;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "tagline_tr" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "address_tr" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "hours_tr" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "story_chapters" ADD COLUMN "title_tr" text;--> statement-breakpoint
ALTER TABLE "story_chapters" ADD COLUMN "body_tr" text;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_shifts" ADD CONSTRAINT "staff_shifts_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_spent_idx" ON "expenses" USING btree ("spent_at");--> statement-breakpoint
CREATE INDEX "football_starts_idx" ON "football_events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "football_pub_idx" ON "football_events" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "ingredients_name_idx" ON "ingredients" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "recipe_dish_ing_uidx" ON "recipe_items" USING btree ("dish_id","ingredient_id");--> statement-breakpoint
CREATE INDEX "recipe_dish_idx" ON "recipe_items" USING btree ("dish_id");--> statement-breakpoint
CREATE INDEX "reservations_status_idx" ON "reservations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reservations_date_idx" ON "reservations" USING btree ("reserved_at");--> statement-breakpoint
CREATE INDEX "shifts_emp_idx" ON "shifts" USING btree ("employee_id","started_at");--> statement-breakpoint
CREATE UNIQUE INDEX "shifts_open_uidx" ON "shifts" USING btree ("employee_id") WHERE "shifts"."ended_at" is null;--> statement-breakpoint
CREATE INDEX "staff_active_idx" ON "staff" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "staff_shifts_staff_idx" ON "staff_shifts" USING btree ("staff_id","opened_at");--> statement-breakpoint
CREATE INDEX "staff_shifts_open_idx" ON "staff_shifts" USING btree ("opened_at");--> statement-breakpoint
CREATE INDEX "stock_mov_ing_idx" ON "stock_movements" USING btree ("ingredient_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "table_sessions_open_uidx" ON "table_sessions" USING btree ("table_number") WHERE "table_sessions"."status" = 'open';--> statement-breakpoint
CREATE INDEX "waiter_calls_status_idx" ON "waiter_calls" USING btree ("status");--> statement-breakpoint
CREATE INDEX "waiter_calls_created_idx" ON "waiter_calls" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_session_id_table_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."table_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_session_idx" ON "orders" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idem_uidx" ON "orders" USING btree ("idempotency_key") WHERE "orders"."idempotency_key" is not null;