import { Center, Grid, Group, Skeleton, Stack } from '@mantine/core';
import styles from '../../Title.module.scss';

function TitleImageSectionSkeleton() {
  return (
    <Grid.Col span={{ base: 12, md: 3 }}>
      <Stack gap={16}>
        <Center py={{ base: 'xl', md: 0 }} className={styles.imageBackground}>
          <Skeleton className={styles.coverSkeleton} />
        </Center>

        <Stack gap={8}>
          <Skeleton h={36} />
          <Group gap={8}>
            <Skeleton h={5} flex={1} />
            <Skeleton h={18.59} w={45} />
          </Group>
          <Group gap={8}>
            <Skeleton h={36} flex={1} />
            <Skeleton h={36} w={36} />
          </Group>
          <Skeleton h={20.59} />
        </Stack>
      </Stack>
    </Grid.Col>
  );
}

export default TitleImageSectionSkeleton;
