import type { chapterReads, readingActivity } from '../database/schema';

export type ChapterRead = Omit<typeof chapterReads.$inferSelect, 'userId'>;

export type ActivityMinute = Omit<typeof readingActivity.$inferSelect, 'userId'>;
