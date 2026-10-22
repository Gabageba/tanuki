import { getOfflineDb } from '@/entities/download/db';
import { QUEUE_STATE_ID } from '@/entities/download/models';
import { CURRENT_USER } from './fixtures';
import type { OfflineDbSeed } from './models';

/** База скачанного зрителя перед каждой историей: пустая или из `parameters.offlineDb`. Без сброса
 *  очередь одной истории всплывала бы в другой. У Storybook свой origin — база приложения не задета. */
export const seedOfflineDb = async (seed: OfflineDbSeed | undefined) => {
  const db = getOfflineDb(CURRENT_USER.id);
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
    if (!seed) return;
    await Promise.all([
      db.downloads.bulkAdd(seed.downloads),
      db.chapters.bulkAdd(seed.chapters),
      db.titles.bulkAdd(seed.titles),
      db.queue.put({ id: QUEUE_STATE_ID, isPaused: seed.isPaused }),
    ]);
  });
};
