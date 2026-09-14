import { Grid, Stack } from '@mantine/core';
import PageLayout from '@/shared/ui/PageLayout';
import type { MangaDetailsQuery } from '../../models';
import MangaTitle from '../MangaTitle';
import MangaMeta from '../MangaMeta';
import MangaContent from '../MangaContent';
import MangaDetailsSectionSkeleton from './MangaDetailsSectionSkeleton';

function MangaDetailsSection() {
  const { data, isFetching } = PageLayout.useQuery<MangaDetailsQuery>();

  if (isFetching) {
    return <MangaDetailsSectionSkeleton />;
  }

  if (!data) {
    return null;
  }

  return (
    <Grid.Col span="auto" miw={0}>
      <Stack gap="lg">
        <MangaTitle manga={data.manga} />
        <MangaMeta manga={data.manga} branchesCount={data.branches.length} />
        <MangaContent manga={data.manga} branches={data.branches} />
      </Stack>
    </Grid.Col>
  );
}

export default MangaDetailsSection;
