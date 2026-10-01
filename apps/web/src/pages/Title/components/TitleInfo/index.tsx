import { Divider, SimpleGrid, Stack, Text, Title as Heading } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Title } from '@tanuki/contracts';
import { getLabelByContentRating, getLabelByTitleType } from '@/entities/source/lib';
import { isEmpty } from '@/shared/lib/isEmpty';
import MidDotGroup from '@/shared/ui/MidDotGroup';
import TitleState from '@/entities/title/TitleState';
import useDateFormat from '@/shared/hooks/useDateFormat';
import TitleInfoItems from './TitleInfoItems';
import type { TitleInfoItem } from '../../models';

type InfoData = {
  label: string;
  items: TitleInfoItem[];
};

type Props = {
  title: Title;
};

const formatNumber = (value: number | null, locale: string) =>
  value === null ? null : new Intl.NumberFormat(locale).format(value);

function TitleInfo({ title }: Props) {
  const { t, i18n } = useTranslation();
  const { formatDate } = useDateFormat();

  const infoData: InfoData[] = [
    {
      label: t('general'),
      items: [
        {
          label: t('type'),
          value: getLabelByTitleType(title.type, t),
        },
        {
          label: t('ageRating'),
          value: getLabelByContentRating(title.contentRating),
        },
        {
          label: t('country'),
          value: title.country,
        },
        {
          label: t('series'),
          value: isEmpty(title.series) ? undefined : (
            <MidDotGroup items={title.series} text={{ lh: 1.2 }} />
          ),
        },
      ],
    },
    {
      label: t('titles'),
      items: [
        {
          label: t('title'),
          value: title.name,
        },
        {
          label: t('originalNeuter'),
          value: isEmpty(title.originalNames) ? undefined : (
            <MidDotGroup items={title.originalNames} text={{ lh: 1.2 }} />
          ),
        },
        {
          label: t('alternative'),
          value: isEmpty(title.altNames) ? undefined : (
            <MidDotGroup items={title.altNames} text={{ lh: 1.2 }} />
          ),
        },
      ],
    },
    {
      label: t('authorsAndPublishers'),
      items: [
        {
          label: t('authors'),
          value: isEmpty(title.authors) ? undefined : (
            <MidDotGroup items={title.authors} text={{ lh: 1.2 }} />
          ),
        },
        {
          label: t('artist'),
          value: isEmpty(title.artists) ? undefined : (
            <MidDotGroup items={title.artists} text={{ lh: 1.2 }} />
          ),
        },
        {
          label: t('publisher'),
          value: isEmpty(title.publishers) ? undefined : (
            <MidDotGroup items={title.publishers} text={{ lh: 1.2 }} />
          ),
        },
        {
          label: t('magazine'),
          value: isEmpty(title.magazines) ? undefined : (
            <MidDotGroup items={title.magazines} text={{ lh: 1.2 }} />
          ),
        },
      ],
    },
    {
      label: t('ratings'),
      items: [
        {
          label: t('score'),
          value: title.rating,
          isNumeric: true,
        },
        {
          label: t('votesCount'),
          value: formatNumber(title.votesCount, i18n.language),
          isNumeric: true,
        },
        {
          label: t('likesCount'),
          value: formatNumber(title.likes, i18n.language),
          isNumeric: true,
        },
        {
          label: t('viewsCount'),
          value: formatNumber(title.views, i18n.language),
          isNumeric: true,
        },
      ],
    },
    {
      label: t('translation'),
      items: [
        {
          label: t('status'),
          value: isEmpty(title.translationState) ? undefined : (
            <TitleState state={title.translationState} fz={14} />
          ),
        },
        {
          label: title.pages ? t('pagesCount') : t('chaptersCount'),
          value: formatNumber(title.pages ?? title.chaptersCount, i18n.language),
          isNumeric: true,
        },
        {
          label: t('lastChapter'),
          value: formatDate(title.lastUpdatedAt),
        },
        {
          label: t('translators'),
          value: isEmpty(title.translators) ? undefined : (
            <MidDotGroup items={title.translators} text={{ lh: 1.2 }} />
          ),
        },
      ],
    },
    {
      label: t('original'),
      items: [
        {
          label: t('status'),
          value: isEmpty(title.releaseState) ? undefined : (
            <TitleState state={title.releaseState} fz={14} />
          ),
        },
        {
          label: t('publicationDate'),
          value: formatDate(title.releaseDate) ?? title.year,
        },
        {
          label: t('releaseFormat'),
          value: isEmpty(title.releaseFormats) ? undefined : (
            <MidDotGroup items={title.releaseFormats} text={{ lh: 1.2 }} />
          ),
        },
        {
          label: t('addedDate'),
          value: formatDate(title.addedAt),
        },
      ],
    },
  ];

  return (
    <Stack gap="md">
      <Heading order={5}>{t('titleData')}</Heading>
      <SimpleGrid cols={{ base: 2, xs: 3 }} spacing="lg">
        {infoData.map((block, index) => (
          <Stack key={index} gap="sm">
            <Text c="dimmed" lh="tight" fz={12} tt="uppercase" lts={1}>
              {block.label}
            </Text>
            <Divider />
            <TitleInfoItems items={block.items} />
          </Stack>
        ))}
      </SimpleGrid>
    </Stack>
  );
}

export default TitleInfo;
