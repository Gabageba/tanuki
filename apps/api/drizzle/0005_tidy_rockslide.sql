-- DEFAULT здесь только чтобы заполнить уже существующие строки значением из
-- DEFAULT_READER_SETTINGS.tapZoneWidth (@tanuki/contracts) — сразу после этого он снимается:
-- колонку всегда пишет приложение, значения по умолчанию на стороне БД у этой таблицы нет.
ALTER TABLE "reader_settings" ADD COLUMN "tap_zone_width" integer DEFAULT 33 NOT NULL;--> statement-breakpoint
ALTER TABLE "reader_settings" ALTER COLUMN "tap_zone_width" DROP DEFAULT;
