ALTER TABLE "manga_links" RENAME TO "title_links";--> statement-breakpoint
ALTER TABLE "title_links" RENAME COLUMN "a_title" TO "a_name";--> statement-breakpoint
ALTER TABLE "title_links" RENAME COLUMN "b_title" TO "b_name";--> statement-breakpoint
ALTER INDEX "manga_links_pair_idx" RENAME TO "title_links_pair_idx";--> statement-breakpoint
ALTER INDEX "manga_links_a_idx" RENAME TO "title_links_a_idx";--> statement-breakpoint
ALTER INDEX "manga_links_b_idx" RENAME TO "title_links_b_idx";
