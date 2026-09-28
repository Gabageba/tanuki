CREATE TABLE "chapter_reads" (
	"user_id" uuid NOT NULL,
	"chapter_id" text NOT NULL,
	"source_id" text NOT NULL,
	"title_key" text NOT NULL,
	"chapter_volume" double precision,
	"chapter_number" double precision,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chapter_reads_user_id_chapter_id_pk" PRIMARY KEY("user_id","chapter_id")
);
--> statement-breakpoint
CREATE TABLE "reading_activity" (
	"user_id" uuid NOT NULL,
	"minute" timestamp with time zone NOT NULL,
	"seconds" smallint NOT NULL,
	CONSTRAINT "reading_activity_user_id_minute_pk" PRIMARY KEY("user_id","minute")
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "time_zone" text;--> statement-breakpoint
ALTER TABLE "chapter_reads" ADD CONSTRAINT "chapter_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_activity" ADD CONSTRAINT "reading_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chapter_reads_user_read_at_idx" ON "chapter_reads" USING btree ("user_id","read_at");