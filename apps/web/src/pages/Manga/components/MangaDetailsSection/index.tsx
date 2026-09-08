import { Grid, Stack } from '@mantine/core';
import PageLayout from '@/shared/ui/PageLayout';
import type { MangaDetailsQuery } from '../../models';
import MangaTitle from '../MangaTitle';
import MangaMeta from '../MangaMeta';
import MangaContent from '../MangaContent';

function MangaDetailsSection() {
  const { data, isFetching } = PageLayout.useQuery<MangaDetailsQuery>();

  if (isFetching) {
    return 'loading';
  }

  if (!data) {
    return null;
  }

  return (
    <Grid.Col span="auto">
      <Stack gap="xl">
        <MangaTitle manga={data.manga} />
        <MangaMeta manga={data.manga} branchesCount={data.branches.length} />
        <MangaContent manga={data.manga} />
      </Stack>
    </Grid.Col>
  );
}

export default MangaDetailsSection;
