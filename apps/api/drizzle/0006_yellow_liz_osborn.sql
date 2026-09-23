-- DEFAULT здесь только чтобы заполнить уже существующие строки значением из
-- DEFAULT_READER_SETTINGS.pageGap (@tanuki/contracts) — сразу после этого он снимается: колонку
-- всегда пишет приложение, значения по умолчанию на стороне БД у этой таблицы нет.
ALTER TABLE "reader_settings" ADD COLUMN "page_gap" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "reader_settings" ALTER COLUMN "page_gap" DROP DEFAULT;
