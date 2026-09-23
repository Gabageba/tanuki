CREATE TABLE "reader_settings" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"reading_mode" text NOT NULL,
	"page_fit" text NOT NULL,
	"container_width" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reader_settings" ADD CONSTRAINT "reader_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;