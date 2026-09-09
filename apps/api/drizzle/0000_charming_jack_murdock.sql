CREATE TABLE "manga_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"a_id" text NOT NULL,
	"b_id" text NOT NULL,
	"a_title" text NOT NULL,
	"b_title" text NOT NULL,
	"verdict" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "manga_links_pair_idx" ON "manga_links" USING btree ("a_id","b_id");--> statement-breakpoint
CREATE INDEX "manga_links_a_idx" ON "manga_links" USING btree ("a_id");--> statement-breakpoint
CREATE INDEX "manga_links_b_idx" ON "manga_links" USING btree ("b_id");