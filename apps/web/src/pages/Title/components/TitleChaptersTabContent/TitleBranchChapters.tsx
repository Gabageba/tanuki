import { Card, Group, Stack } from '@mantine/core';
import { useNetwork } from '@mantine/hooks';
import { useSearchParams } from 'react-router';
import {
  SORT_DIRECTION,
  SortDirectionSchema,
  type Branch,
  type ChaptersResponse,
} from '@tanuki/contracts';
import useReadingProgress from '@/entities/title/hooks/useReadingProgress';
import useUpdateReadingProgress from '@/entities/title/hooks/useUpdateReadingProgress';
import LinkedReadingMarkNote from '@/entities/title/LinkedReadingMarkNote';
import {
  getUnplacedLinkedProgress,
  resolveLinkedMarks,
  resolveOwnMark,
} from '@/entities/title/readingProgress';
import ChaptersList from '@/shared/ui/ChaptersList';
import useTitleDownloads from '@/entities/download/hooks/useTitleDownloads';
import { getUnavailableChapterIds } from '@/entities/download/lib';
import ChapterDownloadControl from '@/features/download/ChapterDownloadControl';
import useTitleBookmarkVisit from '../../hooks/useTitleBookmarkVisit';
import TitleChaptersSettings from './TitleChaptersSettings';

type Props = {
  titleId: string;
  branch: Branch;
  data: ChaptersResponse;
};

/** Загруженные главы ветки: отметки с других источников, которым нет места в списке, и сам список
 *  в выбранном порядке. */
function TitleBranchChapters({ titleId, branch, data }: Props) {
  const [searchParams] = useSearchParams();
  const { data: progress } = useReadingProgress({ titleId });
  const { mutate: updateProgress } = useUpdateReadingProgress({ titleId });
  const { data: newChapterIds } = useTitleBookmarkVisit(titleId);
  const downloads = useTitleDownloads(titleId);
  const { online } = useNetwork();

  const parsedDirection = SortDirectionSchema.safeParse(searchParams.get('direction'));
  const direction = parsedDirection.success ? parsedDirection.data : SORT_DIRECTION.DESC;

  const { numbering } = data;
  const chapters = direction === SORT_DIRECTION.ASC ? [...data.items].reverse() : data.items;
  const unplacedLinked = getUnplacedLinkedProgress(progress, chapters, branch.id);
  const ownMark = resolveOwnMark(progress, chapters, numbering);

  return (
    <Stack gap="xs">
      <Group gap={8}>
        {unplacedLinked.map((item) => (
          <LinkedReadingMarkNote key={item.sourceId} progress={item} />
        ))}
      </Group>

      <Card withBorder padding={0} bg="transparent">
        <Card.Section withBorder px="sm" py="xs">
          <TitleChaptersSettings
            download={{
              titleId,
              branchId: branch.id,
              chaptersList: data,
              downloads,
              ownChapterId: ownMark?.chapter.id,
            }}
          />
        </Card.Section>
        <ChaptersList
          chapters={chapters}
          numbering={numbering}
          titleId={titleId}
          mah="70vh"
          showDate
          direction={direction}
          ownMark={ownMark}
          linkedMarks={resolveLinkedMarks(progress, chapters, branch.id)}
          newChapterIds={newChapterIds}
          onMarkChapter={(chapter) =>
            updateProgress({ chapterId: chapter.id, pageIndex: 0, chapter })
          }
          unavailableChapterIds={online ? undefined : getUnavailableChapterIds(chapters, downloads)}
          getChapterAction={(chapter) => (
            <ChapterDownloadControl
              titleId={titleId}
              chapter={chapter}
              download={downloads?.get(chapter.id)}
              chaptersList={data}
              chaptersListKey={branch.id}
            />
          )}
        />
      </Card>
    </Stack>
  );
}

export default TitleBranchChapters;
