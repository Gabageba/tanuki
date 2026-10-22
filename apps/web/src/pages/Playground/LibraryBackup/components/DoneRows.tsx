import { Group, Stack, Text } from '@mantine/core';
import {
  BookmarksSimpleIcon,
  ChartBarIcon,
  FolderSimpleIcon,
  GearSixIcon,
  MapPinIcon,
  ProhibitIcon,
} from '@phosphor-icons/react';
import GroupedList from '@/shared/ui/GroupedList';
import {
  BOOKMARK_FORMS,
  CHAPTER_FORMS,
  MARK_FORMS,
  NBSP,
  formatCount,
  formatCountWord,
  joinParts,
  pluralize,
} from '../lib';
import type { RestoreResult } from '../models';
import NewCount from './NewCount';

type Props = {
  result: RestoreResult;
  /** D3 — под строкой «Пропущено» разбивка по источникам. */
  isBySource: boolean;
};

const sumSkipped = (result: RestoreResult, key: 'bookmarks' | 'progress' | 'chapterReads') =>
  result.skipped.reduce((total, source) => total + source[key], 0);

/** D1/D3 — итог теми же строками, что сводка, в прошедшем времени; пропущенное — своей строкой. */
function DoneRows({ result, isBySource }: Props) {
  const skippedBookmarks = sumSkipped(result, 'bookmarks');
  const skippedProgress = sumSkipped(result, 'progress');
  const skippedChapters = sumSkipped(result, 'chapterReads');

  return (
    <GroupedList label="Что изменилось">
      <GroupedList.Row
        icon={<BookmarksSimpleIcon />}
        title="Закладки"
        isActionCompact
        action={<NewCount value={result.bookmarksAdded} />}
        description={joinParts([
          result.bookmarksMoved > 0 &&
            `${formatCount(result.bookmarksMoved)} ${pluralize(result.bookmarksMoved, { one: 'перенесена', few: 'перенесены', many: 'перенесены' })} в папки из копии`,
          result.titlesToPlanned > 0 &&
            `${formatCount(result.titlesToPlanned)} — в «В планах»: их папки не поместились`,
        ])}
      />
      <GroupedList.Row
        icon={<FolderSimpleIcon />}
        title="Папки"
        isActionCompact
        action={<NewCount value={result.foldersCreated} />}
        description={joinParts([
          result.foldersOverLimit > 0 &&
            `${formatCount(result.foldersOverLimit)} не ${pluralize(result.foldersOverLimit, { one: 'поместилась', few: 'поместились', many: 'поместились' })} в лимит`,
        ])}
      />
      <GroupedList.Row
        icon={<MapPinIcon />}
        title="Где остановился"
        isActionCompact
        action={<NewCount value={result.progressAdded} />}
        description={joinParts([
          result.progressUpdated > 0 &&
            `${formatCount(result.progressUpdated)} ${pluralize(result.progressUpdated, { one: 'обновлена', few: 'обновлены', many: 'обновлено' })}`,
        ])}
      />
      <GroupedList.Row
        icon={<ChartBarIcon />}
        title="Статистика"
        isActionCompact
        action={<NewCount value={result.chapterReadsAdded} unit="гл." />}
      />
      <GroupedList.Row
        icon={<GearSixIcon />}
        title="Настройки"
        description={result.settingsApplied ? 'Применены из копии' : 'Не менялись'}
      />
      {result.skipped.length > 0 && (
        <GroupedList.Row
          icon={<ProhibitIcon />}
          title="Пропущено — источников нет на этом инстансе"
          description={[
            skippedBookmarks > 0 && formatCountWord(skippedBookmarks, BOOKMARK_FORMS),
            skippedProgress > 0 && formatCountWord(skippedProgress, MARK_FORMS),
            skippedChapters > 0 && formatCountWord(skippedChapters, CHAPTER_FORMS),
          ]
            .filter(Boolean)
            .join(', ')}
        >
          {isBySource && (
            <Stack gap={6}>
              {result.skipped.map(({ sourceId, bookmarks, progress, chapterReads }) => (
                <Group key={sourceId} justify="space-between" gap="xs" wrap="nowrap">
                  <Text fz="sm" ff="monospace">
                    {sourceId}
                  </Text>
                  <Text fz={12} c="dimmed" ff="monospace" ta="right">
                    {joinParts([
                      bookmarks > 0 && `${formatCount(bookmarks)}${NBSP}закл.`,
                      progress > 0 && `${formatCount(progress)}${NBSP}отм.`,
                      chapterReads > 0 && `${formatCount(chapterReads)}${NBSP}гл.`,
                    ])}
                  </Text>
                </Group>
              ))}
            </Stack>
          )}
        </GroupedList.Row>
      )}
    </GroupedList>
  );
}

export default DoneRows;
