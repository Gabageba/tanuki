CREATE TABLE "user_title_snapshot_fallbacks" (
	"user_id" uuid NOT NULL,
	"title_key" text NOT NULL,
	"title_id" text,
	"name" text,
	"cover_url" text,
	"content_rating" text,
	"type" text,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "user_title_snapshot_fallbacks_user_id_title_key_pk" PRIMARY KEY("user_id","title_key")
);
--> statement-breakpoint
ALTER TABLE "title_chapter_snapshots" ALTER COLUMN "checked_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "title_chapter_snapshots" ALTER COLUMN "checked_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "title_chapter_snapshots" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "title_chapter_snapshots" ADD COLUMN "cover_url" text;--> statement-breakpoint
ALTER TABLE "title_chapter_snapshots" ADD COLUMN "content_rating" text;--> statement-breakpoint
ALTER TABLE "title_chapter_snapshots" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "title_chapter_snapshots" ADD COLUMN "metadata_origin" text;--> statement-breakpoint
ALTER TABLE "title_chapter_snapshots" ADD COLUMN "metadata_fetched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "title_chapter_snapshots" ADD COLUMN "chapters_initialized" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_title_snapshot_fallbacks" ADD CONSTRAINT "user_title_snapshot_fallbacks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Старые личные версии не имеют доказанного происхождения. Не публикуем их.
INSERT INTO user_title_snapshot_fallbacks
  (user_id, title_key, title_id, name, cover_url, content_rating, type, updated_at)
SELECT DISTINCT ON (user_id, title_key)
  user_id, title_key, title_id, name, cover_url, content_rating, type, updated_at
FROM (
  SELECT user_id, title_key, title_id, name, cover_url, content_rating, type, updated_at, 1 AS priority
  FROM bookmarks
  UNION ALL
  SELECT user_id, title_key, title_id, title_name, cover_url, content_rating, type, updated_at, 0
  FROM reading_progress
) versions
ORDER BY user_id, title_key,
  (title_id IS NOT NULL AND name IS NOT NULL) DESC, updated_at DESC, priority DESC;
--> statement-breakpoint
-- Известный ноль тоже свидетельствует о первом списке. Ошибка сама по себе — нет.
UPDATE title_chapter_snapshots s SET chapters_initialized =
  s.chapters_count IS NOT NULL OR EXISTS
    (SELECT 1 FROM title_chapters_seen c WHERE c.title_key = s.title_key);
--> statement-breakpoint
-- До удаления колонок каждый личный ключ должен иметь резерв, включая nullable старый прогресс.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM (SELECT user_id, title_key FROM bookmarks UNION SELECT user_id, title_key FROM reading_progress) r
    LEFT JOIN user_title_snapshot_fallbacks f USING (user_id, title_key)
    WHERE f.user_id IS NULL
  ) THEN RAISE EXCEPTION 'Incomplete title snapshot migration'; END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "bookmarks" DROP COLUMN "title_id";--> statement-breakpoint
ALTER TABLE "bookmarks" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "bookmarks" DROP COLUMN "cover_url";--> statement-breakpoint
ALTER TABLE "bookmarks" DROP COLUMN "content_rating";--> statement-breakpoint
ALTER TABLE "bookmarks" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "reading_progress" DROP COLUMN "title_id";--> statement-breakpoint
ALTER TABLE "reading_progress" DROP COLUMN "title_name";--> statement-breakpoint
ALTER TABLE "reading_progress" DROP COLUMN "cover_url";--> statement-breakpoint
ALTER TABLE "reading_progress" DROP COLUMN "content_rating";--> statement-breakpoint
ALTER TABLE "reading_progress" DROP COLUMN "type";