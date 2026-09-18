import { Grid, Stack } from '@mantine/core';
import TitleNameSkeleton from '../TitleName/TitleNameSkeleton';
import TitleMetaSkeleton from '../TitleMeta/TitleMetaSkeleton';
import TitleContentSkeleton from '../TitleContent/TitleContentSkeleton';

function TitleDetailsSectionSkeleton() {
  return (
    <Grid.Col span="auto" miw={0}>
      <Stack gap="lg">
        <TitleNameSkeleton />
        <TitleMetaSkeleton />
        <TitleContentSkeleton />
      </Stack>
    </Grid.Col>
  );
}

export default TitleDetailsSectionSkeleton;
