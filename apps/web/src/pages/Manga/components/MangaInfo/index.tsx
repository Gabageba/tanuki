import { DataList, Divider, SimpleGrid, Space, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import type { Manga } from '@tanuki/contracts';
import { getLabelByContentRating, getLabelByMangaType } from '@/entities/source/lib';
import { isEmpty } from '@/shared/lib/isEmpty';
import Mdash from '@/shared/ui/Mdash';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import MangaState from '@/entities/manga/MangaState';
import useDateFormat from '@/shared/hooks/useDateFormat';

type InfoData = {
  label: string;
  items: { label: string; value: ReactNode | undefined }[];
};

type Props = {
  manga: Manga;
};

function MangaInfo({ manga }: Props) {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  const infoData: InfoData[] = [
    {
      label: t('general'),
      items: [
        {
          label: t('type'),
          value: getLabelByMangaType(manga.type, t),
        },
        {
          label: t('ageRating'),
          value: getLabelByContentRating(manga.contentRating),
        },
        {
          label: t('country'),
          value: undefined,
        },
      ],
    },
    {
      label: t('titles'),
      items: [
        {
          label: t('russian'),
          value: manga.title,
        },
        {
          label: t('originalNeuter'),
          value: manga.originalTitle,
        },
        {
          label: t('alternative'),
          value: <MidDotGroup items={manga.altTitles} text={{ lh: 1 }} />,
        },
      ],
    },
    {
      label: t('authorsAndPublishers'),
      items: [
        { label: t('authors'), value: <MidDotGroup items={manga.authors} text={{ lh: 1 }} /> },
        {
          label: t('artist'),
          value: undefined,
        },
        {
          label: t('publisher'),
          value: undefined,
        },
        {
          label: t('magazine'),
          value: undefined,
        },
      ],
    },
    {
      label: t('ratings'),
      items: [
        {
          label: t('score'),
          value: manga.rating,
        },
        {
          label: t('votesCount'),
          value: manga.votesCount,
        },
        {
          label: t('likesCount'),
          value: manga.likes,
        },
        {
          label: t('viewsCount'),
          value: manga.views,
        },
      ],
    },
    {
      label: t('translation'),
      items: [
        {
          label: t('status'),
          value: <MangaState state={manga.translationState} />,
        },
        {
          label: t('chaptersCount'),
          value: manga.chaptersCount,
        },
        {
          label: t('lastChapter'),
          value: formatDate(manga.lastUpdatedAt),
        },
        {
          label: t('translators'),
          value: <MidDotGroup items={manga.translators} text={{ lh: 1 }} />,
        },
      ],
    },
    {
      label: t('original'),
      items: [
        {
          label: t('status'),
          value: <MangaState state={manga.releaseState} />,
        },
        {
          label: t('publicationDate'),
          value: formatDate(manga.releaseDate),
        },
        {
          label: t('releaseFormat'),
          value: undefined,
        },
        {
          label: t('addedDate'),
          value: undefined,
        },
      ],
    },
  ];

  return (
    <Stack gap="md">
      <Title order={5}>{t('titleData')}</Title>
      <SimpleGrid cols={{ base: 2, xs: 3 }} spacing="lg">
        {infoData.map((block, index) => (
          <Stack key={index} gap="sm">
            <Text c="dimmed" lh={1}>
              {block.label}
            </Text>
            <Divider />
            <DataList orientation="vertical">
              {block.items.map((item, index) => (
                <DataList.Item key={index}>
                  <DataList.ItemLabel fz={12} lh={1}>
                    {item.label}
                  </DataList.ItemLabel>
                  <Space h={8} />
                  <DataList.ItemValue lh={1}>
                    {isEmpty(item.value) ? <Mdash /> : item.value}
                  </DataList.ItemValue>
                </DataList.Item>
              ))}
            </DataList>
          </Stack>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default MangaInfo;
