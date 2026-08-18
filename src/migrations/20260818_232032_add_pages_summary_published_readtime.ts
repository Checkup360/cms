import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "summary" varchar;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "published_at" timestamp(3) with time zone;
  ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "read_time" numeric;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "summary";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "published_at";
  ALTER TABLE "pages" DROP COLUMN IF EXISTS "read_time";
  `)
}
