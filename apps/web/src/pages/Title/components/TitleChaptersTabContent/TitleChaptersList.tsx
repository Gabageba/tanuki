import { Card, Center, EmptyState, Loader, Tabs } from '@mantine/core';
import { useSearchParams } from 'react-router';
import { EmptyIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { SORT_DIRECTION, SortDirectionSchema, type Branch } from '@tanuki/contracts';
import useChapters from '@/entities/title/hooks/useChapters';
import ChaptersList from '@/shared/ui/ChaptersList';

type Props = {
  titleId: string;
  branch: Branch;
};

function TitleChaptersList({ titleId, branch }: Props) {
  const { t } = useTranslation();
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

  if (chapters.length === 0) {
    return (
      <Tabs.Panel value={branch.id}>
        <Card withBorder p={0} bg="transparent">
          <EmptyState
            description={t('branchHasNoChaptersYet')}
            size="sm"
            icon={<EmptyIcon />}
            py="xs"
          />
        </Card>
      </Tabs.Panel>
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
