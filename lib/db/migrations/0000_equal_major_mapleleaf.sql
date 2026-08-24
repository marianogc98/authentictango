CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"date" date NOT NULL,
	"time" time NOT NULL,
	"seats" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"provider" text,
	"provider_ref" text,
	"amount" integer,
	"currency" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	CONSTRAINT "bookings_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
CREATE TABLE "closed_dates" (
	"date" date PRIMARY KEY NOT NULL,
	"reason" text
);
--> statement-breakpoint
CREATE TABLE "date_slots" (
	"date" date NOT NULL,
	"time" time NOT NULL,
	"seats" integer NOT NULL,
	"price_usd" integer NOT NULL,
	"price_ars" integer NOT NULL,
	CONSTRAINT "date_slots_date_time_pk" PRIMARY KEY("date","time")
);
--> statement-breakpoint
CREATE TABLE "weekly_slots" (
	"weekday" integer NOT NULL,
	"time" time NOT NULL,
	"seats" integer DEFAULT 10 NOT NULL,
	"price_usd" integer DEFAULT 0 NOT NULL,
	"price_ars" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "weekly_slots_weekday_time_pk" PRIMARY KEY("weekday","time")
);
--> statement-breakpoint
CREATE INDEX "bookings_slot_idx" ON "bookings" USING btree ("date","time");--> statement-breakpoint
CREATE INDEX "bookings_status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_provider_ref_idx" ON "bookings" USING btree ("provider","provider_ref");