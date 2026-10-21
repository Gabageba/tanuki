import { useState } from 'react';
import {
  ActionIcon,
  Alert,
  Box,
  Center,
  Grid,
  Group,
  Image,
  Menu,
  Overlay,
  Stack,
} from '@mantine/core';
import {
  ArrowsClockwiseIcon,
  DotsThreeIcon,
  HardDrivesIcon,
  ShareNetworkIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import FolderPickerSelect from '@/features/bookmark/FolderPickerSelect';
import CoverImage from '@/shared/ui/CoverImage';
import PageLayout from '@/shared/ui/PageLayout';
import type { TitleDetailsQuery } from '../../models';
import TitleReadingActions from './TitleReadingActions';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import styles from '../../Title.module.scss';

function TitleImageSection() {
  const { t } = useTranslation();
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
            <Menu>
              <Menu.Target>
                <ActionIcon size={36} variant="default">
                  <DotsThreeIcon />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<ArrowsClockwiseIcon />}>{t('update')}</Menu.Item>
                <Menu.Item leftSection={<ShareNetworkIcon />}>{t('share')}</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
          <Alert variant="transparent" px={10} py={0}>
            <Group gap={8} c="dimmed">
              <HardDrivesIcon size={16} />
              <MidDotGroup
                separatorProps={{ c: 'dimmed', fz: 12 }}
                text={{
                  c: 'dimmed',
                  fz: 12,
                }}
                items={[t('downloadedChaptersAbbrev', { count: 42 }), t('sizeGb', { size: 1.8 })]}
              />
            </Group>
          </Alert>
        </Stack>
      </Stack>
    </Grid.Col>
  );
}

export default TitleImageSection;
