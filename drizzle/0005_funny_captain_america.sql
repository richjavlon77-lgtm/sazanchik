CREATE TABLE "delivery_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"items" text NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rating" integer NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"guest_name" text,
	"table_number" text,
	"dish_slug" text,
	"dish_name" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rating_range" CHECK ("reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "tg_carts" (
	"chat_id" text PRIMARY KEY NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tg_dialogs" (
	"chat_id" text PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tg_invites" (
	"code" text PRIMARY KEY NOT NULL,
	"role" text NOT NULL,
	"created_by" text NOT NULL,
	"used_by" text,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tg_users" (
	"chat_id" text PRIMARY KEY NOT NULL,
	"username" text,
	"name" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'guest' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "delivery_status_idx" ON "delivery_requests" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "reviews_pub_idx" ON "reviews" USING btree ("is_published","created_at");--> statement-breakpoint
CREATE INDEX "reviews_dish_idx" ON "reviews" USING btree ("dish_slug");--> statement-breakpoint
CREATE INDEX "tg_invites_used_idx" ON "tg_invites" USING btree ("used_by");--> statement-breakpoint
CREATE INDEX "tg_users_role_idx" ON "tg_users" USING btree ("role");