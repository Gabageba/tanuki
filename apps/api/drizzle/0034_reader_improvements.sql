ALTER TABLE "reader_settings" ADD COLUMN "direction" text DEFAULT 'ltr' NOT NULL;--> statement-breakpoint
ALTER TABLE "reader_settings" ADD COLUMN "page_layout" text DEFAULT 'single' NOT NULL;--> statement-breakpoint
ALTER TABLE "reader_settings" ADD COLUMN "background" text DEFAULT 'black' NOT NULL;--> statement-breakpoint
ALTER TABLE "reader_settings" ADD COLUMN "brightness" integer DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "reader_settings" ADD COLUMN "prefetch_pages" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "reader_settings" ADD COLUMN "keep_screen_on" boolean DEFAULT false NOT NULL;