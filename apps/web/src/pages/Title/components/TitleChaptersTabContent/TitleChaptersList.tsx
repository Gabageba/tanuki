import { Card, Center, Loader, Tabs } from '@mantine/core';
import { useSearchParams } from 'react-router';
import { SORT_DIRECTION, SortDirectionSchema, type Branch } from '@tanuki/contracts';
import useChapters from '@/entities/title/hooks/useChapters';
import ChaptersList from '@/shared/ui/ChaptersList';

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

  const parsedDirection = SortDirectionSchema.safeParse(searchParams.get('direction'));
  const direction = parsedDirection.success ? parsedDirection.data : SORT_DIRECTION.DESC;

  const chapters =
    direction === SORT_DIRECTION.ASC
      ? [...(chaptersData?.items ?? [])].reverse()
      : (chaptersData?.items ?? []);

  if (isChaptersPending) {
    return (
      <Center>
        <Loader />
      </Center>
    );
  }

  return (
    <Tabs.Panel value={branch.id}>
      <Card withBorder p={0} bg="transparent">
        <ChaptersList chapters={chapters} titleId={titleId} mah="70vh" showDate />
      </Card>
    </Tabs.Panel>
  );
}

export default TitleChaptersList;
