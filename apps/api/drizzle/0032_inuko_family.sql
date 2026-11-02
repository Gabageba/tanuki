-- Семейство аккаунта Inkstory стало семейством всей сети inuko (Inkstory, PureManga).
-- Если пользователь уже привязал inuko, сохраняем новую привязку вместо старой inkstory.
DELETE FROM "source_accounts" AS legacy
WHERE legacy."family" = 'inkstory'
  AND EXISTS (
    SELECT 1 FROM "source_accounts" AS current
    WHERE current."user_id" = legacy."user_id" AND current."family" = 'inuko'
  );--> statement-breakpoint
UPDATE "source_accounts" SET "family" = 'inuko' WHERE "family" = 'inkstory';
