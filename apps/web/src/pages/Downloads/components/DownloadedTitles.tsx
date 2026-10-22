import { Accordion, EmptyState, Group, Stack } from '@mantine/core';
import { CheckCircleIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { deleteDownloads } from '@/entities/download/queue';
import { flattenSources } from '@/entities/source/lib';
import useSources from '@/entities/source/hooks/useSources';
import { getDownloadedTitles } from '../lib';
import type { DownloadsData } from '../models';
import DownloadedChapterRow from './DownloadedChapterRow';
import DownloadedHeader from './DownloadedHeader';
import DownloadedTitleHeading from './DownloadedTitleHeading';
import DownloadedTitleMenu from './DownloadedTitleMenu';
import styles from '../Downloads.module.scss';

type Props = {
  userId: string;
  data: DownloadsData;
  /** Раскрытый тайтл — при переходе с карточки на странице тайтла. */
  openedTitleId: string | null;
};

/** Вкладка «Скачанное» (L1): тайтлы строками, каждая раскрывается в свои главы на месте. */
function DownloadedTitles({ userId, data, openedTitleId }: Props) {
  const { t } = useTranslation();
  const { data: sources } = useSources();
  const titles = getDownloadedTitles(data);

  if (titles.length === 0) {
    return (
      <EmptyState
        title={t('nothingDownloaded')}
        description={t('queuedChaptersAppearOnceDownloaded')}
        icon={<CheckCircleIcon />}
      />
    );
  }

  const sourceList = flattenSources(sources);
  const getSourceName = (sourceId: string | undefined) =>
    sourceList.find((source) => source.id === sourceId)?.title;

  return (
    <Stack gap="sm">
      <DownloadedHeader bytes={titles.reduce((sum, title) => sum + title.bytes, 0)} />
      <Accordion
        variant="contained"
        radius="md"
        chevronPosition="left"
        defaultValue={openedTitleId}
        classNames={{ item: styles.titleItem, content: styles.titleContent }}
      >
        {titles.map((title) => (
          <Accordion.Item key={title.titleId} value={title.titleId}>
            <Group gap={4} wrap="nowrap" pr="xs" className={styles.titleHeader}>
              <Accordion.Control miw={0} flex={1} className={styles.titleControl}>
                <DownloadedTitleHeading
                  title={title}
                  sourceName={getSourceName(title.snapshot?.sourceId)}
                />
              </Accordion.Control>
              <DownloadedTitleMenu
                titleId={title.titleId}
                name={title.snapshot?.details.title.name ?? ''}
              />
            </Group>
            <Accordion.Panel>
              <Stack gap={0}>
                {title.chapters.map((item) => (
                  <DownloadedChapterRow
                    key={item.row.chapterId}
                    item={item}
                    onDelete={() => void deleteDownloads(userId, [item.row.chapterId])}
                  />
                ))}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
    </Stack>
  );
}

export default DownloadedTitles;
