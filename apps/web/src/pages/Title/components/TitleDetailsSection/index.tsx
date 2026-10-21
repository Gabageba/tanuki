import { Grid, Stack } from '@mantine/core';
import PageLayout from '@/shared/ui/PageLayout';
import type { TitleDetailsQuery } from '../../models';
import TitleName from '../TitleName';
import TitleMeta from '../TitleMeta';
import TitleContent from '../TitleContent';

function TitleDetailsSection() {
  const { data } = PageLayout.useQuery<TitleDetailsQuery>();

  if (!data) {
    return null;
  }

  return (
    <Grid.Col span="auto" miw={0}>
      <Stack gap="lg">
        <TitleName title={data.title} />
        <TitleMeta title={data.title} branchesCount={data.branches.length} />
        <TitleContent title={data.title} branches={data.branches} />
      </Stack>
    </Grid.Col>
  );
}

export default TitleDetailsSection;
