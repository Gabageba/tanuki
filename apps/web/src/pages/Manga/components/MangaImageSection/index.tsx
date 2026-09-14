import {
  ActionIcon,
  Alert,
  Button,
  Center,
  Grid,
  Group,
  Image,
  Progress,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import {
  ArrowsClockwiseIcon,
  BookmarkSimpleIcon,
  DotsThreeIcon,
  HardDrivesIcon,
  ShareNetworkIcon,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/shared/ui/PageLayout';
import type { MangaDetailsQuery } from '../../models';
import MangaImageSectionSkeleton from './MangaImageSectionSkeleton';
import MidDot from '@/shared/ui/MidDot';
import MidDotGroup from '@/shared/ui/MidDotGroup';

function MangaImageSection() {
  const { t } = useTranslation();
  const { data, isFetching } = PageLayout.useQuery<MangaDetailsQuery>();

  if (isFetching) {
    return <MangaImageSectionSkeleton />;
  }

  if (!data) {
    return null;
  }

  const { manga } = data;

  return (
    <Grid.Col span={3}>
      <Stack gap={16}>
        <Image src={manga.largeCoverUrl || manga.coverUrl} alt={manga.title} radius="md" />
        <Stack gap={8}>
          <Button>
            {t('continue')} <MidDot /> {t('chapterNumberAbbrev', { number: 97 })}
          </Button>
          <Group gap={8}>
            <Progress value={30} size="sm" flex={1} />
            <Text fz={12} c="terracotta">
              97 / 214
            </Text>
          </Group>
          <Select
            data={[t('reading')]}
            value={t('reading')}
            c="terracotta"
            leftSection={
              <Center c="terracotta">
                <BookmarkSimpleIcon weight="fill" size={14} />
              </Center>
            }
          />
          <Group gap={8}>
            <Button leftSection={<ArrowsClockwiseIcon />} variant="default" flex={1}>
              {t('update')}
            </Button>
            <ActionIcon size={36} variant="default">
              <ShareNetworkIcon />
            </ActionIcon>
            <ActionIcon size={36} variant="default">
              <DotsThreeIcon />
            </ActionIcon>
          </Group>
        </Stack>
        <Alert variant="default" px={12} py={10}>
          <Group gap={8} c="dimmed">
            <HardDrivesIcon size={16} />
            <MidDotGroup
              separatorProps={{ c: 'dimmed', fz: 12 }}
              items={[
                <Text key="chapters" c="dimmed" fz={12}>
                  {t('downloaded')} {t('countChaptersAbbrev', { count: 42 })}
                </Text>,
                <Text key="size" c="dimmed" fz={12}>
                  1.8 {t('gb')}
                </Text>,
              ]}
            />
          </Group>
        </Alert>
      </Stack>
    </Grid.Col>
  );
}

export default MangaImageSection;
