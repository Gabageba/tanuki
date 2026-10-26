CREATE TABLE "source_import_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"import_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"title_key" text NOT NULL,
	"title_id" text NOT NULL,
	"chapter_number" double precision NOT NULL,
	"progress_policy" text NOT NULL,
	"status" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "source_import_progress" ADD CONSTRAINT "source_import_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_import_progress" ADD CONSTRAINT "source_import_progress_user_id_title_key_bookmarks_user_id_title_key_fk" FOREIGN KEY ("user_id","title_key") REFERENCES "public"."bookmarks"("user_id","title_key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "source_import_progress_due_idx" ON "source_import_progress" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "source_import_progress_import_idx" ON "source_import_progress" USING btree ("import_id");