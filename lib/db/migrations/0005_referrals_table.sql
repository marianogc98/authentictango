CREATE TABLE IF NOT EXISTS "referrals" (
	"code" text PRIMARY KEY NOT NULL,
	"percent_usd" integer DEFAULT 0 NOT NULL,
	"percent_ars" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
INSERT INTO "referrals" ("code", "percent_usd", "percent_ars") VALUES ('lautaro.melcom', 10, 10) ON CONFLICT DO NOTHING;
