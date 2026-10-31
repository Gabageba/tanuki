import { Stack, Text } from '@mantine/core';
import {
  BOOKMARK_FORMS,
  CHAPTER_FORMS,
  FOLDER_FORMS,
  MARK_FORMS,
  TITLE_FORMS,
  formatCountWord,
  pluralize,
} from '../lib';
import type { RestoreResult } from '../models';

type Props = {
  result: RestoreResult;
};

const joinList = (parts: (string | false)[]) => parts.filter(Boolean).join(', ');

/** D2 — одна главная фраза о добавленном и пояснения только о том, что пошло не так, как в копии. */
function DoneShort({ result }: Props) {
  const added = joinList([
    result.bookmarksAdded > 0 && formatCountWord(result.bookmarksAdded, BOOKMARK_FORMS),
    result.foldersCreated > 0 && formatCountWord(result.foldersCreated, FOLDER_FORMS),
    result.progressAdded > 0 &&
      `${formatCountWord(result.progressAdded, MARK_FORMS)} «где остановился»`,
    result.chapterReadsAdded > 0 &&
      `${formatCountWord(result.chapterReadsAdded, CHAPTER_FORMS)} в статистику`,
  ]);
  const skippedBookmarks = result.skipped.reduce((total, { bookmarks }) => total + bookmarks, 0);
  const notes = [
    result.bookmarksMoved > 0 &&
      `${formatCountWord(result.bookmarksMoved, TITLE_FORMS)} ${pluralize(result.bookmarksMoved, { one: 'перенесён', few: 'перенесены', many: 'перенесены' })} в папки из копии.`,
    result.progressUpdated > 0 &&
      `${formatCountWord(result.progressUpdated, MARK_FORMS)} «где остановился» ${pluralize(result.progressUpdated, { one: 'обновлена', few: 'обновлены', many: 'обновлено' })}.`,
    result.settingsApplied && 'Настройки применены из копии.',
    result.foldersOverLimit > 0 &&
      `${formatCountWord(result.foldersOverLimit, FOLDER_FORMS)} не ${pluralize(result.foldersOverLimit, { one: 'поместилась', few: 'поместились', many: 'поместились' })} в лимит — их тайтлы в «В планах».`,
    skippedBookmarks > 0 &&
      `Пропущено ${formatCountWord(skippedBookmarks, BOOKMARK_FORMS)} — источников нет на этом инстансе.`,
  ].filter(Boolean);

  return (
    <Stack gap={6}>
      <Text fz="sm">
        {added ? `Добавлено ${added}.` : 'Ничего нового — всё из копии уже было.'}
      </Text>
      {notes.map((note) => (
        <Text key={String(note)} c="dimmed" fz={13}>
          {note}
        </Text>
      ))}
    </Stack>
  );
}

export default DoneShort;
