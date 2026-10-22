CREATE TABLE IF NOT EXISTS "gallery_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"src" text NOT NULL,
	"alt_es" text DEFAULT '' NOT NULL,
	"alt_en" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Las fotos que hasta ahora estaban fijas en el código, en el mismo orden. Sólo si la
-- tabla está vacía: si la migración se repite, no pisa lo que ella haya cambiado.
INSERT INTO "gallery_images" ("src", "alt_es", "alt_en", "position")
SELECT * FROM (VALUES
  ('/images/hero-tango.webp', 'Pareja bailando tango', 'Couple dancing tango', 1),
  ('/images/gallery-1.jpg', 'Pies de bailarines de tango', 'Feet of tango dancers', 2),
  ('/images/gallery-2.webp', 'Barrio San Telmo', 'San Telmo neighborhood', 3),
  ('/images/gallery-3.webp', 'Interior de milonga tradicional', 'Inside a traditional milonga', 4),
  ('/images/gallery-4.webp', 'Orquesta de tango en vivo', 'Live tango orchestra', 5),
  ('/images/gallery-5.webp', 'Barrio La Boca', 'La Boca neighborhood', 6)
) AS v ("src", "alt_es", "alt_en", "position")
WHERE NOT EXISTS (SELECT 1 FROM "gallery_images");
