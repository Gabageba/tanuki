CREATE TABLE "source_health" (
	"source_id" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"reason" text NOT NULL,
	"failed_probe_streak" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"checked_at" timestamp with time zone,
	"status_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
