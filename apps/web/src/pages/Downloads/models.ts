import type { ChapterSnapshotRow, DownloadRow, TitleSnapshotRow } from '@/entities/download/models';

/** Всё, что видно на «Загрузках», одним чтением базы. */
export type DownloadsData = {
  rows: DownloadRow[];
  titles: ReadonlyMap<string, TitleSnapshotRow>;
  chapters: ReadonlyMap<string, ChapterSnapshotRow>;
  isPaused: boolean;
};

/** Строка очереди или скачанного: запись и снимки, из которых берутся названия. */
export type DownloadItem = {
  row: DownloadRow;
  title: TitleSnapshotRow | undefined;
  chapter: ChapterSnapshotRow | undefined;
};

export type DownloadedChapter = DownloadItem & {
  /** Главы уже нет ни в одном сохранённом списке глав тайтла. */
  isMissingAtSource: boolean;
};

export type DownloadedTitle = {
  titleId: string;
  snapshot: TitleSnapshotRow | undefined;
  chapters: DownloadedChapter[];
  bytes: number;
};
