import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_disease_types" ALTER COLUMN "value" SET DATA TYPE text;

  -- Remap any obsolete categories to 'general'
  UPDATE "pages_disease_types"
  SET "value" = 'general'
  WHERE "value" NOT IN ('general', 'diabetes', 'sleep_apnea', 'depression', 'metabolic_syndrome', 'eoss');

  -- Delete duplicates if a page already had 'general'
  DELETE FROM "pages_disease_types" a
  USING "pages_disease_types" b
  WHERE a.id > b.id AND a.parent_id = b.parent_id AND a.value = b.value;

  DROP TYPE "public"."enum_pages_disease_types";
  CREATE TYPE "public"."enum_pages_disease_types" AS ENUM('general', 'diabetes', 'sleep_apnea', 'depression', 'metabolic_syndrome', 'eoss');
  ALTER TABLE "pages_disease_types" ALTER COLUMN "value" SET DATA TYPE "public"."enum_pages_disease_types" USING "value"::"public"."enum_pages_disease_types";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_disease_types" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_pages_disease_types";
  CREATE TYPE "public"."enum_pages_disease_types" AS ENUM('cardiovascular', 'respiratory', 'diabetes', 'oncology', 'neurology');
  ALTER TABLE "pages_disease_types" ALTER COLUMN "value" SET DATA TYPE "public"."enum_pages_disease_types" USING "value"::"public"."enum_pages_disease_types";`)
}
