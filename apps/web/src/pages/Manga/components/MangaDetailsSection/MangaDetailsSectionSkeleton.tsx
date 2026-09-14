import { Grid, Stack } from '@mantine/core';
import MangaTitleSkeleton from '../MangaTitle/MangaTitleSkeleton';
import MangaMetaSkeleton from '../MangaMeta/MangaMetaSkeleton';
import MangaContentSkeleton from '../MangaContent/MangaContentSkeleton';

function MangaDetailsSectionSkeleton() {
  return (
    <Grid.Col span="auto" miw={0}>
      <Stack gap="lg">
        <MangaTitleSkeleton />
        <MangaMetaSkeleton />
        <MangaContentSkeleton />
      </Stack>
    </Grid.Col>
  );
}

export default MangaDetailsSectionSkeleton;
