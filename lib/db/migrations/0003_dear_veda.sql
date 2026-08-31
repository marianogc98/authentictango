ALTER TABLE "bookings" ADD COLUMN "with_class" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "date_slots" ADD COLUMN "class_price_usd" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "date_slots" ADD COLUMN "class_price_ars" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "weekly_slots" ADD COLUMN "class_price_usd" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "weekly_slots" ADD COLUMN "class_price_ars" integer DEFAULT 0 NOT NULL;