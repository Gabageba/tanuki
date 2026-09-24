CREATE TABLE "reading_progress" (
	"user_id" uuid NOT NULL,
	"title_key" text NOT NULL,
	"source_id" text NOT NULL,
	"chapter_id" text NOT NULL,
	"chapter_volume" double precision,
	"chapter_number" double precision,
	"chapter_title" text,
	"branch_id" text NOT NULL,
	"page_index" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_progress_user_id_title_key_pk" PRIMARY KEY("user_id","title_key")
);
--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;