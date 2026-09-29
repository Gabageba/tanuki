-- Аккаунт LibSocial теперь один на всю сеть. Старые строки по сайтам зашифрованы под свой
-- source_id и в одну не сливаются — их аккаунты привязываются заново.
DELETE FROM "source_accounts" WHERE "family" = 'libsocial';--> statement-breakpoint
ALTER TABLE "source_accounts" DROP CONSTRAINT "source_accounts_user_id_family_source_id_pk";--> statement-breakpoint
ALTER TABLE "source_accounts" ADD CONSTRAINT "source_accounts_user_id_family_pk" PRIMARY KEY("user_id","family");--> statement-breakpoint
ALTER TABLE "source_accounts" DROP COLUMN "source_id";