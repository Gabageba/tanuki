import { Stack, Text } from '@mantine/core';
import {
  BOOKMARK_FORMS,
  CHAPTER_FORMS,
  FOLDER_FORMS,
  MARK_FORMS,
  formatCount,
  formatCountWord,
  pluralize,
} from '../lib';
import type { BackupPreview } from '../models';

type Props = {
  preview: BackupPreview;
};

const joinList = (parts: (string | false)[]) => parts.filter(Boolean).join(', ');

/** S3 — две-три фразы: что добавится (главная), что уже есть и что пропущено (пояснения). */
function SummaryText({ preview }: Props) {
  const { bookmarks, folders, progress, chapterReads } = preview;
  const added = joinList([
    bookmarks.added > 0 && formatCountWord(bookmarks.added, BOOKMARK_FORMS),
    folders.added > 0 && formatCountWord(folders.added, FOLDER_FORMS),
    progress.added > 0 && `${formatCountWord(progress.added, MARK_FORMS)} «где остановился»`,
    chapterReads > 0 && `${formatCountWord(chapterReads, CHAPTER_FORMS)} в статистику`,
  ]);
  const existingBookmarks = bookmarks.sameFolder + bookmarks.otherFolder;
  const existing = joinList([
    existingBookmarks > 0 &&
      `${formatCountWord(existingBookmarks, BOOKMARK_FORMS)}${bookmarks.otherFolder > 0 ? ` (${formatCount(bookmarks.otherFolder)} — в другой папке)` : ''}`,
    folders.matched > 0 && formatCountWord(folders.matched, FOLDER_FORMS),
    progress.differs > 0 &&
      `${formatCountWord(progress.differs, MARK_FORMS)} ${pluralize(progress.differs, { one: 'расходится', few: 'расходятся', many: 'расходятся' })} с вашими`,
  ]);
  const skipped = [
    bookmarks.skipped > 0 &&
      `Пропущено ${formatCountWord(bookmarks.skipped, BOOKMARK_FORMS)} — источников нет на этом инстансе.`,
    folders.overLimit > 0 &&
      `${formatCountWord(folders.overLimit, FOLDER_FORMS)} не ${pluralize(folders.overLimit, { one: 'поместится', few: 'поместятся', many: 'поместятся' })} в лимит — их тайтлы лягут в «В планах».`,
  ].filter(Boolean);

  return (
    <Stack gap={6}>
      {added && <Text fz="sm">Добавится {added}.</Text>}
      {existing && (
        <Text c="dimmed" fz={13}>
          Уже есть: {existing}.
        </Text>
      )}
      {skipped.map((line) => (
        <Text key={String(line)} c="dimmed" fz={13}>
          {line}
        </Text>
      ))}
    </Stack>
  );
}

export default SummaryText;
