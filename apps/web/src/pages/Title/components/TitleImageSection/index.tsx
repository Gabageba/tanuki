import { useState } from 'react';
import { Box, Center, Grid, Group, Image, Overlay, Stack } from '@mantine/core';
import FolderPickerSelect from '@/features/bookmark/FolderPickerSelect';
import CoverImage from '@/shared/ui/CoverImage';
import PageLayout from '@/shared/ui/PageLayout';
import type { TitleDetailsQuery } from '../../models';
import TitleDownloadsCard from './TitleDownloadsCard';
import TitleMoreMenu from './TitleMoreMenu';
import TitleReadingActions from './TitleReadingActions';
import styles from '../../Title.module.scss';

function TitleImageSection() {
  const { data } = PageLayout.useQuery<TitleDetailsQuery>();
  const [isBackgroundLoaded, setIsBackgroundLoaded] = useState(false);

  if (!data) {
    return null;
  }

  const { title } = data;
  const coverImg = title.largeCoverUrl || title.coverUrl;

  return (
    <Grid.Col span={{ base: 12, md: 3 }}>
      <Stack gap={16}>
        <Box pos="relative" py={{ base: 'xl', md: 0 }} className={styles.imageBackground}>
          <Box pos="absolute" inset={0} className={styles.imageWrapper} hiddenFrom="md">
            <Image
              src={coverImg}
              w="100%"
              h="100%"
              fit="cover"
              style={isBackgroundLoaded ? undefined : { visibility: 'hidden' }}
              onLoad={() => setIsBackgroundLoaded(true)}
            />
            {isBackgroundLoaded && <Overlay zIndex={0} blur={20} opacity={30} />}
            <Box
              pos="absolute"
              bottom={0}
              left={0}
              right={0}
              h={180}
              className={styles.imageFade}
            />
          </Box>
          <Center pos="relative">
            <CoverImage src={coverImg} alt={title.name} fit="contain" className={styles.cover} />
          </Center>
        </Box>
        <Stack gap={8}>
          <TitleReadingActions titleId={title.id} />
          <Group gap={8}>
            <FolderPickerSelect titleId={title.id} />
            <TitleMoreMenu titleId={title.id} name={title.name} />
          </Group>
          <TitleDownloadsCard titleId={title.id} />
        </Stack>
      </Stack>
    </Grid.Col>
  );
}

export default TitleImageSection;
