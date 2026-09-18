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

const formatNumber = (value: number | null, locale: string) =>
  value === null ? null : new Intl.NumberFormat(locale).format(value);

function MangaInfo({ manga }: Props) {
  const { t, i18n } = useTranslation();
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
          value: manga.country,
        },
      ],
    },
    {
      label: t('titles'),
      items: [
        {
          label: t('title'),
          value: manga.title,
        },
        {
          label: t('originalNeuter'),
          value: isEmpty(manga.originalTitle) ? undefined : (
            <MidDotGroup items={manga.originalTitle} text={{ lh: 1.2 }} />
          ),
        },
        {
          label: t('alternative'),
          value: isEmpty(manga.altTitles) ? undefined : (
            <MidDotGroup items={manga.altTitles} text={{ lh: 1.2 }} />
          ),
        },
      ],
    },
    {
      label: t('authorsAndPublishers'),
      items: [
        {
          label: t('authors'),
          value: isEmpty(manga.authors) ? undefined : (
            <MidDotGroup items={manga.authors} text={{ lh: 1.2 }} />
          ),
        },
        {
          label: t('artist'),
          value: isEmpty(manga.artists) ? undefined : (
            <MidDotGroup items={manga.artists} text={{ lh: 1.2 }} />
          ),
        },
        {
          label: t('publisher'),
          value: isEmpty(manga.publishers) ? undefined : (
            <MidDotGroup items={manga.publishers} text={{ lh: 1.2 }} />
          ),
        },
        {
          label: t('magazine'),
          value: isEmpty(manga.magazines) ? undefined : (
            <MidDotGroup items={manga.magazines} text={{ lh: 1.2 }} />
          ),
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
          value: formatNumber(manga.votesCount, i18n.language),
        },
        {
          label: t('likesCount'),
          value: formatNumber(manga.likes, i18n.language),
        },
        {
          label: t('viewsCount'),
          value: formatNumber(manga.views, i18n.language),
        },
      ],
    },
    {
      label: t('translation'),
      items: [
        {
          label: t('status'),
          value: isEmpty(manga.translationState) ? undefined : (
            <MangaState state={manga.translationState} fz={14} />
          ),
        },
        {
          label: manga.pages ? t('pagesCount') : t('chaptersCount'),
          value: formatNumber(manga.pages ?? manga.chaptersCount, i18n.language),
        },
        {
          label: t('lastChapter'),
          value: formatDate(manga.lastUpdatedAt),
        },
        {
          label: t('translators'),
          value: isEmpty(manga.translators) ? undefined : (
            <MidDotGroup items={manga.translators} text={{ lh: 1.2 }} />
          ),
        },
      ],
    },
    {
      label: t('original'),
      items: [
        {
          label: t('status'),
          value: isEmpty(manga.releaseState) ? undefined : (
            <MangaState state={manga.releaseState} fz={14} />
          ),
        },
        {
          label: t('publicationDate'),
          value: formatDate(manga.releaseDate) ?? manga.year,
        },
        {
          label: t('releaseFormat'),
          value: isEmpty(manga.releaseFormats) ? undefined : (
            <MidDotGroup items={manga.releaseFormats} text={{ lh: 1.2 }} />
          ),
        },
        {
          label: t('addedDate'),
          value: formatDate(manga.addedAt),
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
                  <DataList.ItemValue lh={1.2}>
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
