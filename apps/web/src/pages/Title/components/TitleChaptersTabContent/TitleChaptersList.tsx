import { Tabs } from '@mantine/core';
import type { Branch } from '@tanuki/contracts';
import useChapters from '@/entities/title/hooks/useChapters';
import QueryBlock from '@/shared/ui/QueryBlock';
import TitleBranchChapters from './TitleBranchChapters';
import TitleChaptersListSkeleton from './TitleChaptersListSkeleton';

type Props = {
  titleId: string;
  branch: Branch;
};

function TitleChaptersList({ titleId, branch }: Props) {
  const chaptersQuery = useChapters({
    titleId,
    branch: branch.id,
  });

  return (
    <Tabs.Panel value={branch.id}>
      <QueryBlock query={chaptersQuery} skeleton={<TitleChaptersListSkeleton />}>
        {(data) => <TitleBranchChapters titleId={titleId} branch={branch} data={data} />}
      </QueryBlock>
    </Tabs.Panel>
  );
}

export default TitleChaptersList;
