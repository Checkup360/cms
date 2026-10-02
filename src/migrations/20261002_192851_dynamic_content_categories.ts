import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Page categories stop being a fixed enum: they become health topic keys owned
// by the backend catalog, stored as a hasMany text field (`pages_texts`).
// Existing tags are copied before the old table is dropped, so no data is lost.
// Also catches up Media `alt` becoming optional in code (bcf0f11) without a
// migration: the column was still NOT NULL.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );

  INSERT INTO "pages_texts" ("order", "parent_id", "path", "text")
  SELECT "order", "parent_id", 'diseaseTypes', "value"::text
  FROM "pages_disease_types"
  WHERE "value" IS NOT NULL;

  DROP TABLE "pages_disease_types" CASCADE;
  ALTER TABLE "pages_texts" ADD CONSTRAINT "pages_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_texts_order_parent" ON "pages_texts" USING btree ("order","parent_id");
  DROP TYPE "public"."enum_pages_disease_types";
  ALTER TABLE "media" ALTER COLUMN "alt" DROP NOT NULL;`)
}

// Categories outside the previous enum (e.g. 'cardiovascular' or any topic
// added later) cannot be represented there, so they are mapped to 'general'
// and deduplicated. Media without alt text get their filename.
export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_disease_types" AS ENUM('general', 'diabetes', 'sleep_apnea', 'depression', 'metabolic_syndrome', 'eoss');
  CREATE TABLE "pages_disease_types" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_pages_disease_types",
  	"id" serial PRIMARY KEY NOT NULL
  );

  INSERT INTO "pages_disease_types" ("order", "parent_id", "value")
  SELECT MIN("order"), "parent_id", "category"::"public"."enum_pages_disease_types"
  FROM (
    SELECT "order", "parent_id",
      CASE
        WHEN "text" IN ('general', 'diabetes', 'sleep_apnea', 'depression', 'metabolic_syndrome', 'eoss')
        THEN "text"
        ELSE 'general'
      END AS "category"
    FROM "pages_texts"
    WHERE "path" = 'diseaseTypes' AND "text" IS NOT NULL
  ) AS "categories"
  GROUP BY "parent_id", "category";

  DROP TABLE "pages_texts" CASCADE;
  ALTER TABLE "pages_disease_types" ADD CONSTRAINT "pages_disease_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_disease_types_order_idx" ON "pages_disease_types" USING btree ("order");
  CREATE INDEX "pages_disease_types_parent_idx" ON "pages_disease_types" USING btree ("parent_id");
  UPDATE "media" SET "alt" = COALESCE("filename", '') WHERE "alt" IS NULL;
  ALTER TABLE "media" ALTER COLUMN "alt" SET NOT NULL;`)
}
