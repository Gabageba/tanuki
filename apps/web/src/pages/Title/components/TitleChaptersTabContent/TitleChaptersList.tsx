import { Card, Center, Group, Loader, Stack, Tabs } from '@mantine/core';
import { useSearchParams } from 'react-router';
import {
  CHAPTER_NUMBERING,
  SORT_DIRECTION,
  SortDirectionSchema,
  type Branch,
} from '@tanuki/contracts';
import useChapters from '@/entities/title/hooks/useChapters';
import useReadingProgress from '@/entities/title/hooks/useReadingProgress';
import useUpdateReadingProgress from '@/entities/title/hooks/useUpdateReadingProgress';
import LinkedReadingMarkNote from '@/entities/title/LinkedReadingMarkNote';
import {
  getUnplacedLinkedProgress,
  resolveLinkedMarks,
  resolveOwnMark,
} from '@/entities/title/readingProgress';
import ChaptersList from '@/shared/ui/ChaptersList';
import TitleChaptersSettings from './TitleChaptersSettings';

type Props = {
  titleId: string;
  branch: Branch;
};

function TitleChaptersList({ titleId, branch }: Props) {
  const [searchParams] = useSearchParams();
  const { data: chaptersData, isPending: isChaptersPending } = useChapters({
    titleId,
    branch: branch.id,
  });
  const { data: progress } = useReadingProgress({ titleId });
  const { mutate: updateProgress } = useUpdateReadingProgress({ titleId });

  const parsedDirection = SortDirectionSchema.safeParse(searchParams.get('direction'));
  const direction = parsedDirection.success ? parsedDirection.data : SORT_DIRECTION.DESC;

  const chapters =
    direction === SORT_DIRECTION.ASC
      ? [...(chaptersData?.items ?? [])].reverse()
      : (chaptersData?.items ?? []);
  const numbering = chaptersData?.numbering ?? CHAPTER_NUMBERING.GLOBAL;
  const unplacedLinked = getUnplacedLinkedProgress(progress, chapters, branch.id);

  if (isChaptersPending) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  return (
    <Tabs.Panel value={branch.id}>
      <Stack gap="xs">
        <Group gap={8}>
          {unplacedLinked.map((item) => (
            <LinkedReadingMarkNote key={item.sourceId} progress={item} />
          ))}
        </Group>

        <Card withBorder padding={0} bg="transparent">
          <Card.Section withBorder px="sm" py="xs">
            <TitleChaptersSettings />
          </Card.Section>
          <ChaptersList
            chapters={chapters}
            numbering={numbering}
            titleId={titleId}
            mah="70vh"
            showDate
            direction={direction}
            ownMark={resolveOwnMark(progress, chapters, numbering)}
            linkedMarks={resolveLinkedMarks(progress, chapters, branch.id)}
            onMarkChapter={(chapter) =>
              updateProgress({ chapterId: chapter.id, pageIndex: 0, chapter })
            }
          />
        </Card>
      </Stack>
    </Tabs.Panel>
  );
}

export default TitleChaptersList;
