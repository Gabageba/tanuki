import { Flex, Group, SimpleGrid } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Title } from '@tanuki/contracts';
import TitleScore from './TitleScore';
import TitleMetaItem from './TitleMetaItem';
import { getLabelByTitleType } from '@/entities/source/lib';
import OtherItemsTag from '@/shared/ui/OtherItemsTag';
import TitleState from '@/entities/title/TitleState';
import useDateFormat from '@/shared/hooks/useDateFormat';
import { isEmpty } from '@/shared/lib/isEmpty';

type Props = {
  title: Title;
  branchesCount: number;
};

function TitleMeta({ title, branchesCount }: Props) {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  return (
    <Flex
      align="flex-start"
      gap={{ base: 'md', xs: 'lg' }}
      direction={{ base: 'column', xs: 'row' }}
    >
      <TitleScore rating={title.rating} likes={title.likes} />
      <SimpleGrid cols={{ base: 2, sm: 3 }} flex={1} w="100%">
        <TitleMetaItem
          value={[getLabelByTitleType(title.type, t), title.year].filter(
            (item): item is string | number => Boolean(item),
          )}
          label={t('typeAndYear')}
        />
        <TitleMetaItem
          value={
            isEmpty(title.releaseState) ? undefined : (
              <TitleState state={title.releaseState} fz={14} />
            )
          }
          label={t('original')}
        />

        <TitleMetaItem
          value={
            title.authors?.length ? (
              <Group gap={4}>
                {title.authors[0]}
                <OtherItemsTag count={title.authors.slice(1).length} />
              </Group>
            ) : null
          }
          label={t('author')}
        />
        <TitleMetaItem
          value={[
            isEmpty(title.translationState) ? undefined : (
              <TitleState key="title-state" state={title.translationState} fz={14} />
            ),
            t('countBranches', { count: branchesCount }),
          ]}
          label={t('translation')}
        />
        <TitleMetaItem
          value={
            title.pages
              ? t('countPages', { count: title.pages })
              : t('countChapters', { count: title.chaptersCount })
          }
          label={t('volume')}
        />
        <TitleMetaItem value={formatDate(title.lastUpdatedAt)} label={t('lastChapter')} />
      </SimpleGrid>
    </Flex>
  );
}

export default TitleMeta;
