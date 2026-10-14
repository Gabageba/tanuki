import { useMemo } from 'react';
import { Tabs } from '@mantine/core';
import { CheckCircleIcon, ClockIcon } from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { DOWNLOAD_STATUS } from '@/entities/download/models';
import {
  DOWNLOADS_TAB_SEARCH_PARAM,
  DOWNLOADS_TABS,
  DOWNLOADS_TITLE_SEARCH_PARAM,
  type DownloadsTab,
} from '@/shared/lib/routes';
import type { DownloadsData } from '../models';
import DownloadedTitles from './DownloadedTitles';
import DownloadsQueue from './DownloadsQueue';

type Props = {
  userId: string;
  data: DownloadsData;
};

const isDownloadsTab = (value: string | null): value is DownloadsTab =>
  Object.values(DOWNLOADS_TABS).some((tab) => tab === value);

/** Очередь и скачанное на разных вкладках (L4); без вкладки в адресе открывается та, где что-то есть. */
function DownloadsTabs({ userId, data }: Props) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get(DOWNLOADS_TAB_SEARCH_PARAM);
  const openedTitleId = searchParams.get(DOWNLOADS_TITLE_SEARCH_PARAM);

  const hasQueue = data.rows.some((row) => row.status !== DOWNLOAD_STATUS.DONE);
  const activeTab = isDownloadsTab(tabParam)
    ? tabParam
    : hasQueue
      ? DOWNLOADS_TABS.QUEUE
      : DOWNLOADS_TABS.DOWNLOADED;

  const handleTabChange = (value: string | null) => {
    if (!isDownloadsTab(value)) return;
    setSearchParams({ [DOWNLOADS_TAB_SEARCH_PARAM]: value }, { replace: true });
  };

  const TABS = useMemo(
    () => [
      {
        id: DOWNLOADS_TABS.QUEUE,
        title: t('queue'),
        icon: <ClockIcon />,
        content: <DownloadsQueue userId={userId} data={data} />,
      },
      {
        id: DOWNLOADS_TABS.DOWNLOADED,
        title: t('downloaded'),
        icon: <CheckCircleIcon />,
        content: <DownloadedTitles userId={userId} data={data} openedTitleId={openedTitleId} />,
      },
    ],
    [t, userId, data, openedTitleId],
  );

  return (
    <Tabs value={activeTab} onChange={handleTabChange}>
      <Tabs.List mb="md">
        {TABS.map(({ id, title, icon }) => (
          <Tabs.Tab key={id} value={id} leftSection={icon}>
            {title}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {TABS.map(({ id, content }) => (
        <Tabs.Panel key={id} value={id}>
          {content}
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}

export default DownloadsTabs;
