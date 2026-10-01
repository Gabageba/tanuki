-- DEFAULT здесь только чтобы заполнить уже существующие строки значениями из
-- DEFAULT_READER_SETTINGS (@tanuki/contracts) — сразу после этого он снимается: колонки всегда
-- пишет приложение, значений по умолчанию на стороне БД у этой таблицы нет.
ALTER TABLE "reader_settings" ADD COLUMN "auto_next_chapter" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reader_settings" ALTER COLUMN "auto_next_chapter" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reader_settings" ADD COLUMN "hide_panels_on_scroll" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "reader_settings" ALTER COLUMN "hide_panels_on_scroll" DROP DEFAULT;
