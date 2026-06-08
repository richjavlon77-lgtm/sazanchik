CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_uz" text NOT NULL,
	"name_en" text NOT NULL,
	"intro_ru" text,
	"intro_uz" text,
	"intro_en" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dish_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dish_id" uuid NOT NULL,
	"label_ru" text NOT NULL,
	"label_uz" text NOT NULL,
	"label_en" text NOT NULL,
	"price" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name_ru" text NOT NULL,
	"name_uz" text NOT NULL,
	"name_en" text NOT NULL,
	"description_ru" text,
	"description_uz" text,
	"description_en" text,
	"price" integer,
	"image_url" text,
	"weight" text,
	"spicy" integer,
	"diet" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags_ru" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags_uz" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tags_en" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "spicy_range" CHECK ("dishes"."spicy" is null or "dishes"."spicy" between 1 and 3)
);
--> statement-breakpoint
CREATE TABLE "restaurant" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"name" text DEFAULT 'Сазанчик CITY' NOT NULL,
	"tagline_ru" text DEFAULT '' NOT NULL,
	"tagline_uz" text DEFAULT '' NOT NULL,
	"tagline_en" text DEFAULT '' NOT NULL,
	"address_ru" text DEFAULT '' NOT NULL,
	"address_uz" text DEFAULT '' NOT NULL,
	"address_en" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"hours_ru" text DEFAULT '' NOT NULL,
	"hours_uz" text DEFAULT '' NOT NULL,
	"hours_en" text DEFAULT '' NOT NULL,
	"instagram" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "single_row" CHECK ("restaurant"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "story_chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title_ru" text NOT NULL,
	"title_uz" text NOT NULL,
	"title_en" text NOT NULL,
	"body_ru" text NOT NULL,
	"body_uz" text NOT NULL,
	"body_en" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dish_variants" ADD CONSTRAINT "dish_variants_dish_id_dishes_id_fk" FOREIGN KEY ("dish_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dishes" ADD CONSTRAINT "dishes_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_uidx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_sort_idx" ON "categories" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "categories_published_idx" ON "categories" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "variants_dish_idx" ON "dish_variants" USING btree ("dish_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "dishes_slug_uidx" ON "dishes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "dishes_category_idx" ON "dishes" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "dishes_sort_idx" ON "dishes" USING btree ("category_id","sort_order");--> statement-breakpoint
CREATE INDEX "dishes_published_idx" ON "dishes" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "story_sort_idx" ON "story_chapters" USING btree ("sort_order");