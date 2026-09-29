CREATE TABLE "source_accounts" (
	"user_id" uuid NOT NULL,
	"family" text NOT NULL,
	"source_id" text DEFAULT '' NOT NULL,
	"status" text NOT NULL,
	"login" text,
	"encrypted_password" text,
	"encrypted_state" text NOT NULL,
	"linked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_accounts_user_id_family_source_id_pk" PRIMARY KEY("user_id","family","source_id")
);
--> statement-breakpoint
ALTER TABLE "source_accounts" ADD CONSTRAINT "source_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;