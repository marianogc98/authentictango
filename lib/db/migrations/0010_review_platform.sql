ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "platform" text DEFAULT 'airbnb' NOT NULL;
--> statement-breakpoint
-- Las que vinieron de Google en la migración 0006; el resto eran de Airbnb.
UPDATE "reviews" SET "platform" = 'google'
WHERE "name" IN ('Heidi bech Geschwendtner', 'Thomas Obel', 'Flor Arbiser', 'Lisa Bryzek', 'Tulip Order Office');
