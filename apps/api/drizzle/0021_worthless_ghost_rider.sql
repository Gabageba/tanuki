ALTER TABLE "users" ADD COLUMN "blocked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "blocked_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "block_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
-- Давность входа до этой миграции знали только живые сессии — берём самую свежую из них.
UPDATE "users" SET "last_seen_at" = "latest"."last_seen_at"
FROM (SELECT "user_id", max("last_seen_at") AS "last_seen_at" FROM "sessions" GROUP BY "user_id") AS "latest"
WHERE "latest"."user_id" = "users"."id";
