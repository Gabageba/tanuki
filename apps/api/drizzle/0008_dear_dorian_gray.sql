-- DEFAULT здесь только чтобы заполнить уже существующие строки значением из
-- DEFAULT_READER_SETTINGS.chapterGap (@tanuki/contracts) — сразу после этого он снимается: колонку
-- всегда пишет приложение, значения по умолчанию на стороне БД у этой таблицы нет.
ALTER TABLE "reader_settings" ADD COLUMN "chapter_gap" integer DEFAULT 64 NOT NULL;--> statement-breakpoint
ALTER TABLE "reader_settings" ALTER COLUMN "chapter_gap" DROP DEFAULT;
