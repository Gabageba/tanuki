CREATE TABLE "search_history" (
	"user_id" uuid NOT NULL,
	"query" text NOT NULL,
	"normalized_query" text NOT NULL,
	"searched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "search_history_user_id_normalized_query_pk" PRIMARY KEY("user_id","normalized_query")
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "save_search_history" boolean;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "search_history_user_searched_at_idx" ON "search_history" USING btree ("user_id","searched_at" DESC NULLS LAST);