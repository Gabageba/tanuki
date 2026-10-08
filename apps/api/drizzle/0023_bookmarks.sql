CREATE TABLE "bookmark_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"built_in" text,
	"name" text,
	"icon" text,
	"color" text,
	"position" integer NOT NULL,
	"track_updates" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"user_id" uuid NOT NULL,
	"title_key" text NOT NULL,
	"source_id" text NOT NULL,
	"title_id" text NOT NULL,
	"folder_id" uuid NOT NULL,
	"name" text NOT NULL,
	"cover_url" text,
	"content_rating" text NOT NULL,
	"type" text,
	"visited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmarks_user_id_title_key_pk" PRIMARY KEY("user_id","title_key")
);
--> statement-breakpoint
CREATE TABLE "title_chapter_snapshots" (
	"title_key" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"title_id" text NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_error" text,
	"missing" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "title_chapters_seen" (
	"title_key" text NOT NULL,
	"chapter_id" text NOT NULL,
	"branch_id" text NOT NULL,
	"chapter_volume" double precision,
	"chapter_number" double precision,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"baseline" boolean NOT NULL,
	CONSTRAINT "title_chapters_seen_title_key_chapter_id_pk" PRIMARY KEY("title_key","chapter_id")
);
--> statement-breakpoint
ALTER TABLE "bookmark_folders" ADD CONSTRAINT "bookmark_folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_folder_id_bookmark_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."bookmark_folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookmark_folders_user_built_in_idx" ON "bookmark_folders" USING btree ("user_id","built_in");--> statement-breakpoint
CREATE UNIQUE INDEX "bookmark_folders_user_name_lower_idx" ON "bookmark_folders" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX "bookmarks_user_folder_idx" ON "bookmarks" USING btree ("user_id","folder_id");--> statement-breakpoint
CREATE INDEX "title_chapters_seen_key_branch_idx" ON "title_chapters_seen" USING btree ("title_key","branch_id");