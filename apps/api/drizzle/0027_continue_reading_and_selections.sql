ALTER TABLE "reading_progress" ADD COLUMN "title_id" text;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD COLUMN "title_name" text;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD COLUMN "cover_url" text;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD COLUMN "content_rating" text;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD COLUMN "type" text;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD COLUMN "hidden_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "selections_disabled_sources" text[];--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "selections_disabled_sections" text[];--> statement-breakpoint
CREATE INDEX "reading_progress_user_updated_at_idx" ON "reading_progress" USING btree ("user_id","updated_at" DESC NULLS LAST);